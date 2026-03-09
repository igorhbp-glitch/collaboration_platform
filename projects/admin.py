# projects/admin.py - ИСПРАВЛЕННАЯ ВЕРСИЯ

from django.contrib import admin
from .models import *


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'status', 'project_type', 'member_count', 'created_at']
    list_filter = ['status', 'project_type', 'is_private', 'scientific_field']
    search_fields = ['title', 'description', 'scientific_field', 'tags']
    filter_horizontal = []
    readonly_fields = ['created_at', 'updated_at', 'member_count']

    def member_count(self, obj):
        return obj.members.count()

    member_count.short_description = 'Участников'


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'project',
        'role',
        'status',
        'created_at',
        'joined_at',
        'reviewed_by'
    ]
    list_filter = [
        'role',
        'status',
        'project__status',
        'project__project_type'
    ]
    search_fields = [
        'user__email',
        'user__first_name',
        'user__last_name',
        'project__title',
        'message',
        'rejection_reason'
    ]
    readonly_fields = [
        'created_at',
        'joined_at',
        'reviewed_at',
        'reviewed_by'
    ]
    list_editable = ['status', 'role']

    fieldsets = (
        ('Участник и проект', {
            'fields': ('user', 'project', 'role', 'status')
        }),
        ('Заявка', {
            'fields': ('message', 'created_at', 'invited_by')
        }),
        ('Рассмотрение', {
            'fields': ('reviewed_by', 'reviewed_at', 'joined_at', 'rejection_reason')
        }),
        ('Права', {
            'fields': (
                'can_edit_project',
                'can_invite_members',
                'can_create_tasks',
                'can_manage_tasks',
                'can_delete_project'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(CollaborationMatch)
class CollaborationMatchAdmin(admin.ModelAdmin):
    list_display = ['user_from', 'user_to', 'project', 'match_score', 'created_at']
    list_filter = ['project']
    search_fields = ['user_from__email', 'user_to__email', 'project__title']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'assignee', 'due_date']
    list_filter = ['status', 'priority', 'project']
    search_fields = ['title', 'description', 'project__title']
    list_editable = ['status', 'priority']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'start_date', 'end_date', 'progress']
    list_filter = ['status', 'project']
    search_fields = ['title', 'description', 'goal', 'project__title']
    readonly_fields = ['created_at', 'updated_at', 'progress', 'duration_days']


# ============================================
# АДМИН ДЛЯ ДОКУМЕНТОВ ПРОЕКТА
# ============================================

@admin.register(ProjectDocument)
class ProjectDocumentAdmin(admin.ModelAdmin):
    """
    Админка для документов проекта
    """
    list_display = [
        'name',
        'project',
        'uploaded_by',
        'size_formatted',
        'extension',
        'uploaded_at'
    ]
    list_filter = [
        'extension',
        'project',
        'uploaded_at'
    ]
    search_fields = [
        'name',
        'project__title',
        'uploaded_by__email'
    ]
    readonly_fields = [
        'id',
        'name',
        'size',
        'extension',
        'uploaded_at',
        'file_preview'
    ]
    list_select_related = ['project', 'uploaded_by']
    ordering = ['-uploaded_at']

    fieldsets = (
        ('Основная информация', {
            'fields': (
                'id',
                'project',
                'uploaded_by',
                'uploaded_at'
            )
        }),
        ('Файл', {
            'fields': (
                'name',
                'file_preview',
                'size',
                'extension'
            )
        }),
    )

    def size_formatted(self, obj):
        """Форматированный размер файла"""
        if obj.size < 1024:
            return f"{obj.size} B"
        if obj.size < 1024 * 1024:
            return f"{obj.size / 1024:.1f} KB"
        return f"{obj.size / (1024 * 1024):.1f} MB"
    size_formatted.short_description = 'Размер'

    def file_preview(self, obj):
        """Ссылка на файл"""
        if obj.file:
            return f'<a href="{obj.file.url}" target="_blank">Открыть файл</a>'
        return 'Файл не найден'
    file_preview.short_description = 'Файл'
    file_preview.allow_tags = True


# ============================================
# АДМИН ДЛЯ КОММЕНТАРИЕВ К ЗАДАЧАМ
# ============================================

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """
    Админка для комментариев к задачам
    """
    list_display = [
        'id',
        'short_text',
        'task',
        'author',
        'attachments_count',
        'created_at',
        'is_edited'
    ]
    list_filter = [
        'task__project',
        'author',
        'created_at',
        'edited_at'
    ]
    search_fields = [
        'text',
        'author__email',
        'task__title'
    ]
    readonly_fields = [
        'id',
        'created_at',
        'edited_at',
        'attachments_count',
        'short_text'
    ]
    list_select_related = ['task', 'author']
    ordering = ['-created_at']

    fieldsets = (
        ('Основная информация', {
            'fields': (
                'id',
                'task',
                'author',
                'created_at',
                'edited_at'
            )
        }),
        ('Содержимое', {
            'fields': (
                'text',
                'short_text',
                'attachments'
            )
        }),
    )

    def short_text(self, obj):
        """Короткий текст комментария"""
        if len(obj.text) > 50:
            return obj.text[:50] + '...'
        return obj.text
    short_text.short_description = 'Комментарий'

    def attachments_count(self, obj):
        """Количество вложений"""
        return len(obj.attachments) if obj.attachments else 0
    attachments_count.short_description = 'Вложений'


# ============================================
# АДМИН ДЛЯ ЧАТА ПРОЕКТА (ИСПРАВЛЕННЫЙ)
# ============================================

@admin.register(ProjectChatMessage)
class ProjectChatMessageAdmin(admin.ModelAdmin):
    """
    Админка для сообщений чата проекта
    """
    list_display = [
        'id',
        'short_text',
        'author',
        'project',
        'attachments_count',
        'reply_count_display',
        'read_count',
        'created_at'
    ]
    list_filter = [
        'project',
        'author',
        'created_at',
        'parent_message'
    ]
    search_fields = [
        'text',
        'author__email',
        'author__first_name',
        'author__last_name',
        'project__title'
    ]
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'read_by',
        'read_count',
        'reply_count_display',
        'attachments_count',
        'short_text'
    ]
    list_select_related = ['author', 'project']
    list_per_page = 50
    ordering = ['-created_at']

    fieldsets = (
        ('Основная информация', {
            'fields': (
                'id',
                'project',
                'author',
                'created_at',
                'updated_at'
            )
        }),
        ('Содержимое', {
            'fields': (
                'text',
                'short_text',
                'attachments'
            )
        }),
        ('Статистика', {
            'fields': (
                'read_by',
                'read_count',
                'reply_count_display',
                'attachments_count'
            )
        }),
        ('Связи', {
            'fields': (
                'parent_message',
            ),
            'classes': ('collapse',)
        }),
    )

    def short_text(self, obj):
        """Короткий текст сообщения для списка"""
        if obj.text and len(obj.text) > 50:
            return obj.text[:50] + '...'
        return obj.text or '[без текста]'
    short_text.short_description = 'Сообщение'

    def attachments_count(self, obj):
        """Количество вложений"""
        return len(obj.attachments) if obj.attachments else 0
    attachments_count.short_description = 'Вложений'

    def reply_count_display(self, obj):
        """Количество ответов"""
        return obj.reply_count
    reply_count_display.short_description = 'Ответов'

    def read_count(self, obj):
        """Количество прочитавших"""
        return obj.read_count
    read_count.short_description = 'Прочитано'

    def get_queryset(self, request):
        """Оптимизация запросов"""
        return super().get_queryset(request).select_related(
            'author', 'project', 'parent_message'
        )