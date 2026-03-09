# projects/models.py - ИСПРАВЛЕННАЯ ВЕРСИЯ С ДОПОЛНИТЕЛЬНЫМИ ИНДЕКСАМИ
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import os  # Добавлен импорт для работы с путями файлов


class Project(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Черновик')
        RECRUITING = 'recruiting', _('Набор участников')
        ACTIVE = 'active', _('Активный')
        COMPLETED = 'completed', _('Завершен')
        ON_HOLD = 'on_hold', _('На паузе')
        ARCHIVED = 'archived', _('В архиве')

    class Type(models.TextChoices):
        RESEARCH_PAPER = 'research_paper', _('Научная статья')
        DISSERTATION = 'dissertation', _('Диссертация')
        GRANT = 'grant', _('Грантовый проект')
        CONFERENCE = 'conference', _('Подготовка к конференции')
        BOOK = 'book', _('Книга/Монография')
        CREATIVE = 'creative', _('Творческий проект')
        OTHER = 'other', _('Другое')

    title = models.CharField(max_length=255, verbose_name=_("Название проекта"))
    description = models.TextField(verbose_name=_("Описание"))
    project_type = models.CharField(
        max_length=50,
        choices=Type.choices,
        default=Type.RESEARCH_PAPER,
        verbose_name=_("Тип проекта")
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects',
        verbose_name=_("Владелец")
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name=_("Статус")
    )

    scientific_field = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Научная область"),
        help_text=_("Например: ИИ, Биоинформатика, Экономика")
    )
    required_competencies = models.JSONField(
        default=list,
        verbose_name=_("Требуемые компетенции"),
        help_text=_("Список необходимых навыков и компетенций")
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Теги"),
        help_text=_("Ключевые слова для поиска")
    )

    max_members = models.PositiveIntegerField(
        default=10,
        verbose_name=_("Максимум участников"),
        help_text=_("0 = без ограничений")
    )
    is_private = models.BooleanField(
        default=False,
        verbose_name=_("Закрытый проект"),
        help_text=_("Только по приглашению")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Срок сдачи")
    )

    current_sprint = models.ForeignKey(
        'Sprint',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_in_projects',
        verbose_name=_("Текущий спринт")
    )

    # 🔥 НОВОЕ ПОЛЕ ДЛЯ ПЛАНИРОВАНИЯ СПРИНТОВ
    total_sprints = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Всего спринтов"),
        help_text=_("Общее количество спринтов, запланированных для проекта")
    )

    # 🔥 НОВОЕ ПОЛЕ ДЛЯ ХРАНЕНИЯ НАЗВАНИЙ СПРИНТОВ
    sprint_titles = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Названия спринтов"),
        help_text=_("Список названий спринтов в порядке их выполнения")
    )

    # 🔥 ПОЛЕ ДЛЯ ССЫЛКИ НА КОНФЕРЕНЦИЮ VK
    conference_link = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="Ссылка на конференцию VK",
        help_text="Автоматически создаётся при создании проекта через VK API"
    )

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    @property
    def member_count(self):
        return self.members.count()

    @property
    def tasks_count(self):
        return self.tasks.count()

    @property
    def completed_tasks_count(self):
        return self.tasks.filter(status=Task.Status.DONE).count()

    @property
    def progress(self):
        total_tasks = self.tasks_count
        if total_tasks == 0:
            return 0
        return int((self.completed_tasks_count / total_tasks) * 100)

    class Meta:
        verbose_name = _("Проект")
        verbose_name_plural = _("Проекты")
        ordering = ['-created_at']
        # 🔥 ДОБАВЛЕНЫ ИНДЕКСЫ ДЛЯ ПРОЕКТОВ
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['is_private', 'status']),
        ]


class ProjectMember(models.Model):
    class Role(models.TextChoices):
        PRODUCT_OWNER = 'product_owner', _('Product Owner (Научный руководитель)')
        SCRUM_MASTER = 'scrum_master', _('Scrum Master (Менеджер проекта)')
        LEAD_RESEARCHER = 'lead_researcher', _('Lead Researcher (Ведущий исследователь)')
        RESEARCHER = 'researcher', _('Researcher (Исследователь)')
        ANALYST = 'analyst', _('Analyst (Аналитик)')
        WRITER = 'writer', _('Writer (Автор текста)')
        REVIEWER = 'reviewer', _('Reviewer (Рецензент)')
        EDITOR = 'editor', _('Editor (Редактор)')
        ASSISTANT = 'assistant', _('Assistant (Ассистент)')
        VIEWER = 'viewer', _('Viewer (Наблюдатель)')

    class MemberStatus(models.TextChoices):
        PENDING = 'pending', _('Ожидает подтверждения')
        APPROVED = 'approved', _('Участник')
        REJECTED = 'rejected', _('Отклонен')
        CANCELLED = 'cancelled', _('Отменено')

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name=_("Проект")
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships',
        verbose_name=_("Пользователь")
    )
    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.RESEARCHER,
        verbose_name=_("Роль")
    )

    # ========== НОВЫЕ ПОЛЯ ==========
    status = models.CharField(
        max_length=20,
        choices=MemberStatus.choices,
        default=MemberStatus.PENDING,
        verbose_name=_("Статус")
    )
    message = models.TextField(
        blank=True,
        verbose_name=_("Сопроводительное письмо")
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_invitations_sent',
        verbose_name=_("Пригласил")
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='project_reviews_done',
        verbose_name=_("Рассмотрел")
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Дата рассмотрения")
    )
    rejection_reason = models.TextField(
        blank=True,
        verbose_name=_("Причина отказа")
    )
    joined_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Дата вступления")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата подачи заявки")
    )
    # ================================

    # Права (были и остаются)
    can_edit_project = models.BooleanField(
        default=False,
        verbose_name=_("Может редактировать проект")
    )
    can_invite_members = models.BooleanField(
        default=False,
        verbose_name=_("Может приглашать участников")
    )
    can_create_tasks = models.BooleanField(
        default=True,
        verbose_name=_("Может создавать задачи")
    )
    can_manage_tasks = models.BooleanField(
        default=False,
        verbose_name=_("Может управлять задачами")
    )
    can_delete_project = models.BooleanField(
        default=False,
        verbose_name=_("Может удалять проект")
    )

    joined_at_old = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата вступления (старое поле)")
    )  # позже удалим, пока оставим для совместимости

    invited_by_old = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invited_project_members',
        verbose_name=_("Приглашен пользователем (старое поле)")
    )

    def __str__(self):
        return f"{self.user.email} в '{self.project.title}' ({self.get_role_display()})"

    class Meta:
        unique_together = ['project', 'user']
        verbose_name = _("Участник проекта")
        verbose_name_plural = _("Участники проектов")
        ordering = ['-created_at']
        # 🔥 ДОБАВЛЕНЫ ИНДЕКСЫ ДЛЯ УЧАСТНИКОВ
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]


class Sprint(models.Model):
    class Status(models.TextChoices):
        PLANNING = 'planning', _('Планирование')
        ACTIVE = 'active', _('Активный')
        COMPLETED = 'completed', _('Завершен')
        CANCELLED = 'cancelled', _('Отменен')

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='sprints',
        verbose_name=_("Проект")
    )
    title = models.CharField(max_length=200, verbose_name=_("Название спринта"))
    description = models.TextField(blank=True, verbose_name=_("Описание"))
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNING,
        verbose_name=_("Статус")
    )
    start_date = models.DateField(verbose_name=_("Дата начала"))
    end_date = models.DateField(verbose_name=_("Дата окончания"))
    goal = models.TextField(verbose_name=_("Цель спринта"))

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Дата создания"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Дата обновления"))

    def __str__(self):
        return f"{self.title} ({self.start_date} - {self.end_date})"

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days + 1

    @property
    def progress(self):
        if self.status == self.Status.COMPLETED:
            return 100

        if self.status == self.Status.ACTIVE:
            today = timezone.now().date()
            total_days = self.duration_days
            passed_days = (today - self.start_date).days + 1

            if passed_days <= 0:
                return 0
            elif passed_days >= total_days:
                return 100
            else:
                return int((passed_days / total_days) * 100)

        return 0

    class Meta:
        ordering = ['start_date']
        verbose_name = _("Спринт")
        verbose_name_plural = _("Спринты")
        # 🔥 ДОБАВЛЕНЫ ИНДЕКСЫ ДЛЯ СПРИНТОВ
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['project', 'start_date']),
            models.Index(fields=['status', 'start_date']),
        ]


