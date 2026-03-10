// frontend/src/components/Project/InviteToProjectModal.js
import React, { useState, useCallback } from 'react';
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
  InputAdornment,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import debounce from 'lodash/debounce';
import api from '../../services/api';
import { invitationsAPI } from '../../services/api';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ - ВСЕ СКРУГЛЕНИЯ 24px
// ============================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3), // 24px скругление
    maxWidth: 700,
    minWidth: 600,
    maxHeight: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: theme.palette.grey[50],
    boxShadow: theme.shadows[0],
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
    borderRadius: theme.spacing(0.5),
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: theme.spacing(0.5),
    '&:hover': {
      background: theme.palette.grey[600],
    },
  }
}));

const UserCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(3), // 24px скругление
  border: '0.5px solid',
  borderColor: selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1),
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginBottom: theme.spacing(1),
  boxShadow: theme.shadows[0],
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

const ProjectInfoPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(3),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  border: '0.5px solid',
  borderColor: alpha(theme.palette.primary.main, 0.1),
  borderRadius: theme.spacing(3), // 24px скругление
  boxShadow: theme.shadows[0]
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3), // 24px скругление
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderWidth: '0.5px',
      borderColor: alpha(theme.palette.primary.main, 0.1)
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '0.5px'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '0.5px'
    }
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: theme.spacing(3), // 24px скругление
  backgroundColor: theme.palette.background.paper,
  '& .MuiOutlinedInput-notchedOutline': {
    borderWidth: '0.5px',
    borderColor: alpha(theme.palette.primary.main, 0.1)
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: '0.5px'
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: '0.5px'
  }
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(3), // 24px скругление
  border: '0.5px solid',
  borderColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiChip-deleteIcon': {
    color: alpha(theme.palette.primary.main, 0.5),
    '&:hover': {
      color: theme.palette.primary.main
    }
  }
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
  borderRadius: theme.spacing(3), // 24px скругление
  border: '0.5px solid',
  borderColor: alpha(theme.palette.primary.main, 0.1)
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderColor: alpha(theme.palette.primary.main, 0.1),
  borderWidth: '0.5px'
}));

// ============================================
// КОНСТАНТЫ С РОЛЯМИ
// ============================================

const ROLES = [
  {
    group: 'Руководящие роли',
    items: [
      { value: 'scrum_master', label: 'Scrum Master (Менеджер проекта)', icon: '🔄', description: 'Управление процессом, организация работы команды' },
      { value: 'lead_researcher', label: 'Lead Researcher (Ведущий исследователь)', icon: '🎯', description: 'Руководство исследовательским направлением' }
    ]
  },
  {
    group: 'Исследовательские роли',
    items: [
      { value: 'researcher', label: 'Researcher (Исследователь)', icon: '🔬', description: 'Проведение исследований, анализ данных' },
      { value: 'analyst', label: 'Analyst (Аналитик)', icon: '📊', description: 'Анализ данных, подготовка отчетов' }
    ]
  },
  {
    group: 'Текстовые роли',
    items: [
      { value: 'writer', label: 'Writer (Автор текста)', icon: '✍️', description: 'Написание статей, оформление результатов' },
      { value: 'reviewer', label: 'Reviewer (Рецензент)', icon: '👁️', description: 'Проверка и рецензирование материалов' },
      { value: 'editor', label: 'Editor (Редактор)', icon: '📝', description: 'Редактирование, корректура' }
    ]
  },
  {
    group: 'Вспомогательные роли',
    items: [
      { value: 'assistant', label: 'Assistant (Ассистент)', icon: '🤝', description: 'Помощь в организации работы' },
      { value: 'viewer', label: 'Viewer (Наблюдатель)', icon: '👀', description: 'Только просмотр материалов проекта' }
    ]
  }
];

