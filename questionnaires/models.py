# questionnaires/models.py - ОБНОВЛЕННАЯ ВЕРСИЯ
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Questionnaire(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Черновик')
        ACTIVE = 'active', _('Активна')
        COMPLETED = 'completed', _('Завершена')

    title = models.CharField(max_length=255, verbose_name=_("Название анкеты"))
    description = models.TextField(verbose_name=_("Описание"), blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_questionnaires',
        verbose_name=_("Создатель")
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name=_("Статус")
    )
    target_audience = models.CharField(
        max_length=50,
        choices=[
            ('all', _('Все пользователи')),
            ('teachers', _('Преподаватели')),
            ('students', _('Студенты')),
        ],
        default='all',
        verbose_name=_("Целевая аудитория")
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Дата создания"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Дата обновления"))

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = _("Анкета")
        verbose_name_plural = _("Анкеты")
        ordering = ['-created_at']


class Question(models.Model):
    class QuestionType(models.TextChoices):
        TEXT = 'text', _('Текстовый ответ')
        SINGLE_CHOICE = 'single_choice', _('Один вариант')
        MULTIPLE_CHOICE = 'multiple_choice', _('Несколько вариантов')
        SCALE = 'scale', _('Шкала (1-5)')

    questionnaire = models.ForeignKey(
        Questionnaire,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name=_("Анкета")
    )
    text = models.TextField(verbose_name=_("Текст вопроса"))
    question_type = models.CharField(
        max_length=20,
        choices=QuestionType.choices,
        verbose_name=_("Тип вопроса")
    )
    order = models.PositiveIntegerField(default=0, verbose_name=_("Порядок"))
    is_required = models.BooleanField(default=True, verbose_name=_("Обязательный"))

    # Для вопросов с выбором вариантов
    options = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Варианты ответов"),
        help_text=_("JSON список вариантов для вопросов с выбором")
    )

    class Meta:
        verbose_name = _("Вопрос")
        verbose_name_plural = _("Вопросы")
        ordering = ['questionnaire', 'order']

    def __str__(self):
        return f"{self.questionnaire.title} - {self.text[:50]}"


class Answer(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name=_("Вопрос")
    )
    respondent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='questionnaire_responses',  # 👈 ИЗМЕНЕНО С questionnaire_answers НА questionnaire_responses
        verbose_name=_("Респондент")
    )
    answer_data = models.JSONField(verbose_name=_("Ответ"))
    answered_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Время ответа"))

    class Meta:
        verbose_name = _("Ответ")
        verbose_name_plural = _("Ответы")
        unique_together = ['question', 'respondent']

    def __str__(self):
        return f"{self.respondent.email} - {self.question.text[:30]}"