from django.contrib import admin
from .models import Store

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner_name', 'status', 'is_archived')
    list_filter = ('status', 'is_archived')
    search_fields = ('name', 'owner_name', 'address')
    fieldsets = (
        (None, {
            'fields': ('name', 'owner_name', 'status', 'is_archived')
        }),
        ('Contact Information', {
            'fields': ('email', 'contact', 'address')
        }),
        ('Store Details', {
            'fields': ('hours',)
        }),
        ('Location', {
            'fields': ('latitude', 'longitude')
        }),
    )

