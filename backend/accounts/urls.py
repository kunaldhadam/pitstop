from django.urls import path, include

from .views import (
    BusinessPurposeListAPIView,
    CurrentUserView,
    RegisterAPIView,
    VerificationDocumentsView,
    check_username,
    send_email_otp,
    send_phone_otp,
    verify_email_otp,
    verify_phone_otp,
)

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('phone/send-otp/', send_phone_otp, name='phone-send-otp'),
    path('phone/verify-otp/', verify_phone_otp, name='phone-verify-otp'),
    path('email/send-otp/', send_email_otp, name='email-send-otp'),
    path('email/verify-otp/', verify_email_otp, name='email-verify-otp'),
    path('business/', BusinessPurposeListAPIView.as_view(), name='business_purpose'),
    path('check-username/', check_username),
    path('me/', CurrentUserView.as_view(), name="current-user"),
    path(
        'me/verification-documents/',
        VerificationDocumentsView.as_view(),
        name="verification-documents",
    ),
]