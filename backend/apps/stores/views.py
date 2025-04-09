# apps/stores/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Store
from .serializers import StoreSerializer

class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.filter(is_archived=False)  # Fetch only non-archived stores by default
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]

class StoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Handle POST request
        return Response({"message": "Store created successfully"}, status=status.HTTP_201_CREATED)