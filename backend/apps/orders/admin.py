from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ('product', 'quantity', 'unit_price', 'total')
    readonly_fields = ('total',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'store', 'user', 'status', 'delivery_day', 'total', 'created_at')
    list_filter = ('status', 'delivery_day', 'created_at')
    search_fields = ('order_id', 'store__name', 'user__username')
    readonly_fields = ('order_id', 'subtotal', 'tax', 'total')
    inlines = [OrderItemInline]
    fieldsets = (
        (None, {'fields': ('order_id', 'store', 'user', 'status', 'delivery_day')}),
        ('Notes', {'fields': ('notes',)}),
        ('Totals', {'fields': ('subtotal', 'tax', 'total')}),
    )

