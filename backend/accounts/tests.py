import json
from io import BytesIO
import tempfile
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from PIL import Image
from rest_framework.test import APITestCase

from .models import (
    EmailOTPVerification,
    PhoneOTPVerification,
    ProfileDetails,
    VerificationDocument,
)


# Create your tests here.
class CustomUserTests(TestCase):
    def test_create_user(self):
        User = get_user_model()
        user = User.objects.create_user(
            username='will', email='will@email.com', password='testpass123'
        )
        
        self.assertEqual(user.username, 'will')
        self.assertEqual(user.email, 'will@email.com')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        
    def test_create_superuser(self):
        User = get_user_model()
        admin_user = User.objects.create_superuser(
            username='siteadmin',
            email='siteadmin@email.com',
            password='siteadmin123',
        )
        self.assertEqual(admin_user.username, 'siteadmin')
        self.assertEqual(admin_user.email, 'siteadmin@email.com')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        
class SignUpPageTests(TestCase): # new
    username = "newuser"
    email = "newuser@email.com"
    
    def setUp(self):
        url = reverse("account_signup")
        self.response = self.client.get(url)
        
    def test_signup_template(self):
        self.assertEqual(self.response.status_code, 200)
        self.assertTemplateUsed(self.response, "account/signup.html")
        self.assertContains(self.response, "Sign Up")
        self.assertNotContains(self.response, "Hi there! I should not be on the page.")
        
    def test_signup_form(self):
        new_user = get_user_model().objects.create_user(self.username, self.email)
        self.assertEqual(get_user_model().objects.all().count(), 1)
        self.assertEqual(get_user_model().objects.all()[0].username, self.username)
        self.assertEqual(get_user_model().objects.all()[0].email, self.email)


@override_settings(DEBUG=True)
class PhoneOTPTests(TestCase):
    phone_number = "9876543210"

    @patch("accounts.views.secrets.randbelow", return_value=123456)
    def send_otp(self, _randbelow):
        with self.assertLogs("accounts.views", level="INFO") as logs:
            response = self.client.post(
                reverse("phone-send-otp"),
                {"phone_number": self.phone_number},
            )
        self.assertIn("123456", logs.output[0])
        self.assertNotIn("123456", response.content.decode())
        return response

    def test_send_and_verify_otp(self):
        send_response = self.send_otp()
        self.assertEqual(send_response.status_code, 201)

        verify_response = self.client.post(
            reverse("phone-verify-otp"),
            {
                "phone_number": self.phone_number,
                "challenge_id": send_response.json()["challenge_id"],
                "otp": "123456",
            },
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.json()["verification_token"])

    def test_registration_requires_phone_verification(self):
        response = self.client.post(
            reverse("register"),
            {"data": json.dumps({"phone_number": self.phone_number})},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("phone_number", response.json())
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_registration_consumes_verified_phone_token(self):
        send_response = self.send_otp()
        challenge_id = send_response.json()["challenge_id"]
        verify_response = self.client.post(
            reverse("phone-verify-otp"),
            {
                "phone_number": self.phone_number,
                "challenge_id": challenge_id,
                "otp": "123456",
            },
        )
        verification_token = verify_response.json()["verification_token"]
        with patch("accounts.views.secrets.randbelow", return_value=654321):
            with self.assertLogs("accounts.views", level="INFO"):
                email_send_response = self.client.post(
                    reverse("email-send-otp"),
                    {"email": "verified@example.com"},
                )
        email_challenge_id = email_send_response.json()["challenge_id"]
        email_verify_response = self.client.post(
            reverse("email-verify-otp"),
            {
                "email": "verified@example.com",
                "challenge_id": email_challenge_id,
                "otp": "654321",
            },
        )
        registration = {
            "username": "verifieduser",
            "email": "verified@example.com",
            "password": "testpass123!",
            "phone_number": self.phone_number,
            "usertype": "individual",
            "individual_profile": {},
            "phone_verification_challenge_id": challenge_id,
            "phone_verification_token": verification_token,
            "email_verification_challenge_id": email_challenge_id,
            "email_verification_token": email_verify_response.json()[
                "verification_token"
            ],
        }

        registration_without_email_proof = dict(registration)
        registration_without_email_proof.pop("email_verification_challenge_id")
        registration_without_email_proof.pop("email_verification_token")
        missing_email_proof_response = self.client.post(
            reverse("register"),
            {"data": json.dumps(registration_without_email_proof)},
        )
        self.assertEqual(missing_email_proof_response.status_code, 400)
        self.assertIn("email", missing_email_proof_response.json())
        self.assertEqual(get_user_model().objects.count(), 0)

        response = self.client.post(
            reverse("register"),
            {"data": json.dumps(registration)},
        )

        self.assertEqual(response.status_code, 201, response.content.decode())
        challenge = PhoneOTPVerification.objects.get(pk=challenge_id)
        self.assertIsNotNone(challenge.consumed_at)
        email_challenge = EmailOTPVerification.objects.get(pk=email_challenge_id)
        self.assertIsNotNone(email_challenge.consumed_at)


@override_settings(DEBUG=True)
class EmailOTPTests(TestCase):
    @patch("accounts.views.secrets.randbelow", return_value=123456)
    def test_send_and_verify_email_otp(self, _randbelow):
        with self.assertLogs("accounts.views", level="INFO") as logs:
            send_response = self.client.post(
                reverse("email-send-otp"),
                {"email": "person@example.com"},
            )

        self.assertEqual(send_response.status_code, 201)
        self.assertIn("123456", logs.output[0])
        self.assertNotIn("123456", send_response.content.decode())

        verify_response = self.client.post(
            reverse("email-verify-otp"),
            {
                "email": "person@example.com",
                "challenge_id": send_response.json()["challenge_id"],
                "otp": "123456",
            },
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.json()["verification_token"])

    def test_rejects_invalid_email(self):
        response = self.client.post(
            reverse("email-send-otp"),
            {"email": "not-an-email"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(EmailOTPVerification.objects.count(), 0)


class ProfileDetailsAPITests(APITestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_dir.cleanup)
        self.settings_override = override_settings(MEDIA_ROOT=self.media_dir.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.user = get_user_model().objects.create_user(
            username="profileuser",
            email="profile@example.com",
            password="secure-password",
        )
        self.client.force_authenticate(user=self.user)

    def test_current_user_includes_persisted_profile_details(self):
        ProfileDetails.objects.create(
            user=self.user,
            street_address="10 Main Street",
            gender="other",
            facebook_url="https://facebook.com/profileuser",
        )

        response = self.client.get(reverse("current-user"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "profile@example.com")
        self.assertIn("date_joined", response.data)
        self.assertEqual(
            response.data["profile_details"]["street_address"],
            "10 Main Street",
        )
        self.assertEqual(response.data["profile_details"]["gender"], "other")

    def test_patch_updates_user_and_extended_profile_fields(self):
        response = self.client.patch(
            reverse("current-user"),
            {
                "first_name": "Ava",
                "last_name": "Smith",
                "phone_number": "9876543210",
                "preferred_location": "Zurich",
                "street_address": "10 Main Street",
                "date_of_birth": "1990-04-15",
                "gender": "female",
                "facebook_url": "https://facebook.com/ava",
                "twitter_url": "https://x.com/ava",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.user.refresh_from_db()
        details = ProfileDetails.objects.get(user=self.user)
        self.assertEqual(self.user.first_name, "Ava")
        self.assertEqual(self.user.last_name, "Smith")
        self.assertEqual(self.user.phone_number, "9876543210")
        self.assertEqual(self.user.individual_profile.preferred_location, "Zurich")
        self.assertEqual(details.street_address, "10 Main Street")
        self.assertEqual(details.date_of_birth.isoformat(), "1990-04-15")
        self.assertEqual(details.facebook_url, "https://facebook.com/ava")

    def test_verification_document_upload_is_saved_and_sets_submitted_status(self):
        document = SimpleUploadedFile(
            "registration.pdf",
            b"%PDF-1.4 test document",
            content_type="application/pdf",
        )

        response = self.client.post(
            reverse("verification-documents"),
            {"files": [document]},
            format="multipart",
        )

        self.assertEqual(response.status_code, 201, response.data)
        details = ProfileDetails.objects.get(user=self.user)
        saved_document = VerificationDocument.objects.get(profile=details)
        self.assertEqual(saved_document.file.name.rsplit("/", 1)[-1], "registration.pdf")
        self.assertEqual(details.kyc_status, "submitted")
        self.assertEqual(
            response.data["profile_details"]["documents"][0]["name"],
            "registration.pdf",
        )

    def test_profile_photo_can_be_uploaded_and_removed(self):
        image_buffer = BytesIO()
        Image.new("RGB", (1, 1), color="white").save(image_buffer, format="PNG")
        image_buffer.seek(0)
        image = SimpleUploadedFile(
            "profile.png",
            image_buffer.read(),
            content_type="image/png",
        )

        upload_response = self.client.patch(
            reverse("current-user"),
            {"profile_picture": image},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, 200, upload_response.data)
        profile = self.user.individual_profile
        self.assertTrue(profile.profile_picture.name)
        saved_picture_name = profile.profile_picture.name

        with self.captureOnCommitCallbacks(execute=True):
            delete_response = self.client.patch(
                reverse("current-user"),
                {"remove_profile_picture": "true"},
                format="multipart",
            )

        self.assertEqual(delete_response.status_code, 200, delete_response.data)
        profile.refresh_from_db()
        self.assertFalse(profile.profile_picture)
        self.assertFalse(profile.profile_picture.storage.exists(saved_picture_name))

    def test_verification_upload_rejects_unsupported_file_extensions(self):
        document = SimpleUploadedFile(
            "identity.txt",
            b"not an allowed document",
            content_type="text/plain",
        )

        response = self.client.post(
            reverse("verification-documents"),
            {"files": [document]},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(VerificationDocument.objects.count(), 0)
   