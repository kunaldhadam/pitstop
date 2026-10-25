from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import (
    GarageOwnerProfile,
    IndividualProfile,
    ProfileDetails,
    VerificationDocument,
)

CustomUser = get_user_model() # Get the custom user model

class CustomUserAdmin(UserAdmin):
    ordering = ("-date_joined",)
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2", "usertype", "phone_number","contact_person_name"),
            },
        ),
    )
    
    list_display = [
        "email",
        "username",
        "is_superuser",
        "usertype",
        "phone_number",
        "contact_person_name"
    ]
    list_filter = ("date_joined", "is_active", "is_staff")

admin.site.register(CustomUser, CustomUserAdmin )

@admin.register(IndividualProfile)
class IndividualProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'preferred_location', 'vehicle_make', 'terms_and_conditions_accepted')
    search_fields = ('user__username', 'user__email', 'purpose', 'preferred_location', 'vehicle_make')
    list_filter = ('purpose', 'preferred_location', 'vehicle_make', 'terms_and_conditions_accepted')
    
@admin.register(GarageOwnerProfile)
class GarageOwnerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name')
    search_fields = ('user__username', 'user__email', 'business_name')
    filter_horizontal = ('purposes',)


@admin.register(ProfileDetails)
class ProfileDetailsAdmin(admin.ModelAdmin):
    list_display = ("user", "gender", "kyc_status")
    search_fields = ("user__username", "user__email", "street_address")
    list_filter = ("gender", "kyc_status")


@admin.register(VerificationDocument)
class VerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ("profile", "file", "uploaded_at")
    search_fields = ("profile__user__username", "file")
    list_filter = ("uploaded_at",)