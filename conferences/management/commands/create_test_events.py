# conferences/management/commands/create_test_events.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date
import random
from conferences.models import Event, Section
from users.models import CustomUser

class Command(BaseCommand):
    help = 'Создаёт 15 тестовых мероприятий для проверки пагинации'

    def handle(self, *args, **options):
        # Получаем первого пользователя (или создаём, если нет)
        user = CustomUser.objects.first()
        if not user:
            self.stdout.write(self.style.ERROR('❌ Нет пользователей в системе. Сначала создай пользователя.'))
            return

        self.stdout.write(self.style.SUCCESS(f'✅ Использую пользователя: {user.email}'))

        # Очищаем старые тестовые мероприятия (опционально)
        # Event.objects.filter(title__startswith='[ТЕСТ]').delete()
        # self.stdout.write('🧹 Старые тестовые мероприятия удалены')

        # Типы мероприятий
        event_types = [
            'conference', 'seminar', 'symposium', 'workshop', 'school',
            'congress', 'forum', 'roundtable', 'competition', 'festival'
        ]

        # Уровни мероприятий
        event_levels = [
            'international', 'national', 'interregional', 'regional', 'university'
        ]

        # Филиалы
        branches = [
            "Алтайский филиал Финуниверситета",
            "Владикавказский филиал Финуниверситета",
            "Владимирский филиал Финуниверситета",
            "Калужский филиал Финуниверситета",
            "Краснодарский филиал Финуниверситета",
            "Курский филиал Финуниверситета",
            "Липецкий филиал Финуниверситета",
            "Новороссийский филиал Финуниверситета",
            "Омский филиал Финуниверситета",
            "Орловский филиал Финуниверситета",
            "Пензенский филиал Финуниверситета",
            "Санкт-Петербургский филиал Финуниверситета",
            "Смоленский филиал Финуниверситета",
            "Тульский филиал Финуниверситета",
            "Уральский филиал Финуниверситета",
            "Уфимский филиал Финуниверситета",
            "Ярославский филиал Финуниверситета"
        ]

        # Названия мероприятий
        event_titles = [
            "Международная конференция «Цифровая экономика 2026»",
            "Всероссийский семинар «Методы машинного обучения в финансах»",
            "Симпозиум «Искусственный интеллект и право»",
            "Воркшоп «Анализ больших данных в R»",
            "Летняя школа «Финансовые технологии»",
            "Конгресс «Устойчивое развитие»",
            "Форум «Молодые учёные экономики»",
            "Круглый стол «Этика в науке»",
            "Конкурс научных работ студентов",
            "Фестиваль науки «Эврика»",
            "Хакатон «FinTech Challenge»",
            "Научно-практическая конференция «Бухгалтерский учёт 2026»",
            "Семинар «Как написать диссертацию»",
            "Мастер-класс «Публичные выступления»",
            "Межвузовская олимпиада по экономике"
        ]

        # Описания
        descriptions = [
            "Обсуждение актуальных вопросов цифровизации экономики и финансового сектора.",
            "Практические методы машинного обучения для анализа финансовых временных рядов.",
            "Правовые аспекты внедрения ИИ в финансовую сферу.",
            "Интенсивный практикум по работе с большими данными в среде R.",
            "Обучение современным финансовым технологиям и блокчейну.",
            "Вопросы устойчивого развития и ESG-инвестирования.",
            "Площадка для обмена опытом молодых исследователей.",
            "Дискуссия об этических проблемах современной науки.",
            "Соревнование лучших студенческих научных работ.",
            "Интерактивные лекции и мастер-классы для школьников и студентов.",
            "Командные соревнования по созданию финансовых приложений.",
            "Современные тенденции бухгалтерского учёта и аудита.",
            "Практические советы по написанию и защите диссертации.",
            "Тренинг по ораторскому мастерству для исследователей.",
            "Соревнования по решению экономических задач."
        ]

        created_count = 0

        for i in range(15):
            # Случайные даты
            today = date.today()
            start_date = today + timedelta(days=random.randint(10, 90))
            end_date = start_date + timedelta(days=random.randint(1, 3))
            deadline = start_date - timedelta(days=random.randint(5, 15))

            # Случайный выбор филиалов (1-3 филиала)
            num_branches = random.randint(1, 3)
            selected_branches = random.sample(branches, num_branches)

            # Тип и уровень
            event_type = random.choice(event_types)
            event_level = random.choice(event_levels)

            # Есть ли секции (для некоторых типов)
            has_sections = event_type in ['conference', 'symposium', 'congress', 'forum', 'festival']

            # Создаём мероприятие
            event = Event.objects.create(
                title=f"[ТЕСТ] {event_titles[i % len(event_titles)]}",
                description=descriptions[i % len(descriptions)],
                short_description=descriptions[i % len(descriptions)][:100] + "...",
                type=event_type,
                level=event_level,
                start_date=start_date,
                end_date=end_date,
                registration_deadline=deadline,
                organizer_branches=selected_branches,
                has_sections=has_sections,
                additional_info=f"Организаторы: {', '.join(selected_branches)}. Контакты: org@example.com",
                created_by=user,
                status='published'  # Сразу публикуем
            )

            # Если есть секции, создаём 2-3 секции
            if has_sections:
                num_sections = random.randint(2, 3)
                for j in range(num_sections):
                    Section.objects.create(
                        event=event,
                        title=f"Секция {j+1}: {'Экономика' if j==0 else 'Финансы' if j==1 else 'Право'}",
                        description=f"Тематика секции {j+1}",
                        color=random.choice(['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0'])
                    )

            created_count += 1
            self.stdout.write(f'  ✅ Создано: {event.title}')

        self.stdout.write(self.style.SUCCESS(f'\n🎉 Успешно создано {created_count} тестовых мероприятий!'))