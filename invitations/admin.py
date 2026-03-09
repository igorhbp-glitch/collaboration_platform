from django.contrib import admin
from .models import Invitation


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'invitation_type', 'status', 'created_at')
    list_filter = ('status', 'invitation_type', 'created_at')
    search_fields = ('sender__email', 'receiver__email', 'message')
    readonly_fields = ('created_at', 'updated_at', 'responded_at')

    fieldsets = (
        ('Основная информация', {
            'fields': ('sender', 'receiver', 'project', 'invitation_type', 'status')
        }),
        ('Сообщение', {
            'fields': ('message',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at', 'responded_at'),
            'classes': ('collapse',)
        }),
    )