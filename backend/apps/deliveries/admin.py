from django.contrib import admin
from .models import Delivery, DeliveryStatusUpdate


class DeliveryStatusUpdateInline(admin.TabularInline):
    model = DeliveryStatusUpdate
    extra = 0
    readonly_fields = ('update_time',)
    fields = ('status', 'notes', 'update_time', 'updated_by')


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'employee', 'status', 'delivery_date', 'delivery_time', 'has_signature')
    list_filter = ('status', 'delivery_date', 'has_signature')
    search_fields = ('id', 'order__order_id', 'employee__username')
    readonly_fields = ('id', 'has_signature')
    inlines = [DeliveryStatusUpdateInline]
    fieldsets = (
        (None, {'fields': ('id', 'order', 'employee', 'status')}),
        ('Delivery Details', {'fields': ('delivery_date', 'delivery_time', 'notes')}),
        ('Location', {'fields': ('lat', 'lng')}),
        ('Signature', {'fields': ('has_signature', 'signature_image')}),
    )


@admin.register(DeliveryStatusUpdate)
class DeliveryStatusUpdateAdmin(admin.ModelAdmin):
    list_display = ('delivery', 'status', 'update_time', 'updated_by')
    list_filter = ('status', 'update_time')
    search_fields = ('delivery__id', 'notes')
    readonly_fields = ('update_time',)

