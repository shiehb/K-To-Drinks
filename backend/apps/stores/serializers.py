# apps/stores/serializers.py
from rest_framework import serializers
from .models import Store

class StoreSerializer(serializers.ModelSerializer):
    coordinates = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            'id', 'name', 'owner_name', 'address', 'contact',
            'email', 'day', 'status', 'hours', 'coordinates', 'is_archived'
        ]
        read_only_fields = ['id']

    def get_coordinates(self, obj):
        if obj.latitude and obj.longitude:
            return [obj.latitude, obj.longitude]
        return [0, 0]

    def create(self, validated_data):
        coordinates = self.initial_data.get('coordinates', [0, 0])
        if isinstance(coordinates, list) and len(coordinates) == 2:
            validated_data['latitude'] = coordinates[0]
            validated_data['longitude'] = coordinates[1]
        return super().create(validated_data)

    def update(self, instance, validated_data):
        coordinates = self.initial_data.get('coordinates')
        if coordinates and isinstance(coordinates, list) and len(coordinates) == 2:
            validated_data['latitude'] = coordinates[0]
            validated_data['longitude'] = coordinates[1]
        return super().update(instance, validated_data)