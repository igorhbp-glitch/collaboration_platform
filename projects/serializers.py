# projects/serializers.py - ПОЛНАЯ ВЕРСИЯ С ДОКУМЕНТАМИ

from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Project, ProjectMember, Task, Sprint, Comment, ProjectChatMessage, ProjectDocument
import json


class ProjectMemberSimpleSerializer(serializers.ModelSerializer):
    """
    Простой сериализатор для участников проекта (без циклических зависимостей)
    """
    id = serializers.IntegerField(source='user.id')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.CharField(source='user.email')
    username = serializers.CharField(source='user.username')
    avatar = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'first_name', 'last_name', 'email', 'username', 'avatar', 'role', 'status']

    def get_avatar(self, obj):
        """Возвращает полный URL аватара пользователя, если он есть"""
        if obj.user and obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = ProjectMember
        fields = [
            'id', 'user', 'user_id', 'user_name', 'user_email',
            'role', 'role_display', 'status', 'status_display',
            'message', 'rejection_reason', 'joined_at', 'created_at',
            'reviewed_by', 'reviewed_at',
            'can_edit_project', 'can_invite_members', 'can_create_tasks',
            'can_manage_tasks', 'can_delete_project'
        ]
        read_only_fields = ['joined_at', 'created_at', 'reviewed_by', 'reviewed_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_user_email(self, obj):
        return obj.user.email


class ProjectJoinRequestSerializer(serializers.Serializer):
    message = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=ProjectMember.Role.choices,
        default=ProjectMember.Role.RESEARCHER
    )


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    sprints_count = serializers.SerializerMethodField()
    completed_sprints_count = serializers.SerializerMethodField()
    current_sprint = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'project_type', 'owner',
            'status', 'scientific_field', 'required_competencies',
            'tags', 'member_count', 'max_members', 'is_private',
            'deadline', 'progress', 'created_at', 'updated_at', 'members',
            'conference_link', 'sprints_count', 'completed_sprints_count',
            'current_sprint', 'total_sprints', 'sprint_titles'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at', 'members', 'conference_link']

    def get_member_count(self, obj):
        return obj.members.filter(status='approved').count()

    def get_progress(self, obj):
        total_tasks = obj.tasks.count()
        if total_tasks == 0:
            return 0
        completed_tasks = obj.tasks.filter(status='done').count()
        return int((completed_tasks / total_tasks) * 100)

    def get_members(self, obj):
        """Возвращает утверждённых участников для отображения в шапке"""
        members = obj.members.filter(status='approved')[:5]
        return ProjectMemberSimpleSerializer(
            members,
            many=True,
            context={'request': self.context.get('request')}
        ).data

    def get_sprints_count(self, obj):
        return obj.sprints.count()

    def get_completed_sprints_count(self, obj):
        return obj.sprints.filter(status='completed').count()

    def get_current_sprint(self, obj):
        if obj.current_sprint:
            from .serializers import SprintSerializer
            return SprintSerializer(obj.current_sprint).data
        return None


class ProjectDetailSerializer(ProjectSerializer):
    memberships = ProjectMemberSerializer(source='members', many=True, read_only=True)
    members = serializers.SerializerMethodField()
    all_sprints = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()  # 🔥 ДОБАВЛЕНО

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['memberships', 'members', 'all_sprints', 'documents']

    def get_members(self, obj):
        """Возвращает всех утверждённых участников для детальной страницы"""
        members = obj.members.filter(status='approved')
        return ProjectMemberSimpleSerializer(
            members,
            many=True,
            context={'request': self.context.get('request')}
        ).data

    def get_all_sprints(self, obj):
        from .serializers import SprintSerializer
        sprints = obj.sprints.all().order_by('created_at')
        return SprintSerializer(sprints, many=True).data

    def get_documents(self, obj):
        """🔥 Возвращает документы проекта"""
        documents = obj.documents.all().order_by('-uploaded_at')
        return ProjectDocumentSerializer(
            documents,
            many=True,
            context={'request': self.context.get('request')}
        ).data


class CreateProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id',
            'title', 'description', 'project_type',
            'scientific_field', 'required_competencies',
            'tags', 'max_members', 'is_private', 'deadline',
            'total_sprints', 'sprint_titles'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['owner'] = request.user

        # Сначала создаём проект
        project = super().create(validated_data)

        # Создаём запись об участнике (владельце)
        from django.utils import timezone
        ProjectMember.objects.create(
            project=project,
            user=request.user,
            role='product_owner',
            status='approved',
            joined_at=timezone.now(),
            can_edit_project=True,
            can_invite_members=True,
            can_create_tasks=True,
            can_manage_tasks=True,
            can_delete_project=True,
            invited_by=None
        )

        return project


# СЕРИАЛИЗАТОР ДЛЯ СПРИНТОВ
class SprintSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress = serializers.ReadOnlyField()
    duration_days = serializers.ReadOnlyField()
    tasks_count = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()

    class Meta:
        model = Sprint
        fields = [
            'id', 'title', 'description', 'goal', 'status', 'status_display',
            'start_date', 'end_date', 'project', 'created_at', 'updated_at',
            'progress', 'duration_days', 'tasks_count', 'completed_tasks'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'project']

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='done').count()


class CreateSprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ['title', 'description', 'goal', 'start_date', 'end_date', 'status']

    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError(
                    "Дата начала не может быть позже даты окончания"
                )
        return data


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    created_by = UserSerializer(read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    project_id = serializers.IntegerField(write_only=True)
    comment_count = serializers.SerializerMethodField()
    sprint_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    sprint_title = serializers.CharField(source='sprint.title', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'project', 'project_id', 'project_title',
            'sprint', 'sprint_id', 'sprint_title', 'assignee', 'assignee_id', 'due_date',
            'estimated_hours', 'actual_hours', 'tags', 'position',
            'created_by', 'created_at', 'updated_at', 'comment_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'project']

    def get_comment_count(self, obj):
        return obj.comments.count()

    def validate_project_id(self, value):
        from .models import Project
        try:
            Project.objects.get(id=value)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Проект не существует")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        project_id = validated_data.pop('project_id')
        sprint_id = validated_data.pop('sprint_id', None)

        from .models import Project, Sprint
        project = Project.objects.get(id=project_id)
        validated_data['project'] = project

        if sprint_id:
            try:
                sprint = Sprint.objects.get(id=sprint_id, project=project)
                validated_data['sprint'] = sprint
            except Sprint.DoesNotExist:
                pass

        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        assignee_id = validated_data.pop('assignee_id', None)
        if assignee_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                assignee = User.objects.get(id=assignee_id)
                validated_data['assignee'] = assignee
            except User.DoesNotExist:
                pass

        return super().create(validated_data)


class TaskDetailSerializer(TaskSerializer):
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + ['completed_at']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_name = serializers.SerializerMethodField()
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    is_edited = serializers.BooleanField(read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    edited_at_formatted = serializers.SerializerMethodField()

    attachments = serializers.JSONField(read_only=True)
    has_attachments = serializers.BooleanField(read_only=True)
    attachments_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'task', 'author', 'author_id', 'author_name',
            'text', 'attachments', 'has_attachments', 'attachments_count',
            'created_at', 'created_at_formatted',
            'edited_at', 'edited_at_formatted', 'is_edited'
        ]
        read_only_fields = [
            'id', 'task', 'author', 'created_at', 'edited_at',
            'is_edited', 'attachments', 'has_attachments', 'attachments_count'
        ]
        extra_kwargs = {
            'text': {'required': False, 'allow_blank': True}  # 🔥 разрешаем пустой текст
        }

    def get_author_name(self, obj):
        if obj.author:
            full_name = f"{obj.author.first_name or ''} {obj.author.last_name or ''}".strip()
            return full_name or obj.author.username
        return 'Анонимный пользователь'

    def get_created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d %b %Y, %H:%M')
        return ''

    def get_edited_at_formatted(self, obj):
        if obj.edited_at:
            return obj.edited_at.strftime('%d %b %Y, %H:%M')
        return ''

    def get_attachment_url(self, attachment, request):
        """Возвращает полный URL для вложения"""
        if not attachment or not attachment.get('url'):
            return None

        if attachment['url'].startswith('http'):
            return attachment['url']

        if request:
            return request.build_absolute_uri(attachment['url'])
        return attachment['url']

    def to_representation(self, instance):
        """Переопределяем для добавления полных URL в attachments"""
        data = super().to_representation(instance)
        request = self.context.get('request')

        if data.get('attachments') and request:
            enriched_attachments = []
            for attachment in data['attachments']:
                enriched_attachment = attachment.copy()
                enriched_attachment['url'] = self.get_attachment_url(attachment, request)
                enriched_attachments.append(enriched_attachment)
            data['attachments'] = enriched_attachments

        return data

    def validate(self, data):
        """Проверяем, что есть либо текст, либо вложения"""
        text = data.get('text', '')

        # Проверяем наличие файлов в запросе
        request = self.context.get('request')
        has_files = request and request.FILES and len(request.FILES) > 0

        if not text and not has_files:
            raise serializers.ValidationError(
                "Необходимо указать текст сообщения или прикрепить файл"
            )
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['author'] = request.user

        task = self.context.get('task')
        if task:
            validated_data['task'] = task

        # Берем attachments из validated_data (уже обработаны в comment_views.py)
        attachments = validated_data.pop('attachments', [])

        comment = Comment.objects.create(
            **validated_data,
            attachments=attachments
        )

        return comment

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if instance.author != request.user:
            raise serializers.ValidationError(
                {"error": "Вы можете редактировать только свои комментарии"}
            )
        instance.text = validated_data.get('text', instance.text)
        instance.save()
        return instance


class ProjectChatMessageSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_name = serializers.SerializerMethodField()
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_avatar = serializers.SerializerMethodField()

    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()

    attachments = serializers.JSONField(read_only=True)
    has_attachments = serializers.BooleanField(read_only=True)
    attachments_count = serializers.IntegerField(read_only=True)

    read_by_count = serializers.SerializerMethodField()
    is_read_by_current_user = serializers.SerializerMethodField()
    read_by_users = serializers.SerializerMethodField()

    reply_count = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    is_reply = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProjectChatMessage
        fields = [
            'id', 'project', 'author', 'author_id', 'author_name', 'author_avatar',
            'text', 'attachments', 'has_attachments', 'attachments_count',
            'created_at', 'created_at_formatted', 'updated_at', 'updated_at_formatted',
            'read_by', 'read_by_count', 'is_read_by_current_user', 'read_by_users',
            'parent_message', 'is_reply', 'reply_count', 'replies',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at', 'read_by', 'project']
        extra_kwargs = {
            'parent_message': {'required': False, 'allow_null': True},
            'text': {'required': False, 'allow_blank': True},
        }

    def get_author_name(self, obj):
        if obj.author:
            full_name = f"{obj.author.first_name or ''} {obj.author.last_name or ''}".strip()
            return full_name or obj.author.username or obj.author.email or f"Пользователь {obj.author.id}"
        return 'Анонимный пользователь'

    def get_author_avatar(self, obj):
        request = self.context.get('request')
        if hasattr(obj.author, 'avatar') and obj.author.avatar:
            if request:
                return request.build_absolute_uri(obj.author.avatar.url)
            return obj.author.avatar.url
        return None

    def get_created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d.%m.%Y %H:%M')
        return ''

    def get_updated_at_formatted(self, obj):
        if obj.updated_at and obj.updated_at != obj.created_at:
            return obj.updated_at.strftime('%d.%m.%Y %H:%M')
        return ''

    def get_is_read_by_current_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.id in obj.read_by
        return False

    def get_read_by_count(self, obj):
        return obj.read_count

    def get_read_by_users(self, obj):
        if obj.read_by and len(obj.read_by) > 0:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_ids = obj.read_by[:3]
            users = User.objects.filter(id__in=user_ids)
            result = []
            for user in users:
                full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
                result.append({
                    'id': user.id,
                    'name': full_name or user.username or user.email,
                    'email': user.email,
                })
            return result
        return []

    def get_reply_count(self, obj):
        return obj.reply_count

    def get_replies(self, obj):
        if obj.replies.exists():
            replies = obj.replies.all()[:3]
            return ProjectChatMessageSerializer(
                replies,
                many=True,
                context=self.context,
                read_only=True
            ).data
        return []

    # projects/serializers.py - исправленный метод validate в ProjectChatMessageSerializer

    def validate(self, data):
        request = self.context.get('request')

        if request:
            # Получаем текст из разных мест
            text = ''
            if hasattr(request.data, 'get'):
                text = request.data.get('text', '')
            elif isinstance(request.data, dict):
                text = request.data.get('text', '')

            # Проверяем наличие файлов
            has_files = False

            # Проверяем request.FILES
            if request.FILES and len(request.FILES) > 0:
                has_files = True
                print(f"✅ Найдены файлы в request.FILES: {len(request.FILES)}")

            # Проверяем attachments в data
            if not has_files:
                attachments = request.data.get('attachments', [])
                if isinstance(attachments, str):
                    try:
                        attachments = json.loads(attachments)
                    except:
                        attachments = []
                if attachments and len(attachments) > 0:
                    has_files = True
                    print(f"✅ Найдены файлы в attachments: {len(attachments)}")

            # 🔥 ИСПРАВЛЕНО: разрешаем пустой текст, если есть файлы
            if not text and not has_files:
                raise serializers.ValidationError(
                    "Необходимо указать текст сообщения или прикрепить файл"
                )

            print(f"📝 Валидация: text='{text}', has_files={has_files}")

        return data

    def create(self, validated_data):
        request = self.context.get('request')

        validated_data.pop('project', None)

        if request and hasattr(request, 'user'):
            validated_data['author'] = request.user

        project = self.context.get('project')
        if project:
            validated_data['project'] = project

        attachments = []

        if request:
            if hasattr(request.data, 'getlist'):
                attachment_items = request.data.getlist('attachments[]', [])
                for attachment_json in attachment_items:
                    try:
                        attachment = json.loads(attachment_json)
                        attachments.append(attachment)
                    except:
                        pass
            elif hasattr(request.data, 'get'):
                attachment_items = request.data.get('attachments', [])
                if attachment_items:
                    if isinstance(attachment_items, list):
                        attachments = attachment_items
                    elif isinstance(attachment_items, str):
                        try:
                            attachments = json.loads(attachment_items)
                        except:
                            pass

        if attachments:
            validated_data['attachments'] = attachments

        message = super().create(validated_data)

        if request and request.user.is_authenticated:
            message.mark_as_read(request.user.id)

        return message

    def update(self, instance, validated_data):
        request = self.context.get('request')

        if request and instance.author != request.user:
            project = instance.project
            is_owner = project.owner == request.user

            if not is_owner:
                raise serializers.ValidationError(
                    {"error": "Вы можете редактировать только свои сообщения"}
                )

        instance.text = validated_data.get('text', instance.text)
        instance.save()

        return instance


# ============================================================================
# 🔥 НОВЫЙ СЕРИАЛИЗАТОР ДЛЯ ДОКУМЕНТОВ ПРОЕКТА
# ============================================================================

class ProjectDocumentSerializer(serializers.ModelSerializer):
    """
    Сериализатор для документов проекта
    """
    uploaded_by = UserSerializer(read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    size_formatted = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()

    class Meta:
        model = ProjectDocument
        fields = [
            'id', 'project', 'file', 'file_url', 'name', 'size', 'size_formatted',
            'extension', 'icon', 'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['id', 'project', 'uploaded_by', 'uploaded_at', 'file_url']

    def get_uploaded_by_name(self, obj):
        """Возвращает имя загрузившего пользователя"""
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.email
        return 'Неизвестно'

    def get_file_url(self, obj):
        """Возвращает полный URL файла"""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_size_formatted(self, obj):
        """Форматирует размер файла для отображения"""
        size = obj.size
        if size < 1024:
            return f"{size} B"
        if size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        return f"{size / (1024 * 1024):.1f} MB"

    def get_icon(self, obj):
        """Возвращает иконку для типа файла"""
        ext = obj.extension.lower()
        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp']:
            return 'image'
        if ext in ['.pdf']:
            return 'pdf'
        if ext in ['.doc', '.docx']:
            return 'word'
        if ext in ['.xls', '.xlsx']:
            return 'excel'
        if ext in ['.ppt', '.pptx']:
            return 'presentation'
        if ext in ['.txt', '.md', '.rtf']:
            return 'text'
        if ext in ['.zip', '.rar', '.7z', '.tar', '.gz']:
            return 'archive'
        if ext in ['.py', '.js', '.html', '.css', '.json', '.xml', '.csv']:
            return 'code'
        return 'file'