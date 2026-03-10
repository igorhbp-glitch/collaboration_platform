// frontend/src/components/Project/TaskHistory.js - С КОНСТАНТАМИ
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';

// Импортируем Timeline компоненты из @mui/lab
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent
} from '@mui/lab';

import {
  History as HistoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentTurnedIn as CompletedIcon,
  PlayArrow as StartIcon,
  Comment as CommentIcon,
  Label as LabelIcon,
  PriorityHigh as PriorityIcon,
  AccessTime as TimeIcon,
  PersonAdd as AssignIcon
} from '@mui/icons-material';
import { tasksAPI } from '../../services/api';
import { format, formatDistance } from 'date-fns';
import { ru } from 'date-fns/locale';

// 🔥 ИМПОРТ КОНСТАНТ
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  getTaskStatusText
} from '../../constants/taskConstants';

const TaskHistory = ({ taskId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка истории при монтировании компонента
  useEffect(() => {
    if (taskId) {
      loadTaskHistory();
    }
  }, [taskId]);

  // Функция загрузки истории задачи
  const loadTaskHistory = async () => {
    if (!taskId) return;

    setLoading(true);
    setError(null);

    try {
      const historyData = await tasksAPI.getTaskHistory(taskId);

      // Сортируем от новых к старым
      const sortedHistory = Array.isArray(historyData)
        ? historyData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        : [];

      setHistory(sortedHistory);
    } catch (error) {
      console.error('❌ Ошибка загрузки истории:', error);
      setError('Не удалось загрузить историю изменений');
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения иконки действия
  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <AddIcon sx={{ color: '#4caf50' }} />;
      case 'updated':
        return <EditIcon sx={{ color: '#ff9800' }} />;
      case 'deleted':
        return <DeleteIcon sx={{ color: '#f44336' }} />;
      case 'assigned':
        return <AssignIcon sx={{ color: '#2196f3' }} />;
      case 'moved':
        return <StartIcon sx={{ color: '#4fc3f7' }} />;
      case 'completed':
        return <CompletedIcon sx={{ color: '#81c784' }} />;
      case 'commented':
        return <CommentIcon sx={{ color: '#9c27b0' }} />;
      case 'priority':
        return <PriorityIcon sx={{ color: '#ff9800' }} />;
      case 'due_date':
        return <TimeIcon sx={{ color: '#ff9800' }} />;
      case 'tags':
        return <LabelIcon sx={{ color: '#9e9e9e' }} />;
      default:
        return <HistoryIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  // Функция для получения цвета действия
  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'success';
      case 'updated': return 'warning';
      case 'deleted': return 'error';
      case 'assigned': return 'info';
      case 'moved': return 'primary';
      case 'completed': return 'success';
      case 'commented': return 'secondary';
      default: return 'grey';
    }
  };

  // Функция для получения текста действия
  const getActionText = (item) => {
    switch (item.action) {
      case 'created':
        return 'создал(а) задачу';
      case 'updated':
        if (item.changes?.field) {
          const fieldNames = {
            'title': 'название',
            'description': 'описание',
            'priority': 'приоритет',
            'status': 'статус',
            'due_date': 'срок выполнения',
            'estimated_hours': 'оценку времени',
            'actual_hours': 'фактические часы',
            'assignee': 'исполнителя',
            'tags': 'теги'
          };
          return `изменил(а) ${fieldNames[item.changes.field] || item.changes.field}`;
        }
        return 'обновил(а) задачу';
      case 'deleted':
        return 'удалил(а) задачу';
      case 'assigned':
        return `назначил(а) исполнителем ${item.target_user?.first_name || ''} ${item.target_user?.last_name || ''}`;
      case 'moved':
        if (item.changes?.new_value) {
          return `переместил(а) задачу в "${getTaskStatusText(item.changes.new_value)}"`;
        }
        return 'переместил(а) задачу';
      case 'completed':
        return 'завершил(а) задачу';
      case 'commented':
        return 'оставил(а) комментарий';
      default:
        return 'выполнил(а) действие';
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return `сегодня в ${format(date, 'HH:mm')}`;
      } else if (diffDays === 1) {
        return `вчера в ${format(date, 'HH:mm')}`;
      } else if (diffDays < 7) {
        return `${formatDistance(date, now, { locale: ru, addSuffix: true })}`;
      } else {
        return format(date, 'd MMMM yyyy, HH:mm', { locale: ru });
      }
    } catch (e) {
      return 'неизвестная дата';
    }
  };

  // Функция для получения инициалов пользователя
  const getUserInitials = (user) => {
    if (!user) return '?';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return initials.trim() || user.email?.charAt(0)?.toUpperCase() || '?';
  };

  // Функция для получения цвета аватара
  const getAvatarColor = (userId) => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7',
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffc107', '#ff9800', '#ff5722', '#795548'
    ];

    if (!userId) return colors[0];

    const index = (typeof userId === 'number' ? userId : userId.length) % colors.length;
    return colors[index];
  };

  // Функция для получения текста изменения
  const getChangeText = (changes) => {
    if (!changes) return null;

    const { field, old_value, new_value } = changes;

    if (field === 'assignee') {
      return `${old_value || 'не назначен'} → ${new_value || 'не назначен'}`;
    }

    if (field === 'status') {
      return `${getTaskStatusText(old_value) || old_value} → ${getTaskStatusText(new_value) || new_value}`;
    }

    if (field === 'priority') {
      const priorityTexts = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий',
        'critical': 'Критический'
      };
      return `${priorityTexts[old_value] || old_value} → ${priorityTexts[new_value] || new_value}`;
    }

    if (field === 'due_date') {
      const formatDate = (dateStr) => {
        if (!dateStr) return 'не указан';
        try {
          return new Date(dateStr).toLocaleDateString('ru-RU');
        } catch {
          return dateStr;
        }
      };
      return `${formatDate(old_value)} → ${formatDate(new_value)}`;
    }

    return `${old_value || 'не указано'} → ${new_value || 'не указано'}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
          Загрузка истории изменений...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          <Button color="inherit" size="small" onClick={loadTaskHistory}>
            Повторить
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          История изменений пуста
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Здесь будут отображаться все действия с задачей
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="primary" />
        История изменений
        <Chip
          label={history.length}
          size="small"
          sx={{ ml: 1 }}
        />
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Timeline position="right" sx={{
        p: 0,
        '& .MuiTimelineItem-root:before': {
          flex: 0,
          padding: 0
        }
      }}>
        {history.map((item, index) => (
          <TimelineItem key={item.id || index}>
            <TimelineOppositeContent sx={{
              flex: 0.2,
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}>
              {formatDate(item.timestamp)}
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot sx={{
                bgcolor: getActionColor(item.action),
                p: 1
              }}>
                {getActionIcon(item.action)}
              </TimelineDot>
              {index < history.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent sx={{ pb: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: getAvatarColor(item.user?.id),
                      fontSize: '0.875rem'
                    }}
                  >
                    {getUserInitials(item.user)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {item.user?.first_name} {item.user?.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.user?.email || ''}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {getActionText(item)}
                </Typography>

                {item.changes && (
                  <Box sx={{
                    mt: 1,
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    borderLeft: 3,
                    borderLeftColor: getActionColor(item.action),
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                  }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Изменения:
                    </Typography>
                    <Typography variant="body2">
                      {getChangeText(item.changes)}
                    </Typography>
                  </Box>
                )}

                {item.comment && item.comment !== getActionText(item) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      p: 1,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      fontStyle: 'italic'
                    }}
                  >
                    "{item.comment}"
                  </Typography>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
};

export default TaskHistory;