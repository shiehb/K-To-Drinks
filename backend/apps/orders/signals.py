import uuid
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Order, OrderItem
from apps.inventory.models import InventoryTransaction


@receiver(pre_save, sender=Order)
def set_order_id(sender, instance, **kwargs):
    """Set order ID if not provided"""
    if not instance.order_id:
        # Generate a unique order ID
        instance.order_id = f"ORD-{uuid.uuid4().hex[:6].upper()}"


@receiver(post_save, sender=OrderItem)
def update_inventory(sender, instance, created, **kwargs):
    """Update inventory when order item is created"""
    if created:
        # Create inventory transaction for stock out
        InventoryTransaction.objects.create(
            product=instance.product,
            quantity=instance.quantity,
            transaction_type='out',
            reference=instance.order.order_id,
            reason=f"Order: {instance.order.order_id}",
            user=instance.order.user
        )

