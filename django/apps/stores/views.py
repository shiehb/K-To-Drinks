# apps/stores/views.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Store
from .serializers import StoreSerializer
import logging

logger = logging.getLogger(__name__)

class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_archived']
    search_fields = ['name', 'owner_name', 'address']
    ordering_fields = ['name', 'status']

    def list(self, request, *args, **kwargs):
        logger.info(f"Received store list request with params: {request.query_params}")
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['GET'])
    def active(self, request):
        active_stores = self.get_queryset().filter(
            status='Active',
            is_archived=False
        )
        serializer = self.get_serializer(active_stores, many=True)
        return Response(serializer.data)

class StoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Handle POST request
        return Response({"message": "Store created successfully"}, status=status.HTTP_201_CREATED)