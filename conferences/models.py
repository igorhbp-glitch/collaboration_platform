# conferences/models.py
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import uuid

# ============================================
# КОНСТАНТЫ (согласованные с scienceData.js)
# ============================================

EVENT_TYPES = [
    ('conference', 'Конференция'),
    ('seminar', 'Семинар'),
    ('symposium', 'Симпозиум'),
    ('workshop', 'Воркшоп'),
    ('school', 'Школа'),
    ('congress', 'Конгресс'),
    ('forum', 'Форум'),
    ('roundtable', 'Круглый стол'),
    ('competition', 'Конкурс'),
    ('festival', 'Фестиваль'),
]

EVENT_LEVELS = [
    ('international', 'Международный'),
    ('national', 'Всероссийский'),
    ('interregional', 'Межрегиональный'),
    ('regional', 'Региональный'),
    ('university', 'Внутривузовский'),
]

EVENT_STATUSES = [
    ('draft', 'Черновик'),
    ('published', 'Опубликовано'),
    ('registration_closed', 'Регистрация закрыта'),
    ('in_progress', 'Идёт мероприятие'),
    ('completed', 'Завершено'),
    ('cancelled', 'Отменено'),
]

PARTICIPATION_TYPES = [
    ('speaker', 'Выступающий/докладчик'),
    ('listener', 'Слушатель'),
]

PARTICIPATION_STATUSES = [
    ('pending', 'Ожидает подтверждения'),
    ('approved', 'Подтверждено'),
    ('rejected', 'Отклонено'),
    ('cancelled', 'Отменено'),
]

SECTION_STATUSES = [
    ('active', 'Активна'),
    ('completed', 'Завершена'),
    ('cancelled', 'Отменена'),
]

NEWS_MEDIA_TYPES = [
    ('image', 'Изображение'),
    ('video', 'Видео'),
]


# ============================================
# МОДЕЛЬ МЕРОПРИЯТИЯ
# ============================================

class Event(models.Model):
    """
    Модель научного мероприятия
    """
    # Основная информация
    title = models.CharField(
        max_length=255,
        verbose_name=_("Название мероприятия")
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Полное описание")
    )
    short_description = models.CharField(
        max_length=300,
        verbose_name=_("Краткое описание"),
        help_text=_("Для карточки мероприятия")
    )

    # Тип и уровень (из scienceData.js)
    type = models.CharField(
        max_length=50,
        choices=EVENT_TYPES,
        verbose_name=_("Тип мероприятия")
    )
    level = models.CharField(
        max_length=50,
        choices=EVENT_LEVELS,
        verbose_name=_("Уровень мероприятия")
    )

    # Даты
    start_date = models.DateField(
        verbose_name=_("Дата начала")
    )
    end_date = models.DateField(
        verbose_name=_("Дата окончания")
    )
    registration_deadline = models.DateField(
        verbose_name=_("Дедлайн регистрации")
    )

    # Организаторы (связь с филиалами - пока храним как JSON)
    organizer_branches = models.JSONField(
        default=list,
        verbose_name=_("Филиалы-организаторы"),
        help_text=_("Список названий филиалов из справочника")
    )

    # Медиа
    cover_images = models.JSONField(
        default=list,
        verbose_name=_("Изображения обложки"),
        help_text=_("Массив путей к изображениям для карусели")
    )

    # Документы
    documents = models.JSONField(
        default=list,
        verbose_name=_("Документы мероприятия"),
        help_text=_("Массив {name, url, size, extension}")
    )

    # Дополнительная информация
    additional_info = models.TextField(
        blank=True,
        verbose_name=_("Дополнительная информация")
    )

    # Статус
    status = models.CharField(
        max_length=20,
        choices=EVENT_STATUSES,
        default='draft',
        verbose_name=_("Статус")
    )

    # Флаг наличия секций
    has_sections = models.BooleanField(
        default=False,
        verbose_name=_("Есть секции")
    )

    # Ссылка на конференцию
    conference_link = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name=_("Ссылка на конференцию мероприятия")
    )

    # Кто создал
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_events',
        verbose_name=_("Создатель")
    )

    # Организаторы мероприятия (дополнительные к создателю)
    organizers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='organized_events',
        blank=True,
        verbose_name=_("Организаторы"),
        help_text=_("Пользователи, которые являются организаторами мероприятия (кроме создателя)")
    )

    # Модераторы пленарного заседания
    plenary_moderators = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='plenary_moderated_events',
        blank=True,
        verbose_name=_("Модераторы пленарного заседания"),
        help_text=_("Пользователи, которые являются модераторами пленарного заседания")
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата создания")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Дата обновления")
    )

    class Meta:
        verbose_name = _("Мероприятие")
        verbose_name_plural = _("Мероприятия")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_type_display()})"

    @property
    def participant_count(self):
        """Количество участников (подтверждённых) - исключая создателя"""
        return self.participants.filter(
            status='approved'
        ).exclude(
            user_id=self.created_by_id
        ).count()

    @property
    def sections_count(self):
        """Количество секций"""
        return self.sections.count() if self.has_sections else 0

    @property
    def all_organizers(self):
        """Все организаторы (включая создателя)"""
        organizers = list(self.organizers.all())
        if self.created_by:
            organizers.insert(0, self.created_by)
        return organizers

    @property
    def all_moderators(self):
        """Все модераторы (из секций и пленарного заседания)"""
        moderators = list(self.plenary_moderators.all())
        for section in self.sections.all():
            moderators.extend(section.moderators.all())
        # Убираем дубликаты
        return list({mod.id: mod for mod in moderators}.values())


# ============================================
# 🔥 ОБНОВЛЕННАЯ МОДЕЛЬ СЕКЦИИ
# ============================================

class Section(models.Model):
    """
    Модель секции мероприятия (для событий с has_sections=True)
    """
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='sections',
        verbose_name=_("Мероприятие")
    )

    title = models.CharField(
        max_length=200,
        verbose_name=_("Название секции")
    )

    # 🔥 ОПИСАНИЕ ДЛЯ ШАПКИ (краткое)
    description = models.TextField(
        blank=True,
        verbose_name=_("Краткое описание для шапки")
    )

    # 🔥 НОВОЕ ПОЛЕ: подробная информация о секции (для блока "О секции")
    about = models.TextField(
        blank=True,
        verbose_name=_("Подробная информация о секции"),
        help_text=_("Текст для блока 'О секции' на странице секции")
    )

    # 🔥 НОВОЕ ПОЛЕ: обложка секции
    cover_images = models.JSONField(
        default=list,
        verbose_name=_("Изображения обложки секции"),
        help_text=_("Массив путей к изображениям для карусели")
    )

    # Ссылка на конференцию секции
    conference_link = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name=_("Ссылка на конференцию секции")
    )

    # Цвет для карточки
    color = models.CharField(
        max_length=7,
        default='#4CAF50',
        verbose_name=_("Цвет карточки (HEX)")
    )

    # Модераторы секции
    moderators = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='moderated_sections',
        blank=True,
        verbose_name=_("Модераторы секции")
    )

    # Статус
    status = models.CharField(
        max_length=20,
        choices=SECTION_STATUSES,
        default='active',
        verbose_name=_("Статус")
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата создания")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Дата обновления")
    )

    class Meta:
        verbose_name = _("Секция")
        verbose_name_plural = _("Секции")
        ordering = ['created_at']

    def __str__(self):
        return f"{self.title} ({self.event.title})"

    @property
    def speakers_count(self):
        """Количество выступающих в секции"""
        return self.eventparticipant_set.filter(
            participation_type='speaker',
            status='approved'
        ).exclude(
            user_id=self.event.created_by_id
        ).count()


# ============================================
# МОДЕЛЬ УЧАСТНИКА МЕРОПРИЯТИЯ
# ============================================

class EventParticipantQuerySet(models.QuerySet):
    """Кастомный QuerySet для EventParticipant с дополнительными методами"""

    def exclude_creator(self, event):
        """Исключить создателя мероприятия из списка участников"""
        return self.exclude(user_id=event.created_by_id)

    def available_for_organizer(self, event):
        """Участники, доступные для назначения организаторами"""
        return self.filter(
            event=event,
            status='approved'
        ).exclude(
            user_id=event.created_by_id
        ).exclude(
            user_id__in=event.organizers.values_list('id', flat=True)
        )

    def potential_moderators(self, event, section=None):
        """Участники, которые могут стать модераторами"""
        queryset = self.filter(
            event=event,
            status='approved',
            participation_type__in=['speaker', 'listener']
        ).exclude(
            user_id=event.created_by_id
        ).exclude(
            user_id__in=event.organizers.values_list('id', flat=True)
        )

        if section:
            # Исключаем тех, кто уже модератор в других секциях
            queryset = queryset.exclude(
                user_id__in=section.event.sections.exclude(
                    id=section.id
                ).values_list('moderators__id', flat=True)
            )
            # Исключаем тех, кто уже модератор пленарного
            queryset = queryset.exclude(
                user_id__in=event.plenary_moderators.values_list('id', flat=True)
            )
        else:
            # Для пленарного заседания исключаем всех, кто уже модератор в секциях
            all_section_moderators = []
            for sec in event.sections.all():
                all_section_moderators.extend(sec.moderators.values_list('id', flat=True))
            queryset = queryset.exclude(user_id__in=all_section_moderators)

        return queryset


