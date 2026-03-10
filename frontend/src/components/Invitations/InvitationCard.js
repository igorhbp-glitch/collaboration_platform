import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Chip,
  Box,
  IconButton,
  Collapse,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Groups as ProjectIcon,
  Email as EmailIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Delete as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as PendingIcon,
  Done as AcceptedIcon,
  Block as RejectedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { invitationsApi } from '../../services/api';

const InvitationCard = ({ invitation, onAction, isSent = false, currentUserId }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Определяем, является ли текущий пользователь получателем этого приглашения
  const isReceiver = currentUserId === invitation.receiver?.id || currentUserId === invitation.receiver;

  // Определяем, является ли текущий пользователь отправителем этого приглашения
  const isSender = currentUserId === invitation.sender?.id || currentUserId === invitation.sender;

  // Определяем фактический тип приглашения для текущего пользователя
  const actualIsSent = isSender && !isReceiver;

  // Проверяем, имеет ли пользователь право выполнять действия
  const canAccept = isReceiver && invitation.status === 'pending';
  const canReject = isReceiver && invitation.status === 'pending';
  const canCancel = isSender && invitation.status === 'pending';

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon color="warning" />;
      case 'accepted': return <AcceptedIcon color="success" />;
      case 'rejected': return <RejectedIcon color="error" />;
      case 'cancelled': return <CancelIcon color="disabled" />;
      default: return null;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает ответа',
      'accepted': 'Принято',
      'rejected': 'Отклонено',
      'cancelled': 'Отменено',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'warning',
      'accepted': 'success',
      'rejected': 'error',
      'cancelled': 'default',
    };
    return colorMap[status] || 'default';
  };

  const handleAccept = async () => {
    if (!canAccept) {
      setActionError('У вас нет прав для принятия этого приглашения');
      return;
    }

    setLoading(true);
    setActionError(null);
    try {
      await invitationsApi.accept(invitation.id);
      onAction?.('accepted');
    } catch (error) {
      console.error('Ошибка при принятии приглашения:', error);
      setActionError(error.response?.data?.error || 'Не удалось принять приглашение');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!canReject) {
      setActionError('У вас нет прав для отклонения этого приглашения');
      return;
    }

    setLoading(true);
    setActionError(null);
    try {
      await invitationsApi.reject(invitation.id);
      onAction?.('rejected');
    } catch (error) {
      console.error('Ошибка при отклонении приглашения:', error);
      setActionError(error.response?.data?.error || 'Не удалось отклонить приглашение');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!canCancel) {
      setActionError('У вас нет прав для отмены этого приглашения');
      return;
    }

    setLoading(true);
    setActionError(null);
    try {
      await invitationsApi.cancel(invitation.id);
      onAction?.('cancelled');
    } catch (error) {
      console.error('Ошибка при отмене приглашения:', error);
      setActionError(error.response?.data?.error || 'Не удалось отменить приглашение');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Определяем пользователя для отображения
  const displayUser = actualIsSent ? invitation.receiver_details : invitation.sender_details;
  const displayName = displayUser ?
    `${displayUser.first_name || ''} ${displayUser.last_name || ''}`.trim() ||
    displayUser.username ||
    displayUser.email :
    'Пользователь';

  // Форматируем роль для отображения
  const formatRole = (role) => {
    const roleMap = {
      'product_owner': 'Product Owner',
      'scrum_master': 'Scrum Master',
      'lead_researcher': 'Ведущий исследователь',
      'researcher': 'Исследователь',
      'analyst': 'Аналитик',
      'writer': 'Автор текста',
      'reviewer': 'Рецензент',
      'editor': 'Редактор',
      'assistant': 'Ассистент',
      'viewer': 'Наблюдатель',
    };
    return roleMap[role] || role;
  };

  return (
    <Card sx={{
      mb: 2,
      borderLeft: 4,
      borderLeftColor: `${
        invitation.status === 'accepted' ? 'success.main' :
        invitation.status === 'rejected' ? 'error.main' :
        invitation.status === 'pending' ? 'warning.main' :
        'grey.400'
      }`
    }}>
      <CardContent>
        {actionError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setActionError(null)}
          >
            {actionError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{ width: 56, height: 56 }}
              src={displayUser?.avatar}
            >
              <PersonIcon />
            </Avatar>

            <Box>
              <Typography variant="h6" component="div">
                {actualIsSent ? `Вы → ${displayName}` : `${displayName} → Вы`}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={getStatusIcon(invitation.status)}
                  label={getStatusText(invitation.status)}
                  color={getStatusColor(invitation.status)}
                  size="small"
                />

                {invitation.invitation_type === 'project' && invitation.role && (
                  <Chip
                    label={formatRole(invitation.role)}
                    variant="outlined"
                    size="small"
                    color="info"
                  />
                )}

                {invitation.invitation_type && invitation.invitation_type !== 'project' && (
                  <Chip
                    label={invitation.invitation_type === 'collaboration' ? 'Сотрудничество' : 'Менторство'}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Отправлено: {formatDate(invitation.created_at)}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              Сообщение:
            </Typography>

            <Typography variant="body2" sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              fontStyle: 'italic'
            }}>
              "{invitation.message || 'Без сообщения'}"
            </Typography>

            {invitation.project && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <ProjectIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Проект:
                </Typography>
                <Chip
                  label={invitation.project.title || `Проект #${invitation.project}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                ID приглашения: {invitation.id}
              </Typography>
              {invitation.responded_at && (
                <Typography variant="caption" color="text.secondary">
                  Ответ дан: {formatDate(invitation.responded_at)}
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      </CardContent>

      {invitation.status === 'pending' && (
        <CardActions sx={{
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: 1,
        }}>
          {/* Показываем предупреждение, если пользователь пытается действовать не со своим приглашением */}
          {!canAccept && !canReject && !canCancel && (
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ width: '100%', mb: 1 }}
            >
              Это не ваше приглашение
            </Alert>
          )}

          {canCancel && (
            <Button
              size="small"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading}
              color="error"
              variant="outlined"
            >
              {loading ? <CircularProgress size={16} /> : 'Отозвать'}
            </Button>
          )}

          {canReject && (
            <Button
              size="small"
              startIcon={<RejectIcon />}
              onClick={handleReject}
              disabled={loading}
              color="error"
              variant="outlined"
            >
              {loading ? <CircularProgress size={16} /> : 'Отклонить'}
            </Button>
          )}

          {canAccept && (
            <Button
              size="small"
              startIcon={<AcceptIcon />}
              onClick={handleAccept}
              disabled={loading}
              color="success"
              variant="contained"
            >
              {loading ? <CircularProgress size={16} color="inherit" /> : 'Принять'}
            </Button>
          )}
        </CardActions>
      )}

      {/* ВНИМАНИЕ: УБРАЛИ ОТЛАДОЧНУЮ ИНФОРМАЦИЮ, КОТОРАЯ ПОКАЗЫВАЛАСЬ ТОЛЬКО В РЕЖИМЕ РАЗРАБОТКИ */}
      {/* Теперь эта секция полностью удалена, чтобы не показывать техническую информацию пользователям */}
    </Card>
  );
};

export default InvitationCard;