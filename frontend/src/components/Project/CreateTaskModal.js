// frontend/src/components/Project/CreateTaskModal.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  FormHelperText,
  InputAdornment,
  Tooltip,
  Fade,
  alpha,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import PersonIcon from '@mui/icons-material/Person';
import LabelIcon from '@mui/icons-material/Label';
import DescriptionIcon from '@mui/icons-material/Description';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { tasksAPI } from '../../services/api';

// 🔥 ИМПОРТ КОНСТАНТ
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PRIORITY,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  getTaskStatusText,
  getPriorityText,
  getPriorityColor
} from '../../constants/taskConstants';

const CreateTaskModal = ({
  open,
  onClose,
  projectId,
  members = [],
  onTaskCreated,
  initialStatus = TASK_STATUS.TODO,
  sprintId
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  // Данные задачи
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    status: initialStatus,
    priority: PRIORITY.MEDIUM,
    assignee: '',
    due_date: null,
    due_time: null,
    estimated_hours: '',
    tags: []
  });

  // Новый тег
  const [newTag, setNewTag] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Статусы задач (из констант)
  const statusOptions = [
    {
      value: TASK_STATUS.BACKLOG,
      label: TASK_STATUS_LABELS[TASK_STATUS.BACKLOG],
      icon: '📋',
      color: TASK_STATUS_COLORS[TASK_STATUS.BACKLOG],
      description: 'Задачи в ожидании'
    },
    {
      value: TASK_STATUS.TODO,
      label: TASK_STATUS_LABELS[TASK_STATUS.TODO],
      icon: '📝',
      color: TASK_STATUS_COLORS[TASK_STATUS.TODO],
      description: 'Готовые к работе'
    },
    {
      value: TASK_STATUS.IN_PROGRESS,
      label: TASK_STATUS_LABELS[TASK_STATUS.IN_PROGRESS],
      icon: '⚡',
      color: TASK_STATUS_COLORS[TASK_STATUS.IN_PROGRESS],
      description: 'Выполняются сейчас'
    },
    {
      value: TASK_STATUS.REVIEW,
      label: TASK_STATUS_LABELS[TASK_STATUS.REVIEW],
      icon: '👀',
      color: TASK_STATUS_COLORS[TASK_STATUS.REVIEW],
      description: 'Ожидают проверки'
    },
    {
      value: TASK_STATUS.DONE,
      label: TASK_STATUS_LABELS[TASK_STATUS.DONE],
      icon: '✅',
      color: TASK_STATUS_COLORS[TASK_STATUS.DONE],
      description: 'Завершенные задачи'
    }
  ];

  // Приоритеты (из констант)
  const priorityOptions = [
    {
      value: PRIORITY.LOW,
      label: PRIORITY_LABELS[PRIORITY.LOW],
      icon: '⬇️',
      color: PRIORITY_COLORS[PRIORITY.LOW],
      description: 'Не срочно'
    },
    {
      value: PRIORITY.MEDIUM,
      label: PRIORITY_LABELS[PRIORITY.MEDIUM],
      icon: '➡️',
      color: PRIORITY_COLORS[PRIORITY.MEDIUM],
      description: 'Обычный приоритет'
    },
    {
      value: PRIORITY.HIGH,
      label: PRIORITY_LABELS[PRIORITY.HIGH],
      icon: '⬆️',
      color: PRIORITY_COLORS[PRIORITY.HIGH],
      description: 'Важно'
    },
    {
      value: PRIORITY.CRITICAL,
      label: PRIORITY_LABELS[PRIORITY.CRITICAL],
      icon: '🚨',
      color: PRIORITY_COLORS[PRIORITY.CRITICAL],
      description: 'Срочно!'
    }
  ];

  // Шаги создания
  const steps = ['Основная информация', 'Детали задачи', 'Исполнитель и сроки', 'Проверка'];

  // Сброс формы при открытии
  useEffect(() => {
    if (open) {
      setTaskData({
        title: '',
        description: '',
        status: initialStatus,
        priority: PRIORITY.MEDIUM,
        assignee: '',
        due_date: null,
        due_time: null,
        estimated_hours: '',
        tags: []
      });
      setNewTag('');
      setError('');
      setSuccess('');
      setActiveStep(0);
      setFieldErrors({});
    }
  }, [open, initialStatus]);

  // Валидация поля
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };

    switch (name) {
      case 'title':
        if (!value.trim()) {
          errors[name] = 'Название обязательно';
        } else if (value.length > 200) {
          errors[name] = 'Не более 200 символов';
        } else {
          delete errors[name];
        }
        break;
      case 'estimated_hours':
        if (value && (parseFloat(value) < 0 || parseFloat(value) > 1000)) {
          errors[name] = 'Должно быть от 0 до 1000 часов';
        } else {
          delete errors[name];
        }
        break;
      default:
        delete errors[name];
    }

    setFieldErrors(errors);
    return !errors[name];
  };

  // Обработчик изменения полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'title' || name === 'estimated_hours') {
      validateField(name, value);
    }
  };

  // Обработчик даты
  const handleDateChange = (date) => {
    setTaskData(prev => ({
      ...prev,
      due_date: date
    }));
  };

  // Обработчик времени
  const handleTimeChange = (time) => {
    setTaskData(prev => ({
      ...prev,
      due_time: time
    }));
  };

  // Добавление тега
  const handleAddTag = () => {
    if (newTag.trim() && !taskData.tags.includes(newTag.trim()) && taskData.tags.length < 10) {
      setTaskData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Удаление тега
  const handleRemoveTag = (tagToRemove) => {
    setTaskData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Переход к следующему шагу
  const handleNext = () => {
    if (activeStep === 0 && !validateField('title', taskData.title)) {
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Переход к предыдущему шагу
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Финальная валидация
      if (!taskData.title.trim()) {
        throw new Error('Введите название задачи');
      }

      // Подготовка данных для отправки
      const dataToSend = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        project_id: projectId,
        sprint_id: sprintId,
      };

      if (taskData.assignee) {
        dataToSend.assignee_id = parseInt(taskData.assignee);
      }

      if (taskData.due_date) {
        let dateString = new Date(taskData.due_date).toISOString().split('T')[0];
        if (taskData.due_time) {
          const time = new Date(taskData.due_time);
          const timeString = time.toTimeString().split(' ')[0];
          dateString = `${dateString}T${timeString}`;
        }
        dataToSend.due_date = dateString;
      }

      if (taskData.estimated_hours) {
        dataToSend.estimated_hours = parseFloat(taskData.estimated_hours);
      }

      if (taskData.tags.length > 0) {
        dataToSend.tags = taskData.tags;
      }

      console.log('🔥 Отправка данных задачи:', dataToSend);
      const createdTask = await tasksAPI.createTask(dataToSend);

      if (onTaskCreated) {
        onTaskCreated(createdTask);
      }

      setSuccess('Задача успешно создана!');
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Ошибка создания задачи:', err);
      setError(err.message || 'Произошла ошибка при создании задачи');
    } finally {
      setLoading(false);
    }
  };

  // Получение инициалов пользователя
  const getUserInitials = (user) => {
    if (!user) return '?';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const email = user.email || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return initials.trim() || email.charAt(0).toUpperCase() || '?';
  };

  // Получение цвета статуса
  const getStatusColor = (statusValue) => {
    const status = statusOptions.find(s => s.value === statusValue);
    return status ? status.color : '#9e9e9e';
  };

  // Получение цвета приоритета
  const getPriorityColor = (priorityValue) => {
    const priority = priorityOptions.find(p => p.value === priorityValue);
    return priority ? priority.color : '#ff9800';
  };

  // Проверка, можно ли перейти дальше
  const canProceed = () => {
    if (activeStep === 0) {
      return taskData.title.trim() && !fieldErrors.title;
    }
    return true;
  };

  return (
    <Modal open={open} onClose={loading ? undefined : onClose} closeAfterTransition>
      <Fade in={open}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          maxWidth: '95vw',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
          borderRadius: 4,  // ← СКРУГЛЕНИЕ ВСЕГО ОКНА 32px
          overflow: 'hidden',  // ← ВАЖНО! чтобы содержимое не вылезало за скругленные углы
          outline: 'none'
        }}>
          {/* 🔥 ЗАГОЛОВОК - БЕЗ СКРУГЛЕНИЙ */}
          <Box sx={{
            p: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            flexShrink: 0
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h4" component="h2" fontWeight="600">
                  Создание новой задачи
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Заполните информацию о задаче
                </Typography>
              </Box>
              <IconButton
                onClick={onClose}
                disabled={loading}
                size="small"
                sx={{ color: 'primary.contrastText', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Степпер */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white !important', fontWeight: 500 } }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* 🔥 СКРОЛЛИРУЕМЫЙ КОНТЕНТ */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            px: 3,
            py: 2
          }}>
            {/* Сообщения об ошибках/успехе */}
            <Box sx={{ mb: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  {success}
                </Alert>
              )}
            </Box>

            {/* Форма */}
            <Box component="form">
              {/* Шаг 1: Основная информация */}
              {activeStep === 0 && (
                <Fade in={activeStep === 0}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon color="primary" /> Основная информация
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Название задачи - во всю ширину */}
                      <TextField
                        fullWidth
                        label="Название задачи *"
                        name="title"
                        value={taskData.title}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        variant="outlined"
                        error={!!fieldErrors.title}
                        helperText={fieldErrors.title || "Краткое и понятное название задачи"}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 6,
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
                          }
                        }}
                        autoFocus
                      />

                      {/* Описание задачи - во всю ширину */}
                      <TextField
                        fullWidth
                        label="Описание задачи"
                        name="description"
                        value={taskData.description}
                        onChange={handleChange}
                        multiline
                        rows={5}
                        disabled={loading}
                        variant="outlined"
                        helperText="Детальное описание задачи, цели, требования"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 6,
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
                          }
                        }}
                      />

                      {/* Теги */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LabelIcon fontSize="small" /> Теги задачи
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          {taskData.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              onDelete={() => handleRemoveTag(tag)}
                              disabled={loading}
                              size="medium"
                              sx={{ borderRadius: 4 }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            size="medium"
                            placeholder="Добавить тег (макс. 10)"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            disabled={loading || taskData.tags.length >= 10}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            sx={{
                              flex: 1,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 6,
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
                              }
                            }}
                            helperText={taskData.tags.length >= 10 ? 'Достигнут лимит тегов' : ''}
                          />
                          <Button
                            variant="outlined"
                            onClick={handleAddTag}
                            disabled={!newTag.trim() || loading || taskData.tags.length >= 10}
                            startIcon={<AddIcon />}
                            sx={{
                              borderRadius: 6,
                              borderWidth: '0.5px',
                              '&:hover': {
                                borderWidth: '0.5px'
                              }
                            }}
                          >
                            Добавить
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Шаг 2: Детали задачи */}
              {activeStep === 1 && (
                <Fade in={activeStep === 1}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PriorityHighIcon color="primary" /> Детали задачи
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel>Статус задачи</InputLabel>
                          <Select
                            name="status"
                            value={taskData.status}
                            onChange={handleChange}
                            label="Статус задачи"
                            disabled={loading}
                            sx={{
                              borderRadius: 6,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: '0.5px',
                                borderColor: alpha(theme.palette.primary.main, 0.1)
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              }
                            }}
                          >
                            {statusOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ fontSize: '1.2rem' }}>{option.icon}</Box>
                                  <Box>
                                    <Typography variant="body1">{option.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.description}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>Начальный статус задачи</FormHelperText>
                        </FormControl>
                      </Grid>

                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel>Приоритет</InputLabel>
                          <Select
                            name="priority"
                            value={taskData.priority}
                            onChange={handleChange}
                            label="Приоритет"
                            disabled={loading}
                            sx={{
                              borderRadius: 6,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: '0.5px',
                                borderColor: alpha(theme.palette.primary.main, 0.1)
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              }
                            }}
                          >
                            {priorityOptions.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      backgroundColor: option.color
                                    }}
                                  />
                                  <Box>
                                    <Typography variant="body1">{option.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.description}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>Важность и срочность задачи</FormHelperText>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Оценка времени (часы)"
                          name="estimated_hours"
                          type="number"
                          value={taskData.estimated_hours}
                          onChange={handleChange}
                          disabled={loading}
                          variant="outlined"
                          error={!!fieldErrors.estimated_hours}
                          helperText={fieldErrors.estimated_hours || "Сколько часов потребуется для выполнения"}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTimeIcon />
                              </InputAdornment>
                            ),
                            inputProps: { min: 0, max: 1000, step: 0.5 }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 6,
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
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Шаг 3: Исполнитель и сроки */}
              {activeStep === 2 && (
                <Fade in={activeStep === 2}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" /> Исполнитель и сроки
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Исполнитель задачи</InputLabel>
                          <Select
                            name="assignee"
                            value={taskData.assignee}
                            onChange={handleChange}
                            label="Исполнитель задачи"
                            disabled={loading}
                            sx={{
                              borderRadius: 6,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: '0.5px',
                                borderColor: alpha(theme.palette.primary.main, 0.1)
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main
                              }
                            }}
                          >
                            <MenuItem value="">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.7 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                  <Typography variant="body1">Не назначено</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Назначить позже
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                            {members.map(member => (
                              <MenuItem key={member.id || member.user?.id} value={member.id || member.user?.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar
                                    sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                                    src={member.user?.avatar || member.avatar}
                                  >
                                    {getUserInitials(member.user || member)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body1">
                                      {member.user?.first_name || member.first_name || ''} {member.user?.last_name || member.last_name || ''}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {member.user?.email || member.email || ''}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>Кто будет выполнять эту задачу</FormHelperText>
                        </FormControl>
                      </Grid>

                      <Grid item xs={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                          <DatePicker
                            label="Срок выполнения"
                            value={taskData.due_date}
                            onChange={handleDateChange}
                            disabled={loading}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined',
                                InputProps: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <CalendarTodayIcon />
                                    </InputAdornment>
                                  ),
                                },
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 6,
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
                                  }
                                }
                              }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>

                      <Grid item xs={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                          <TimePicker
                            label="Время (опционально)"
                            value={taskData.due_time}
                            onChange={handleTimeChange}
                            disabled={loading || !taskData.due_date}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined',
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 6,
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
                                  }
                                }
                              }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Шаг 4: Проверка */}
              {activeStep === 3 && (
                <Fade in={activeStep === 3}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                      Проверка информации
                    </Typography>

                    <Paper sx={{
                      p: 3,
                      mb: 3,
                      borderRadius: 4,
                      bgcolor: 'grey.50',
                      border: '0.5px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.1)
                    }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" color="primary" gutterBottom>
                            {taskData.title}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Статус
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: getStatusColor(taskData.status)
                              }}
                            />
                            <Typography variant="body2">
                              {getTaskStatusText(taskData.status)}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Приоритет
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: getPriorityColor(taskData.priority)
                              }}
                            />
                            <Typography variant="body2">
                              {getPriorityText(taskData.priority)}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Описание
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                            {taskData.description || 'Нет описания'}
                          </Typography>
                        </Grid>

                        {taskData.assignee && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Исполнитель
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {members.find(m => (m.id || m.user?.id) === taskData.assignee)?.user?.first_name || 'Неизвестно'}
                            </Typography>
                          </Grid>
                        )}

                        {taskData.due_date && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Срок выполнения
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {new Date(taskData.due_date).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                              {taskData.due_time &&
                                ` в ${new Date(taskData.due_time).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}`
                              }
                            </Typography>
                          </Grid>
                        )}

                        {taskData.estimated_hours && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Оценка времени
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {taskData.estimated_hours} часов
                            </Typography>
                          </Grid>
                        )}

                        {taskData.tags.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              Теги
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {taskData.tags.map((tag, index) => (
                                <Chip key={index} label={tag} size="small" sx={{ borderRadius: 4 }} />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Box>
                </Fade>
              )}
            </Box>
          </Box>

          {/* 🔥 СТИКИ-ФУТЕР С КНОПКАМИ */}
          <Box sx={{
            p: 3,
            borderTop: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.1),
            bgcolor: 'background.paper',
            flexShrink: 0
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={activeStep === 0 ? onClose : handleBack}
                disabled={loading}
                variant="outlined"
                startIcon={activeStep === 0 ? <CloseIcon /> : <RemoveIcon />}
                sx={{
                  borderRadius: 6,
                  borderWidth: '0.5px',
                  '&:hover': {
                    borderWidth: '0.5px'
                  }
                }}
              >
                {activeStep === 0 ? 'Отмена' : 'Назад'}
              </Button>

              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || loading}
                  variant="contained"
                  endIcon={<AddIcon />}
                  sx={{
                    borderRadius: 6,
                    px: 4,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none'
                    }
                  }}
                >
                  Далее
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={loading || !taskData.title.trim()}
                  startIcon={loading && <CircularProgress size={20} />}
                  sx={{
                    borderRadius: 6,
                    px: 4,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none'
                    }
                  }}
                >
                  {loading ? 'Создание...' : 'Создать задачу'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default CreateTaskModal;