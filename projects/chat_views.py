# backend/projects/chat_views.py - ПОЛНАЯ ВЕРСИЯ С ПОДДЕРЖКОЙ ФАЙЛОВ

import json
import os
from datetime import datetime
from django.shortcuts import get_object_or_404
from django.db import connection
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes

from .models import Project, ProjectChatMessage, ProjectMember
from .serializers import ProjectChatMessageSerializer


# ============================================================================
# КЛАСС 1: ПОЛУЧЕНИЕ СПИСКА СООБЩЕНИЙ И СОЗДАНИЕ НОВЫХ
# ============================================================================

# backend/projects/chat_views.py - КЛАСС ProjectChatMessageListCreateView

class ProjectChatMessageListCreateView(generics.ListCreateAPIView):
    """
    GET:    /api/projects/{project_id}/chat/     - получить все сообщения чата
    POST:   /api/projects/{project_id}/chat/     - отправить новое сообщение
    """
    serializer_class = ProjectChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)

        is_member = ProjectMember.objects.filter(
            project=project,
            user=self.request.user
        ).exists()
        is_owner = project.owner == self.request.user

        if not (is_member or is_owner):
            return ProjectChatMessage.objects.none()

        queryset = ProjectChatMessage.objects.filter(
            project_id=project_id,
            parent_message__isnull=True
        ).select_related(
            'author', 'project'
        ).prefetch_related(
            'replies'
        ).order_by('created_at')

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['project'] = get_object_or_404(Project, id=self.kwargs.get('project_id'))
        return context

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Отмечаем все сообщения как прочитанные текущим пользователем
        for message in queryset:
            message.mark_as_read(request.user.id)
            for reply in message.replies.all():
                reply.mark_as_read(request.user.id)

        project = get_object_or_404(Project, id=self.kwargs.get('project_id'))

        return Response({
            'project_id': project.id,
            'project_title': project.title,
            'total_messages': len(serializer.data),
            'messages': serializer.data
        })

    # 🔥 ДОБАВЛЕНО: детальное логирование POST запроса
    def post(self, request, *args, **kwargs):
        print("\n" + "=" * 80)
        print("🔥 POST ЗАПРОС В ЧАТ")
        print("=" * 80)
        print(f"📌 Аутентификация: {request.user.is_authenticated}")
        print(f"📌 Пользователь: {request.user.email if request.user.is_authenticated else 'Не авторизован'}")
        print(f"📌 Content-Type: {request.content_type}")
        print(f"📌 Метод: {request.method}")
        print(f"📌 Путь: {request.path}")
        print(f"📌 project_id: {self.kwargs.get('project_id')}")
        print("\n📦 request.data:")
        for key, value in request.data.items():
            if hasattr(value, 'name'):  # Это файл
                print(f"   - {key}: File(name={value.name}, size={value.size}, content_type={value.content_type})")
            else:
                print(f"   - {key}: {value}")

        print("\n📦 request.FILES:")
        for key, file in request.FILES.items():
            print(f"   - {key}: {file.name} ({file.size} bytes, {file.content_type})")

        print("\n📦 request.POST:")
        for key, value in request.POST.items():
            print(f"   - {key}: {value}")

        print("\n📦 request.META (важные заголовки):")
        print(f"   - CONTENT_TYPE: {request.META.get('CONTENT_TYPE', 'не указан')}")
        print(f"   - CONTENT_LENGTH: {request.META.get('CONTENT_LENGTH', 'не указан')}")
        print(f"   - HTTP_AUTHORIZATION: {'присутствует' if request.META.get('HTTP_AUTHORIZATION') else 'ОТСУТСТВУЕТ'}")

        print("=" * 80 + "\n")

        return super().post(request, *args, **kwargs)

    def save_uploaded_file(self, file, project_id):
        """Сохраняет файл и возвращает URL"""
        from datetime import datetime
        import os

        # Создаем путь: chat_attachments/project_14/2024/03/08/filename.jpg
        date_path = datetime.now().strftime('%Y/%m/%d')

        # Очищаем имя файла от возможных проблемных символов
        filename = file.name.replace(' ', '_').replace('(', '').replace(')', '')
        file_path = f'chat_attachments/project_{project_id}/{date_path}/{filename}'

        print(f"💾 Сохраняем файл: {file_path}")

        # Сохраняем файл
        saved_path = default_storage.save(file_path, ContentFile(file.read()))

        # Возвращаем URL
        file_url = default_storage.url(saved_path)

        print(f"✅ Файл сохранен: {file_path}")
        print(f"   URL: {file_url}")
        print(f"   Размер: {file.size} bytes")
        print(f"   Тип: {file.content_type}")

        return file_url

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs.get('project_id'))

        is_member = ProjectMember.objects.filter(
            project=project,
            user=self.request.user
        ).exists()
        is_owner = project.owner == self.request.user

        if not (is_member or is_owner):
            self.permission_denied(
                self.request,
                message="Только участники проекта могут отправлять сообщения"
            )

        # 🔥 ОБРАБОТКА ФАЙЛОВ
        attachments = []

        print("\n" + "=" * 80)
        print("🔥 НАЧАЛО ОБРАБОТКИ ФАЙЛОВ В ЧАТЕ")
        print("=" * 80)
        print(f"📦 request.FILES: {list(self.request.FILES.keys()) if self.request.FILES else 'НЕТ'}")
        print(f"📦 request.data keys: {list(self.request.data.keys()) if self.request.data else 'НЕТ'}")

        # 1. Обрабатываем загруженные файлы из request.FILES
        if self.request.FILES:
            print(f"\n📎 Найдено файлов в request.FILES: {len(self.request.FILES)}")
            for key, file in self.request.FILES.items():
                print(f"   - Ключ: {key}, файл: {file.name}, размер: {file.size}, тип: {file.content_type}")

                # Сохраняем файл
                file_url = self.save_uploaded_file(file, project.id)

                # Создаем запись о файле
                file_data = {
                    'name': file.name,
                    'size': file.size,
                    'type': file.content_type,
                    'url': file_url,
                    'extension': os.path.splitext(file.name)[1].lower()
                }
                attachments.append(file_data)
                print(f"   ✅ Файл добавлен в attachments: {file_data['name']}")

        # 2. Обрабатываем attachments из JSON (если есть)
        attachments_json = self.request.data.get('attachments')
        if attachments_json:
            print(f"\n📎 Найдены attachments в JSON: {attachments_json}")
            try:
                if isinstance(attachments_json, str):
                    json_attachments = json.loads(attachments_json)
                else:
                    json_attachments = attachments_json

                if isinstance(json_attachments, list):
                    attachments.extend(json_attachments)
                    print(f"   ✅ Добавлено {len(json_attachments)} файлов из JSON")
            except Exception as e:
                print(f"   ❌ Ошибка парсинга JSON: {e}")

        print(f"\n📊 ИТОГО файлов к сохранению: {len(attachments)}")
        for idx, att in enumerate(attachments):
            print(f"   {idx + 1}. {att.get('name')} - {att.get('size')} bytes - {att.get('url')}")

        # Сохраняем сообщение
        message = serializer.save(
            project=project,
            author=self.request.user,
            attachments=attachments
        )

        print(f"\n✅ Сообщение {message.id} успешно создано")
        print(f"   Текст: {message.text[:50] if message.text else 'Нет текста'}")
        print(f"   Вложений: {len(message.attachments)}")
        print("=" * 80 + "\n")

