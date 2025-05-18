from django.apps import AppConfig


class DashboardConfig(AppConfig):
    name = 'apps.dashboard'
    verbose_name = 'Dashboard'

    def ready(self):
        import apps.dashboard.signals  # noqa