// Плоский список для Select
const FLAT_ROLES = ROLES.flatMap(group => group.items);

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const InviteToProjectModal = ({ open, onClose, projectId, projectTitle, onSuccess }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('researcher');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // ============================================
  // ПОИСК ПОЛЬЗОВАТЕЛЕЙ
  // ============================================

  const searchUsers = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await api.get(`/auth/search/?q=${encodeURIComponent(query)}`);
        // Исключаем уже выбранных пользователей
        const filtered = response.data.filter(
          user => !selectedUsers.some(u => u.id === user.id)
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error('Ошибка поиска:', error);
      } finally {
        setSearching(false);
      }
    }, 300),
    [selectedUsers]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchUsers(value);
  };

  // ============================================
  // УПРАВЛЕНИЕ ВЫБРАННЫМИ ПОЛЬЗОВАТЕЛЯМИ
  // ============================================

  const handleSelectUser = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  // ============================================
  // ОТПРАВКА ПРИГЛАШЕНИЙ
  // ============================================

  const validateForm = () => {
    if (selectedUsers.length === 0) {
      setError('Выберите хотя бы одного пользователя');
      return false;
    }
    return true;
  };

  const handleSendInvitations = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const results = await Promise.allSettled(
        selectedUsers.map(user =>
          invitationsAPI.create({
            receiver: user.id,
            project: projectId,
            message: message.trim() || `Приглашаю вас в проект "${projectTitle}"`,
            role: selectedRole,
            invitation_type: 'project'
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      setSuccess(true);

      setTimeout(() => {
        if (onSuccess) onSuccess(successful, failed);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Ошибка отправки приглашений:', error);
      setError('Не удалось отправить приглашения');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setSelectedRole('researcher');
    setMessage('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================

  const getInitials = (firstName, lastName) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    return '?';
  };

  const selectedRoleData = FLAT_ROLES.find(r => r.value === selectedRole);

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth={false} fullWidth={false}>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAddIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            Пригласить в проект
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
        {/* Информация о проекте */}
        <ProjectInfoPaper elevation={0}>
          <Typography variant="subtitle1" fontWeight="600">
            {projectTitle || 'Проект'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID проекта: {projectId}
          </Typography>
        </ProjectInfoPaper>

        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Приглашения отправлены!
            </Typography>
          </Box>
        ) : (
          <>
            {error && (
              <StyledAlert severity="error" sx={{ mb: 3 }}>
                {error}
              </StyledAlert>
            )}

            {/* ПОИСК ПОЛЬЗОВАТЕЛЕЙ */}
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Кого приглашаем?
            </Typography>

            <StyledTextField
              fullWidth
              placeholder="Поиск по имени, email, филиалу..."
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searching && <CircularProgress size={20} />
              }}
              sx={{ mb: 2 }}
            />

            {/* Результаты поиска */}
            {searchResults.length > 0 && (
              <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                {searchResults.map(user => (
                  <UserCard
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={user.avatar_url}>
                        {getInitials(user.first_name, user.last_name)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="600">
                          {user.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email} • {user.branch_name || 'Филиал не указан'}
                        </Typography>
                      </Box>
                      <AddIcon color="primary" />
                    </Box>
                  </UserCard>
                ))}
              </Box>
            )}

            {/* Выбранные пользователи */}
            {selectedUsers.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Выбрано: {selectedUsers.length}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedUsers.map(user => (
                    <StyledChip
                      key={user.id}
                      label={user.full_name}
                      onDelete={() => handleRemoveUser(user.id)}
                      avatar={<Avatar src={user.avatar_url} />}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <StyledDivider sx={{ my: 3 }} />

            {/* Настройки приглашения */}
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Выберите роль для приглашаемых
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Роль в проекте</InputLabel>
              <StyledSelect
                value={selectedRole}
                label="Роль в проекте"
                onChange={(e) => setSelectedRole(e.target.value)}
                renderValue={(value) => {
                  const role = FLAT_ROLES.find(r => r.value === value);
                  return role?.label || value;
                }}
              >
                {ROLES.map((group) => [
                  <ListSubheader key={group.group} sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {group.group}
                  </ListSubheader>,
                  ...group.items.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>{role.icon}</Typography>
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {role.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                ])}
              </StyledSelect>
            </FormControl>

            {selectedRoleData && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mb: 2,
                  ml: 1,
                  fontStyle: 'italic'
                }}
              >
                {selectedRoleData.description}
              </Typography>
            )}

            <StyledTextField
              fullWidth
              multiline
              rows={3}
              label="Сообщение (необязательно)"
              placeholder="Напишите персональное сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </>
        )}
      </StyledDialogContent>

      {!success && (
        <DialogActions sx={{ p: 3, pt: 0, gap: 1, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading}
            sx={{
              borderRadius: theme.spacing(3),
              px: 4,
              borderWidth: '0.5px',
              '&:hover': {
                borderWidth: '0.5px'
              }
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSendInvitations}
            variant="contained"
            disabled={loading || selectedUsers.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{
              borderRadius: theme.spacing(3),
              px: 4,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none'
              }
            }}
          >
            {loading ? 'Отправка...' : `Пригласить (${selectedUsers.length})`}
          </Button>
        </DialogActions>
      )}
    </StyledDialog>
  );
};

export default InviteToProjectModal;