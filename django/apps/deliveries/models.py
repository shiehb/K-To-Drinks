import uuid
from django.db import models
from django.conf import settings
from apps.base.models import TimeStampedModel
from apps.orders.models import Order


class Delivery(TimeStampedModel):
    """
    Delivery model
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in-transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    id = models.CharField(primary_key=True, max_length=50, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='deliveries',
        limit_choices_to={'role': 'delivery_driver'}
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_date = models.DateField()
    delivery_time = models.TimeField()
    notes = models.TextField(blank=True, null=True)
    has_signature = models.BooleanField(default=False)
    signature_image = models.ImageField(upload_to='signatures/', blank=True, null=True)
    lat = models.FloatField(verbose_name="Latitude", blank=True, null=True)
    lng = models.FloatField(verbose_name="Longitude", blank=True, null=True)

    class Meta:
        verbose_name = 'Delivery'
        verbose_name_plural = 'Deliveries'
        ordering = ['-delivery_date', '-delivery_time']

    def __str__(self):
        return self.id

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"DEL-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)


class DeliveryStatusUpdate(TimeStampedModel):
    """
    Delivery status update model
    """
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name='status_updates')
    status = models.CharField(max_length=20, choices=Delivery.STATUS_CHOICES)
    notes = models.TextField(blank=True, null=True)
    update_time = models.DateTimeField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name = 'Delivery Status Update'
        verbose_name_plural = 'Delivery Status Updates'
        ordering = ['-update_time']

    def __str__(self):
        return f"{self.delivery.id} - {self.status} ({self.update_time})"

