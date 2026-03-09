from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvitationViewSet

# Создаем роутер и регистрируем ViewSet
router = DefaultRouter()
router.register(r'', InvitationViewSet, basename='invitation')

urlpatterns = [
    path('', include(router.urls)),
]

# Автоматически созданные endpoints:
# GET    /api/invitations/          - список приглашений
# POST   /api/invitations/          - создать приглашение
# GET    /api/invitations/{id}/     - детали приглашения
# PUT    /api/invitations/{id}/     - обновить приглашение
# PATCH  /api/invitations/{id}/     - частично обновить приглашение
# DELETE /api/invitations/{id}/     - удалить приглашение
# POST   /api/invitations/{id}/accept/ - принять приглашение
# POST   /api/invitations/{id}/reject/ - отклонить приглашение
# POST   /api/invitations/{id}/cancel/ - отменить приглашение
# GET    /api/invitations/sent/     - отправленные приглашения
# GET    /api/invitations/received/ - полученные приглашения