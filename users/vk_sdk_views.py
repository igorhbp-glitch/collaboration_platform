# users/vk_sdk_views.py
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def vk_exchange_code(request):
    """
    Обменивает код авторизации на токены VK и создает/обновляет пользователя
    """
    code = request.data.get('code')
    device_id = request.data.get('device_id')
    code_verifier = request.data.get('code_verifier')

    logger.info("=" * 60)
    logger.info("📥 VK EXCHANGE CODE REQUEST")
    logger.info(f"  code: {code[:20] if code else None}...")
    logger.info(f"  device_id: {device_id}")
    logger.info(f"  code_verifier длина: {len(code_verifier) if code_verifier else 0}")

    if not all([code, device_id, code_verifier]):
        missing = []
        if not code: missing.append('code')
        if not device_id: missing.append('device_id')
        if not code_verifier: missing.append('code_verifier')
        logger.error(f"❌ Отсутствуют параметры: {missing}")
        return Response(
            {'error': f'Не хватает параметров: {", ".join(missing)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Обмениваем код на токены в VK
        token_url = 'https://id.vk.ru/oauth2/auth'
        token_data = {
            'client_id': settings.SOCIAL_AUTH_VK_OAUTH2_KEY,
            'client_secret': settings.SOCIAL_AUTH_VK_OAUTH2_SECRET,
            'redirect_uri': 'http://localhost',
            'code': code,
            'code_verifier': code_verifier,
            'device_id': device_id,
            'grant_type': 'authorization_code'
        }

        logger.info(f"📤 Отправляем запрос в VK: {token_url}")
        logger.debug(f"  Данные запроса: { {k: v[:20] if k == 'code' else '***' for k, v in token_data.items()} }")

        token_response = requests.post(token_url, data=token_data)
        logger.info(f"📥 Статус ответа от VK: {token_response.status_code}")

        token_data = token_response.json()
        logger.info(
            f"📥 Ответ от VK: { {k: v[:50] if k in ['access_token', 'refresh_token'] else v for k, v in token_data.items()} }")

        if 'error' in token_data:
            error_msg = token_data.get('error_description', 'Ошибка получения токена')
            logger.error(f"❌ Ошибка VK API: {error_msg}")
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

        access_token = token_data.get('access_token')
        vk_user_id = token_data.get('user_id')

        # Получаем информацию о пользователе из VK
        user_info_url = 'https://id.vk.ru/oauth2/user_info'
        user_info_data = {
            'client_id': settings.SOCIAL_AUTH_VK_OAUTH2_KEY,
            'access_token': access_token
        }

        user_info_response = requests.post(user_info_url, data=user_info_data)
        user_info = user_info_response.json().get('user', {})

        logger.info(f"📥 Информация о пользователе VK: {user_info}")

        email = user_info.get('email')
        first_name = user_info.get('first_name', '')
        last_name = user_info.get('last_name', '')

        # Ищем существующего пользователя
        user = None

        # Сначала по email
        if email:
            try:
                user = User.objects.get(email=email)
                logger.info(f"✅ Найден существующий пользователь по email: {email}")
            except User.DoesNotExist:
                pass

        # Если не нашли, ищем по VK ID в социальных аккаунтах
        if not user:
            from social_django.models import UserSocialAuth
            try:
                social = UserSocialAuth.objects.get(uid=vk_user_id, provider='vk-oauth2')
                user = social.user
                logger.info(f"✅ Найден существующий пользователь по VK ID: {vk_user_id}")
            except UserSocialAuth.DoesNotExist:
                pass

        # Если всё еще не нашли - создаем нового пользователя
        if not user:
            # Генерируем уникальный username
            base_username = f"vk_{vk_user_id}"
            username = base_username
            counter = 1

            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1

            # Создаем пользователя
            user = User.objects.create_user(
                username=username,
                email=email or f"vk_{vk_user_id}@temp.vk.user",
                first_name=first_name,
                last_name=last_name,
            )
            user.set_unusable_password()
            user.save()
            logger.info(f"✅ Создан новый пользователь: {username}")

            # Сохраняем связь с VK
            from social_django.models import UserSocialAuth
            UserSocialAuth.objects.create(
                user=user,
                provider='vk-oauth2',
                uid=vk_user_id,
                extra_data={'access_token': access_token}
            )
        else:
            # Обновляем информацию пользователя, если она изменилась
            updated = False
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                updated = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                updated = True
            if email and user.email != email and not User.objects.exclude(id=user.id).filter(email=email).exists():
                user.email = email
                updated = True

            if updated:
                user.save()
                logger.info(f"✅ Обновлена информация пользователя: {user.email}")

        # Генерируем JWT токены
        refresh = RefreshToken.for_user(user)

        logger.info(f"✅ Авторизация успешна для пользователя: {user.email}")
        logger.info("=" * 60)

        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username,
                'role': user.role
            }
        })

    except IntegrityError as e:
        logger.error(f"❌ Ошибка целостности БД: {str(e)}")
        return Response(
            {'error': 'Ошибка при создании пользователя. Возможно, такой пользователь уже существует.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"❌ Непредвиденная ошибка: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {'error': 'Внутренняя ошибка сервера'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )