from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Notification
from users.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """
    Сериализатор для уведомлений
    """
    recipient_details = UserSerializer(source='recipient', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()

    # Информация о связанном объекте
    related_object_type = serializers.SerializerMethodField()
    related_object_id = serializers.SerializerMethodField()
    related_object_title = serializers.SerializerMethodField()
    related_object_url = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'recipient_details',
            'type',
            'type_display',
            'title',
            'message',
            'action_url',
            'action_data',
            'is_read',
            'is_archived',
            'created_at',
            'read_at',
            'time_ago',
            'related_object_type',
            'related_object_id',
            'related_object_title',
            'related_object_url',
        ]
        read_only_fields = [
            'id', 'recipient', 'created_at', 'read_at',
            'related_object_type', 'related_object_id',
            'related_object_title', 'related_object_url'
        ]

    def get_time_ago(self, obj):
        """
        Возвращает строку вида "5 минут назад", "2 часа назад" и т.д.
        """
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        diff = now - obj.created_at

        if diff < timedelta(minutes=1):
            return 'только что'
        elif diff < timedelta(hours=1):
            minutes = diff.seconds // 60
            return f'{minutes} {self._pluralize(minutes, "минуту", "минуты", "минут")} назад'
        elif diff < timedelta(days=1):
            hours = diff.seconds // 3600
            return f'{hours} {self._pluralize(hours, "час", "часа", "часов")} назад'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'{days} {self._pluralize(days, "день", "дня", "дней")} назад'
        else:
            return obj.created_at.strftime('%d.%m.%Y')

    def _pluralize(self, number, one, few, many):
        """
        Вспомогательная функция для склонения слов
        """
        if number % 10 == 1 and number % 100 != 11:
            return one
        elif 2 <= number % 10 <= 4 and (number % 100 < 10 or number % 100 >= 20):
            return few
        else:
            return many

    def get_related_object_type(self, obj):
        """Тип связанного объекта (например, 'project', 'task')"""
        if obj.content_type:
            return obj.content_type.model
        return None

    def get_related_object_id(self, obj):
        """ID связанного объекта"""
        return obj.object_id

    def get_related_object_title(self, obj):
        """Заголовок/название связанного объекта"""
        related = obj.related_object
        if not related:
            return None

        # Пытаемся получить название в зависимости от типа объекта
        if hasattr(related, 'title'):
            return related.title
        elif hasattr(related, 'name'):
            return related.name
        elif hasattr(related, '__str__'):
            return str(related)
        return None

    def get_related_object_url(self, obj):
        """URL для перехода к связанному объекту"""
        related = obj.related_object
        if not related:
            return obj.action_url

        # Формируем URL в зависимости от типа
        if obj.content_type and obj.content_type.model == 'project':
            return f'/projects/{obj.object_id}'
        elif obj.content_type and obj.content_type.model == 'task':
            return f'/projects/{related.project.id}/tasks/{obj.object_id}'
        elif obj.content_type and obj.content_type.model == 'invitation':
            return '/my-invitations'
        elif obj.content_type and obj.content_type.model == 'event':
            return f'/events/{obj.object_id}'

        return obj.action_url


class NotificationCreateSerializer(serializers.Serializer):
    """
    Сериализатор для создания уведомлений (через API, если нужно)
    """
    recipient_id = serializers.IntegerField()
    type = serializers.ChoiceField(choices=Notification.Type.choices)
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    action_url = serializers.CharField(required=False, allow_blank=True)
    action_data = serializers.JSONField(required=False, default=dict)

    def validate_recipient_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Пользователь не найден')
        return value


class NotificationMarkReadSerializer(serializers.Serializer):
    """
    Сериализатор для отметки уведомлений как прочитанных
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    mark_all = serializers.BooleanField(default=False)