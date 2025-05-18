from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import UserViewSet, UserProfileView, update_avatar
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'', UserViewSet)

urlpatterns = [
   path('', include(router.urls)),
   path('profile/', UserProfileView.as_view(), name='user-profile'),
   path('profile/avatar/', update_avatar, name='update-avatar'),
]

