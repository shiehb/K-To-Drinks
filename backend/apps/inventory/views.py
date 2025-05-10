# apps/inventory/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Inventory
from .serializers import InventorySerializer

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.filter(product__is_active=True) 
    serializer_class = InventorySerializer

    @action(detail=True, methods=['post'], url_path='restock')
    def restock(self, request, pk=None):
        inventory = self.get_object()
        quantity = request.data.get('quantity', 0)
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response(
                    {"error": "Quantity must be positive"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            inventory.stock += quantity
            inventory.save()
            serializer = self.get_serializer(inventory)
            return Response(serializer.data)
            
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid quantity"},
                status=status.HTTP_400_BAD_REQUEST
            )