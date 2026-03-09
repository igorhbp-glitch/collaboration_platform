# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from .models import (
    CustomUser, Branch, StudyProgram, Department,
    ResearchField, Methodology, Competency,
    CollaborationType, PublicationType, QuestionnaireAnswer
)


class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'middle_name', 'get_position_display', 'branch',
                    'get_role_display', 'is_active')
    list_filter = ('role', 'branch', 'position', 'is_active')
    search_fields = ('email', 'first_name', 'last_name', 'middle_name')
    readonly_fields = ('created_at', 'updated_at', 'last_login', 'date_joined')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Личная информация', {
            'fields': (
                'first_name', 'last_name', 'middle_name',
                'avatar', 'phone', 'bio',
                'position', 'academic_degree'
            )
        }),
        ('Образование', {
            'fields': ('branch', 'study_program', 'department'),
            'classes': ('wide',)
        }),
        ('Научные интересы', {
            'fields': ('research_fields', 'methodologies'),
            'classes': ('wide',)
        }),
        ('Компетенции', {
            'fields': ('competencies',),
            'classes': ('wide',)
        }),
        ('Опыт и публикации', {
            'fields': ('publications_count', 'publication_types', 'projects_experience'),
            'classes': ('wide',)
        }),
        ('Сотрудничество', {
            'fields': ('collaboration_types',),
            'classes': ('wide',)
        }),
        ('Права доступа', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Важные даты', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'middle_name'),
        }),
    )

    ordering = ('email',)
    filter_horizontal = (
        'research_fields', 'methodologies', 'competencies',
        'publication_types', 'collaboration_types'
    )

    def get_fieldsets(self, request, obj=None):
        """
        Динамически изменяем fieldsets в зависимости от прав пользователя
        """
        fieldsets = super().get_fieldsets(request, obj)

        # Если пользователь не суперпользователь - скрываем системные роли
        if not request.user.is_superuser:
            # Создаем новый список fieldsets без раздела 'Права доступа'
            new_fieldsets = []
            for name, options in fieldsets:
                if name != 'Права доступа':
                    new_fieldsets.append((name, options))
            return new_fieldsets

        return fieldsets

    def get_readonly_fields(self, request, obj=None):
        """
        Делаем поле role readonly для не-суперпользователей
        """
        readonly = list(self.readonly_fields)

        if not request.user.is_superuser:
            # Обычные пользователи не могут менять роль
            readonly.append('role')

        return readonly

    def save_model(self, request, obj, form, change):
        """
        Защита от изменения role не-суперпользователями
        """
        if not request.user.is_superuser and change:
            # Если это не суперпользователь и объект уже существует
            old_obj = self.model.objects.get(pk=obj.pk)
            if old_obj.role != obj.role:
                # Пытались изменить role - возвращаем старое значение
                obj.role = old_obj.role
                self.message_user(
                    request,
                    "Изменение роли запрещено. Обратитесь к администратору.",
                    level='WARNING'
                )

        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        """
        Ограничиваем видимость для не-суперпользователей
        """
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            # Обычные пользователи видят только обычных пользователей (не админов)
            return qs.filter(role__in=['student', 'teacher'])
        return qs

    def get_role_display(self, obj):
        """
        Отображение роли в списке
        """
        return obj.get_role_display()

    get_role_display.short_description = 'Роль'
    get_role_display.admin_order_field = 'role'

    def get_position_display(self, obj):
        """
        Отображение должности в списке
        """
        return obj.get_position_display() if obj.position else 'Не указана'

    get_position_display.short_description = 'Должность'
    get_position_display.admin_order_field = 'position'


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'is_college', 'order')
    list_editable = ('order',)
    list_filter = ('is_college',)
    search_fields = ('name', 'city')

    def has_module_permission(self, request):
        # Только суперпользователи могут управлять справочниками
        return request.user.is_superuser


@admin.register(StudyProgram)
class StudyProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'level', 'branch')
    list_filter = ('level', 'branch')
    search_fields = ('name', 'code')

    def has_module_permission(self, request):
        return request.user.is_superuser


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'branch')
    list_filter = ('branch',)
    search_fields = ('name',)

    def has_module_permission(self, request):
        return request.user.is_superuser


@admin.register(ResearchField)
class ResearchFieldAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name',)

    def has_module_permission(self, request):
        return request.user.is_superuser


@admin.register(Methodology)
class MethodologyAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

    def has_module_permission(self, request):
        return request.user.is_superuser


@admin.register(Competency)
class CompetencyAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name',)

    def has_module_permission(self, request):
        return request.user.is_superuser


@admin.register(CollaborationType)
class CollaborationTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

    def has_module_permission(self, request):
        return request.user.is_superuser


@admin.register(PublicationType)
class PublicationTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

    def has_module_permission(self, request):
        return request.user.is_superuser


@admin.register(QuestionnaireAnswer)
class QuestionnaireAnswerAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email',)
    readonly_fields = ('created_at',)

    fieldsets = (
        (None, {'fields': ('user',)}),
        ('Образование', {'fields': ('branch', 'study_program', 'position', 'academic_degree', 'department')}),
        ('Научные интересы', {'fields': ('research_fields', 'methodologies')}),
        ('Компетенции', {'fields': ('competencies',)}),
        ('Опыт', {'fields': ('publications_count', 'publication_types', 'projects_experience')}),
        ('Сотрудничество', {'fields': ('collaboration_types',)}),
        ('Метаданные', {'fields': ('created_at',)}),
    )

    def has_module_permission(self, request):
        return request.user.is_superuser


# Регистрируем основную модель
admin.site.register(CustomUser, CustomUserAdmin)

# 🔥 ИСПРАВЛЕНО: Проверяем, зарегистрирована ли уже модель Group
try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    # Модель еще не зарегистрирована - ничего страшного
    pass


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    def has_module_permission(self, request):
        return request.user.is_superuser