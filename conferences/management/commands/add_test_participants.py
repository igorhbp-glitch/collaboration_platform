# conferences/management/commands/add_test_participants.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from conferences.models import Event, Section, EventParticipant
from users.models import CustomUser


class Command(BaseCommand):
    help = 'Добавляет случайных участников во все мероприятия'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=10,
            help='Количество пользователей для добавления (по умолчанию 10)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Очистить всех участников перед добавлением'
        )

    def handle(self, *args, **options):
        # Получаем всех пользователей (исключая админов)
        all_users = list(CustomUser.objects.exclude(
            role__in=['admin', 'administrator']
        ).exclude(
            username__icontains='admin'
        ))

        if not all_users:
            self.stdout.write(self.style.ERROR('❌ Нет пользователей в системе'))
            return

        # Получаем все мероприятия
        events = Event.objects.all()
        if not events:
            self.stdout.write(self.style.ERROR('❌ Нет мероприятий в системе'))
            return

        # Очищаем старых участников если нужно
        if options['clear']:
            EventParticipant.objects.all().delete()
            self.stdout.write('🧹 Все старые участники удалены')

        # Определяем количество пользователей для добавления
        num_users = min(options['users'], len(all_users))
        selected_users = random.sample(all_users, num_users)

        self.stdout.write(f'📊 Найдено мероприятий: {len(events)}')
        self.stdout.write(f'👥 Выбрано пользователей: {num_users}')

        created_count = 0

        # Для каждого мероприятия
        for event in events:
            self.stdout.write(f'\n📅 Мероприятие: {event.title}')

            # Определяем количество участников для этого мероприятия (5-20)
            num_participants = random.randint(5, 20)

            # Выбираем случайных пользователей
            event_users = random.sample(selected_users, min(num_participants, len(selected_users)))

            # Определяем секции мероприятия (если есть)
            sections = list(event.sections.all())

            # Статусы заявок
            statuses = ['approved', 'approved', 'approved', 'pending',
                        'rejected']  # 60% approved, 20% pending, 20% rejected

            for user in event_users:
                # Пропускаем если пользователь уже участник
                if EventParticipant.objects.filter(event=event, user=user).exists():
                    continue

                # Случайный тип участия
                participation_type = random.choices(
                    ['listener', 'speaker'],
                    weights=[70, 30]  # 70% слушателей, 30% докладчиков
                )[0]

                # Случайный статус
                status = random.choice(statuses)

                # Для докладчиков выбираем случайную секцию
                section = None
                if participation_type == 'speaker' and sections:
                    section = random.choice(sections)

                # Случайная дата подачи (от 30 дней назад до сегодня)
                days_ago = random.randint(0, 30)
                created_at = timezone.now() - timedelta(days=days_ago)

                # Создаём участника
                participant = EventParticipant.objects.create(
                    event=event,
                    user=user,
                    section=section,
                    participation_type=participation_type,
                    status=status,
                    uploaded_files=[],
                    created_at=created_at,
                    updated_at=created_at
                )

                created_count += 1

                # Логируем
                status_emoji = '✅' if status == 'approved' else '⏳' if status == 'pending' else '❌'
                speaker_emoji = '🎤' if participation_type == 'speaker' else '👂'
                section_info = f" ({section.title})" if section else ""
                self.stdout.write(f'  {status_emoji} {speaker_emoji} {user.email} - {status}{section_info}')

        self.stdout.write(self.style.SUCCESS(f'\n🎉 Успешно создано {created_count} участников!'))

        # Статистика по мероприятиям
        self.stdout.write('\n📊 Статистика по мероприятиям:')
        for event in events:
            total = event.participants.count()
            approved = event.participants.filter(status='approved').count()
            pending = event.participants.filter(status='pending').count()
            speakers = event.participants.filter(participation_type='speaker', status='approved').count()
            listeners = event.participants.filter(participation_type='listener', status='approved').count()

            self.stdout.write(f'  {event.title[:30]}...')
            self.stdout.write(f'    👥 Всего: {total} (✅ {approved} подтверждено, ⏳ {pending} ожидает)')
            self.stdout.write(f'    🎤 Докладчиков: {speakers}, 👂 Слушателей: {listeners}')