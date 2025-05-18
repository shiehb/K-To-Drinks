# apps/products/models.py
from django.db import models
from apps.base.models import TimeStampedModel

class Product(TimeStampedModel):
    product_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    size = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='products/', blank=True, null=True) 

    class Meta:
        ordering = ['name']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return f"{self.name} ({self.size})" if self.size else self.name

    @property
    def current_stock(self):
        """Returns the inventory stock if exists, otherwise 0"""
        if hasattr(self, 'inventory'):
            return self.inventory.stock
        return 0

    @property
    def is_low_stock(self):
        """Returns True if inventory exists and is low stock"""
        if hasattr(self, 'inventory'):
            return self.inventory.is_low_stock
        return False