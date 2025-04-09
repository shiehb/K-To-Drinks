# apps/dashboard/serializers.py
from rest_framework import serializers
from apps.orders.models import Order
from apps.deliveries.models import Delivery
from apps.products.models import Product
from apps.inventory.models import Inventory
from django.db.models import Sum, Count, Case, When, IntegerField, F
from django.utils import timezone
from datetime import timedelta

class DashboardSummarySerializer(serializers.Serializer):
    # Today's deliveries
    today_deliveries = serializers.IntegerField()
    today_deliveries_change = serializers.FloatField()
    
    # Monthly deliveries
    monthly_deliveries = serializers.IntegerField()
    monthly_deliveries_change = serializers.FloatField()
    
    # Total sales
    total_sales = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_sales_change = serializers.FloatField()
    
    # Low stock items
    low_stock_count = serializers.IntegerField()
    
    # Delivery performance
    on_time_delivery_percentage = serializers.FloatField()
    delayed_delivery_percentage = serializers.FloatField()
    failed_delivery_percentage = serializers.FloatField()
    
    # Recent orders
    recent_orders = serializers.ListField(child=serializers.DictField())
    
    def to_representation(self, instance):
        # Get current date and time
        now = timezone.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        
        # Calculate today's deliveries
        today_deliveries = Delivery.objects.filter(delivery_date=today).count()
        yesterday_deliveries = Delivery.objects.filter(delivery_date=yesterday).count()
        today_deliveries_change = 0
        if yesterday_deliveries > 0:
            today_deliveries_change = ((today_deliveries - yesterday_deliveries) / yesterday_deliveries) * 100
        
        # Calculate monthly deliveries
        current_month_start = today.replace(day=1)
        last_month_end = current_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        
        monthly_deliveries = Delivery.objects.filter(delivery_date__gte=current_month_start).count()
        last_month_deliveries = Delivery.objects.filter(
            delivery_date__gte=last_month_start,
            delivery_date__lte=last_month_end
        ).count()
        monthly_deliveries_change = 0
        if last_month_deliveries > 0:
            monthly_deliveries_change = ((monthly_deliveries - last_month_deliveries) / last_month_deliveries) * 100
        
        # Calculate total sales
        total_sales = Order.objects.filter(
            created_at__gte=current_month_start
        ).aggregate(
            total=Sum(
                F('items__quantity') * F('items__unit_price'),
                output_field=serializers.DecimalField(max_digits=10, decimal_places=2)
            )
        )['total'] or 0
        
        last_month_sales = Order.objects.filter(
            created_at__gte=last_month_start,
            created_at__lte=last_month_end
        ).aggregate(
            total=Sum(
                F('items__quantity') * F('items__unit_price'),
                output_field=serializers.DecimalField(max_digits=10, decimal_places=2)
            )
        )['total'] or 0
        
        total_sales_change = 0
        if last_month_sales > 0:
            total_sales_change = ((total_sales - last_month_sales) / last_month_sales) * 100
        
        # Calculate low stock items
        low_stock_count = Inventory.objects.filter(
            current_stock__lte=F('product__reorder_level')
        ).count()
        
        # Calculate delivery performance
        total_deliveries = Delivery.objects.filter(
            status__in=['delivered', 'cancelled'],
            delivery_date__gte=current_month_start
        ).count()
        
        on_time_deliveries = Delivery.objects.filter(
            status='delivered',
            delivery_date__gte=current_month_start
        ).count()
        
        cancelled_deliveries = Delivery.objects.filter(
            status='cancelled',
            delivery_date__gte=current_month_start
        ).count()
        
        on_time_delivery_percentage = 0
        delayed_delivery_percentage = 0
        failed_delivery_percentage = 0
        
        if total_deliveries > 0:
            on_time_delivery_percentage = (on_time_deliveries / total_deliveries) * 100
            failed_delivery_percentage = (cancelled_deliveries / total_deliveries) * 100
            delayed_delivery_percentage = 100 - on_time_delivery_percentage - failed_delivery_percentage
        
        # Get recent orders
        recent_orders = Order.objects.filter(
            created_at__gte=now - timedelta(days=1)
        ).order_by('-created_at')[:5]
        
        recent_orders_data = []
        for order in recent_orders:
            recent_orders_data.append({
                'id': order.id,
                'order_id': order.order_id,
                'store': {
                    'id': order.store.id,
                    'name': order.store.name
                },
                'status': order.status,
                'total_amount': order.total_amount
            })
        
        return {
            'today_deliveries': today_deliveries,
            'today_deliveries_change': today_deliveries_change,
            'monthly_deliveries': monthly_deliveries,
            'monthly_deliveries_change': monthly_deliveries_change,
            'total_sales': total_sales,
            'total_sales_change': total_sales_change,
            'low_stock_count': low_stock_count,
            'on_time_delivery_percentage': on_time_delivery_percentage,
            'delayed_delivery_percentage': delayed_delivery_percentage,
            'failed_delivery_percentage': failed_delivery_percentage,
            'recent_orders': recent_orders_data
        }