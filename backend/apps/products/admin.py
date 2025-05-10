from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('product_id', 'name', 'price', 'size', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('product_id', 'name')
    fieldsets = (
        (None, {'fields': ('product_id', 'name', 'description')}),
        ('Details', {'fields': ('price', 'size')}),
        ('Status', {'fields': ('is_active',)}),
    )