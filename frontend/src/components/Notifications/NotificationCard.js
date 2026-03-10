// frontend/src/components/Notifications/NotificationCard.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Button,
  Divider,
  Collapse,
  alpha,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Markunread as MarkUnreadIcon,
  MarkChatRead as MarkReadIcon,
  Archive as ArchiveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Task as TaskIcon,
  Event as EventIcon,
  Mail as MailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  HowToReg as HowToRegIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const NotificationCardRoot = styled(Card)(({ theme, isread, notificationtype }) => ({
  borderRadius: theme.spacing(3),
  marginBottom: theme.spacing(2),
  border: '1px solid',
  borderColor: isread === 'false'
    ? alpha(theme.palette.primary.main, 0.3)
    : theme.palette.divider,
  backgroundColor: isread === 'false'
    ? alpha(theme.palette.primary.main, 0.02)
    : theme.palette.background.paper,
  transition: 'all 0.2s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[2]
  },
  // Цветная полоска слева в зависимости от типа
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: (() => {
      if (notificationtype?.includes('invitation')) return '#ff9800';
      if (notificationtype?.includes('project')) return '#4caf50';
      if (notificationtype?.includes('task')) return '#2196f3';
      if (notificationtype?.includes('event')) return '#9c27b0';
      return '#757575';
    })(),
  }
}));

const TypeIcon = styled(Box)(({ theme, notificationtype }) => ({
  width: 40,
  height: 40,
  borderRadius: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: (() => {
    if (notificationtype?.includes('invitation')) return alpha('#ff9800', 0.1);
    if (notificationtype?.includes('project')) return alpha('#4caf50', 0.1);
    if (notificationtype?.includes('task')) return alpha('#2196f3', 0.1);
    if (notificationtype?.includes('event')) return alpha('#9c27b0', 0.1);
    return alpha('#757575', 0.1);
  })(),
  color: (() => {
    if (notificationtype?.includes('invitation')) return '#ff9800';
    if (notificationtype?.includes('project')) return '#4caf50';
    if (notificationtype?.includes('task')) return '#2196f3';
    if (notificationtype?.includes('event')) return '#9c27b0';
    return '#757575';
  })(),
}));

const TimeAgo = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5)
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const NotificationCard = ({
  notification,
  onMarkRead,
  onArchive,
  onAction,
  expanded = false
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isMarking, setIsMarking] = useState(false);

  const getTypeIcon = () => {
    const type = notification.type;
    if (type.includes('invitation')) return <MailIcon />;
    if (type.includes('project')) return <GroupIcon />;
    if (type.includes('task')) return <TaskIcon />;
    if (type.includes('event')) return <EventIcon />;
    if (type.includes('approved')) return <CheckCircleIcon />;
    if (type.includes('rejected')) return <CancelIcon />;
    if (type.includes('request')) return <HowToRegIcon />;
    return <InfoIcon />;
  };

  const handleMarkRead = async (e) => {
    e.stopPropagation();
    if (notification.is_read) return;

    setIsMarking(true);
    try {
      await onMarkRead(notification.id);
    } finally {
      setIsMarking(false);
    }
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    onArchive(notification.id);
  };

  const handleAction = () => {
    if (onAction && notification.action_url) {
      onAction(notification.action_url);
    }
  };

  const formatTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ru
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <NotificationCardRoot
      isread={notification.is_read ? 'true' : 'false'}
      notificationtype={notification.type}
    >
      <CardContent sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Иконка типа */}
          <TypeIcon notificationtype={notification.type}>
            {getTypeIcon()}
          </TypeIcon>

          {/* Основной контент */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 0.5
            }}>
              <Typography
                variant="subtitle1"
                fontWeight={notification.is_read ? 500 : 700}
                sx={{ cursor: 'pointer' }}
                onClick={handleAction}
              >
                {notification.title}
              </Typography>

              <TimeAgo>
                <ScheduleIcon sx={{ fontSize: 12 }} />
                {formatTimeAgo(notification.created_at)}
              </TimeAgo>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: isExpanded ? 'none' : 2,
                WebkitBoxOrient: 'vertical',
                cursor: 'pointer'
              }}
              onClick={handleAction}
            >
              {notification.message}
            </Typography>

            {/* Тип уведомления (чип) */}
            <Chip
              label={notification.type_display}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6rem',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.text.secondary,
                mr: 1
              }}
            />

            {notification.related_object_title && (
              <Chip
                label={notification.related_object_title}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 1, pt: 0, justifyContent: 'flex-end', gap: 0.5 }}>
        {!notification.is_read && (
          <Tooltip title="Отметить как прочитанное">
            <IconButton
              size="small"
              onClick={handleMarkRead}
              disabled={isMarking}
              sx={{ color: theme.palette.primary.main }}
            >
              <MarkReadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Архивировать">
          <IconButton
            size="small"
            onClick={handleArchive}
            sx={{ color: theme.palette.text.secondary }}
          >
            <ArchiveIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={isExpanded ? "Свернуть" : "Развернуть"}>
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ color: theme.palette.text.secondary }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      </CardActions>

      <Collapse in={isExpanded}>
        <Divider />
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
            <strong>ID:</strong> {notification.id}
          </Typography>
          {notification.related_object_type && (
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
              <strong>Тип объекта:</strong> {notification.related_object_type}
            </Typography>
          )}
          {notification.related_object_id && (
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
              <strong>ID объекта:</strong> {notification.related_object_id}
            </Typography>
          )}
          {notification.action_url && (
            <Button
              size="small"
              variant="outlined"
              onClick={handleAction}
              sx={{ mt: 1, borderRadius: 5 }}
            >
              Перейти
            </Button>
          )}
        </Box>
      </Collapse>
    </NotificationCardRoot>
  );
};

export default NotificationCard;