# backend/projects/upload_views.py - ПОЛНОСТЬЮ НОВЫЙ ФАЙЛ

import os
import uuid
import imghdr
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    """
    Загрузка файла для комментария

    Принимает:
    - file: файл для загрузки

    Возвращает:
    - id: уникальный идентификатор файла
    - name: оригинальное имя файла
    - url: URL для доступа к файлу
    - size: размер в байтах
    - type: тип файла
    - uploaded_at: дата загрузки
    """
    try:
        print("\n" + "=" * 50)
        print("🔥 НАЧАЛО ЗАГРУЗКИ ФАЙЛА")

        # Проверяем наличие файла
        if 'file' not in request.FILES:
            print("❌ Файл не найден в запросе")
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']
        print(f"📄 Имя файла: {file.name}")
        print(f"📦 Размер: {file.size} байт")
        print(f"📋 Content-Type: {file.content_type}")

        # Проверка размера файла
        max_size = getattr(settings, 'DATA_UPLOAD_MAX_MEMORY_SIZE', 10485760)
        if file.size > max_size:
            print(f"❌ Файл слишком большой: {file.size} > {max_size}")
            return Response(
                {'error': f'Файл слишком большой. Максимальный размер: {max_size // 1024 // 1024}MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка расширения файла
        ext = os.path.splitext(file.name)[1].lower()
        allowed_extensions = getattr(settings, 'ALLOWED_FILE_EXTENSIONS', [])

        if ext not in allowed_extensions:
            print(f"❌ Недопустимое расширение: {ext}")
            return Response(
                {'error': f'Недопустимый тип файла. Разрешены: {", ".join(allowed_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Генерируем уникальное имя файла
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = f"{timestamp}_{unique_id}{ext}"

        # Создаем папку по дате (год/месяц/день)
        date_folder = datetime.now().strftime('%Y/%m/%d')
        upload_path = f'comment_attachments/{date_folder}'

        # Полный путь для сохранения
        full_path = os.path.join(settings.MEDIA_ROOT, upload_path)
        os.makedirs(full_path, exist_ok=True)
        print(f"📁 Папка для сохранения: {full_path}")

        # Сохраняем файл
        file_path = os.path.join(upload_path, safe_filename)
        saved_path = default_storage.save(file_path, ContentFile(file.read()))

        # Формируем URL для доступа к файлу
        base_url = f"{request.scheme}://{request.get_host()}"
        file_url = f"{base_url}{settings.MEDIA_URL}{saved_path}"

        # Определяем тип файла для иконки
        file_type = 'unknown'
        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp']:
            file_type = 'image'
        elif ext in ['.pdf']:
            file_type = 'pdf'
        elif ext in ['.doc', '.docx']:
            file_type = 'doc'
        elif ext in ['.xls', '.xlsx']:
            file_type = 'excel'
        elif ext in ['.ppt', '.pptx']:
            file_type = 'presentation'
        elif ext in ['.zip', '.rar', '.7z', '.tar', '.gz']:
            file_type = 'archive'
        elif ext in ['.txt', '.md', '.rtf']:
            file_type = 'text'
        elif ext in ['.py', '.js', '.html', '.css', '.json', '.xml', '.csv']:
            file_type = 'code'

        response_data = {
            'id': f"{timestamp}_{unique_id}",
            'name': file.name,
            'url': file_url,
            'size': file.size,
            'type': file_type,
            'extension': ext[1:],  # убираем точку
            'uploaded_at': timezone.now().isoformat()
        }

        print(f"✅ Файл успешно загружен:")
        print(f"   ID: {response_data['id']}")
        print(f"   URL: {file_url}")
        print("=" * 50 + "\n")

        return Response(response_data, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"❌ Ошибка загрузки файла: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Ошибка при загрузке файла: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_file(request):
    """
    Удаление загруженного файла

    Принимает:
    - url: URL файла для удаления
    """
    try:
        print("\n" + "=" * 50)
        print("🔥 УДАЛЕНИЕ ФАЙЛА")

        file_url = request.data.get('url')
        if not file_url:
            file_url = request.query_params.get('url')

        if not file_url:
            print("❌ URL файла не указан")
            return Response(
                {'error': 'URL файла не указан'},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"📄 URL файла: {file_url}")

        # Получаем путь к файлу из URL
        if file_url.startswith(settings.MEDIA_URL):
            relative_path = file_url.replace(settings.MEDIA_URL, '')
        else:
            relative_path = file_url

        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        print(f"📁 Путь к файлу: {file_path}")

        # Проверяем существование файла
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"✅ Файл удален: {file_path}")

            # Пытаемся удалить пустые родительские папки
            try:
                parent_dir = os.path.dirname(file_path)
                while parent_dir != settings.MEDIA_ROOT:
                    if os.path.exists(parent_dir) and not os.listdir(parent_dir):
                        os.rmdir(parent_dir)
                        print(f"📁 Удалена пустая папка: {parent_dir}")
                    parent_dir = os.path.dirname(parent_dir)
            except Exception as e:
                print(f"⚠️ Не удалось удалить папку: {e}")

            print("=" * 50 + "\n")
            return Response({'success': True})
        else:
            print(f"❌ Файл не найден: {file_path}")
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

    except Exception as e:
        print(f"❌ Ошибка удаления файла: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Ошибка при удалении файла: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_file_info(request):
    """
    Получение информации о файле по URL
    """
    try:
        file_url = request.query_params.get('url')
        if not file_url:
            return Response(
                {'error': 'URL файла не указан'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Получаем путь к файлу из URL
        if file_url.startswith(settings.MEDIA_URL):
            relative_path = file_url.replace(settings.MEDIA_URL, '')
        else:
            relative_path = file_url

        file_path = os.path.join(settings.MEDIA_ROOT, relative_path)

        if not os.path.exists(file_path):
            return Response(
                {'error': 'Файл не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        file_stat = os.stat(file_path)
        file_name = os.path.basename(file_path)
        file_ext = os.path.splitext(file_name)[1].lower()

        # Определяем тип файла
        file_type = 'unknown'
        if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp']:
            file_type = 'image'
        elif file_ext in ['.pdf']:
            file_type = 'pdf'
        elif file_ext in ['.doc', '.docx']:
            file_type = 'doc'
        elif file_ext in ['.xls', '.xlsx']:
            file_type = 'excel'
        elif file_ext in ['.ppt', '.pptx']:
            file_type = 'presentation'

        return Response({
            'name': file_name,
            'url': file_url,
            'size': file_stat.st_size,
            'type': file_type,
            'extension': file_ext[1:],
            'modified': datetime.fromtimestamp(file_stat.st_mtime).isoformat()
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )