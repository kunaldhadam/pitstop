from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# Create your models here.
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    contact_person_name = models.CharField(max_length=20, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    usertype = models.CharField(
        max_length=50, 
        choices=[('individual', 'Individual'), ('garage owner', 'Garage Owner')],
        null=True,
        blank=True
    )

    def __str__(self):
        return self.username


class PhoneOTPVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=15)
    otp_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_token_hash = models.CharField(max_length=128, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["phone_number", "created_at"])]

    def __str__(self):
        return f"Phone verification for {self.phone_number}"


class EmailOTPVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    otp_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_token_hash = models.CharField(max_length=128, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    consumed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["email", "created_at"])]

    def __str__(self):
        return f"Email verification for {self.email}"
    
class IndividualProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='individual_profile')
    # Add any additional fields specific to individual users here

    purpose = models.CharField(
        max_length=100,
        choices=[
            ('sell car', 'Sell Car'),
            ('sell bike', 'Sell Bike')
        ],
        null=True,
        blank=True
    )
    preferred_location = models.CharField(max_length=100, null=True, blank=True)
    vehicle_make = models.CharField(max_length=100, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    
    terms_and_conditions_accepted = models.BooleanField(default=False)
    terms_and_conditions_accepted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Individual Profile"


class ProfileDetails(models.Model):
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
        ("prefer_not_to_say", "Prefer not to say"),
    ]
    KYC_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("submitted", "Submitted"),
        ("verified", "Verified"),
        ("rejected", "Rejected"),
    ]

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="profile_details",
    )
    street_address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=32, choices=GENDER_CHOICES, blank=True)
    facebook_url = models.URLField(max_length=300, blank=True)
    twitter_url = models.URLField(max_length=300, blank=True)
    kyc_status = models.CharField(
        max_length=16,
        choices=KYC_STATUS_CHOICES,
        default="pending",
    )

    def __str__(self):
        return f"Profile details for {self.user.username}"


class VerificationDocument(models.Model):
    profile = models.ForeignKey(
        ProfileDetails,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    file = models.FileField(upload_to="verification_documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification document for {self.profile.user.username}"
     
class BusinessPurpose(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class GarageOwnerProfile(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="garage_owner_profile"
    )

    business_name = models.CharField(max_length=100)

    purposes = models.ManyToManyField(
        BusinessPurpose,
        related_name="garage_owners",
        blank=True
    )

    trade_license_number = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    vat_gst_number = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    business_address = models.TextField(
        blank=True,
        null=True
    )

    operating_hours = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    services_offered = models.TextField(
        blank=True,
        null=True
    )

    type_of_vehicles_serviced = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    terms_and_conditions_accepted = models.BooleanField(
        default=False
    )

    terms_and_conditions_accepted_at = models.DateTimeField(
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.user.username}'s Garage Owner Profile"
 
 
#not yet used   
class GaragePhoto(models.Model):
    garage = models.ForeignKey(
        GarageOwnerProfile,
        on_delete=models.CASCADE,
        related_name="garage_photos"
    )

    image = models.ImageField(
        upload_to="garage_photos/"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Photo of {self.garage.business_name}"