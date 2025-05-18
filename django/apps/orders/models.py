from django.db import models
from django.conf import settings
from apps.base.models import TimeStampedModel
from apps.stores.models import Store
from apps.products.models import Product


class Order(TimeStampedModel):
    """
    Order model
    """
    ORDER_STATUS = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    order_id = models.CharField(max_length=12, unique=True)
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    delivery_day = models.CharField(
        max_length=20,
        choices=Store.DAYS_OF_WEEK,
        default='Monday'
    )
    status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS,
        default='Pending'
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='orders_created'
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']

    def __str__(self):
        return self.order_id

    def calculate_totals(self):
        """Calculate order totals"""
        self.subtotal = sum(item.total for item in self.items.all())
        self.tax = self.subtotal * 0.02  # 2% tax
        self.total = self.subtotal + self.tax
        self.save()


class OrderItem(TimeStampedModel):
    """
    Order item model
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f"{self.order.order_id} - {self.product.name} ({self.quantity})"

    def save(self, *args, **kwargs):
        # Calculate total
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Update order totals
        self.order.calculate_totals()

