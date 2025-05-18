from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet

router = DefaultRouter()
router.register(r'', InventoryViewSet, basename='inventory')  # Changed from 'inventory' to ''

urlpatterns = [
    path('', include(router.urls)),
]