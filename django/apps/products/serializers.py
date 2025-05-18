from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)  # Add this line
    
    class Meta:
        model = Product
        fields = [
            'id', 'product_id', 'name', 'description',
            'price', 'size', 'is_active', 'created_at', 'updated_at', 'image'  # Add image here
        ]