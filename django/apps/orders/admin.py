from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'store', 'created_by', 'delivery_day', 'status', 'total')
    list_filter = ('status', 'delivery_day', 'store')
    search_fields = ('order_id', 'store__name', 'created_by__username')
    readonly_fields = ('subtotal', 'tax', 'total')
    inlines = [OrderItemInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('store', 'created_by')

