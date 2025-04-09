from django.db import models
from django.conf import settings
from apps.base.models import TimeStampedModel
from apps.products.models import Product


class Inventory(TimeStampedModel):
    """
    Inventory model for tracking product stock
    """
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)
    last_checked = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Inventory'
        verbose_name_plural = 'Inventory'
        
    def __str__(self):
        return f"{self.product.name} - {self.quantity} units"
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level


class InventoryTransaction(TimeStampedModel):
    """
    Inventory transaction model for tracking stock changes
    """
    TRANSACTION_TYPES = (
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='transactions')
    quantity = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    reference = models.CharField(max_length=100, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='inventory_transactions')

    class Meta:
        verbose_name = 'Inventory Transaction'
        verbose_name_plural = 'Inventory Transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type} - {self.product.name} ({self.quantity})"

    def save(self, *args, **kwargs):
        # Update product stock quantity
        if self.transaction_type == 'in':
            self.product.stock_quantity += self.quantity
        elif self.transaction_type == 'out':
            self.product.stock_quantity -= self.quantity
        else:  # adjustment
            self.product.stock_quantity += self.quantity  # Can be negative for reduction

        self.product.save()
        
        # Update inventory record
        inventory, created = Inventory.objects.get_or_create(product=self.product)
        if self.transaction_type == 'in':
            inventory.quantity += self.quantity
        elif self.transaction_type == 'out':
            inventory.quantity -= self.quantity
        else:  # adjustment
            inventory.quantity += self.quantity
        
        inventory.save()
        
        super().save(*args, **kwargs)


class ProductExpiry(TimeStampedModel):
    """
    Product expiry tracking
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='expiry_records')
    batch_number = models.CharField(max_length=100)
    quantity = models.IntegerField()
    expiry_date = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Product Expiry'
        verbose_name_plural = 'Product Expiries'
        ordering = ['expiry_date']

    def __str__(self):
        return f"{self.product.name} - {self.batch_number} (Expires: {self.expiry_date})"

