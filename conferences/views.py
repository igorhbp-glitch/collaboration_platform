# conferences/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.db import models
from django.utils import timezone
from django.db import transaction
from django.conf import settings
import os
import uuid
import logging

from .models import (
    Event, Section, EventParticipant,
    EventNews, SpeakerMaterial, ScheduleItem
)
from .serializers import (
    EventSerializer, CreateEventSerializer, UpdateEventSerializer,
    SectionSerializer, EventParticipantSerializer,
    EventNewsSerializer, SpeakerMaterialSerializer,
    ParticipateSerializer, ScheduleItemSerializer
)

logger = logging.getLogger(__name__)


# ============================================
# ПАГИНАЦИЯ ДЛЯ МЕРОПРИЯТИЙ
# ============================================

class EventPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


# ============================================
# ПАГИНАЦИЯ ДЛЯ МАТЕРИАЛОВ
# ============================================

class MaterialPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


# ============================================
# VIEWSET ДЛЯ МЕРОПРИЯТИЙ
# ============================================

class EventViewSet(viewsets.ModelViewSet):
    """
    API для работы с мероприятиями
    """
    queryset = Event.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'short_description']
    ordering_fields = ['start_date', 'created_at', 'title']
    ordering = ['-created_at']
    pagination_class = EventPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateEventSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateEventSerializer
        return EventSerializer

    def get_queryset(self):
        """
        Фильтрация мероприятий по параметрам запроса
        """
        queryset = Event.objects.all()

        event_type = self.request.query_params.get('type')
        if event_type:
            queryset = queryset.filter(type=event_type)

        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        branch = self.request.query_params.get('branch')
        if branch:
            queryset = queryset.filter(organizer_branches__contains=[branch])

        upcoming = self.request.query_params.get('upcoming')
        if upcoming == 'true':
            queryset = queryset.filter(
                start_date__gte=timezone.now().date()
            ).exclude(status='completed')

        has_sections = self.request.query_params.get('has_sections')
        if has_sections is not None:
            queryset = queryset.filter(has_sections=has_sections.lower() == 'true')

        queryset = queryset.annotate(
            participants_count=Count('participants', filter=Q(participants__status='approved'))
        )

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Опубликовать мероприятие (изменить статус на 'published')
        """
        event = self.get_object()

        if event.created_by != request.user and request.user not in event.organizers.all():
            return Response(
                {'error': 'Только создатель или организаторы могут опубликовать мероприятие'},
                status=status.HTTP_403_FORBIDDEN
            )

        if event.status != 'draft':
            return Response(
                {'error': f'Нельзя опубликовать мероприятие в статусе {event.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event.status = 'published'
        event.save()

        serializer = self.get_serializer(event)
        return Response({
            'message': 'Мероприятие опубликовано',
            'event': serializer.data
        })

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Завершить мероприятие
        """
        event = self.get_object()

        if event.created_by != request.user and request.user not in event.organizers.all():
            return Response(
                {'error': 'Только создатель или организаторы могут завершить мероприятие'},
                status=status.HTTP_403_FORBIDDEN
            )

        event.status = 'completed'
        event.save()

        return Response({'message': 'Мероприятие завершено'})

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """
        Получить статистику по мероприятию
        """
        event = self.get_object()

        total_participants = event.participants.exclude(user_id=event.created_by_id).count()
        approved_participants = event.participants.filter(status='approved').exclude(
            user_id=event.created_by_id).count()
        pending_participants = event.participants.filter(status='pending').exclude(user_id=event.created_by_id).count()

        listeners = event.participants.filter(
            participation_type='listener',
            status='approved'
        ).exclude(user_id=event.created_by_id).count()

        speakers = event.participants.filter(
            participation_type='speaker',
            status='approved'
        ).exclude(user_id=event.created_by_id).count()

        sections_stats = []
        if event.has_sections:
            for section in event.sections.all():
                section_speakers = event.participants.filter(
                    section=section,
                    participation_type='speaker',
                    status='approved'
                ).exclude(user_id=event.created_by_id).count()
                sections_stats.append({
                    'id': section.id,
                    'title': section.title,
                    'speakers': section_speakers
                })

        return Response({
            'event_id': event.id,
            'event_title': event.title,
            'total_participants': total_participants,
            'approved_participants': approved_participants,
            'pending_participants': pending_participants,
            'listeners': listeners,
            'speakers': speakers,
            'organizers_count': len(event.all_organizers),
            'plenary_moderators_count': event.plenary_moderators.count(),
            'sections_stats': sections_stats
        })

    @action(detail=True, methods=['get'])
    def organizers(self, request, pk=None):
        """
        Получить список организаторов (исключая создателя)
        """
        event = self.get_object()
        organizers = event.organizers.all()
        from users.serializers import UserSerializer
        serializer = UserSerializer(organizers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def plenary_moderators(self, request, pk=None):
        """
        Получить список модераторов пленарного заседания
        """
        event = self.get_object()
        moderators = event.plenary_moderators.all()
        from users.serializers import UserSerializer
        serializer = UserSerializer(moderators, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_cover(self, request, pk=None):
        """
        Загрузка изображения для обложки мероприятия
        """
        event = self.get_object()

        if event.created_by != request.user and request.user not in event.organizers.all():
            return Response(
                {'error': 'Только организаторы могут загружать обложки'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'image' not in request.FILES:
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )

        image = request.FILES['image']

        if image.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Файл слишком большой (макс. 5MB)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if image.content_type not in allowed_types:
            return Response(
                {'error': 'Недопустимый формат. Разрешены: JPEG, PNG, WEBP, GIF'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ext = os.path.splitext(image.name)[1]
        filename = f"event_{event.id}_{uuid.uuid4().hex}{ext}"

        upload_path = os.path.join('event_covers', str(event.id))
        full_path = os.path.join(settings.MEDIA_ROOT, upload_path)
        os.makedirs(full_path, exist_ok=True)

        file_path = os.path.join(upload_path, filename)
        with open(os.path.join(settings.MEDIA_ROOT, file_path), 'wb+') as destination:
            for chunk in image.chunks():
                destination.write(chunk)

        file_url = f"{settings.MEDIA_URL}{file_path}"

        return Response({
            'url': file_url,
            'filename': filename
        })

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """
        Получить список документов мероприятия
        """
        event = self.get_object()
        return Response(event.documents)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        """
        Загрузить документ мероприятия
        """
        event = self.get_object()

        if event.created_by != request.user and request.user not in event.organizers.all():
            return Response(
                {'error': 'Только организаторы могут загружать документы'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'document' not in request.FILES:
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )

        document = request.FILES['document']

        if document.size > 10 * 1024 * 1024:  # 10MB
            return Response(
                {'error': 'Файл слишком большой (макс. 10MB)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ext = os.path.splitext(document.name)[1]
        filename = f"event_{event.id}_{uuid.uuid4().hex}{ext}"

        upload_path = os.path.join('event_documents', str(event.id))
        full_path = os.path.join(settings.MEDIA_ROOT, upload_path)
        os.makedirs(full_path, exist_ok=True)

        file_path = os.path.join(upload_path, filename)
        with open(os.path.join(settings.MEDIA_ROOT, file_path), 'wb+') as destination:
            for chunk in document.chunks():
                destination.write(chunk)

        file_url = f"{settings.MEDIA_URL}{file_path}"

        document_data = {
            'id': uuid.uuid4().hex,
            'name': document.name,
            'filename': filename,
            'size': document.size,
            'url': file_url,
            'uploaded_at': timezone.now().isoformat(),
            'uploaded_by': request.user.id
        }

        documents = event.documents or []
        documents.append(document_data)
        event.documents = documents
        event.save()

        return Response(document_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='documents/(?P<document_id>[^/.]+)')
    def delete_document(self, request, pk=None, document_id=None):
        """
        Удалить документ мероприятия
        """
        event = self.get_object()

        if event.created_by != request.user and request.user not in event.organizers.all():
            return Response(
                {'error': 'Только организаторы могут удалять документы'},
                status=status.HTTP_403_FORBIDDEN
            )

        documents = event.documents or []

        document_to_delete = None
        valid_documents = []

        for doc in documents:
            if doc is not None:
                valid_documents.append(doc)
                if doc.get('id') == document_id:
                    document_to_delete = doc

        if not document_to_delete:
            return Response(
                {'error': 'Документ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        file_path = document_to_delete.get('url', '').replace(settings.MEDIA_URL, '')
        if file_path:
            full_file_path = os.path.join(settings.MEDIA_ROOT, file_path)
            if os.path.exists(full_file_path):
                os.remove(full_file_path)

        new_documents = [doc for doc in valid_documents if doc.get('id') != document_id]
        event.documents = new_documents
        event.save()

        return Response({'message': 'Документ удален'})

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser],
            url_path='upload-participation-file')
    def upload_participation_file(self, request, pk=None):
        """
        Загрузить файл для заявки на участие
        """
        event = self.get_object()

        if 'file' not in request.FILES:
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']

        if file.size > 50 * 1024 * 1024:
            return Response(
                {'error': 'Файл слишком большой (макс. 50MB)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ext = os.path.splitext(file.name)[1]
        filename = f"participant_{event.id}_{uuid.uuid4().hex}{ext}"

        upload_path = os.path.join('participation_files', str(event.id))
        full_path = os.path.join(settings.MEDIA_ROOT, upload_path)
        os.makedirs(full_path, exist_ok=True)

        file_path = os.path.join(upload_path, filename)
        with open(os.path.join(settings.MEDIA_ROOT, file_path), 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        scheme = 'https' if request.is_secure() else 'http'
        host = request.get_host()
        file_url = f"{scheme}://{host}{settings.MEDIA_URL}{file_path}"

        return Response({
            'id': uuid.uuid4().hex,
            'name': file.name,
            'filename': filename,
            'size': file.size,
            'url': file_url,
            'uploaded_at': timezone.now().isoformat()
        })

    # ============================================
    # ЕДИНЫЙ ЭНДПОИНТ ДЛЯ УПРАВЛЕНИЯ РОЛЯМИ
    # ============================================
    @action(detail=True, methods=['post'])
    def update_roles(self, request, pk=None):
        """
        Единый эндпоинт для массового обновления всех ролей
        """
        event = self.get_object()

        if event.created_by != request.user and request.user not in event.organizers.all():
            return Response(
                {'error': 'Только создатель или организаторы могут управлять ролями'},
                status=status.HTTP_403_FORBIDDEN
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            with transaction.atomic():
                # ========== УДАЛЕНИЕ ОРГАНИЗАТОРОВ ==========
                remove_org_ids = self._parse_user_ids(request.data.get('remove_organizers', []))
                if remove_org_ids:
                    if event.created_by_id in remove_org_ids:
                        return Response(
                            {'error': 'Нельзя удалить создателя мероприятия'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    event.organizers.remove(*remove_org_ids)
                    EventParticipant.objects.filter(
                        event=event,
                        user_id__in=remove_org_ids
                    ).update(
                        participation_type='listener',
                        status='approved',
                        section=None  # 🔥 сбрасываем секцию
                    )

                # ========== ДОБАВЛЕНИЕ ОРГАНИЗАТОРОВ ==========
                add_org_ids = self._parse_user_ids(request.data.get('add_organizers', []))
                if add_org_ids:
                    if self._are_users_moderators(event, add_org_ids):
                        return Response(
                            {'error': 'Пользователи уже являются модераторами и не могут быть организаторами'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    users = User.objects.filter(id__in=add_org_ids)
                    event.organizers.add(*users)

                    # Обновляем участников
                    for user_id in add_org_ids:
                        EventParticipant.objects.update_or_create(
                            event=event,
                            user_id=user_id,
                            defaults={
                                'participation_type': 'listener',
                                'status': 'approved',
                                'section': None,  # организаторы не привязаны к секции
                                'is_plenary': False
                            }
                        )

                # ========== УДАЛЕНИЕ ПЛЕНАРНЫХ МОДЕРАТОРОВ ==========
                remove_plenary_ids = self._parse_user_ids(request.data.get('remove_plenary_moderators', []))
                if remove_plenary_ids:
                    event.plenary_moderators.remove(*remove_plenary_ids)
                    EventParticipant.objects.filter(
                        event=event,
                        user_id__in=remove_plenary_ids
                    ).update(
                        participation_type='listener',
                        status='approved',
                        section=None,
                        is_plenary=False
                    )

                # ========== ДОБАВЛЕНИЕ ПЛЕНАРНЫХ МОДЕРАТОРОВ ==========
                add_plenary_ids = self._parse_user_ids(request.data.get('add_plenary_moderators', []))
                if add_plenary_ids:
                    if self._are_users_organizers(event, add_plenary_ids):
                        return Response(
                            {'error': 'Организаторы не могут быть модераторами'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if self._are_users_section_moderators(event, add_plenary_ids):
                        return Response(
                            {'error': 'Пользователи уже являются модераторами секций'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    users = User.objects.filter(id__in=add_plenary_ids)
                    event.plenary_moderators.add(*users)

                    # Обновляем участников
                    for user_id in add_plenary_ids:
                        EventParticipant.objects.update_or_create(
                            event=event,
                            user_id=user_id,
                            defaults={
                                'participation_type': 'listener',
                                'status': 'approved',
                                'section': None,
                                'is_plenary': False
                            }
                        )

                # ========== УДАЛЕНИЕ МОДЕРАТОРОВ СЕКЦИЙ ==========
                remove_section_data = request.data.get('remove_section_moderators', {})
                for section_id_str, user_ids in remove_section_data.items():
                    section_id = int(section_id_str)
                    remove_ids = self._parse_user_ids(user_ids)

                    if remove_ids:
                        section = get_object_or_404(Section, id=section_id, event=event)
                        section.moderators.remove(*remove_ids)

                        # Обновляем участников - убираем секцию
                        EventParticipant.objects.filter(
                            event=event,
                            user_id__in=remove_ids
                        ).update(
                            participation_type='listener',
                            status='approved',
                            section=None
                        )

                # ========== ДОБАВЛЕНИЕ МОДЕРАТОРОВ СЕКЦИЙ ==========
                add_section_data = request.data.get('add_section_moderators', {})
                for section_id_str, user_ids in add_section_data.items():
                    section_id = int(section_id_str)
                    add_ids = self._parse_user_ids(user_ids)

                    if add_ids:
                        section = get_object_or_404(Section, id=section_id, event=event)

                        if self._are_users_organizers(event, add_ids):
                            return Response(
                                {'error': 'Организаторы не могут быть модераторами секций'},
                                status=status.HTTP_400_BAD_REQUEST
                            )

                        if self._are_users_plenary_moderators(event, add_ids):
                            return Response(
                                {'error': 'Пленарные модераторы не могут быть модераторами секций'},
                                status=status.HTTP_400_BAD_REQUEST
                            )

                        users = User.objects.filter(id__in=add_ids)
                        section.moderators.add(*users)

                        # 🔥 ИСПРАВЛЕНО: обновляем участников с сохранением секции
                        for user_id in add_ids:
                            EventParticipant.objects.update_or_create(
                                event=event,
                                user_id=user_id,
                                defaults={
                                    'participation_type': 'listener',
                                    'status': 'approved',
                                    'section': section,  # ← ВАЖНО: сохраняем секцию!
                                    'is_plenary': False
                                }
                            )

                serializer = self.get_serializer(event)
                return Response({
                    'message': 'Роли успешно обновлены',
                    'event': serializer.data
                })

        except Exception as e:
            logger.error(f"Ошибка при обновлении ролей: {str(e)}")
            return Response(
                {'error': f'Ошибка при обновлении ролей: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # Вспомогательные методы для работы с ролями
    def _parse_user_ids(self, user_ids_input):
        if not user_ids_input:
            return []

        try:
            if isinstance(user_ids_input, (int, str)):
                return [int(user_ids_input)]
            elif isinstance(user_ids_input, list):
                result = []
                for uid in user_ids_input:
                    if isinstance(uid, dict):
                        result.append(int(uid.get('id', 0)))
                    else:
                        try:
                            result.append(int(uid))
                        except (ValueError, TypeError):
                            continue
                return [uid for uid in result if uid > 0]
            else:
                return []
        except Exception:
            return []

    def _are_users_organizers(self, event, user_ids):
        return event.organizers.filter(id__in=user_ids).exists()

    def _are_users_plenary_moderators(self, event, user_ids):
        return event.plenary_moderators.filter(id__in=user_ids).exists()

    def _are_users_section_moderators(self, event, user_ids):
        for section in event.sections.all():
            if section.moderators.filter(id__in=user_ids).exists():
                return True
        return False

    def _are_users_moderators(self, event, user_ids):
        return (self._are_users_plenary_moderators(event, user_ids) or
                self._are_users_section_moderators(event, user_ids))


# ============================================
# 🔥 ОБНОВЛЕННЫЙ VIEWSET ДЛЯ СЕКЦИЙ
# ============================================

class SectionViewSet(viewsets.ModelViewSet):
    """
    API для работы с секциями мероприятий
    """
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Section.objects.all()

        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)

        return queryset

    def get_queryset(self):
        queryset = Section.objects.all()

        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)

        return queryset

    @action(detail=True, methods=['get'])
    def speakers(self, request, pk=None):
        """
        Получить список выступающих в секции
        """
        section = self.get_object()

        speakers = EventParticipant.objects.filter(
            section=section,
            participation_type='speaker',
            status='approved'
        ).exclude(user_id=section.event.created_by_id).select_related('user', 'project')

        serializer = EventParticipantSerializer(speakers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def materials(self, request, pk=None):
        """
        Получить материалы секции
        """
        section = self.get_object()

        speakers = EventParticipant.objects.filter(
            section=section,
            participation_type='speaker',
            status='approved'
        ).exclude(user_id=section.event.created_by_id)

        materials = SpeakerMaterial.objects.filter(
            participant__in=speakers,
            is_public=True
        ).select_related('participant', 'participant__user')

        serializer = SpeakerMaterialSerializer(materials, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def moderators(self, request, pk=None):
        """
        Получить список модераторов секции
        """
        section = self.get_object()
        moderators = section.moderators.all()
        from users.serializers import UserSerializer
        serializer = UserSerializer(moderators, many=True)
        return Response(serializer.data)

    # 🔥 НОВЫЙ ЭНДПОИНТ ДЛЯ ЗАГРУЗКИ ОБЛОЖКИ СЕКЦИИ
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_cover(self, request, pk=None):
        """
        Загрузка изображения для обложки секции
        """
        section = self.get_object()
        event = section.event

        # Проверка прав (модератор секции или организатор мероприятия)
        is_section_moderator = request.user in section.moderators.all()
        is_event_organizer = (request.user == event.created_by or
                              request.user in event.organizers.all())
        is_plenary_moderator = request.user in event.plenary_moderators.all()

        if not (is_section_moderator or is_event_organizer or is_plenary_moderator):
            return Response(
                {'error': 'Только модераторы секции или организаторы могут загружать обложки'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'image' not in request.FILES:
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )

        image = request.FILES['image']

        if image.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Файл слишком большой (макс. 5MB)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if image.content_type not in allowed_types:
            return Response(
                {'error': 'Недопустимый формат. Разрешены: JPEG, PNG, WEBP, GIF'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ext = os.path.splitext(image.name)[1]
        filename = f"section_{section.id}_{uuid.uuid4().hex}{ext}"

        upload_path = os.path.join('section_covers', str(section.id))
        full_path = os.path.join(settings.MEDIA_ROOT, upload_path)
        os.makedirs(full_path, exist_ok=True)

        file_path = os.path.join(upload_path, filename)
        with open(os.path.join(settings.MEDIA_ROOT, file_path), 'wb+') as destination:
            for chunk in image.chunks():
                destination.write(chunk)

        file_url = f"{settings.MEDIA_URL}{file_path}"

        # Получаем текущие изображения и добавляем новое
        cover_images = section.cover_images or []
        cover_images.append(file_url)
        section.cover_images = cover_images
        section.save(update_fields=['cover_images'])

        return Response({
            'url': file_url,
            'filename': filename,
            'cover_images': cover_images
        })

    # 🔥 НОВЫЙ ЭНДПОИНТ ДЛЯ ОБНОВЛЕНИЯ СПИСКА ИЗОБРАЖЕНИЙ
    @action(detail=True, methods=['patch'])
    def update_cover_images(self, request, pk=None):
        """
        Обновить список изображений обложки секции
        """
        section = self.get_object()
        event = section.event

        # Проверка прав
        is_section_moderator = request.user in section.moderators.all()
        is_event_organizer = (request.user == event.created_by or
                              request.user in event.organizers.all())
        is_plenary_moderator = request.user in event.plenary_moderators.all()

        if not (is_section_moderator or is_event_organizer or is_plenary_moderator):
            return Response(
                {'error': 'Только модераторы секции или организаторы могут изменять обложки'},
                status=status.HTTP_403_FORBIDDEN
            )

        cover_images = request.data.get('cover_images', [])
        section.cover_images = cover_images
        section.save(update_fields=['cover_images'])

        return Response({
            'cover_images': cover_images
        })

    def perform_create(self, serializer):
        event_id = self.request.data.get('event')
        event = get_object_or_404(Event, id=event_id)
        section = serializer.save(event=event)

        # 🔥 Автоматически создаём пункт программы для секции
        from .models import ScheduleItem
        from django.utils import timezone

        # Берём дату начала мероприятия
        start_time = timezone.make_aware(
            datetime.combine(event.start_date, datetime.min.time())
        )

        ScheduleItem.objects.create(
            event=event,
            section=section,
            is_plenary=False,
            title=f"Секция: {section.title}",
            start_time=start_time,
            order=event.sections.count()  # примерный порядок
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # 🔥 Обновляем соответствующий пункт программы
        from .models import ScheduleItem
        ScheduleItem.objects.filter(
            event=instance.event,
            section=instance
        ).update(title=f"Секция: {instance.title}")

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # 🔥 Удаляем связанные пункты программы
        from .models import ScheduleItem
        ScheduleItem.objects.filter(
            event=instance.event,
            section=instance
        ).delete()

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================
# VIEWSET ДЛЯ УЧАСТНИКОВ
# ============================================

class ParticipantViewSet(viewsets.ModelViewSet):
    """
    API для работы с участниками мероприятий
    """
    queryset = EventParticipant.objects.all()
    serializer_class = EventParticipantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        """
        Передаем request в контекст сериализатора для построения абсолютных URL
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        """
        Фильтрация участников по параметрам запроса
        """
        queryset = EventParticipant.objects.all()

        event_id = self.request.query_params.get('event')
        exclude_creator = self.request.query_params.get('exclude_creator', 'false')
        purpose = self.request.query_params.get('purpose')

        if event_id:
            event = get_object_or_404(Event, id=event_id)
            queryset = queryset.filter(event_id=event_id)

            if exclude_creator == 'true' or purpose in ['organizer', 'moderator']:
                queryset = queryset.exclude(user_id=event.created_by_id)

            if purpose == 'organizer':
                queryset = queryset.filter(
                    status='approved',
                    participation_type__in=['speaker', 'listener']
                ).exclude(
                    user_id__in=event.organizers.values_list('id', flat=True)
                )

            if purpose == 'moderator':
                existing_moderator_ids = list(event.plenary_moderators.values_list('id', flat=True))
                for section in event.sections.all():
                    existing_moderator_ids.extend(section.moderators.values_list('id', flat=True))

                queryset = queryset.filter(
                    status='approved',
                    participation_type__in=['speaker', 'listener']
                ).exclude(
                    user_id__in=event.organizers.values_list('id', flat=True)
                ).exclude(
                    user_id__in=existing_moderator_ids
                )

        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)

        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        is_plenary = self.request.query_params.get('is_plenary')
        if is_plenary is not None:
            queryset = queryset.filter(is_plenary=is_plenary.lower() == 'true')

        return queryset.order_by('speaker_order')

    @action(detail=False, methods=['get'])
    def potential_organizers(self, request):
        """
        Получить список потенциальных организаторов
        """
        event_id = request.query_params.get('event')
        if not event_id:
            return Response(
                {'error': 'Не указан ID мероприятия'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event = get_object_or_404(Event, id=event_id)
        participants = EventParticipant.objects.available_for_organizer(event)

        serializer = self.get_serializer(participants, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def potential_moderators(self, request):
        """
        Получить список потенциальных модераторов
        """
        event_id = request.query_params.get('event')
        section_id = request.query_params.get('section')

        if not event_id:
            return Response(
                {'error': 'Не указан ID мероприятия'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event = get_object_or_404(Event, id=event_id)
        section = None
        if section_id:
            section = get_object_or_404(Section, id=section_id, event=event)

        participants = EventParticipant.objects.potential_moderators(event, section)

        serializer = self.get_serializer(participants, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path=r'(?P<event_id>\d+)/participate')
    def participate(self, request, event_id=None):
        """
        Подать заявку на участие в мероприятии
        """
        print("\n" + "=" * 60)
        print("🔴 METHOD PARTICIPATE CALLED!")
        print(f"event_id: {event_id}")
        print(f"request.data: {request.data}")
        print("=" * 60 + "\n")

        if not event_id:
            print("❌ event_id отсутствует")
            return Response(
                {'error': 'Не указан ID мероприятия'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            event = Event.objects.get(id=event_id)
            print(f"✅ Мероприятие найдено: {event.title}")
        except Event.DoesNotExist:
            print(f"❌ Мероприятие с id {event_id} не найдено")
            return Response(
                {'error': 'Мероприятие не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )

        if event.created_by == request.user:
            print("❌ Создатель пытается подать заявку")
            return Response(
                {'error': 'Создатель мероприятия не может быть участником'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user in event.organizers.all():
            print("❌ Организатор пытается подать заявку")
            return Response(
                {'error': 'Организатор не может подать заявку как участник'},
                status=status.HTTP_400_BAD_REQUEST
            )

        print("\n🔍 Поиск существующей заявки...")
        existing = EventParticipant.objects.filter(
            event=event,
            user=request.user
        ).first()

        if existing:
            print(f"📋 Найдена заявка: ID={existing.id}, status={existing.status}")

            if existing.status in ['cancelled', 'rejected']:
                print(f"🗑️ Статус '{existing.status}' - удаляем старую заявку")
                existing.delete()
            else:
                print(f"❌ Заявка уже существует со статусом {existing.status}")
                return Response(
                    {'error': 'Вы уже подали заявку на это мероприятие'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            print("✅ Заявок не найдено")

        if event.registration_deadline < timezone.now().date():
            print("❌ Дедлайн регистрации истек")
            return Response(
                {'error': 'Регистрация на это мероприятие уже закрыта'},
                status=status.HTTP_400_BAD_REQUEST
            )

        print("\n📦 Создание сериализатора...")
        print(f"context event: {event.id}, has_sections: {event.has_sections}")
        serializer = ParticipateSerializer(data=request.data, context={'event': event})

        if not serializer.is_valid():
            print("❌ Ошибки валидации:")
            for field, errors in serializer.errors.items():
                print(f"   - {field}: {errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        print("✅ Валидация успешна")
        print(f"validated_data: {serializer.validated_data}")

        print("\n🔄 Начало транзакции...")

        try:
            with transaction.atomic():
                print("📝 Создание участника...")

                max_order = EventParticipant.objects.filter(
                    event=event,
                    participation_type='speaker',
                    status='approved'
                ).aggregate(models.Max('speaker_order'))['speaker_order__max'] or -1

                new_order = max_order + 1
                print(f"📊 Назначен порядок выступления: {new_order}")

                participant = EventParticipant.objects.create(
                    event=event,
                    user=request.user,
                    participation_type=serializer.validated_data['participation_type'],
                    uploaded_files=serializer.validated_data.get('uploaded_files', []),
                    talk_title=serializer.validated_data.get('talk_title', ''),
                    is_plenary=serializer.validated_data.get('is_plenary', False),
                    speaker_order=new_order
                )
                print(f"✅ Участник создан: ID={participant.id}")
                print(f"   is_plenary={participant.is_plenary}")
                print(f"   speaker_order={participant.speaker_order}")

                if serializer.validated_data.get('section_id'):
                    section_id = serializer.validated_data['section_id']
                    print(f"🔗 Привязка секции ID={section_id}")
                    section = get_object_or_404(Section, id=section_id, event=event)
                    participant.section = section
                    participant.save()
                    print(f"✅ Секция привязана")

                if serializer.validated_data.get('project_id'):
                    project_id = serializer.validated_data['project_id']
                    print(f"🔗 Проверка проекта ID={project_id}")
                    from projects.models import Project
                    project = get_object_or_404(Project, id=project_id)
                    if project.owner == request.user or project.members.filter(user=request.user).exists():
                        participant.project = project
                        participant.save()
                        print(f"✅ Проект привязан")
                    else:
                        print(f"⚠️ Пользователь не имеет доступа к проекту")

            print("\n✅ Транзакция успешно завершена")

        except Exception as e:
            print(f"\n❌ ОШИБКА В ТРАНЗАКЦИИ: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Ошибка при создании заявки: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        print("\n📦 Сериализация ответа...")
        response_serializer = self.get_serializer(participant)
        print("✅ Ответ готов")
        print("=" * 60 + "\n")

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_participation(self, request, pk=None):
        """
        Обновить данные участия с умной логикой
        """
        participant = self.get_object()
        event = participant.event

        print(f"\n{'=' * 60}")
        print(f"🔵 UPDATE PARTICIPATION ВЫЗОВ")
        print(f"participant_id: {pk}")
        print(f"request.data: {request.data}")
        print(f"request.user: {request.user.email} (ID: {request.user.id})")
        print(f"{'=' * 60}\n")

        if participant.user != request.user:
            return Response(
                {'error': 'Вы можете редактировать только свою заявку'},
                status=status.HTTP_403_FORBIDDEN
            )

        new_type = request.data.get('participation_type')
        old_type = participant.participation_type

        if participant.status == 'approved':
            if old_type == 'speaker' and new_type == 'listener':
                return Response(
                    {'error': 'Нельзя понизить роль с докладчика на слушателя после одобрения заявки'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = ParticipateSerializer(data=request.data, context={'event': event})

        if not serializer.is_valid():
            print(f"❌ Ошибки валидации: {serializer.errors}")
            error_messages = []
            for field, errors in serializer.errors.items():
                if isinstance(errors, list):
                    error_messages.extend(errors)
                else:
                    error_messages.append(str(errors))

            return Response(
                {'error': '; '.join(error_messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        print(f"✅ Валидация успешна. Данные: {data}")

        participant.participation_type = data['participation_type']
        participant.section_id = data.get('section_id')
        participant.project_id = data.get('project_id')
        participant.uploaded_files = data.get('uploaded_files', [])
        participant.talk_title = data.get('talk_title', '')
        participant.is_plenary = data.get('is_plenary', False)

        if old_type == 'listener' and new_type == 'speaker' and participant.status == 'approved':
            participant.status = 'pending'

        participant.save()

        response_serializer = EventParticipantSerializer(participant)
        return Response(response_serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Одобрить заявку на участие
        """
        participant = self.get_object()
        event = participant.event

        if participant.user == event.created_by:
            return Response(
                {'error': 'Создатель мероприятия не может быть участником'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if event.created_by != request.user and request.user not in event.organizers.all():
            return Response(
                {'error': 'У вас нет прав для одобрения заявок'},
                status=status.HTTP_403_FORBIDDEN
            )

        participant.status = 'approved'
        participant.reviewed_by = request.user
        participant.review_comment = request.data.get('comment', '')
        participant.save()

        serializer = self.get_serializer(participant)
        return Response({
            'message': 'Заявка одобрена',
            'participant': serializer.data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Отклонить заявку на участие
        """
        participant = self.get_object()
        event = participant.event

        if event.created_by != request.user and request.user not in event.organizers.all():
            return Response(
                {'error': 'У вас нет прав для отклонения заявок'},
                status=status.HTTP_403_FORBIDDEN
            )

        participant.status = 'rejected'
        participant.reviewed_by = request.user
        participant.review_comment = request.data.get('comment', '')
        participant.save()

        serializer = self.get_serializer(participant)
        return Response({
            'message': 'Заявка отклонена',
            'participant': serializer.data
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Отменить своё участие
        """
        participant = self.get_object()

        if participant.user != request.user:
            return Response(
                {'error': 'Вы можете отменить только свою заявку'},
                status=status.HTTP_403_FORBIDDEN
            )

        participant.status = 'cancelled'
        participant.save()

        return Response({'message': 'Участие отменено'})

    @action(detail=False, methods=['post'], url_path='bulk-update-speaker-order')
    def bulk_update_speaker_order(self, request):
        """
        Массовое обновление порядка докладчиков
        Ожидает массив: [{"id": 1, "order": 0}, {"id": 2, "order": 1}, ...]
        """
        items_data = request.data

        if not isinstance(items_data, list):
            return Response(
                {'error': 'Ожидается массив объектов'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                for item_data in items_data:
                    participant_id = item_data.get('id')
                    new_order = item_data.get('order')

                    if participant_id and new_order is not None:
                        EventParticipant.objects.filter(id=participant_id).update(speaker_order=new_order)
                        print(f"✅ Обновлён порядок участника {participant_id}: {new_order}")

            return Response({'message': 'Порядок докладчиков успешно обновлён'})
        except Exception as e:
            logger.error(f"Ошибка при обновлении порядка докладчиков: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================
# VIEWSET ДЛЯ НОВОСТЕЙ
# ============================================

class NewsViewSet(viewsets.ModelViewSet):
    """
    API для работы с новостями мероприятий
    """
    queryset = EventNews.objects.all().select_related('event', 'section', 'created_by')
    serializer_class = EventNewsSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """
        Фильтрация новостей по параметрам запроса
        """
        queryset = EventNews.objects.all().select_related('event', 'section', 'created_by')

        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(event_id=event_id)

        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)

        author_id = self.request.query_params.get('author')
        if author_id:
            queryset = queryset.filter(created_by_id=author_id)

        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """
        Создание новости с возможностью загрузки медиафайлов
        """
        print("\n" + "=" * 60)
        print("📝 СОЗДАНИЕ НОВОСТИ С МЕДИА")
        print("=" * 60)

        event_id = request.data.get('event')
        if not event_id:
            return Response(
                {'error': 'Не указано мероприятие'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Мероприятие не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )

        section_id = request.data.get('section')
        if not self._can_create_news(request.user, event, section_id):
            return Response(
                {'error': 'У вас нет прав для создания новостей в этом мероприятии'},
                status=status.HTTP_403_FORBIDDEN
            )

        files = request.FILES.getlist('media')
        print(f"📦 Получено файлов: {len(files)}")

        temp_media_items = []

        for file in files:
            media_item = self._save_media_file(file, event_id, request)
            if media_item:
                temp_media_items.append(media_item)
                print(f"✅ Временный файл сохранён: {media_item['filename']}")

        data = {
            'event': event_id,
            'section': section_id if section_id else None,
            'title': request.data.get('title'),
            'excerpt': request.data.get('excerpt', ''),
            'content': request.data.get('content'),
            'video_plays_automuted': request.data.get('video_plays_automuted', 'true').lower() == 'true',
            'media': temp_media_items
        }

        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            print(f"❌ Ошибка валидации: {e}")
            print(f"   Данные: {data}")
            raise

        news = serializer.save(created_by=request.user)

        scheme = 'https' if request.is_secure() else 'http'
        host = request.get_host()

        if temp_media_items:
            final_media = self._process_media_after_create(news, temp_media_items, scheme, host)
            news.media = final_media
            news.save(update_fields=['media'])
            print(f"✅ Медиа файлы переименованы и привязаны к новости {news.id}")

        response_serializer = self.get_serializer(news)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def _can_create_news(self, user, event, section_id=None):
        if not user.is_authenticated:
            return False

        if event.created_by == user:
            return True

        if user in event.organizers.all():
            return True

        if user in event.plenary_moderators.all():
            return True

        if section_id:
            try:
                section = Section.objects.get(id=section_id, event=event)
                if user in section.moderators.all():
                    return True
            except Section.DoesNotExist:
                pass

        return False

    def _save_media_file(self, file, event_id, request):
        import uuid
        import os
        from django.utils import timezone
        from django.conf import settings

        content_type = file.content_type or ''
        filename = file.name.lower()

        video_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.mpg', '.mpeg']
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']

        is_video = any(filename.endswith(ext) for ext in video_extensions)
        is_image = any(filename.endswith(ext) for ext in image_extensions)

        if not is_video and not is_image:
            is_video = content_type.startswith('video/')
            is_image = content_type.startswith('image/')

        if not is_video and not is_image:
            print(f"⚠️ Неподдерживаемый тип файла: {content_type}")
            return None

        media_type = 'video' if is_video else 'image'

        max_size = 100 * 1024 * 1024 if is_video else 10 * 1024 * 1024
        if file.size > max_size:
            print(f"⚠️ Файл слишком большой: {file.size} байт (макс. {max_size})")
            return None

        ext = os.path.splitext(file.name)[1]
        unique_id = uuid.uuid4().hex
        temp_filename = f"temp_{unique_id}{ext}"

        upload_path = os.path.join('news_media', str(event_id))
        full_path = os.path.join(settings.MEDIA_ROOT, upload_path)
        os.makedirs(full_path, exist_ok=True)

        file_path = os.path.join(upload_path, temp_filename)
        with open(os.path.join(settings.MEDIA_ROOT, file_path), 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        scheme = 'https' if request.is_secure() else 'http'
        host = request.get_host()
        temp_url = f"{scheme}://{host}{settings.MEDIA_URL}{file_path}"

        media_item = {
            'id': unique_id,
            'type': media_type,
            'url': temp_url,
            'filename': temp_filename,
            'name': file.name,
            'size': file.size,
            'content_type': content_type,
            'uploaded_at': timezone.now().isoformat(),
            'temp': True
        }

        return media_item

    def _process_media_after_create(self, news, temp_media_items, scheme, host):
        import uuid
        import os
        from django.conf import settings

        final_media_items = []

        for media_item in temp_media_items:
            if not media_item.get('temp'):
                final_media_items.append(media_item)
                continue

            old_filename = media_item['filename']
            ext = os.path.splitext(old_filename)[1]
            new_filename = f"news_{news.id}_{uuid.uuid4().hex}{ext}"

            upload_path = os.path.join('news_media', str(news.event_id))
            old_full_path = os.path.join(settings.MEDIA_ROOT, upload_path, old_filename)
            new_full_path = os.path.join(settings.MEDIA_ROOT, upload_path, new_filename)

            if os.path.exists(old_full_path):
                os.rename(old_full_path, new_full_path)
                print(f"✅ Файл переименован: {old_filename} -> {new_filename}")
            else:
                print(f"⚠️ Файл не найден: {old_full_path}")

            new_url = f"{scheme}://{host}{settings.MEDIA_URL}{upload_path}/{new_filename}"

            media_item['filename'] = new_filename
            media_item['url'] = new_url
            media_item.pop('temp', None)
            final_media_items.append(media_item)

        return final_media_items

    @action(detail=True, methods=['post'], url_path='increment-view')
    def increment_view(self, request, pk=None):
        news = self.get_object()
        views = news.increment_views()

        return Response({
            'success': True,
            'views_count': views,
            'message': 'Просмотр зарегистрирован'
        })

    @action(detail=True, methods=['post'], url_path='like')
    def like(self, request, pk=None):
        news = self.get_object()
        news.likes_count += 1
        news.save(update_fields=['likes_count'])

        return Response({
            'success': True,
            'likes_count': news.likes_count,
            'message': 'Лайк добавлен'
        })

    @action(detail=True, methods=['post'], url_path='unlike')
    def unlike(self, request, pk=None):
        news = self.get_object()
        if news.likes_count > 0:
            news.likes_count -= 1
            news.save(update_fields=['likes_count'])

        return Response({
            'success': True,
            'likes_count': news.likes_count,
            'message': 'Лайк убран'
        })

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_media(self, request, pk=None):
        news = self.get_object()

        if not self._can_edit_news(request.user, news):
            return Response(
                {'error': 'У вас нет прав для редактирования этой новости'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'file' not in request.FILES:
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']
        media_item = self._save_media_file(file, news.event_id, request)

        if not media_item:
            return Response(
                {'error': 'Неподдерживаемый тип файла'},
                status=status.HTTP_400_BAD_REQUEST
            )

        media_list = news.media or []
        media_item.pop('temp', None)
        media_list.append(media_item)

        news.media = media_list
        news.save(update_fields=['media'])

        return Response(media_item, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='media/(?P<media_id>[^/.]+)')
    def delete_media(self, request, pk=None, media_id=None):
        news = self.get_object()

        if not self._can_edit_news(request.user, news):
            return Response(
                {'error': 'У вас нет прав для редактирования этой новости'},
                status=status.HTTP_403_FORBIDDEN
            )

        media_list = news.media or []

        media_to_delete = None
        for media in media_list:
            if media.get('id') == media_id:
                media_to_delete = media
                break

        if not media_to_delete:
            return Response(
                {'error': 'Медиафайл не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        file_url = media_to_delete.get('url', '')
        if file_url:
            if '://' in file_url:
                file_path = file_url.split('/media/')[-1]
            else:
                file_path = file_url.replace(settings.MEDIA_URL, '')

            full_file_path = os.path.join(settings.MEDIA_ROOT, file_path)
            if os.path.exists(full_file_path):
                os.remove(full_file_path)
                print(f"🗑️ Удалён файл: {full_file_path}")

        new_media = [m for m in media_list if m.get('id') != media_id]
        news.media = new_media
        news.save(update_fields=['media'])

        return Response({'message': 'Медиафайл удален'})

    def _can_edit_news(self, user, news):
        if not user.is_authenticated:
            return False

        if news.created_by == user:
            return True

        event = news.event

        if event.created_by == user:
            return True

        if user in event.organizers.all():
            return True

        if user in event.plenary_moderators.all():
            return True

        if news.section and user in news.section.moderators.all():
            return True

        return False

    def update(self, request, *args, **kwargs):
        news = self.get_object()
        if not self._can_edit_news(request.user, news):
            return Response(
                {'error': 'У вас нет прав для редактирования этой новости'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        news = self.get_object()
        if not self._can_edit_news(request.user, news):
            return Response(
                {'error': 'У вас нет прав для удаления этой новости'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


# ============================================
# VIEWSET ДЛЯ МАТЕРИАЛОВ
# ============================================

class MaterialViewSet(viewsets.ModelViewSet):
    """
    API для работы с материалами выступающих
    """
    queryset = SpeakerMaterial.objects.all().select_related(
        'participant',
        'participant__user',
        'participant__project',
        'participant__section'
    )
    serializer_class = SpeakerMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MaterialPagination

    def get_queryset(self):
        """
        Получить материалы с фильтрацией по параметрам
        """
        queryset = SpeakerMaterial.objects.all().select_related(
            'participant',
            'participant__user',
            'participant__project',
            'participant__section'
        )

        participant_id = self.request.query_params.get('participant')
        if participant_id:
            queryset = queryset.filter(participant_id=participant_id)

        participant__in = self.request.query_params.get('participant__in')
        if participant__in:
            try:
                ids = [int(id.strip()) for id in participant__in.split(',') if id.strip()]
                if ids:
                    queryset = queryset.filter(participant_id__in=ids)
            except ValueError:
                pass

        is_public = self.request.query_params.get('is_public')
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public.lower() == 'true')

        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(participant__event_id=event_id)

        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(participant__section_id=section_id)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        participant_id = self.request.data.get('participant')
        participant = get_object_or_404(EventParticipant, id=participant_id)

        if participant.user != self.request.user:
            return Response(
                {'error': 'Вы можете загружать материалы только от своего имени'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer.save()


# ============================================
# VIEWSET ДЛЯ ПУНКТОВ ПРОГРАММЫ
# ============================================

class ScheduleItemViewSet(viewsets.ModelViewSet):
    """
    API для работы с программой мероприятия
    """
    queryset = ScheduleItem.objects.all()
    serializer_class = ScheduleItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Фильтрация по параметрам запроса
        """
        queryset = ScheduleItem.objects.all()

        event_id = self.request.query_params.get('event')
        if event_id:
            queryset = queryset.filter(
                Q(event_id=event_id) |
                Q(section__event_id=event_id) |
                Q(participant__event_id=event_id)
            )

        section_id = self.request.query_params.get('section')
        if section_id:
            queryset = queryset.filter(section_id=section_id)

        plenary = self.request.query_params.get('plenary')
        if plenary is not None:
            is_plenary = plenary.lower() == 'true'
            queryset = queryset.filter(is_plenary=is_plenary)

        custom = self.request.query_params.get('custom')
        if custom is not None:
            is_custom = custom.lower() == 'true'
            if is_custom:
                queryset = queryset.filter(participant__isnull=True, title__gt='')
            else:
                queryset = queryset.filter(participant__isnull=False)

        return queryset.order_by('start_time', 'order')

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['post'], url_path='bulk-update-order')
    def bulk_update_order(self, request):
        items_data = request.data

        if not isinstance(items_data, list):
            return Response(
                {'error': 'Ожидается массив объектов'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                for item_data in items_data:
                    item_id = item_data.get('id')
                    new_order = item_data.get('order')

                    if item_id and new_order is not None:
                        ScheduleItem.objects.filter(id=item_id).update(order=new_order)

            return Response({'message': 'Порядок успешно обновлён'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================
# ТЕСТОВЫЙ ЭНДПОИНТ
# ============================================

from rest_framework.decorators import api_view


@api_view(['GET'])
def test(request):
    """
    Тестовый эндпоинт для проверки работы conferences API
    """
    return Response({
        'status': 'ok',
        'message': 'Conferences API работает!',
        'endpoints': {
            'events': '/api/conferences/events/',
            'sections': '/api/conferences/sections/',
            'participants': '/api/conferences/participants/',
            'news': '/api/conferences/news/',
            'materials': '/api/conferences/materials/',
            'schedule': '/api/conferences/schedule/',
            'update_roles': '/api/conferences/events/{id}/update_roles/',
            'bulk_update_speaker_order': '/api/conferences/participants/bulk-update-speaker-order/'
        }
    })