# ============================================================================
# КЛАСС 2: ПОЛУЧЕНИЕ, ОБНОВЛЕНИЕ И УДАЛЕНИЕ КОНКРЕТНОГО СООБЩЕНИЯ
# ============================================================================

class ProjectChatMessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'message_id'

    def get_queryset(self):
        return ProjectChatMessage.objects.filter(
            project_id=self.kwargs.get('project_id')
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['project'] = get_object_or_404(Project, id=self.kwargs.get('project_id'))
        return context

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)

        project = obj.project
        is_member = ProjectMember.objects.filter(
            project=project,
            user=request.user
        ).exists()
        is_owner = project.owner == request.user

        if not (is_member or is_owner):
            self.permission_denied(
                request,
                message="У вас нет доступа к этому проекту"
            )

        if self.request.method in ['PUT', 'PATCH']:
            if obj.author != request.user and not is_owner:
                self.permission_denied(
                    request,
                    message="Вы можете редактировать только свои сообщения"
                )

        if self.request.method == 'DELETE':
            if obj.author != request.user and not is_owner:
                self.permission_denied(
                    request,
                    message="У вас нет прав на удаление этого сообщения"
                )

    def perform_destroy(self, instance):
        # Помечаем сообщение как удалённое
        instance.text = "[Сообщение удалено]"
        instance.attachments = []
        instance.save(update_fields=['text', 'attachments'])


# ============================================================================
# КЛАСС 3: ОТМЕТКА СООБЩЕНИЯ КАК ПРОЧИТАННОГО
# ============================================================================

class ProjectChatMessageMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id, message_id):
        message = get_object_or_404(
            ProjectChatMessage,
            id=message_id,
            project_id=project_id
        )

        project = message.project
        is_member = ProjectMember.objects.filter(
            project=project,
            user=request.user
        ).exists()
        is_owner = project.owner == request.user

        if not (is_member or is_owner):
            return Response(
                {"error": "У вас нет доступа к этому проекту"},
                status=status.HTTP_403_FORBIDDEN
            )

        marked = message.mark_as_read(request.user.id)

        return Response({
            "success": True,
            "marked": marked,
            "message_id": message.id,
            "read_by_count": message.read_count
        })


