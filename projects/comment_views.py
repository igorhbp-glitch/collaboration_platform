# projects/comment_views.py - ИСПРАВЛЕННАЯ ВЕРСИЯ
import json
import os
from datetime import datetime
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Task, Comment, ProjectMember
from .serializers import CommentSerializer


class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint для комментариев к задачам.
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Получаем комментарии для конкретной задачи"""
        task_id = self.kwargs.get('task_id')

        if not task_id:
            return Comment.objects.none()

        task = get_object_or_404(Task, id=task_id)

        # Проверяем доступ к задаче
        if not self._user_has_access_to_task(task):
            return Comment.objects.none()

        # Возвращаем комментарии для задачи, новые сверху
        return Comment.objects.filter(task=task).order_by('-created_at')

    def get_serializer_context(self):
        """Передаем дополнительный контекст в сериализатор"""
        context = super().get_serializer_context()
        task_id = self.kwargs.get('task_id')
        if task_id:
            context['task'] = get_object_or_404(Task, id=task_id)
        return context


    def create(self, request, *args, **kwargs):
        """Создание нового комментария с поддержкой файлов"""
        task_id = self.kwargs.get('task_id')
        task = get_object_or_404(Task, id=task_id)

        # Проверяем права
        if not self._user_can_comment(task):
            raise PermissionDenied("У вас нет права комментировать в этом проекте")

        print("\n" + "=" * 50)
        print("🔥 СОЗДАНИЕ КОММЕНТАРИЯ С ФАЙЛАМИ")
        print(f"📌 Задача ID: {task_id}")
        print(f"👤 Автор: {request.user.email}")

        # Логируем весь запрос
        print(f"\n📦 request.POST: {dict(request.POST)}")
        print(f"📦 request.FILES keys: {list(request.FILES.keys())}")
        print(f"📦 request.content_type: {request.content_type}")

        # 🔥 ОБРАБОТКА ФАЙЛОВ
        attachments = []

        # 1. Сначала обрабатываем файлы из request.FILES
        if request.FILES:
            print(f"\n📎 Найдено файлов в request.FILES: {len(request.FILES)}")
            for key, file in request.FILES.items():
                print(f"   - Ключ: {key}, файл: {file.name}, размер: {file.size}, тип: {file.content_type}")

                # Сохраняем файл (нужно реализовать сохранение)
                file_data = {
                    'name': file.name,
                    'size': file.size,
                    'type': file.content_type,
                    'extension': file.name.split('.')[-1].lower(),
                    'url': self.save_uploaded_file(file)  # метод для сохранения
                }
                attachments.append(file_data)

        # 2. Обрабатываем attachments из POST (метаданные)
        attachments_json = request.POST.getlist('attachments[]')
        if attachments_json:
            print(f"\n📎 Найдены attachments в POST: {attachments_json}")
            for att_json in attachments_json:
                try:
                    att_data = json.loads(att_json)
                    print(f"   - {att_data.get('name')}")

                    # Объединяем с данными из файлов, если нужно
                    # Проверяем, нет ли уже такого файла из request.FILES
                    existing = next((a for a in attachments if a['name'] == att_data.get('name')), None)
                    if not existing:
                        attachments.append(att_data)
                except Exception as e:
                    print(f"   ❌ Ошибка парсинга: {e}")

        print(f"\n📊 ИТОГО файлов: {len(attachments)}")
        for att in attachments:
            print(f"   - {att.get('name')}: {att.get('url')}")

        # Создаем сериализатор
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request, 'task': task}
        )

        if not serializer.is_valid():
            print(f"❌ Ошибки валидации: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Сохраняем комментарий с attachments
        comment = serializer.save(attachments=attachments)

        print(f"✅ Комментарий {comment.id} создан")
        print(f"📝 Текст: {comment.text[:50]}...")
        print(f"📎 Вложений: {len(comment.attachments)}")
        print("=" * 50 + "\n")

        return Response(
            self.get_serializer(comment).data,
            status=status.HTTP_201_CREATED
        )

    def save_uploaded_file(self, file):
        """Сохраняет файл и возвращает URL"""
        import os
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        from datetime import datetime

        # Создаем путь: comment_attachments/2026/03/09/filename.jpg
        date_path = datetime.now().strftime('%Y/%m/%d')
        file_path = f'comment_attachments/{date_path}/{file.name}'

        # Сохраняем файл
        saved_path = default_storage.save(file_path, ContentFile(file.read()))

        # Возвращаем URL
        return default_storage.url(saved_path)

    def update(self, request, *args, **kwargs):
        """Обновление комментария (только автор)"""
        comment = self.get_object()

        if comment.author != request.user:
            raise PermissionDenied("Вы можете редактировать только свои комментарии")

        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(comment, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Устанавливаем время редактирования
        comment.edited_at = timezone.now()
        self.perform_update(serializer)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Удаление комментария"""
        comment = self.get_object()

        if not self._can_delete_comment(comment):
            raise PermissionDenied("У вас нет права удалять этот комментарий")

        self.perform_destroy(comment)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def count(self, request, task_id=None):
        """Получить количество комментариев по задаче"""
        task = get_object_or_404(Task, id=task_id)

        if not self._user_has_access_to_task(task):
            return Response({'count': 0})

        count = Comment.objects.filter(task=task).count()
        return Response({'count': count})

    @action(detail=False, methods=['get'])
    def my_comments(self, request, task_id=None):
        """Получить комментарии текущего пользователя по задаче"""
        task = get_object_or_404(Task, id=task_id)

        if not self._user_has_access_to_task(task):
            return Response([])

        comments = Comment.objects.filter(
            task=task,
            author=request.user
        ).order_by('-created_at')

        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)

    def _user_has_access_to_task(self, task):
        """Проверка доступа к задаче"""
        user = self.request.user

        if task.project.owner == user:
            return True

        return ProjectMember.objects.filter(
            project=task.project,
            user=user
        ).exists()

    def _user_can_comment(self, task):
        """Проверка права комментировать"""
        user = self.request.user

        if task.project.owner == user:
            return True

        try:
            member = ProjectMember.objects.get(
                project=task.project,
                user=user
            )
            return member.can_create_tasks
        except ProjectMember.DoesNotExist:
            return False

    def _can_delete_comment(self, comment):
        """Проверка права удалять комментарий"""
        user = self.request.user
        task = comment.task
        project = task.project

        if comment.author == user:
            return True

        if project.owner == user:
            return True

        try:
            member = ProjectMember.objects.get(
                project=project,
                user=user
            )
            return member.role in [
                ProjectMember.Role.SCRUM_MASTER,
                ProjectMember.Role.PRODUCT_OWNER,
                ProjectMember.Role.LEAD_RESEARCHER
            ] or member.can_manage_tasks
        except ProjectMember.DoesNotExist:
            return False