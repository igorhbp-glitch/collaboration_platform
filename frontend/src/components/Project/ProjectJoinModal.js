// frontend/src/components/Project/ProjectJoinModal.js
import React, { useState } from 'react';
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
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  alpha,
  useTheme,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { projectsAPI } from '../../services/api';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ (как в EventParticipateModal)
// ============================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 600,
    minWidth: 500,
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

const RoleCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
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

// ============================================
// КОНСТАНТЫ - 🔥 ТОЛЬКО ЗДЕСЬ ДОБАВЛЕНЫ РОЛИ
// ============================================

const PROJECT_ROLES = [
  // 🔥 НОВЫЕ РУКОВОДЯЩИЕ РОЛИ
  { value: 'scrum_master', label: 'Scrum Master (Менеджер проекта)', icon: '🔄', description: 'Управление процессом, организация работы команды' },
  { value: 'lead_researcher', label: 'Lead Researcher (Ведущий исследователь)', icon: '🎯', description: 'Руководство исследовательским направлением' },

  // Существующие роли (БЕЗ ИЗМЕНЕНИЙ)
  { value: 'researcher', label: 'Исследователь', icon: '🔬', description: 'Проведение исследований, анализ данных' },
  { value: 'analyst', label: 'Аналитик', icon: '📊', description: 'Анализ данных, подготовка отчетов' },
  { value: 'writer', label: 'Автор текста', icon: '✍️', description: 'Написание статей, оформление результатов' },
  { value: 'reviewer', label: 'Рецензент', icon: '👁️', description: 'Проверка и рецензирование материалов' },
  { value: 'editor', label: 'Редактор', icon: '📝', description: 'Редактирование, корректура' },
  { value: 'assistant', label: 'Ассистент', icon: '🤝', description: 'Помощь в организации работы' }
];

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ (БЕЗ ИЗМЕНЕНИЙ)
// ============================================

const ProjectJoinModal = ({ open, onClose, projectId, projectTitle, onSuccess }) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('researcher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!selectedRole) {
      setError('Выберите желаемую роль');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const data = {
        message: message.trim(),
        role: selectedRole
      };

      console.log('📦 Отправка заявки:', { projectId, ...data });

      const response = await projectsAPI.requestJoin(projectId, data);

      console.log('✅ Заявка отправлена:', response);

      setSuccess(true);

      setTimeout(() => {
        if (onSuccess) onSuccess(response);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Ошибка при подаче заявки:', err);
      setError(err.message || 'Не удалось отправить заявку');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !success) {
      onClose();
    }
  };

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth={false} fullWidth={false}>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAddIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            Заявка на участие
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading || success}
          sx={{
            color: 'white',
            borderRadius: theme.spacing(1.5),
            opacity: loading || success ? 0.5 : 1
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {/* Заголовок проекта */}
        <Box sx={{ mt: 1, mb: 3 }}>
          <Typography variant="h4" fontWeight="700" color="primary.main">
            {projectTitle || 'Проект'}
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
            Заявка успешно отправлена! Ожидайте решения руководителя проекта.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
            {error}
          </Alert>
        )}

        {/* Выбор роли */}
        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
          Желаемая роль *
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
          {PROJECT_ROLES.map((role) => (
            <RoleCard
              key={role.value}
              selected={selectedRole === role.value}
              onClick={() => setSelectedRole(role.value)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
                  <Typography variant="h6">{role.icon}</Typography>
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">
                    {role.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {role.description}
                  </Typography>
                </Box>
                {selectedRole === role.value && (
                  <CheckCircleIcon color="primary" sx={{ fontSize: 28 }} />
                )}
              </Box>
            </RoleCard>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Сопроводительное сообщение */}
        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
          Сопроводительное сообщение
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Расскажите о себе и своем опыте"
          placeholder="Почему вы хотите участвовать в проекте? Какой опыт можете предложить?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading || success}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3
            }
          }}
        />

        <Typography variant="caption" color="text.secondary">
          Это сообщение увидит руководитель проекта при рассмотрении заявки.
        </Typography>
      </StyledDialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1, justifyContent: 'flex-end' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading || success}
          sx={{ borderRadius: 5, px: 4 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{ borderRadius: 5, px: 4 }}
        >
          {loading ? 'Отправка...' : 'Отправить заявку'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ProjectJoinModal;