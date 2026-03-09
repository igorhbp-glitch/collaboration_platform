# projects/jitsi_utils.py
import logging
import hashlib
import time

logger = logging.getLogger(__name__)


def generate_jitsi_room_name(project_id):
    """
    Генерирует уникальное имя комнаты для Jitsi на основе project_id
    """
    # Создаём уникальное имя на основе project_id и времени
    timestamp = int(time.time())
    hash_input = f"collab_{project_id}_{timestamp}"
    room_hash = hashlib.md5(hash_input.encode()).hexdigest()[:10]

    return f"collab-{project_id}-{room_hash}"


def validate_jitsi_link(link):
    """
    Проверяет, является ли ссылка корректной ссылкой на Jitsi
    """
    if not link:
        return False
    return link.startswith('https://meet.jit.si/')