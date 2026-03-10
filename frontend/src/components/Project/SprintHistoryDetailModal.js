// frontend/src/components/Project/SprintHistoryDetailModal.js - С КОНСТАНТАМИ
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  Task as TaskIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { sprintsAPI } from '../../services/api';

// 🔥 ИМПОРТ КОНСТАНТ
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_STATUS_MUI_COLORS,
  getTaskStatusText,
  getTaskStatusMuiColor
} from '../../constants/taskConstants';

const SprintHistoryDetailModal = ({ open, onClose, sprint, isViewOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && sprint?.id && !isViewOnly) {
      fetchSprintTasks();
    } else if (open && sprint?.id && isViewOnly) {
      // В режиме просмотра не загружаем задачи
      setTasks([]);
    }
  }, [open, sprint?.id, isViewOnly]);

  const fetchSprintTasks = async () => {
    if (!sprint?.id) return;

    setLoading(true);
    setError(null);

    try {
      const tasksData = await sprintsAPI.getSprintTasks(sprint.id);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('Ошибка загрузки задач спринта:', error);
      setError('Не удалось загрузить задачи спринта');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Не указана';
    }
  };

  // Получение инициалов пользователя
  const getUserInitials = (user) => {
    if (!user) return '?';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return initials.trim() || user.email?.charAt(0)?.toUpperCase() || '?';
  };

  if (!sprint) return null;

  const startDate = sprint.start_date ? new Date(sprint.start_date) : null;
  const endDate = sprint.end_date ? new Date(sprint.end_date) : null;

  const duration = startDate && endDate
    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const completedTasks = tasks.filter(t => t.status === TASK_STATUS.DONE).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" component="div" fontWeight="600">
              {sprint.title || 'Спринт'}
            </Typography>
            {isViewOnly && (
              <Tooltip title="Режим только для просмотра">
                <LockIcon fontSize="small" color="disabled" sx={{ opacity: 0.5 }} />
              </Tooltip>
            )}
          </Box>
          <Button onClick={onClose} sx={{ minWidth: 'auto', p: 1 }}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Основная информация */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Цель спринта
              </Typography>
              <Typography variant="body1">
                {sprint.goal || 'Цель не указана'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Даты проведения
                </Typography>
                <Typography variant="body2">
                  {formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlagIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Длительность
                </Typography>
                <Typography variant="body2">
                  {duration} {duration === 1 ? 'день' : duration < 5 ? 'дня' : 'дней'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Статистика выполнения */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          Итоги спринта
        </Typography>

        {isViewOnly ? (
          // В режиме просмотра показываем заглушку
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, bgcolor: 'grey.50' }}>
            <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom color="text.secondary">
              Детальная статистика недоступна
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Для просмотра задач спринта необходимо стать участником проекта
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                  <TaskIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="600">
                    {totalTasks}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Всего задач
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="600">
                    {completedTasks}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Выполнено
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                  <AccessTimeIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="h5" fontWeight="600">
                    {completionRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Завершено
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Список задач */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <AssignmentIcon color="primary" />
              Задачи спринта
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            ) : tasks.length > 0 ? (
              <List>
                {tasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: `${getTaskStatusMuiColor(task.status)}.main`, width: 32, height: 32 }}>
                          {task.status === TASK_STATUS.DONE ? <CheckCircleIcon fontSize="small" /> :
                           task.status === TASK_STATUS.IN_PROGRESS ? <AccessTimeIcon fontSize="small" /> :
                           <TaskIcon fontSize="small" />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {task.title}
                            </Typography>
                            <Chip
                              label={getTaskStatusText(task.status)}
                              size="small"
                              color={getTaskStatusMuiColor(task.status)}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            {task.assignee && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {task.assignee.first_name || task.assignee.email}
                                </Typography>
                              </Box>
                            )}
                            {task.due_date && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(task.due_date)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Typography color="text.secondary">
                  В этом спринте не было задач
                </Typography>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SprintHistoryDetailModal;