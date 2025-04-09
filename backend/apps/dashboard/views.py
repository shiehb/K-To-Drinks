from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order
from apps.deliveries.models import Delivery
from apps.products.models import Product
from apps.inventory.models import InventoryTransaction
from .models import DashboardStat, RecentActivity
from django.db.models import F


class DashboardSummaryView(generics.GenericAPIView):
    """
    API view to get dashboard summary data
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get current date and time
        now = timezone.now()
        today = now.date()
        
        # Get stats from the database if available
        stats = DashboardStat.objects.filter(is_active=True)
        
        # Calculate summary data if no stats are available
        if not stats.exists():
            # Orders summary
            today_orders = Order.objects.filter(created_at__date=today).count()
            yesterday_orders = Order.objects.filter(created_at__date=today - timedelta(days=1)).count()
            
            # Deliveries summary
            today_deliveries = Delivery.objects.filter(delivery_date=today).count()
            pending_deliveries = Delivery.objects.filter(status='pending').count()
            
            # Products summary
            low_stock_products = Product.objects.filter(stock_quantity__lte=F('reorder_level')).count()
            
            # Sales summary
            today_sales = Order.objects.filter(created_at__date=today).aggregate(total=Sum('total_amount'))['total'] or 0
            yesterday_sales = Order.objects.filter(created_at__date=today - timedelta(days=1)).aggregate(total=Sum('total_amount'))['total'] or 0
            
            summary_data = {
                'orders': {
                    'today': today_orders,
                    'yesterday': yesterday_orders,
                    'percentage_change': self._calculate_percentage_change(today_orders, yesterday_orders),
                },
                'deliveries': {
                    'today': today_deliveries,
                    'pending': pending_deliveries,
                },
                'products': {
                    'low_stock': low_stock_products,
                },
                'sales': {
                    'today': today_sales,
                    'yesterday': yesterday_sales,
                    'percentage_change': self._calculate_percentage_change(today_sales, yesterday_sales),
                }
            }
        else:
            # Use pre-calculated stats
            summary_data = {
                'orders': {},
                'deliveries': {},
                'products': {},
                'sales': {},
            }
            
            for stat in stats:
                if stat.stat_type == 'orders':
                    summary_data['orders'][stat.period] = stat.value
                elif stat.stat_type == 'deliveries':
                    summary_data['deliveries'][stat.period] = stat.value
                elif stat.stat_type == 'products':
                    summary_data['products'][stat.period] = stat.value
                elif stat.stat_type == 'sales':
                    summary_data['sales'][stat.period] = stat.value
        
        # Get recent activities
        recent_activities = RecentActivity.objects.all()[:10]
        activities_data = [
            {
                'id': activity.id,
                'type': activity.activity_type,
                'title': activity.title,
                'description': activity.description,
                'reference_id': activity.reference_id,
                'user': activity.user.get_full_name() if activity.user else None,
                'created_at': activity.created,
            }
            for activity in recent_activities
        ]
        
        return Response({
            'summary': summary_data,
            'recent_activities': activities_data,
        })
    
    def _calculate_percentage_change(self, current, previous):
        """Calculate percentage change between two values"""
        if previous == 0:
            return 0
        return ((current - previous) / previous) * 100


class SalesDataView(generics.GenericAPIView):
    """
    API view to get sales data for charts
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        period = request.query_params.get('period', 'week')
        
        if period == 'week':
            return self._get_weekly_data()
        elif period == 'month':
            return self._get_monthly_data()
        elif period == 'year':
            return self._get_yearly_data()
        else:
            return Response({'error': 'Invalid period'}, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_weekly_data(self):
        """Get sales data for the past week"""
        now = timezone.now()
        start_date = now - timedelta(days=7)
        
        # Get daily sales for the past week
        sales_data = []
        for i in range(7):
            date = start_date + timedelta(days=i)
            sales = Order.objects.filter(created_at__date=date.date()).aggregate(total=Sum('total_amount'))['total'] or 0
            sales_data.append({
                'date': date.date().strftime('%Y-%m-%d'),
                'sales': sales,
            })
        
        return Response({
            'period': 'week',
            'data': sales_data,
        })
    
    def _get_monthly_data(self):
        """Get sales data for the past month"""
        now = timezone.now()
        start_date = now - timedelta(days=30)
        
        # Group sales by day for the past month
        sales_data = []
        for i in range(30):
            date = start_date + timedelta(days=i)
            sales = Order.objects.filter(created_at__date=date.date()).aggregate(total=Sum('total_amount'))['total'] or 0
            sales_data.append({
                'date': date.date().strftime('%Y-%m-%d'),
                'sales': sales,
            })
        
        return Response({
            'period': 'month',
            'data': sales_data,
        })
    
    def _get_yearly_data(self):
        """Get sales data for the past year"""
        now = timezone.now()
        
        # Group sales by month for the past year
        sales_data = []
        for i in range(12):
            month = now.month - i
            year = now.year
            if month <= 0:
                month += 12
                year -= 1
            
            start_date = timezone.datetime(year, month, 1)
            if month == 12:
                end_date = timezone.datetime(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = timezone.datetime(year, month + 1, 1) - timedelta(days=1)
            
            sales = Order.objects.filter(
                created_at__date__gte=start_date.date(),
                created_at__date__lte=end_date.date()
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            sales_data.append({
                'month': start_date.strftime('%Y-%m'),
                'sales': sales,
            })
        
        # Reverse to get chronological order
        sales_data.reverse()
        
        return Response({
            'period': 'year',
            'data': sales_data,
        })

