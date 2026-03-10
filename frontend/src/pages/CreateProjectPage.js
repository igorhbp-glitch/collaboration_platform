// frontend/src/pages/CreateProjectPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Autocomplete,
  Card,
  CardContent,
  Grid,
  Avatar,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Science as ScienceIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { projectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Импортируем справочник
import {
  RESEARCH_FIELDS,
  COMPETENCIES,
  getAllResearchFields,
  getUniqueProgramNames
} from '../data/scienceData';

// Константы для типов проектов с иконками и цветами
const PROJECT_TYPES = [
  { value: 'research_paper', label: 'Научная статья', icon: '📄', color: '#4361ee', description: 'Подготовка и публикация научной статьи' },
  { value: 'dissertation', label: 'Диссертация', icon: '📚', color: '#3a0ca3', description: 'Кандидатская или докторская диссертация' },
  { value: 'grant', label: 'Грантовый проект', icon: '💰', color: '#7209b7', description: 'Подготовка заявки или реализация гранта' },
  { value: 'conference', label: 'Подготовка к конференции', icon: '🎤', color: '#f72585', description: 'Организация или участие в конференции' },
  { value: 'book', label: 'Книга/Монография', icon: '📖', color: '#4cc9f0', description: 'Написание книги или коллективной монографии' },
  { value: 'creative', label: 'Творческий проект', icon: '🎨', color: '#f8961e', description: 'Художественное или прикладное творчество' },
  { value: 'other', label: 'Другой тип', icon: '🔬', color: '#f94144', description: 'Иной тип научного проекта' }
];

// Константы для статусов
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик', icon: '📝', color: '#9e9e9e', description: 'Проект виден только вам' },
  { value: 'recruiting', label: 'Набор участников', icon: '🔍', color: '#2196f3', description: 'Проект виден всем, можно приглашать участников' },
  { value: 'active', label: 'Активный', icon: '⚡', color: '#4caf50', description: 'Проект активен, работа в процессе' }
];

const STEPS = ['Основная информация', 'Научная область', 'Участники и доступ'];

