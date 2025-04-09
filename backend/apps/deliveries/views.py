# apps/deliveries/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Delivery
from .serializers import DeliverySerializer, DeliveryStatusUpdateSerializer
from django.core.files.base import ContentFile
import base64
import uuid

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Delivery.objects.all()
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by employee
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(delivery_date__range=[start_date, end_date])
        elif start_date:
            queryset = queryset.filter(delivery_date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(delivery_date__lte=end_date)
        
        # Filter by specific date
        delivery_date = self.request.query_params.get('delivery_date')
        if delivery_date:
            queryset = queryset.filter(delivery_date=delivery_date)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update delivery status."""
        delivery = self.get_object()
        serializer = DeliveryStatusUpdateSerializer(delivery, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Return updated delivery
        return Response(DeliverySerializer(delivery).data)
    
    @action(detail=True, methods=['post'])
    def signature(self, request, pk=None):
        """Upload signature for delivery."""
        delivery = self.get_object()
        
        # Check if delivery is in delivered status
        if delivery.status != Delivery.STATUS_DELIVERED:
            return Response(
                {'detail': 'Signature can only be uploaded for delivered deliveries.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle signature upload
        if 'signature' in request.FILES:
            # Handle file upload
            delivery.signature = request.FILES['signature']
            delivery.save()
        elif 'signature_data' in request.data:
            # Handle base64 encoded image
            try:
                signature_data = request.data['signature_data']
                
                # Remove data:image/png;base64, prefix if present
                if ',' in signature_data:
                    signature_data = signature_data.split(',')[1]
                
                # Decode base64 data
                signature_bytes = base64.b64decode(signature_data)
                
                # Generate filename
                filename = f"signature_{uuid.uuid4().hex}.png"
                
                # Save signature
                delivery.signature.save(filename, ContentFile(signature_bytes), save=True)
            except Exception as e:
                return Response(
                    {'detail': f'Error processing signature: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {'detail': 'No signature provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(DeliverySerializer(delivery).data)
    
    @action(detail=False, methods=['get'])
    def routes(self, request):
        """Get delivery routes for a specific date and employee."""
        delivery_date = request.query_params.get('delivery_date')
        employee_id = request.query_params.get('employee_id')
        
        if not delivery_date:
            return Response(
                {'detail': 'delivery_date parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(delivery_date=delivery_date)
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        # Get store locations for route planning
        routes = []
        for delivery in queryset:
            store = delivery.order.store
            if store.lat and store.lng:
                routes.append({
                    'id': delivery.id,
                    'delivery_id': delivery.delivery_id,
                    'order_id': delivery.order.order_id,
                    'store_name': store.name,
                    'address': store.location,
                    'lat': store.lat,
                    'lng': store.lng,
                    'status': delivery.status,
                    'delivery_time': delivery.delivery_time.strftime('%H:%M')
                })
        
        return Response(routes)