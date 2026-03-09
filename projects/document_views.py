# projects/document_views.py
import os
import logging
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import Project, ProjectDocument, ProjectMember
from .document_serializers import ProjectDocumentSerializer, UploadDocumentSerializer

logger = logging.getLogger(__name__)


class ProjectDocumentListView(generics.ListCreateAPIView):
    """
    GET:    /api/projects/{project_id}/documents/     - список документов
    POST:   /api/projects/{project_id}/documents/     - загрузить документ
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UploadDocumentSerializer  # для POST используем специальный сериализатор
        return ProjectDocumentSerializer  # для GET используем обычный

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)

        # 🔥 ИСПРАВЛЕНО: Не фильтруем по пользователю - возвращаем все документы проекта
        # Даже для не-участников документы должны быть видны (для публичных проектов)
        return ProjectDocument.objects.filter(project_id=project_id).order_by('-uploaded_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['project'] = get_object_or_404(Project, id=self.kwargs.get('project_id'))
        return context

    def post(self, request, *args, **kwargs):
        # Логируем всё, что пришло
        print("\n" + "=" * 80)
        print("🔥 POST /api/projects/{}/documents/".format(self.kwargs.get('project_id')))
        print("=" * 80)
        print(f"📦 request.data: {request.data}")
        print(f"📦 request.FILES: {request.FILES}")
        print(f"📦 request.content_type: {request.content_type}")
        print("=" * 80 + "\n")

        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs.get('project_id'))

        # Проверяем права на загрузку
        is_member = ProjectMember.objects.filter(
            project=project,
            user=self.request.user
        ).exists()
        is_owner = project.owner == self.request.user

        if not (is_member or is_owner):
            self.permission_denied(
                self.request,
                message="Только участники проекта могут загружать документы"
            )

        print(f"💾 Сохраняем файл для проекта {project.id}")
        print(f"   Пользователь: {self.request.user.email}")
        print(f"   Файл: {self.request.FILES.get('file')}")

        # Сохраняем с дополнительными полями
        serializer.save(project=project, uploaded_by=self.request.user)


class ProjectDocumentDetailView(generics.RetrieveDestroyAPIView):
    """
    GET:    /api/projects/documents/{id}/     - получить документ
    DELETE: /api/projects/documents/{id}/     - удалить документ
    """
    queryset = ProjectDocument.objects.all()
    serializer_class = ProjectDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Базовый queryset
        return ProjectDocument.objects.all()

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)

        project = obj.project

        # 🔥 ИСПРАВЛЕНО: Для GET запросов (просмотр) разрешаем всем, у кого есть доступ к проекту
        if self.request.method == 'GET':
            # Проверяем доступ к проекту
            is_member = ProjectMember.objects.filter(
                project=project,
                user=request.user
            ).exists()
            is_owner = project.owner == request.user

            # Если проект приватный и пользователь не участник - доступ запрещён
            if project.is_private and not (is_member or is_owner):
                self.permission_denied(
                    request,
                    message="У вас нет доступа к этому документу"
                )
            # Для публичных проектов - разрешаем просмотр всем
            return

        # Для DELETE запросов - нужны права
        if self.request.method == 'DELETE':
            is_member = ProjectMember.objects.filter(
                project=project,
                user=request.user
            ).exists()
            is_owner = project.owner == request.user

            if obj.uploaded_by != request.user and not is_owner:
                self.permission_denied(
                    request,
                    message="Только автор или владелец проекта может удалить документ"
                )

    def retrieve(self, request, *args, **kwargs):
        """Получение информации о документе"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Удаление документа и файла"""
        instance = self.get_object()

        print(f"\n🗑️ Удаление документа {instance.id}: {instance.name}")
        print(f"   Проект: {instance.project.id}")
        print(f"   Загрузил: {instance.uploaded_by.email}")
        print(f"   Запрашивает: {request.user.email}")

        # Удаляем файл из файловой системы
        if instance.file:
            file_path = instance.file.path
            instance.file.delete(save=False)
            print(f"   ✅ Файл удален: {file_path}")
        else:
            print(f"   ⚠️ Файл не найден в файловой системе")

        # Удаляем запись из БД
        self.perform_destroy(instance)
        print(f"   ✅ Запись удалена из БД\n")

        return Response(status=status.HTTP_204_NO_CONTENT)