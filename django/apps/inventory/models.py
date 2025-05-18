# apps/inventory/models.py
from django.db import models
from django.core.validators import MinValueValidator

class InventoryTransaction(models.Model):
    INCREASE = 'increase'
    DECREASE = 'decrease'
    TRANSACTION_TYPES = [
        (INCREASE, 'Increase'),
        (DECREASE, 'Decrease'),
    ]

    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES
    )
    notes = models.TextField(blank=True, null=True)
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_transaction_type_display()} of {self.quantity} for {self.product}"

class Inventory(models.Model):
    product = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='inventory'
    )
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Inventory"

    def __str__(self):
        return f"Inventory for {self.product.name}"

    @property
    def is_low_stock(self):
        return self.stock <= self.low_stock_threshold