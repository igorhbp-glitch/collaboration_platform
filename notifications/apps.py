from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        """
        Импортируем сигналы при готовности приложения
        """
        import notifications.signals  # noqa