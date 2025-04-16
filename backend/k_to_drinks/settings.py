"""
Django settings for k_to_drinks project.
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-+4qneyxqn$*d(2(3@v-_@w9-ij7$vgii84m$%x9od4o^gf)o$*'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('IS_DEVELOPMENT', 'true').lower() == 'true'

ALLOWED_HOSTS = ['localhost', '127.0.0.1','k-to-drinks-management-system.onrender.com']


# Application definition
INSTALLED_APPS = [
   'django.contrib.admin',
   'django.contrib.auth',
   'django.contrib.contenttypes',
   'django.contrib.sessions',
   'django.contrib.messages',
   'django.contrib.staticfiles',
   
   # Third-party apps
   'rest_framework',
   'corsheaders',
   'django_filters',
   'rest_framework_simplejwt',
   'drf_yasg',
   
   
   # Project apps
   'apps.base',
   'apps.users',
   'apps.stores',
   'apps.products',
   'apps.inventory',
   'apps.orders',
   'apps.deliveries',
   'apps.dashboard',
]

MIDDLEWARE = [
   'corsheaders.middleware.CorsMiddleware',  # This must be first
   'django.middleware.security.SecurityMiddleware',
   'django.contrib.sessions.middleware.SessionMiddleware',
   'django.middleware.common.CommonMiddleware',
   'django.middleware.csrf.CsrfViewMiddleware',
   'django.contrib.auth.middleware.AuthenticationMiddleware',
   'django.contrib.messages.middleware.MessageMiddleware',
   'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'k_to_drinks.urls'

TEMPLATES = [
   {
       'BACKEND': 'django.template.backends.django.DjangoTemplates',
       'DIRS': [],
       'APP_DIRS': True,
       'OPTIONS': {
           'context_processors': [
               'django.template.context_processors.debug',
               'django.template.context_processors.request',
               'django.contrib.auth.context_processors.auth',
               'django.contrib.messages.context_processors.messages',
           ],
       },
   },
]

WSGI_APPLICATION = 'k_to_drinks.wsgi.application'

# Database
DATABASES = {
   'default': {
       'ENGINE': 'django.db.backends.sqlite3',
       'NAME': BASE_DIR / 'db.sqlite3',
   }
}

# Password validation
# AUTH_PASSWORD_VALIDATORS = [
#    {
#        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
#    },
#    {
#        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
#    },
#    {
#        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
#    },
#    {
#        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
#    },
# ]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

if DEBUG:
    STATICFILES_DIRS = [
        os.path.join(BASE_DIR, 'static')
    ]
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'users.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = False  # Keep this False for security
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Add Vite's default port
    "http://localhost:3000",  # Keep this if you also use React's default port
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True

# Update CORS headers to include all necessary ones
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'access-control-allow-origin',
    'access-control-allow-headers',
    'access-control-allow-credentials',
]

# Ensure these headers are exposed to the frontend
CORS_EXPOSE_HEADERS = [
    'content-type',
    'content-length',
    'access-control-allow-origin',
    'access-control-allow-headers',
    'access-control-allow-credentials',
]

# JWT settings
from datetime import timedelta
SIMPLE_JWT = {
   'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
   'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
   'ROTATE_REFRESH_TOKENS': True,
   'BLACKLIST_AFTER_ROTATION': True,
   'TOKEN_OBTAIN_SERIALIZER': 'apps.users.serializers.CustomTokenObtainPairSerializer',
}