from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

#We are doing this to use our custom user model in the forms instead of the default user model provided by Django. By using get_user_model(), we ensure that the forms will work with our CustomUser model, which is defined in accounts/models.py. This allows us to customize the user creation and change forms to include any additional fields or functionality that we may have added to our CustomUser model.

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = get_user_model()
        fields = (
            "email",
            "username",
            "contact_person_name"
        )

class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = get_user_model()
        fields = (
            "email",
            "username",
            "contact_person_name"
        )