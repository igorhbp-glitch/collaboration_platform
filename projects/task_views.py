# projects/task_views.py - ИСПРАВЛЕННАЯ ВЕРСИЯ (добавлен импорт Q)
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q  # 🔥 ВАЖНО: добавить этот импорт
from django.shortcuts import get_object_or_404
from .models import Task, Project, ProjectMember, Sprint
from .serializers import TaskSerializer, TaskDetailSerializer
from users.models import CustomUser


class TaskViewSet(viewsets.ModelViewSet):
    """
    API для управления задачами проекта
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Возвращает задачи проектов
        """
        # Получаем параметры из query params
        project_id = self.request.query_params.get('project_id')
        sprint_id = self.request.query_params.get('sprint_id')

        print(f"\n🔍 TaskViewSet.get_queryset:")
        print(f"  project_id: {project_id}")
        print(f"  sprint_id: {sprint_id}")
        print(f"  user: {self.request.user.email}")

        # Базовый queryset
        queryset = Task.objects.all()

        if project_id:
            # Проверяем, что проект существует
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Task.objects.none()

            # Для публичных проектов показываем задачи всем
            if project.is_private:
                # Для приватных проектов проверяем membership
                is_member = ProjectMember.objects.filter(
                    project=project,
                    user=self.request.user
                ).exists()
                is_owner = project.owner == self.request.user

                if not (is_member or is_owner):
                    print(f"  ❌ Приватный проект, пользователь не участник")
                    return Task.objects.none()

            # Для публичных проектов - показываем все задачи
            queryset = Task.objects.filter(project_id=project_id)
            print(f"  ✅ найдено задач по проекту: {queryset.count()}")

        else:
            # Без project_id - только проекты пользователя
            user_projects = Project.objects.filter(
                Q(owner=self.request.user) | Q(members__user=self.request.user)  # 🔥 Здесь используется Q
            ).values_list('id', flat=True)
            queryset = Task.objects.filter(project_id__in=user_projects)

        # Фильтрация по спринту
        if sprint_id:
            print(f"  фильтруем по спринту: {sprint_id}")
            try:
                sprint = Sprint.objects.get(id=sprint_id)
                print(f"  спринт найден: {sprint.title}")
                queryset = queryset.filter(sprint_id=sprint_id)
            except Sprint.DoesNotExist:
                print(f"  ❌ спринт {sprint_id} не найден")
                queryset = queryset.none()

        print(f"  ✅ итого задач: {queryset.count()}")
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer

    # projects/task_views.py - замените метод perform_create

    def perform_create(self, serializer):
        """Создание новой задачи с отладкой"""
        print("\n" + "=" * 50)
        print("🔥 СОЗДАНИЕ НОВОЙ ЗАДАЧИ")
        print("=" * 50)

        # Логируем все полученные данные
        print("📦 request.data:", self.request.data)
        print("📦 request.POST:", self.request.POST)
        print("📦 request.FILES:", self.request.FILES)

        project_id = self.request.data.get('project_id') or self.request.data.get('project')
        sprint_id = self.request.data.get('sprint_id')

        print(f"📌 project_id: {project_id}")
        print(f"📌 sprint_id: {sprint_id}")
        print(f"👤 user: {self.request.user.email} (ID: {self.request.user.id})")

        if not project_id:
            print("❌ Нет project_id")
            raise permissions.PermissionDenied("Не указан проект")

        try:
            project = Project.objects.get(id=project_id)
            print(f"✅ Проект найден: {project.title} (ID: {project.id})")
        except Project.DoesNotExist:
            print(f"❌ Проект {project_id} не найден")
            raise permissions.PermissionDenied("Проект не найден")

        # Проверяем права на создание задач
        member = ProjectMember.objects.filter(
            project=project,
            user=self.request.user
        ).first()

        print(f"👥 Member: {member}")
        print(f"👑 is_owner: {project.owner == self.request.user}")

        if not member and project.owner != self.request.user:
            print("❌ Пользователь не участник проекта")
            raise permissions.PermissionDenied(
                "У вас нет прав создавать задачи в этом проекте"
            )

        # Извлекаем assignee_id если есть
        assignee_id = self.request.data.get('assignee_id')
        print(f"👤 assignee_id: {assignee_id}")

        assignee = None
        if assignee_id:
            try:
                assignee = CustomUser.objects.get(id=assignee_id)
                print(f"✅ Найден исполнитель: {assignee.email}")

                # Проверяем, что assignee участник проекта
                is_assignee_member = ProjectMember.objects.filter(
                    project=project,
                    user=assignee
                ).exists()

                if not is_assignee_member and project.owner != assignee:
                    print(f"⚠️ Исполнитель {assignee_id} не участник проекта")
                    assignee = None
            except CustomUser.DoesNotExist:
                print(f"❌ Исполнитель {assignee_id} не найден")
                assignee = None

        # Подготавливаем данные для сохранения
        task_data = {
            'project': project,
            'created_by': self.request.user
        }

        if sprint_id:
            try:
                sprint = Sprint.objects.get(id=sprint_id, project=project)
                task_data['sprint'] = sprint
                print(f"✅ Спринт найден: {sprint.title} (ID: {sprint.id})")
            except Sprint.DoesNotExist:
                print(f"⚠️ Спринт {sprint_id} не найден в проекте {project_id}")
                pass

        if assignee:
            task_data['assignee'] = assignee

        print("💾 Сохраняем задачу с данными:", task_data)

        try:
            serializer.save(**task_data)
            print("✅ Задача успешно создана!")
        except Exception as e:
            print(f"❌ Ошибка при сохранении: {e}")
            import traceback
            traceback.print_exc()
            raise

        print("=" * 50 + "\n")

    def perform_update(self, serializer):
        """Проверка прав при обновлении задачи"""
        task = self.get_object()
        member = ProjectMember.objects.filter(
            project=task.project,
            user=self.request.user
        ).first()

        # Проверяем права (исполнитель или руководитель)
        can_update = (
                task.assignee == self.request.user or
                (member and member.can_manage_tasks)
        )

        if not can_update:
            raise permissions.PermissionDenied(
                "У вас нет прав обновлять эту задачу"
            )

        serializer.save()

    def perform_destroy(self, instance):
        """Проверка прав при удалении задачи"""
        member = ProjectMember.objects.filter(
            project=instance.project,
            user=self.request.user
        ).first()

        if not member or not member.can_manage_tasks:
            raise permissions.PermissionDenied(
                "У вас нет прав удалять задачи в этом проекте"
            )

        instance.delete()

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Назначить задачу пользователю"""
        task = self.get_object()

        # Проверяем права
        member = ProjectMember.objects.filter(
            project=task.project,
            user=request.user
        ).first()

        if not member or not member.can_manage_tasks:
            return Response(
                {"error": "У вас нет прав назначать задачи"},
                status=status.HTTP_403_FORBIDDEN
            )

        user_id = request.data.get('user_id')
        if user_id:
            try:
                user = CustomUser.objects.get(id=user_id)
                # Проверяем, что пользователь участник проекта
                if ProjectMember.objects.filter(
                        project=task.project,
                        user=user
                ).exists():
                    task.assignee = user
                    task.save()

                    serializer = self.get_serializer(task)
                    return Response({
                        "message": "Задача назначена",
                        "task": serializer.data
                    })
                else:
                    return Response(
                        {"error": "Пользователь не участник проекта"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "Пользователь не найден"},
                    status=status.HTTP_404_NOT_FOUND
                )

        return Response(
            {"error": "Укажите user_id"},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Обновить статус задачи"""
        task = self.get_object()
        new_status = request.data.get('status')

        # Проверяем права (исполнитель или руководитель)
        member = ProjectMember.objects.filter(
            project=task.project,
            user=request.user
        ).first()

        can_update = (
                task.assignee == request.user or
                (member and member.can_manage_tasks)
        )

        if not can_update:
            return Response(
                {"error": "У вас нет прав обновлять эту задачу"},
                status=status.HTTP_403_FORBIDDEN
            )

        if new_status in dict(Task.Status.choices):
            task.status = new_status
            task.save()

            serializer = self.get_serializer(task)
            return Response({
                "message": "Статус обновлен",
                "task": serializer.data
            })

        return Response(
            {"error": "Неверный статус"},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        """Получить задачи для канбан-доски"""
        project_id = request.query_params.get('project_id')
        sprint_id = request.query_params.get('sprint_id')

        if not project_id:
            return Response(
                {"error": "Укажите project_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем доступ к проекту
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(
                {"error": "Проект не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Для публичных проектов показываем задачи всем
        if project.is_private:
            # Для приватных проектов проверяем membership
            if not ProjectMember.objects.filter(
                    project_id=project_id,
                    user=request.user
            ).exists() and project.owner != request.user:
                return Response(
                    {"error": "У вас нет доступа к этому проекту"},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Получаем задачи
        tasks = Task.objects.filter(project_id=project_id)

        # Фильтруем по спринту
        if sprint_id:
            tasks = tasks.filter(sprint_id=sprint_id)

        tasks = tasks.select_related('assignee', 'created_by')

        # Группируем задачи по статусам
        kanban_data = {}
        for status_code, status_name in Task.Status.choices:
            status_tasks = tasks.filter(status=status_code).order_by('position')
            serializer = TaskSerializer(status_tasks, many=True)
            kanban_data[status_code] = {
                'name': status_name,
                'tasks': serializer.data
            }

        return Response(kanban_data)