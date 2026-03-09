from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Notification(models.Model):
    """
    Универсальная модель для всех уведомлений в системе
    """

    class Type(models.TextChoices):
        # Приглашения (из invitations)
        INVITATION_RECEIVED = 'invitation_received', 'Приглашение в проект'
        INVITATION_ACCEPTED = 'invitation_accepted', 'Приглашение принято'
        INVITATION_REJECTED = 'invitation_rejected', 'Приглашение отклонено'
        INVITATION_CANCELLED = 'invitation_cancelled', 'Приглашение отменено'

        # Заявки в проекты (из projects)
        PROJECT_JOIN_REQUEST = 'project_join_request', 'Заявка на вступление'
        PROJECT_JOIN_APPROVED = 'project_join_approved', 'Заявка одобрена'
        PROJECT_JOIN_REJECTED = 'project_join_rejected', 'Заявка отклонена'

        # Задачи (из projects)
        TASK_ASSIGNED = 'task_assigned', 'Назначена задача'
        TASK_COMPLETED = 'task_completed', 'Задача выполнена'
        TASK_UPDATED = 'task_updated', 'Задача обновлена'
        TASK_COMMENT = 'task_comment', 'Новый комментарий к задаче'

        # Мероприятия (из conferences)
        EVENT_REGISTRATION_OPEN = 'event_registration_open', 'Открыта регистрация'
        EVENT_REMINDER = 'event_reminder', 'Напоминание о мероприятии'
        EVENT_PARTICIPATION_REQUEST = 'event_participation_request', 'Заявка на участие'
        EVENT_PARTICIPATION_APPROVED = 'event_participation_approved', 'Заявка одобрена'
        EVENT_PARTICIPATION_REJECTED = 'event_participation_rejected', 'Заявка отклонена'
        EVENT_SCHEDULE_CHANGED = 'event_schedule_changed', 'Изменение в программе'

        # Системные
        SYSTEM_ANNOUNCEMENT = 'system_announcement', 'Объявление'

    # Кому
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Получатель',
        db_index=True
    )

    # Что за уведомление
    type = models.CharField(
        max_length=50,
        choices=Type.choices,
        verbose_name='Тип уведомления',
        db_index=True
    )

    # Заголовок и текст
    title = models.CharField(max_length=255, verbose_name='Заголовок')
    message = models.TextField(verbose_name='Текст уведомления')

    # Ссылки на связанные объекты (полиморфные связи)
    # Это позволяет привязывать уведомление к любому объекту: Invitation, ProjectMember, Task и т.д.
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    # Явные связи (для удобства и производительности)
    invitation = models.ForeignKey(
        'invitations.Invitation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    project_member = models.ForeignKey(
        'projects.ProjectMember',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    task = models.ForeignKey(
        'projects.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    event = models.ForeignKey(
        'conferences.Event',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    event_participant = models.ForeignKey(
        'conferences.EventParticipant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )

    # Данные для действий
    action_url = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='URL для перехода'
    )
    action_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Дополнительные данные для действия'
    )

    # Статусы
    is_read = models.BooleanField(
        default=False,
        verbose_name='Прочитано',
        db_index=True
    )
    is_archived = models.BooleanField(
        default=False,
        verbose_name='В архиве',
        db_index=True
    )

    # Даты
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания',
        db_index=True
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата прочтения'
    )

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'type']),
        ]

    def __str__(self):
        return f'{self.get_type_display()} для {self.recipient.email}'

    def mark_as_read(self):
        """Отметить уведомление как прочитанное"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def mark_as_unread(self):
        """Отметить уведомление как непрочитанное"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])

    @property
    def related_object(self):
        """Получить связанный объект (удобно для шаблонов)"""
        if self.content_type and self.object_id:
            return self.content_type.get_object_for_this_type(id=self.object_id)
        return None