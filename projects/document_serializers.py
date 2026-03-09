# projects/document_serializers.py
import os
from rest_framework import serializers
from .models import ProjectDocument
from users.serializers import UserSerializer


class ProjectDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_user = UserSerializer(source='uploaded_by', read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectDocument
        fields = [
            'id', 'project', 'file', 'name', 'size', 'extension',
            'uploaded_by', 'uploaded_by_user', 'uploaded_by_name',
            'uploaded_at', 'url'
        ]
        read_only_fields = ['id', 'project', 'uploaded_by', 'uploaded_at', 'url', 'name', 'size', 'extension']

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.email
        return 'Неизвестно'

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class UploadDocumentSerializer(serializers.Serializer):
    """
    Отдельный сериализатор для загрузки файлов
    """
    file = serializers.FileField()

    def validate_file(self, value):
        print(f"🔍 Валидация файла: {value.name}, размер: {value.size}")

        # Проверка размера (максимум 50MB)
        max_size = 50 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(f"Файл слишком большой. Максимальный размер: 50MB")

        # Проверка расширения
        ext = os.path.splitext(value.name)[1].lower()
        allowed_extensions = [
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.ppt', '.pptx', '.txt', '.md', '.rtf',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
            '.zip', '.rar', '.7z', '.tar', '.gz',
            '.py', '.js', '.html', '.css', '.json', '.xml', '.csv'
        ]

        if ext not in allowed_extensions:
            raise serializers.ValidationError(f"Недопустимый тип файла. Разрешены: {', '.join(allowed_extensions)}")

        return value

    def create(self, validated_data):
        request = self.context.get('request')
        project = self.context.get('project')
        file = validated_data['file']

        print(f"✅ Создание документа в БД:")
        print(f"   Проект ID: {project.id}")
        print(f"   Файл: {file.name}")
        print(f"   Размер: {file.size}")
        print(f"   Пользователь: {request.user.email}")

        return ProjectDocument.objects.create(
            project=project,
            file=file,
            name=file.name,
            size=file.size,
            extension=os.path.splitext(file.name)[1].lower(),
            uploaded_by=request.user
        )