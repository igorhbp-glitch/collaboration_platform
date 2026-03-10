// frontend/src/components/InviteModal/InviteModal.js
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
  Alert,
  CircularProgress,
  Divider,
  Paper,
  alpha,
  useTheme,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  RadioGroup,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  Folder as FolderIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
  Groups as GroupsIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api, { invitationsAPI, projectsAPI, authAPI } from '../../services/api';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ (как в EventParticipateModal)
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

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    minHeight: 48,
    transition: 'all 0.2s'
  },
  '& .Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 700
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: theme.spacing(1.5),
    backgroundColor: theme.palette.primary.main
  }
}));

const UserCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(5),
  border: '0.5px solid',
  borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginBottom: theme.spacing(1),
  boxShadow: theme.shadows[0],
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

const ProjectCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(5),
  border: '0.5px solid',
  borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginBottom: theme.spacing(1),
  boxShadow: theme.shadows[0],
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

const MessagePreview = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  marginTop: theme.spacing(2),
  borderRadius: theme.spacing(4),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  border: '0.5px solid',
  borderColor: theme.palette.divider,
  fontStyle: 'italic'
}));

// ============================================
// КОНСТАНТЫ
// ============================================

const PROJECT_TYPES = [
  { value: 'research_paper', label: 'Научная статья', icon: <DescriptionIcon />, color: '#4361ee' },
  { value: 'dissertation', label: 'Диссертация', icon: <SchoolIcon />, color: '#3a0ca3' },
  { value: 'grant', label: 'Грантовый проект', icon: <ScienceIcon />, color: '#7209b7' },
  { value: 'conference', label: 'Подготовка к конференции', icon: <GroupsIcon />, color: '#f72585' },
  { value: 'book', label: 'Книга/Монография', icon: <DescriptionIcon />, color: '#4cc9f0' },
  { value: 'creative', label: 'Творческий проект', icon: <ScienceIcon />, color: '#f8961e' },
  { value: 'other', label: 'Другое', icon: <FolderIcon />, color: '#f94144' }
];

const ROLES = [
  { value: 'product_owner', label: 'Product Owner (Научный руководитель)', icon: '👑' },
  { value: 'scrum_master', label: 'Scrum Master (Менеджер проекта)', icon: '🔄' },
  { value: 'lead_researcher', label: 'Lead Researcher (Ведущий исследователь)', icon: '🔬' },
  { value: 'researcher', label: 'Researcher (Исследователь)', icon: '🔍' },
  { value: 'analyst', label: 'Analyst (Аналитик)', icon: '📊' },
  { value: 'writer', label: 'Writer (Автор текста)', icon: '✍️' },
  { value: 'reviewer', label: 'Reviewer (Рецензент)', icon: '👁️' },
  { value: 'editor', label: 'Editor (Редактор)', icon: '📝' },
  { value: 'assistant', label: 'Assistant (Ассистент)', icon: '🤝' },
  { value: 'viewer', label: 'Viewer (Наблюдатель)', icon: '👀' }
];

