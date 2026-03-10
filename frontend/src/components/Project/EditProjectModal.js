// frontend/src/components/Project/EditProjectModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  alpha,
  useTheme,
  Switch,
  FormControlLabel,
  InputAdornment,
  Grid,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Science as ScienceIcon,
  People as PeopleIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

// 🔥 ИСПРАВЛЕННЫЕ ПУТИ
import { projectsAPI } from '../../services/api';
import {
  RESEARCH_FIELDS,
  COMPETENCIES,
  getAllResearchFields
} from '../../data/scienceData';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 700,
    minWidth: 600,
    maxHeight: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: theme.palette.grey[50],
    boxShadow: theme.shadows[0]
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(3),
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.grey[600],
    },
  }
}));

const TypeCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(5),
  border: '0.5px solid',
  borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.02) : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: theme.shadows[0],
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

const StatusCard = styled(Paper)(({ theme, selected, statusColor }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(5),
  border: '0.5px solid',
  borderColor: selected ? statusColor : theme.palette.divider,
  backgroundColor: selected ? alpha(statusColor, 0.05) : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: theme.shadows[0],
  '&:hover': {
    borderColor: statusColor,
    backgroundColor: alpha(statusColor, 0.05)
  }
}));

// Константы
const PROJECT_TYPES = [
  { value: 'research_paper', label: 'Научная статья', icon: '📄', color: '#4361ee' },
  { value: 'dissertation', label: 'Диссертация', icon: '📚', color: '#3a0ca3' },
  { value: 'grant', label: 'Грантовый проект', icon: '💰', color: '#7209b7' },
  { value: 'conference', label: 'Подготовка к конференции', icon: '🎤', color: '#f72585' },
  { value: 'book', label: 'Книга/Монография', icon: '📖', color: '#4cc9f0' },
  { value: 'creative', label: 'Творческий проект', icon: '🎨', color: '#f8961e' },
  { value: 'other', label: 'Другой тип', icon: '🔬', color: '#f94144' }
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Черновик', icon: '📝', color: '#9e9e9e', description: 'Проект виден только вам' },
  { value: 'recruiting', label: 'Набор участников', icon: '🔍', color: '#2196f3', description: 'Проект виден всем, можно приглашать участников' },
  { value: 'active', label: 'Активный', icon: '⚡', color: '#4caf50', description: 'Проект активен, работа в процессе' },
  { value: 'completed', label: 'Завершен', icon: '✅', color: '#9c27b0', description: 'Проект завершен, все задачи выполнены' },
  { value: 'on_hold', label: 'На паузе', icon: '⏸️', color: '#ff9800', description: 'Проект приостановлен' },
  { value: 'archived', label: 'В архиве', icon: '📦', color: '#607d8b', description: 'Проект в архиве, только чтение' }
];

