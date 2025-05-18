from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.orders.models import Order
from apps.deliveries.models import Delivery
from apps.inventory.models import InventoryTransaction
from .models import RecentActivity


@receiver(post_save, sender=Order)
def create_order_activity(sender, instance, created, **kwargs):
    """Create activity record when an order is created or updated"""
    if created:
        RecentActivity.objects.create(
            activity_type='order',
            title=f"New order {instance.order_id}",
            description=f"New order created for {instance.store.name}",
            reference_id=instance.order_id,
            user=instance.user
        )
    elif instance.status == 'completed':
        RecentActivity.objects.create(
            activity_type='order',
            title=f"Order {instance.order_id} completed",
            description=f"Order for {instance.store.name} has been completed",
            reference_id=instance.order_id,
            user=instance.user
        )


@receiver(post_save, sender=Delivery)
def create_delivery_activity(sender, instance, created, **kwargs):
    """Create activity record when a delivery is created or updated"""
    if created:
        RecentActivity.objects.create(
            activity_type='delivery',
            title=f"New delivery {instance.id}",
            description=f"New delivery created for order {instance.order.order_id}",
            reference_id=instance.id,
            user=instance.employee
        )
    elif instance.status == 'delivered':
        RecentActivity.objects.create(
            activity_type='delivery',
            title=f"Delivery {instance.id} completed",
            description=f"Delivery for order {instance.order.order_id} has been completed",
            reference_id=instance.id,
            user=instance.employee
        )


@receiver(post_save, sender=InventoryTransaction)
def create_inventory_activity(sender, instance, created, **kwargs):
    """Create activity record when an inventory transaction is created"""
    if created:
        action = "added to" if instance.quantity > 0 else "removed from"
        RecentActivity.objects.create(
            activity_type='inventory',
            title=f"Inventory {instance.transaction_type}",
            description=f"{abs(instance.quantity)} units of {instance.product.name} {action} inventory",
            reference_id=str(instance.id),
            user=instance.user
        )

