from django.contrib import admin
from .models import Category, Supplier, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'phone')
    search_fields = ('name', 'contact_person')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('product_id', 'name', 'brand', 'category', 'price', 'stock_quantity', 'is_active')
    list_filter = ('category', 'supplier', 'is_active')
    search_fields = ('product_id', 'name', 'brand', 'barcode')
    fieldsets = (
        (None, {'fields': ('product_id', 'name', 'brand', 'description', 'category', 'supplier')}),
        ('Pricing', {'fields': ('price', 'cost_price')}),
        ('Inventory', {'fields': ('size', 'barcode', 'stock_quantity', 'reorder_level')}),
        ('Status', {'fields': ('is_active',)}),
    )

