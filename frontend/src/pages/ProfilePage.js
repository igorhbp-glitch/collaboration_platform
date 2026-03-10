// src/pages/ProfilePage.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Badge,
  ListItemIcon,
  Slider,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  Article as ArticleIcon,
  Event as EventIcon,
  Folder as FolderIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// 👇 ИМПОРТ ДЛЯ РЕДАКТОРА АВАТАРОК
import AvatarEditor from 'react-avatar-editor';

// ==================== ИМПОРТЫ API ====================
import { authAPI, projectsAPI, API_BASE_URL } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ==================== ИМПОРТЫ ДАННЫХ ====================
import {
  POSITIONS
} from '../data/scienceData';
import {
  getCompetencyIcon,
  getFieldColor
} from '../data/themeData';

// ==================== НОВЫЙ КОМПОНЕНТ КАРТОЧКИ ====================
import ProfileProjectCard from '../components/Profile/ProfileProjectCard';

// ==================== ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ====================

// Компонент для редактирования телефона
const EditPhoneDialog = ({ open, onClose, user, onSave }) => {
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = () => {
    onSave({ phone });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" fontWeight="600">
          Редактировать телефон
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          label="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (999) 123-45-67"
          variant="outlined"
          InputProps={{
            startAdornment: (
              <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
            ),
          }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Компонент для редактирования "О себе"
const EditBioDialog = ({ open, onClose, user, onSave }) => {
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSave = () => {
    onSave({ bio });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" fontWeight="600">
          Редактировать информацию о себе
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          label="О себе"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Расскажите о себе, своих научных интересах и достижениях..."
          variant="outlined"
          multiline
          rows={5}
          InputProps={{
            startAdornment: (
              <InfoIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
            ),
          }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Компонент для редактирования аватарки
const AvatarEditorComponent = ({ open, onClose, onSave, image }) => {
  const editorRef = useRef(null);
  const [scale, setScale] = useState(1.2);

  const handleScaleChange = (event, newValue) => {
    setScale(newValue);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob((blob) => {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onSave(file);
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Редактирование фото
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <AvatarEditor
            ref={editorRef}
            image={image}
            width={250}
            height={250}
            border={50}
            borderRadius={125}
            color={[0, 0, 0, 0.6]}
            scale={scale}
            style={{ cursor: 'move' }}
          />

          <Box sx={{ width: '100%', px: 2 }}>
            <Typography gutterBottom>Масштаб</Typography>
            <Slider
              value={scale}
              min={1}
              max={3}
              step={0.1}
              onChange={handleScaleChange}
              aria-labelledby="scale-slider"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Компонент вкладок
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================

const ProfilePage = () => {
  const { userId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  // Состояния для редактирования (только для своего профиля)
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [editPhoneDialogOpen, setEditPhoneDialogOpen] = useState(false);
  const [editBioDialogOpen, setEditBioDialogOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: ''
  });

  // Состояния для аватарки (только для своего профиля)
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState(null);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Определяем, свой это профиль или чужой
  const isOwnProfile = currentUser && user && currentUser.id === user.id;

  // ==================== ЗАГРУЗКА ДАННЫХ ====================

  useEffect(() => {
    loadUserData();
  }, [userId, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Если userId есть в URL - загружаем чужой профиль, иначе - свой
      let userData;
      if (userId) {
        userData = await authAPI.getUserById(userId);
        console.log('📥 Загружен чужой профиль:', userData);
      } else {
        userData = await authAPI.getProfile();
        console.log('📥 Загружен свой профиль:', userData);
      }

      setUser(userData);
      setEditFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        middle_name: userData.middle_name || ''
      });

      // Загружаем проекты пользователя
      loadUserProjects(userData.id);
    } catch (err) {
      console.error('❌ Ошибка загрузки профиля:', err);
      setError('Не удалось загрузить данные профиля');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProjects = async (userId) => {
    try {
      const projectsData = await projectsAPI.getAll();

      let projectsList = [];
      if (Array.isArray(projectsData)) {
        projectsList = projectsData;
      } else if (projectsData.results) {
        projectsList = projectsData.results;
      }

      // Фильтруем проекты, где пользователь является создателем или участником
      const userProjects = projectsList.filter(p => {
        const isOwner = p.owner?.id === userId;
        const isMember = p.members?.some(m => m.id === userId || m.user?.id === userId);
        return isOwner || isMember;
      });

      setProjects(userProjects);
    } catch (err) {
      console.error('❌ Ошибка загрузки проектов:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // ==================== ОБРАБОТЧИКИ ДЛЯ РЕДАКТИРОВАНИЯ ====================

  const handleEditNameOpen = () => {
    if (!isOwnProfile) return;
    setEditFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      middle_name: user.middle_name || ''
    });
    setEditNameDialogOpen(true);
  };

  const handleEditNameClose = () => {
    setEditNameDialogOpen(false);
  };

  const handleEditNameChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditNameSave = async () => {
    try {
      const updatedUser = await authAPI.updateProfile(editFormData);
      setUser({ ...user, ...updatedUser, avatar: user.avatar });
      setEditNameDialogOpen(false);
    } catch (err) {
      console.error('❌ Ошибка обновления ФИО:', err);
    }
  };

  const handlePhoneEditSave = async (data) => {
    try {
      const updatedUser = await authAPI.updateProfile(data);
      setUser({ ...user, ...updatedUser, avatar: user.avatar });
    } catch (err) {
      console.error('❌ Ошибка обновления телефона:', err);
    }
  };

  const handleBioEditSave = async (data) => {
    try {
      await authAPI.updateProfile(data);
      setUser({ ...user, ...data, avatar: user.avatar });
    } catch (err) {
      console.error('❌ Ошибка обновления информации о себе:', err);
    }
  };

  // ==================== ОБРАБОТЧИКИ ДЛЯ АВАТАРКИ ====================

  const handleAvatarMenuOpen = (event) => {
    if (!isOwnProfile) return;
    setAvatarMenuAnchor(event.currentTarget);
  };

  const handleAvatarMenuClose = () => {
    setAvatarMenuAnchor(null);
  };

  const handleAvatarUploadClick = () => {
    handleAvatarMenuClose();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImage(reader.result);
          setAvatarEditorOpen(true);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleAvatarSave = async (file) => {
    try {
      const updatedUser = await authAPI.uploadAvatar(file);
      setUser(prev => ({
        ...prev,
        avatar: updatedUser.avatar
      }));
      setAvatarEditorOpen(false);
      setSelectedImage(null);
    } catch (err) {
      console.error('❌ Ошибка загрузки аватарки:', err);
    }
  };

  const handleAvatarDelete = async () => {
    handleAvatarMenuClose();
    try {
      await authAPI.deleteAvatar();
      setUser(prev => ({
        ...prev,
        avatar: null
      }));
    } catch (err) {
      console.error('❌ Ошибка удаления аватарки:', err);
    }
  };

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  const getInitials = () => {
    if (!user) return '?';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) return user.first_name[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return '?';
  };

  const getFullName = () => {
    const parts = [];
    if (user?.last_name) parts.push(user.last_name);
    if (user?.first_name) parts.push(user.first_name);
    if (user?.middle_name) parts.push(user.middle_name);
    return parts.join(' ') || 'Пользователь';
  };

  const getRoleDisplay = (position) => {
    if (!position) return 'Не указано';

    const roleMap = {
      'student': 'Студент',
      'spo_student': 'Студент колледжа (СПО)',
      'bachelor': 'Студент бакалавриата',
      'master': 'Студент магистратуры',
      'postgraduate': 'Аспирант',
      'doctoral': 'Докторант',
      'lecturer': 'Преподаватель',
      'senior_lecturer': 'Старший преподаватель',
      'docent': 'Доцент',
      'professor': 'Профессор',
      'head_of_department': 'Заведующий кафедрой',
      'dean': 'Декан факультета',
      'researcher': 'Научный сотрудник',
      'senior_researcher': 'Ведущий научный сотрудник'
    };

    return roleMap[position] || position;
  };

  const getBranchName = () => {
    if (!user?.branch) return 'Филиал не указан';
    if (user.branch_detail?.name) return user.branch_detail.name;
    return user.branch;
  };

  const getStudyProgramName = () => {
    if (!user?.study_program) return 'Не указано';
    if (user.study_program_detail?.name) return user.study_program_detail.name;
    return user.study_program;
  };

  const getDepartmentName = () => {
    if (!user?.department) return null;
    if (user.department_detail?.name) return user.department_detail.name;
    return user.department;
  };

  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    if (user.avatar.startsWith('http')) return user.avatar;
    return `${API_BASE_URL}${user.avatar}`;
  };

  // ==================== РЕНДЕРИНГ ====================

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Загрузка профиля...</Typography>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Профиль не найден'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Вернуться назад
        </Button>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        mb: 8,
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      {/* Кнопка назад для чужих профилей */}
      {!isOwnProfile && (
        <Button
          onClick={() => navigate(-1)}
          sx={{
            position: 'fixed',
            left: { xs: '-100%', sm: 16, md: 24 },
            top: { xs: 0, sm: 80, md: 90 },
            zIndex: 1200,
            backgroundColor: 'rgba(255,255,255,0.95)',
            color: 'primary.main',
            borderRadius: 5,
            '&:hover': {
              backgroundColor: 'white',
            },
            display: { xs: 'none', sm: 'flex' },
            minWidth: '40px',
            width: '40px',
            height: '40px',
            p: 0,
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'rgba(0,0,0,0.08)'
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </Button>
      )}

      {/* Шапка профиля */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          overflow: 'hidden',
          borderRadius: 8,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      >
        {/* Обложка */}
        <Box sx={{ height: { xs: 80, sm: 120 }, width: '100%' }} />

        {/* Шестеренка */}
        {isOwnProfile && (
          <IconButton
            onClick={() => navigate('/questionnaire/3', {
              state: { from: { pathname: window.location.pathname } }
            })}
            sx={{
              position: 'absolute',
              top: { xs: 8, sm: 16 },
              right: { xs: 8, sm: 16 },
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
              zIndex: 10
            }}
          >
            <SettingsIcon />
          </IconButton>
        )}

        {/* FLEX-КОНТЕЙНЕР */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: { xs: 2, sm: 4 },
          px: { xs: 2, sm: 4 },
          pt: { xs: 5, sm: 10 },
          pb: { xs: 3, sm: 4 },
          mt: { xs: -6, sm: -8 },
          position: 'relative',
          width: '100%'
        }}>
          {/* ЛЕВЫЙ БЛОК - аватар */}
          <Box sx={{
            flex: { xs: '0 0 auto', sm: '0 0 180px' },
            display: 'flex',
            justifyContent: { xs: 'center', sm: 'center' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            {isOwnProfile ? (
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    onClick={handleAvatarMenuOpen}
                    sx={{
                      bgcolor: 'white',
                      '&:hover': { bgcolor: 'grey.100' },
                      width: { xs: 28, sm: 32 },
                      height: { xs: 28, sm: 32 }
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                  </IconButton>
                }
              >
                <Avatar
                  src={getAvatarUrl()}
                  sx={{
                    width: { xs: 100, sm: 120 },
                    height: { xs: 100, sm: 120 },
                    border: '4px solid white',
                    boxShadow: theme.shadows[3],
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    '& img': { objectFit: 'cover' }
                  }}
                  onClick={handleAvatarMenuOpen}
                >
                  {!user?.avatar && getInitials()}
                </Avatar>
              </Badge>
            ) : (
              <Avatar
                src={getAvatarUrl()}
                sx={{
                  width: { xs: 100, sm: 120 },
                  height: { xs: 100, sm: 120 },
                  border: '4px solid white',
                  boxShadow: theme.shadows[3],
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  fontSize: { xs: '2rem', sm: '2.5rem' },
                  '& img': { objectFit: 'cover' }
                }}
              >
                {!user?.avatar && getInitials()}
              </Avatar>
            )}

            {/* Меню для аватарки */}
            {isOwnProfile && (
              <Menu
                anchorEl={avatarMenuAnchor}
                open={Boolean(avatarMenuAnchor)}
                onClose={handleAvatarMenuClose}
                PaperProps={{ sx: { width: 200 } }}
              >
                <MenuItem onClick={handleAvatarUploadClick}>
                  <ListItemIcon>
                    <PhotoCameraIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Загрузить фото</ListItemText>
                </MenuItem>
                {user?.avatar && (
                  <MenuItem onClick={handleAvatarDelete} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Удалить фото</ListItemText>
                  </MenuItem>
                )}
              </Menu>
            )}
          </Box>

          {/* ПРАВЫЙ БЛОК - текст */}
          <Box sx={{
            flex: 1,
            color: 'white',
            textAlign: { xs: 'center', sm: 'left' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            {/* Имя */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}>
              <Typography
                variant="h4"
                fontWeight="600"
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
              >
                {getFullName()}
              </Typography>
              {isOwnProfile && (
                <IconButton
                  size="small"
                  onClick={handleEditNameOpen}
                  sx={{ color: 'white', opacity: 0.8, '&:hover': { opacity: 1 } }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {/* Должность */}
            <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 400, mb: 1 }}>
              {getRoleDisplay(user.position)}
            </Typography>

            {/* О себе */}
            {user.bio && (
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.8,
                  mb: 1,
                  maxWidth: 600
                }}
              >
                {user.bio}
              </Typography>
            )}

            {/* Чипсы */}
            <Box sx={{
              display: 'flex',
              gap: 1.5,
              mt: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}>
              <Chip
                icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
                label={getBranchName()}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  height: 24,
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
              {user.academic_degree && (
                <Chip
                  icon={<SchoolIcon sx={{ fontSize: 16 }} />}
                  label={user.academic_degree}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    height: 24,
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Диалоги редактирования */}
      <Dialog open={editNameDialogOpen} onClose={handleEditNameClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" fontWeight="600">
            Редактирование имени
          </Typography>
          <IconButton onClick={handleEditNameClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              name="last_name"
              label="Фамилия"
              value={editFormData.last_name}
              onChange={handleEditNameChange}
              fullWidth
              variant="outlined"
            />
            <TextField
              name="first_name"
              label="Имя"
              value={editFormData.first_name}
              onChange={handleEditNameChange}
              fullWidth
              variant="outlined"
            />
            <TextField
              name="middle_name"
              label="Отчество"
              value={editFormData.middle_name}
              onChange={handleEditNameChange}
              fullWidth
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditNameClose}>Отмена</Button>
          <Button onClick={handleEditNameSave} variant="contained" startIcon={<SaveIcon />}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <EditPhoneDialog
        open={editPhoneDialogOpen}
        onClose={() => setEditPhoneDialogOpen(false)}
        user={user}
        onSave={handlePhoneEditSave}
      />

      <EditBioDialog
        open={editBioDialogOpen}
        onClose={() => setEditBioDialogOpen(false)}
        user={user}
        onSave={handleBioEditSave}
      />

      <AvatarEditorComponent
        open={avatarEditorOpen}
        onClose={() => setAvatarEditorOpen(false)}
        onSave={handleAvatarSave}
        image={selectedImage}
      />

      {/* Двухколоночный макет */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        mb: 3
      }}>
        {/* Левая колонка */}
        <Box sx={{ flex: '1 1 35%', minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Контакты */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 6,
                boxShadow: 'none'
              }}
            >
              <Typography
                variant="h6"
                fontWeight="600"
                color="primary"
                sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Контакты
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 40, height: 40 }}>
                      <EmailIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Email"
                    secondary={user.email}
                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem
                  sx={{ px: 0 }}
                  secondaryAction={
                    isOwnProfile && (
                      <IconButton edge="end" size="small" onClick={() => setEditPhoneDialogOpen(true)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 40, height: 40 }}>
                      <PhoneIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Телефон"
                    secondary={user.phone || 'Не указан'}
                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </Paper>

            {/* Образование */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 6,
                boxShadow: 'none'
              }}
            >
              <Typography
                variant="h6"
                fontWeight="600"
                color="primary"
                sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Образование
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', width: 40, height: 40 }}>
                      <LocationOnIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Филиал"
                    secondary={getBranchName()}
                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 40, height: 40 }}>
                      <SchoolIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Направление подготовки"
                    secondary={getStudyProgramName()}
                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                {getDepartmentName() && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 40, height: 40 }}>
                        <SchoolIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Кафедра"
                      secondary={getDepartmentName()}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>
        </Box>

        {/* Правая колонка */}
        <Box sx={{ flex: '1 1 65%', minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Компетенции */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 6,
                boxShadow: 'none'
              }}
            >
              <Typography
                variant="h6"
                fontWeight="600"
                color="primary"
                sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Компетенции
              </Typography>
              {user.competencies?.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.competencies.map((comp, index) => (
                    <Chip
                      key={index}
                      label={`${getCompetencyIcon(comp)} ${comp}`}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: 'success.main',
                        height: 24,
                        fontSize: '0.75rem',
                        borderRadius: 2,
                        pl: 0.5
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Компетенции не указаны
                </Typography>
              )}
            </Paper>

            {/* Научные интересы */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 6,
                boxShadow: 'none'
              }}
            >
              <Typography
                variant="h6"
                fontWeight="600"
                color="primary"
                sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Научные интересы
              </Typography>
              {user.research_fields?.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.research_fields.map((interest, index) => (
                    <Chip
                      key={index}
                      label={interest}
                      size="small"
                      sx={{
                        bgcolor: getFieldColor(interest),
                        color: '#1a1a1a',
                        height: 24,
                        fontSize: '0.75rem',
                        borderRadius: 2,
                        fontWeight: 500
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Научные интересы не указаны
                </Typography>
              )}
            </Paper>

            {/* Три блока в ряд */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2
            }}>
              {/* Публикации */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 6,
                  boxShadow: 'none'
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color="primary"
                  sx={{ mb: 1.5, fontSize: { xs: '1rem', sm: '1.1rem' } }}
                >
                  Публикации
                </Typography>
                <Typography variant="h5" fontWeight="600" color="primary" sx={{ mb: 1.5 }}>
                  {user.publications_count || 0}
                </Typography>
                {user.publication_types?.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.publication_types.slice(0, 3).map((type, index) => (
                      <Chip
                        key={index}
                        label={type}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          color: 'warning.main',
                          height: 22,
                          fontSize: '0.7rem',
                          borderRadius: 2
                        }}
                      />
                    ))}
                    {user.publication_types.length > 3 && (
                      <Chip
                        label={`+${user.publication_types.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem', borderRadius: 2 }}
                      />
                    )}
                  </Box>
                )}
              </Paper>

              {/* Методологии */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 6,
                  boxShadow: 'none'
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color="primary"
                  sx={{ mb: 1.5, fontSize: { xs: '1rem', sm: '1.1rem' } }}
                >
                  Методологии
                </Typography>
                {user.methodologies?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.methodologies.slice(0, 4).map((method, index) => (
                      <Chip
                        key={index}
                        label={method}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: 'secondary.main',
                          height: 22,
                          fontSize: '0.7rem',
                          borderRadius: 2
                        }}
                      />
                    ))}
                    {user.methodologies.length > 4 && (
                      <Chip
                        label={`+${user.methodologies.length - 4}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem', borderRadius: 2 }}
                      />
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Не указаны
                  </Typography>
                )}
              </Paper>

              {/* Сотрудничество */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 6,
                  boxShadow: 'none'
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color="primary"
                  sx={{ mb: 1.5, fontSize: { xs: '1rem', sm: '1.1rem' } }}
                >
                  Сотрудничество
                </Typography>
                {user.collaboration_types?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.collaboration_types.slice(0, 4).map((type, index) => (
                      <Chip
                        key={index}
                        label={type}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          color: 'error.main',
                          height: 22,
                          fontSize: '0.7rem',
                          borderRadius: 2
                        }}
                      />
                    ))}
                    {user.collaboration_types.length > 4 && (
                      <Chip
                        label={`+${user.collaboration_types.length - 4}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.7rem', borderRadius: 2 }}
                      />
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Не указаны
                  </Typography>
                )}
              </Paper>
            </Box>

            {/* Опыт в проектах */}
            {user.projects_experience && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 6,
                  boxShadow: 'none'
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="600"
                  color="primary"
                  sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                >
                  Опыт участия в проектах
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {user.projects_experience}
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>

      {/* Вкладки с разделами */}
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: 'none'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: theme.palette.background.paper,
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Tab icon={<FolderIcon />} label="Проекты" iconPosition="start" />
            <Tab icon={<EventIcon />} label="Мероприятия" iconPosition="start" />
            <Tab icon={<ArticleIcon />} label="Документы" iconPosition="start" />
          </Tabs>

          {/* Проекты */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              {projects.length > 0 ? (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  },
                  gap: 2.5
                }}>
                  {projects.map((project) => (
                    <ProfileProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    />
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Нет активных проектов
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Пользователь пока не участвует ни в одном проекте
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Мероприятия */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <EventIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Нет мероприятий
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Здесь будут отображаться мероприятия, на которые подписан пользователь
                </Typography>
              </Box>
            </Box>
          </TabPanel>

          {/* Документы */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ArticleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Нет документов
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Здесь будут отображаться научные работы пользователя
                </Typography>
              </Box>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfilePage;