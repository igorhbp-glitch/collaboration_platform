// frontend/src/components/Project/KanbanBoard.js - С КОНСТАНТАМИ
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  Badge,
  LinearProgress,
  Fade,
  Divider
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';

// Импорты @dnd-kit
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 🔥 ИМПОРТ КОНСТАНТ
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PRIORITY,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  getTaskStatusText,
  getTaskStatusColor,
  getPriorityText,
  getPriorityColor
} from '../../constants/taskConstants';

// Колонки канбан-доски с использованием констант
const KANBAN_COLUMNS = [
  {
    id: TASK_STATUS.BACKLOG,
    title: TASK_STATUS_LABELS[TASK_STATUS.BACKLOG].toUpperCase(),
    color: TASK_STATUS_COLORS[TASK_STATUS.BACKLOG],
    description: 'Задачи в ожидании'
  },
  {
    id: TASK_STATUS.TODO,
    title: TASK_STATUS_LABELS[TASK_STATUS.TODO].toUpperCase(),
    color: TASK_STATUS_COLORS[TASK_STATUS.TODO],
    description: 'Готовые к работе'
  },
  {
    id: TASK_STATUS.IN_PROGRESS,
    title: TASK_STATUS_LABELS[TASK_STATUS.IN_PROGRESS].toUpperCase(),
    color: TASK_STATUS_COLORS[TASK_STATUS.IN_PROGRESS],
    description: 'Выполняются сейчас'
  },
  {
    id: TASK_STATUS.REVIEW,
    title: TASK_STATUS_LABELS[TASK_STATUS.REVIEW].toUpperCase(),
    color: TASK_STATUS_COLORS[TASK_STATUS.REVIEW],
    description: 'Ожидают проверки'
  },
  {
    id: TASK_STATUS.DONE,
    title: TASK_STATUS_LABELS[TASK_STATUS.DONE].toUpperCase(),
    color: TASK_STATUS_COLORS[TASK_STATUS.DONE],
    description: 'Завершенные задачи'
  },
];

// Вспомогательные функции
const getTaskById = (id, tasks) => {
  return tasks.find(task => String(task.id) === String(id));
};

const getColumnColor = (status) => {
  return TASK_STATUS_COLORS[status] || '#e0e0e0';
};

const getColumnTitle = (status) => {
  return TASK_STATUS_LABELS[status] || status;
};

const getUserInitials = (user) => {
  if (!user) return '?';
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
  return initials.trim() || user.email?.charAt(0)?.toUpperCase() || '?';
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

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  } catch (e) {
    return '';
  }
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'сегодня';
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    return formatDate(dateString);
  } catch (e) {
    return '';
  }
};

