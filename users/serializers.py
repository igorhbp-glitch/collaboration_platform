# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    CustomUser, Branch, StudyProgram, Department,
    ResearchField, Methodology, Competency,
    CollaborationType, PublicationType
)


# ============================================
# СЕРИАЛИЗАТОРЫ ДЛЯ СПРАВОЧНИКОВ
# ============================================

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'city', 'is_college', 'order']


class StudyProgramSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = StudyProgram
        fields = ['id', 'name', 'code', 'level', 'level_display', 'branch']


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'branch']


class ResearchFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchField
        fields = ['id', 'name', 'category']


class MethodologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Methodology
        fields = ['id', 'name']


class CompetencySerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Competency
        fields = ['id', 'name', 'category', 'category_display']


class CollaborationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollaborationType
        fields = ['id', 'name']


class PublicationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicationType
        fields = ['id', 'name']


# ============================================
# ОСНОВНОЙ СЕРИАЛИЗАТОР ПОЛЬЗОВАТЕЛЯ
# ============================================

class UserSerializer(serializers.ModelSerializer):
    # Поля для отображения связанных объектов (read_only)
    branch_detail = BranchSerializer(source='branch', read_only=True)
    study_program_detail = StudyProgramSerializer(source='study_program', read_only=True)
    department_detail = DepartmentSerializer(source='department', read_only=True)
    research_fields_detail = ResearchFieldSerializer(source='research_fields', many=True, read_only=True)
    methodologies_detail = MethodologySerializer(source='methodologies', many=True, read_only=True)
    competencies_detail = CompetencySerializer(source='competencies', many=True, read_only=True)
    publication_types_detail = PublicationTypeSerializer(source='publication_types', many=True, read_only=True)
    collaboration_types_detail = CollaborationTypeSerializer(source='collaboration_types', many=True, read_only=True)

    # Поля для записи (ID)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        required=False,
        allow_null=True
    )
    study_program_id = serializers.PrimaryKeyRelatedField(
        queryset=StudyProgram.objects.all(),
        source='study_program',
        write_only=True,
        required=False,
        allow_null=True
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True,
        required=False,
        allow_null=True
    )
    research_field_ids = serializers.PrimaryKeyRelatedField(
        queryset=ResearchField.objects.all(),
        source='research_fields',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )
    methodology_ids = serializers.PrimaryKeyRelatedField(
        queryset=Methodology.objects.all(),
        source='methodologies',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )
    competency_ids = serializers.PrimaryKeyRelatedField(
        queryset=Competency.objects.all(),
        source='competencies',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )
    publication_type_ids = serializers.PrimaryKeyRelatedField(
        queryset=PublicationType.objects.all(),
        source='publication_types',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )
    collaboration_type_ids = serializers.PrimaryKeyRelatedField(
        queryset=CollaborationType.objects.all(),
        source='collaboration_types',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )

    full_name = serializers.SerializerMethodField()
    position_display = serializers.CharField(source='get_position_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            # ID и основная информация
            'id', 'email', 'username',
            'first_name', 'last_name', 'middle_name',
            'full_name',
            'role', 'avatar', 'phone', 'bio',

            # Образование и должность
            'branch', 'branch_id', 'branch_detail',
            'study_program', 'study_program_id', 'study_program_detail',
            'position', 'position_display',
            'academic_degree',
            'department', 'department_id', 'department_detail',

            # Научные интересы
            'research_fields', 'research_field_ids', 'research_fields_detail',
            'methodologies', 'methodology_ids', 'methodologies_detail',

            # Компетенции
            'competencies', 'competency_ids', 'competencies_detail',

            # Опыт и публикации
            'publications_count',
            'publication_types', 'publication_type_ids', 'publication_types_detail',
            'projects_experience',

            # Сотрудничество
            'collaboration_types', 'collaboration_type_ids', 'collaboration_types_detail',

            # Метаданные
            'created_at', 'updated_at', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'date_joined', 'is_active']

    def get_full_name(self, obj):
        """Полное имя с отчеством"""
        parts = []
        if obj.last_name:
            parts.append(obj.last_name)
        if obj.first_name:
            parts.append(obj.first_name)
        if obj.middle_name:
            parts.append(obj.middle_name)
        return ' '.join(parts) if parts else obj.username

    def to_representation(self, instance):
        """Кастомное представление для удобства фронтенда"""
        representation = super().to_representation(instance)

        # Преобразуем ManyToMany поля в списки названий
        if 'research_fields_detail' in representation:
            representation['research_fields'] = [
                item['name'] for item in representation['research_fields_detail']
            ]

        if 'methodologies_detail' in representation:
            representation['methodologies'] = [
                item['name'] for item in representation['methodologies_detail']
            ]

        if 'competencies_detail' in representation:
            representation['competencies'] = [
                item['name'] for item in representation['competencies_detail']
            ]

        if 'publication_types_detail' in representation:
            representation['publication_types'] = [
                item['name'] for item in representation['publication_types_detail']
            ]

        if 'collaboration_types_detail' in representation:
            representation['collaboration_types'] = [
                item['name'] for item in representation['collaboration_types_detail']
            ]

        # Убираем временные поля
        representation.pop('research_fields_detail', None)
        representation.pop('methodologies_detail', None)
        representation.pop('competencies_detail', None)
        representation.pop('publication_types_detail', None)
        representation.pop('collaboration_types_detail', None)

        return representation


