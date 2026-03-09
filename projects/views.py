# projects/views.py - ИСПРАВЛЕННАЯ ВЕРСИЯ (только добавлен метод leave_project)

from rest_framework import generics, permissions, status, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from .models import Project, CollaborationMatch, ProjectMember, Task  # Добавлен Task
from users.models import CustomUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .serializers import ProjectMemberSerializer, ProjectJoinRequestSerializer
from invitations.models import Invitation
import logging
import hashlib
import random

# Настройка логирования
logger = logging.getLogger(__name__)


# ==============================================
# РЕКОМЕНДАЦИИ ПОЛЬЗОВАТЕЛЕЙ
# ==============================================

def simple_user_recommendations(request):
    """
    Простой алгоритм рекомендаций (запасной вариант)
    Используется только если реальный алгоритм недоступен
    """
    logger.info(f"🔍 simple_user_recommendations вызван для пользователя: {request.user.email}")

    try:
        # Все пользователи кроме текущего - ИСКЛЮЧАЕМ АДМИНОВ
        all_users = CustomUser.objects.exclude(
            Q(id=request.user.id) |
            Q(role='admin') |
            Q(role='administrator') |
            Q(username__icontains='admin')
        )

        logger.info(f"📊 Найдено других пользователей: {all_users.count()}")

        if all_users.count() == 0:
            logger.warning("⚠️ Нет других пользователей для рекомендаций")
            return Response({
                'recommendations': [],
                'total_matches': 0,
                'note': 'Нет других пользователей в системе'
            })

        recommendations = []

        for user in all_users:
            # Получаем компетенции через ManyToMany
            competencies = list(user.competencies.values_list('name', flat=True)[:6])
            research_interests = list(user.research_fields.values_list('name', flat=True)[:3])

            # Если компетенций нет, добавляем тестовые
            if not competencies:
                competencies = ['Python', 'Research', 'Data Science', 'Machine Learning']

            # Научные интересы
            if not research_interests:
                research_interests = competencies[:3] if competencies else ['Научные исследования']

            # Общие интересы (случайные из компетенций)
            common_interests = []
            if competencies:
                common_interests = random.sample(competencies, min(2, len(competencies)))

            # Детерминированный score на основе ID (для стабильности)
            hash_str = f"{request.user.id}_{user.id}"
            hash_val = int(hashlib.md5(hash_str.encode()).hexdigest()[:8], 16)
            match_score = 0.65 + (hash_val % 30) / 100  # 65-95%

            # Получаем университет (филиал)
            university = user.branch.name if user.branch else 'Финансовый университет'

            recommendations.append({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'role': user.role or 'user',
                'university': university,
                'bio': user.bio or f"Пользователь {user.username}",
                'match_score': match_score,
                'match_percentage': int(match_score * 100),
                'competencies': competencies[:6],
                'research_interests': research_interests,
                'common_interests': common_interests,
                'avatar': user.avatar.url if user.avatar else None,
                'compatibility_factors': {
                    'competency_match': match_score * 0.7,
                    'interest_similarity': match_score * 0.8,
                    'complementary_skills': 1 - match_score * 0.4
                }
            })

        # Сортируем по score
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)

        logger.info(f"✅ Сформировано {len(recommendations)} рекомендаций (простой алгоритм)")

        return Response({
            'recommendations': recommendations,
            'total_matches': len(recommendations),
            'note': 'Используется простой алгоритм'
        })

    except Exception as e:
        logger.error(f"❌ Ошибка в простом алгоритме: {e}")
        return Response({
            'recommendations': [],
            'total_matches': 0,
            'error': str(e)
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_recommendations(request):
    """
    Рекомендации пользователей для коллабораций
    """
    logger.info(f"🔍 user_recommendations вызван для пользователя: {request.user.email}")

    # 🔥 ИСПРАВЛЕНО: проверка наличия компетенций для ManyToMany поля
    has_competencies = request.user.competencies.exists()

    if not has_competencies:
        logger.info("⚠️ У пользователя нет компетенций")
        return Response({
            'recommendations': [],
            'total_matches': 0,
            'needs_questionnaire': True,
            'message': 'Пожалуйста, заполните анкету для получения рекомендаций'
        })

    # Пытаемся использовать реальный алгоритм из matching.py
    try:
        logger.info("🧠 Запускаем реальный алгоритм из matching.py...")
        from .matching import find_recommendations

        recommendations = find_recommendations(request.user)
        logger.info(f"✅ Алгоритм нашел {len(recommendations)} рекомендаций")

        if len(recommendations) == 0:
            logger.warning("⚠️ Алгоритм не нашел рекомендаций, используем простой алгоритм")
            return simple_user_recommendations(request)

        # Фильтруем администраторов
        filtered_recommendations = []
        for rec in recommendations:
            user_role = rec.get('role', '').lower()
            is_admin = 'admin' in user_role or 'administrator' in user_role

            if not is_admin:
                # Добавляем поле common_interests если его нет
                if 'common_interests' not in rec:
                    rec['common_interests'] = rec.get('common_competencies', [])[:2]
                filtered_recommendations.append(rec)

        logger.info(f"📊 После фильтрации: {len(filtered_recommendations)} рекомендаций")

        return Response({
            'recommendations': filtered_recommendations,
            'total_matches': len(filtered_recommendations)
        })

    except ImportError as e:
        logger.error(f"❌ Ошибка импорта matching.py: {e}")
        return simple_user_recommendations(request)

    except Exception as e:
        logger.error(f"❌ Ошибка в реальном алгоритме: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return simple_user_recommendations(request)


# ==============================================
# РЕКОМЕНДАЦИИ ПРОЕКТОВ
# ==============================================

class ProjectRecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Рекомендуем проекты, подходящие пользователю"""
        try:
            # Получаем компетенции пользователя через ManyToMany
            user_competencies = list(request.user.competencies.values_list('name', flat=True))

            projects = Project.objects.filter(status='recruiting')
            recommended_projects = []

            for project in projects:
                # Простая логика сопоставления компетенций
                required_comp_set = set(project.required_competencies or [])
                user_comp_set = set(user_competencies)

                match_ratio = len(required_comp_set & user_comp_set) / len(
                    required_comp_set) if required_comp_set else 0

                if match_ratio > 0.3:  # Порог совпадения
                    recommended_projects.append({
                        'project_id': project.id,
                        'title': project.title,
                        'description': project.description,
                        'match_score': match_ratio,
                        'required_competencies': project.required_competencies or [],
                        'current_members': project.members.count(),
                        'max_members': project.max_members
                    })

            recommended_projects.sort(key=lambda x: x['match_score'], reverse=True)

            return Response({
                'recommended_projects': recommended_projects
            })

        except Exception as e:
            logger.error(f"Ошибка в рекомендациях проектов: {e}")
            return Response({
                'recommended_projects': [],
                'error': str(e)
            })


# ==============================================
# ПРИГЛАШЕНИЯ
# ==============================================

class SendInvitationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Отправка приглашения в проект другому пользователю
        """
        try:
            data = request.data

            # Валидация обязательных полей
            required_fields = ['recipient_id', 'message']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'Отсутствует обязательное поле: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Проверяем получателя
            try:
                recipient = CustomUser.objects.get(id=data['recipient_id'])
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'Пользователь-получатель не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Проверяем что пользователь не приглашает сам себя
            if recipient.id == request.user.id:
                return Response(
                    {'error': 'Нельзя отправить приглашение самому себе'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Проверяем что пользователь активен
            if not recipient.is_active:
                return Response(
                    {'error': 'Пользователь-получатель неактивен'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Проверяем что получатель не администратор
            if recipient.role in ['admin', 'administrator'] or 'admin' in recipient.username.lower():
                return Response(
                    {'error': 'Нельзя отправлять приглашения администраторам'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Создаем объект приглашения
            invitation_data = {
                'sender': {
                    'id': request.user.id,
                    'email': request.user.email,
                    'full_name': request.user.get_full_name()
                },
                'recipient': {
                    'id': recipient.id,
                    'email': recipient.email,
                    'full_name': recipient.get_full_name()
                },
                'project_id': data.get('project_id'),
                'project_name': data.get('project_name', 'Совместный проект'),
                'invitation_type': data.get('invitation_type', 'collaboration'),
                'message': data['message'],
                'roles': data.get('roles', ['Участник']),
                'status': 'pending'
            }

            logger.info(f"Новое приглашение: {request.user.email} -> {recipient.email}")

            return Response({
                'success': True,
                'message': 'Приглашение успешно отправлено',
                'invitation': invitation_data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Ошибка при отправке приглашения: {str(e)}")
            return Response(
                {'error': f'Внутренняя ошибка сервера: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserInvitationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Получение приглашений пользователя
        """
        user = request.user

        # Временные демо данные
        demo_invitations = {
            'received': [
                {
                    'id': 101,
                    'sender': {
                        'id': 5,
                        'email': 'colleague@university.ru',
                        'full_name': 'Коллега Иванов'
                    },
                    'project_name': 'Совместное исследование по машинному обучению',
                    'message': 'Здравствуйте! Ваши работы в области AI очень интересны...',
                    'status': 'pending',
                    'created_at': '2024-01-14T15:30:00Z'
                }
            ],
            'sent': [
                {
                    'id': 102,
                    'recipient': {
                        'id': 2,
                        'email': 'anna.scientist@university.ru',
                        'full_name': 'Анна Михайлова'
                    },
                    'project_name': 'Исследование AI в образовании',
                    'message': 'Здравствуйте, Анна! Приглашаю к сотрудничеству...',
                    'status': 'pending',
                    'created_at': '2024-01-15T09:15:00Z'
                }
            ]
        }

        return Response({
            'received_invitations': demo_invitations['received'],
            'sent_invitations': demo_invitations['sent'],
            'total_received': len(demo_invitations['received']),
            'total_sent': len(demo_invitations['sent']),
            'note': 'Временные демо данные'
        })


# ==============================================
# ТЕСТОВЫЕ ENDPOINTЫ
# ==============================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def test_recommendations(request):
    """
    Тестовый endpoint для отладки - возвращает реальных пользователей из БД
    """
    try:
        logger.info(f"🔍 test_recommendations вызван для пользователя: {request.user.email}")

        # Берем всех пользователей кроме текущего и админов
        users = CustomUser.objects.exclude(
            Q(id=request.user.id) |
            Q(role='admin') |
            Q(role='administrator') |
            Q(username__icontains='admin')
        )[:10]  # Ограничим 10 для теста

        logger.info(f"📊 Найдено пользователей для теста: {users.count()}")

        recommendations = []
        for user in users:
            # Формируем данные в формате, который ожидает фронтенд
            first_name = user.first_name
            last_name = user.last_name

            if not first_name:
                first_name = user.email.split('@')[0].capitalize()

            recommendations.append({
                'id': user.id,
                'email': user.email,
                'first_name': first_name,
                'last_name': last_name or '',
                'full_name': f"{first_name} {last_name or ''}".strip(),
                'role': user.role or 'user',
                'university': user.branch.name if user.branch else 'Финансовый университет',
                'bio': user.bio or f"Пользователь {user.username}",
                'match_score': 0.75,
                'match_percentage': 75,
                'competencies': list(user.competencies.values_list('name', flat=True)[:4]) or ['Python',
                                                                                               'Исследования'],
                'research_interests': list(user.research_fields.values_list('name', flat=True)[:3]) or [
                    'Искусственный интеллект'],
                'common_interests': ['Python', 'Анализ данных'],
                'compatibility_factors': {
                    'competency_match': 0.7,
                    'interest_similarity': 0.8,
                    'complementary_skills': 0.6
                }
            })

        return Response({
            'recommendations': recommendations,
            'total_matches': len(recommendations),
            'note': 'Тестовые данные на основе реальных пользователей'
        })

    except Exception as e:
        logger.error(f"Ошибка в test_recommendations: {e}")
        # Возвращаем стандартные тестовые данные
        return Response({
            'recommendations': [
                {
                    'id': 101,
                    'email': 'data_scientist@spbu.ru',
                    'first_name': 'Екатерина',
                    'last_name': 'Иванова',
                    'full_name': 'Екатерина Иванова',
                    'role': 'teacher',
                    'university': 'СПбГУ',
                    'bio': 'Data scientist',
                    'match_score': 0.87,
                    'match_percentage': 87,
                    'competencies': ['Big Data', 'Python', 'SQL'],
                    'research_interests': ['Большие данные', 'Аналитика'],
                    'common_interests': ['Python']
                }
            ],
            'total_matches': 1,
            'note': 'Тестовые данные (заглушка)'
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def system_status(request):
    """
    Проверка статуса системы и данных
    """
    # Все пользователи кроме администраторов
    total_users = CustomUser.objects.exclude(
        Q(role='admin') | Q(role='administrator') | Q(username__icontains='admin')
    ).count()

    active_users = CustomUser.objects.filter(
        is_active=True
    ).exclude(
        Q(role='admin') | Q(role='administrator') | Q(username__icontains='admin')
    ).count()

    stats = {
        'users': {
            'total': total_users,
            'active': active_users,
        },
        'current_user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role,
        }
    }

    # Проверяем наличие других пользователей для рекомендаций
    other_users = CustomUser.objects.exclude(
        Q(id=request.user.id) | Q(role='admin') | Q(role='administrator') | Q(username__icontains='admin')
    ).count()
    stats['recommendation_available'] = other_users > 0

    return Response({
        'status': 'ok',
        'system': 'Collaboration Platform',
        'version': '1.0',
        'stats': stats,
        'endpoints': {
            'user_recommendations': '/api/projects/recommendations/users/',
            'test_recommendations': '/api/projects/test-recommendations/',
            'project_recommendations': '/api/projects/recommendations/projects/',
            'invitations': '/api/projects/invitations/my/',
            'system_status': '/api/projects/system-status/',
        }
    })


# ==============================================
# API для УПРАВЛЕНИЯ ПРОЕКТАМИ
# ==============================================

from rest_framework import serializers

# Сериализаторы
try:
    from .serializers import (
        ProjectSerializer, ProjectDetailSerializer,
        CreateProjectSerializer, ProjectMemberSerializer,
        ProjectJoinRequestSerializer  # ← ДОБАВИЛ
    )
except ImportError:
    # Заглушки если serializers.py не создан
    class ProjectMemberSerializer(serializers.ModelSerializer):
        class Meta:
            model = ProjectMember
            fields = '__all__'


    class ProjectSerializer(serializers.ModelSerializer):
        class Meta:
            model = Project
            fields = '__all__'


    class CreateProjectSerializer(serializers.ModelSerializer):
        class Meta:
            model = Project
            fields = '__all__'


    class ProjectDetailSerializer(serializers.ModelSerializer):
        class Meta:
            model = Project
            fields = '__all__'


    class ProjectJoinRequestSerializer(serializers.Serializer):
        pass


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления проектами
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'scientific_field', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'deadline']
    ordering = ['-created_at']

    # ==============================================
    # 🔧 ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ (ДОЛЖНЫ БЫТЬ ПЕРВЫМИ)
    # ==============================================

    def _can_manage_members(self, project, user):
        """Проверка прав на управление участниками"""
        if project.owner == user:
            return True

        try:
            member = ProjectMember.objects.get(
                project=project,
                user=user,
                status='approved'
            )
            return member.role in ['product_owner', 'scrum_master'] or member.can_invite_members
        except ProjectMember.DoesNotExist:
            return False

    def _can_manage_roles(self, project, user):
        """Проверка прав на изменение ролей"""
        if project.owner == user:
            return True

        try:
            member = ProjectMember.objects.get(
                project=project,
                user=user,
                status='approved'
            )
            return member.role in ['product_owner', 'scrum_master']
        except ProjectMember.DoesNotExist:
            return False

    def get_queryset(self):
        """
        Возвращает проекты для списка
        """
        user = self.request.user
        logger.info(f"🔍 Запрос проектов от пользователя: {user.email}")

        # Для списка проектов - показываем только доступные
        if user.is_staff or user.role in ['admin', 'administrator']:
            return Project.objects.all().order_by('-created_at')

        user_projects = Project.objects.filter(
            Q(owner=user) | Q(members__user=user)
        )
        public_projects = Project.objects.filter(
            is_private=False,
            status__in=['recruiting', 'active']
        )

        return (user_projects | public_projects).distinct().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateProjectSerializer
        elif self.action == 'retrieve':
            return ProjectDetailSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return ProjectSerializer
        return ProjectSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def retrieve(self, request, *args, **kwargs):
        """Получение конкретного проекта - ВОЗВРАЩАЕМ ВСЕ ДАННЫЕ"""
        project = self.get_object()

        # Проверяем доступ
        is_member = ProjectMember.objects.filter(
            project=project,
            user=request.user
        ).exists()
        is_owner = project.owner == request.user

        # Если проект приватный и пользователь не участник - доступ запрещён
        if project.is_private and not (is_member or is_owner):
            return Response(
                {"error": "Этот проект является приватным"},
                status=status.HTTP_403_FORBIDDEN
            )

        # 🔥 ВАЖНО: Для публичных проектов возвращаем все данные без фильтрации
        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Завершение проекта"""
        project = self.get_object()

        if project.owner != request.user:
            return Response(
                {'error': 'Только владелец может завершить проект'},
                status=403
            )

        if project.status == 'completed':
            return Response(
                {'error': 'Проект уже завершён'},
                status=400
            )

        if project.current_sprint and project.current_sprint.status == 'active':
            project.current_sprint.status = 'completed'
            project.current_sprint.save()

        Task.objects.filter(project=project).update(status='done')
        project.status = 'completed'
        project.save()

        return Response({
            'status': 'проект успешно завершён',
            'project_id': project.id
        })

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Проекты пользователя"""
        user = request.user
        projects = Project.objects.filter(
            Q(owner=user) | Q(members__user=user)
        ).distinct().order_by('-created_at')
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def owned(self, request):
        """Проекты, где пользователь владелец"""
        user = request.user
        projects = Project.objects.filter(owner=user).order_by('-created_at')
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    # ==============================================
    # 🔥 НОВЫЙ МЕТОД ДЛЯ ВЫХОДА ИЗ ПРОЕКТА
    # ==============================================

    @action(detail=True, methods=['post'], url_path='leave')
    def leave_project(self, request, pk=None):
        """
        POST /api/projects/{project_id}/leave/
        Текущий пользователь покидает проект
        """
        project = self.get_object()  # получаем проект по pk из URL

        # Проверяем, что пользователь вообще участник
        try:
            member = ProjectMember.objects.get(
                project=project,
                user=request.user
            )
        except ProjectMember.DoesNotExist:
            return Response(
                {"error": "Вы не являетесь участником этого проекта"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Нельзя покинуть проект, если ты владелец
        if project.owner == request.user:
            return Response(
                {"error": "Владелец не может покинуть проект. Передайте права другому участнику или удалите проект."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Удаляем членство
        member.delete()

        logger.info(f"👋 Участник {request.user.email} покинул проект '{project.title}'")

        return Response({
            "success": True,
            "message": "Вы успешно покинули проект"
        })

    # ==============================================
    # 🔥 УПРАВЛЕНИЕ УЧАСТНИКАМИ И ЗАЯВКАМИ
    # ==============================================

    @action(detail=False, methods=['post'], url_path='(?P<project_id>[^/.]+)/request-join')
    def request_join(self, request, project_id=None):
        """Подача заявки на вступление в проект"""
        project = get_object_or_404(Project, id=project_id)

        # Проверка существующего членства
        existing = ProjectMember.objects.filter(project=project, user=request.user).first()
        if existing:
            if existing.status == 'approved':
                return Response(
                    {'error': 'Вы уже являетесь участником проекта'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing.status == 'pending':
                return Response(
                    {'error': 'У вас уже есть ожидающая заявка'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = ProjectJoinRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member = ProjectMember.objects.create(
            project=project,
            user=request.user,
            role=serializer.validated_data.get('role', 'researcher'),
            status='pending',
            message=serializer.validated_data.get('message', '')
        )

        return Response(
            ProjectMemberSerializer(member, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'], url_path='(?P<project_id>[^/.]+)/members-with-owner')
    def members_with_owner(self, request, project_id=None):
        """Получить владельца + всех утверждённых участников для вкладки 'Участники'"""
        project = get_object_or_404(Project, id=project_id)

        if not self._can_manage_members(project, request.user):
            return Response(
                {'error': 'У вас нет прав для просмотра участников'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Получаем всех утверждённых участников (кроме владельца)
        approved_members = ProjectMember.objects.filter(
            project=project,
            status='approved'
        ).exclude(
            user=project.owner
        ).select_related('user')

        # Сериализуем
        serializer = ProjectMemberSerializer(approved_members, many=True, context={'request': request})

        # Возвращаем владельца отдельно и участников
        return Response({
            'owner': {
                'id': project.owner.id,
                'first_name': project.owner.first_name,
                'last_name': project.owner.last_name,
                'email': project.owner.email,
                'avatar': project.owner.avatar.url if project.owner.avatar else None,
                'role': 'owner',
                'role_display': 'Создатель проекта'
            },
            'members': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='(?P<project_id>[^/.]+)/membership-requests')
    def membership_requests(self, request, project_id=None):
        """Получить все заявки (для владельца/менеджеров)"""
        project = get_object_or_404(Project, id=project_id)

        if not self._can_manage_members(project, request.user):
            return Response(
                {'error': 'У вас нет прав для просмотра заявок'},
                status=status.HTTP_403_FORBIDDEN
            )

        members = ProjectMember.objects.filter(
            project=project,
            status__in=['pending', 'rejected']
        ).exclude(  # ← исключаем владельца
            user=project.owner
        ).select_related('user')

        serializer = ProjectMemberSerializer(members, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='(?P<project_id>[^/.]+)/members/(?P<member_id>[^/.]+)/approve')
    def approve_member(self, request, project_id=None, member_id=None):
        """Одобрить заявку участника"""
        project = get_object_or_404(Project, id=project_id)
        member = get_object_or_404(ProjectMember, id=member_id, project=project)

        if not self._can_manage_members(project, request.user):
            return Response(
                {'error': 'У вас нет прав для одобрения заявок'},
                status=status.HTTP_403_FORBIDDEN
            )

        member.status = 'approved'
        member.joined_at = timezone.now()
        member.reviewed_by = request.user
        member.reviewed_at = timezone.now()
        member.save()

        return Response(
            ProjectMemberSerializer(member, context={'request': request}).data
        )

    @action(detail=False, methods=['post'], url_path='(?P<project_id>[^/.]+)/members/(?P<member_id>[^/.]+)/reject')
    def reject_member(self, request, project_id=None, member_id=None):
        """Отклонить заявку участника"""
        project = get_object_or_404(Project, id=project_id)
        member = get_object_or_404(ProjectMember, id=member_id, project=project)

        if not self._can_manage_members(project, request.user):
            return Response(
                {'error': 'У вас нет прав для отклонения заявок'},
                status=status.HTTP_403_FORBIDDEN
            )

        reason = request.data.get('reason', '')
        member.status = 'rejected'
        member.rejection_reason = reason
        member.reviewed_by = request.user
        member.reviewed_at = timezone.now()
        member.save()

        return Response(
            ProjectMemberSerializer(member, context={'request': request}).data
        )

    @action(detail=False, methods=['post'], url_path='(?P<project_id>[^/.]+)/members/(?P<member_id>[^/.]+)/cancel')
    def cancel_request(self, request, project_id=None, member_id=None):
        """Отозвать свою заявку"""
        member = get_object_or_404(ProjectMember, id=member_id)

        if member.user != request.user:
            return Response(
                {'error': 'Вы можете отозвать только свою заявку'},
                status=status.HTTP_403_FORBIDDEN
            )

        if member.status != 'pending':
            return Response(
                {'error': 'Можно отозвать только ожидающую заявку'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member.status = 'cancelled'
        member.save()

        return Response({'status': 'cancelled'})

    @action(detail=False, methods=['post'], url_path='(?P<project_id>[^/.]+)/members/(?P<member_id>[^/.]+)/update-role')
    def update_member_role(self, request, project_id=None, member_id=None):
        """Изменить роль участника"""
        project = get_object_or_404(Project, id=project_id)
        member = get_object_or_404(ProjectMember, id=member_id, project=project)

        if not self._can_manage_roles(project, request.user):
            return Response(
                {'error': 'У вас нет прав для изменения ролей'},
                status=status.HTTP_403_FORBIDDEN
            )

        new_role = request.data.get('role')
        if new_role not in dict(ProjectMember.Role.choices):
            return Response(
                {'error': 'Некорректная роль'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member.role = new_role
        member.save()

        return Response(
            ProjectMemberSerializer(member, context={'request': request}).data
        )

    @action(detail=False, methods=['get'], url_path='(?P<project_id>[^/.]+)/all-members')
    def all_members(self, request, project_id=None):
        """Получить ВСЕХ членов проекта (включая pending) — доступно всем участникам проекта"""
        project = get_object_or_404(Project, id=project_id)

        # 🔥 ПРОВЕРЯЕМ, ЧТО ПОЛЬЗОВАТЕЛЬ ВООБЩЕ ИМЕЕТ ДОСТУП К ПРОЕКТУ
        is_member = ProjectMember.objects.filter(
            project=project,
            user=request.user,
            status='approved'
        ).exists()
        is_owner = project.owner == request.user

        # Если пользователь не участник и не владелец - доступ запрещён
        if not (is_member or is_owner):
            return Response(
                {'error': 'У вас нет доступа к этому проекту'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 🔥 ВОЗВРАЩАЕМ ВСЕХ ЧЛЕНОВ ПРОЕКТА (включая владельца, но исключая pending? решайте сами)
        members = ProjectMember.objects.filter(
            project=project
        ).exclude(
            user=project.owner  # исключаем владельца, он будет отдельно
        ).select_related('user')

        serializer = ProjectMemberSerializer(members, many=True, context={'request': request})
        return Response(serializer.data)


# ==============================================
# API ДЛЯ ПОЛУЧЕНИЯ УЧАСТНИКОВ ПРОЕКТА
# ==============================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_members(request, project_id):
    """Получить участников проекта"""
    try:
        project = Project.objects.get(id=project_id)

        # Проверяем доступ к проекту
        is_member = ProjectMember.objects.filter(
            project=project,
            user=request.user
        ).exists()
        is_owner = project.owner == request.user

        # Если проект приватный и пользователь не участник - доступ запрещён
        if project.is_private and not (is_member or is_owner):
            return Response(
                {"error": "Доступ запрещен"},
                status=status.HTTP_403_FORBIDDEN
            )

        members = ProjectMember.objects.filter(project=project).select_related('user')

        serializer = ProjectMemberSerializer(members, many=True)
        return Response(serializer.data)

    except Project.DoesNotExist:
        return Response({'error': 'Проект не найден'}, status=404)