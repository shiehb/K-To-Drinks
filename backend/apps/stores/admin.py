from django.contrib import admin
from .models import Store


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'owner_name', 'day', 'is_archived')
    list_filter = ('day', 'is_archived')
    search_fields = ('name', 'location', 'owner_name')
    fieldsets = (
        (None, {'fields': ('name', 'location', 'owner_name', 'day')}),
        ('Contact Information', {'fields': ('email', 'number')}),
        ('Coordinates', {'fields': ('lat', 'lng')}),
        ('Status', {'fields': ('is_archived',)}),
    )

