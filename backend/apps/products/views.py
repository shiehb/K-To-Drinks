from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Product
from .serializers import ProductSerializer
from apps.inventory.models import Inventory
import os
from django.conf import settings
from django.core.files.storage import default_storage

class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows products to be viewed or edited.
    Automatically creates inventory records for new products.
    Handles image uploads and deletions.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['product_id', 'name', 'description']

    def get_queryset(self):
        queryset = super().get_queryset()
        is_archived = self.request.query_params.get('is_archived', 'false').lower() == 'true'
        
        # Filter by active status
        queryset = queryset.filter(is_active=not is_archived)
        
        # Apply search if provided
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(
                Q(name__icontains=search_term) |
                Q(product_id__icontains=search_term) |
                Q(description__icontains=search_term)
            )
        
        return queryset.order_by('name')

    def perform_create(self, serializer):
        """Override creation to ensure inventory record is created"""
        product = serializer.save()
        
        # Create inventory record with defaults
        Inventory.objects.get_or_create(
            product=product,
            defaults={
                'stock': 0,
                'low_stock_threshold': 10
            }
        )

    def perform_update(self, serializer):
        """Handle image updates and deletions"""
        instance = self.get_object()
        
        # Check if we should remove the existing image
        if 'image-clear' in self.request.data and self.request.data['image-clear'] == 'true':
            if instance.image:
                # Delete the old image file
                if default_storage.exists(instance.image.name):
                    default_storage.delete(instance.image.name)
                instance.image = None
                instance.save()
        
        # Proceed with normal update
        super().perform_update(serializer)

    def destroy(self, request, *args, **kwargs):
        """Override delete to handle image cleanup"""
        instance = self.get_object()
        
        # Delete associated image file if exists
        if instance.image:
            if default_storage.exists(instance.image.name):
                default_storage.delete(instance.image.name)
        
        # Proceed with normal deletion
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Custom action to activate/deactivate product"""
        product = self.get_object()
        product.is_active = not product.is_active
        product.save()
        
        return Response({
            'status': 'success',
            'is_active': product.is_active,
            'message': f'Product {"activated" if product.is_active else "deactivated"} successfully'
        }, status=status.HTTP_200_OK)

    def handle_exception(self, exc):
        """Custom exception handling for better error messages"""
        if isinstance(exc, IOError):
            return Response(
                {'error': 'File system error occurred while processing image'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response = super().handle_exception(exc)
        
        # Add more context to validation errors
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            if hasattr(exc, 'detail'):
                response.data = {
                    'error': 'Validation failed',
                    'details': exc.detail
                }
        
        return response