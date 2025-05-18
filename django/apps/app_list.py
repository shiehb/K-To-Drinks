"""
This module provides a list of all apps in the apps directory.
Import this in your settings.py to easily include all apps in INSTALLED_APPS.
"""

# List of all apps in the project
APPS = [
    'apps.base',
    'apps.users',
    'apps.stores',
    'apps.products',
    'apps.inventory',
    'apps.orders',
    'apps.deliveries',
    'apps.dashboard',
]

# Function to get all apps for INSTALLED_APPS setting
def get_apps():
    return APPS

# Usage in settings.py:
# from apps.app_list import APPS
# INSTALLED_APPS = [
#     'django.contrib.admin',
#     'django.contrib.auth',
#     ...
# ] + APPS

