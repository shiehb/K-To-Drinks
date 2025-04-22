from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .health_check import health_check

# API Schema configuration
schema_view = get_schema_view(
 openapi.Info(
    title="K-To-Drinks API",
    default_version='v1',
    description="API for K-To-Drinks Management System",
    contact=openapi.Contact(email="contact@example.com"),
    license=openapi.License(name="BSD License"),
 ),
 public=True,
 permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
  path('admin/', admin.site.urls),
  
  # Health check endpoint
  path('api/health-check/', health_check, name='health_check'),
  
  # API documentation
  path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
  path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
  
  # API endpoints
  path('api/users/', include('apps.users.urls')),
  path('api/stores/', include('apps.stores.urls')),
  path('api/products/', include('apps.products.urls')),
  path('api/inventory/', include('apps.inventory.urls')),
  path('api/orders/', include('apps.orders.urls')),
  path('api/deliveries/', include('apps.deliveries.urls')),
  path('api/dashboard/', include('apps.dashboard.urls')),
  
  # Authentication
  path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
  path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

