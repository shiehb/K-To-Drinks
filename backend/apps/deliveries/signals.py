from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Delivery, DeliveryStatusUpdate


@receiver(post_save, sender=Delivery)
def create_status_update(sender, instance, created, **kwargs):
    """Create status update when delivery is created or status changes"""
    if created:
        # Create initial status update
        DeliveryStatusUpdate.objects.create(
            delivery=instance,
            status=instance.status,
            update_time=timezone.now(),
            updated_by=instance.employee
        )
    else:
        # Check if status has changed by comparing with the latest status update
        latest_update = instance.status_updates.order_by('-update_time').first()
        if latest_update and latest_update.status != instance.status:
            DeliveryStatusUpdate.objects.create(
                delivery=instance,
                status=instance.status,
                update_time=timezone.now(),
                updated_by=instance.employee
            )

