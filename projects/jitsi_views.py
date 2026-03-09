# projects/jitsi_views.py
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Project, ProjectMember

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_conference_link(request, project_id):
    """
    Сохраняет ссылку на конференцию в проекте (для Jitsi)
    POST /api/projects/{project_id}/save-conference-link/
    """
    project = get_object_or_404(Project, id=project_id)

    # Проверяем права (только владелец или участник)
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

    conference_link = request.data.get('conference_link')

    if not conference_link:
        return Response(
            {"error": "Не указана ссылка на конференцию"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Простая валидация Jitsi ссылки
    if not conference_link.startswith('https://meet.jit.si/'):
        return Response(
            {"error": "Некорректная ссылка Jitsi"},
            status=status.HTTP_400_BAD_REQUEST
        )

    project.conference_link = conference_link
    project.save()

    logger.info(f"✅ Ссылка на конференцию сохранена для проекта {project_id}: {conference_link}")

    return Response({
        "message": "Ссылка сохранена",
        "conference_link": conference_link
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_conference_link(request, project_id):
    """
    Удаляет ссылку на конференцию из проекта
    DELETE /api/projects/{project_id}/clear-conference-link/
    """
    project = get_object_or_404(Project, id=project_id)

    # Проверяем права (только владелец или участник)
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

    project.conference_link = None
    project.save()

    logger.info(f"✅ Ссылка на конференцию удалена для проекта {project_id}")

    return Response({
        "message": "Ссылка удалена"
    })