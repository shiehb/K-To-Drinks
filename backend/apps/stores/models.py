from django.db import models
from apps.base.models import TimeStampedModel


class Store(TimeStampedModel):
    """
    Store model for managing local stores
    """
    name = models.CharField(max_length=255)
    location = models.TextField()
    lat = models.FloatField(verbose_name="Latitude")
    lng = models.FloatField(verbose_name="Longitude")
    owner_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    number = models.CharField(max_length=20)
    day = models.CharField(max_length=20, choices=(
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ))
    is_archived = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Store'
        verbose_name_plural = 'Stores'
        ordering = ['name']

    def __str__(self):
        return self.name

