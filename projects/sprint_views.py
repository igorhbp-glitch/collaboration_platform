# backend/projects/sprint_views.py - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Project, Sprint, ProjectMember, Task
from .serializers import SprintSerializer, CreateSprintSerializer, TaskSerializer
from users.models import CustomUser


class ProjectSprintListView(generics.ListAPIView):
    """
    GET: /api/projects/{project_id}/sprints/
    Получить все спринты проекта
    """
    serializer_class = SprintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)

        # 🔥 ИСПРАВЛЕНО: Не фильтруем по пользователю для публичных проектов
        # Проверяем, имеет ли пользователь доступ к проекту
        is_member = ProjectMember.objects.filter(
            project=project,
            user=self.request.user
        ).exists()
        is_owner = project.owner == self.request.user

        # Если проект приватный и пользователь не участник - возвращаем пустой список
        if project.is_private and not (is_member or is_owner):
            return Sprint.objects.none()

        # Для публичных проектов и участников - возвращаем все спринты
        return Sprint.objects.filter(project_id=project_id).order_by('created_at')


class ProjectSprintCreateView(generics.CreateAPIView):
    """
    POST: /api/projects/{project_id}/sprints/create/
    Создать новый спринт в проекте
    """
    serializer_class = CreateSprintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)

        # 🔥 ИСПРАВЛЕНО: проверяем права на управление спринтами
        is_owner = project.owner == self.request.user
        can_manage_sprints = False

        if not is_owner:
            # Проверяем роль пользователя в проекте
            try:
                member = ProjectMember.objects.get(
                    project=project,
                    user=self.request.user,
                    status='approved'
                )
                # Проверяем, есть ли у пользователя права на управление спринтами
                can_manage_sprints = member.role in ['scrum_master', 'lead_researcher'] or member.can_manage_tasks
            except ProjectMember.DoesNotExist:
                can_manage_sprints = False

        if not (is_owner or can_manage_sprints):
            self.permission_denied(
                self.request,
                message="У вас нет прав для создания спринтов"
            )

        # Проверяем, что не превышен лимит спринтов
        existing_sprints_count = project.sprints.count()
        if project.total_sprints > 0 and existing_sprints_count >= project.total_sprints:
            self.permission_denied(
                self.request,
                message=f"Достигнут лимит спринтов ({project.total_sprints})"
            )

        # Сохраняем спринт
        serializer.save(project=project)


class SprintDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET:    /api/projects/sprints/{id}/     - получить спринт
    PUT:    /api/projects/sprints/{id}/     - обновить спринт
    PATCH:  /api/projects/sprints/{id}/     - частично обновить
    DELETE: /api/projects/sprints/{id}/     - удалить спринт
    """
    queryset = Sprint.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CreateSprintSerializer
        return SprintSerializer

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)

        project = obj.project

        # Для GET запросов разрешаем всем участникам
        if self.request.method == 'GET':
            is_member = ProjectMember.objects.filter(
                project=project,
                user=request.user
            ).exists()
            is_owner = project.owner == request.user

            if not (is_member or is_owner) and project.is_private:
                self.permission_denied(
                    request,
                    message="У вас нет доступа к этому проекту"
                )
            return

        # 🔥 ИСПРАВЛЕНО: для изменений проверяем права на управление спринтами
        is_owner = project.owner == request.user
        can_manage_sprints = False

        if not is_owner:
            try:
                member = ProjectMember.objects.get(
                    project=project,
                    user=request.user,
                    status='approved'
                )
                can_manage_sprints = member.role in ['scrum_master', 'lead_researcher'] or member.can_manage_tasks
            except ProjectMember.DoesNotExist:
                can_manage_sprints = False

        if not (is_owner or can_manage_sprints):
            self.permission_denied(
                request,
                message="Только владелец, scrum-мастер или ведущий исследователь могут изменять спринты"
            )

    def perform_destroy(self, instance):
        """Удаление спринта (только для владельца или с правами)"""
        super().perform_destroy(instance)


class SprintStartView(APIView):
    """
    POST: /api/projects/sprints/{id}/start/
    Запустить спринт (изменить статус на 'active')
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        sprint = get_object_or_404(Sprint, id=pk)
        project = sprint.project

        # 🔥 ИСПРАВЛЕНО: проверяем права на управление спринтами
        is_owner = project.owner == request.user
        can_manage_sprints = False

        if not is_owner:
            try:
                member = ProjectMember.objects.get(
                    project=project,
                    user=request.user,
                    status='approved'
                )
                can_manage_sprints = member.role in ['scrum_master', 'lead_researcher'] or member.can_manage_tasks
            except ProjectMember.DoesNotExist:
                can_manage_sprints = False

        if not (is_owner or can_manage_sprints):
            return Response(
                {"error": "У вас нет прав для запуска спринтов"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверяем, что спринт в статусе planning
        if sprint.status != 'planning':
            return Response(
                {"error": f"Нельзя запустить спринт в статусе {sprint.get_status_display()}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Меняем статус
        sprint.status = 'active'
        sprint.save()

        # Обновляем текущий спринт в проекте
        project.current_sprint = sprint
        project.save()

        serializer = SprintSerializer(sprint)
        return Response({
            "message": "Спринт успешно запущен",
            "sprint": serializer.data
        })


class SprintCompleteView(APIView):
    """
    POST: /api/projects/sprints/{id}/complete/
    Завершить спринт (изменить статус на 'completed')
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        sprint = get_object_or_404(Sprint, id=pk)
        project = sprint.project

        # 🔥 ИСПРАВЛЕНО: проверяем права на управление спринтами
        is_owner = project.owner == request.user
        can_manage_sprints = False

        if not is_owner:
            try:
                member = ProjectMember.objects.get(
                    project=project,
                    user=request.user,
                    status='approved'
                )
                can_manage_sprints = member.role in ['scrum_master', 'lead_researcher'] or member.can_manage_tasks
            except ProjectMember.DoesNotExist:
                can_manage_sprints = False

        if not (is_owner or can_manage_sprints):
            return Response(
                {"error": "У вас нет прав для завершения спринтов"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверяем, что спринт в статусе active
        if sprint.status != 'active':
            return Response(
                {"error": f"Нельзя завершить спринт в статусе {sprint.get_status_display()}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Меняем статус
        sprint.status = 'completed'
        sprint.save()

        # Убираем текущий спринт из проекта
        if project.current_sprint == sprint:
            project.current_sprint = None
            project.save()

        serializer = SprintSerializer(sprint)
        return Response({
            "message": "Спринт успешно завершен",
            "sprint": serializer.data
        })


class SprintTasksView(generics.ListAPIView):
    """
    GET: /api/projects/sprints/{id}/tasks/
    Получить все задачи спринта
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        sprint_id = self.kwargs.get('pk')
        sprint = get_object_or_404(Sprint, id=sprint_id)
        project = sprint.project

        # 🔥 ИСПРАВЛЕНО: Проверяем доступ к проекту
        is_member = ProjectMember.objects.filter(
            project=project,
            user=self.request.user
        ).exists()
        is_owner = project.owner == self.request.user

        # Если проект приватный и пользователь не участник - возвращаем пустой список
        if project.is_private and not (is_member or is_owner):
            return Task.objects.none()

        # Для публичных проектов и участников - возвращаем все задачи
        return Task.objects.filter(sprint_id=sprint_id).order_by('position', 'created_at')


class SprintStatsView(APIView):
    """
    GET: /api/projects/sprints/{id}/stats/
    Получить статистику спринта
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        sprint = get_object_or_404(Sprint, id=pk)
        project = sprint.project

        # 🔥 ИСПРАВЛЕНО: Проверяем доступ к проекту
        is_member = ProjectMember.objects.filter(
            project=project,
            user=request.user
        ).exists()
        is_owner = project.owner == request.user

        # Если проект приватный и пользователь не участник - доступ запрещён
        if project.is_private and not (is_member or is_owner):
            return Response(
                {"error": "Нет доступа к проекту"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Для публичных проектов - показываем статистику всем
        tasks = Task.objects.filter(sprint=sprint)

        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='done').count()
        in_progress_tasks = tasks.filter(status__in=['in_progress', 'review']).count()
        todo_tasks = tasks.filter(status='todo').count()
        backlog_tasks = tasks.filter(status='backlog').count()

        # Считаем просроченные задачи
        from django.utils import timezone
        now = timezone.now().date()
        overdue_tasks = tasks.filter(
            due_date__lt=now,
            status__in=['todo', 'in_progress', 'review', 'backlog']
        ).count()

        # Статистика по исполнителям
        assignee_stats = {}
        for task in tasks.filter(assignee__isnull=False):
            assignee_id = task.assignee.id
            if assignee_id not in assignee_stats:
                assignee_stats[assignee_id] = {
                    'user_id': assignee_id,
                    'user_name': task.assignee.get_full_name() or task.assignee.email,
                    'total': 0,
                    'completed': 0
                }
            assignee_stats[assignee_id]['total'] += 1
            if task.status == 'done':
                assignee_stats[assignee_id]['completed'] += 1

        return Response({
            'sprint_id': sprint.id,
            'sprint_title': sprint.title,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'todo_tasks': todo_tasks,
            'backlog_tasks': backlog_tasks,
            'overdue_tasks': overdue_tasks,
            'completion_rate': int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0,
            'assignee_stats': list(assignee_stats.values())
        })