class EventParticipant(models.Model):
    """
    Модель участника мероприятия (связь пользователя с мероприятием)
    """
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='participants',
        verbose_name=_("Мероприятие")
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Секция"),
        help_text=_("Для выступающих обязательно, для слушателей опционально")
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_participations',
        verbose_name=_("Пользователь")
    )

    participation_type = models.CharField(
        max_length=20,
        choices=PARTICIPATION_TYPES,
        verbose_name=_("Тип участия")
    )

    talk_title = models.CharField(
        max_length=500,
        blank=True,
        verbose_name=_("Тема доклада"),
        help_text=_("Название или тема выступления (для докладчиков)")
    )

    is_plenary = models.BooleanField(
        default=False,
        verbose_name=_("Пленарное заседание"),
        help_text=_("True для докладчиков на пленарном заседании, False для секционных докладчиков")
    )

    # 🔥 НОВОЕ ПОЛЕ ДЛЯ ПОРЯДКА ВЫСТУПЛЕНИЯ
    speaker_order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Порядок выступления"),
        help_text=_("Порядковый номер докладчика (0 - первый, 1 - второй и т.д.)")
    )

    # Для выступающих
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Связанный проект")
    )
    uploaded_files = models.JSONField(
        default=list,
        verbose_name=_("Загруженные файлы")
    )

    # Статус заявки
    status = models.CharField(
        max_length=20,
        choices=PARTICIPATION_STATUSES,
        default='pending',
        verbose_name=_("Статус заявки")
    )

    # Кто одобрил/отклонил
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_participations',
        verbose_name=_("Рассмотрел")
    )
    review_comment = models.TextField(
        blank=True,
        verbose_name=_("Комментарий к решению")
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата подачи")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Дата обновления")
    )

    objects = EventParticipantQuerySet.as_manager()

    class Meta:
        verbose_name = _("Участник мероприятия")
        verbose_name_plural = _("Участники мероприятий")
        unique_together = ['event', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.event.title} ({self.participation_type})"

    def get_actual_role(self):
        """
        Возвращает фактическую роль пользователя на основе членства в группах
        """
        if self.event.organizers.filter(id=self.user.id).exists():
            return 'organizer'
        if self.event.plenary_moderators.filter(id=self.user.id).exists():
            return 'plenary_moderator'
        if self.section and self.section.moderators.filter(id=self.user.id).exists():
            return 'section_moderator'
        return self.participation_type

    def sync_role_with_groups(self):
        """
        Синхронизирует participation_type с реальными группами.
        Возвращает True, если были изменения.
        """
        if self.event.organizers.filter(id=self.user.id).exists():
            if self.participation_type != 'listener':
                self.participation_type = 'listener'
                return True
            return False

        is_moderator = self.event.plenary_moderators.filter(id=self.user.id).exists()
        if not is_moderator and self.section:
            is_moderator = self.section.moderators.filter(id=self.user.id).exists()

        if is_moderator:
            if self.participation_type != 'listener':
                self.participation_type = 'listener'
                return True
            return False

        return False

    def save(self, *args, **kwargs):
        """
        Переопределяем save для автоматической синхронизации ролей
        """
        self.sync_role_with_groups()
        super().save(*args, **kwargs)


# ============================================
# 🔥 МОДЕЛЬ НОВОСТИ МЕРОПРИЯТИЯ (ОБНОВЛЕННАЯ)
# ============================================

