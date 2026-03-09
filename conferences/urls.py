# conferences/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Создаём роутер для ViewSet'ов
router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'sections', views.SectionViewSet, basename='section')
router.register(r'participants', views.ParticipantViewSet, basename='participant')
router.register(r'news', views.NewsViewSet, basename='news')
router.register(r'materials', views.MaterialViewSet, basename='material')
router.register(r'schedule', views.ScheduleItemViewSet, basename='schedule')

urlpatterns = [
    # Все маршруты от роутера
    path('', include(router.urls)),

    # Дополнительные специфичные маршруты
    path('events/<int:event_id>/participate/',
         views.ParticipantViewSet.as_view({'post': 'participate'}),
         name='event-participate'),

    # Маршрут для загрузки обложки мероприятия
    path('events/<int:pk>/upload-cover/',
         views.EventViewSet.as_view({'post': 'upload_cover'}),
         name='event-upload-cover'),

    # 🔥 НОВЫЙ МАРШРУТ ДЛЯ ЗАГРУЗКИ ОБЛОЖКИ СЕКЦИИ
    path('sections/<int:pk>/upload-cover/',
         views.SectionViewSet.as_view({'post': 'upload_cover'}),
         name='section-upload-cover'),

    # 🔥 НОВЫЙ МАРШРУТ ДЛЯ ОБНОВЛЕНИЯ СПИСКА ИЗОБРАЖЕНИЙ СЕКЦИИ
    path('sections/<int:pk>/update-cover-images/',
         views.SectionViewSet.as_view({'patch': 'update_cover_images'}),
         name='section-update-cover-images'),

    # Маршрут для загрузки файлов участников
    path('events/<int:pk>/upload-participation-file/',
         views.EventViewSet.as_view({'post': 'upload_participation_file'}),
         name='event-upload-participation-file'),

    # Эндпоинт для массового обновления ролей
    path('events/<int:pk>/update_roles/',
         views.EventViewSet.as_view({'post': 'update_roles'}),
         name='event-update-roles'),

    # Маршруты для документов мероприятия
    path('events/<int:pk>/documents/',
         views.EventViewSet.as_view({'get': 'documents'}),
         name='event-documents'),
    path('events/<int:pk>/upload-document/',
         views.EventViewSet.as_view({'post': 'upload_document'}),
         name='event-upload-document'),
    path('events/<int:pk>/documents/<str:document_id>/',
         views.EventViewSet.as_view({'delete': 'delete_document'}),
         name='event-delete-document'),

    # Тестовый эндпоинт
    path('test/', views.test, name='conferences-test'),
]