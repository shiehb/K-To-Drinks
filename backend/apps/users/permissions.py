# apps/users/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsSelfOrAdmin(permissions.BasePermission):
    """
    Allows access only to admin users or the user themselves.
    """
    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_authenticated and (
            request.user.role == 'admin' or obj == request.user
        )