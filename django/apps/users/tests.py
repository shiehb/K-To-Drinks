from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class UsernameAuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpassword123',
            first_name='Test',
            last_name='User',
            email='test@example.com'
        )
        
    def test_login_with_username(self):
        """Test that users can login with username"""
        response = self.client.post('/api/token/', {
            'username': 'testuser',
            'password': 'testpassword123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
    def test_login_with_invalid_username(self):
        """Test that login fails with invalid username"""
        response = self.client.post('/api/token/', {
            'username': 'wronguser',
            'password': 'testpassword123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_create_user_with_username(self):
        """Test creating a new user with username"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post('/api/users/', {
            'username': 'newuser',
            'password': 'newpassword123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'employee'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newuser')
        
    def test_get_user_profile(self):
        """Test retrieving user profile"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/users/profile/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

