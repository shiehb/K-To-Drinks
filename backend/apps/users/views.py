from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserCreateSerializer, UserProfileSerializer
from .models import UserProfile

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing user instances.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def perform_destroy(self, instance):
        # Instead of deleting, mark as archived
        instance.status = 'archived'
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=['get', 'put'])
    def profile(self, request):
        user = request.user
        
        if request.method == 'GET':
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            profile_data = request.data.pop('profile', {})
            
            # Update user data
            user_serializer = UserSerializer(user, data=request.data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
                
                # Update profile data
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile_serializer = UserProfileSerializer(profile, data=profile_data, partial=True)
                if profile_serializer.is_valid():
                    profile_serializer.save()
                    
                return Response(UserSerializer(user).data)
            
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListCreateView(generics.ListCreateAPIView):
    """
    API view to retrieve list of users or create new user
    """
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view to retrieve, update or delete user
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        # Instead of deleting, mark as archived
        user.status = 'archived'
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserProfileView(APIView):
    """
    API view for retrieving and updating the authenticated user's profile
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def put(self, request):
        user = request.user
        profile_data = request.data.pop('profile', {})
        
        # Update user data
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        if user_serializer.is_valid():
            user_serializer.save()
            
            # Update profile data
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile_serializer = UserProfileSerializer(profile, data=profile_data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
                
            return Response(UserSerializer(user).data)
        
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_avatar(request):
    """Handle avatar upload for user profile"""
    try:
        profile = request.user.profile
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'No avatar file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete old avatar if it exists
        if profile.avatar:
            profile.avatar.delete()

        profile.avatar = request.FILES['avatar']
        profile.save()

        return Response({
            'status': 'success',
            'message': 'Avatar updated successfully',
            'avatar_url': request.build_absolute_uri(profile.avatar.url)
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
