# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


# ============================================
# СПРАВОЧНИКИ (ДАННЫЕ ИЗ АНКЕТЫ)
# ============================================

class Branch(models.Model):
    """
    Филиалы Финансового университета
    """
    name = models.CharField(max_length=255, verbose_name="Название филиала")
    city = models.CharField(max_length=100, blank=True, verbose_name="Город")
    is_college = models.BooleanField(default=False, verbose_name="Колледж")
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок отображения")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Филиал"
        verbose_name_plural = "Филиалы"
        ordering = ['order', 'name']


class StudyProgram(models.Model):
    """
    Направления подготовки (специальности)
    """

    class Level(models.TextChoices):
        SPO = 'spo', 'СПО'
        BACHELOR = 'bachelor', 'Бакалавриат'
        MASTER = 'master', 'Магистратура'
        POSTGRADUATE = 'postgraduate', 'Аспирантура'

    name = models.CharField(max_length=255, verbose_name="Название")
    code = models.CharField(max_length=20, verbose_name="Код специальности")
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        verbose_name="Уровень образования"
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='study_programs',
        null=True,
        blank=True,
        verbose_name="Филиал"
    )

    def __str__(self):
        level_display = dict(self.Level.choices).get(self.level, '')
        return f"{self.name} ({self.code}) - {level_display}"

    class Meta:
        verbose_name = "Направление подготовки"
        verbose_name_plural = "Направления подготовки"
        ordering = ['level', 'name']


class Department(models.Model):
    """
    Кафедры
    """
    name = models.CharField(max_length=255, verbose_name="Название кафедры")
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name='departments',
        null=True,
        blank=True,
        verbose_name="Филиал"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Кафедра"
        verbose_name_plural = "Кафедры"
        ordering = ['name']


class ResearchField(models.Model):
    """
    Научные направления (интересы)
    """
    name = models.CharField(max_length=255, verbose_name="Название")
    category = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Категория"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Научное направление"
        verbose_name_plural = "Научные направления"
        ordering = ['name']


class Methodology(models.Model):
    """
    Методологии и подходы
    """
    name = models.CharField(max_length=255, verbose_name="Название")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Методология"
        verbose_name_plural = "Методологии"
        ordering = ['name']


class Competency(models.Model):
    """
    Компетенции (навыки)
    """

    class Category(models.TextChoices):
        ANALYTICAL = 'analytical', 'Аналитические навыки'
        RESEARCH = 'research', 'Исследовательские навыки'
        QUANTITATIVE = 'quantitative', 'Количественные методы'
        ECONOMIC = 'economic', 'Экономические компетенции'
        FINANCIAL = 'financial', 'Финансовые компетенции'
        TECHNICAL = 'technical', 'Технические навыки'
        LANGUAGES = 'languages', 'Языки'
        SOFT = 'soft', 'Мягкие навыки'

    name = models.CharField(max_length=255, verbose_name="Название")
    category = models.CharField(
        max_length=50,
        choices=Category.choices,
        verbose_name="Категория"
    )

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    class Meta:
        verbose_name = "Компетенция"
        verbose_name_plural = "Компетенции"
        ordering = ['category', 'name']


class CollaborationType(models.Model):
    """
    Типы сотрудничества
    """
    name = models.CharField(max_length=255, verbose_name="Название")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Тип сотрудничества"
        verbose_name_plural = "Типы сотрудничества"
        ordering = ['name']


class PublicationType(models.Model):
    """
    Типы публикаций
    """
    name = models.CharField(max_length=255, verbose_name="Название")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Тип публикации"
        verbose_name_plural = "Типы публикаций"
        ordering = ['name']


# ============================================
# ОСНОВНАЯ МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ
# ============================================

