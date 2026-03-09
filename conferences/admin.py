# conferences/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Event, Section, EventParticipant,
    EventNews, SpeakerMaterial, ScheduleItem
)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """
    Админка для мероприятий
    """
    list_display = [
        'title', 'type', 'level', 'start_date', 'end_date',
        'status', 'participant_count_display', 'has_sections',
        'conference_link_preview', 'organizers_count', 'plenary_moderators_count',
        'created_at'
    ]
    list_filter = ['type', 'level', 'status', 'has_sections', 'created_at']
    search_fields = ['title', 'description', 'short_description']
    date_hierarchy = 'start_date'
    filter_horizontal = ['organizers', 'plenary_moderators']

    fieldsets = (
        ('Основная информация', {
            'fields': (
                'title', 'description', 'short_description',
                'type', 'level', 'status'
            )
        }),
        ('Даты', {
            'fields': (
                'start_date', 'end_date', 'registration_deadline'
            )
        }),
        ('Конференция', {
            'fields': (
                'conference_link',
            ),
            'classes': ('wide',),
        }),
        ('Организаторы', {
            'fields': (
                'created_by', 'organizers', 'organizer_branches'
            ),
            'classes': ('wide',),
            'description': 'Создатель и дополнительные организаторы'
        }),
        ('Модераторы пленарного заседания', {
            'fields': (
                'plenary_moderators',
            ),
            'classes': ('wide',),
            'description': 'Модераторы пленарного заседания'
        }),
        ('Медиа', {
            'fields': (
                'cover_images', 'documents', 'additional_info'
            ),
            'classes': ('wide',),
            'description': 'JSON поля для хранения данных'
        }),
        ('Дополнительно', {
            'fields': (
                'has_sections',
            )
        }),
    )

    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['created_by']
    list_per_page = 25

    def participant_count_display(self, obj):
        """Отображение количества участников"""
        count = obj.participant_count
        return format_html(
            '<b style="color: {};">{}</b>',
            '#4CAF50' if count > 0 else '#999',
            count
        )

    participant_count_display.short_description = 'Участников'
    participant_count_display.admin_order_field = 'participant_count'

    def conference_link_preview(self, obj):
        """Превью ссылки на конференцию"""
        if obj.conference_link:
            return format_html(
                '<a href="{}" target="_blank" style="color: #4CAF50;">✅ Есть</a>',
                obj.conference_link
            )
        return '❌ Нет'

    conference_link_preview.short_description = 'Конференция'

    def organizers_count(self, obj):
        """Количество организаторов (включая создателя)"""
        count = len(obj.all_organizers)
        return format_html(
            '<b style="color: {};">{}</b>',
            '#2196F3' if count > 1 else '#999',
            count
        )

    organizers_count.short_description = 'Организаторов'

    def plenary_moderators_count(self, obj):
        """Количество модераторов пленарного заседания"""
        count = obj.plenary_moderators.count()
        return format_html(
            '<b style="color: {};">{}</b>',
            '#4CAF50' if count > 0 else '#999',
            count
        )

    plenary_moderators_count.short_description = 'Мод. пленарных'

    def save_model(self, request, obj, form, change):
        """Автоматически проставляем создателя при создании"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# ============================================
# 🔥 ОБНОВЛЕННАЯ АДМИНКА ДЛЯ СЕКЦИЙ
# ============================================

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    """
    Админка для секций
    """
    list_display = [
        'title', 'event_link', 'moderators_count',
        'conference_link', 'color_preview', 'status', 'speakers_count',
        'has_cover', 'has_about'
    ]
    list_filter = ['status', 'event__type', 'event']
    search_fields = ['title', 'description', 'about', 'event__title']
    filter_horizontal = ['moderators']

    fieldsets = (
        ('Основное', {
            'fields': (
                'event', 'title', 'status'
            )
        }),
        ('Описания', {
            'fields': (
                'description',  # краткое описание для шапки
                'about',        # 🔥 подробное описание для блока "О секции"
            ),
            'description': 'description - для шапки, about - для отдельного блока "О секции"'
        }),
        ('Конференция', {
            'fields': (
                'conference_link',
            ),
            'classes': ('wide',),
        }),
        ('Медиа', {
            'fields': (
                'color', 'cover_images'
            ),
            'description': 'Цвет карточки и изображения обложки'
        }),
        ('Управление', {
            'fields': (
                'moderators',
            )
        }),
    )

    raw_id_fields = ['event']
    list_select_related = ['event']
    readonly_fields = ['created_at', 'updated_at']

    def event_link(self, obj):
        """Ссылка на мероприятие"""
        return format_html(
            '<a href="/admin/conferences/event/{}/">{}</a>',
            obj.event.id,
            obj.event.title
        )

    event_link.short_description = 'Мероприятие'

    def color_preview(self, obj):
        """Превью цвета секции"""
        return format_html(
            '<div style="width: 30px; height: 30px; border-radius: 4px; background-color: {};"></div>',
            obj.color
        )

    color_preview.short_description = 'Цвет'

    def moderators_count(self, obj):
        """Количество модераторов в секции"""
        count = obj.moderators.count()
        return format_html(
            '<b style="color: {};">{}</b>',
            '#4CAF50' if count > 0 else '#999',
            count
        )

    moderators_count.short_description = 'Модераторов'

    def has_cover(self, obj):
        """Есть ли обложка"""
        if obj.cover_images and len(obj.cover_images) > 0:
            return format_html('<span style="color: #4CAF50;">✅</span>')
        return '❌'

    has_cover.short_description = 'Обложка'

    def has_about(self, obj):
        """Есть ли подробное описание"""
        if obj.about:
            return format_html('<span style="color: #4CAF50;">✅</span>')
        return '❌'

    has_about.short_description = 'О секции'


# ============================================
# АДМИНКА ДЛЯ УЧАСТНИКОВ
# ============================================

@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    """
    Админка для участников
    """
    list_display = [
        'user_email', 'event_link', 'participation_type',
        'talk_title_short', 'location_display',
        'actual_role_display', 'section_link', 'status_colored', 'created_at'
    ]
    list_filter = ['participation_type', 'status', 'event__type', 'is_plenary']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'talk_title']
    readonly_fields = ['created_at', 'updated_at', 'actual_role_display']
    raw_id_fields = ['user', 'event', 'section', 'project', 'reviewed_by']

    fieldsets = (
        ('Участник', {
            'fields': (
                'user', 'event', 'section'
            )
        }),
        ('Тип участия и тема', {
            'fields': (
                'participation_type', 'is_plenary', 'talk_title',
                'actual_role_display', 'status', 'project'
            ),
            'description': 'participation_type - только speaker/listener, actual_role - реальная роль'
        }),
        ('Файлы и комментарии', {
            'fields': (
                'uploaded_files', 'reviewed_by', 'review_comment'
            )
        }),
    )

    def user_email(self, obj):
        """Email участника"""
        return obj.user.email

    user_email.short_description = 'Email'
    user_email.admin_order_field = 'user__email'

    def event_link(self, obj):
        """Ссылка на мероприятие"""
        return format_html(
            '<a href="/admin/conferences/event/{}/">{}</a>',
            obj.event.id,
            obj.event.title
        )

    event_link.short_description = 'Мероприятие'

    def section_link(self, obj):
        """Ссылка на секцию (если есть)"""
        if obj.section:
            return format_html(
                '<a href="/admin/conferences/section/{}/">{}</a>',
                obj.section.id,
                obj.section.title
            )
        return '-'

    section_link.short_description = 'Секция'

    def status_colored(self, obj):
        """Цветной статус"""
        colors = {
            'pending': '#FF9800',
            'approved': '#4CAF50',
            'rejected': '#F44336',
            'cancelled': '#9E9E9E'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, '#000'),
            obj.get_status_display()
        )

    status_colored.short_description = 'Статус'

    def talk_title_short(self, obj):
        """Сокращенная тема доклада"""
        if not obj.talk_title:
            return '-'
        if len(obj.talk_title) > 50:
            return obj.talk_title[:47] + '...'
        return obj.talk_title

    talk_title_short.short_description = 'Тема доклада'
    talk_title_short.admin_order_field = 'talk_title'

    def location_display(self, obj):
        """Отображение места выступления (секция или пленарное)"""
        if obj.is_plenary:
            return format_html(
                '<span style="color: #9C27B0; font-weight: bold;">🏛️ Пленарное</span>'
            )
        if obj.section:
            return format_html(
                '<span style="color: {};">📚 {}</span>',
                obj.section.color or '#4CAF50',
                obj.section.title
            )
        return '-'

    location_display.short_description = 'Место выступления'
    location_display.admin_order_field = 'is_plenary'

    def actual_role_display(self, obj):
        """Отображение реальной роли пользователя"""
        role = obj.get_actual_role()
        colors = {
            'organizer': '#2196F3',
            'plenary_moderator': '#4CAF50',
            'section_moderator': '#4CAF50',
            'speaker': '#9C27B0',
            'listener': '#757575'
        }

        role_names = {
            'organizer': 'Организатор',
            'plenary_moderator': 'Модератор (пленарный)',
            'section_moderator': 'Модератор (секция)',
            'speaker': 'Докладчик',
            'listener': 'Слушатель'
        }

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(role, '#000'),
            role_names.get(role, role)
        )

    actual_role_display.short_description = 'Реальная роль'


# ============================================
# АДМИНКА ДЛЯ НОВОСТЕЙ
# ============================================

@admin.register(EventNews)
class EventNewsAdmin(admin.ModelAdmin):
    """
    Админка для новостей мероприятий (обновлённая)
    """
    list_display = [
        'title',
        'event_link',
        'section_link',
        'created_by_email',
        'created_at_display',
        'views_count_display',
        'likes_count_display',
        'media_count_display',
        'is_pinned_display'
    ]

    list_filter = [
        'created_at',
        'event__type',
        'section',
        'video_plays_automuted'
    ]

    search_fields = [
        'title',
        'excerpt',
        'content',
        'event__title',
        'created_by__email'
    ]

    readonly_fields = [
        'created_at',
        'updated_at',
        'views_count',
        'likes_count',
        'media_preview'
    ]

    fieldsets = (
        ('Привязка', {
            'fields': (
                'event', 'section'
            ),
            'description': 'К какому мероприятию и секции относится новость'
        }),
        ('Содержание', {
            'fields': (
                'title', 'excerpt', 'content'
            )
        }),
        ('Медиа', {
            'fields': (
                'media', 'media_preview', 'video_plays_automuted'
            ),
            'description': 'Медиафайлы для карусели (изображения и видео)'
        }),
        ('Статистика', {
            'fields': (
                'views_count', 'likes_count'
            ),
            'description': 'Счётчики просмотров и лайков (только для чтения)'
        }),
        ('Служебная информация', {
            'fields': (
                'created_by', 'created_at', 'updated_at'
            ),
            'classes': ('wide',)
        }),
    )

    raw_id_fields = ['event', 'section', 'created_by']
    list_select_related = ['event', 'section', 'created_by']
    list_per_page = 25
    date_hierarchy = 'created_at'

    def event_link(self, obj):
        """Ссылка на мероприятие"""
        from django.utils.html import format_html
        return format_html(
            '<a href="/admin/conferences/event/{}/">{}</a>',
            obj.event.id,
            obj.event.title
        )

    event_link.short_description = 'Мероприятие'
    event_link.admin_order_field = 'event__title'

    def section_link(self, obj):
        """Ссылка на секцию (если есть)"""
        from django.utils.html import format_html
        if obj.section:
            return format_html(
                '<a href="/admin/conferences/section/{}/" style="color: {};">📚 {}</a>',
                obj.section.id,
                obj.section.color or '#4CAF50',
                obj.section.title
            )
        return '—'

    section_link.short_description = 'Секция'
    section_link.admin_order_field = 'section__title'

    def created_by_email(self, obj):
        """Email автора"""
        return obj.created_by.email if obj.created_by else '—'

    created_by_email.short_description = 'Автор'
    created_by_email.admin_order_field = 'created_by__email'

    def created_at_display(self, obj):
        """Форматированная дата создания"""
        return obj.created_at.strftime('%d.%m.%Y %H:%M')

    created_at_display.short_description = 'Создано'
    created_at_display.admin_order_field = 'created_at'

    def views_count_display(self, obj):
        """Количество просмотров (цветное)"""
        from django.utils.html import format_html
        color = '#4CAF50' if obj.views_count > 0 else '#999'
        return format_html(
            '<b style="color: {};">👁️ {}</b>',
            color,
            obj.views_count
        )

    views_count_display.short_description = 'Просмотры'
    views_count_display.admin_order_field = 'views_count'

    def likes_count_display(self, obj):
        """Количество лайков (цветное)"""
        from django.utils.html import format_html
        color = '#F44336' if obj.likes_count > 0 else '#999'
        return format_html(
            '<b style="color: {};">❤️ {}</b>',
            color,
            obj.likes_count
        )

    likes_count_display.short_description = 'Лайки'
    likes_count_display.admin_order_field = 'likes_count'

    def media_count_display(self, obj):
        """Количество медиафайлов"""
        count = len(obj.media) if obj.media else 0
        from django.utils.html import format_html
        if count == 0:
            return '—'
        icons = []
        for media in obj.media:
            if media.get('type') == 'video':
                icons.append('🎥')
            else:
                icons.append('🖼️')
        return format_html(
            '{} <span style="color: #666;">({})</span>',
            ''.join(icons[:3]),
            count
        )

    media_count_display.short_description = 'Медиа'

    def is_pinned_display(self, obj):
        """Отметка о закреплении (можно добавить позже)"""
        return '—'

    is_pinned_display.short_description = 'Закреплено'

    def media_preview(self, obj):
        """Простое текстовое представление медиа"""
        if not obj.media:
            return "Нет медиа"

        count = len(obj.media)
        images = sum(1 for m in obj.media if m.get('type') == 'image')
        videos = sum(1 for m in obj.media if m.get('type') == 'video')

        return f"{count} файлов (📷 {images}, 🎥 {videos})"

    media_preview.short_description = 'Медиа'

    def save_model(self, request, obj, form, change):
        """Автоматически проставляем автора при создании"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# ============================================
