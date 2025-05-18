# apps/deliveries/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryViewSet

router = DefaultRouter()
router.register(r'deliveries', DeliveryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('delivery-routes/', DeliveryViewSet.as_view({'get': 'routes'}), name='delivery-routes'),
]