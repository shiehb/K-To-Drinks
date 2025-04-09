from rest_framework import serializers
from .models import Category, Product, Supplier
from apps.inventory.models import Inventory


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['quantity', 'reorder_level', 'is_low_stock', 'last_checked']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    supplier_name = serializers.ReadOnlyField(source='supplier.name')
    inventory = InventorySerializer(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'product_id', 'name', 'brand', 'description', 
            'category', 'category_name', 'supplier', 'supplier_name',
            'price', 'cost_price', 'size', 'barcode', 
            'stock_quantity', 'reorder_level', 'is_active',
            'inventory', 'created_at', 'updated_at'
        ]