class EventNews(models.Model):
    """
    Модель новости/поста мероприятия
    """
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='news',
        verbose_name=_("Мероприятие")
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='news',
        verbose_name=_("Секция"),
        help_text=_("Если не выбрана - новость общая для всего мероприятия")
    )

    title = models.CharField(
        max_length=200,
        verbose_name=_("Заголовок новости")
    )

    # 🔥 НОВОЕ ПОЛЕ: краткое описание (для предпросмотра)
    excerpt = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Краткое описание"),
        help_text=_("Краткий текст для предпросмотра (если не заполнено, берется из начала content)")
    )

    content = models.TextField(
        verbose_name=_("Содержание")
    )

    # Медиа для карусели
    media = models.JSONField(
        default=list,
        verbose_name=_("Медиафайлы"),
        help_text=_("Массив объектов {type: 'image/video', url: '...', thumbnail: '...'}")
    )

    # Для видео без звука
    video_plays_automuted = models.BooleanField(
        default=True,
        verbose_name=_("Видео с автовоспроизведением без звука")
    )

    # 🔥 НОВЫЕ ПОЛЯ: статистика
    views_count = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Количество просмотров")
    )

    likes_count = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Количество лайков")
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_news',
        verbose_name=_("Автор")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата публикации")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Дата обновления")
    )

    class Meta:
        verbose_name = _("Новость мероприятия")
        verbose_name_plural = _("Новости мероприятий")
        ordering = ['-created_at']  # Сначала новые

    def __str__(self):
        return f"{self.title} - {self.event.title}"

    # 🔥 НОВЫЙ МЕТОД: увеличить счетчик просмотров
    def increment_views(self):
        self.views_count += 1
        self.save(update_fields=['views_count'])
        return self.views_count

    # 🔥 НОВЫЙ МЕТОД: получить отображаемый текст для предпросмотра
    def get_display_excerpt(self, length=150):
        """Возвращает текст для предпросмотра"""
        if self.excerpt:
            return self.excerpt
        # Если нет excerpt, берем первые N символов из content
        if len(self.content) <= length:
            return self.content
        return self.content[:length] + '...'


# ============================================
# МОДЕЛЬ МАТЕРИАЛОВ ВЫСТУПАЮЩЕГО
# ============================================

class SpeakerMaterial(models.Model):
    """
    Модель материалов, загруженных выступающим
    """
    participant = models.ForeignKey(
        EventParticipant,
        on_delete=models.CASCADE,
        related_name='materials',
        verbose_name=_("Участник")
    )
    title = models.CharField(
        max_length=200,
        verbose_name=_("Название материала")
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Описание")
    )

    # Файлы
    files = models.JSONField(
        default=list,
        verbose_name=_("Файлы")
    )

    # Доступность
    is_public = models.BooleanField(
        default=True,
        verbose_name=_("Публичный доступ")
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Дата загрузки")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Дата обновления")
    )

    class Meta:
        verbose_name = _("Материал выступающего")
        verbose_name_plural = _("Материалы выступающих")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.participant.user.email}"


# ============================================
# МОДЕЛЬ ПУНКТА ПРОГРАММЫ (РАСПИСАНИЕ)
# ============================================

class ScheduleItem(models.Model):
    """
    Модель для пункта программы мероприятия.
    Может быть:
    - докладом в секции (section указан, is_plenary=False, participant указан)
    - докладом на пленарном (section=null, is_plenary=True, participant указан)
    - кастомным блоком (section=null, is_plenary=False, participant=null, title указан)
    """
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='schedule_items',
        null=True,
        blank=True,
        verbose_name="Мероприятие"
    )

    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name='schedule_items',
        null=True,
        blank=True,
        verbose_name="Секция"
    )
    is_plenary = models.BooleanField(
        default=False,
        verbose_name="Пленарное заседание"
    )

    participant = models.ForeignKey(
        EventParticipant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='schedule_items',
        verbose_name="Выступающий"
    )

    title = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Название блока",
        help_text="Для организационных блоков (регистрация, кофе-брейк и т.д.)"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Описание"
    )

    start_time = models.DateTimeField(
        verbose_name="Время начала"
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Порядок",
        help_text="Для сортировки"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )

    class Meta:
        verbose_name = "Пункт программы"
        verbose_name_plural = "Пункты программы"
        ordering = ['start_time', 'order']
        constraints = [
            models.CheckConstraint(
                check=(
                    # Вариант 1: Пленарное заседание
                        models.Q(section__isnull=True, is_plenary=True) |
                        # Вариант 2: Секция
                        models.Q(section__isnull=False, is_plenary=False) |
                        # Вариант 3: Кастомный блок
                        models.Q(section__isnull=True, is_plenary=False, title__gt='')
                ),
                name="either_section_or_plenary"
            )
        ]

    def __str__(self):
        if self.participant:
            return f"{self.start_time.strftime('%H:%M')} - {self.participant.talk_title}"
        return f"{self.start_time.strftime('%H:%M')} - {self.title}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.participant:
            if self.participant.participation_type != 'speaker':
                raise ValidationError(
                    {"participant": "К пункту программы можно привязать только докладчика"}
                )
            if self.participant.status != 'approved':
                raise ValidationError(
                    {"participant": "К пункту программы можно привязать только подтверждённого участника"}
                )

        if not self.participant and not self.title:
            raise ValidationError(
                "Для организационного блока необходимо указать название"
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)