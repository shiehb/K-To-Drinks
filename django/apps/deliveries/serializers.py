# apps/deliveries/serializers.py
from rest_framework import serializers
from .models import Delivery
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class DeliverySerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        source='order',
        write_only=True
    )
    employee = serializers.StringRelatedField(read_only=True)
    employee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='delivery_driver', status='active'),
        source='employee',
        write_only=True,
        required=False
    )
    has_signature = serializers.SerializerMethodField()
    
    class Meta:
        model = Delivery
        fields = [
            'id', 'delivery_id', 'order', 'order_id', 'employee', 'employee_id',
            'status', 'delivery_date', 'delivery_time', 'notes', 'has_signature',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'delivery_id', 'created_at', 'updated_at']
    
    def get_has_signature(self, obj):
        return bool(obj.signature)
    
    def create(self, validated_data):
        # Generate delivery ID
        import uuid
        validated_data['delivery_id'] = f"DEL-{uuid.uuid4().hex[:8].upper()}"
        
        # Create delivery
        return super().create(validated_data)

class DeliveryStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Delivery.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    update_time = serializers.DateTimeField(required=False)
    
    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        
        # Update notes if provided
        if 'notes' in validated_data:
            instance.notes = validated_data['notes']
        
        instance.save()
        return instance