# apps/inventory/serializers.py
from rest_framework import serializers
from .models import Inventory

class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.CharField(source='product.product_id', read_only=True)
    size = serializers.CharField(source='product.size', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    last_updated = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    is_active = serializers.BooleanField(source='product.is_active', read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'id',
            'product',
            'product_name',
            'product_id',
            'size',
            'stock',
            'low_stock_threshold',
            'is_low_stock',
            'last_updated',
            'is_active'  # Useful for frontend filtering
        ]
        extra_kwargs = {
            'product': {'write_only': True}
        }

    def to_representation(self, instance):
        # Skip serialization if product is inactive
        if not instance.product.is_active:
            return None
        return super().to_representation(instance)