# notifications/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Notification
from .utils import send_notification_email, send_invitation_email

User = get_user_model()


# ============================================
# СИГНАЛЫ ДЛЯ ПРИГЛАШЕНИЙ (invitations)
# ============================================

@receiver(post_save, sender='invitations.Invitation')
def create_invitation_notification(sender, instance, created, **kwargs):
    """
    Создаёт уведомление при создании или изменении статуса приглашения
    """
    if created:
        # Новое приглашение -> уведомление получателю
        notification = Notification.objects.create(
            recipient=instance.receiver,
            type=Notification.Type.INVITATION_RECEIVED,
            title=f'Приглашение в проект "{instance.project.title}"',
            message=instance.message or f'{instance.sender.get_full_name()} приглашает вас в проект',
            invitation=instance,
            project=instance.project,
            action_url='/my-invitations'  # ← ИЗМЕНИТЬ
        )
        # 🔥 ОТПРАВКА EMAIL
        send_notification_email(notification)
        send_invitation_email(instance)

    else:
        # Изменение статуса приглашения
        if instance.status == 'accepted':
            # Приглашение принято -> уведомление отправителю
            notification = Notification.objects.create(
                recipient=instance.sender,
                type=Notification.Type.INVITATION_ACCEPTED,
                title=f'Приглашение принято',
                message=f'{instance.receiver.get_full_name()} принял(а) ваше приглашение в проект "{instance.project.title}"',
                invitation=instance,
                project=instance.project,
                action_url=f'/projects/{instance.project.id}'
            )
            send_notification_email(notification)

        elif instance.status == 'rejected':
            # Приглашение отклонено -> уведомление отправителю
            notification = Notification.objects.create(
                recipient=instance.sender,
                type=Notification.Type.INVITATION_REJECTED,
                title=f'Приглашение отклонено',
                message=f'{instance.receiver.get_full_name()} отклонил(а) ваше приглашение в проект "{instance.project.title}"',
                invitation=instance,
                project=instance.project,
                action_url=f'/projects/{instance.project.id}'
            )
            send_notification_email(notification)

        elif instance.status == 'cancelled':
            # Приглашение отменено -> уведомление получателю
            notification = Notification.objects.create(
                recipient=instance.receiver,
                type=Notification.Type.INVITATION_CANCELLED,
                title=f'Приглашение отменено',
                message=f'{instance.sender.get_full_name()} отменил(а) приглашение в проект "{instance.project.title}"',
                invitation=instance,
                project=instance.project,
                action_url=f'/projects/{instance.project.id}'
            )
            send_notification_email(notification)


# ============================================
# СИГНАЛЫ ДЛЯ УЧАСТНИКОВ ПРОЕКТОВ (projects)
# ============================================
@receiver(post_save, sender='projects.ProjectMember')
def create_project_member_notification(sender, instance, created, **kwargs):
    """
    Создаёт уведомление при создании или изменении статуса участника проекта
    """
    from projects.models import Project

    project = instance.project

    # 🔥 НЕ ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ, ЕСЛИ ПОЛЬЗОВАТЕЛЬ - СОЗДАТЕЛЬ ПРОЕКТА
    if instance.user == project.owner:
        return

    if created and instance.status == 'pending':
        # Новая заявка на вступление -> уведомление владельцу проекта
        notification = Notification.objects.create(
            recipient=project.owner,
            type=Notification.Type.PROJECT_JOIN_REQUEST,
            title=f'Новая заявка в проект "{project.title}"',
            message=f'{instance.user.get_full_name()} хочет присоединиться к проекту',
            project_member=instance,
            project=project,
            action_url=f'/projects/{project.id}'
        )
        send_notification_email(notification)

    else:
        # Изменение статуса заявки
        if instance.status == 'approved':
            # Заявка одобрена -> уведомление заявителю
            notification = Notification.objects.create(
                recipient=instance.user,
                type=Notification.Type.PROJECT_JOIN_APPROVED,
                title=f'Заявка одобрена',
                message=f'Ваша заявка на вступление в проект "{project.title}" одобрена',
                project_member=instance,
                project=project,
                action_url=f'/projects/{project.id}'
            )
            send_notification_email(notification)

        elif instance.status == 'rejected':
            # Заявка отклонена -> уведомление заявителю
            reason = instance.rejection_reason or 'причина не указана'
            notification = Notification.objects.create(
                recipient=instance.user,
                type=Notification.Type.PROJECT_JOIN_REJECTED,
                title=f'Заявка отклонена',
                message=f'Ваша заявка на вступление в проект "{project.title}" отклонена ({reason})',
                project_member=instance,
                project=project,
                action_url=f'/projects/{project.id}'
            )
            send_notification_email(notification)


