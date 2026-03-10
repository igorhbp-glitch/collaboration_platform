// frontend/src/components/Project/TaskDetailModal.js - ТОЧЕЧНЫЕ ИЗМЕНЕНИЯ

import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Chip,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  Badge,
  Divider,
  Grid,
  alpha,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import InfoIcon from '@mui/icons-material/Info';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';

import { tasksAPI } from '../../services/api';
import TaskCommentsChat from './TaskCommentsChat';

// 🔥 ИМПОРТ КОНСТАНТ
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  PRIORITY,
  PRIORITY_LABELS,
  getTaskStatusText,
  getPriorityText,
  getTaskStatusMuiColor,
  getPriorityMuiColor
} from '../../constants/taskConstants';

// ============================================================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ С ГРАДИЕНТОМ
// ============================================================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 32,
    maxWidth: 650,
    minWidth: 500,
    width: '90vw',
    height: '85vh',
    maxHeight: '900px',
    overflow: 'hidden',
    zIndex: 1300,
    background: `linear-gradient(
      180deg,
      #fafafa 35%,
      ${alpha(theme.palette.primary.main, 0.6)} 70%,
      ${theme.palette.primary.main} 100%
    )`,
    boxShadow: 'none',
    display: 'flex',
    flexDirection: 'column'
  }
}));

// 🔥 ШАПКА ОСТАЕТСЯ ПОЛНОСТЬЮ БЕЗ ИЗМЕНЕНИЙ
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
  borderBottom: '0.5px solid',
  borderColor: alpha(theme.palette.primary.main, 0.1)
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  backgroundColor: 'transparent',
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3
  },
  '& .MuiTab-root': {
    color: alpha(theme.palette.text.primary, 0.7),
    fontWeight: 500,
    fontSize: '0.95rem',
    textTransform: 'none',
    minHeight: 64,
    '&.Mui-selected': {
      color: theme.palette.primary.main
    },
    '&:hover': {
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.05)
    }
  }
}));

// 🔥 ПАНЕЛЬ КОНТЕНТА (ЗДЕСЬ БУДЕТ БЕЛЫЙ ТЕКСТ)
const StyledTabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: alpha(theme.palette.grey[400], 0.1),
    borderRadius: theme.spacing(0.5),
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.grey[600], 0.3),
    borderRadius: theme.spacing(0.5),
    '&:hover': {
      background: alpha(theme.palette.grey[600], 0.5),
    },
  }
}));

// ============================================================================
// КОМПОНЕНТ ВКЛАДКИ
// ============================================================================

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <StyledTabPanel>
          {children}
        </StyledTabPanel>
      )}
    </div>
  );
}

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

const TaskDetailModal = ({ open, onClose, taskId, onTaskUpdated }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (open && taskId) {
      fetchTaskDetails();
    } else {
      setTask(null);
      setError(null);
      setSuccess(null);
      setTabValue(0);
    }
  }, [open, taskId]);

  const fetchTaskDetails = async () => {
    if (!taskId) return;

    setIsLoading(true);
    setError(null);

    try {
      const taskData = await tasksAPI.getTask(taskId);
      setTask(taskData);
    } catch (error) {
      console.error('❌ Ошибка загрузки задачи:', error);
      setError(error.message || 'Не удалось загрузить данные задачи');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleQuickStatusChange = async (newStatus) => {
    if (!task) return;

    try {
      await tasksAPI.updateTaskStatus(task.id, newStatus);

      setTask(prev => ({ ...prev, status: newStatus }));

      if (onTaskUpdated) {
        onTaskUpdated();
      }

      setSuccess(`Статус изменен на "${getTaskStatusText(newStatus)}"`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('❌ Ошибка изменения статуса:', error);
      setError(error.message || 'Не удалось изменить статус задачи');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    if (!window.confirm('Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await tasksAPI.deleteTask(task.id);

      if (onTaskUpdated) {
        onTaskUpdated();
      }

      onClose();
    } catch (error) {
      console.error('❌ Ошибка удаления задачи:', error);
      setError(error.message || 'Не удалось удалить задачу');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указан';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Некорректная дата';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === TASK_STATUS.DONE) return false;
    try {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return due < today;
    } catch (e) {
      return false;
    }
  };

  const getUserInitials = (user) => {
    if (!user) return '?';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return initials.trim() || user.email?.charAt(0)?.toUpperCase() || '?';
  };

  if (isLoading && !task) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 3 }}>
              Загрузка задачи...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.due_date, task.status);

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth={false} fullWidth={false}>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            {task.title}  {/* ← ТОЛЬКО ЗДЕСЬ МЕНЯЕМ ID НА НАЗВАНИЕ */}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Кнопка "Выполнено" в шапке */}
          {task.status !== TASK_STATUS.DONE && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleQuickStatusChange(TASK_STATUS.DONE)}
              sx={{
                borderRadius: 6,
                textTransform: 'none',
                boxShadow: 'none',
                bgcolor: theme.palette.success.main,
                '&:hover': {
                  bgcolor: theme.palette.success.dark,
                  boxShadow: 'none'
                }
              }}
            >
              Выполнено
            </Button>
          )}
          <IconButton
            onClick={handleDeleteTask}
            sx={{
              color: 'white',
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </StyledDialogTitle>

      {/* Контейнер с табами и плавающими уведомлениями */}
      <Box sx={{ position: 'relative' }}>
        {/* Табы */}
        <Box sx={{ borderBottom: 1, borderColor: alpha(theme.palette.primary.main, 0.1) }}>
          <StyledTabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<InfoIcon />} iconPosition="start" label="Информация" />
            <Tab
              icon={<CommentIcon />}
              iconPosition="start"
              label={
                <Badge
                  badgeContent={null}
                  color="primary"
                  variant="dot"
                  invisible={tabValue !== 1}
                  sx={{ '& .MuiBadge-badge': { bgcolor: theme.palette.primary.main } }}
                >
                  Комментарии
                </Badge>
              }
            />
          </StyledTabs>
        </Box>

        {/* Уведомления поверх табов */}
{(error || success) && (
  <Box sx={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    p: 2,
    pointerEvents: 'none',
  }}>
    {error && (
      <Alert
        severity="error"
        sx={{
          borderRadius: 2,
          pointerEvents: 'auto',
          boxShadow: 3
        }}
        onClose={() => setError(null)}
      >
        {error}
      </Alert>
    )}

    {success && (
      <Alert
        severity="success"
        sx={{
          borderRadius: 2,
          pointerEvents: 'auto',
          boxShadow: 3
        }}
        onClose={() => setSuccess(null)}
      >
        {success}
      </Alert>
    )}
  </Box>
)}
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Заголовок задачи - НЕ ТРОГАЕМ */}
            <Box>
              <Typography variant="h4" fontWeight="300" color="primary.main">
                {task.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Создана: {formatDate(task.created_at)}
              </Typography>
              <Divider sx={{ mt: 1, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
            </Box>

            {/* 🔥 ЭТИ ПОЛЯ ДЕЛАЕМ БЕЛЫМИ */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                  Статус
                </Typography>
                <Typography variant="body2" fontWeight="500" sx={{ mt: 0.5, color: theme.palette.common.white }}>
                  {getTaskStatusText(task.status)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                  Приоритет
                </Typography>
                <Typography variant="body2" fontWeight="500" sx={{ mt: 0.5, color: theme.palette.common.white }}>
                  {getPriorityText(task.priority)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                  Исполнитель
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main, fontSize: '0.75rem' }}>
                    {task.assignee ? getUserInitials(task.assignee) : '?'}
                  </Avatar>
                  <Typography variant="body2" fontWeight="500" sx={{ color: theme.palette.common.white }}>
                    {task.assignee ? `${task.assignee.first_name || ''} ${task.assignee.last_name || ''}`.trim() || task.assignee.email : 'Не назначен'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                  Срок выполнения
                </Typography>
                <Typography variant="body2" fontWeight="500" color={overdue ? 'error' : theme.palette.common.white} sx={{ mt: 0.5 }}>
                  {task.due_date ? formatDate(task.due_date) : 'Не указан'}
                  {overdue && ' (просрочено)'}
                </Typography>
              </Grid>
            </Grid>

            {/* 🔥 ОПИСАНИЕ ТОЖЕ БЕЛЫМ */}
            {task.description && (
              <Box>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }} gutterBottom>
                  Описание
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontWeight: 300, color: theme.palette.common.white }}>
                  {task.description}
                </Typography>
              </Box>
            )}

            {/* Теги (можно тоже белым для единообразия) */}
            {task.tags?.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }} gutterBottom>
                  Теги
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {task.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                        border: '0.5px solid',
                        borderColor: alpha(theme.palette.common.white, 0.3),
                        color: theme.palette.common.white,
                        '& .MuiChip-label': { color: theme.palette.common.white }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: '100%' }}>
            <TaskCommentsChat taskId={task.id} />
          </Box>
        </TabPanel>
      </Box>
    </StyledDialog>
  );
};

export default TaskDetailModal;