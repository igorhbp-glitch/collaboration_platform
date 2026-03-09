from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationMarkReadSerializer,
    NotificationCreateSerializer
)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для работы с уведомлениями пользователя

    Доступные действия:
    - GET /api/notifications/ - список уведомлений (с пагинацией)
    - GET /api/notifications/{id}/ - детали уведомления
    - POST /api/notifications/{id}/read/ - отметить как прочитанное
    - POST /api/notifications/read_all/ - отметить все как прочитанные
    - POST /api/notifications/{id}/archive/ - архивировать
    - GET /api/notifications/unread_count/ - количество непрочитанных
    - GET /api/notifications/feed/ - лента для хедера (последние 5)
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Возвращает только уведомления текущего пользователя
        """
        return Notification.objects.filter(
            recipient=self.request.user,
            is_archived=False
        ).select_related(
            'recipient',
            'invitation',
            'project',
            'project_member',
            'task',
            'event',
            'event_participant'
        ).prefetch_related('content_type')

    def get_serializer_class(self):
        if self.action == 'create_notification':
            return NotificationCreateSerializer
        return NotificationSerializer

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """
        Отметить конкретное уведомление как прочитанное
        POST /api/notifications/{id}/read/
        """
        notification = self.get_object()
        notification.mark_as_read()

        serializer = self.get_serializer(notification)
        return Response({
            'status': 'success',
            'message': 'Уведомление отмечено как прочитанное',
            'notification': serializer.data
        })

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        """
        Отметить все уведомления пользователя как прочитанные
        POST /api/notifications/read_all/
        """
        serializer = NotificationMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get('mark_all'):
            # Отметить все как прочитанные
            updated = self.get_queryset().filter(is_read=False).update(
                is_read=True,
                read_at=timezone.now()
            )
        else:
            # Отметить только указанные
            notification_ids = serializer.validated_data.get('notification_ids', [])
            if notification_ids:
                updated = self.get_queryset().filter(
                    id__in=notification_ids,
                    is_read=False
                ).update(
                    is_read=True,
                    read_at=timezone.now()
                )
            else:
                updated = 0

        return Response({
            'status': 'success',
            'message': f'Отмечено уведомлений: {updated}',
            'updated_count': updated
        })

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Архивировать уведомление
        POST /api/notifications/{id}/archive/
        """
        notification = self.get_object()
        notification.is_archived = True
        notification.save(update_fields=['is_archived'])

        return Response({
            'status': 'success',
            'message': 'Уведомление архивировано'
        })

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Получить количество непрочитанных уведомлений
        GET /api/notifications/unread_count/
        """
        count = self.get_queryset().filter(is_read=False).count()

        return Response({
            'unread_count': count
        })

    @action(detail=False, methods=['get'])
    def feed(self, request):
        """
        Получить последние 5 уведомлений для хедера
        GET /api/notifications/feed/
        """
        notifications = self.get_queryset()[:5]
        serializer = self.get_serializer(notifications, many=True)

        unread_count = self.get_queryset().filter(is_read=False).count()

        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count,
            'total': self.get_queryset().count()
        })

    @action(detail=False, methods=['post'])
    def create_notification(self, request):
        """
        Создать уведомление вручную (для тестирования или админ-функций)
        POST /api/notifications/create_notification/
        """
        # Проверяем права (только админ или модератор)
        if not request.user.role in ['admin', 'moderator']:
            return Response(
                {'error': 'Недостаточно прав для создания уведомлений'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = NotificationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        recipient = User.objects.get(id=serializer.validated_data['recipient_id'])

        notification = Notification.objects.create(
            recipient=recipient,
            type=serializer.validated_data['type'],
            title=serializer.validated_data['title'],
            message=serializer.validated_data['message'],
            action_url=serializer.validated_data.get('action_url', ''),
            action_data=serializer.validated_data.get('action_data', {})
        )

        response_serializer = NotificationSerializer(notification)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """
        Удалить все уведомления пользователя (осторожно!)
        DELETE /api/notifications/clear_all/
        """
        # Только для отладки, можно убрать в продакшене
        if not request.user.role in ['admin', 'moderator']:
            return Response(
                {'error': 'Недостаточно прав'},
                status=status.HTTP_403_FORBIDDEN
            )

        count = self.get_queryset().delete()[0]

        return Response({
            'status': 'success',
            'message': f'Удалено уведомлений: {count}'
        })