// Собираем все компетенции из справочника в плоский список
const getAllCompetencies = () => {
  const allCompetencies = [];
  Object.values(COMPETENCIES).forEach(category => {
    allCompetencies.push(...category.items);
  });
  return allCompetencies.sort();
};

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Состояния для выбора из справочника
  const [allCompetencies] = useState(getAllCompetencies());
  const allResearchFields = getAllResearchFields();

  // Форма
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'research_paper',
    scientific_field: '',
    required_competencies: [],
    newCompetency: '',
    tags: [],
    newTag: '',
    max_members: 5,
    is_private: false,
    status: 'draft',
    deadline: null
  });

  const [errors, setErrors] = useState({});

  // Валидация шага
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.title.trim()) newErrors.title = 'Введите название проекта';
      if (!formData.description.trim()) newErrors.description = 'Введите описание проекта';
      if (formData.description.length < 50) newErrors.description = 'Описание должно быть не менее 50 символов';
      if (!formData.project_type) newErrors.project_type = 'Выберите тип проекта';
    }

    if (step === 1) {
      if (!formData.scientific_field.trim()) newErrors.scientific_field = 'Укажите научную область';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleAddCompetency = () => {
    if (formData.newCompetency.trim() && !formData.required_competencies.includes(formData.newCompetency.trim())) {
      setFormData({
        ...formData,
        required_competencies: [...formData.required_competencies, formData.newCompetency.trim()],
        newCompetency: '',
      });
    }
  };

  const handleRemoveCompetency = (competencyToRemove) => {
    setFormData({
      ...formData,
      required_competencies: formData.required_competencies.filter(
        (comp) => comp !== competencyToRemove
      ),
    });
  };

  const handleAddTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.trim()],
        newTag: '',
      });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    setError(null);

    try {
      // Подготовка данных для отправки
      const submitData = {
        title: formData.title,
        description: formData.description,
        project_type: formData.project_type,
        scientific_field: formData.scientific_field,
        required_competencies: formData.required_competencies,
        tags: formData.tags,
        max_members: formData.max_members,
        is_private: formData.is_private,
        status: formData.status,
        deadline: formData.deadline ? formData.deadline.toISOString().split('T')[0] : null,
      };

      const response = await projectsAPI.create(submitData);

      // Проверяем наличие ID
      if (!response || !response.id) {
        setError('Ошибка: сервер не вернул ID созданного проекта');
        setLoading(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        navigate(`/projects/${response.id}`);
      }, 2000);

    } catch (error) {
      setError(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Не удалось создать проект. Проверьте введенные данные.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeIcon = (type) => {
    const found = PROJECT_TYPES.find(t => t.value === type);
    return found?.icon || '📄';
  };

  const getProjectTypeColor = (type) => {
    const found = PROJECT_TYPES.find(t => t.value === type);
    return found?.color || '#4361ee';
  };

  const getStatusColor = (status) => {
    const found = STATUS_OPTIONS.find(s => s.value === status);
    return found?.color || '#9e9e9e';
  };

  const getStatusIcon = (status) => {
    const found = STATUS_OPTIONS.find(s => s.value === status);
    return found?.icon || '📝';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        {/* Заголовок с кнопкой назад */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/projects')} sx={{ borderRadius: 4 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="600">
            Создание проекта
          </Typography>
        </Box>

        {/* Степпер */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Сообщения */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Проект успешно создан! Перенаправляем на страницу проекта...
          </Alert>
        )}

        {/* Форма */}
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          {/* ШАГ 1: Основная информация */}
          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h5" fontWeight="600">
                Основная информация
              </Typography>

              {/* Тип проекта */}
              <Box>
                <FormControl fullWidth error={!!errors.project_type}>
                  <InputLabel>Тип проекта *</InputLabel>
                  <Select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleInputChange}
                    label="Тип проекта *"
                    sx={{ borderRadius: 6 }}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.project_type && <FormHelperText>{errors.project_type}</FormHelperText>}
                  {formData.project_type && (
                    <FormHelperText>
                      {PROJECT_TYPES.find(t => t.value === formData.project_type)?.description}
                    </FormHelperText>
                  )}
                </FormControl>
              </Box>

              {/* Название */}
              <Box>
                <TextField
                  fullWidth
                  label="Название проекта *"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="Например: Исследование применения ИИ в финансовой аналитике"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                />
              </Box>

              {/* Описание */}
              <Box>
                <TextField
                  fullWidth
                  label="Описание проекта *"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  error={!!errors.description}
                  helperText={errors.description || 'Минимум 50 символов'}
                  multiline
                  rows={4}
                  placeholder="Опишите цели, задачи и ожидаемые результаты проекта..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                />
              </Box>
            </Box>
          )}

          {/* ШАГ 2: Научная область */}
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h5" fontWeight="600">
                Научная область
              </Typography>

              {/* Научная область с автодополнением */}
              <Box>
                <FormControl fullWidth error={!!errors.scientific_field}>
                  <Autocomplete
                    freeSolo
                    options={allResearchFields}
                    value={formData.scientific_field}
                    onChange={(e, newValue) =>
                      setFormData({...formData, scientific_field: newValue || ''})
                    }
                    onInputChange={(e, newValue) =>
                      setFormData({...formData, scientific_field: newValue})
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Научная область *"
                        error={!!errors.scientific_field}
                        helperText={errors.scientific_field || 'Начните вводить или выберите из списка'}
                        placeholder="Искусственный интеллект, Экономика, Финансы..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                      />
                    )}
                  />
                </FormControl>
              </Box>

              {/* Компетенции */}
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="600">
                  Требуемые компетенции
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Укажите навыки и знания, необходимые для участия в проекте
                </Typography>

                <FormControl fullWidth margin="normal">
                  <Autocomplete
                    multiple
                    options={allCompetencies}
                    value={formData.required_competencies}
                    onChange={(e, newValue) =>
                      setFormData({...formData, required_competencies: newValue})
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            deleteIcon={<DeleteIcon />}
                            sx={{ borderRadius: 4 }}
                            {...tagProps}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Выберите компетенции"
                        placeholder="Начните вводить..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                      />
                    )}
                  />
                </FormControl>

                {/* Категории компетенций для быстрого выбора */}
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ mt: 2 }}>
                  Категории компетенций:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {Object.keys(COMPETENCIES).map((categoryKey) => (
                    <Chip
                      key={categoryKey}
                      label={COMPETENCIES[categoryKey].name}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const categoryItems = COMPETENCIES[categoryKey].items;
                        const newCompetencies = [...formData.required_competencies];
                        categoryItems.forEach(item => {
                          if (!newCompetencies.includes(item)) {
                            newCompetencies.push(item);
                          }
                        });
                        setFormData({
                          ...formData,
                          required_competencies: newCompetencies
                        });
                      }}
                      sx={{ borderRadius: 4 }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Теги */}
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="600">
                  Теги (ключевые слова)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Добавить тег"
                    value={formData.newTag}
                    onChange={(e) => setFormData({...formData, newTag: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            onClick={handleAddTag}
                            disabled={!formData.newTag.trim()}
                            size="small"
                            sx={{ borderRadius: 4 }}
                          >
                            <AddIcon />
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      deleteIcon={<DeleteIcon />}
                      sx={{ borderRadius: 4 }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* ШАГ 3: Участники и доступ */}
          {activeStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h5" fontWeight="600">
                Участники и доступ
              </Typography>

              <Grid container spacing={3}>
                {/* Максимальное число участников */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Максимальное число участников"
                    name="max_members"
                    type="number"
                    value={formData.max_members}
                    onChange={handleInputChange}
                    InputProps={{ inputProps: { min: 1, max: 50 } }}
                    helperText="0 = без ограничений"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                  />
                </Grid>

                {/* Дедлайн */}
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Срок сдачи (дедлайн)"
                    value={formData.deadline}
                    onChange={(newValue) => setFormData({...formData, deadline: newValue})}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: 6 } }
                      }
                    }}
                  />
                </Grid>

                {/* Статус проекта */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Статус проекта</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="Статус проекта"
                      sx={{ borderRadius: 6 }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{status.icon}</span>
                            <span>{status.label}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {STATUS_OPTIONS.find(s => s.value === formData.status)?.description}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                {/* Приватность */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="is_private"
                          checked={formData.is_private}
                          onChange={handleInputChange}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600">
                            {formData.is_private ? 'Закрытый проект' : 'Открытый проект'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formData.is_private
                              ? 'Только по приглашению. Проект не будет виден в публичном поиске.'
                              : 'Открытый проект. Будет виден в поиске для всех пользователей.'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Кнопки навигации */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={activeStep === 0 ? () => navigate('/projects') : handleBack}
              variant="outlined"
              startIcon={activeStep === 0 ? <ArrowBackIcon /> : null}
              size="large"
              sx={{ borderRadius: 6 }}
            >
              {activeStep === 0 ? 'Отмена' : 'Назад'}
            </Button>

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                size="large"
                sx={{ borderRadius: 6 }}
              >
                Далее
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={loading || success}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                size="large"
                sx={{ borderRadius: 6 }}
              >
                {loading ? 'Создание...' : 'Создать проект'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default CreateProjectPage;