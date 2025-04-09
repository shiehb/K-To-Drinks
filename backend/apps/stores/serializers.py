# apps/stores/serializers.py
from rest_framework import serializers
from .models import Store

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'location', 'lat', 'lng', 'owner_name',
            'email', 'number', 'day', 'is_archived', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']