class Task(models.Model):
    class Status(models.TextChoices):
        BACKLOG = 'backlog', _('Бэклог')
        TODO = 'todo', _('К выполнению')
        IN_PROGRESS = 'in_progress', _('В работе')
        REVIEW = 'review', _('На проверке')
        DONE = 'done', _('Выполнено')
        CANCELLED = 'cancelled', _('Отменено')

    class Priority(models.TextChoices):
        LOW = 'low', _('Низкий')
        MEDIUM = 'medium', _('Средний')
        HIGH = 'high', _('Высокий')
        CRITICAL = 'critical', _('Критический')

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name=_("Проект")
    )
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        verbose_name=_("Спринт")
    )
    title = models.CharField(max_length=200, verbose_name=_("Название задачи"))
    description = models.TextField(blank=True, verbose_name=_("Описание"))
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BACKLOG,
        verbose_name=_("Статус")
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name=_("Приоритет")
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        verbose_name=_("Исполнитель")
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Срок выполнения")
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Дата завершения")
    )
    estimated_hours = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Оценка в часах")
    )
    actual_hours = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Фактические часы")
    )
    position = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Позиция")
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Теги")
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Дата создания"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Дата обновления"))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks',
        verbose_name=_("Создатель")
    )

    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title}"

    def save(self, *args, **kwargs):
        if self.status == self.Status.DONE and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != self.Status.DONE and self.completed_at:
            self.completed_at = None
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        if self.due_date and self.status != self.Status.DONE:
            return self.due_date < timezone.now().date()
        return False

    class Meta:
        ordering = ['position', '-priority', 'due_date', 'created_at']
        verbose_name = _("Задача")
        verbose_name_plural = _("Задачи")
        # 🔥 ДОБАВЛЕНЫ ИНДЕКСЫ ДЛЯ ЗАДАЧ
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['sprint', 'status']),
            models.Index(fields=['assignee', 'status']),
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['project', 'sprint']),
        ]


