# apps/inventory/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.products.models import Product
from .models import Inventory

@receiver(post_save, sender=Product)
def create_inventory_for_product(sender, instance, created, **kwargs):
    """
    Automatically creates an inventory record when a new product is created
    """
    if created:
        Inventory.objects.create(
            product=instance,
            stock=0,  # Default to 0 stock
            low_stock_threshold=10  # Default threshold
        )