// Компонент задачи
const SortableTask = ({
  task,
  onMenuOpen,
  onMarkAsDone,
  onStartTask,
  onClick,
  isDragDisabled
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(task.id),
    data: {
      type: 'task',
      task: task,
      columnId: task.status
    },
    disabled: isDragDisabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = isOverdue(task.due_date, task.status);
  const canMarkAsDone = task.status !== TASK_STATUS.DONE;
  const canStartTask = task.status === TASK_STATUS.TODO || task.status === TASK_STATUS.BACKLOG;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isDragDisabled ? {} : listeners)}
      onClick={(e) => {
        if (e.target.closest('button') || e.target.closest('.MuiIconButton-root')) {
          return;
        }
        if (onClick) onClick(task.id);
      }}
      sx={{
        mb: 1.5,
        cursor: isDragDisabled ? 'default' : 'pointer',
        '&:active': isDragDisabled ? {} : { cursor: 'grabbing' },
        '&:hover': {
          boxShadow: isDragDisabled ? 1 : 3,
          transform: isDragDisabled ? 'none' : 'translateY(-2px)',
          transition: 'all 0.2s'
        },
        transition: 'all 0.2s',
        borderLeft: `4px solid ${getTaskStatusColor(task.status)}`,
        ...(overdue && {
          border: '2px solid #ff4444',
          backgroundColor: '#fff5f5',
          '&:hover': {
            backgroundColor: '#ffebee'
          }
        }),
        ...(isDragDisabled && {
          opacity: 0.8,
          backgroundColor: '#f5f5f5'
        })
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, position: 'relative' }}>
        {isDragDisabled && (
          <Tooltip title="Спринт завершен, редактирование недоступно">
            <LockIcon
              fontSize="small"
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'text.disabled',
                opacity: 0.5
              }}
            />
          </Tooltip>
        )}

        {!isDragDisabled && (
          <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'action.active', opacity: 0.3, '&:hover': { opacity: 1 } }}>
            <DragIndicatorIcon fontSize="small" />
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, pr: 3 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: overdue ? '#ff4444' : 'inherit'
            }}>
              {task.title || 'Без названия'}
            </Typography>

            {overdue && (
              <Tooltip title="Задача просрочена">
                <Chip
                  label="Просрочено"
                  size="small"
                  sx={{
                    backgroundColor: '#ff4444',
                    color: 'white',
                    height: 18,
                    fontSize: '0.65rem',
                    mt: 0.5,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>

        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontSize: '0.8125rem',
              lineHeight: 1.4
            }}
          >
            {task.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1 }}>
            <Tooltip title={`Приоритет: ${getPriorityText(task.priority)}`}>
              <Chip
                size="small"
                sx={{
                  backgroundColor: getPriorityColor(task.priority),
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 1, py: 0 }
                }}
                icon={<PriorityHighIcon sx={{ fontSize: 14 }} />}
                label={getPriorityText(task.priority)}
              />
            </Tooltip>

            {task.assignee && (
              <Tooltip title={`Исполнитель: ${task.assignee.first_name || task.assignee.email || 'Неизвестно'}`}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    bgcolor: 'primary.main',
                    border: '2px solid white',
                    boxShadow: 1
                  }}
                >
                  {getUserInitials(task.assignee)}
                </Avatar>
              </Tooltip>
            )}
          </Box>

          {!isDragDisabled && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {canStartTask && onStartTask && (
                <Tooltip title="Начать задачу">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onStartTask(task.id); }}
                    sx={{ p: 0.5 }}
                  >
                    <PlayArrowIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
              )}

              {canMarkAsDone && onMarkAsDone && (
                <Tooltip title="Отметить как выполненную">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onMarkAsDone(task.id); }}
                    sx={{ p: 0.5 }}
                  >
                    <CheckIcon fontSize="small" color="success" />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Просмотреть задачу">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onClick && onClick(task.id); }}
                  sx={{ p: 0.5 }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onMenuOpen(e, task); }}
                sx={{ p: 0.5 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
          {task.due_date && (
            <Tooltip title={`Срок: ${formatDate(task.due_date)}`}>
              <Chip
                size="small"
                icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                label={formatDate(task.due_date)}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  '& .MuiChip-label': { px: 1, py: 0 },
                  ...(overdue && { backgroundColor: '#ff4444', color: 'white' })
                }}
              />
            </Tooltip>
          )}

          {task.updated_at && (
            <Typography variant="caption" color="text.secondary">
              {formatRelativeDate(task.updated_at)}
            </Typography>
          )}
        </Box>

        {task.estimated_hours > 0 && task.actual_hours >= 0 && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min((task.actual_hours / task.estimated_hours) * 100, 100)}
              sx={{ height: 4, borderRadius: 2 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {task.actual_hours} / {task.estimated_hours} ч
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Компонент колонки
const Column = ({
  column,
  tasks,
  onCreateTask,
  onTaskMenuOpen,
  onMarkAsDone,
  onStartTask,
  onTaskClick,
  isDragDisabled
}) => {
  const columnTasks = tasks.filter(task => task.status === column.id);
  const taskIds = columnTasks.map(task => String(task.id));

  const {
    setNodeRef,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id,
      accepts: ['task']
    },
    disabled: isDragDisabled
  });

  const overdueCount = columnTasks.filter(task => isOverdue(task.due_date, task.status)).length;

  return (
    <Paper
      ref={setNodeRef}
      data-column-id={column.id}
      data-type="column"
      sx={{
        flex: '1 1 280px',
        minWidth: 280,
        maxWidth: '100%',
        backgroundColor: `${column.color}08`,
        border: `2px solid ${column.color}20`,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content',
        maxHeight: '80vh',
        transition: 'all 0.2s',
        opacity: isDragDisabled ? 0.9 : 1,
        '&:hover': {
          borderColor: isDragDisabled ? `${column.color}20` : `${column.color}40`,
          boxShadow: isDragDisabled ? 1 : 2
        }
      }}
    >
      {/* Заголовок колонки */}
      <Box sx={{
        p: 2,
        borderBottom: `1px solid ${column.color}20`,
        backgroundColor: `${column.color}15`,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 400,
                letterSpacing: '0.5px',
                color: column.color,
                fontSize: '0.9rem'
              }}
            >
              {column.title}
            </Typography>

            {overdueCount > 0 && column.id !== TASK_STATUS.DONE && (
              <Tooltip title={`${overdueCount} просроченных задач`}>
                <Badge badgeContent={overdueCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
                  <WarningIcon sx={{ fontSize: 16, color: '#ff4444' }} />
                </Badge>
              </Tooltip>
            )}
          </Box>

          <Chip
            label={columnTasks.length}
            size="small"
            sx={{
              backgroundColor: column.color,
              color: 'white',
              fontWeight: '700',
              fontSize: '0.75rem',
              height: 20,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: '0.7rem',
            display: 'block',
            textAlign: 'left'
          }}
        >
          {column.description}
        </Typography>
      </Box>

      {/* Область задач с прокруткой */}
      <Box sx={{
        flex: 1,
        p: 1.5,
        overflowY: 'auto',
        minHeight: 100,
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '3px' },
        '&::-webkit-scrollbar-thumb': { background: column.color + '40', borderRadius: '3px' },
        '&::-webkit-scrollbar-thumb:hover': { background: column.color + '60' }
      }}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {columnTasks.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 100,
              p: 2,
              textAlign: 'center',
              border: `2px dashed ${column.color}40`,
              borderRadius: 2,
              backgroundColor: column.color + '08',
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {isDragDisabled ? 'Нет задач' : 'Перетащите задачу'}
              </Typography>
              {!isDragDisabled && (
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => onCreateTask(column.id)}
                  sx={{
                    mt: 1,
                    borderRadius: 2,
                    backgroundColor: column.color,
                    color: 'white',
                    fontSize: '0.7rem',
                    '&:hover': {
                      backgroundColor: column.color,
                      opacity: 0.9
                    }
                  }}
                >
                  Добавить
                </Button>
              )}
            </Box>
          ) : (
            columnTasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                onMenuOpen={onTaskMenuOpen}
                onMarkAsDone={onMarkAsDone}
                onStartTask={onStartTask}
                onClick={onTaskClick}
                isDragDisabled={isDragDisabled}
              />
            ))
          )}
        </SortableContext>
      </Box>

      {/* Футер колонки */}
      {!isDragDisabled && (
        <Box sx={{
          p: 1.5,
          borderTop: `1px solid ${column.color}20`,
          backgroundColor: column.color + '10',
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12
        }}>
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => onCreateTask(column.id)}
            size="small"
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: 'text.secondary',
              borderRadius: 2,
              fontSize: '0.75rem',
              '&:hover': {
                backgroundColor: column.color + '20',
                color: column.color
              }
            }}
            variant="text"
          >
            Добавить задачу
          </Button>
        </Box>
      )}
    </Paper>
  );
};