const MESSAGE_TEMPLATES = [
  {
    id: 1,
    title: 'Стандартное',
    text: `Здравствуйте! Ваши компетенции и научные интересы совпадают с направлением моего проекта. Хотел(а) бы пригласить вас к сотрудничеству.\n\nДавайте обсудим детали!`
  },
  {
    id: 2,
    title: 'Междисциплинарное',
    text: `Уважаемый(ая) коллега! Ваши знания в области могут быть ценны для нашего междисциплинарного исследования. Предлагаю объединить усилия.\n\nС уважением`
  },
  {
    id: 3,
    title: 'Краткое',
    text: `Привет! Наши интересы совпадают. Хотите поучаствовать в совместном проекте?`
  }
];

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const InviteModal = ({ open, onClose, user, onSuccess }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  // Состояния для выбора
  const [tabValue, setTabValue] = useState(0); // 0 - существующий проект, 1 - новый
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRole, setSelectedRole] = useState('researcher');
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Данные для нового проекта
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('research_paper');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectField, setNewProjectField] = useState('');

  // ============================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const currentUser = await authAPI.getCurrentUser();
        if (currentUser && currentUser.id) {
          setCurrentUserId(currentUser.id);
        }
      } catch (error) {
        console.log('Не удалось получить ID пользователя:', error);
      }
    };

    if (open) {
      getUserInfo();
      loadUserProjects();
      generateSmartMessage();
    }
  }, [open, user]);

  const loadUserProjects = async () => {
    try {
      setLoadingProjects(true);
      setError('');

      // Получаем проекты текущего пользователя
      const response = await api.get('/projects/my/');
      const myProjects = response.data;

      if (Array.isArray(myProjects)) {
        setUserProjects(myProjects);
        if (myProjects.length > 0) {
          setSelectedProject(myProjects[0].id);
        }
      } else {
        setUserProjects([]);
      }
    } catch (error) {
      console.log('Не удалось загрузить проекты:', error);
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const generateSmartMessage = () => {
    if (!user) return;

    const matchPercent = Math.round((user.match_score || 0.7) * 100);
    const commonSkills = user.competencies?.slice(0, 2).join(', ') || 'научных исследований';

    const baseMessage = `Здравствуйте, ${user.full_name}!

Я увидел(а) ваш профиль на платформе научных коллабораций Финуниверситета. Наша совместимость составляет ${matchPercent}%, что указывает на хорошие возможности для сотрудничества.

Ваши компетенции в области ${commonSkills} особенно интересны для меня. Хотел(а) бы предложить вам совместную работу над научным проектом.

Давайте обсудим возможные направления и форматы сотрудничества!

С уважением,`;

    setMessage(baseMessage);
  };

  // ============================================
  // ОБРАБОТЧИКИ
  // ============================================

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTemplateSelect = (template) => {
    setMessage(template.text);
  };

  const validateForm = () => {
    setError('');

    if (!message.trim()) {
      setError('Пожалуйста, напишите сообщение для приглашения');
      return false;
    }

    if (tabValue === 0 && !selectedProject && userProjects.length > 0) {
      setError('Пожалуйста, выберите проект для приглашения');
      return false;
    }

    if (tabValue === 1 && !newProjectName.trim()) {
      setError('Пожалуйста, укажите название нового проекта');
      return false;
    }

    return true;
  };

  const handleSendInvitation = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      let projectId = null;
      let projectName = '';

      // Создаём новый проект или используем существующий
      if (tabValue === 1) {
        const projectData = {
          title: newProjectName.trim(),
          description: newProjectDescription.trim() || 'Совместный проект с коллегой',
          project_type: newProjectType,
          scientific_field: newProjectField.trim() || user?.competencies?.[0] || 'Исследование',
          required_competencies: user?.competencies?.slice(0, 5) || [],
          max_members: 10,
          is_private: false
        };

        const newProject = await projectsAPI.create(projectData);
        projectId = newProject.id;
        projectName = newProject.title;
      } else {
        projectId = selectedProject;
        const project = userProjects.find(p => p.id === selectedProject);
        projectName = project?.title || 'Проект';
      }

      // Отправляем приглашение
      const invitationData = {
        receiver: user.id,
        project: projectId,
        message: message.trim(),
        role: selectedRole,
        invitation_type: 'collaboration'
      };

      await invitationsAPI.create(invitationData);

      setResponseMessage(`Приглашение в проект "${projectName}" успешно отправлено!`);
      setSuccess(true);

      setTimeout(() => {
        resetForm();
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Ошибка отправки приглашения:', error);

      let errorMessage = 'Не удалось отправить приглашение. ';

      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errors = Object.values(error.response.data).flat();
          errorMessage += errors.join('; ');
        } else {
          errorMessage += error.response.data;
        }
      } else {
        errorMessage += error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProject('');
    setNewProjectName('');
    setNewProjectType('research_paper');
    setNewProjectDescription('');
    setNewProjectField('');
    setMessage('');
    setSelectedRole('researcher');
    setError('');
    setResponseMessage('');
    setSuccess(false);
    setTabValue(0);
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

  const getProjectTypeIcon = (type) => {
    const found = PROJECT_TYPES.find(t => t.value === type);
    return found?.icon || <FolderIcon />;
  };

  const getProjectTypeColor = (type) => {
    const found = PROJECT_TYPES.find(t => t.value === type);
    return found?.color || '#4361ee';
  };

  const getRoleIcon = (role) => {
    const found = ROLES.find(r => r.value === role);
    return found?.icon || '👤';
  };

  // ============================================
  // РЕНДЕРИНГ
  // ============================================

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth={false} fullWidth={false}>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAddIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            Пригласить к сотрудничеству
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
        {/* Информация о пользователе */}
        {user && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              border: '0.5px solid',
              borderColor: theme.palette.divider,
              borderRadius: 5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={user.avatar}
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                {getInitials(user.first_name, user.last_name)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="600">
                  {user.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.university || 'Финансовый университет'} • {user.position || user.role || 'Коллега'}
                </Typography>
                {user.match_score && (
                  <Chip
                    label={`Совместимость: ${Math.round(user.match_score * 100)}%`}
                    size="small"
                    sx={{
                      mt: 1,
                      height: 22,
                      fontSize: '0.7rem',
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>
            </Box>
          </Paper>
        )}

        {success ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Приглашение отправлено!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {responseMessage}
            </Typography>
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                {error}
              </Alert>
            )}

            {/* Вкладки выбора проекта */}
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Проект для приглашения
            </Typography>

            <StyledTabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab
                icon={<FolderIcon />}
                iconPosition="start"
                label={`Существующий (${userProjects.length})`}
                sx={{ minHeight: 48 }}
              />
              <Tab
                icon={<CreateNewFolderIcon />}
                iconPosition="start"
                label="Новый проект"
                sx={{ minHeight: 48 }}
              />
            </StyledTabs>

            {/* Вкладка существующих проектов */}
            {tabValue === 0 && (
              <Box sx={{ maxHeight: 250, overflow: 'auto', mb: 3 }}>
                {loadingProjects ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : userProjects.length > 0 ? (
                  <RadioGroup value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                    {userProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        selected={selectedProject === project.id}
                        onClick={() => setSelectedProject(project.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: getProjectTypeColor(project.project_type), width: 40, height: 40 }}>
                            {getProjectTypeIcon(project.project_type)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="600">
                              {project.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {project.member_count || 0} участников • {project.status}
                            </Typography>
                          </Box>
                          <Radio
                            checked={selectedProject === project.id}
                            value={project.id}
                            sx={{ color: theme.palette.primary.main }}
                          />
                        </Box>
                      </ProjectCard>
                    ))}
                  </RadioGroup>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 3 }}>
                    У вас пока нет проектов. Создайте новый проект для приглашения.
                  </Alert>
                )}
              </Box>
            )}

            {/* Вкладка нового проекта */}
            {tabValue === 1 && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Название проекта *"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Например: Исследование применения AI в финансовом анализе"
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Тип проекта</InputLabel>
                  <Select
                    value={newProjectType}
                    label="Тип проекта"
                    onChange={(e) => setNewProjectType(e.target.value)}
                    sx={{ borderRadius: 3 }}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: type.color }}>{type.icon}</Box>
                          <Typography>{type.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Научная область"
                  value={newProjectField}
                  onChange={(e) => setNewProjectField(e.target.value)}
                  placeholder="Например: ИИ в финансах, Data Science, Экономика"
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                <TextField
                  fullWidth
                  label="Описание проекта"
                  multiline
                  rows={3}
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Опишите цели и задачи проекта..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Выбор роли */}
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Предлагаемая роль
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Роль в проекте</InputLabel>
              <Select
                value={selectedRole}
                label="Роль в проекте"
                onChange={(e) => setSelectedRole(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                {ROLES.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: '1.2rem' }}>{role.icon}</Typography>
                      <Typography>{role.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            {/* Сообщение */}
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Сообщение *
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {MESSAGE_TEMPLATES.map((template) => (
                <Chip
                  key={template.id}
                  label={template.title}
                  onClick={() => handleTemplateSelect(template)}
                  variant="outlined"
                  sx={{ borderRadius: 5 }}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишите персональное сообщение..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            {message && (
              <MessagePreview elevation={0}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Предпросмотр:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message}
                </Typography>
              </MessagePreview>
            )}
          </>
        )}
      </StyledDialogContent>

      {!success && (
        <DialogActions sx={{ p: 3, pt: 0, gap: 1, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={loading}
            sx={{ borderRadius: 5, px: 4 }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSendInvitation}
            variant="contained"
            disabled={
              loading ||
              !message.trim() ||
              (tabValue === 0 && !selectedProject && userProjects.length > 0) ||
              (tabValue === 1 && !newProjectName.trim())
            }
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ borderRadius: 5, px: 4 }}
          >
            {loading ? 'Отправка...' : 'Отправить приглашение'}
          </Button>
        </DialogActions>
      )}
    </StyledDialog>
  );
};

export default InviteModal;