# АДМИНКА ДЛЯ МАТЕРИАЛОВ
# ============================================

@admin.register(SpeakerMaterial)
class SpeakerMaterialAdmin(admin.ModelAdmin):
    """
    Админка для материалов выступающих
    """
    list_display = ['title', 'participant_link', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['title', 'description', 'participant__user__email']

    fieldsets = (
        ('Материал', {
            'fields': (
                'participant', 'title', 'description'
            )
        }),
        ('Файлы и доступ', {
            'fields': (
                'files', 'is_public'
            )
        }),
    )

    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['participant']

    def participant_link(self, obj):
        """Ссылка на участника"""
        return format_html(
            '<a href="/admin/conferences/eventparticipant/{}/">{}</a>',
            obj.participant.id,
            obj.participant.user.email
        )

    participant_link.short_description = 'Участник'


# ============================================
# АДМИНКА ДЛЯ ПУНКТОВ ПРОГРАММЫ
# ============================================

@admin.register(ScheduleItem)
class ScheduleItemAdmin(admin.ModelAdmin):
    """
    Админка для пунктов программы
    """
    list_display = [
        'start_time_display',
        'title_display',
        'speaker_display',
        'location_display',
        'event_link',
        'order'
    ]
    list_filter = ['is_plenary', 'event', 'section__event']
    search_fields = ['title', 'participant__talk_title', 'participant__user__email']

    autocomplete_fields = ['event', 'section', 'participant']

    fieldsets = (
        ('Привязка к мероприятию', {
            'fields': (
                'event',
            ),
            'description': 'Обязательно для пленарных заседаний и кастомных блоков'
        }),
        ('Привязка к секции', {
            'fields': (
                'section', 'is_plenary'
            ),
            'description': 'Для секционных докладов'
        }),
        ('Содержание', {
            'fields': (
                'participant', 'title', 'description'
            )
        }),
        ('Время и порядок', {
            'fields': (
                'start_time', 'order'
            )
        }),
    )

    def start_time_display(self, obj):
        """Отображение времени"""
        return obj.start_time.strftime('%d.%m.%Y %H:%M')

    start_time_display.short_description = 'Время'
    start_time_display.admin_order_field = 'start_time'

    def title_display(self, obj):
        """Что показываем в графе Название"""
        if obj.participant:
            return obj.participant.talk_title
        return obj.title or '(без названия)'

    title_display.short_description = 'Название'

    def speaker_display(self, obj):
        """Кто выступает"""
        if obj.participant:
            return f"{obj.participant.user.get_full_name()} ({obj.participant.user.email})"
        return '-'

    speaker_display.short_description = 'Выступающий'

    def location_display(self, obj):
        """Где проходит"""
        if obj.event:
            if obj.is_plenary:
                return '🏛️ Пленарное'
            if obj.section:
                return f'📚 {obj.section.title}'
            return '📌 Кастомный блок'
        if obj.section:
            return f'📚 {obj.section.title}'
        if obj.is_plenary:
            return '🏛️ Пленарное'
        return '-'

    location_display.short_description = 'Место'

    def event_link(self, obj):
        """Улучшенное определение мероприятия"""
        from django.utils.html import format_html

        if obj.event:
            return format_html(
                '<a href="/admin/conferences/event/{}/">📌 {}</a>',
                obj.event.id,
                obj.event.title
            )

        if obj.section:
            return format_html(
                '<a href="/admin/conferences/event/{}/">📚 {}</a>',
                obj.section.event.id,
                obj.section.event.title
            )

        if obj.participant:
            return format_html(
                '<a href="/admin/conferences/event/{}/">👤 {}</a>',
                obj.participant.event.id,
                obj.participant.event.title
            )

        return '—'

    event_link.short_description = 'Мероприятие'