// ОСНОВНОЙ КОМПОНЕНТ KANBANBOARD
const KanbanBoard = ({
  tasks = [],
  project,
  currentSprint,
  onTaskUpdate,
  onCreateTask,
  members = [],
  onTaskClick,
  isSprintActive,
  isSprintCompleted
}) => {
  const [activeTask, setActiveTask] = useState(null);
  const [taskMenuAnchor, setTaskMenuAnchor] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dragError, setDragError] = useState('');
  const [dragSuccess, setDragSuccess] = useState('');

  const isDragDisabled = isSprintCompleted || !isSprintActive;

  // Фильтруем задачи текущего спринта
  const filteredTasks = tasks.filter(task => {
    if (!currentSprint) return false;
    return task.sprint === currentSprint.id;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    if (isDragDisabled) return;

    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = (event) => {
    if (isDragDisabled) {
      setDragError('Спринт завершен, перемещение задач недоступно');
      return;
    }

    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const draggedTask = getTaskById(activeId, filteredTasks);
    if (!draggedTask) return;

    let targetColumnId = null;

    if (over.data.current?.type === 'column') {
      targetColumnId = overId;
    }
    else if (over.data.current?.type === 'task') {
      const overTask = getTaskById(overId, filteredTasks);
      if (overTask) {
        targetColumnId = overTask.status;
      }
    }
    else if (KANBAN_COLUMNS.some(col => col.id === overId)) {
      targetColumnId = overId;
    }

    if (!targetColumnId) return;

    if (targetColumnId !== draggedTask.status) {
      if (onTaskUpdate) {
        onTaskUpdate(Number(activeId), targetColumnId);
        setDragSuccess(`Задача перемещена в "${getColumnTitle(targetColumnId)}"`);
      }
    }
  };

  const handleMarkAsDone = (taskId) => {
    if (isDragDisabled) {
      setDragError('Спринт завершен, изменение задач недоступно');
      return;
    }

    if (onTaskUpdate) {
      onTaskUpdate(taskId, TASK_STATUS.DONE);
      setDragSuccess('Задача отмечена как выполненная');
    }
  };

  const handleStartTask = (taskId) => {
    if (isDragDisabled) {
      setDragError('Спринт завершен, изменение задач недоступно');
      return;
    }

    if (onTaskUpdate) {
      onTaskUpdate(taskId, TASK_STATUS.IN_PROGRESS);
      setDragSuccess('Задача начата');
    }
  };

  const handleTaskMenuOpen = (event, task) => {
    setTaskMenuAnchor(event.currentTarget);
    setSelectedTask(task);
  };

  const handleTaskMenuClose = () => {
    setTaskMenuAnchor(null);
    setSelectedTask(null);
  };

  const handleTaskClick = (taskId) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  const handleCreateTaskInColumn = (status) => {
    if (isDragDisabled) {
      setDragError('Спринт завершен, создание задач недоступно');
      return;
    }

    if (onCreateTask) {
      onCreateTask(status);
    }
  };

  const handleCloseAlert = () => {
    setDragError('');
    setDragSuccess('');
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Уведомления */}
      <Snackbar
        open={!!dragSuccess}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="success"
          icon={<CheckCircleIcon />}
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {dragSuccess}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!dragError}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="error"
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {dragError}
        </Alert>
      </Snackbar>

      {/* Информация о статусе спринта */}
      {isSprintCompleted && (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          icon={<LockIcon />}
        >
          Спринт завершен. Редактирование и перемещение задач недоступно.
        </Alert>
      )}

      {!isSprintActive && !isSprintCompleted && currentSprint && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 2 }}
        >
          Спринт еще не начат. Задачи можно создавать, но перемещение будет доступно после старта.
        </Alert>
      )}

      {/* Доска */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          width: '100%'
        }}>
          {KANBAN_COLUMNS.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={filteredTasks}
              onCreateTask={handleCreateTaskInColumn}
              onTaskMenuOpen={handleTaskMenuOpen}
              onMarkAsDone={handleMarkAsDone}
              onStartTask={handleStartTask}
              onTaskClick={handleTaskClick}
              isDragDisabled={isDragDisabled}
            />
          ))}
        </Box>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && !isDragDisabled && (
            <Card sx={{
              width: 260,
              boxShadow: 6,
              opacity: 0.9,
              transform: 'rotate(3deg)',
              borderLeft: `4px solid ${getTaskStatusColor(activeTask.status)}`
            }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="600">
                  {activeTask.title}
                </Typography>
                {activeTask.assignee && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {getUserInitials(activeTask.assignee)}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {activeTask.assignee.first_name || activeTask.assignee.email}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Контекстное меню */}
      <Menu
        anchorEl={taskMenuAnchor}
        open={Boolean(taskMenuAnchor)}
        onClose={handleTaskMenuClose}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={() => { handleTaskMenuClose(); handleTaskClick(selectedTask?.id); }}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Просмотреть задачу
        </MenuItem>
        {!isDragDisabled && (
          <>
            <MenuItem onClick={handleTaskMenuClose}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Редактировать
            </MenuItem>
            <MenuItem onClick={handleTaskMenuClose}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Назначить исполнителя
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleTaskMenuClose} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Удалить задачу
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default KanbanBoard;