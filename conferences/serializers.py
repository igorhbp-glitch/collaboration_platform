# conferences/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.serializers import UserSerializer
from projects.serializers import ProjectSerializer
from .models import (
    Event, Section, EventParticipant,
    EventNews, SpeakerMaterial, ScheduleItem,
    PARTICIPATION_TYPES
)

User = get_user_model()


# ============================================
# БАЗОВЫЙ СЕРИАЛИЗАТОР ПОЛЬЗОВАТЕЛЯ (упрощённый)
# ============================================

class SimpleUserSerializer(serializers.ModelSerializer):
    """Упрощённый сериализатор для пользователя (без лишних полей)"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'avatar']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email


# ============================================
# 🔥 ОБНОВЛЕННЫЙ СЕРИАЛИЗАТОР СЕКЦИИ
# ============================================

class SectionSerializer(serializers.ModelSerializer):
    moderators = SimpleUserSerializer(many=True, read_only=True)
    moderators_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    speakers_count = serializers.IntegerField(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)

    # 🔥 ПОЛЯ ДЛЯ ПРОВЕРКИ ПРАВ
    event_created_by = SimpleUserSerializer(source='event.created_by', read_only=True)
    event_organizers = serializers.SerializerMethodField(read_only=True)

    # 🔥 ПОЛЯ ИЗ МЕРОПРИЯТИЯ ДЛЯ ОТОБРАЖЕНИЯ В ШАПКЕ
    event_type = serializers.CharField(source='event.type', read_only=True)
    event_type_display = serializers.CharField(source='event.get_type_display', read_only=True)
    event_level = serializers.CharField(source='event.level', read_only=True)
    event_level_display = serializers.CharField(source='event.get_level_display', read_only=True)
    event_status = serializers.CharField(source='event.status', read_only=True)
    event_status_display = serializers.CharField(source='event.get_status_display', read_only=True)
    event_start_date = serializers.DateField(source='event.start_date', read_only=True)
    event_end_date = serializers.DateField(source='event.end_date', read_only=True)
    event_registration_deadline = serializers.DateField(source='event.registration_deadline', read_only=True)

    # 🔥 ВЫСТУПАЮЩИЕ
    speakers = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            'id', 'event', 'event_title', 'title',
            'description',  # для шапки
            'about',        # для блока "О секции" 🔥 НОВОЕ
            'color',
            'cover_images', 'conference_link',
            'moderators', 'moderators_ids', 'status', 'speakers_count',
            'event_created_by', 'event_organizers',
            'event_type', 'event_type_display',
            'event_level', 'event_level_display',
            'event_status', 'event_status_display',
            'event_start_date', 'event_end_date', 'event_registration_deadline',
            'speakers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'event', 'created_at', 'updated_at', 'speakers_count']

    def get_event_organizers(self, obj):
        """Возвращает организаторов мероприятия (исключая создателя)"""
        organizers = obj.event.organizers.all()
        return SimpleUserSerializer(organizers, many=True).data

    def get_speakers(self, obj):
        """Возвращает список выступающих в секции с деталями"""
        speakers = EventParticipant.objects.filter(
            section=obj,
            participation_type='speaker',
            status='approved'
        ).exclude(
            user_id=obj.event.created_by_id
        ).select_related('user', 'project')

        # Используем EventParticipantSerializer, но без вложенной секции
        from .serializers import EventParticipantSerializer
        return EventParticipantSerializer(speakers, many=True, context=self.context).data

    def validate_moderators_ids(self, value):
        """Проверка, что модераторы не назначены в другие секции"""
        if value and 'event' in self.context.get('request', {}).data:
            event_id = self.context['request'].data.get('event')
            if event_id:
                event = Event.objects.get(id=event_id)

                other_sections_moderators = event.sections.exclude(
                    id=self.instance.id if self.instance else None
                ).values_list('moderators__id', flat=True)

                # Исключаем только проверку на пленарных модераторов
                for user_id in value:
                    if user_id in other_sections_moderators:
                        raise serializers.ValidationError(
                            f"Пользователь {user_id} уже является модератором другой секции"
                        )
        return value


# ============================================
# СЕРИАЛИЗАТОР УЧАСТНИКА
# ============================================
class EventParticipantSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    # 🔥 ИСПРАВЛЕНО: получаем секцию напрямую через related field
    section = serializers.SerializerMethodField()

    project = ProjectSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    reviewed_by = SimpleUserSerializer(read_only=True)

    participation_type_display = serializers.CharField(
        source='get_participation_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )

    actual_role = serializers.SerializerMethodField()

    class Meta:
        model = EventParticipant
        fields = [
            'id', 'event',
            'section',  # теперь через SerializerMethodField
            'user', 'user_id',
            'participation_type', 'participation_type_display',
            'actual_role', 'talk_title', 'is_plenary',
            'speaker_order',
            'project', 'project_id', 'uploaded_files',
            'status', 'status_display', 'reviewed_by', 'review_comment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'event', 'created_at', 'updated_at', 'reviewed_by']

    def get_section(self, obj):
        """Возвращает данные секции, если она есть"""
        if obj.section:
            return {
                'id': obj.section.id,
                'title': obj.section.title,
                'color': obj.section.color,
                'description': obj.section.description
            }
        return None

    def get_actual_role(self, obj):
        return obj.get_actual_role()

    def to_representation(self, instance):
        data = super().to_representation(instance)

        request = self.context.get('request')
        if request and data.get('uploaded_files'):
            for file_data in data['uploaded_files']:
                if file_data and isinstance(file_data, dict):
                    if not file_data.get('url') and file_data.get('filename'):
                        file_data['url'] = request.build_absolute_uri(
                            f"/media/participation_files/{instance.event_id}/{file_data['filename']}"
                        )

        return data


# ============================================
# СЕРИАЛИЗАТОР НОВОСТИ
# ============================================

class EventNewsSerializer(serializers.ModelSerializer):
    created_by = SimpleUserSerializer(read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_type = serializers.CharField(source='event.type', read_only=True)
    event_type_display = serializers.SerializerMethodField()
    section_title = serializers.CharField(source='section.title', read_only=True, allow_null=True)
    section_color = serializers.CharField(source='section.color', read_only=True, allow_null=True)

    formatted_date = serializers.SerializerMethodField(read_only=True)
    display_excerpt = serializers.SerializerMethodField(read_only=True)

    can_edit = serializers.SerializerMethodField(read_only=True)
    can_delete = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = EventNews
        fields = [
            'id', 'event', 'event_title',
            'event_type', 'event_type_display',
            'section', 'section_title', 'section_color',
            'title', 'excerpt', 'content', 'media', 'video_plays_automuted',
            'views_count', 'likes_count',
            'formatted_date', 'display_excerpt',
            'can_edit', 'can_delete',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at',
                            'views_count', 'likes_count']

    def get_event_type_display(self, obj):
        return obj.event.get_type_display()

    def get_formatted_date(self, obj):
        from django.utils import timezone

        now = timezone.now()
        diff = now - obj.created_at

        if diff.days == 0:
            if diff.seconds < 3600:
                minutes = diff.seconds // 60
                return f"{minutes} мин. назад" if minutes > 0 else "только что"
            else:
                hours = diff.seconds // 3600
                return f"{hours} ч. назад"
        elif diff.days == 1:
            return "вчера"
        elif diff.days < 7:
            return f"{diff.days} дн. назад"
        else:
            return obj.created_at.strftime('%d.%m.%Y')

    def get_display_excerpt(self, obj):
        return obj.get_display_excerpt(150)

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False

        user = request.user

        if obj.created_by == user:
            return True

        if obj.event.created_by == user:
            return True

        if user in obj.event.organizers.all():
            return True

        if user in obj.event.plenary_moderators.all():
            return True

        if obj.section and user in obj.section.moderators.all():
            return True

        return False

    def get_can_delete(self, obj):
        return self.get_can_edit(obj)

    def validate_media(self, value):
        if value is None:
            return []

        if not isinstance(value, list):
            raise serializers.ValidationError("Поле media должно быть списком")

        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Каждый элемент медиа должен быть объектом")

            required_fields = ['id', 'type', 'url', 'filename', 'size']
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(f"В медиа-объекте отсутствует поле {field}")

            if item['type'] not in ['image', 'video']:
                raise serializers.ValidationError(f"Неверный тип медиа: {item['type']}")

        return value

    def validate(self, data):
        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Необходима авторизация")

        event = data.get('event') or (self.instance.event if self.instance else None)
        if not event:
            raise serializers.ValidationError({"event": "Не указано мероприятие"})

        has_right = (
                event.created_by == request.user or
                request.user in event.organizers.all() or
                request.user in event.plenary_moderators.all()
        )

        section = data.get('section')
        if section and not has_right:
            has_right = request.user in section.moderators.all()

        if not has_right and not self.instance:
            raise serializers.ValidationError(
                "У вас нет прав для создания новостей в этом мероприятии"
            )

        return data


# ============================================
# СЕРИАЛИЗАТОР МАТЕРИАЛОВ
# ============================================

class SpeakerMaterialSerializer(serializers.ModelSerializer):
    participant_name = serializers.SerializerMethodField()
    participant_email = serializers.SerializerMethodField()
    event_title = serializers.SerializerMethodField()
    section_title = serializers.SerializerMethodField()

    class Meta:
        model = SpeakerMaterial
        fields = [
            'id', 'participant', 'participant_name', 'participant_email',
            'event_title', 'section_title', 'title', 'description',
            'files', 'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_participant_name(self, obj):
        return obj.participant.user.get_full_name() or obj.participant.user.email

    def get_participant_email(self, obj):
        return obj.participant.user.email

    def get_event_title(self, obj):
        return obj.participant.event.title

    def get_section_title(self, obj):
        return obj.participant.section.title if obj.participant.section else None


# ============================================
# СЕРИАЛИЗАТОР ПУНКТА ПРОГРАММЫ
# ============================================

class ScheduleItemSerializer(serializers.ModelSerializer):
    section_title = serializers.CharField(source='section.title', read_only=True, allow_null=True)
    section_color = serializers.CharField(source='section.color', read_only=True, allow_null=True)
    participant_details = serializers.SerializerMethodField(read_only=True)
    event_id = serializers.SerializerMethodField(read_only=True)
    event_title = serializers.SerializerMethodField(read_only=True)

    event = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(),
        required=False,
        allow_null=True
    )
    section = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(),
        required=False,
        allow_null=True
    )
    participant = serializers.PrimaryKeyRelatedField(
        queryset=EventParticipant.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = ScheduleItem
        fields = [
            'id',
            'event', 'event_id', 'event_title',
            'section', 'section_title', 'section_color',
            'is_plenary',
            'participant', 'participant_details',
            'title', 'description',
            'start_time', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_participant_details(self, obj):
        if not obj.participant:
            return None

        return {
            'id': obj.participant.id,
            'user_id': obj.participant.user.id,
            'full_name': obj.participant.user.get_full_name() or obj.participant.user.email,
            'email': obj.participant.user.email,
            'avatar': obj.participant.user.avatar,
            'talk_title': obj.participant.talk_title,
            'branch': obj.participant.user.branch,
            'speaker_order': obj.participant.speaker_order
        }

    def get_event_id(self, obj):
        if obj.event:
            return obj.event.id
        if obj.section:
            return obj.section.event_id
        if obj.is_plenary and obj.participant:
            return obj.participant.event_id
        return None

    def get_event_title(self, obj):
        if obj.event:
            return obj.event.title
        if obj.section:
            return obj.section.event.title
        if obj.is_plenary and obj.participant:
            return obj.participant.event.title
        return None

    def validate(self, data):
        if self.partial:
            return data

        event = data.get('event')
        section = data.get('section')
        is_plenary = data.get('is_plenary', False)
        participant = data.get('participant')
        title = data.get('title', '')

        if section and is_plenary:
            raise serializers.ValidationError(
                "Пункт не может быть одновременно и в секции, и пленарным"
            )

        if participant:
            if participant.participation_type != 'speaker':
                raise serializers.ValidationError(
                    {"participant": "К пункту программы можно привязать только докладчика"}
                )
            if participant.status != 'approved':
                raise serializers.ValidationError(
                    {"participant": "К пункту программы можно привязать только подтверждённого участника"}
                )
            if not event and not section and not is_plenary:
                raise serializers.ValidationError(
                    "Для выступления необходимо указать мероприятие, секцию или пленарное заседание"
                )

        if not participant and not title:
            raise serializers.ValidationError(
                "Для организационного блока необходимо указать название"
            )

        if not section and not participant and title and not event:
            raise serializers.ValidationError(
                "Для кастомного блока необходимо указать мероприятие"
            )

        if is_plenary and not participant and not event:
            raise serializers.ValidationError(
                "Для пленарного заседания необходимо указать мероприятие"
            )

        return data


# ============================================
# ОСНОВНОЙ СЕРИАЛИЗАТОР МЕРОПРИЯТИЯ
# ============================================

class EventSerializer(serializers.ModelSerializer):
    created_by = SimpleUserSerializer(read_only=True)
    organizers = SimpleUserSerializer(many=True, read_only=True)
    organizers_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    plenary_moderators = SimpleUserSerializer(many=True, read_only=True)
    plenary_moderators_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    type_display = serializers.CharField(source='get_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    participant_count = serializers.IntegerField(read_only=True)
    sections_count = serializers.IntegerField(read_only=True)
    all_organizers = serializers.SerializerMethodField(read_only=True)
    all_moderators = serializers.SerializerMethodField(read_only=True)

    sections = SectionSerializer(many=True, read_only=True)
    participants = serializers.SerializerMethodField()
    news = EventNewsSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'short_description',
            'type', 'type_display', 'level', 'level_display',
            'start_date', 'end_date', 'registration_deadline',
            'organizer_branches', 'cover_images', 'documents',
            'additional_info', 'status', 'status_display',
            'has_sections', 'participant_count', 'sections_count',
            'conference_link',
            'created_by', 'organizers', 'organizers_ids',
            'plenary_moderators', 'plenary_moderators_ids',
            'all_organizers', 'all_moderators',
            'created_at', 'updated_at',
            'sections', 'participants', 'news'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_participants(self, obj):
        participants = obj.participants.exclude(user_id=obj.created_by_id)
        return EventParticipantSerializer(participants, many=True).data

    def get_all_organizers(self, obj):
        return SimpleUserSerializer(obj.all_organizers, many=True).data

    def get_all_moderators(self, obj):
        return SimpleUserSerializer(obj.all_moderators, many=True).data


# ============================================
# СЕРИАЛИЗАТОР ДЛЯ СОЗДАНИЯ МЕРОПРИЯТИЯ
# ============================================

class CreateEventSerializer(serializers.ModelSerializer):
    sections_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        default=[]
    )
    organizers_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=[]
    )
    plenary_moderators_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=[]
    )
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'short_description',
            'type', 'level',
            'start_date', 'end_date', 'registration_deadline',
            'organizer_branches', 'cover_images', 'documents',
            'additional_info', 'has_sections', 'sections_data',
            'organizers_ids', 'plenary_moderators_ids', 'conference_link',
            'sections',
        ]
        read_only_fields = ['id', 'sections']

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError(
                "Дата начала не может быть позже даты окончания"
            )

        if data['registration_deadline'] > data['start_date']:
            raise serializers.ValidationError(
                "Дедлайн регистрации должен быть раньше даты начала"
            )

        return data

    def create(self, validated_data):
        sections_data = validated_data.pop('sections_data', [])
        organizers_ids = validated_data.pop('organizers_ids', [])
        plenary_moderators_ids = validated_data.pop('plenary_moderators_ids', [])

        request = self.context.get('request')
        validated_data['created_by'] = request.user
        validated_data['status'] = 'draft'

        event = super().create(validated_data)

        created_sections = []
        if sections_data and event.has_sections:
            for section_data in sections_data:
                section = Section.objects.create(
                    event=event,
                    title=section_data['title'],
                    description=section_data.get('description', '')
                )
                created_sections.append(section)

        if organizers_ids:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            organizers = User.objects.filter(id__in=organizers_ids)
            event.organizers.add(*organizers)

        if plenary_moderators_ids:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            moderators = User.objects.filter(id__in=plenary_moderators_ids)
            event.plenary_moderators.add(*moderators)

        event._created_sections = created_sections

        return event


# ============================================
# СЕРИАЛИЗАТОР ДЛЯ ОБНОВЛЕНИЯ МЕРОПРИЯТИЯ
# ============================================

class UpdateEventSerializer(serializers.ModelSerializer):
    organizers_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    plenary_moderators_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    sections_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'short_description',
            'type', 'level',
            'start_date', 'end_date', 'registration_deadline',
            'organizer_branches', 'cover_images', 'documents',
            'additional_info', 'status', 'has_sections',
            'organizers_ids', 'plenary_moderators_ids',
            'sections_data',
            'conference_link',
        ]
        read_only_fields = ['id']

    def validate(self, data):
        if 'start_date' in data and 'end_date' in data:
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError(
                    "Дата начала не может быть позже даты окончания"
                )

        if 'registration_deadline' in data and 'start_date' in data:
            if data['registration_deadline'] > data['start_date']:
                raise serializers.ValidationError(
                    "Дедлайн регистрации должен быть раньше даты начала"
                )

        return data

    # 🔥 ИСПРАВЛЕННЫЙ МЕТОД UPDATE
    def update(self, instance, validated_data):
        organizers_ids = validated_data.pop('organizers_ids', None)
        if organizers_ids is not None:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            organizers = User.objects.filter(id__in=organizers_ids)
            instance.organizers.set(organizers)

        plenary_moderators_ids = validated_data.pop('plenary_moderators_ids', None)
        if plenary_moderators_ids is not None:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            moderators = User.objects.filter(id__in=plenary_moderators_ids)
            instance.plenary_moderators.set(moderators)

        # 🔥 ОБРАБАТЫВАЕМ СЕКЦИИ С СОХРАНЕНИЕМ ВСЕХ ПОЛЕЙ
        sections_data = validated_data.pop('sections_data', None)
        if sections_data is not None:
            from .models import Section

            # Получаем существующие секции
            existing_sections = {s.id: s for s in instance.sections.all()}
            updated_section_ids = []

            # Проходим по полученным данным секций
            for section_data in sections_data:
                section_id = section_data.get('id')

                if section_id and section_id in existing_sections:
                    # 🔥 Обновляем существующую секцию
                    section = existing_sections[section_id]
                    section.title = section_data.get('title', section.title)
                    section.description = section_data.get('description', section.description)
                    section.about = section_data.get('about', section.about)
                    section.cover_images = section_data.get('cover_images', section.cover_images)
                    section.color = section_data.get('color', section.color)
                    section.save()
                    updated_section_ids.append(section_id)

                else:
                    # 🔥 Создаём новую секцию с минимальными полями
                    new_section = Section.objects.create(
                        event=instance,
                        title=section_data.get('title', ''),
                        description=section_data.get('description', ''),
                        about=section_data.get('about', ''),
                        cover_images=section_data.get('cover_images', []),
                        color=section_data.get('color', '#4CAF50')
                    )
                    updated_section_ids.append(new_section.id)

            # 🔥 Удаляем секции, которых нет в полученном списке
            for section_id, section in existing_sections.items():
                if section_id not in updated_section_ids:
                    section.delete()

            # Обновляем флаг наличия секций
            instance.has_sections = len(sections_data) > 0

        # Сохраняем остальные поля
        return super().update(instance, validated_data)


# ============================================
# СЕРИАЛИЗАТОР ДЛЯ ПОДАЧИ ЗАЯВКИ
# ============================================

class ParticipateSerializer(serializers.Serializer):
    """Сериализатор для подачи заявки на участие"""
    participation_type = serializers.ChoiceField(choices=PARTICIPATION_TYPES)
    section_id = serializers.IntegerField(required=False, allow_null=True)
    project_id = serializers.IntegerField(required=False, allow_null=True)
    uploaded_files = serializers.JSONField(required=False, default=list)
    talk_title = serializers.CharField(required=False, allow_blank=True, max_length=500)
    is_plenary = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        if data['participation_type'] == 'speaker':
            event = self.context.get('event')

            if data.get('is_plenary'):
                data['section_id'] = None
            else:
                if event and event.has_sections:
                    if not data.get('section_id'):
                        raise serializers.ValidationError(
                            {"section_id": "Для выступающих необходимо выбрать секцию"}
                        )
                else:
                    data['section_id'] = None

            if not data.get('talk_title'):
                raise serializers.ValidationError(
                    {"talk_title": "Укажите тему доклада"}
                )

            has_project = bool(data.get('project_id'))
            has_files = bool(data.get('uploaded_files'))

            if has_project and has_files:
                raise serializers.ValidationError(
                    "Выберите только один источник материалов: проект ИЛИ файлы"
                )

            if not has_project and not has_files:
                raise serializers.ValidationError(
                    "Выступающий должен предоставить проект или загрузить файлы"
                )

            if has_project:
                data['uploaded_files'] = []

            if has_files:
                data['project_id'] = None

        return data