class CustomUser(AbstractUser):
    # 🔥 НОВЫЕ РОЛИ (упрощённые)
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Администратор'
        MODERATOR = 'moderator', 'Модератор'
        USER = 'user', 'Пользователь'

    # Должности (подробное разделение студентов и преподавателей)
    class Position(models.TextChoices):
        # Для студентов
        STUDENT = 'student', 'Студент'
        SPO_STUDENT = 'spo_student', 'Студент колледжа (СПО)'
        BACHELOR = 'bachelor', 'Студент бакалавриата'
        MASTER = 'master', 'Студент магистратуры'
        POSTGRADUATE = 'postgraduate', 'Аспирант'
        DOCTORAL = 'doctoral', 'Докторант'

        # Для сотрудников
        LECTURER = 'lecturer', 'Преподаватель'
        SENIOR_LECTURER = 'senior_lecturer', 'Старший преподаватель'
        DOCENT = 'docent', 'Доцент'
        PROFESSOR = 'professor', 'Профессор'
        HEAD_OF_DEPARTMENT = 'head_of_department', 'Заведующий кафедрой'
        DEAN = 'dean', 'Декан факультета'
        RESEARCHER = 'researcher', 'Научный сотрудник'
        SENIOR_RESEARCHER = 'senior_researcher', 'Ведущий научный сотрудник'
        LAB_ASSISTANT = 'lab_assistant', 'Лаборант'
        ASSISTANT = 'assistant', 'Ассистент'
        METHODIST = 'methodist', 'Методист'

    # 🔥 НОВОЕ: роль в системе (админ/модератор/пользователь)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
        verbose_name="Роль в системе"
    )

    # 👤 Аватар
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name="Аватар",
        help_text="Загрузите фото для профиля"
    )

    # Контактная информация
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Телефон"
    )

    # Краткая информация
    bio = models.TextField(
        max_length=1000,
        blank=True,
        verbose_name="О себе"
    )

    # 🔥 НОВОЕ ПОЛЕ: Отчество
    middle_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Отчество"
    )

    # 🏫 Образование и должность (связано со справочниками)
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Филиал",
        related_name='users'
    )

    study_program = models.ForeignKey(
        StudyProgram,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Направление подготовки",
        related_name='users'
    )

    position = models.CharField(
        max_length=50,
        choices=Position.choices,
        null=True,
        blank=True,
        verbose_name="Должность/Статус"
    )

    academic_degree = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Ученая степень"
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Кафедра",
        related_name='users'
    )

    # 🔬 Научные интересы (Many-to-Many)
    research_fields = models.ManyToManyField(
        ResearchField,
        blank=True,
        verbose_name="Научные интересы",
        related_name='users'
    )

    methodologies = models.ManyToManyField(
        Methodology,
        blank=True,
        verbose_name="Методологии",
        related_name='users'
    )

    # 💻 Компетенции (Many-to-Many)
    competencies = models.ManyToManyField(
        Competency,
        blank=True,
        verbose_name="Компетенции",
        related_name='users'
    )

    # 📚 Опыт и публикации
    publications_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Количество публикаций"
    )

    publication_types = models.ManyToManyField(
        PublicationType,
        blank=True,
        verbose_name="Типы публикаций",
        related_name='users'
    )

    projects_experience = models.TextField(
        blank=True,
        verbose_name="Опыт участия в проектах",
        help_text="Расскажите о проектах, в которых вы участвовали"
    )

    # 🤝 Сотрудничество
    collaboration_types = models.ManyToManyField(
        CollaborationType,
        blank=True,
        verbose_name="Типы сотрудничества",
        related_name='users'
    )

    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата регистрации")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self):
        """Полное имя пользователя с отчеством"""
        parts = []
        if self.last_name:
            parts.append(self.last_name)
        if self.first_name:
            parts.append(self.first_name)
        if self.middle_name:
            parts.append(self.middle_name)
        return ' '.join(parts) if parts else self.username

    @property
    def is_staff_member(self):
        """Является ли пользователь сотрудником (не студентом)"""
        return self.position and self.position in [
            self.Position.LECTURER, self.Position.SENIOR_LECTURER,
            self.Position.DOCENT, self.Position.PROFESSOR,
            self.Position.HEAD_OF_DEPARTMENT, self.Position.DEAN,
            self.Position.RESEARCHER, self.Position.SENIOR_RESEARCHER,
            self.Position.LAB_ASSISTANT, self.Position.ASSISTANT,
            self.Position.METHODIST
        ]

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
        indexes = [
            models.Index(fields=['branch']),
            models.Index(fields=['study_program']),
            models.Index(fields=['position']),
        ]


# ============================================
# МОДЕЛИ ДЛЯ ОТВЕТОВ НА АНКЕТУ (ИСТОРИЯ)
# ============================================

class QuestionnaireAnswer(models.Model):
    """
    Сохраняет ответы пользователя на анкету (для истории)
    """
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='questionnaire_answer_history',
        verbose_name="Пользователь"
    )

    # Копируем все поля на момент ответа (для истории)
    branch = models.CharField(max_length=255, blank=True, verbose_name="Филиал")
    study_program = models.CharField(max_length=255, blank=True, verbose_name="Специальность")
    position = models.CharField(max_length=100, blank=True, verbose_name="Должность")
    academic_degree = models.CharField(max_length=100, blank=True, verbose_name="Ученая степень")
    department = models.CharField(max_length=255, blank=True, verbose_name="Кафедра")

    research_fields = models.JSONField(default=list, verbose_name="Научные интересы")
    methodologies = models.JSONField(default=list, verbose_name="Методологии")
    competencies = models.JSONField(default=list, verbose_name="Компетенции")

    publications_count = models.PositiveIntegerField(default=0, verbose_name="Публикации")
    publication_types = models.JSONField(default=list, verbose_name="Типы публикаций")
    projects_experience = models.TextField(blank=True, verbose_name="Опыт в проектах")

    collaboration_types = models.JSONField(default=list, verbose_name="Типы сотрудничества")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата заполнения")

    class Meta:
        verbose_name = "Ответ на анкету"
        verbose_name_plural = "Ответы на анкеты"
        ordering = ['-created_at']

    def __str__(self):
        return f"Анкета {self.user.email} от {self.created_at.strftime('%d.%m.%Y')}"