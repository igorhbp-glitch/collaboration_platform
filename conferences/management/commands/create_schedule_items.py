# conferences/management/commands/create_schedule_items.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from conferences.models import Event, Section, ScheduleItem
import random


class Command(BaseCommand):
    help = 'Создаёт пункты программы для секций мероприятия (без дублирования)'

    def add_arguments(self, parser):
        parser.add_argument('--event-id', type=int, required=True, help='ID мероприятия')
        parser.add_argument('--clear', action='store_true', help='Очистить существующие пункты')

    def handle(self, *args, **options):
        event_id = options['event_id']
        clear = options['clear']

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ Мероприятие с ID {event_id} не найдено'))
            return

        self.stdout.write(self.style.SUCCESS(f'\n{"=" * 60}'))
        self.stdout.write(f'📋 СОЗДАНИЕ ПУНКТОВ ПРОГРАММЫ ДЛЯ МЕРОПРИЯТИЯ: {event.title}')
        self.stdout.write(f'📅 Даты: {event.start_date} — {event.end_date}')
        self.stdout.write(f'{"=" * 60}\n')

        if clear:
            # Очищаем существующие пункты
            deleted_count = ScheduleItem.objects.filter(
                Q(event=event) | Q(section__event=event)
            ).count()
            ScheduleItem.objects.filter(
                Q(event=event) | Q(section__event=event)
            ).delete()
            self.stdout.write(f'🧹 Удалено {deleted_count} существующих пунктов программы\n')

        # Получаем все секции мероприятия
        sections = Section.objects.filter(event=event)

        if not sections.exists():
            self.stdout.write(self.style.WARNING('⚠️ У мероприятия нет секций'))
            return

        self.stdout.write(f'📚 Найдено секций: {sections.count()}\n')

        # Генерируем даты мероприятия
        current_date = event.start_date
        dates = []
        while current_date <= event.end_date:
            dates.append(current_date)
            current_date += timedelta(days=1)

        created_count = 0

        # 🔥 ПРОВЕРЯЕМ, ЕСТЬ ЛИ УЖЕ ПЛЕНАРНОЕ ЗАСЕДАНИЕ
        plenary_exists = ScheduleItem.objects.filter(
            event=event,
            is_plenary=True
        ).exists()

        if not plenary_exists:
            # Создаём пленарное заседание (только один раз)
            plenary_date = dates[0]
            plenary_time = timezone.make_aware(
                datetime.combine(plenary_date, datetime.min.time())
            ) + timedelta(hours=10)

            ScheduleItem.objects.create(
                event=event,
                section=None,
                is_plenary=True,
                title="Пленарное заседание",
                description="Открытие конференции, приветственные слова, пленарные доклады",
                start_time=plenary_time,
                order=0
            )
            created_count += 1
            self.stdout.write(f'\n🏛️ Создано пленарное заседание на {plenary_time.strftime("%d.%m.%Y %H:%M")}')
        else:
            self.stdout.write('\n🏛️ Пленарное заседание уже существует, пропускаем')

        # 🔥 ДЛЯ КАЖДОЙ СЕКЦИИ СОЗДАЁМ ТОЛЬКО ОДИН ПУНКТ
        for section in sections:
            self.stdout.write(f'\n🔹 Секция: {section.title}')

            # Проверяем, есть ли уже пункт для этой секции
            existing = ScheduleItem.objects.filter(
                event=event,
                section=section
            ).exists()

            if existing:
                self.stdout.write(f'  ⏭️ Пункт уже существует, пропускаем')
                continue

            # Выбираем случайную дату из диапазона
            section_date = random.choice(dates)

            # Генерируем время начала
            start_hour = random.randint(9, 16)
            start_time = timezone.make_aware(
                datetime.combine(section_date, datetime.min.time())
            ) + timedelta(hours=start_hour)

            # Создаём пункт программы для секции
            ScheduleItem.objects.create(
                event=event,
                section=section,
                is_plenary=False,
                title=f"Секция: {section.title}",
                description=f"Заседание секции {section.title}",
                start_time=start_time,
                order=section.id
            )
            created_count += 1

            self.stdout.write(f'  ✅ Создан пункт на {start_time.strftime("%d.%m.%Y %H:%M")}')

        # 🔥 ОРГАНИЗАЦИОННЫЕ БЛОКИ - ПО ОДНОМУ НА КАЖДЫЙ ДЕНЬ
        org_blocks = [
            {"title": "Регистрация участников", "hour": 9},
            {"title": "Кофе-брейк", "hour": 11},
            {"title": "Обед", "hour": 13},
            {"title": "Кофе-брейк", "hour": 15},
        ]

        for date in dates:
            for block in org_blocks:
                # Проверяем, есть ли уже такой блок в этот день
                exists = ScheduleItem.objects.filter(
                    event=event,
                    title=block["title"],
                    start_time__date=date
                ).exists()

                if not exists:
                    block_time = timezone.make_aware(
                        datetime.combine(date, datetime.min.time())
                    ) + timedelta(hours=block["hour"])

                    ScheduleItem.objects.create(
                        event=event,
                        section=None,
                        is_plenary=False,
                        title=block["title"],
                        description=f"Организационный блок",
                        start_time=block_time,
                        order=100 + block["hour"]
                    )
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(f'\n{"=" * 60}'))
        self.stdout.write(self.style.SUCCESS(f'✅ Всего создано новых пунктов программы: {created_count}'))
        self.stdout.write(f'{"=" * 60}\n')

        # Показываем итоговую программу
        schedule = ScheduleItem.objects.filter(
            Q(event=event) | Q(section__event=event)
        ).order_by('start_time')

        self.stdout.write('\n📅 ИТОГОВАЯ ПРОГРАММА:')
        for item in schedule:
            if item.section:
                type_str = f'📚 {item.section.title}'
            elif item.is_plenary:
                type_str = '🏛️ Пленарное'
            else:
                type_str = '📌 Орг.'

            self.stdout.write(
                f'  {item.start_time.strftime("%d.%m.%Y %H:%M")} — '
                f'[{type_str}] {item.title}'
            )