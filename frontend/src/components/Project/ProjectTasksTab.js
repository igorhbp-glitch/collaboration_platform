// frontend/src/components/Project/ProjectTasksTab.js - СТИЛИЗОВАННАЯ ВЕРСИЯ

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
  Fab,
  FormHelperText,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewListIcon from '@mui/icons-material/ViewList';
import TaskIcon from '@mui/icons-material/Task';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import FlagIcon from '@mui/icons-material/Flag';
import ClearIcon from '@mui/icons-material/Clear';

import api, { tasksAPI, sprintsAPI } from '../../services/api';
import KanbanBoard from './KanbanBoard';
import TaskDetailModal from './TaskDetailModal';
import CreateTaskModal from './CreateTaskModal';

// 🔥 ИМПОРТ КОНСТАНТ
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_STATUS_MUI_COLORS,
  PRIORITY,
  PRIORITY_LABELS,
  PRIORITY_MUI_COLORS,
  getTaskStatusText,
  getTaskStatusMuiColor,
  getPriorityText,
  getPriorityMuiColor
} from '../../constants/taskConstants';

function ProjectTasksTab({
  project,
  currentSprint,
  tasks: externalTasks,
  setTasks: setExternalTasks,
  isOwner,
  isMember,
  onTaskUpdate
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Фильтры и сортировка
  const [viewMode, setViewMode] = useState('kanban');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  // Состояние для модального окна деталей задачи
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Состояние для модального окна создания задачи
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [initialTaskStatus, setInitialTaskStatus] = useState(TASK_STATUS.TODO);

  // Загрузка задач - только для текущего спринта
  const fetchTasks = useCallback(async () => {
    if (!project?.id) {
      console.log('ProjectTasksTab: Нет проекта для загрузки задач');
      return;
    }

    // Если нет текущего спринта, показываем пустой массив
    if (!currentSprint?.id) {
      console.log('ℹ️ Нет текущего спринта, задачи не загружаются');
      setExternalTasks([]);
      return;
    }

    try {
      console.log(`📥 Загрузка задач для спринта ${currentSprint.id}`);
      setLoading(true);

      const tasksData = await sprintsAPI.getSprintTasks(currentSprint.id);
      console.log(`✅ Загружено задач: ${tasksData.length}`);

      // Гарантируем наличие всех полей
      const safeTasks = tasksData.map(task => ({
        id: task.id || Math.random(),
        title: task.title || 'Без названия',
        description: task.description || '',
        status: task.status || TASK_STATUS.BACKLOG,
        priority: task.priority || PRIORITY.MEDIUM,
        project: task.project || parseInt(project.id),
        assignee: task.assignee || null,
        due_date: task.due_date || null,
        created_at: task.created_at || new Date().toISOString(),
        updated_at: task.updated_at || new Date().toISOString(),
        position: task.position || 0,
        estimated_hours: task.estimated_hours || 0,
        actual_hours: task.actual_hours || 0,
        tags: task.tags || [],
        sprint: task.sprint || currentSprint.id
      }));

      setExternalTasks(safeTasks);
      setError(null);
    } catch (error) {
      console.error('❌ Ошибка загрузки задач спринта:', error);
      setError('Не удалось загрузить задачи спринта');
      setExternalTasks([]);
    } finally {
      setLoading(false);
    }
  }, [project?.id, currentSprint?.id, setExternalTasks]);

  // Загружаем задачи при изменении спринта
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, currentSprint?.id]);

  // Обновление статуса задачи
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    if (onTaskUpdate) {
      await onTaskUpdate(taskId, newStatus);
    } else {
      try {
        await tasksAPI.updateTaskStatus(taskId, newStatus);
        setExternalTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
              : task
          )
        );
        setNotification({
          type: 'success',
          message: 'Статус задачи обновлен'
        });
      } catch (error) {
        console.error('❌ Ошибка обновления статуса:', error);
        setNotification({
          type: 'error',
          message: 'Ошибка при обновлении статуса'
        });
      }
    }
  };

  // Открытие деталей задачи
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailOpen(true);
  };

  // Обновление после редактирования задачи
  const handleTaskUpdated = () => {
    fetchTasks();
    setNotification({
      type: 'info',
      message: 'Задача обновлена'
    });
  };

  // Создание задачи
  const handleCreateTask = (status = TASK_STATUS.TODO) => {
    if (!currentSprint) {
      setNotification({
        type: 'warning',
        message: 'Сначала создайте спринт'
      });
      return;
    }
    setInitialTaskStatus(status);
    setCreateTaskModalOpen(true);
  };

  // Обработчик успешного создания задачи
  const handleTaskCreated = (newTask) => {
    setExternalTasks(prev => [...prev, newTask]);
    setCreateTaskModalOpen(false);
    setNotification({
      type: 'success',
      message: 'Задача успешно создана'
    });
    fetchTasks();
  };

  // Обновление списка
  const handleRefresh = () => {
    fetchTasks();
    setNotification({
      type: 'info',
      message: 'Задачи обновляются...'
    });
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setSearchQuery('');
    setSortBy('created_at');
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const hasActiveFilters = statusFilter !== 'all' ||
                          priorityFilter !== 'all' ||
                          assigneeFilter !== 'all' ||
                          searchQuery.trim() !== '' ||
                          sortBy !== 'created_at';

  // Фильтрация задач
  const filteredTasks = (externalTasks || []).filter(task => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = task.title?.toLowerCase() || '';
      const description = task.description?.toLowerCase() || '';
      const tags = task.tags?.join(' ').toLowerCase() || '';

      if (!title.includes(query) && !description.includes(query) && !tags.includes(query)) {
        return false;
      }
    }

    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && task.assignee) return false;
      if (assigneeFilter === 'assigned' && !task.assignee) return false;
      if (assigneeFilter !== 'unassigned' && assigneeFilter !== 'assigned' &&
          task.assignee?.id !== parseInt(assigneeFilter)) {
        return false;
      }
    }

    return true;
  });

  // Сортировка
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case 'updated_at':
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      case 'due_date':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      case 'priority':
        const priorityOrder = {
          [PRIORITY.CRITICAL]: 0,
          [PRIORITY.HIGH]: 1,
          [PRIORITY.MEDIUM]: 2,
          [PRIORITY.LOW]: 3
        };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      default:
        return 0;
    }
  });

  const uniqueStatuses = [...new Set((externalTasks || []).map(t => t.status).filter(Boolean))];
  const uniquePriorities = [...new Set((externalTasks || []).map(t => t.priority).filter(Boolean))];
  const uniqueAssignees = (externalTasks || [])
    .map(t => t.assignee)
    .filter(Boolean)
    .filter((assignee, index, self) =>
      index === self.findIndex(a => a?.id === assignee?.id)
    );

  if (!project) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Проект не загружен
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TaskDetailModal
        open={isTaskDetailOpen}
        onClose={() => setIsTaskDetailOpen(false)}
        taskId={selectedTaskId}
        onTaskUpdated={handleTaskUpdated}
      />

      <CreateTaskModal
        open={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        projectId={project.id}
        members={project.members || []}
        onTaskCreated={handleTaskCreated}
        initialStatus={initialTaskStatus}
        sprintId={currentSprint?.id}
      />

      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.type || 'info'}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      {!currentSprint && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<FlagIcon />}
        >
          {isOwner
            ? 'Создайте спринт, чтобы начать работу с задачами'
            : 'Владелец проекта еще не создал спринт'}
        </Alert>
      )}

      {/* 🔥 СТИЛИЗОВАННЫЙ БЛОК ЗАГОЛОВКА И ФИЛЬТРОВ */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 5,
          backgroundColor: theme.palette.background.paper,
          border: '0.5px solid',
          borderColor: alpha(theme.palette.primary.main, 0.2)
        }}
      >
        {/* Верхняя строка с заголовком и кнопками */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="700" color="primary.main" sx={{ mb: 0.5 }}>
              Задачи {currentSprint ? `спринта: ${currentSprint.title}` : 'проекта'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 300 }}>
              {(externalTasks || []).length} задач • {filteredTasks.length} отфильтровано
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Обновить задачи">
              <IconButton
                onClick={handleRefresh}
                size="small"
                disabled={loading}
                sx={{
                  border: '0.5px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  borderRadius: 6,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main
                  }
                }}
              >
                <RefreshIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
              </IconButton>
            </Tooltip>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              sx={{
                border: '0.5px solid',
                borderColor: alpha(theme.palette.primary.main, 0.4),
                borderRadius: 6,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: 6,
                  color: theme.palette.text.secondary,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15)
                    }
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }
              }}
            >
              <ToggleButton value="kanban" sx={{ px: 2 }}>
                <Tooltip title="Канбан-доска">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ViewKanbanIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>Канбан</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="list" sx={{ px: 2 }}>
                <Tooltip title="Список">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ViewListIcon fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>Список</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {(isOwner || isMember) && currentSprint && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleCreateTask(TASK_STATUS.TODO)}
                sx={{
                  borderRadius: 6,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none'
                  }
                }}
              >
                Новая задача
              </Button>
            )}
          </Box>
        </Box>

        {/* Блок поиска и фильтров */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Поиск задач..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 6,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                '& fieldset': {
                  borderWidth: '0.5px',
                  borderColor: alpha(theme.palette.primary.main, 0.4)
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterListIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{
                color: theme.palette.text.secondary,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}>
                Статус
              </InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Статус"
                sx={{
                  borderRadius: 6,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '0.5px',
                    borderColor: alpha(theme.palette.primary.main, 0.4)
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  }
                }}
              >
                <MenuItem value="all">Все статусы</MenuItem>
                {uniqueStatuses.map(status => (
                  <MenuItem key={status} value={status}>
                    <Chip
                      label={getTaskStatusText(status)}
                      size="small"
                      color={getTaskStatusMuiColor(status)}
                      sx={{ height: 20, fontSize: '0.75rem' }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{
                color: theme.palette.text.secondary,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}>
                Приоритет
              </InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Приоритет"
                sx={{
                  borderRadius: 6,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '0.5px',
                    borderColor: alpha(theme.palette.primary.main, 0.4)
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  }
                }}
              >
                <MenuItem value="all">Все приоритеты</MenuItem>
                {uniquePriorities.map(priority => (
                  <MenuItem key={priority} value={priority}>
                    <Chip
                      label={getPriorityText(priority)}
                      size="small"
                      color={getPriorityMuiColor(priority)}
                      sx={{ height: 20, fontSize: '0.75rem' }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {uniqueAssignees.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel sx={{
                  color: theme.palette.text.secondary,
                  '&.Mui-focused': {
                    color: theme.palette.primary.main
                  }
                }}>
                  Исполнитель
                </InputLabel>
                <Select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  label="Исполнитель"
                  sx={{
                    borderRadius: 6,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderWidth: '0.5px',
                      borderColor: alpha(theme.palette.primary.main, 0.4)
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="unassigned">Не назначены</MenuItem>
                  <MenuItem value="assigned">Назначены</MenuItem>
                  {uniqueAssignees.map(assignee => (
                    <MenuItem key={assignee.id} value={assignee.id}>
                      {assignee.first_name || assignee.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{
                color: theme.palette.text.secondary,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SortIcon fontSize="small" />
                  Сортировка
                </Box>
              </InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Сортировка"
                sx={{
                  borderRadius: 6,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '0.5px',
                    borderColor: alpha(theme.palette.primary.main, 0.4)
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main
                  }
                }}
              >
                <MenuItem value="created_at">По дате создания</MenuItem>
                <MenuItem value="updated_at">По дате обновления</MenuItem>
                <MenuItem value="due_date">По сроку</MenuItem>
                <MenuItem value="priority">По приоритету</MenuItem>
                <MenuItem value="title">По названию</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Tooltip title="Сбросить фильтры">
                <IconButton
                  size="small"
                  onClick={handleResetFilters}
                  sx={{
                    border: '0.5px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: 6,
                    padding: 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <FilterAltOffIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Повторить
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!currentSprint ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '0.5px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
          <FlagIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom color="text.secondary" sx={{ fontWeight: 600 }}>
            Спринт не создан
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', fontWeight: 300 }}>
            {isOwner
              ? 'Создайте спринт, чтобы начать ставить задачи команде'
              : 'Владелец проекта еще не создал спринт. Дождитесь создания спринта, чтобы увидеть задачи'}
          </Typography>
        </Paper>
      ) : loading && (externalTasks || []).length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={sortedTasks}
          project={project}
          currentSprint={currentSprint}
          onTaskUpdate={handleUpdateTaskStatus}
          onCreateTask={handleCreateTask}
          members={project.members || []}
          onTaskClick={handleTaskClick}
          isSprintActive={currentSprint.status === 'active'}
          isSprintCompleted={currentSprint.status === 'completed'}
        />
      ) : (
        <Paper sx={{ p: 3, borderRadius: 4, border: '0.5px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
          {sortedTasks.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
                Список задач ({sortedTasks.length})
              </Typography>
              {sortedTasks.map(task => (
                <Paper
                  key={task.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 4,
                    border: '0.5px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderLeft: `4px solid ${getTaskStatusMuiColor(task.status) === 'success' ? '#4caf50' :
                                 getTaskStatusMuiColor(task.status) === 'warning' ? '#ff9800' :
                                 getTaskStatusMuiColor(task.status) === 'info' ? '#2196f3' :
                                 getTaskStatusMuiColor(task.status) === 'primary' ? '#3f51b5' : '#9e9e9e'}`,
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: 'none'
                    },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 0.5 }}>
                        {task.title}
                      </Typography>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1, fontWeight: 300 }}>
                          {task.description.length > 150
                            ? `${task.description.substring(0, 150)}...`
                            : task.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        size="small"
                        label={getTaskStatusText(task.status)}
                        color={getTaskStatusMuiColor(task.status)}
                        sx={{ borderRadius: 4 }}
                      />
                      <Chip
                        size="small"
                        label={getPriorityText(task.priority)}
                        color={getPriorityMuiColor(task.priority)}
                        sx={{ borderRadius: 4 }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {task.assignee ? (
                        <Chip
                          size="small"
                          label={`Исполнитель: ${task.assignee.first_name || task.assignee.email}`}
                          variant="outlined"
                          sx={{ borderRadius: 4, borderWidth: '0.5px' }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="Не назначена"
                          variant="outlined"
                          sx={{ borderRadius: 4, borderWidth: '0.5px' }}
                        />
                      )}
                      {task.due_date && (
                        <Chip
                          size="small"
                          label={`Срок: ${new Date(task.due_date).toLocaleDateString('ru-RU')}`}
                          variant="outlined"
                          sx={{ borderRadius: 4, borderWidth: '0.5px' }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 300 }}>
                      Создано: {new Date(task.created_at).toLocaleDateString('ru-RU')}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <TaskIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom color="text.secondary" sx={{ fontWeight: 600 }}>
                В этом спринте пока нет задач
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ maxWidth: 400, mx: 'auto', mb: 3, fontWeight: 300 }}>
                {isOwner || isMember
                  ? 'Создайте первую задачу для спринта'
                  : 'Дождитесь, пока владелец проекта создаст задачи'}
              </Typography>
              {(isOwner || isMember) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleCreateTask(TASK_STATUS.TODO)}
                  sx={{ borderRadius: 6, px: 4, textTransform: 'none', boxShadow: 'none' }}
                >
                  Создать задачу
                </Button>
              )}
            </Box>
          )}
        </Paper>
      )}

      {(isOwner || isMember) && currentSprint && viewMode === 'kanban' && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleCreateTask(TASK_STATUS.TODO)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            boxShadow: 'none',
            border: '0.5px solid',
            borderColor: alpha(theme.palette.primary.main, 0.2),
            '&:hover': {
              boxShadow: 'none',
              backgroundColor: alpha(theme.palette.primary.main, 0.9)
            }
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}

export default ProjectTasksTab;