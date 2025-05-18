from django.db import models
from apps.base.models import TimeStampedModel


class DashboardStat(TimeStampedModel):
    """
    Model to store dashboard statistics
    """
    STAT_TYPES = (
        ('sales', 'Sales'),
        ('orders', 'Orders'),
        ('deliveries', 'Deliveries'),
        ('customers', 'Customers'),
        ('products', 'Products'),
        ('inventory', 'Inventory'),
    )
    PERIOD_TYPES = (
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )
    
    title = models.CharField(max_length=100)
    stat_type = models.CharField(max_length=20, choices=STAT_TYPES)
    period = models.CharField(max_length=20, choices=PERIOD_TYPES)
    current_value = models.DecimalField(max_digits=12, decimal_places=2)
    previous_value = models.DecimalField(max_digits=12, decimal_places=2)
    percentage_change = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Dashboard Statistic'
        verbose_name_plural = 'Dashboard Statistics'
        ordering = ['stat_type', 'period']
        
    def __str__(self):
        return f"{self.title} ({self.period})"
    
    def save(self, *args, **kwargs):
        # Calculate percentage change
        if self.previous_value and self.previous_value != 0:
            self.percentage_change = ((self.current_value - self.previous_value) / self.previous_value) * 100
        else:
            self.percentage_change = 0
        super().save(*args, **kwargs)


class RecentActivity(TimeStampedModel):
    """
    Model to store recent activities for the dashboard
    """
    ACTIVITY_TYPES = (
        ('order', 'Order'),
        ('delivery', 'Delivery'),
        ('inventory', 'Inventory'),
        ('user', 'User'),
        ('store', 'Store'),
        ('product', 'Product'),
    )
    
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=100)
    description = models.TextField()
    reference_id = models.CharField(max_length=50, blank=True, null=True)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Recent Activity'
        verbose_name_plural = 'Recent Activities'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.activity_type}: {self.title}"

