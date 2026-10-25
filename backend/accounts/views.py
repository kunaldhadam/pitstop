import json
import logging
import re
import secrets
from datetime import timedelta
from uuid import UUID

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone

from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from .models import (
    BusinessPurpose,
    CustomUser,
    EmailOTPVerification,
    GarageOwnerProfile,
    IndividualProfile,
    PhoneOTPVerification,
    ProfileDetails,
    VerificationDocument,
)
from .serializers import (
    BusinessPurposeSerializer,
    CurrentUserUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)
PHONE_NUMBER_PATTERN = re.compile(r"^[6-9]\d{9}$")


@api_view(["POST"])
@permission_classes([AllowAny])
def send_phone_otp(request):
    phone_number = str(request.data.get("phone_number", "")).strip()
    if not PHONE_NUMBER_PATTERN.fullmatch(phone_number):
        return Response(
            {"phone_number": "Enter a valid 10-digit phone number."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()
    if PhoneOTPVerification.objects.filter(
        phone_number=phone_number,
        created_at__gte=now - timedelta(seconds=settings.PHONE_OTP_RESEND_SECONDS),
    ).exists():
        return Response(
            {"detail": "Please wait before requesting another code."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if not settings.DEBUG and not all(
        (
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN,
            settings.TWILIO_FROM_NUMBER,
        )
    ):
        return Response(
            {"detail": "Phone verification is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    PhoneOTPVerification.objects.filter(
        phone_number=phone_number,
        expires_at__gt=now,
        verified_at__isnull=True,
    ).update(expires_at=now)

    otp = f"{secrets.randbelow(1_000_000):06d}"
    challenge = PhoneOTPVerification.objects.create(
        phone_number=phone_number,
        otp_hash=make_password(otp),
        expires_at=now + timedelta(seconds=settings.PHONE_OTP_TTL_SECONDS),
    )

    if settings.DEBUG:
        logger.info("Development phone OTP: %s", otp)
    else:
        try:
            from twilio.rest import Client

            country_code = settings.PHONE_OTP_COUNTRY_CODE
            if not country_code.startswith("+"):
                country_code = f"+{country_code}"
            Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN).messages.create(
                body=f"Your Pitstop verification code is {otp}.",
                from_=settings.TWILIO_FROM_NUMBER,
                to=f"{country_code}{phone_number}",
            )
        except Exception:
            challenge.delete()
            logger.exception("Unable to send phone verification SMS")
            return Response(
                {"detail": "Unable to send the verification code."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    return Response(
        {"challenge_id": str(challenge.pk)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_phone_otp(request):
    phone_number = str(request.data.get("phone_number", "")).strip()
    otp = str(request.data.get("otp", "")).strip()
    if not PHONE_NUMBER_PATTERN.fullmatch(phone_number) or not re.fullmatch(r"\d{6}", otp):
        return Response(
            {"detail": "Enter a valid phone number and 6-digit code."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        challenge_id = UUID(str(request.data.get("challenge_id")))
    except (TypeError, ValueError, AttributeError):
        return Response(
            {"detail": "This code is invalid or has expired."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        challenge = (
            PhoneOTPVerification.objects.select_for_update()
            .filter(pk=challenge_id, phone_number=phone_number)
            .first()
        )
        now = timezone.now()
        if (
            challenge is None
            or challenge.verified_at is not None
            or challenge.consumed_at is not None
            or challenge.expires_at <= now
            or challenge.attempts >= settings.PHONE_OTP_MAX_ATTEMPTS
        ):
            return Response(
                {"detail": "This code is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(otp, challenge.otp_hash):
            challenge.attempts += 1
            challenge.save(update_fields=["attempts"])
            return Response(
                {"detail": "This code is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification_token = secrets.token_urlsafe(32)
        challenge.verified_at = now
        challenge.verification_token_hash = make_password(verification_token)
        challenge.token_expires_at = now + timedelta(
            seconds=settings.PHONE_OTP_TOKEN_TTL_SECONDS
        )
        challenge.save(
            update_fields=[
                "verified_at",
                "verification_token_hash",
                "token_expires_at",
            ]
        )

    return Response({"verification_token": verification_token})


@api_view(["POST"])
@permission_classes([AllowAny])
def send_email_otp(request):
    email = str(request.data.get("email", "")).strip().lower()
    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {"email": "Enter a valid email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if CustomUser.objects.filter(email__iexact=email).exists():
        return Response(
            {"email": "An account with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()
    if EmailOTPVerification.objects.filter(
        email=email,
        created_at__gte=now - timedelta(seconds=settings.EMAIL_OTP_RESEND_SECONDS),
    ).exists():
        return Response(
            {"detail": "Please wait before requesting another code."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if not settings.DEBUG and (
        settings.EMAIL_BACKEND == "django.core.mail.backends.console.EmailBackend"
        or not settings.EMAIL_HOST
        or not settings.DEFAULT_FROM_EMAIL
    ):
        return Response(
            {"detail": "Email verification is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    EmailOTPVerification.objects.filter(
        email=email,
        expires_at__gt=now,
        verified_at__isnull=True,
    ).update(expires_at=now)

    otp = f"{secrets.randbelow(1_000_000):06d}"
    challenge = EmailOTPVerification.objects.create(
        email=email,
        otp_hash=make_password(otp),
        expires_at=now + timedelta(seconds=settings.EMAIL_OTP_TTL_SECONDS),
    )

    if settings.DEBUG:
        logger.info("Development email OTP: %s", otp)
    else:
        try:
            sent_count = send_mail(
                "Your Pitstop verification code",
                f"Your email verification code is {otp}. It expires in 5 minutes.",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            if not sent_count:
                raise RuntimeError("Email backend did not send the message")
        except Exception:
            challenge.delete()
            logger.exception("Unable to send email verification code")
            return Response(
                {"detail": "Unable to send the verification code."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    return Response(
        {"challenge_id": str(challenge.pk)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email_otp(request):
    email = str(request.data.get("email", "")).strip().lower()
    otp = str(request.data.get("otp", "")).strip()
    try:
        validate_email(email)
        challenge_id = UUID(str(request.data.get("challenge_id")))
    except (ValidationError, TypeError, ValueError, AttributeError):
        return Response(
            {"detail": "Enter a valid email address and 6-digit code."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not re.fullmatch(r"\d{6}", otp):
        return Response(
            {"detail": "Enter a valid email address and 6-digit code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        challenge = (
            EmailOTPVerification.objects.select_for_update()
            .filter(pk=challenge_id, email=email)
            .first()
        )
        now = timezone.now()
        if (
            challenge is None
            or challenge.verified_at is not None
            or challenge.consumed_at is not None
            or challenge.expires_at <= now
            or challenge.attempts >= settings.EMAIL_OTP_MAX_ATTEMPTS
        ):
            return Response(
                {"detail": "This code is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not check_password(otp, challenge.otp_hash):
            challenge.attempts += 1
            challenge.save(update_fields=["attempts"])
            return Response(
                {"detail": "This code is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification_token = secrets.token_urlsafe(32)
        challenge.verified_at = now
        challenge.verification_token_hash = make_password(verification_token)
        challenge.token_expires_at = now + timedelta(
            seconds=settings.EMAIL_OTP_TOKEN_TTL_SECONDS
        )
        challenge.save(
            update_fields=[
                "verified_at",
                "verification_token_hash",
                "token_expires_at",
            ]
        )

    return Response({"verification_token": verification_token})


@api_view(["GET"])
@permission_classes([AllowAny])
def check_username(request):
    username = request.query_params.get("username", "").strip()
    
    if not username:
        return Response({"error":"Username is required"}, status=400)
    
    exists = CustomUser.objects.filter(username=username).exists()
    
    return Response({"not_available" : exists})


    
class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # 1. Read the nested JSON object
        try:
            data = json.loads(request.data.get("data", "{}"))
        except json.JSONDecodeError:
            return Response(
                {"detail": "Invalid JSON data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            phone_challenge_id = UUID(
                str(data.pop("phone_verification_challenge_id", ""))
            )
        except (TypeError, ValueError, AttributeError):
            return Response(
                {"phone_number": ["Verify this phone number before registering."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        verification_token = data.pop("phone_verification_token", "")
        phone_number = data.get("phone_number", "")
        try:
            email_challenge_id = UUID(
                str(data.pop("email_verification_challenge_id", ""))
            )
        except (TypeError, ValueError, AttributeError):
            return Response(
                {"email": ["Verify this email address before registering."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        email_verification_token = data.pop("email_verification_token", "")
        email = str(data.get("email", "")).strip().lower()
        data["email"] = email

        with transaction.atomic():
            phone_challenge = (
                PhoneOTPVerification.objects.select_for_update()
                .filter(
                    pk=phone_challenge_id,
                    phone_number=phone_number,
                    verified_at__isnull=False,
                    consumed_at__isnull=True,
                    token_expires_at__gt=timezone.now(),
                )
                .first()
            )
            if (
                phone_challenge is None
                or not isinstance(verification_token, str)
                or not verification_token
                or not check_password(
                    verification_token, phone_challenge.verification_token_hash
                )
            ):
                return Response(
                    {"phone_number": ["Verify this phone number before registering."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email_challenge = (
                EmailOTPVerification.objects.select_for_update()
                .filter(
                    pk=email_challenge_id,
                    email=email,
                    verified_at__isnull=False,
                    consumed_at__isnull=True,
                    token_expires_at__gt=timezone.now(),
                )
                .first()
            )
            if (
                email_challenge is None
                or not isinstance(email_verification_token, str)
                or not email_verification_token
                or not check_password(
                    email_verification_token,
                    email_challenge.verification_token_hash,
                )
            ):
                return Response(
                    {"email": ["Verify this email address before registering."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Attach the uploaded image to the nested profile.
            if "individual_profile" in data:
                data["individual_profile"]["profile_picture"] = (
                    request.FILES.get("profile_picture")
                )

            if "garage_owner_profile" in data:
                data["garage_owner_profile"]["profile_picture"] = (
                    request.FILES.get("profile_picture")
                )

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            phone_challenge.consumed_at = timezone.now()
            phone_challenge.save(update_fields=["consumed_at"])
            email_challenge.consumed_at = timezone.now()
            email_challenge.save(update_fields=["consumed_at"])

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )
        
class BusinessPurposeListAPIView(generics.ListAPIView):
    serializer_class = BusinessPurposeSerializer
    permission_classes = [permissions.AllowAny]
    def get_queryset(self):
        return BusinessPurpose.objects.all()
    
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = CurrentUserUpdateSerializer(
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        user = request.user
        picture = values.pop("profile_picture", None)
        remove_picture = values.pop("remove_profile_picture", False)
        preferred_location = values.pop("preferred_location", None)
        detail_fields = {
            "street_address",
            "date_of_birth",
            "gender",
            "facebook_url",
            "twitter_url",
        }
        detail_values = {
            field: values.pop(field)
            for field in detail_fields
            if field in values
        }

        for field, value in values.items():
            setattr(user, field, value)
        if values:
            user.save(update_fields=list(values))

        if preferred_location is not None or picture is not None or remove_picture:
            individual_profile = getattr(user, "individual_profile", None)
            if individual_profile is None:
                individual_profile = IndividualProfile.objects.create(user=user)
            if preferred_location is not None:
                individual_profile.preferred_location = preferred_location
            if picture is not None or remove_picture:
                existing_picture = individual_profile.profile_picture
                individual_profile.profile_picture = None if remove_picture else picture
                individual_profile.save()
                if existing_picture:
                    old_name = existing_picture.name
                    transaction.on_commit(
                        lambda: existing_picture.storage.delete(old_name)
                    )
            else:
                individual_profile.save(update_fields=["preferred_location"])

        if detail_values:
            details, _ = ProfileDetails.objects.get_or_create(user=user)
            for field, value in detail_values.items():
                setattr(details, field, value)
            details.save(update_fields=list(detail_values))

        return Response(UserSerializer(user, context={"request": request}).data)


class VerificationDocumentsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    MAX_FILE_SIZE = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}

    def post(self, request):
        files = request.FILES.getlist("files")
        if not files:
            return Response(
                {"files": "Upload at least one verification document."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for file in files:
            extension = file.name.rpartition(".")[2].lower()
            if f".{extension}" not in self.ALLOWED_EXTENSIONS:
                return Response(
                    {"files": "Documents must be PDF, JPG, or PNG files."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if file.size > self.MAX_FILE_SIZE:
                return Response(
                    {"files": "Each document must be 10 MB or smaller."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        with transaction.atomic():
            details, _ = ProfileDetails.objects.get_or_create(user=request.user)
            for file in files:
                VerificationDocument.objects.create(profile=details, file=file)
            if details.kyc_status != "verified":
                details.kyc_status = "submitted"
                details.save(update_fields=["kyc_status"])

        return Response(
            UserSerializer(request.user, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )