// frontend/src/pages/CreateEventPage.js
import React, { useState, useEffect } from 'react';
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
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { eventsAPI, scheduleAPI } from '../services/eventsAPI';
import { UNIVERSITY_BRANCHES } from '../data/scienceData';
import { useAuth } from '../contexts/AuthContext';

// Константы для типов мероприятий
const EVENT_TYPES = [
  { value: 'conference', label: 'Конференция', icon: '🗣️', color: '#4361ee', hasSections: true },
  { value: 'seminar', label: 'Семинар', icon: '📚', color: '#3a0ca3', hasSections: false },
  { value: 'symposium', label: 'Симпозиум', icon: '🔬', color: '#7209b7', hasSections: true },
  { value: 'workshop', label: 'Воркшоп', icon: '🛠️', color: '#f72585', hasSections: false },
  { value: 'school', label: 'Школа', icon: '🏫', color: '#4cc9f0', hasSections: true },
  { value: 'congress', label: 'Конгресс', icon: '🌍', color: '#4895ef', hasSections: true },
  { value: 'forum', label: 'Форум', icon: '🗣️', color: '#560bad', hasSections: true },
  { value: 'roundtable', label: 'Круглый стол', icon: '🔄', color: '#b5179e', hasSections: false },
  { value: 'competition', label: 'Конкурс', icon: '🏆', color: '#f8961e', hasSections: false },
  { value: 'festival', label: 'Фестиваль', icon: '🎪', color: '#f94144', hasSections: true }
];

// Константы для уровней мероприятий
const EVENT_LEVELS = [
  { value: 'international', label: 'Международный', color: '#9C27B0' },
  { value: 'national', label: 'Всероссийский', color: '#2196F3' },
  { value: 'interregional', label: 'Межрегиональный', color: '#4CAF50' },
  { value: 'regional', label: 'Региональный', color: '#FF9800' },
  { value: 'university', label: 'Внутривузовский', color: '#795548' }
];

