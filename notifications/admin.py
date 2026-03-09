from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'recipient',
        'type',
        'title',
        'is_read',
        'created_at'
    ]
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['recipient__email', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']

    fieldsets = (
        ('Получатель', {
            'fields': ('recipient',)
        }),
        ('Уведомление', {
            'fields': ('type', 'title', 'message')
        }),
        ('Связанные объекты', {
            'fields': (
                'content_type', 'object_id',
                'invitation', 'project', 'project_member',
                'task', 'event', 'event_participant'
            ),
            'classes': ('collapse',)
        }),
        ('Действия', {
            'fields': ('action_url', 'action_data')
        }),
        ('Статусы', {
            'fields': ('is_read', 'is_archived', 'created_at', 'read_at')
        }),
    )


from django.contrib import admin

# Register your models here.
