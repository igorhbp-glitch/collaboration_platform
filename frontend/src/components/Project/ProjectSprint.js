// frontend/src/components/Project/ProjectSprint.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepConnector
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import Check from '@mui/icons-material/Check';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import PlanSprintsModal from './PlanSprintsModal';

// 🔥 ИМПОРТ КОНСТАНТ
import {
  SPRINT_STATUS,
  SPRINT_STATUS_LABELS,
  SPRINT_STATUS_COLORS,
  getSprintStatusText,
  getSprintStatusColor
} from '../../constants/taskConstants';

// Стилизованный коннектор для степпера
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  top: 22,
  '& .MuiStepConnector-line': {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

// Стилизованные иконки для шагов
const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage: 'linear-gradient(136deg, #4fc3f7 0%, #1976d2 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: 'linear-gradient(136deg, #81c784 0%, #4caf50 100%)',
  }),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className } = props;

  const icons = {
    1: <AssignmentIcon />,
    2: <PlayArrowIcon />,
    3: <FlagIcon />,
    4: <CheckCircleIcon />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

const SprintContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderColor: theme.palette.divider,
  position: 'relative'
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const colors = {
    [SPRINT_STATUS.PLANNING]: { bg: theme.palette.grey[100], color: theme.palette.grey[800] },
    [SPRINT_STATUS.ACTIVE]: { bg: theme.palette.success.light, color: theme.palette.success.dark },
    [SPRINT_STATUS.COMPLETED]: { bg: theme.palette.info.light, color: theme.palette.info.dark },
    [SPRINT_STATUS.CANCELLED]: { bg: theme.palette.error.light, color: theme.palette.error.dark }
  };
  const style = colors[status] || colors[SPRINT_STATUS.PLANNING];

  return {
    backgroundColor: style.bg,
    color: style.color,
    fontWeight: 600,
    '& .MuiChip-label': { px: 2 }
  };
});

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 12,
  borderRadius: 6,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 6,
  }
}));

