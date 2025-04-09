# apps/inventory/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet, InventoryTransactionViewSet, InventoryAdjustmentView

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet)
router.register(r'inventory-transactions', InventoryTransactionViewSet)
router.register(r'inventory-adjustment', InventoryAdjustmentView, basename='inventory-adjustment')

urlpatterns = [
    path('', include(router.urls)),
    path('inventory/adjust/', InventoryAdjustmentView.as_view({'post': 'adjust'}), name='inventory-adjust'),
]