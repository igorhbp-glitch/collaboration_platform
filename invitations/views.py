from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Invitation
from .serializers import (
    InvitationSerializer,
    CreateInvitationSerializer,
    UpdateInvitationStatusSerializer
)


class InvitationViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления приглашениями
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращаем только приглашения, связанные с текущим пользователем"""
        user = self.request.user
        return Invitation.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('sender', 'receiver', 'project')

    def get_serializer_class(self):
        """Выбираем сериализатор в зависимости от действия"""
        if self.action == 'create':
            return CreateInvitationSerializer
        elif self.action in ['accept', 'reject', 'cancel']:
            return UpdateInvitationStatusSerializer
        return InvitationSerializer

    def perform_create(self, serializer):
        """Создаем приглашение с текущим пользователем в качестве отправителя"""
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Принять приглашение"""
        invitation = self.get_object()

        # Проверяем, что текущий пользователь - получатель
        if invitation.receiver != request.user:
            return Response(
                {'error': 'Вы не можете принять это приглашение'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверяем, что приглашение еще активно
        if invitation.status != 'pending':
            return Response(
                {'error': 'Это приглашение уже было обработано'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invitation.accept()
        serializer = self.get_serializer(invitation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить приглашение"""
        invitation = self.get_object()

        # Проверяем, что текущий пользователь - получатель
        if invitation.receiver != request.user:
            return Response(
                {'error': 'Вы не можете отклонить это приглашение'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверяем, что приглашение еще активно
        if invitation.status != 'pending':
            return Response(
                {'error': 'Это приглашение уже было обработано'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invitation.reject()
        serializer = self.get_serializer(invitation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отменить приглашение (отправителем)"""
        invitation = self.get_object()

        # Проверяем, что текущий пользователь - отправитель
        if invitation.sender != request.user:
            return Response(
                {'error': 'Вы не можете отменить это приглашение'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверяем, что приглашение еще активно
        if invitation.status != 'pending':
            return Response(
                {'error': 'Это приглашение уже было обработано'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invitation.cancel()
        serializer = self.get_serializer(invitation)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sent(self, request):
        """Получить отправленные приглашения"""
        invitations = self.get_queryset().filter(sender=request.user)
        serializer = self.get_serializer(invitations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def received(self, request):
        """Получить полученные приглашения"""
        invitations = self.get_queryset().filter(
            receiver=request.user,
            status='pending'  # Показываем только ожидающие
        )
        serializer = self.get_serializer(invitations, many=True)
        return Response(serializer.data)