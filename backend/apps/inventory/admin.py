from django.contrib import admin
from .models import Inventory, InventoryTransaction, ProductExpiry


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'reorder_level', 'is_low_stock', 'last_checked')
    list_filter = ('reorder_level',)  # Changed from 'is_low_stock' to an actual field
    search_fields = ('product__name',)
    readonly_fields = ('last_checked', 'is_low_stock')  # Added 'is_low_stock' to readonly_fields


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'transaction_type', 'reference', 'user', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('product__name', 'reference', 'reason')
    date_hierarchy = 'created_at'


@admin.register(ProductExpiry)
class ProductExpiryAdmin(admin.ModelAdmin):
    list_display = ('product', 'batch_number', 'quantity', 'expiry_date', 'is_active')
    list_filter = ('expiry_date', 'is_active')
    search_fields = ('product__name', 'batch_number')
    date_hierarchy = 'expiry_date'

