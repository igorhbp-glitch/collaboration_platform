from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


def send_notification_email(notification):
    """
    Отправляет email-уведомление получателю

    Args:
        notification: объект Notification
    """
    try:
        subject = notification.title

        # Контекст для шаблона
        context = {
            'notification': notification,
            'recipient': notification.recipient,
            'site_url': settings.SITE_URL,
            'type_display': notification.get_type_display(),
        }

        # Рендерим HTML-версию
        html_message = render_to_string('emails/notification.html', context)
        # Создаем текстовую версию (без HTML)
        plain_message = strip_tags(html_message)

        # Отправляем
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [notification.recipient.email],
            html_message=html_message,
            fail_silently=False
        )

        logger.info(f'Email отправлен для уведомления {notification.id} -> {notification.recipient.email}')

    except Exception as e:
        logger.error(f'Ошибка отправки email для уведомления {notification.id}: {e}')


def send_invitation_email(invitation):
    """
    Отправляет email о приглашении (отдельная функция для детальных писем)

    Args:
        invitation: объект Invitation
    """
    try:
        subject = f'Приглашение в проект "{invitation.project.title}"'

        context = {
            'invitation': invitation,
            'sender': invitation.sender,
            'receiver': invitation.receiver,
            'project': invitation.project,
            'message': invitation.message,
            'role': invitation.get_role_display() if hasattr(invitation, 'get_role_display') else invitation.role,
            'site_url': settings.SITE_URL,
            'accept_url': f'{settings.SITE_URL}/my-invitations',
        }

        html_message = render_to_string('emails/invitation.html', context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [invitation.receiver.email],
            html_message=html_message,
            fail_silently=False
        )

        logger.info(f'Email отправлен для приглашения {invitation.id} -> {invitation.receiver.email}')

    except Exception as e:
        logger.error(f'Ошибка отправки email для приглашения {invitation.id}: {e}')


def send_task_assigned_email(task, assignee, assigned_by):
    """
    Отправляет email о назначении задачи
    """
    try:
        subject = f'Новая задача: {task.title}'

        context = {
            'task': task,
            'assignee': assignee,
            'assigned_by': assigned_by,
            'project': task.project,
            'site_url': settings.SITE_URL,
            'task_url': f'{settings.SITE_URL}/projects/{task.project.id}?task={task.id}',
        }

        html_message = render_to_string('emails/task_assigned.html', context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [assignee.email],
            html_message=html_message,
            fail_silently=False
        )

    except Exception as e:
        logger.error(f'Ошибка отправки email о задаче {task.id}: {e}')