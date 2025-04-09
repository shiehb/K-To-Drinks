from django.urls import path
from apps.base.views import health_check

urlpatterns = [
    path('api/health-check', health_check, name='health-check'),
]