const STEPS = ['Основная информация', 'Секции', 'Документы', 'Проверка'];

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Данные формы
  const [formData, setFormData] = useState({
    type: '',
    level: '',
    title: '',
    short_description: '',
    description: '',
    start_date: null,
    end_date: null,
    registration_deadline: null,
    organizer_branches: [],
    sections: [],
    documents: []
  });

  // Для секций
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');

  // Для документов
  const [documentFiles, setDocumentFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Ошибки валидации
  const [errors, setErrors] = useState({});

  // Определяем, нужно ли показывать секции
  const selectedType = EVENT_TYPES.find(t => t.value === formData.type);
  const showSections = selectedType?.hasSections || false;

  // Валидация шага
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.type) newErrors.type = 'Выберите тип мероприятия';
      if (!formData.level) newErrors.level = 'Выберите уровень мероприятия';
      if (!formData.title.trim()) newErrors.title = 'Введите название мероприятия';
      if (!formData.short_description.trim()) newErrors.short_description = 'Введите краткое описание';
      if (!formData.start_date) newErrors.start_date = 'Укажите дату начала';
      if (!formData.end_date) newErrors.end_date = 'Укажите дату окончания';
      if (!formData.registration_deadline) newErrors.registration_deadline = 'Укажите дедлайн регистрации';
      if (formData.organizer_branches.length === 0) newErrors.organizer_branches = 'Укажите филиалы-организаторы';

      if (formData.start_date && formData.end_date) {
        if (new Date(formData.start_date) > new Date(formData.end_date)) {
          newErrors.end_date = 'Дата окончания не может быть раньше даты начала';
        }
      }

      if (formData.registration_deadline && formData.start_date) {
        if (new Date(formData.registration_deadline) > new Date(formData.start_date)) {
          newErrors.registration_deadline = 'Дедлайн регистрации должен быть раньше даты начала';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddSection = () => {
    if (sectionTitle.trim()) {
      setFormData(prev => ({
        ...prev,
        sections: [
          ...prev.sections,
          {
            id: Date.now(),
            title: sectionTitle,
            description: sectionDescription
          }
        ]
      }));
      setSectionTitle('');
      setSectionDescription('');
    }
  };

  const handleRemoveSection = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      file: file,
      url: URL.createObjectURL(file)
    }));

    setDocumentFiles(prev => [...prev, ...newFiles]);

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...newFiles]
    }));

    setUploading(false);
  };

  const handleRemoveFile = (fileId) => {
    setDocumentFiles(prev => prev.filter(f => f.id !== fileId));
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(f => f.id !== fileId)
    }));
  };

  // 🔥 ОБНОВЛЁННЫЙ handleSubmit с передачей event ID
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Подготавливаем документы для отправки
      const documentsToSend = formData.documents.map(f => ({
        name: f.name,
        size: f.size,
        url: f.url
      }));

      const eventData = {
        title: formData.title,
        description: formData.description?.trim() || formData.short_description || 'Описание мероприятия',
        short_description: formData.short_description,
        type: formData.type,
        level: formData.level,
        has_sections: showSections,
        start_date: formData.start_date?.toISOString().split('T')[0],
        end_date: formData.end_date?.toISOString().split('T')[0],
        registration_deadline: formData.registration_deadline?.toISOString().split('T')[0],
        organizer_branches: formData.organizer_branches,
        sections_data: formData.sections.map(s => ({
          title: s.title,
          description: s.description || ''
        })),
        documents: documentsToSend
      };

      console.log('📦 Подготовленные данные для отправки:', JSON.stringify(eventData, null, 2));

      // Создаём мероприятие
      const response = await eventsAPI.createEvent(eventData);
      console.log('📦 Ответ от сервера:', response);
      console.log('📦 ID созданного мероприятия:', response.id);

      // Базовая дата начала мероприятия
      const baseDate = formData.start_date || new Date();

      // 🔥 СОЗДАЁМ ПУНКТ "ПЛЕНАРНОЕ ЗАСЕДАНИЕ" С ПЕРЕДАЧЕЙ event ID
      const plenaryStartTime = new Date(baseDate);
      plenaryStartTime.setHours(9, 0, 0, 0); // Пленарное начинается в 9:00

      const plenaryData = {
        event: response.id,  // 🔥 ВАЖНО: передаём ID мероприятия
        section: null,
        is_plenary: true,
        participant: null,
        title: 'Пленарное заседание',
        description: 'Открытие конференции, приветственные слова, пленарные доклады',
        start_time: plenaryStartTime.toISOString(),
        order: 0
      };

      console.log('📦 Создание пленарного заседания с данными:', plenaryData);

      try {
        const plenaryResponse = await scheduleAPI.createScheduleItem(plenaryData);
        console.log('✅ Создан пункт "Пленарное заседание":', plenaryResponse);
      } catch (err) {
        console.error('❌ Ошибка создания пленарного заседания:', err);
        console.error('❌ Детали ошибки:', err.response?.data);
      }

      // 🔥 СОЗДАЁМ ПУНКТЫ ПРОГРАММЫ ДЛЯ СЕКЦИЙ С ПЕРЕДАЧЕЙ event ID
      if (showSections && formData.sections.length > 0) {
        console.log('📝 Создаём пункты программы для секций...');

        // Получаем созданные секции из ответа
        let createdSections = [];

        if (response.sections) {
          createdSections = response.sections;
          console.log('📋 Найдены секции в response.sections:', createdSections);
        } else if (response.created_sections) {
          createdSections = response.created_sections;
          console.log('📋 Найдены секции в response.created_sections:', createdSections);
        } else {
          // Если секции не пришли в ответе, пробуем загрузить их отдельно
          console.log('⚠️ Секции не найдены в ответе, пробуем загрузить...');
          try {
            const sectionsResponse = await eventsAPI.getEventById(response.id);
            createdSections = sectionsResponse.sections || [];
            console.log('📋 Загруженные секции:', createdSections);
          } catch (err) {
            console.error('❌ Ошибка загрузки секций:', err);
          }
        }

        if (createdSections.length === 0) {
          console.warn('⚠️ Нет созданных секций для добавления в программу');
        } else {
          console.log(`📋 Найдено ${createdSections.length} секций для добавления в программу`);
        }

        const startTime = new Date(baseDate);
        startTime.setHours(10, 0, 0, 0); // Первая секция в 10:00

        for (let i = 0; i < createdSections.length; i++) {
          const section = createdSections[i];
          const sectionStartTime = new Date(startTime);
          sectionStartTime.setHours(startTime.getHours() + i); // Каждая следующая секция +1 час

          const scheduleData = {
            event: response.id,  // 🔥 ВАЖНО: передаём ID мероприятия
            section: section.id,
            is_plenary: false,
            participant: null,
            title: section.title,
            description: section.description || '',
            start_time: sectionStartTime.toISOString(),
            order: i + 1 // Порядок: после пленарного (order=0)
          };

          console.log(`📦 Отправка данных для секции ${section.title}:`, scheduleData);

          try {
            const scheduleResponse = await scheduleAPI.createScheduleItem(scheduleData);
            console.log(`✅ Создан пункт программы для секции: ${section.title}`, scheduleResponse);
          } catch (err) {
            console.error(`❌ Ошибка создания пункта для секции ${section.title}:`, err);
            console.error('❌ Детали ошибки:', err.response?.data);
          }
        }
      }

      setSuccess(true);

      setTimeout(() => {
        navigate(`/events/${response.id}`);
      }, 1500);

    } catch (err) {
      console.error('❌ Ошибка создания мероприятия:', err);
      console.error('❌ Детали ошибки:', err.response?.data);
      setError(err.message || 'Не удалось создать мероприятие');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTypeIcon = (typeValue) => {
    const type = EVENT_TYPES.find(t => t.value === typeValue);
    return type?.icon || '📅';
  };

  const getTypeColor = (typeValue) => {
    const type = EVENT_TYPES.find(t => t.value === typeValue);
    return type?.color || '#4361ee';
  };

  const getLevelColor = (levelValue) => {
    const level = EVENT_LEVELS.find(l => l.value === levelValue);
    return level?.color || '#9C27B0';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        {/* Заголовок */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/events')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="600">
            Создание мероприятия
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
            Мероприятие успешно создано! Перенаправляем...
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

              <Box>
                <FormControl fullWidth error={!!errors.type}>
                  <InputLabel>Тип мероприятия *</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    label="Тип мероприятия *"
                    sx={{ borderRadius: 6 }}
                  >
                    {EVENT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
                </FormControl>
              </Box>

              <Box>
                <FormControl fullWidth error={!!errors.level}>
                  <InputLabel>Уровень мероприятия *</InputLabel>
                  <Select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    label="Уровень мероприятия *"
                    sx={{ borderRadius: 6 }}
                  >
                    {EVENT_LEVELS.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.level && <FormHelperText>{errors.level}</FormHelperText>}
                </FormControl>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Название мероприятия *"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Краткое описание *"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  error={!!errors.short_description}
                  helperText={errors.short_description || 'Максимум 300 символов'}
                  inputProps={{ maxLength: 300 }}
                  multiline
                  rows={3}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Полное описание (необязательно)"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={5}
                  helperText="Подробная информация о мероприятии"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" fontWeight="600">
                Даты и место проведения
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Дата начала *"
                    value={formData.start_date}
                    onChange={(date) => handleDateChange('start_date', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.start_date,
                        helperText: errors.start_date,
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: 6 } }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Дата окончания *"
                    value={formData.end_date}
                    onChange={(date) => handleDateChange('end_date', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.end_date,
                        helperText: errors.end_date,
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: 6 } }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Дедлайн регистрации *"
                    value={formData.registration_deadline}
                    onChange={(date) => handleDateChange('registration_deadline', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.registration_deadline,
                        helperText: errors.registration_deadline,
                        sx: { '& .MuiOutlinedInput-root': { borderRadius: 6 } }
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <Box>
                <Autocomplete
                  multiple
                  options={UNIVERSITY_BRANCHES}
                  value={formData.organizer_branches}
                  onChange={(e, newValue) => {
                    setFormData(prev => ({ ...prev, organizer_branches: newValue }));
                    if (errors.organizer_branches) {
                      setErrors(prev => ({ ...prev, organizer_branches: '' }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Филиалы-организаторы *"
                      error={!!errors.organizer_branches}
                      helperText={errors.organizer_branches}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        sx={{ borderRadius: 4 }}
                      />
                    ))
                  }
                />
              </Box>
            </Box>
          )}

          {/* ШАГ 2: Секции */}
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h5" fontWeight="600">
                Секции мероприятия
              </Typography>

              {!showSections ? (
                <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 6 }}>
                  Для выбранного типа мероприятия секции не предусмотрены
                </Alert>
              ) : (
                <>
                  <Card variant="outlined" sx={{ p: 3, borderRadius: 6, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        size="medium"
                        label="Название секции"
                        value={sectionTitle}
                        onChange={(e) => setSectionTitle(e.target.value)}
                        placeholder="Например: Секция экономики"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                      />

                      <TextField
                        fullWidth
                        size="medium"
                        label="Описание (опционально)"
                        value={sectionDescription}
                        onChange={(e) => setSectionDescription(e.target.value)}
                        placeholder="Кратко о тематике секции"
                        multiline
                        rows={2}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                      />

                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddSection}
                        disabled={!sectionTitle.trim()}
                        sx={{ borderRadius: 6, height: '56px' }}
                      >
                        Добавить секцию
                      </Button>
                    </Box>
                  </Card>

                  {formData.sections.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle1" fontWeight="600" color="primary">
                        Добавленные секции:
                      </Typography>
                      {formData.sections.map((section, index) => {
                        const colors = ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0'];
                        const color = colors[index % colors.length];

                        return (
                          <Card key={section.id} variant="outlined" sx={{ borderRadius: 6 }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>
                                    {index + 1}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight="600">
                                      {section.title}
                                    </Typography>
                                    {section.description && (
                                      <Typography variant="body2" color="text.secondary">
                                        {section.description}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveSection(section.id)}
                                  sx={{ borderRadius: 4 }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  ) : (
                    <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 6 }}>
                      Секции не добавлены. Вы можете добавить их позже на странице мероприятия.
                    </Alert>
                  )}
                </>
              )}
            </Box>
          )}

          {/* ШАГ 3: Документы */}
          {activeStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h5" fontWeight="600">
                Документы мероприятия
              </Typography>

              <Card variant="outlined" sx={{ p: 4, borderRadius: 6, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', textAlign: 'center' }}>
                  <FolderIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />

                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Загрузите документы
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Положение, программа, требования и другие материалы
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploading}
                    sx={{ borderRadius: 6, px: 4, py: 1.5 }}
                  >
                    {uploading ? 'Загрузка...' : 'Выбрать файлы'}
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Box>
              </Card>

              {formData.documents.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle1" fontWeight="600" color="primary">
                    Загруженные файлы ({formData.documents.length}):
                  </Typography>
                  <List sx={{ bgcolor: 'background.paper', borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
                    {formData.documents.map((file) => (
                      <ListItem
                        key={file.id}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveFile(file.id)}
                            sx={{ borderRadius: 4 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <DescriptionIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={formatFileSize(file.size)}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}

          {/* ШАГ 4: Проверка */}
          {activeStep === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Проверьте данные
              </Typography>

              {/* Карточка мероприятия */}
              <Card sx={{ borderRadius: 6, overflow: 'hidden' }}>
                {/* Цветная шапка */}
                <Box sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${getTypeColor(formData.type)} 0%, ${getLevelColor(formData.level)} 100%)`,
                  color: 'white'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'white', color: getTypeColor(formData.type) }}>
                      {getTypeIcon(formData.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="700">
                        {formData.title || 'Название мероприятия'}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {EVENT_TYPES.find(t => t.value === formData.type)?.label} • {EVENT_LEVELS.find(l => l.value === formData.level)?.label}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Основная информация */}
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* Краткое описание */}
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Краткое описание
                      </Typography>
                      <Typography variant="body1">
                        {formData.short_description || '—'}
                      </Typography>
                    </Grid>

                    {/* Полное описание (если есть) */}
                    {formData.description && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Полное описание
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {formData.description}
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Даты */}
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Дата начала
                          </Typography>
                          <Typography variant="body2">
                            {formData.start_date?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Дата окончания
                          </Typography>
                          <Typography variant="body2">
                            {formData.end_date?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Дедлайн
                          </Typography>
                          <Typography variant="body2">
                            {formData.registration_deadline?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Филиалы */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="500">
                          Филиалы-организаторы
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {formData.organizer_branches.length > 0 ? (
                          formData.organizer_branches.map((branch, index) => (
                            <Chip key={index} label={branch} size="small" sx={{ borderRadius: 4 }} />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* Секции */}
                    {showSections && formData.sections.length > 0 && (
                      <>
                        <Grid item xs={12}>
                          <Divider />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Секции ({formData.sections.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {formData.sections.map((section, index) => (
                              <Paper key={section.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                                <Typography variant="body2" fontWeight="500">
                                  {index + 1}. {section.title}
                                </Typography>
                                {section.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {section.description}
                                  </Typography>
                                )}
                              </Paper>
                            ))}
                          </Box>
                        </Grid>
                      </>
                    )}

                    {/* Документы */}
                    {formData.documents.length > 0 && (
                      <>
                        <Grid item xs={12}>
                          <Divider />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Документы ({formData.documents.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {formData.documents.map((file, index) => (
                              <Typography key={file.id} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <DescriptionIcon fontSize="small" color="action" />
                                {file.name} ({formatFileSize(file.size)})
                              </Typography>
                            ))}
                          </Box>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Кнопки навигации */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={activeStep === 0 ? () => navigate('/events') : handleBack}
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
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                size="large"
                sx={{ borderRadius: 6 }}
              >
                {loading ? 'Создание...' : 'Создать мероприятие'}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default CreateEventPage;