# apps/orders/serializers.py
from rest_framework import serializers
from .models import Order, OrderItem
from apps.stores.models import Store
from apps.products.models import Product
from apps.stores.serializers import StoreSerializer
from apps.products.serializers import ProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    total_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        source='total_price'
    )
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['id']

class OrderSerializer(serializers.ModelSerializer):
    store = StoreSerializer(read_only=True)
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(),
        source='store',
        write_only=True
    )
    items = OrderItemSerializer(many=True, read_only=True)
    order_items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    total_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        source='total_amount'
    )
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'store', 'store_id', 'status', 'notes',
            'items', 'order_items', 'total_amount', 'created_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_id', 'created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Get the current user from the request
        user = self.context['request'].user
        validated_data['created_by'] = user
        
        # Generate order ID
        import uuid
        validated_data['order_id'] = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # Extract and remove order items data
        order_items_data = validated_data.pop('order_items', [])
        
        # Create order
        order = super().create(validated_data)
        
        # Create order items
        for item_data in order_items_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity', 1)
            unit_price = item_data.get('unit_price')
            
            try:
                product = Product.objects.get(id=product_id)
                
                # If unit_price is not provided, use product's unit_price
                if not unit_price:
                    unit_price = product.unit_price
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )
            except Product.DoesNotExist:
                pass
        
        return order
    
    def update(self, instance, validated_data):
        # Extract and remove order items data
        order_items_data = validated_data.pop('order_items', [])
        
        # Update order
        instance = super().update(instance, validated_data)
        
        # If order items are provided, replace existing items
        if order_items_data:
            # Delete existing items
            instance.items.all().delete()
            
            # Create new items
            for item_data in order_items_data:
                product_id = item_data.get('product_id')
                quantity = item_data.get('quantity', 1)
                unit_price = item_data.get('unit_price')
                
                try:
                    product = Product.objects.get(id=product_id)
                    
                    # If unit_price is not provided, use product's unit_price
                    if not unit_price:
                        unit_price = product.unit_price
                    
                    OrderItem.objects.create(
                        order=instance,
                        product=product,
                        quantity=quantity,
                        unit_price=unit_price
                    )
                except Product.DoesNotExist:
                    pass
        
        return instance