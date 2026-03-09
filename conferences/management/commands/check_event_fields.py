# conferences/management/commands/check_event_fields.py
from django.core.management.base import BaseCommand
from conferences.models import Event


class Command(BaseCommand):
    help = 'Проверяет поля мероприятия и их содержимое'

    def add_arguments(self, parser):
        parser.add_argument('--event-id', type=int, help='ID мероприятия для проверки')

    def handle(self, *args, **options):
        event_id = options.get('event_id')

        if event_id:
            events = Event.objects.filter(id=event_id)
        else:
            events = Event.objects.all()[:5]  # покажем первые 5

        for event in events:
            self.stdout.write(self.style.SUCCESS(f'\n{"=" * 60}'))
            self.stdout.write(f'Мероприятие ID: {event.id}')
            self.stdout.write(f'Название: {event.title}')
            self.stdout.write(f'{"=" * 60}')

            self.stdout.write('\n📝 ПОЛЯ МЕРОПРИЯТИЯ:')
            self.stdout.write(f'• title: {event.title}')
            self.stdout.write(f'• short_description: {event.short_description}')
            self.stdout.write(f'• description: {event.description}')
            self.stdout.write(f'• additional_info: {event.additional_info}')

            self.stdout.write('\n📊 ДЛИНА ПОЛЕЙ:')
            self.stdout.write(f'• short_description: {len(event.short_description or "")} симв.')
            self.stdout.write(f'• description: {len(event.description or "")} симв.')
            self.stdout.write(f'• additional_info: {len(event.additional_info or "")} симв.')

            self.stdout.write('\n🔍 ПРЕДПРОСМОТР ПОЛЕЙ:')
            self.stdout.write(f'\n--- short_description (первые 100 симв.) ---')
            self.stdout.write(event.short_description[:100] if event.short_description else 'пусто')

            self.stdout.write(f'\n--- description (первые 100 симв.) ---')
            self.stdout.write(event.description[:100] if event.description else 'пусто')

            self.stdout.write(f'\n--- additional_info (первые 100 симв.) ---')
            self.stdout.write(event.additional_info[:100] if event.additional_info else 'пусто')

            self.stdout.write(f'\n{"=" * 60}\n')