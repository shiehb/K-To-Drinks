# apps/stores/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoreViewSet

router = DefaultRouter()
router.register(r'', StoreViewSet, basename='store')  # Changed from 'stores' to ''

urlpatterns = [
    path('', include(router.urls)),
]