const ProjectSprint = ({
  project,
  sprint,
  sprints = [],
  isOwner,
  isMember,
  canManageSprints,
  isLoading = false,
  onSprintCreate,
  onSprintEdit,
  onSprintStart,
  onSprintComplete,
  onPlanSprints,
  showKanban = false,
  kanbanComponent = null,
  tasksStats = { total: 0, completed: 0 }
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    goal: '',
    start_date: null,
    end_date: null
  });

  // Сортируем спринты по ID для определения порядка
  const sortedSprints = [...sprints].sort((a, b) => a.id - b.id);

  // Находим текущий спринт и его индекс
  const currentSprintIndex = sprint ? sortedSprints.findIndex(s => s.id === sprint.id) : -1;

  // Определяем следующий номер спринта для создания
  const nextSprintNumber = sortedSprints.length + 1;

  // Проверяем, есть ли план спринтов
  const hasPlan = project?.total_sprints > 0;

  // Счетчики для прогресса
  const completedSprintsCount = sprints.filter(s => s.status === SPRINT_STATUS.COMPLETED).length;
  const totalSprints = project?.total_sprints || 0;
  const projectProgress = totalSprints > 0
    ? Math.round((completedSprintsCount / totalSprints) * 100)
    : 0;

  // Проверяем, все ли спринты завершены
  const allSprintsCompleted = totalSprints > 0 && completedSprintsCount >= totalSprints;

  // Сбрасываем форму при открытии диалога создания
  useEffect(() => {
    if (createDialogOpen) {
      setEditFormData({
        title: project?.sprint_titles?.[sortedSprints.length] || `Спринт ${nextSprintNumber}`,
        goal: '',
        start_date: null,
        end_date: null
      });
    }
  }, [createDialogOpen, nextSprintNumber, project?.sprint_titles, sortedSprints.length]);

  // Заполняем форму данными спринта при открытии диалога редактирования
  useEffect(() => {
    if (editDialogOpen && sprint) {
      setEditFormData({
        title: sprint.title || '',
        goal: sprint.goal || '',
        start_date: sprint.start_date ? new Date(sprint.start_date) : null,
        end_date: sprint.end_date ? new Date(sprint.end_date) : null
      });
    }
  }, [editDialogOpen, sprint]);

  const taskProgress = tasksStats.total > 0
    ? Math.round((tasksStats.completed / tasksStats.total) * 100)
    : 0;

  // Если идет загрузка
  if (isLoading) {
    return (
      <SprintContainer elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Загрузка спринтов...
          </Typography>
        </Box>
      </SprintContainer>
    );
  }

  // 🔥 ИСПРАВЛЕНО: Если нет плана спринтов и пользователь имеет права на управление
  if (!hasPlan && (isOwner || canManageSprints)) {
    return (
      <SprintContainer elevation={0}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <TimelineIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.8 }} />
          <Typography
              variant="h6"
              fontWeight="700"
              sx={{ color: 'primary.main' }}
            >
            Спланируйте спринты
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            Определите, сколько спринтов потребуется для реализации проекта,
            и задайте им названия. Это поможет отслеживать общий прогресс.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<TimelineIcon />}
            onClick={() => setPlanDialogOpen(true)}
            sx={{ borderRadius: 6, px: 2 }}
          >
            Спланировать спринты
          </Button>
        </Box>

        {/* Диалог планирования спринтов */}
        <PlanSprintsModal
          open={planDialogOpen}
          onClose={() => setPlanDialogOpen(false)}
          onSave={(planData) => {
            onPlanSprints(planData);
            setPlanDialogOpen(false);
          }}
          initialTotal={project?.total_sprints}
        />
      </SprintContainer>
    );
  }

  // Основной рендер для всех случаев, когда план есть
  return (
    <SprintContainer elevation={0}>
      {/* 🔥 ИСПРАВЛЕНО: Шестеренка для редактирования плана только когда нет текущего спринта */}
      {(isOwner || canManageSprints) && hasPlan && !sprint && (
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Tooltip title="Редактировать план спринтов">
            <IconButton
              onClick={() => setPlanDialogOpen(true)}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: 'white'
                }
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Диалог редактирования плана */}
      <PlanSprintsModal
        open={planDialogOpen}
        onClose={() => setPlanDialogOpen(false)}
        onSave={(planData) => {
          onPlanSprints(planData);
          setPlanDialogOpen(false);
        }}
        initialTotal={project?.total_sprints}
        initialTitles={project?.sprint_titles}
      />

      {/* Если есть текущий спринт, показываем его */}
      {sprint && (
        <>
          {/* Заголовок с статусом */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" fontWeight="600" color="text.secondary">
              {sprint.status === SPRINT_STATUS.ACTIVE ? 'Текущий спринт' :
               sprint.status === SPRINT_STATUS.PLANNING ? 'Планируемый спринт' : 'Завершенный спринт'}
            </Typography>
            <StatusChip
              label={getSprintStatusText(sprint.status)}
              status={sprint.status}
              size="small"
            />
            {(isOwner || canManageSprints) && sprint.status !== SPRINT_STATUS.COMPLETED && (
              <Tooltip title="Редактировать спринт">
                <IconButton onClick={() => setEditDialogOpen(true)} size="small" sx={{ ml: 'auto' }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Название спринта */}
          <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
            {sprint.title || `Спринт ${currentSprintIndex + 1}`}
          </Typography>

          {/* Цель спринта */}
          {sprint.goal && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              {sprint.goal}
            </Typography>
          )}

          {/* Информация о сроках */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString('ru-RU') : 'Не указано'} — {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString('ru-RU') : 'Не указано'}
              </Typography>
            </Box>
            {sprint.status === SPRINT_STATUS.ACTIVE && sprint.end_date && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlagIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {Math.ceil((new Date(sprint.end_date) - new Date()) / (1000 * 60 * 60 * 24)) > 0
                    ? `Осталось ${Math.ceil((new Date(sprint.end_date) - new Date()) / (1000 * 60 * 60 * 24))} дн.`
                    : 'Завершается сегодня'}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Прогресс задач текущего спринта */}
          {tasksStats.total > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Задачи спринта
                </Typography>
                <Typography variant="body2" fontWeight="600">
                  {taskProgress}% ({tasksStats.completed}/{tasksStats.total})
                </Typography>
              </Box>
              <StyledLinearProgress
                variant="determinate"
                value={taskProgress}
                color="success"
              />
            </Box>
          )}

          {/* Если задач нет */}
          {tasksStats.total === 0 && sprint.status !== SPRINT_STATUS.COMPLETED && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              В спринте пока нет задач. Создайте задачи в канбан-доске ниже.
            </Alert>
          )}

          {/* Кнопки действий для тех, у кого есть права */}
          {(isOwner || canManageSprints) && sprint.status !== SPRINT_STATUS.COMPLETED && (
            <Box sx={{ display: 'flex', gap: 2, mb: showKanban ? 3 : 0 }}>
              {sprint.status === SPRINT_STATUS.PLANNING && (
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => onSprintStart(sprint.id)}
                  sx={{ borderRadius: 6 }}
                >
                  Начать спринт
                </Button>
              )}
              {sprint.status === SPRINT_STATUS.ACTIVE && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => onSprintComplete(sprint.id)}
                  sx={{ borderRadius: 6 }}
                >
                  Завершить спринт
                </Button>
              )}
            </Box>
          )}

          {/* Канбан-доска */}
          {showKanban && kanbanComponent && (
            <Box sx={{ mt: 3 }}>
              {kanbanComponent}
            </Box>
          )}
        </>
      )}

      {/* Если есть план, но нет текущего спринта (после завершения или перед созданием) */}
      {hasPlan && !sprint && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <TimelineIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, opacity: 0.8 }} />

          {allSprintsCompleted ? (
            <>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'success.main' }}>
                🎉 Все спринты завершены!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                Вы успешно завершили все {totalSprints} запланированных спринтов.
                Теперь можно завершить проект и посмотреть итоговую статистику.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                {completedSprintsCount === 0
                  ? 'Создайте первый спринт'
                  : `Создайте спринт ${nextSprintNumber}`}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                {completedSprintsCount === 0
                  ? 'Начните работу над проектом с первого спринта'
                  : `Осталось спринтов: ${totalSprints - completedSprintsCount} из ${totalSprints}`}
              </Typography>
            </>
          )}

          {/* Горизонтальный степпер с прогрессом */}
          {totalSprints > 0 && (
            <Box sx={{ width: '100%', mb: 4, px: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600">
                  Прогресс проекта: {projectProgress}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {completedSprintsCount}/{totalSprints} спринтов
                </Typography>
              </Box>

              <StyledLinearProgress
                variant="determinate"
                value={projectProgress}
                color="primary"
                sx={{ mb: 4 }}
              />

              <Stepper
                alternativeLabel
                activeStep={completedSprintsCount}
                connector={<ColorlibConnector />}
                sx={{ mt: 2 }}
              >
                {Array.from({ length: totalSprints }).map((_, index) => {
                  const sprintExists = sprints[index];
                  const isCompleted = sprints[index]?.status === SPRINT_STATUS.COMPLETED;
                  const isActive = sprints[index]?.status === SPRINT_STATUS.ACTIVE;

                  return (
                    <Step key={index} completed={isCompleted} active={isActive}>
                      <StepLabel StepIconComponent={ColorlibStepIcon}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                          {project?.sprint_titles?.[index] || `Спринт ${index + 1}`}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {isCompleted && (
                            <Chip
                              label="Завершен"
                              size="small"
                              color="success"
                              sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                            />
                          )}
                          {isActive && (
                            <Chip
                              label="В процессе"
                              size="small"
                              color="primary"
                              sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                            />
                          )}
                          {!sprintExists && index === completedSprintsCount && !allSprintsCompleted && (
                            <Chip
                              label="Ожидает"
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                            />
                          )}
                          {!sprintExists && index > completedSprintsCount && (
                            <Chip
                              label="Будет позже"
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                            />
                          )}
                        </Box>
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            </Box>
          )}

          {/* Кнопка создания спринта - теперь для всех с правами */}
          {(isOwner || canManageSprints) && !allSprintsCompleted && nextSprintNumber <= totalSprints && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ borderRadius: 6, px: 4, mt: 2 }}
            >
              Создать спринт {nextSprintNumber}
            </Button>
          )}

          {/* Сообщение для не-владельцев без прав */}
          {!(isOwner || canManageSprints) && !allSprintsCompleted && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Владелец проекта еще не создал следующий спринт
            </Typography>
          )}

          {!(isOwner || canManageSprints) && allSprintsCompleted && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
              Все спринты завершены! Ожидайте завершения проекта владельцем.
            </Alert>
          )}
        </Box>
      )}

      {/* Диалог создания спринта */}
      <CreateSprintDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onSave={() => {
          if (editFormData.title && editFormData.goal && editFormData.start_date && editFormData.end_date) {
            onSprintCreate(editFormData);
            setCreateDialogOpen(false);
          }
        }}
        sprintNumber={nextSprintNumber}
      />

      {/* Диалог редактирования спринта */}
      <CreateSprintDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onSave={() => {
          if (editFormData.title && editFormData.goal && editFormData.start_date && editFormData.end_date) {
            onSprintEdit(sprint?.id, editFormData);
            setEditDialogOpen(false);
          }
        }}
        sprintNumber={currentSprintIndex + 1}
        isEdit={true}
      />
    </SprintContainer>
  );
};

// ============================================
// 🔥 СТИЛИЗОВАННОЕ МОДАЛЬНОЕ ОКНО СОЗДАНИЯ СПРИНТА (flex версия)
// ============================================

const CreateSprintDialog = ({ open, onClose, editFormData, setEditFormData, onSave, sprintNumber, isEdit = false }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4, // 32px скругление
          bgcolor: '#fafafa',
          boxShadow: 'none'
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: theme.palette.primary.main,
        color: 'white',
        py: 3,
        px: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TimelineIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            {isEdit ? 'Редактирование спринта' : `Создание спринта ${sprintNumber}`}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* Название спринта */}
            <TextField
              fullWidth
              label="Название спринта"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6,
                  bgcolor: '#ffffff',
                  '& fieldset': {
                    borderWidth: '0.5px',
                    borderColor: alpha(theme.palette.primary.main, 0.1)
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main
                  }
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: theme.palette.primary.main
                  }
                }
              }}
            />

            {/* Цель спринта */}
            <TextField
              fullWidth
              label="Цель спринта"
              multiline
              rows={3}
              value={editFormData.goal}
              onChange={(e) => setEditFormData({ ...editFormData, goal: e.target.value })}
              placeholder="Опишите основную цель спринта"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6,
                  bgcolor: '#ffffff',
                  '& fieldset': {
                    borderWidth: '0.5px',
                    borderColor: alpha(theme.palette.primary.main, 0.1)
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main
                  }
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: theme.palette.primary.main
                  }
                }
              }}
            />

            {/* Даты в flex row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Дата начала"
                value={editFormData.start_date}
                onChange={(date) => setEditFormData({ ...editFormData, start_date: date })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: {
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 6,
                        bgcolor: '#ffffff',
                        '& fieldset': {
                          borderWidth: '0.5px',
                          borderColor: alpha(theme.palette.primary.main, 0.1)
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main
                        }
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: theme.palette.primary.main
                        }
                      }
                    }
                  }
                }}
              />

              <DatePicker
                label="Дата окончания"
                value={editFormData.end_date}
                onChange={(date) => setEditFormData({ ...editFormData, end_date: date })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: {
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 6,
                        bgcolor: '#ffffff',
                        '& fieldset': {
                          borderWidth: '0.5px',
                          borderColor: alpha(theme.palette.primary.main, 0.1)
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main
                        }
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: theme.palette.primary.main
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 6,
            px: 3,
            py: 1,
            borderWidth: '0.5px',
            textTransform: 'none',
            fontWeight: 300,
            '&:hover': {
              borderWidth: '0.5px'
            }
          }}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!editFormData.title || !editFormData.goal || !editFormData.start_date || !editFormData.end_date}
          sx={{
            borderRadius: 6,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 300,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }}
        >
          {isEdit ? 'Сохранить' : 'Создать спринт'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectSprint;