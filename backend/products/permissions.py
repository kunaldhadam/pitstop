from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsListingOwnerOrStaff(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return (
            obj.owner_id == request.user.pk
            or request.user.is_staff
        )
