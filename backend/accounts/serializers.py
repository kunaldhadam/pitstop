from django.utils import timezone
from rest_framework import serializers
from django.db import transaction

from .models import (
    IndividualProfile, 
    CustomUser,
    GarageOwnerProfile,
    BusinessPurpose,
    ProfileDetails,
    VerificationDocument,
)


class BusinessPurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessPurpose
        fields = ['id', 'name']
        
class GarageOwnerProfileSerializer(serializers.ModelSerializer):
    purposes = serializers.PrimaryKeyRelatedField(
        queryset=BusinessPurpose.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = GarageOwnerProfile
        fields = [
            'business_name',
            'purposes',
            'trade_license_number',
            'vat_gst_number',
            'profile_picture',
            'business_address',
            'operating_hours',
            'services_offered',
            'type_of_vehicles_serviced',
            'terms_and_conditions_accepted',
        ]

class IndividualProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndividualProfile
        fields = [
            'purpose',
            'preferred_location',
            'vehicle_make',
            'profile_picture',
            'terms_and_conditions_accepted',
            'terms_and_conditions_accepted_at',
        ]

        read_only_fields = [
            'terms_and_conditions_accepted_at',
        ]

class VerificationDocumentSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = VerificationDocument
        fields = ["id", "file", "name", "uploaded_at"]
        read_only_fields = fields

    def get_name(self, obj):
        return obj.file.name.rsplit("/", 1)[-1]


class ProfileDetailsSerializer(serializers.ModelSerializer):
    documents = VerificationDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = ProfileDetails
        fields = [
            "street_address",
            "date_of_birth",
            "gender",
            "facebook_url",
            "twitter_url",
            "kyc_status",
            "documents",
        ]
        read_only_fields = ["kyc_status", "documents"]


class UserSerializer(serializers.ModelSerializer):
    individual_profile = IndividualProfileSerializer(read_only=True)
    profile_details = serializers.SerializerMethodField()
    garage_owner_profile = GarageOwnerProfileSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "contact_person_name",
            "usertype",
            "date_joined",
            "individual_profile",
            "profile_details",
            "garage_owner_profile",
        ]

    def get_profile_details(self, obj):
        details, _ = ProfileDetails.objects.get_or_create(user=obj)
        return ProfileDetailsSerializer(details, context=self.context).data


class CurrentUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    username = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True, allow_null=True)
    preferred_location = serializers.CharField(max_length=100, required=False, allow_blank=True)
    street_address = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=ProfileDetails.GENDER_CHOICES,
        required=False,
        allow_blank=True,
    )
    facebook_url = serializers.URLField(required=False, allow_blank=True)
    twitter_url = serializers.URLField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False)
    remove_profile_picture = serializers.BooleanField(required=False, write_only=True)

    def validate_username(self, value):
        user = self.context["request"].user
        if CustomUser.objects.exclude(pk=user.pk).filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError("That username is already in use.")
        return value

class RegisterSerializer(serializers.ModelSerializer):

    individual_profile = IndividualProfileSerializer(
        write_only=True,
        required=False
    )

    garage_owner_profile = GarageOwnerProfileSerializer(
        write_only=True,
        required=False
    )

    class Meta:
        model = CustomUser

        fields = [
            'username',
            'email',
            'contact_person_name',
            'password',
            'phone_number',
            'usertype',
            'individual_profile',
            'garage_owner_profile',
        ]

        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }
        
    # def validate_email(self, value):
    #     if CustomUser.objects.filter(email__iexact=value).exists():
    #         raise serializers.ValidationError(
    #             "An account with this email already exists."
    #         )
    #     return value

    @transaction.atomic
    def create(self, validated_data):

        individual_data = validated_data.pop(
            'individual_profile',
            None
        )

        garage_owner_data = validated_data.pop(
            'garage_owner_profile',
            None
        )

        # Create User
        user = CustomUser.objects.create_user(
            **validated_data
        )

        # -------------------------
        # Individual
        # -------------------------

        if user.usertype == 'individual':

            if not individual_data:
                raise serializers.ValidationError({
                    'individual_profile':
                    'Individual profile data is required.'
                })

            if individual_data.get(
                'terms_and_conditions_accepted'
            ):
                individual_data[
                    'terms_and_conditions_accepted_at'
                ] = timezone.now()

            IndividualProfile.objects.create(
                user=user,
                **individual_data
            )

        # -------------------------
        # Garage Owner
        # -------------------------

        elif user.usertype == 'garage owner':

            if not garage_owner_data:
                raise serializers.ValidationError({
                    'garage_owner_profile':
                    'Garage owner profile data is required.'
                })

            purposes = garage_owner_data.pop(
                'purposes',
                []
            )

            if garage_owner_data.get(
                'terms_and_conditions_accepted'
            ):
                garage_owner_data[
                    'terms_and_conditions_accepted_at'
                ] = timezone.now()

            garage_profile = GarageOwnerProfile.objects.create(
                user=user,
                **garage_owner_data
            )

            # Many-to-Many must be assigned after creation
            garage_profile.purposes.set(purposes)

        return user