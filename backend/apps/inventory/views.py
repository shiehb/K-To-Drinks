# apps/inventory/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Inventory, InventoryTransaction
from .serializers import InventorySerializer, InventoryTransactionSerializer, InventoryAdjustmentSerializer
from apps.products.models import Product
from django.db.models import F

class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Inventory.objects.all()
        
        # Filter by product
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with stock below reorder level."""
        low_stock_items = Inventory.objects.filter(
            current_stock__lte=F('product__reorder_level')
        )
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)

class InventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = InventoryTransaction.objects.all()
        
        # Filter by product
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by transaction type
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(created_at__date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        return queryset

class InventoryAdjustmentView(viewsets.GenericViewSet):
    serializer_class = InventoryAdjustmentSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def adjust(self, request):
        """Adjust inventory for a product."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        transaction = serializer.save()
        
        return Response(
            InventoryTransactionSerializer(transaction).data,
            status=status.HTTP_201_CREATED
        )