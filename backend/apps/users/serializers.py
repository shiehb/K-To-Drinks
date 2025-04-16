from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'bio', 'address', 'birth_date']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 
                 'phone_number', 'role', 'status', 'is_active', 'date_joined', 'profile']
        read_only_fields = ['id', 'date_joined']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 
                 'phone_number', 'role', 'password']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom claims to the token
        refresh = self.get_token(self.user)
        
        # Include all necessary user data in the response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'email': self.user.email,
            'role': self.user.role,
            'status': self.user.status
        }
        
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to the token itself
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['user_id'] = user.id
        token['role'] = user.role
        token['status'] = user.status

        return token
