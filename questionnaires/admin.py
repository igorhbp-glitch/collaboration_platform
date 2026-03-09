# questionnaires/admin.py
from django.contrib import admin
from django import forms
import json
from .models import Questionnaire, Question, Answer


class QuestionForm(forms.ModelForm):
    options_json = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3}),
        label='Варианты ответов (JSON)',
        required=False,
        help_text='Введите JSON массив, например: ["Вариант 1", "Вариант 2"]'
    )

    class Meta:
        model = Question
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.options:
            self.initial['options_json'] = json.dumps(self.instance.options, ensure_ascii=False)

    def clean_options_json(self):
        options_json = self.cleaned_data.get('options_json', '')
        if options_json:
            try:
                return json.loads(options_json)
            except json.JSONDecodeError:
                raise forms.ValidationError('Неверный JSON формат')
        return []

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.options = self.cleaned_data.get('options_json', [])
        if commit:
            instance.save()
        return instance


class QuestionInline(admin.TabularInline):
    model = Question
    form = QuestionForm
    extra = 1
    fields = ['text', 'question_type', 'order', 'is_required', 'options_json']


@admin.register(Questionnaire)
class QuestionnaireAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'target_audience', 'created_by', 'created_at']
    list_filter = ['status', 'target_audience', 'created_at']
    search_fields = ['title', 'description']
    inlines = [QuestionInline]

    def save_model(self, request, obj, form, change):
        if not change:  # Если создается новый объект
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    form = QuestionForm
    list_display = ['text', 'questionnaire', 'question_type', 'order', 'is_required']
    list_filter = ['question_type', 'questionnaire']
    search_fields = ['text']
    fields = ['questionnaire', 'text', 'question_type', 'order', 'is_required', 'options_json']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['respondent', 'question', 'answered_at']
    list_filter = ['answered_at', 'question__questionnaire']
    search_fields = ['respondent__email', 'question__text']