const EditProjectModal = ({ open, onClose, project, onSave }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Состояния формы
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'research_paper',
    scientific_field: '',
    required_competencies: [],
    tags: [],
    max_members: 5,
    is_private: false,
    status: 'draft',
    deadline: null
  });

  // Для автокомплита
  const allResearchFields = getAllResearchFields();
  const allCompetencies = (() => {
    const all = [];
    Object.values(COMPETENCIES).forEach(category => {
      all.push(...category.items);
    });
    return all.sort();
  })();

  // Состояния для новых тегов/компетенций
  const [newCompetency, setNewCompetency] = useState('');
  const [newTag, setNewTag] = useState('');

  // Загружаем данные проекта при открытии
  useEffect(() => {
    if (open && project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        project_type: project.project_type || 'research_paper',
        scientific_field: project.scientific_field || '',
        required_competencies: project.required_competencies || [],
        tags: project.tags || [],
        max_members: project.max_members || 5,
        is_private: project.is_private || false,
        status: project.status || 'draft',
        deadline: project.deadline ? new Date(project.deadline) : null
      });
      setError('');
      setSuccess(false);
    }
  }, [open, project]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddCompetency = () => {
    if (newCompetency.trim() && !formData.required_competencies.includes(newCompetency.trim())) {
      setFormData(prev => ({
        ...prev,
        required_competencies: [...prev.required_competencies, newCompetency.trim()]
      }));
      setNewCompetency('');
    }
  };

  const handleRemoveCompetency = (competency) => {
    setFormData(prev => ({
      ...prev,
      required_competencies: prev.required_competencies.filter(c => c !== competency)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Введите название проекта');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Введите описание проекта');
      return false;
    }
    if (formData.description.length < 50) {
      setError('Описание должно быть не менее 50 символов');
      return false;
    }
    if (!formData.scientific_field.trim()) {
      setError('Укажите научную область');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        deadline: formData.deadline ? formData.deadline.toISOString().split('T')[0] : null
      };

      console.log('📦 Отправка данных на сервер:', submitData);

      const response = await projectsAPI.patch(project.id, submitData);

      console.log('✅ Проект обновлен:', response);

      setSuccess(true);

      setTimeout(() => {
        onSave(response);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Ошибка обновления проекта:', err);
      setError(err.response?.data?.message || err.message || 'Не удалось обновить проект');
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeIcon = (type) => {
    const found = PROJECT_TYPES.find(t => t.value === type);
    return found?.icon || '📄';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <StyledDialog open={open} onClose={onClose} maxWidth={false} fullWidth={false}>
        <StyledDialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EditIcon sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight="700">
              Редактирование проекта
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white', borderRadius: theme.spacing(1.5) }}>
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>

        <StyledDialogContent>
          {/* Заголовок проекта */}
          <Box sx={{ mt: 1, mb: 3 }}>
            <Typography variant="h4" fontWeight="700" color="primary.main">
              {project?.title || 'Проект'}
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
              Проект успешно обновлен!
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
              {error}
            </Alert>
          )}

          {/* Тип проекта */}
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            Тип проекта
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            {PROJECT_TYPES.map((type) => (
              <Grid item xs={6} key={type.value}>
                <TypeCard
                  selected={formData.project_type === type.value}
                  onClick={() => setFormData(prev => ({ ...prev, project_type: type.value }))}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h5">{type.icon}</Typography>
                    <Typography variant="subtitle2" fontWeight="600">
                      {type.label}
                    </Typography>
                  </Box>
                </TypeCard>
              </Grid>
            ))}
          </Grid>

          {/* Основная информация */}
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            Основная информация
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
            <TextField
              fullWidth
              label="Название проекта *"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Например: Исследование применения ИИ в финансовой аналитике"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label="Описание проекта *"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Опишите цели, задачи и ожидаемые результаты проекта..."
              multiline
              rows={4}
              helperText="Минимум 50 символов"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Box>

          {/* Научная область */}
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            Научная область
          </Typography>

          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth>
              <TextField
                select
                fullWidth
                label="Научная область *"
                name="scientific_field"
                value={formData.scientific_field}
                onChange={handleInputChange}
                SelectProps={{
                  native: false
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              >
                {allResearchFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    {field}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
          </Box>

          {/* Компетенции */}
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            Требуемые компетенции
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Добавить компетенцию"
                value={newCompetency}
                onChange={(e) => setNewCompetency(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCompetency()}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <Button
                variant="outlined"
                onClick={handleAddCompetency}
                disabled={!newCompetency.trim()}
                sx={{ borderRadius: 3 }}
              >
                <AddIcon />
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.required_competencies.map((comp, index) => (
                <Chip
                  key={index}
                  label={comp}
                  onDelete={() => handleRemoveCompetency(comp)}
                  deleteIcon={<DeleteIcon />}
                  sx={{ borderRadius: 3 }}
                />
              ))}
            </Box>
          </Box>

          {/* Теги */}
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            Теги (ключевые слова)
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Добавить тег"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                sx={{ borderRadius: 3 }}
              >
                <AddIcon />
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  deleteIcon={<DeleteIcon />}
                  sx={{ borderRadius: 3 }}
                />
              ))}
            </Box>
          </Box>

          {/* Статус проекта */}
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            Статус проекта
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            {STATUS_OPTIONS.map((status) => (
              <Grid item xs={6} key={status.value}>
                <StatusCard
                  selected={formData.status === status.value}
                  statusColor={status.color}
                  onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6">{status.icon}</Typography>
                    <Typography variant="subtitle2" fontWeight="600">
                      {status.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {status.description}
                  </Typography>
                </StatusCard>
              </Grid>
            ))}
          </Grid>

          {/* Дополнительные настройки */}
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
            Дополнительные настройки
          </Typography>

          <Grid container spacing={3} sx={{ mb: 2 }}>
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Срок сдачи (дедлайн)"
                value={formData.deadline}
                onChange={(newValue) => setFormData(prev => ({ ...prev, deadline: newValue }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { '& .MuiOutlinedInput-root': { borderRadius: 3 } }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 5 }}>
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
        </StyledDialogContent>

        <DialogActions sx={{ p: 3, pt: 0, gap: 1, justifyContent: 'flex-end' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ borderRadius: 5, px: 4 }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading || success}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ borderRadius: 5, px: 4 }}
          >
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </DialogActions>
      </StyledDialog>
    </LocalizationProvider>
  );
};

export default EditProjectModal;