# ============================================================================
# ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ КОЛИЧЕСТВА НЕПРОЧИТАННЫХ СООБЩЕНИЙ
# ============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_chat_unread_count(request, project_id):
    """
    GET: /api/projects/{project_id}/chat/unread_count/
    """
    project = get_object_or_404(Project, id=project_id)

    is_member = ProjectMember.objects.filter(
        project=project,
        user=request.user
    ).exists()
    is_owner = project.owner == request.user

    if not (is_member or is_owner):
        return Response(
            {"error": "Нет доступа к проекту"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM projects_projectchatmessage 
                WHERE project_id = %s 
                AND author_id != %s 
                AND json_extract(read_by, '$') NOT LIKE %s
            """, [project_id, request.user.id, f'%{request.user.id}%'])

            row = cursor.fetchone()
            unread_count = row[0] if row else 0

        return Response({
            "project_id": project_id,
            "project_title": project.title,
            "unread_count": unread_count
        })

    except Exception as e:
        print(f"⚠️ Ошибка в SQL запросе: {e}")

        # Запасной вариант
        all_messages = ProjectChatMessage.objects.filter(
            project_id=project_id
        ).exclude(
            author=request.user
        )

        unread_count = 0
        for message in all_messages:
            if request.user.id not in message.read_by:
                unread_count += 1

        return Response({
            "project_id": project_id,
            "project_title": project.title,
            "unread_count": unread_count,
            "note": "Использован медленный метод подсчета"
        })


# ============================================================================
# НОВЫЙ ЭНДПОИНТ: ПАГИНИРОВАННОЕ ПОЛУЧЕНИЕ СООБЩЕНИЙ
# ============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_chat_messages_paginated(request, project_id):
    """
    GET: /api/projects/{project_id}/chat/messages/

    Параметры:
    - page: номер страницы
    - page_size: размер страницы
    - before_id: ID сообщения, до которого грузить
    - after_id: ID сообщения, после которого грузить
    - ordering: сортировка ('created_at' или '-created_at')
    """
    project = get_object_or_404(Project, id=project_id)

    is_member = ProjectMember.objects.filter(
        project=project,
        user=request.user
    ).exists()
    is_owner = project.owner == request.user

    if not (is_member or is_owner):
        return Response(
            {"error": "Нет доступа к проекту"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Параметры запроса
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 50))
    before_id = request.query_params.get('before_id')
    after_id = request.query_params.get('after_id')
    ordering = request.query_params.get('ordering', '-created_at')

    if page_size > 100:
        page_size = 100
    if page_size < 1:
        page_size = 1

    # Базовый запрос
    base_queryset = ProjectChatMessage.objects.filter(
        project_id=project_id,
        parent_message__isnull=True
    ).select_related('author').order_by(ordering)

    total_count = base_queryset.count()
    queryset = base_queryset

    if before_id:
        try:
            before_message = ProjectChatMessage.objects.get(id=before_id)
            if ordering.startswith('-'):
                queryset = base_queryset.filter(created_at__gt=before_message.created_at)
            else:
                queryset = base_queryset.filter(created_at__lt=before_message.created_at)
        except ProjectChatMessage.DoesNotExist:
            queryset = base_queryset.none()
        queryset = queryset[:page_size]

    elif after_id:
        try:
            after_message = ProjectChatMessage.objects.get(id=after_id)
            if ordering.startswith('-'):
                queryset = base_queryset.filter(created_at__lt=after_message.created_at)
            else:
                queryset = base_queryset.filter(created_at__gt=after_message.created_at)
        except ProjectChatMessage.DoesNotExist:
            queryset = base_queryset.none()
        queryset = queryset[:page_size]

    else:
        start = (page - 1) * page_size
        end = start + page_size
        queryset = base_queryset[start:end]

    serializer = ProjectChatMessageSerializer(
        queryset,
        many=True,
        context={'request': request, 'project': project}
    )

    # Отмечаем как прочитанные
    for message in queryset:
        message.mark_as_read(request.user.id)
        for reply in message.replies.all():
            reply.mark_as_read(request.user.id)

    # Проверяем наличие следующих/предыдущих страниц
    has_previous = False
    has_next = False

    if queryset.exists():
        first_id = queryset[0].id if len(queryset) > 0 else None
        last_id = queryset[len(queryset) - 1].id if len(queryset) > 0 else None

        if first_id:
            if ordering.startswith('-'):
                has_previous = base_queryset.filter(created_at__gt=queryset[0].created_at).exists()
            else:
                has_previous = base_queryset.filter(created_at__lt=queryset[0].created_at).exists()

        if last_id:
            if ordering.startswith('-'):
                has_next = base_queryset.filter(created_at__lt=queryset[len(queryset) - 1].created_at).exists()
            else:
                has_next = base_queryset.filter(created_at__gt=queryset[len(queryset) - 1].created_at).exists()

    return Response({
        "project_id": project.id,
        "project_title": project.title,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "has_previous": has_previous,
        "has_next": has_next,
        "ordering": ordering,
        "messages": serializer.data
    })


# ============================================================================
# ФУНКЦИЯ: ПОЛУЧЕНИЕ ИСТОРИИ СООБЩЕНИЙ ПО ДАТАМ
# ============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_chat_history(request, project_id):
    """
    GET: /api/projects/{project_id}/chat/history/?before_date=2026-02-13&limit=50
    """
    project = get_object_or_404(Project, id=project_id)

    is_member = ProjectMember.objects.filter(
        project=project,
        user=request.user
    ).exists()
    is_owner = project.owner == request.user

    if not (is_member or is_owner):
        return Response(
            {"error": "Нет доступа к проекту"},
            status=status.HTTP_403_FORBIDDEN
        )

    before_date = request.query_params.get('before_date')
    limit = int(request.query_params.get('limit', 50))

    queryset = ProjectChatMessage.objects.filter(
        project_id=project_id,
        parent_message__isnull=True
    ).select_related('author').order_by('-created_at')

    if before_date:
        queryset = queryset.filter(created_at__lt=before_date)

    queryset = queryset[:limit]

    serializer = ProjectChatMessageSerializer(
        queryset,
        many=True,
        context={'request': request, 'project': project}
    )

    for message in queryset:
        message.mark_as_read(request.user.id)
        for reply in message.replies.all():
            reply.mark_as_read(request.user.id)

    return Response({
        "project_id": project.id,
        "project_title": project.title,
        "has_more": len(queryset) == limit,
        "messages": serializer.data
    })


# ============================================================================
# ФУНКЦИЯ: ПОИСК ПО СООБЩЕНИЯМ
# ============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_chat_search(request, project_id):
    """
    GET: /api/projects/{project_id}/chat/search/?q=текст+поиска
    """
    project = get_object_or_404(Project, id=project_id)

    is_member = ProjectMember.objects.filter(
        project=project,
        user=request.user
    ).exists()
    is_owner = project.owner == request.user

    if not (is_member or is_owner):
        return Response(
            {"error": "Нет доступа к проекту"},
            status=status.HTTP_403_FORBIDDEN
        )

    query = request.query_params.get('q', '')

    if len(query) < 2:
        return Response({
            "error": "Поисковый запрос должен содержать минимум 2 символа"
        }, status=status.HTTP_400_BAD_REQUEST)

    messages = ProjectChatMessage.objects.filter(
        project_id=project_id,
        text__icontains=query
    ).exclude(
        text="[Сообщение удалено]"
    ).select_related('author').order_by('-created_at')[:50]

    serializer = ProjectChatMessageSerializer(
        messages,
        many=True,
        context={'request': request, 'project': project}
    )

    return Response({
        "project_id": project.id,
        "project_title": project.title,
        "query": query,
        "results_count": len(serializer.data),
        "results": serializer.data
    })


# ============================================================================
# ФУНКЦИЯ: СТАТИСТИКА ЧАТА
# ============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_chat_stats(request, project_id):
    """
    GET: /api/projects/{project_id}/chat/stats/
    """
    project = get_object_or_404(Project, id=project_id)

    is_member = ProjectMember.objects.filter(
        project=project,
        user=request.user
    ).exists()
    is_owner = project.owner == request.user

    if not (is_member or is_owner):
        return Response(
            {"error": "Нет доступа к проекту"},
            status=status.HTTP_403_FORBIDDEN
        )

    total_messages = ProjectChatMessage.objects.filter(project_id=project_id).count()

    authors = ProjectChatMessage.objects.filter(
        project_id=project_id
    ).values('author').distinct().count()

    last_message = ProjectChatMessage.objects.filter(
        project_id=project_id
    ).order_by('-created_at').first()

    from django.utils import timezone
    from datetime import timedelta

    first_message = ProjectChatMessage.objects.filter(
        project_id=project_id
    ).order_by('created_at').first()

    messages_per_day = 0
    if first_message and last_message:
        days_diff = (last_message.created_at - first_message.created_at).days + 1
        if days_diff > 0:
            messages_per_day = round(total_messages / days_diff, 1)

    return Response({
        "project_id": project.id,
        "project_title": project.title,
        "stats": {
            "total_messages": total_messages,
            "total_participants": authors,
            "last_message_at": last_message.created_at if last_message else None,
            "messages_per_day": messages_per_day,
            "created_at": project.created_at
        }
    })