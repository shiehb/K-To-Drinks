from django.apps import AppConfig


class DeliveriesConfig(AppConfig):
    name = 'apps.deliveries'
    verbose_name = 'Deliveries'

    def ready(self):
        import apps.deliveries.signals  # noqa

