// frontend/src/components/Events/EditSectionModal.js
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
  Alert,
  CircularProgress,
  useTheme,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { sectionsAPI } from '../../services/eventsAPI';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 600,
    width: '100%',
    maxHeight: '90vh',
    backgroundColor: theme.palette.grey[50]
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

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.9rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: theme.spacing(1),
  marginTop: theme.spacing(2)
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const EditSectionModal = ({
  open,
  onClose,
  section,
  onSave
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Данные формы
  const [formData, setFormData] = useState({
    title: '',
    description: '',  // для шапки (краткое описание)
    about: ''         // для блока "О секции" (подробное описание)
  });

  // Валидация
  const [errors, setErrors] = useState({});

  // 🔥 ИСПРАВЛЕНО: при открытии сбрасываем все состояния
  useEffect(() => {
    if (open) {
      // Сбрасываем состояния загрузки и ошибок
      setLoading(false);
      setError('');
      setSuccess(false);

      if (section) {
        setFormData({
          title: section.title || '',
          description: section.description || '',
          about: section.about || ''
        });
      }
      setErrors({});
    }
  }, [open, section]);

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Введите название секции';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        about: formData.about
      };

      const response = await sectionsAPI.updateSection(section.id, updateData);

      setSuccess(true);

      // Даем время увидеть сообщение об успехе
      setTimeout(() => {
        onClose();
        if (onSave) onSave(response);
      }, 1500);

    } catch (err) {
      console.error('❌ Ошибка сохранения секции:', err);
      setError(err.response?.data?.error || 'Не удалось сохранить изменения');
      setLoading(false); // 🔥 ВАЖНО: сбрасываем loading при ошибке
    }
  };

  const handleFormCancel = () => {
    onClose();
  };

  return (
    <StyledDialog open={open} onClose={handleFormCancel} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MenuBookIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            Редактирование секции
          </Typography>
        </Box>
        <IconButton onClick={handleFormCancel} sx={{ color: 'white', borderRadius: theme.spacing(1.5) }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
            Изменения успешно сохранены!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
            {error}
          </Alert>
        )}

        {/* Название секции */}
        <TextField
          fullWidth
          label="Название секции *"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          error={!!errors.title}
          helperText={errors.title}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'white'
            }
          }}
        />

        <Divider sx={{ my: 2 }} />

        {/* Краткое описание для шапки */}
        <SectionTitle>
          Краткое описание (для шапки)
        </SectionTitle>
        <TextField
          fullWidth
          label="Краткое описание"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          multiline
          rows={3}
          placeholder="Краткое описание, которое будет отображаться в шапке секции"
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'white'
            }
          }}
        />

        {/* Подробная информация для блока "О секции" */}
        <SectionTitle>
          Подробная информация (блок "О секции")
        </SectionTitle>
        <TextField
          fullWidth
          label="Подробная информация"
          name="about"
          value={formData.about}
          onChange={handleInputChange}
          multiline
          rows={6}
          placeholder="Введите подробную информацию о секции, её тематике, направлениях работы, требованиях к докладам и т.д."
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'white'
            }
          }}
        />
      </StyledDialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button
          onClick={handleFormCancel}
          variant="outlined"
          startIcon={<CancelIcon />}
          sx={{ borderRadius: 5, px: 4 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          sx={{ borderRadius: 5, px: 4 }}
        >
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default EditSectionModal;