# ============================================
# СИГНАЛЫ ДЛЯ ЗАДАЧ (projects)
# ============================================

@receiver(post_save, sender='projects.Task')
def create_task_notification(sender, instance, created, **kwargs):
    """
    Создаёт уведомление при создании или изменении задачи
    """
    from projects.models import ProjectMember

    project = instance.project

    if created:
        # Новая задача
        if instance.assignee:
            # Задача назначена конкретному исполнителю
            notification = Notification.objects.create(
                recipient=instance.assignee,
                type=Notification.Type.TASK_ASSIGNED,
                title=f'Новая задача: {instance.title}',
                message=f'В проекте "{project.title}" вам назначена задача: {instance.title}',
                task=instance,
                project=project,
                action_url=f'/projects/{project.id}?task={instance.id}'
            )
            send_notification_email(notification)

    else:
        # Изменение задачи
        if instance.status == 'done':
            # Задача выполнена
            if instance.assignee and instance.created_by:
                # Уведомление создателю задачи
                notification = Notification.objects.create(
                    recipient=instance.created_by,
                    type=Notification.Type.TASK_COMPLETED,
                    title=f'Задача выполнена: {instance.title}',
                    message=f'{instance.assignee.get_full_name()} выполнил(а) задачу "{instance.title}"',
                    task=instance,
                    project=project,
                    action_url=f'/projects/{project.id}?task={instance.id}'
                )
                send_notification_email(notification)


# ============================================
# СИГНАЛЫ ДЛЯ МЕРОПРИЯТИЙ (conferences)
# ============================================

@receiver(post_save, sender='conferences.EventParticipant')
def create_event_participant_notification(sender, instance, created, **kwargs):
    """
    Создаёт уведомление при подаче или изменении статуса заявки на мероприятие
    """
    from conferences.models import Event

    event = instance.event

    if created and instance.status == 'pending':
        # Новая заявка на участие -> уведомление организаторам
        # Получаем всех организаторов мероприятия
        organizers = []
        if event.organizers.exists():
            organizers = event.organizers.all()
        else:
            # Если организаторов нет, уведомляем создателя
            organizers = [event.created_by]

        for organizer in organizers:
            notification = Notification.objects.create(
                recipient=organizer,
                type=Notification.Type.EVENT_PARTICIPATION_REQUEST,
                title=f'Новая заявка на мероприятие "{event.title}"',
                message=f'{instance.user.get_full_name()} подал(а) заявку на участие',
                event_participant=instance,
                event=event,
                action_url=f'/events/{event.id}'
            )
            send_notification_email(notification)

    else:
        # Изменение статуса заявки
        if instance.status == 'approved':
            # Заявка одобрена -> уведомление участнику
            notification = Notification.objects.create(
                recipient=instance.user,
                type=Notification.Type.EVENT_PARTICIPATION_APPROVED,
                title=f'Заявка одобрена',
                message=f'Ваша заявка на участие в мероприятии "{event.title}" одобрена',
                event_participant=instance,
                event=event,
                action_url=f'/events/{event.id}'
            )
            send_notification_email(notification)

        elif instance.status == 'rejected':
            # Заявка отклонена -> уведомление участнику
            notification = Notification.objects.create(
                recipient=instance.user,
                type=Notification.Type.EVENT_PARTICIPATION_REJECTED,
                title=f'Заявка отклонена',
                message=f'Ваша заявка на участие в мероприятии "{event.title}" отклонена',
                event_participant=instance,
                event=event,
                action_url=f'/events/{event.id}'
            )
            send_notification_email(notification)


# ============================================
# СИГНАЛЫ ДЛЯ НАПОМИНАНИЙ (опционально)
# ============================================

def create_event_reminders():
    """
    Функция для создания напоминаний о мероприятиях
    Запускать по расписанию через cron или Celery
    """
    from conferences.models import Event
    from datetime import timedelta

    tomorrow = timezone.now().date() + timedelta(days=1)

    # Ищем мероприятия, которые начнутся завтра
    events_tomorrow = Event.objects.filter(
        start_date=tomorrow,
        status='published'
    )

    for event in events_tomorrow:
        # Уведомляем всех участников с approved статусом
        participants = event.participants.filter(status='approved')

        for participant in participants:
            notification = Notification.objects.create(
                recipient=participant.user,
                type=Notification.Type.EVENT_REMINDER,
                title=f'Напоминание: мероприятие "{event.title}" завтра',
                message=f'Мероприятие "{event.title}" начнётся завтра. Не пропустите!',
                event=event,
                action_url=f'/events/{event.id}'
            )
            send_notification_email(notification)