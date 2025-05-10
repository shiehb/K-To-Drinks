# apps/inventory/admin.py
from django.contrib import admin
from .models import Inventory, InventoryTransaction

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('product', 'stock', 'low_stock_threshold', 'is_low_stock', 'last_updated')
    list_filter = ('low_stock_threshold',)
    search_fields = ('product__name', 'product__product_id')
    list_editable = ('stock', 'low_stock_threshold')
    readonly_fields = ('is_low_stock', 'last_updated')
    ordering = ('product__name',)

@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'transaction_type', 'created_at')
    ordering = ('-created_at',)