class SafeUserSerializer(serializers.ModelSerializer):
    """Безопасный сериализатор для публичных данных"""
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    study_program_name = serializers.CharField(source='study_program.name', read_only=True)
    position_display = serializers.CharField(source='get_position_display', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'middle_name',
            'full_name',
            'role', 'avatar', 'bio',
            'branch_name', 'study_program_name', 'position_display'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        parts = []
        if obj.last_name:
            parts.append(obj.last_name)
        if obj.first_name:
            parts.append(obj.first_name)
        if obj.middle_name:
            parts.append(obj.middle_name)
        return ' '.join(parts) if parts else obj.username


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'email', 'username',
            'first_name', 'last_name', 'middle_name',
            'password', 'password_confirm', 'role'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = CustomUser.objects.get(email=email)

                if not user.check_password(password):
                    raise serializers.ValidationError("Неверные учетные данные")

                if not user.is_active:
                    raise serializers.ValidationError("Аккаунт деактивирован")

                attrs['user'] = user
                return attrs

            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("Неверные учетные данные")

        raise serializers.ValidationError("Необходимо указать email и пароль")


class UserUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для частичного обновления профиля"""

    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(),
        source='branch',
        write_only=True,
        required=False,
        allow_null=True
    )
    study_program_id = serializers.PrimaryKeyRelatedField(
        queryset=StudyProgram.objects.all(),
        source='study_program',
        write_only=True,
        required=False,
        allow_null=True
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True,
        required=False,
        allow_null=True
    )
    research_field_ids = serializers.PrimaryKeyRelatedField(
        queryset=ResearchField.objects.all(),
        source='research_fields',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )
    methodology_ids = serializers.PrimaryKeyRelatedField(
        queryset=Methodology.objects.all(),
        source='methodologies',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )
    competency_ids = serializers.PrimaryKeyRelatedField(
        queryset=Competency.objects.all(),
        source='competencies',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )
    publication_type_ids = serializers.PrimaryKeyRelatedField(
        queryset=PublicationType.objects.all(),
        source='publication_types',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )
    collaboration_type_ids = serializers.PrimaryKeyRelatedField(
        queryset=CollaborationType.objects.all(),
        source='collaboration_types',
        many=True,
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'middle_name',
            'bio', 'phone', 'avatar',
            'position', 'academic_degree',
            'publications_count', 'projects_experience',
            'branch_id', 'study_program_id', 'department_id',
            'research_field_ids', 'methodology_ids',
            'competency_ids', 'publication_type_ids',
            'collaboration_type_ids'
        ]


# ============================================
# 🔥 ОБНОВЛЁННЫЙ ПУБЛИЧНЫЙ СЕРИАЛИЗАТОР
# ============================================
class PublicUserSerializer(serializers.ModelSerializer):
    """Публичный сериализатор для отображения в рекомендациях и поиске"""
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    study_program_name = serializers.CharField(source='study_program.name', read_only=True)
    position_display = serializers.CharField(source='get_position_display', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    # 🔥 УБИРАЕМ source, так как имя поля совпадает с именем атрибута
    research_fields = serializers.StringRelatedField(many=True, read_only=True)
    methodologies = serializers.StringRelatedField(many=True, read_only=True)
    competencies = serializers.StringRelatedField(many=True, read_only=True)
    publication_types = serializers.StringRelatedField(many=True, read_only=True)
    collaboration_types = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'middle_name',
            'full_name',
            'role', 'avatar_url', 'bio',
            'branch_name', 'study_program_name', 'position_display',
            'research_fields', 'methodologies', 'competencies',
            'publications_count', 'publication_types',
            'projects_experience', 'collaboration_types'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        parts = []
        if obj.last_name:
            parts.append(obj.last_name)
        if obj.first_name:
            parts.append(obj.first_name)
        if obj.middle_name:
            parts.append(obj.middle_name)
        return ' '.join(parts) if parts else obj.username

    def get_avatar_url(self, obj):
        """Возвращает полный URL аватара, если он есть"""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None