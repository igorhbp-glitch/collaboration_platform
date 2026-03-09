from rest_framework import serializers
from .models import Invitation
from users.serializers import UserSerializer  # Импортируем сериализатор пользователя


class InvitationSerializer(serializers.ModelSerializer):
    """Сериализатор для приглашений"""
    sender_details = UserSerializer(source='sender', read_only=True)
    receiver_details = UserSerializer(source='receiver', read_only=True)

    class Meta:
        model = Invitation
        fields = [
            'id',
            'sender',  # ID отправителя
            'sender_details',  # Детали отправителя
            'receiver',  # ID получателя
            'receiver_details',  # Детали получателя
            'project',
            'invitation_type',
            'status',
            'message',
            'role',  # ДОБАВЛЕНО: поле role
            'created_at',
            'updated_at',
            'responded_at',
        ]
        read_only_fields = ['sender', 'status', 'created_at', 'updated_at', 'responded_at']

    def validate(self, data):
        """Проверка валидности данных"""
        # Проверяем, что пользователь не отправляет приглашение самому себе
        request = self.context.get('request')
        if request and request.user == data['receiver']:
            raise serializers.ValidationError("Нельзя отправить приглашение самому себе")

        # Проверяем, что нет активного приглашения этому же пользователю
        if Invitation.objects.filter(
                sender=request.user,
                receiver=data['receiver'],
                project=data.get('project'),
                status='pending'
        ).exists():
            raise serializers.ValidationError("Вы уже отправили приглашение этому пользователю")

        return data


class CreateInvitationSerializer(serializers.ModelSerializer):
    """Сериализатор для создания приглашения"""

    class Meta:
        model = Invitation
        fields = ['receiver', 'project', 'invitation_type', 'message', 'role']  # ДОБАВЛЕНО: role

    def create(self, validated_data):
        """Автоматически добавляем отправителя из запроса"""
        request = self.context.get('request')
        validated_data['sender'] = request.user
        return super().create(validated_data)


class UpdateInvitationStatusSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления статуса приглашения"""

    class Meta:
        model = Invitation
        fields = ['status']
        read_only_fields = ['status']

    def validate_status(self, value):
        """Разрешаем только определенные изменения статуса"""
        valid_transitions = {
            'pending': ['accepted', 'rejected', 'cancelled'],
            'accepted': ['cancelled'],
            'rejected': [],
            'cancelled': [],
        }

        current_status = self.instance.status
        if value not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Невозможно изменить статус с '{current_status}' на '{value}'"
            )

        return value