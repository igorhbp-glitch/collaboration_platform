// frontend/src/components/Events/EditEventModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  FormHelperText,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { styled } from '@mui/material/styles';
import { eventsAPI } from '../../services/eventsAPI';
import { UNIVERSITY_BRANCHES } from '../../data/scienceData';

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

const STEPS = ['Основная информация', 'Даты и место', 'Секции', 'Документы'];

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 800,
    maxHeight: '90vh'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

const EditEventModal = ({ open, onClose, event, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    documents: [],
    additional_info: ''
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

  // Заполняем форму данными мероприятия при открытии
  useEffect(() => {
    if (event && open) {
      setFormData({
        type: event.type || '',
        level: event.level || '',
        title: event.title || '',
        short_description: event.short_description || '',
        description: event.description || '',
        start_date: event.start_date ? new Date(event.start_date) : null,
        end_date: event.end_date ? new Date(event.end_date) : null,
        registration_deadline: event.registration_deadline ? new Date(event.registration_deadline) : null,
        organizer_branches: event.organizer_branches || [],
        sections: event.sections || [],
        documents: event.documents || [],
        additional_info: event.additional_info || ''
      });
      setDocumentFiles([]);
      setActiveStep(0);
      setErrors({});
    }
  }, [event, open]);

  // Валидация шага
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.type) newErrors.type = 'Выберите тип мероприятия';
      if (!formData.level) newErrors.level = 'Выберите уровень мероприятия';
      if (!formData.title.trim()) newErrors.title = 'Введите название мероприятия';
      if (!formData.short_description.trim()) newErrors.short_description = 'Введите краткое описание';
    }

    if (step === 1) {
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
    setUploading(false);
  };

  const handleRemoveFile = (fileId) => {
    setDocumentFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 🔥 ОБНОВЛЕННЫЙ МЕТОД ОТПРАВКИ

const handleSubmit = async () => {
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    // Финальная валидация
    if (!formData.type || !formData.level || !formData.title.trim() || !formData.short_description.trim()) {
      setError('Пожалуйста, заполните все обязательные поля');
      setLoading(false);
      return;
    }

    // 🔥 ИСПРАВЛЕНО: подготавливаем секции со всеми существующими полями
    const sectionsToSend = formData.sections.map(section => ({
      id: section.id,  // ID существующей секции (важно!)
      title: section.title,
      description: section.description || '',
      // 🔥 ДОБАВЛЯЕМ ВСЕ СУЩЕСТВУЮЩИЕ ПОЛЯ
      about: section.about || '',
      cover_images: section.cover_images || [],
      color: section.color || '#4CAF50',
      // можно добавить и другие поля, если они есть в модели
    }));

    const eventData = {
      ...formData,
      start_date: formData.start_date?.toISOString().split('T')[0],
      end_date: formData.end_date?.toISOString().split('T')[0],
      registration_deadline: formData.registration_deadline?.toISOString().split('T')[0],
      documents: [...formData.documents, ...documentFiles.map(f => ({
        name: f.name,
        size: f.size,
        url: f.url
      }))],
      sections_data: sectionsToSend,
      has_sections: formData.sections.length > 0
    };

    const response = await eventsAPI.updateEvent(event.id, eventData);
    setSuccess('Изменения успешно сохранены!');

    if (onSave) {
      onSave(response);
    }

    setTimeout(() => {
      onClose();
    }, 1500);

  } catch (err) {
    console.error('❌ Ошибка сохранения:', err);
    setError('Не удалось сохранить изменения');
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <StyledDialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon />
            <Typography variant="h6" fontWeight="600">
              Редактирование мероприятия
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Степпер */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
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
              {success}
            </Alert>
          )}

          {/* ШАГ 1: Основная информация */}
          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                  label="Полное описание"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={5}
                  helperText="Подробная информация о мероприятии"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                />
              </Box>
            </Box>
          )}

          {/* ШАГ 2: Даты и место */}
          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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

                <Grid item xs={12}>
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
                </Grid>
              </Grid>

              <Box>
                <TextField
                  fullWidth
                  label="Дополнительная информация"
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  helperText="История, цели, дополнительная информация о мероприятии"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
                />
              </Box>
            </Box>
          )}

          {/* ШАГ 3: Секции */}
          {activeStep === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {!showSections ? (
                <Alert severity="info" icon={<EventIcon />} sx={{ borderRadius: 6 }}>
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

                  {formData.sections.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle1" fontWeight="600" color="primary">
                        Текущие секции:
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
                  )}
                </>
              )}
            </Box>
          )}

          {/* ШАГ 4: Документы */}
{activeStep === 3 && (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Card variant="outlined" sx={{ p: 4, borderRadius: 6, bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', textAlign: 'center' }}>
        <FolderIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Загрузите дополнительные документы
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

    {formData.documents && formData.documents.length > 0 && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight="600" color="primary">
          Существующие документы:
        </Typography>
        <List sx={{ bgcolor: 'background.paper', borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
          {formData.documents
            .filter(doc => doc !== null && doc !== undefined)
            .map((doc, index) => (
              <ListItem key={doc?.id || index}>
                <ListItemIcon>
                  <DescriptionIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={doc?.name || 'Документ'}
                  secondary={doc?.size ? formatFileSize(doc.size) : ''}
                />
              </ListItem>
            ))}
        </List>
      </Box>
    )}

    {documentFiles.length > 0 && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight="600" color="primary">
          Новые документы:
        </Typography>
        <List sx={{ bgcolor: 'background.paper', borderRadius: 6, border: '1px solid', borderColor: 'divider' }}>
          {documentFiles
            .filter(file => file !== null && file !== undefined)
            .map((file) => (
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
                  primary={file.name || 'Документ'}
                  secondary={formatFileSize(file.size)}
                />
              </ListItem>
            ))}
        </List>
      </Box>
    )}
  </Box>
)}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={activeStep === 0 ? onClose : handleBack}
            variant="outlined"
            startIcon={activeStep === 0 ? <CloseIcon /> : <ArrowBackIcon />}
            sx={{ borderRadius: 6, px: 3 }}
          >
            {activeStep === 0 ? 'Отмена' : 'Назад'}
          </Button>

          {activeStep < STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ borderRadius: 6, px: 4 }}
            >
              Далее
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ borderRadius: 6, px: 4 }}
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          )}
        </DialogActions>
      </StyledDialog>
    </LocalizationProvider>
  );
};

export default EditEventModal;