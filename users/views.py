# users/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import (
    CustomUser, Branch, StudyProgram, Department,
    ResearchField, Methodology, Competency,
    CollaborationType, PublicationType
)
from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    UserLoginSerializer, UserUpdateSerializer, PublicUserSerializer,
    BranchSerializer, StudyProgramSerializer, DepartmentSerializer,
    ResearchFieldSerializer, MethodologySerializer, CompetencySerializer,
    CollaborationTypeSerializer, PublicationTypeSerializer
)
import logging
import json
import requests  # 🔥 ДЛЯ ЗАПРОСОВ К VK

logger = logging.getLogger(__name__)
User = get_user_model()


# ============================================
# АУТЕНТИФИКАЦИЯ
# ============================================

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        logger.info("=== LOGIN REQUEST ===")

        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

            # Генерируем токены
            refresh = RefreshToken.for_user(user)

            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = UserUpdateSerializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(UserSerializer(instance).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# 🔥 НОВЫЙ ЭНДПОИНТ ДЛЯ VK EXCHANGE
# ============================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def vk_exchange(request):
    """
    Обмен кода авторизации VK на токены
    """
    # 🔥 ЛОГИРУЕМ ВСЁ, ЧТО ПРИШЛО
    print("\n" + "=" * 80)
    print("🔥 VK_EXCHANGE ВЫЗВАН")
    print("=" * 80)
    print(f"📦 Метод запроса: {request.method}")
    print(f"📦 Content-Type: {request.content_type}")
    print(f"📦 Данные запроса (request.data): {request.data}")
    print(f"📦 Тело запроса (request.body): {request.body}")
    print("=" * 80 + "\n")

    code = request.data.get('code')
    code_verifier = request.data.get('code_verifier')
    device_id = request.data.get('device_id', '')

    print(f"🔍 code: {code[:20] if code else 'None'}...")
    print(f"🔍 code_verifier: {code_verifier[:20] if code_verifier else 'None'}...")
    print(f"🔍 device_id: {device_id}")

    if not code:
        print("❌ Ошибка: code не предоставлен")
        return Response(
            {'error': 'Код авторизации не предоставлен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not code_verifier:
        print("❌ Ошибка: code_verifier не предоставлен")
        return Response(
            {'error': 'code_verifier не предоставлен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # 🔥 Получаем access_token от VK
        token_url = 'https://oauth.vk.com/access_token'
        token_data = {
            'client_id': '54454413',
            'client_secret': 'uw0BJzPlVJXWjp7rHlhd',
            'redirect_uri': 'http://localhost:3000',
            'code': code,
            'code_verifier': code_verifier,
        }

        print(f"🔄 Отправка запроса к VK:")
        print(f"   URL: {token_url}")
        print(
            f"   Данные: client_id={token_data['client_id']}, code={code[:20]}..., code_verifier={code_verifier[:20]}...")

        token_response = requests.post(token_url, data=token_data)

        print(f"📥 Ответ от VK:")
        print(f"   Статус: {token_response.status_code}")
        print(f"   Тело: {token_response.text[:200]}")

        token_data = token_response.json()

        if 'error' in token_data:
            error_msg = token_data.get('error_description') or token_data.get('error')
            print(f"❌ Ошибка VK: {error_msg}")
            return Response(
                {'error': f"VK API error: {error_msg}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        access_token = token_data.get('access_token')
        user_email = token_data.get('email')
        vk_user_id = token_data.get('user_id')

        print(f"✅ Получен access_token: {access_token[:20] if access_token else 'None'}...")
        print(f"✅ Получен email: {user_email}")
        print(f"✅ Получен user_id: {vk_user_id}")

        if not access_token:
            print("❌ Не получен access_token от VK")
            return Response(
                {'error': 'Не получен access_token от VK'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔥 Получаем данные пользователя из VK API
        user_info_url = 'https://api.vk.com/method/users.get'
        user_info_params = {
            'access_token': access_token,
            'v': '5.199',
            'fields': 'first_name,last_name,photo_200'
        }

        print(f"🔄 Запрос данных пользователя из VK: {user_info_url}")

        user_info_response = requests.get(user_info_url, params=user_info_params)
        user_info = user_info_response.json()

        print(f"📥 Ответ от VK users.get: {user_info}")

        if 'error' in user_info:
            print(f"❌ Ошибка получения данных пользователя: {user_info['error']}")
            return Response(
                {'error': 'Не удалось получить данные пользователя'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vk_profile = user_info['response'][0]
        print(f"✅ Профиль VK: first_name={vk_profile.get('first_name')}, last_name={vk_profile.get('last_name')}")

        # 🔥 Ищем или создаем пользователя
        email = user_email or f"vk_{vk_user_id}@temp.vk.user"
        print(f"📧 Используем email: {email}")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': f"vk_{vk_user_id}",
                'first_name': vk_profile.get('first_name', ''),
                'last_name': vk_profile.get('last_name', ''),
                'is_active': True
            }
        )

        print(f"👤 Пользователь {'создан' if created else 'найден'}: ID={user.id}, email={user.email}")

        # Если пользователь уже существовал, обновляем его данные
        if not created:
            user.first_name = vk_profile.get('first_name', user.first_name)
            user.last_name = vk_profile.get('last_name', user.last_name)
            user.save()
            print(f"✅ Данные пользователя обновлены")

        # 🔥 Создаем JWT токены
        refresh = RefreshToken.for_user(user)

        print(f"✅ JWT токены созданы")
        print("=" * 80 + "\n")

        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return Response(
            {'error': 'Ошибка соединения с VK'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': 'Внутренняя ошибка сервера'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================
# ЭНДПОИНТ ДЛЯ ПОЛНОГО ОБНОВЛЕНИЯ ПРОФИЛЯ
# ============================================

@api_view(['POST', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_full_profile(request):
    """
    Единый эндпоинт для полного обновления профиля пользователя
    Принимает все данные анкеты одним запросом
    """
    try:
        user = request.user
        data = request.data

        logger.info("=" * 80)
        logger.info(f"📝 ПОЛНОЕ ОБНОВЛЕНИЕ ПРОФИЛЯ для {user.email} (ID: {user.id})")
        logger.info(f"📦 ПОЛУЧЕННЫЕ ДАННЫЕ: {json.dumps(data, ensure_ascii=False, indent=2)}")
        logger.info("=" * 80)

        # ============================================
        # 1. ОБНОВЛЕНИЕ ПРОСТЫХ ПОЛЕЙ
        # ============================================

        # Основная информация
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'middle_name' in data:
            user.middle_name = data['middle_name']
        if 'bio' in data:
            user.bio = data['bio']
        if 'phone' in data:
            user.phone = data['phone']

        # Образование и должность
        if 'position' in data:
            user.position = data['position']
        if 'academic_degree' in data:
            user.academic_degree = data['academic_degree']

        # Опыт и публикации
        if 'publications_count' in data:
            try:
                user.publications_count = int(data['publications_count'])
            except (ValueError, TypeError):
                user.publications_count = 0

        if 'projects_experience' in data:
            user.projects_experience = data['projects_experience']

        # ============================================
        # 2. ОБНОВЛЕНИЕ ВНЕШНИХ КЛЮЧЕЙ (ForeignKey)
        # ============================================

        # Филиал
        if 'branch' in data and data['branch']:
            try:
                branch = Branch.objects.filter(name=data['branch']).first()
                if branch:
                    user.branch = branch
                    logger.info(f"✅ Установлен филиал: {branch.name}")
            except Exception as e:
                logger.warning(f"⚠️ Ошибка при поиске филиала: {e}")

        # Направление подготовки
        if 'study_program' in data and data['study_program'] and 'study_program_level' in data and data[
            'study_program_level']:
            try:
                program = StudyProgram.objects.filter(
                    name=data['study_program'],
                    level=data['study_program_level']
                ).first()

                if program:
                    user.study_program = program
                    logger.info(f"✅ Установлена программа: {program.name} ({program.level})")
                else:
                    logger.warning(
                        f"⚠️ Программа '{data['study_program']}' с уровнем '{data['study_program_level']}' не найдена")
            except Exception as e:
                logger.warning(f"⚠️ Ошибка при поиске программы: {e}")

        # Кафедра
        if 'department' in data and data['department']:
            try:
                department = Department.objects.filter(name=data['department']).first()
                if department:
                    user.department = department
                    logger.info(f"✅ Установлена кафедра: {department.name}")
            except Exception as e:
                logger.warning(f"⚠️ Ошибка при поиске кафедры: {e}")

        # ============================================
        # 3. ОБНОВЛЕНИЕ MANY-TO-MANY ПОЛЕЙ
        # ============================================

        # Научные интересы
        if 'research_fields' in data and isinstance(data['research_fields'], list):
            research_objects = []
            for field_name in data['research_fields']:
                field = ResearchField.objects.filter(name=field_name).first()
                if field:
                    research_objects.append(field)

            if research_objects:
                user.research_fields.set(research_objects)
                logger.info(f"✅ Установлено {len(research_objects)} научных интересов")

        # Методологии
        if 'methodologies' in data and isinstance(data['methodologies'], list):
            method_objects = []
            for method_name in data['methodologies']:
                method = Methodology.objects.filter(name=method_name).first()
                if method:
                    method_objects.append(method)

            if method_objects:
                user.methodologies.set(method_objects)
                logger.info(f"✅ Установлено {len(method_objects)} методологий")

        # Компетенции
        if 'competencies' in data and isinstance(data['competencies'], list):
            comp_objects = []
            for comp_name in data['competencies']:
                comp = Competency.objects.filter(name=comp_name).first()
                if comp:
                    comp_objects.append(comp)

            if comp_objects:
                user.competencies.set(comp_objects)
                logger.info(f"✅ Установлено {len(comp_objects)} компетенций")

        # Типы публикаций
        if 'publication_types' in data and isinstance(data['publication_types'], list):
            pub_objects = []
            for pub_name in data['publication_types']:
                pub = PublicationType.objects.filter(name=pub_name).first()
                if pub:
                    pub_objects.append(pub)

            if pub_objects:
                user.publication_types.set(pub_objects)
                logger.info(f"✅ Установлено {len(pub_objects)} типов публикаций")

        # Типы сотрудничества
        if 'collaboration_types' in data and isinstance(data['collaboration_types'], list):
            collab_objects = []
            for collab_name in data['collaboration_types']:
                collab = CollaborationType.objects.filter(name=collab_name).first()
                if collab:
                    collab_objects.append(collab)

            if collab_objects:
                user.collaboration_types.set(collab_objects)
                logger.info(f"✅ Установлено {len(collab_objects)} типов сотрудничества")

        # ============================================
        # 4. СОХРАНЕНИЕ ПОЛЬЗОВАТЕЛЯ
        # ============================================

        user.save()
        logger.info(f"✅ Профиль пользователя {user.email} успешно сохранен")

        # Очищаем кэш рекомендаций
        try:
            from projects.matching import clear_recommendations_cache
            clear_recommendations_cache(user.id)
            logger.info("🧹 Кэш рекомендаций очищен")
        except ImportError:
            logger.warning("⚠️ Не удалось импортировать clear_recommendations_cache")

        serializer = UserSerializer(user)
        return Response(serializer.data)

    except Exception as e:
        logger.error(f"❌ КРИТИЧЕСКАЯ ОШИБКА при обновлении профиля: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================
# 🔥 МЕТОДЫ ДЛЯ АВАТАРОК
# ============================================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request):
    """
    Загрузка аватарки пользователя
    """
    try:
        user = request.user
        file = request.FILES.get('avatar')

        if not file:
            return Response(
                {'error': 'Файл не предоставлен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка размера файла (максимум 5MB)
        if file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Размер файла не должен превышать 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка типа файла
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            return Response(
                {'error': 'Допустимые форматы: JPEG, PNG, GIF, WEBP'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Удаляем старую аватарку если есть
        if user.avatar:
            user.avatar.delete(save=False)

        # Сохраняем новую
        user.avatar = file
        user.save()

        logger.info(f"✅ Аватарка загружена для пользователя {user.email}")

        serializer = UserSerializer(user)
        return Response(serializer.data)

    except Exception as e:
        logger.error(f"❌ Ошибка загрузки аватарки: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_avatar(request):
    """
    Удаление аватарки пользователя
    """
    try:
        user = request.user

        if user.avatar:
            # Удаляем файл
            user.avatar.delete(save=False)
            user.avatar = None
            user.save()
            logger.info(f"✅ Аватарка удалена для пользователя {user.email}")
        else:
            logger.info(f"ℹ️ У пользователя {user.email} нет аватарки")

        serializer = UserSerializer(user)
        return Response(serializer.data)

    except Exception as e:
        logger.error(f"❌ Ошибка удаления аватарки: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================
# 🔥 ОБНОВЛЁННЫЙ ПОИСК ПОЛЬЗОВАТЕЛЕЙ
# ============================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def find_user_by_email(request):
    """
    Найти пользователя по email
    """
    search_query = request.query_params.get('email')

    if not search_query:
        return Response(
            {'error': 'Параметр email обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email__iexact=search_query)

        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'middle_name': user.middle_name,
            'role': user.role,
            'is_active': user.is_active
        })

    except User.DoesNotExist:
        return Response(
            {'error': f'Пользователь с email "{search_query}" не найден'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_users(request):
    """
    Поиск пользователей для приглашений
    GET /api/users/search/?q=текст&exclude_self=true
    """
    search_query = request.query_params.get('q', '')
    exclude_self = request.query_params.get('exclude_self', 'true') == 'true'

    if not search_query or len(search_query) < 2:
        return Response([])

    # 🔥 РАСШИРЕННЫЙ ПОИСК по имени, фамилии, email и филиалу
    users = CustomUser.objects.filter(
        Q(first_name__icontains=search_query) |
        Q(last_name__icontains=search_query) |
        Q(email__icontains=search_query) |
        Q(branch__name__icontains=search_query)
    ).filter(is_active=True)

    # Исключаем админов и модераторов
    users = users.exclude(role__in=['admin', 'moderator'])

    # Исключаем текущего пользователя
    if exclude_self:
        users = users.exclude(id=request.user.id)

    # Ограничиваем результат
    users = users.distinct()[:20]

    # 🔥 ВАЖНО: передаём request в контекст для построения URL аватарок
    serializer = PublicUserSerializer(
        users,
        many=True,
        context={'request': request}  # ← добавляем контекст
    )

    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_users(request):
    """
    Получить список всех активных пользователей (кроме текущего)
    """
    limit = request.query_params.get('limit', 50)
    try:
        limit = int(limit)
        if limit > 100:
            limit = 100
    except ValueError:
        limit = 50

    users = User.objects.filter(is_active=True).exclude(id=request.user.id)[:limit]
    serializer = PublicUserSerializer(users, many=True, context={'request': request})

    return Response({
        'count': users.count(),
        'results': serializer.data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Получение текущего пользователя"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_by_id(request, user_id):
    """
    Получить пользователя по ID
    """
    try:
        user = CustomUser.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'Пользователь не найден'},
            status=status.HTTP_404_NOT_FOUND
        )


# ============================================
# API ДЛЯ СПРАВОЧНИКОВ
# ============================================

class BranchListView(generics.ListAPIView):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.AllowAny]


class StudyProgramListView(generics.ListAPIView):
    serializer_class = StudyProgramSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = StudyProgram.objects.all()
        level = self.request.query_params.get('level')
        branch_id = self.request.query_params.get('branch_id')

        if level:
            queryset = queryset.filter(level=level)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        return queryset


class DepartmentListView(generics.ListAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Department.objects.all()
        branch_id = self.request.query_params.get('branch_id')

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        return queryset


class ResearchFieldListView(generics.ListAPIView):
    queryset = ResearchField.objects.all()
    serializer_class = ResearchFieldSerializer
    permission_classes = [permissions.AllowAny]


class MethodologyListView(generics.ListAPIView):
    queryset = Methodology.objects.all()
    serializer_class = MethodologySerializer
    permission_classes = [permissions.AllowAny]


class CompetencyListView(generics.ListAPIView):
    serializer_class = CompetencySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Competency.objects.all()
        category = self.request.query_params.get('category')

        if category:
            queryset = queryset.filter(category=category)

        return queryset


class CollaborationTypeListView(generics.ListAPIView):
    queryset = CollaborationType.objects.all()
    serializer_class = CollaborationTypeSerializer
    permission_classes = [permissions.AllowAny]


class PublicationTypeListView(generics.ListAPIView):
    queryset = PublicationType.objects.all()
    serializer_class = PublicationTypeSerializer
    permission_classes = [permissions.AllowAny]


# ============================================
# ПОЛУЧЕНИЕ ВСЕХ ДАННЫХ ДЛЯ АНКЕТЫ
# ============================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_questionnaire_data(request):
    """
    Получение всех справочных данных для анкеты
    """
    data = {
        'branches': BranchSerializer(Branch.objects.all(), many=True).data,
        'study_programs': StudyProgramSerializer(StudyProgram.objects.all(), many=True).data,
        'departments': DepartmentSerializer(Department.objects.all(), many=True).data,
        'research_fields': ResearchFieldSerializer(ResearchField.objects.all(), many=True).data,
        'methodologies': MethodologySerializer(Methodology.objects.all(), many=True).data,
        'competencies': CompetencySerializer(Competency.objects.all(), many=True).data,
        'publication_types': PublicationTypeSerializer(PublicationType.objects.all(), many=True).data,
        'collaboration_types': CollaborationTypeSerializer(CollaborationType.objects.all(), many=True).data,
    }

    return Response(data)


# ============================================
# ВРЕМЕННЫЙ HEALTH CHECK
# ============================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Проверка работоспособности API"""
    return Response({
        'status': 'ok',
        'message': 'Users API is working'
    })