class Comment(models.Model):
    """
    Комментарии к задачам с поддержкой файлов
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_("Задача")
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_comments',
        verbose_name=_("Автор")
    )
    text = models.TextField(verbose_name=_("Текст комментария"))

    # Поле для прикрепленных файлов
    attachments = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Вложения"),
        help_text=_("Список прикрепленных файлов")
    )

    parent_comment = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name=_("Родительский комментарий")
    )

    edited_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Дата редактирования")
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата создания")
    )

    class Meta:
        verbose_name = _("Комментарий")
        verbose_name_plural = _("Комментарии")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['task', 'created_at']),
            models.Index(fields=['author', 'created_at']),
            # 🔥 ДОБАВЛЕНЫ НОВЫЕ ИНДЕКСЫ ДЛЯ КОММЕНТАРИЕВ
            models.Index(fields=['task', 'author']),
            models.Index(fields=['parent_comment']),
        ]

    def __str__(self):
        task_title = self.task.title[:30] + "..." if len(self.task.title) > 30 else self.task.title
        return f"Комментарий {self.id} к задаче '{task_title}'"

    @property
    def is_edited(self):
        return self.edited_at is not None

    @property
    def has_attachments(self):
        return len(self.attachments) > 0

    @property
    def attachments_count(self):
        return len(self.attachments)

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                original = Comment.objects.get(pk=self.pk)
                if original.text != self.text:
                    self.edited_at = timezone.now()
            except Comment.DoesNotExist:
                pass
        super().save(*args, **kwargs)


class ProjectChatMessage(models.Model):
    """
    Модель для сообщений в общем чате проекта.
    Все участники проекта могут видеть и отправлять сообщения.
    Поддерживает текстовые сообщения, вложения файлов и ответы на сообщения.
    """

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        verbose_name=_("Проект")
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_chat_messages',
        verbose_name=_("Автор")
    )

    text = models.TextField(
        verbose_name=_("Текст сообщения"),
        blank=True,  # Может быть пустым, если есть только файлы
        help_text=_("Текстовое содержимое сообщения")
    )

    # Вложения для сообщений чата (аналогично комментариям к задачам)
    attachments = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Вложения"),
        help_text=_("Список прикрепленных файлов в формате JSON")
    )

    # Дата и время создания сообщения
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата отправки")
    )

    # Дата и время последнего редактирования
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Дата редактирования")
    )

    # Система отметок о прочтении - храним ID пользователей, прочитавших сообщение
    read_by = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Прочитано пользователями"),
        help_text=_("Список ID пользователей, которые прочитали это сообщение")
    )

    # Родительское сообщение (для ответов и тредов)
    parent_message = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name=_("Ответ на сообщение")
    )

    class Meta:
        verbose_name = _("Сообщение чата")
        verbose_name_plural = _("Сообщения чата")
        # Важно: сортируем от старых к новым для правильной хронологии
        ordering = ['created_at']
        # 🔥 ДОБАВЛЕНЫ НОВЫЕ ИНДЕКСЫ ДЛЯ ЧАТА
        indexes = [
            models.Index(fields=['project', 'created_at']),
            models.Index(fields=['author', 'created_at']),
            models.Index(fields=['parent_message']),
            # 🔥 НОВЫЕ ИНДЕКСЫ:
            models.Index(fields=['project', 'author']),  # Для фильтрации по проекту и автору
            models.Index(fields=['project', '-created_at']),  # Для обратной сортировки
        ]

    def __str__(self):
        """Строковое представление сообщения"""
        author_name = self.author.email or f"Пользователь {self.author.id}"
        text_preview = self.text[:30] + "..." if len(self.text) > 30 else self.text
        return f"{author_name}: {text_preview}"

    @property
    def has_attachments(self):
        """Проверяет, есть ли у сообщения вложения"""
        return len(self.attachments) > 0

    @property
    def attachments_count(self):
        """Возвращает количество вложений"""
        return len(self.attachments)

    @property
    def read_count(self):
        """Возвращает количество пользователей, прочитавших сообщение"""
        return len(self.read_by)

    @property
    def is_reply(self):
        """Проверяет, является ли сообщение ответом на другое сообщение"""
        return self.parent_message is not None

    @property
    def reply_count(self):
        """Возвращает количество ответов на это сообщение"""
        return self.replies.count()

    def mark_as_read(self, user_id):
        """
        Отмечает сообщение как прочитанное пользователем.

        Args:
            user_id (int): ID пользователя, который прочитал сообщение

        Returns:
            bool: True если отметка была добавлена, False если уже была
        """
        if user_id not in self.read_by:
            self.read_by.append(user_id)
            self.save(update_fields=['read_by'])
            return True
        return False

    def mark_as_unread(self, user_id):
        """
        Убирает отметку о прочтении у пользователя.

        Args:
            user_id (int): ID пользователя

        Returns:
            bool: True если отметка была убрана, False если не было
        """
        if user_id in self.read_by:
            self.read_by.remove(user_id)
            self.save(update_fields=['read_by'])
            return True
        return False

    def save(self, *args, **kwargs):
        """
        Переопределяем save для автоматической отметки автора как прочитавшего.
        """
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # Если это новое сообщение, автор автоматически его прочитал
        if is_new and self.author_id:
            self.mark_as_read(self.author_id)


class CollaborationMatch(models.Model):
    user_from = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_matches',
        verbose_name=_("От пользователя")
    )
    user_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_matches',
        verbose_name=_("К пользователю")
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name=_("Проект")
    )
    match_score = models.FloatField(verbose_name=_("Оценка совместимости"))
    compatibility_factors = models.JSONField(
        default=dict,
        verbose_name=_("Факторы совместимости")
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Дата создания"))

    class Meta:
        unique_together = ['user_from', 'user_to', 'project']
        verbose_name = _("Совместимость")
        verbose_name_plural = _("Совместимости")
        # 🔥 ДОБАВЛЕНЫ ИНДЕКСЫ
        indexes = [
            models.Index(fields=['user_from', 'match_score']),
            models.Index(fields=['user_to', 'match_score']),
        ]


class ProjectDocument(models.Model):
    """
    Модель для хранения документов проекта
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name=_("Проект")
    )
    file = models.FileField(
        upload_to='project_documents/%Y/%m/%d/',
        verbose_name=_("Файл")
    )
    name = models.CharField(
        max_length=255,
        verbose_name=_("Название файла")
    )
    size = models.PositiveIntegerField(
        verbose_name=_("Размер файла (байты)")
    )
    extension = models.CharField(
        max_length=50,
        verbose_name=_("Расширение")
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_documents',
        verbose_name=_("Загрузил")
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата загрузки")
    )

    class Meta:
        verbose_name = _("Документ проекта")
        verbose_name_plural = _("Документы проекта")
        ordering = ['-uploaded_at']
        # 🔥 ДОБАВЛЕНЫ ИНДЕКСЫ
        indexes = [
            models.Index(fields=['project', 'uploaded_at']),
            models.Index(fields=['uploaded_by', 'uploaded_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.project.title})"

    def save(self, *args, **kwargs):
        # Автоматически заполняем поля name, size, extension при сохранении
        if self.file and not self.name:
            self.name = self.file.name
        if self.file and not self.size:
            self.size = self.file.size
        if self.file and not self.extension:
            self.extension = os.path.splitext(self.file.name)[1].lower()
        super().save(*args, **kwargs)