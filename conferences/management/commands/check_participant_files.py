# conferences/management/commands/check_participant_files.py
from django.core.management.base import BaseCommand
from django.conf import settings
from conferences.models import EventParticipant
import json
import os


class Command(BaseCommand):
    help = 'Проверяет данные участника и его файлы'

    def add_arguments(self, parser):
        parser.add_argument('--participant-id', type=int, required=True, help='ID участника')
        parser.add_argument('--check-files', action='store_true', help='Проверить физическое наличие файлов')

    def handle(self, *args, **options):
        participant_id = options['participant_id']
        check_files = options['check_files']

        try:
            participant = EventParticipant.objects.select_related(
                'user', 'event', 'project'
            ).get(id=participant_id)
        except EventParticipant.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ Участник с ID {participant_id} не найден'))
            return

        self.stdout.write(self.style.SUCCESS(f'\n{"=" * 60}'))
        self.stdout.write(f'🔍 ПРОВЕРКА УЧАСТНИКА ID: {participant_id}')
        self.stdout.write(f'{"=" * 60}\n')

        # Основная информация
        self.stdout.write('📋 ОСНОВНАЯ ИНФОРМАЦИЯ:')
        self.stdout.write(f'• ID: {participant.id}')
        self.stdout.write(f'• Пользователь: {participant.user.email} ({participant.user.get_full_name()})')
        self.stdout.write(f'• Мероприятие: {participant.event.title} (ID: {participant.event_id})')
        self.stdout.write(f'• Тип участия: {participant.participation_type}')
        self.stdout.write(f'• Статус: {participant.status}')
        self.stdout.write(f'• Пленарный: {participant.is_plenary}')

        if participant.project:
            self.stdout.write(f'• Проект: {participant.project.title} (ID: {participant.project_id})')

        self.stdout.write('\n📁 ПОЛЕ uploaded_files:')

        if not participant.uploaded_files:
            self.stdout.write(self.style.WARNING('  ⚠️ uploaded_files пуст'))
        else:
            self.stdout.write(f'  📦 Количество файлов: {len(participant.uploaded_files)}')
            self.stdout.write('  📄 Содержимое:')

            for i, file_data in enumerate(participant.uploaded_files, 1):
                self.stdout.write(f'\n  🔹 Файл #{i}:')

                # Выводим все поля
                for key, value in file_data.items():
                    self.stdout.write(f'    • {key}: {value}')

                # Проверяем наличие url
                if 'url' not in file_data:
                    self.stdout.write(self.style.WARNING('    ⚠️ ПОЛЕ "url" ОТСУТСТВУЕТ!'))

                # Проверяем filename или name
                filename = file_data.get('filename') or file_data.get('name')
                if not filename:
                    self.stdout.write(self.style.WARNING('    ⚠️ НЕТ ИМЕНИ ФАЙЛА!'))

                # Проверяем физическое наличие файла
                if check_files and filename:
                    expected_path = os.path.join(
                        settings.MEDIA_ROOT,
                        'participation_files',
                        str(participant.event_id),
                        filename
                    )

                    if os.path.exists(expected_path):
                        self.stdout.write(self.style.SUCCESS(f'    ✅ Файл найден: {expected_path}'))

                        # Показываем предполагаемый URL
                        media_url = f"{settings.MEDIA_URL}participation_files/{participant.event_id}/{filename}"
                        self.stdout.write(f'    📎 Медиа URL: {media_url}')
                        self.stdout.write(f'    📎 Полный URL: http://localhost:8001{media_url}')
                    else:
                        self.stdout.write(self.style.ERROR(f'    ❌ Файл НЕ НАЙДЕН: {expected_path}'))

        # Проверяем SpeakerMaterial
        materials = participant.materials.all()
        if materials.exists():
            self.stdout.write('\n📚 SPEAKER MATERIALS:')
            for material in materials:
                self.stdout.write(f'  • Материал ID {material.id}: {material.title}')
                if material.files:
                    self.stdout.write(f'    Файлы: {len(material.files)}')
                    for j, file_data in enumerate(material.files, 1):
                        self.stdout.write(f'      - Файл {j}: {file_data.get("name")} (url: {file_data.get("url")})')

        self.stdout.write(self.style.SUCCESS(f'\n{"=" * 60}\n'))