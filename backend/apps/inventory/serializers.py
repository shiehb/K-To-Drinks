# apps/inventory/serializers.py
from rest_framework import serializers
from .models import Inventory, InventoryTransaction
from apps.products.serializers import ProductSerializer
from apps.products.models import Product

class InventorySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    
    class Meta:
        model = Inventory
        fields = ['id', 'product', 'product_id', 'current_stock', 'last_updated']
        read_only_fields = ['id', 'last_updated']

class InventoryTransactionSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'product', 'product_id', 'transaction_type', 'quantity',
            'previous_stock', 'new_stock', 'reference', 'reason',
            'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'previous_stock', 'new_stock', 'created_by', 'created_at']
    
    def create(self, validated_data):
        # Get the current user from the request
        user = self.context['request'].user
        validated_data['created_by'] = user
        
        # Get the product and its current inventory
        product = validated_data['product']
        try:
            inventory = Inventory.objects.get(product=product)
        except Inventory.DoesNotExist:
            inventory = Inventory.objects.create(product=product, current_stock=0)
        
        # Set previous stock
        validated_data['previous_stock'] = inventory.current_stock
        
        # Calculate new stock based on transaction type
        transaction_type = validated_data['transaction_type']
        quantity = validated_data['quantity']
        
        if transaction_type == InventoryTransaction.TRANSACTION_IN:
            new_stock = inventory.current_stock + quantity
        elif transaction_type == InventoryTransaction.TRANSACTION_OUT:
            new_stock = max(0, inventory.current_stock - quantity)
        else:  # Adjustment
            new_stock = max(0, inventory.current_stock + quantity)
        
        validated_data['new_stock'] = new_stock
        
        # Update inventory
        inventory.current_stock = new_stock
        inventory.save()
        
        # Create transaction
        return super().create(validated_data)

class InventoryAdjustmentSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    adjustment_value = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(choices=InventoryTransaction.TRANSACTION_TYPES)
    reason = serializers.CharField(required=True)
    reference = serializers.CharField(required=False, allow_blank=True)
    
    def create(self, validated_data):
        # Get the current user from the request
        user = self.context['request'].user
        
        # Get the product and its current inventory
        product = validated_data['product_id']
        try:
            inventory = Inventory.objects.get(product=product)
        except Inventory.DoesNotExist:
            inventory = Inventory.objects.create(product=product, current_stock=0)
        
        # Create transaction
        transaction = InventoryTransaction.objects.create(
            product=product,
            transaction_type=validated_data['transaction_type'],
            quantity=validated_data['adjustment_value'],
            previous_stock=inventory.current_stock,
            new_stock=max(0, inventory.current_stock + validated_data['adjustment_value']),
            reason=validated_data['reason'],
            reference=validated_data.get('reference', ''),
            created_by=user
        )
        
        # Update inventory
        inventory.current_stock = transaction.new_stock
        inventory.save()
        
        return transaction