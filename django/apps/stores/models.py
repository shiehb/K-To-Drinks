from django.db import models
from apps.base.models import TimeStampedModel

class Store(TimeStampedModel):
    """
    Store model for managing local stores
    """
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    name = models.CharField(max_length=255)
    owner_name = models.CharField(max_length=255)
    address = models.TextField()
    contact = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    day = models.CharField(
        max_length=20,
        choices=DAYS_OF_WEEK,
        default='Monday'
    )
    status = models.CharField(
        max_length=20,
        choices=(
            ('Active', 'Active'),
            ('Inactive', 'Inactive'),
        ),
        default='Active'
    )
    is_archived = models.BooleanField(default=False)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    hours = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = 'Store'
        verbose_name_plural = 'Stores'
        ordering = ['name']

    def __str__(self):
        return self.name

