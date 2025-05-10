# apps/orders/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order

@receiver(post_save, sender=Order)
def update_inventory_on_order(sender, instance, created, **kwargs):
    if created:
        from apps.inventory.models import InventoryTransaction  # Local import
        # Your signal logic here