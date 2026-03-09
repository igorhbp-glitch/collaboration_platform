from django.db import models
from django.conf import settings
from django.utils import timezone

ROLE_CHOICES = [
    ('product_owner', 'Product Owner (Научный руководитель)'),
    ('scrum_master', 'Scrum Master (Менеджер проекта)'),
    ('lead_researcher', 'Lead Researcher (Ведущий исследователь)'),
    ('researcher', 'Researcher (Исследователь)'),
    ('analyst', 'Analyst (Аналитик)'),
    ('writer', 'Writer (Автор текста)'),
    ('reviewer', 'Reviewer (Рецензент)'),
    ('editor', 'Editor (Редактор)'),
    ('assistant', 'Assistant (Ассистент)'),
    ('viewer', 'Viewer (Наблюдатель)'),
]

class Invitation(models.Model):
    """
    Модель для хранения приглашений в проекты
    """
    # Статусы приглашения
    STATUS_CHOICES = [
        ('pending', 'Ожидает решения'),
        ('accepted', 'Принято'),
        ('rejected', 'Отклонено'),
        ('cancelled', 'Отменено'),
    ]

    # Типы приглашений (можно расширять)
    TYPE_CHOICES = [
        ('project', 'Приглашение в проект'),
        ('collaboration', 'Предложение о сотрудничестве'),
        ('mentorship', 'Запрос на менторство'),
    ]

    # Основные поля
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations',
        verbose_name='Отправитель'
    )

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_invitations',
        verbose_name='Получатель'
    )

    # Связь с проектом (пока может быть пустым)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invitations',
        verbose_name='Проект'
    )

    # Детали приглашения
    invitation_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='collaboration',
        verbose_name='Тип приглашения'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )

    message = models.TextField(
        verbose_name='Сообщение',
        help_text='Персональное сообщение для получателя'
    )

    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        default='researcher',
        verbose_name='Роль в проекте'
    )

    # Даты
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name='Дата создания'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата ответа'
    )

    # Метаданные
    class Meta:
        verbose_name = 'Приглашение'
        verbose_name_plural = 'Приглашения'
        ordering = ['-created_at']  # Сначала новые
        constraints = [
            # Один пользователь не может отправить несколько активных приглашений одному и тому же пользователю
            models.UniqueConstraint(
                fields=['sender', 'receiver', 'project'],
                condition=models.Q(status='pending'),
                name='unique_pending_invitation'
            )
        ]

    def __str__(self):
        return f'{self.sender} → {self.receiver} ({self.status})'

    def accept(self):
        """Метод для принятия приглашения"""
        from projects.models import ProjectMember
        from django.utils import timezone

        self.status = 'accepted'
        self.responded_at = timezone.now()
        self.save()

        # Если это приглашение в проект, создаем участника
        if self.invitation_type == 'project' and self.project:
            # Проверяем, не является ли уже участником
            if not ProjectMember.objects.filter(
                    project=self.project,
                    user=self.receiver
            ).exists():
                # Используем роль из приглашения
                role = self.role if self.role else 'researcher'

                # Создаем участника проекта
                ProjectMember.objects.create(
                    project=self.project,
                    user=self.receiver,
                    role=role,
                    status='approved',  # ← ДОБАВИТЬ ЭТУ СТРОКУ!
                    joined_at=timezone.now(),  # ← ДОБАВИТЬ
                    invited_by=self.sender,
                    can_edit_project=False,
                    can_invite_members=False,
                    can_create_tasks=True,
                    can_manage_tasks=False,
                    can_delete_project=False
                )

    def reject(self):
        """Метод для отклонения приглашения"""
        self.status = 'rejected'
        self.responded_at = timezone.now()
        self.save()

    def cancel(self):
        """Метод для отмены приглашения (отправителем)"""
        self.status = 'cancelled'
        self.responded_at = timezone.now()
        self.save()

    def is_expired(self):
        """Проверка, истекло ли приглашение (например, через 30 дней)"""
        expiration_date = self.created_at + timezone.timedelta(days=30)
        return timezone.now() > expiration_date and self.status == 'pending'