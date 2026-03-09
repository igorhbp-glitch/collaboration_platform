from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]

# Список доступных эндпоинтов:
# GET    /api/notifications/           - список уведомлений
# GET    /api/notifications/{id}/      - детали уведомления
# POST   /api/notifications/{id}/read/ - отметить как прочитанное
# POST   /api/notifications/read_all/  - отметить все как прочитанные
# POST   /api/notifications/{id}/archive/ - архивировать
# GET    /api/notifications/unread_count/ - количество непрочитанных
# GET    /api/notifications/feed/      - лента для хедера
# POST   /api/notifications/create_notification/ - создать (для админов)