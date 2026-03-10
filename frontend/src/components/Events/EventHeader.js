// frontend/src/components/Events/EventHeader.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Button,
  Tooltip,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  ListItemText,
  Badge,
  Snackbar,
  Alert
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  Flag as FlagIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  MenuBook as MenuBookIcon,
  Description as DescriptionIcon,
  HowToReg as HowToRegIcon,
  EventNote as EventNoteIcon,
  Publish as PublishIcon,
  Block as BlockIcon,
  Star as StarIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Folder as FolderIcon,
  EditNote as EditNoteIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Импорты для слайдера
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Модальные окна
import EditEventModal from './EditEventModal';
import EventParticipantsModal from './EventParticipantsModal';
import ManageRolesModal from './ManageRolesModal';
import EventDocumentsModal from './EventDocumentsModal';
import EventParticipateModal from './EventParticipateModal';

// API
import { eventsAPI, sectionsAPI } from '../../services/eventsAPI';
import { useAuth } from '../../contexts/AuthContext';

// Контейнер шапки
const HeaderContainer = styled(Paper)(({ theme, hasimages }) => ({
  background: hasimages === 'true' ? 'transparent' : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
  position: 'relative',
  overflow: 'hidden',
  minHeight: 400,
  width: '100%',
  zIndex: 10,
}));

// Контейнер для слайдера
const SliderContainer = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  '& .slick-slider, & .slick-list, & .slick-track': {
    height: '100%'
  },
  '& .slick-slide': {
    height: '400px',
    '& > div': {
      height: '100%'
    }
  },
  '& .slick-dots': {
    bottom: 16,
    '& li button:before': {
      color: 'white',
      fontSize: 8,
      opacity: 0.5
    },
    '& li.slick-active button:before': {
      opacity: 1,
      color: 'white'
    }
  }
});

// Контейнер для изображения
const ImageContainer = styled(Box)({
  width: '100%',
  height: '100%',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
});

// Тёмный оверлей
const DarkOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
  pointerEvents: 'none',
  zIndex: 2
});

const EventHeader = ({
  event,
  participants = [],
  sections = [],
  isCreator,
  isPlenaryModerator,
  isSectionModerator,
  isAnyModerator,
  isParticipant,
  hasPendingRequest,
  typeInfo,
  levelInfo,
  onEdit,
  onDelete,
  onShowProgram,
  onShowDocuments,
  coverImages = [],
  onEventUpdate,
  onParticipantsUpdate,
  conferenceLink,
  onCreateConference,
  onJoinConference,
  onEndConference,
  onPublish,
  onCancel
}) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [manageRolesModalOpen, setManageRolesModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [participateModalOpen, setParticipateModalOpen] = useState(false);
  const [existingParticipant, setExistingParticipant] = useState(null);
  const [participateMode, setParticipateMode] = useState('create');

  const [manageRolesInitialTab, setManageRolesInitialTab] = useState('organizers');
  const [manageRolesReadOnly, setManageRolesReadOnly] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);

  const [organizers, setOrganizers] = useState([]);
  const [sectionModerators, setSectionModerators] = useState({});
  const [plenaryModerators, setPlenaryModerators] = useState([]);
  const [eventDocuments, setEventDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const open = Boolean(anchorEl);

  // ============================================
  // 🔥 ИЕРАРХИЯ ПРАВ ДОСТУПА
  // ============================================

  // Базовые проверки
  const isCreator_ = event?.created_by?.id === user?.id;
  const isOrganizer_ = organizers.some(org => org.id === user?.id);
  const isPlenaryModerator_ = isPlenaryModerator;
  const isSectionModerator_ = isSectionModerator;
  const isAnyModerator_ = isAnyModerator;

  // Права на управление мероприятием (создатель и организатор)
  const canManageEvent = isCreator_ || isOrganizer_;

  // Права на управление ролями (только создатель)
  const canManageRoles = isCreator_;

  // Права на управление модераторами (создатель и организатор)
  const canManageModerators = isCreator_ || isOrganizer_;

  // Права на управление заявками (все трое + все модераторы)
  const canManageApplications = isCreator_ || isOrganizer_ || isAnyModerator_;

  // Права на управление документами (только создатель и организатор)
  const canManageDocuments = isCreator_ || isOrganizer_;

  // Права на редактирование обложки (все трое + все модераторы)
  const canEditCover = isCreator_ || isOrganizer_ || isAnyModerator_;

  // Права на создание/завершение конференции (все трое + все модераторы)
  const canManageConference = isCreator_ || isOrganizer_ || isAnyModerator_;

  // Для совместимости с существующим кодом
  const isOrganizer = canManageEvent; // создатель или организатор
  const canEditRoles = canManageModerators; // для модалки управления ролями

  const allOrganizers = [event?.created_by, ...organizers].filter(Boolean);
  const [allModerators, setAllModerators] = useState([]);

  // Ref для хранения данных мероприятия (стабильный)
  const eventDataRef = useRef({
    id: event?.id,
    title: event?.title,
    sections: sections
  });

  // Обновляем ref при изменении данных
  useEffect(() => {
    if (event?.id) {
      eventDataRef.current = {
        id: event.id,
        title: event.title,
        sections: sections
      };
    }
  }, [event?.id, event?.title, sections]);

  // Загрузка документов
  const loadEventDocuments = async () => {
    try {
      const docs = await eventsAPI.getEventDocuments(event.id);
      setEventDocuments(docs);
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
    }
  };

  // Обновляем список модераторов при изменениях
  useEffect(() => {
    const newAllModerators = [
      ...plenaryModerators,
      ...Object.values(sectionModerators).flat()
    ].filter((mod, index, self) =>
      index === self.findIndex(m => m.id === mod.id)
    );
    setAllModerators(newAllModerators);
  }, [plenaryModerators, sectionModerators, forceUpdate]);

  useEffect(() => {
    if (event?.id) {
      loadOrganizers();
      loadAllModerators();
    }
  }, [event?.id]);

  const loadOrganizers = async () => {
    try {
      const data = await eventsAPI.getOrganizers(event.id);
      setOrganizers(data);
    } catch (error) {
      console.error('Ошибка загрузки организаторов:', error);
    }
  };

  const loadAllModerators = async () => {
    try {
      const sectionMods = {};
      for (const section of sections) {
        const data = await sectionsAPI.getModerators(section.id);
        sectionMods[section.id] = data;
      }
      setSectionModerators(sectionMods);

      const plenaryData = await eventsAPI.getPlenaryModerators(event.id);
      setPlenaryModerators(plenaryData);

      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Ошибка загрузки модераторов:', error);
    }
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Сохранение ролей через единый эндпоинт
  const handleSaveRoles = useCallback(async (roleData) => {
    setLoading(true);

    try {
      await eventsAPI.updateEventRoles(event.id, roleData);

      await Promise.all([
        loadOrganizers(),
        loadAllModerators()
      ]);

      showNotification('Роли успешно обновлены');
      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      console.error('❌ Ошибка обновления ролей:', error);
      showNotification('Ошибка при обновлении ролей', 'error');
    } finally {
      setLoading(false);
    }
  }, [event?.id, onEventUpdate]);

  // Функции для локального обновления
  const handleLocalOrganizersUpdate = (newOrganizers) => {
    setOrganizers(newOrganizers);
  };

  const handleLocalSectionModeratorsUpdate = (sectionId, userId) => {
    setSectionModerators(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter(m => m.id !== userId)
    }));
    setForceUpdate(prev => prev + 1);
  };

  const handleLocalPlenaryModeratorsUpdate = (newModerators) => {
    setPlenaryModerators(newModerators);
    setForceUpdate(prev => prev + 1);
  };

  // Удаление организатора
  const handleRemoveOrganizer = async (userId) => {
    setLoading(true);
    try {
      await eventsAPI.updateEventRoles(event.id, {
        removeOrganizers: [userId],
        addOrganizers: [],
        addPlenaryModerators: [],
        removePlenaryModerators: [],
        addSectionModerators: {},
        removeSectionModerators: {}
      });

      await Promise.all([
        loadOrganizers(),
        loadAllModerators()
      ]);

      showNotification('Организатор удален');
      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      console.error('Ошибка удаления организатора:', error);
      showNotification('Ошибка при удалении организатора', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Удаление модератора из секции
  const handleRemoveModerator = async (sectionId, userId) => {
    setLoading(true);
    try {
      await eventsAPI.updateEventRoles(event.id, {
        removeOrganizers: [],
        addOrganizers: [],
        addPlenaryModerators: [],
        removePlenaryModerators: [],
        addSectionModerators: {},
        removeSectionModerators: {
          [sectionId]: [userId]
        }
      });

      await Promise.all([
        loadOrganizers(),
        loadAllModerators()
      ]);

      showNotification('Модератор удален из секции');
      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      console.error('Ошибка удаления модератора из секции:', error);
      showNotification('Ошибка при удалении модератора из секции', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Удаление пленарного модератора
  const handleRemovePlenaryModerator = async (userId) => {
    setLoading(true);

    try {
      await eventsAPI.updateEventRoles(event.id, {
        removeOrganizers: [],
        addOrganizers: [],
        addPlenaryModerators: [],
        removePlenaryModerators: [userId],
        addSectionModerators: {},
        removeSectionModerators: {}
      });

      await Promise.all([
        loadOrganizers(),
        loadAllModerators()
      ]);

      showNotification('Модератор удален из пленарного заседания');
      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      console.error('Ошибка удаления модератора из пленарного заседания:', error);
      showNotification('Ошибка при удалении модератора из пленарного заседания', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManageRolesClick = (tab = 'organizers') => {
    handleMenuClose();
    setManageRolesInitialTab(tab);
    setManageRolesReadOnly(!canManageModerators); // Только для создателя и организатора
    Promise.all([
      loadOrganizers(),
      loadAllModerators()
    ]).then(() => {
      setManageRolesModalOpen(true);
    });
  };

  const handleViewRolesClick = (tab = 'organizers') => {
    setManageRolesInitialTab(tab);
    setManageRolesReadOnly(true);
    Promise.all([
      loadOrganizers(),
      loadAllModerators()
    ]).then(() => {
      setManageRolesModalOpen(true);
    });
  };

  // Обработчик для кнопки "Документы"
  const handleShowDocuments = () => {
    loadEventDocuments();
    setDocumentsModalOpen(true);
  };

  // Обработчик обновления документов
  const handleDocumentsUpdate = (newDocuments) => {
    setEventDocuments(newDocuments);
  };

  // ============================================
  // ЛОГИКА ДЛЯ УПРАВЛЕНИЯ УЧАСТИЕМ
  // ============================================

  const handleParticipateClick = () => {
    setParticipateMode('create');
    setExistingParticipant(null);
    setParticipateModalOpen(true);
  };

  const handleEditParticipationClick = () => {
    const myParticipant = participants.find(p => p.user?.id === user?.id);
    if (myParticipant) {
      setParticipateMode('edit');
      setExistingParticipant(myParticipant);
      setParticipateModalOpen(true);
    }
  };

  const handleParticipationSuccess = () => {
    showNotification(
      participateMode === 'create'
        ? 'Заявка успешно отправлена!'
        : 'Изменения сохранены!'
    );
    if (onParticipantsUpdate) {
      onParticipantsUpdate();
    }
    if (onEventUpdate) {
      onEventUpdate();
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'draft': 'Черновик',
      'published': 'Опубликовано',
      'registration_closed': 'Регистрация закрыта',
      'in_progress': 'Идёт мероприятие',
      'completed': 'Завершено',
      'cancelled': 'Отменено'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'draft': '#9e9e9e',
      'published': '#4caf50',
      'registration_closed': '#ff9800',
      'in_progress': '#2196f3',
      'completed': '#9c27b0',
      'cancelled': '#f44336'
    };
    return colorMap[status] || '#9e9e9e';
  };

  const getNextStatus = () => {
    const today = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const deadline = new Date(event.registration_deadline);

    if (event.status === 'draft') return 'published';
    if (event.status === 'published' && today > deadline) return 'registration_closed';
    if (event.status === 'registration_closed' && today >= startDate) return 'in_progress';
    if (event.status === 'in_progress' && today > endDate) return 'completed';
    return null;
  };

  const handlePublishClick = () => {
    setShowCancelButton(true);
    if (onPublish) {
      onPublish(getNextStatus() || 'published');
    }
  };

  const handleCancelClick = () => {
    setShowCancelButton(false);
    if (onCancel) {
      onCancel();
    }
  };

  const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8001${path}`;
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false,
    fade: false,
    cssEase: "cubic-bezier(0.645, 0.045, 0.355, 1)",
    swipe: true,
    swipeToSlide: true,
    touchThreshold: 10,
    draggable: true,
    adaptiveHeight: false,
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditEvent = () => {
    handleMenuClose();
    setEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    onDelete?.();
  };

  const handleEventSaved = (updatedEvent) => {
    if (onEventUpdate) {
      onEventUpdate(updatedEvent);
    }
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const approvedParticipants = participants.filter(p => p.status === 'approved');
  const pendingRequests = participants.filter(p => p.status === 'pending');

  return (
    <HeaderContainer
      elevation={0}
      hasimages={coverImages.length > 0 ? 'true' : 'false'}
    >
      {coverImages.length > 0 && (
        <>
          <SliderContainer>
            <Slider {...sliderSettings}>
              {coverImages.map((img, index) => (
                <div key={index}>
                  <ImageContainer>
                    <img
                      src={getFullImageUrl(img)}
                      alt={`Slide ${index + 1}`}
                    />
                  </ImageContainer>
                </div>
              ))}
            </Slider>
          </SliderContainer>
          <DarkOverlay />
        </>
      )}

      <Box sx={{ position: 'relative', minHeight: 400, display: 'flex', p: 4, zIndex: 3 }}>
        <Box sx={{
          position: 'relative',
          zIndex: 4,
          width: '60%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'left'
        }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <Chip
              label={`${typeInfo?.icon || '📅'} ${typeInfo?.label || event.type}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }}
            />
            <Chip
              label={levelInfo?.label || event.level}
              size="small"
              sx={{ bgcolor: levelInfo?.color, color: 'white', fontWeight: 500 }}
            />
            <Chip
              label={getStatusLabel(event.status)}
              size="small"
              sx={{
                bgcolor: getStatusColor(event.status),
                color: 'white',
                fontWeight: 500
              }}
            />
          </Box>

          <Typography variant="h3" fontWeight="700" gutterBottom sx={{ color: 'white', textAlign: 'left' }}>
            {event.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarIcon fontSize="small" />
              <Typography variant="body2">
                {formatDate(event.start_date)} — {formatDate(event.end_date)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FlagIcon fontSize="small" />
              <Typography variant="body2">
                Регистрация до {formatDate(event.registration_deadline)}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '80%', mb: 3, textAlign: 'left' }}>
            {event.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {allOrganizers.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: canManageEvent ? 'pointer' : 'default',
                  '&:hover': canManageEvent ? { opacity: 0.8 } : {}
                }}
                onClick={() => {
                  if (canManageEvent) {
                    handleManageRolesClick('organizers');
                  } else {
                    handleViewRolesClick('organizers');
                  }
                }}
              >
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Организаторы:
                </Typography>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.75rem', border: '2px solid white' } }}>
                  {allOrganizers.slice(0, 3).map(org => (
                    <Tooltip key={org.id} title={`${org.first_name} ${org.last_name} ${org.id === event?.created_by?.id ? '(Создатель)' : ''}`}>
                      <Avatar src={org.avatar} sx={{ bgcolor: org.id === event?.created_by?.id ? 'warning.main' : 'primary.main' }}>
                        {getInitials(org.first_name, org.last_name)}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
                {allOrganizers.length > 3 && (
                  <Typography variant="caption" sx={{ color: 'white', ml: 0.5 }}>
                    +{allOrganizers.length - 3}
                  </Typography>
                )}
              </Box>
            )}

            {allModerators.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: canManageEvent ? 'pointer' : 'default',
                  '&:hover': canManageEvent ? { opacity: 0.8 } : {}
                }}
                onClick={() => {
                  if (canManageEvent) {
                    handleManageRolesClick('moderators');
                  } else {
                    handleViewRolesClick('moderators');
                  }
                }}
              >
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Модераторы:
                </Typography>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.75rem', border: '2px solid white' } }}>
                  {allModerators.slice(0, 3).map(mod => (
                    <Tooltip key={mod.id} title={`${mod.first_name} ${mod.last_name}`}>
                      <Avatar src={mod.avatar} sx={{ bgcolor: 'success.main' }}>
                        {getInitials(mod.first_name, mod.last_name)}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
                {allModerators.length > 3 && (
                  <Typography variant="caption" sx={{ color: 'white', ml: 0.5 }}>
                    +{allModerators.length - 3}
                  </Typography>
                )}
              </Box>
            )}

            {/* 🔥 Участники - всегда показываем */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={() => setParticipantsModalOpen(true)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Участники:
                </Typography>
                {pendingRequests.length > 0 && canManageApplications && (
                  <Badge
                    badgeContent={pendingRequests.length}
                    color="warning"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.6rem',
                        height: 16,
                        minWidth: 16,
                        position: 'relative',
                        transform: 'none',
                        ml: 0.5
                      }
                    }}
                  />
                )}
              </Box>
              <AvatarGroup
                max={5}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    fontSize: '0.75rem',
                    border: '2px solid white'
                  }
                }}
              >
                {approvedParticipants.length > 0 ? (
                  approvedParticipants.slice(0, 5).map(p => (
                    <Tooltip key={p.id} title={`${p.user?.first_name} ${p.user?.last_name}`}>
                      <Avatar src={p.user?.avatar} sx={{ bgcolor: p.user?.id === event.created_by?.id ? 'warning.main' : 'primary.dark' }}>
                        {getInitials(p.user?.first_name, p.user?.last_name)}
                      </Avatar>
                    </Tooltip>
                  ))
                ) : (
                  <Tooltip title="Нет участников">
                    <Avatar sx={{ bgcolor: 'grey.500' }}>
                      <PeopleIcon fontSize="small" />
                    </Avatar>
                  </Tooltip>
                )}
              </AvatarGroup>
              {approvedParticipants.length > 5 && (
                <Typography variant="caption" sx={{ color: 'white', ml: 0.5 }}>
                  +{approvedParticipants.length - 5}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{
          position: 'relative',
          zIndex: 4,
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end'
        }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
            {canManageEvent && event.status === 'draft' && (
              <Tooltip title="Опубликовать мероприятие">
                <IconButton
                  onClick={handlePublishClick}
                  sx={{
                    bgcolor: '#4caf50',
                    color: 'white',
                    width: 40,
                    height: 40,
                    '&:hover': {
                      bgcolor: '#45a049'
                    }
                  }}
                >
                  <PublishIcon />
                </IconButton>
              </Tooltip>
            )}

            {canManageEvent && event.status !== 'draft' && event.status !== 'completed' && event.status !== 'cancelled' && (
              <Tooltip title="Отменить мероприятие">
                <IconButton
                  onClick={handleCancelClick}
                  sx={{
                    bgcolor: '#f44336',
                    color: 'white',
                    width: 40,
                    height: 40,
                    '&:hover': {
                      bgcolor: '#d32f2f'
                    }
                  }}
                >
                  <BlockIcon />
                </IconButton>
              </Tooltip>
            )}

            {canEditCover && (
              <Tooltip title="Редактировать обложку">
                <IconButton
                  onClick={onEdit}
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                    width: 40,
                    height: 40
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}

            {isCreator_ && (
              <>
                <Tooltip title="Управление мероприятием">
                  <IconButton
                    onClick={handleMenuClick}
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                      width: 40,
                      height: 40
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 250,
                      borderRadius: 2,
                      boxShadow: 3
                    }
                  }}
                >
                  <MenuItem onClick={handleEditEvent}>
                    <ListItemIcon>
                      <EventNoteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Настройки мероприятия</ListItemText>
                  </MenuItem>

                  <Divider />

                  <MenuItem onClick={() => handleManageRolesClick('organizers')}>
                    <ListItemIcon>
                      <GroupsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Управление ролями</ListItemText>
                  </MenuItem>

                  <Divider />

                  <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Удалить мероприятие</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* Кнопки участия */}
            {!canManageEvent && (() => {
              const myParticipation = participants.find(p => p.user?.id === user?.id);
              const myStatus = myParticipation?.status;

              if (myStatus === 'rejected') {
                return null;
              }

              if (myStatus === 'cancelled' || !myParticipation) {
                return (
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleParticipateClick}
                    sx={{
                      borderRadius: 6,
                      textTransform: 'none',
                      backgroundColor: 'white',
                      color: 'primary.main',
                      px: 3,
                      py: 1,
                      fontSize: '0.9rem',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    Принять участие
                  </Button>
                );
              }

              if (myStatus === 'pending') {
                return (
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<EditNoteIcon />}
                    onClick={handleEditParticipationClick}
                    sx={{
                      borderRadius: 6,
                      textTransform: 'none',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      px: 3,
                      py: 1,
                      fontSize: '0.9rem',
                      backdropFilter: 'blur(4px)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    Редактировать заявку
                  </Button>
                );
              }

              if (myStatus === 'approved') {
                return (
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<EditNoteIcon />}
                    onClick={handleEditParticipationClick}
                    sx={{
                      borderRadius: 6,
                      textTransform: 'none',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      px: 3,
                      py: 1,
                      fontSize: '0.9rem',
                      backdropFilter: 'blur(4px)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)'
                      }
                    }}
                  >
                    Управление участием
                  </Button>
                );
              }

              return null;
            })()}

            {canManageConference && !conferenceLink && (
              <Button
                variant="contained"
                size="medium"
                startIcon={<VideoCallIcon />}
                onClick={onCreateConference}
                sx={{
                  borderRadius: 6,
                  textTransform: 'none',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  color: 'rgba(0,0,0,0.7)',
                  px: 3,
                  py: 1,
                  fontSize: '0.9rem',
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: 'rgba(0,0,0,0.9)'
                  }
                }}
              >
                Создать видеоконференцию
              </Button>
            )}

            {conferenceLink && (
              <>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<VideoCallIcon />}
                  onClick={onJoinConference}
                  sx={{
                    borderRadius: 6,
                    textTransform: 'none',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    color: 'rgba(0,0,0,0.7)',
                    px: 3,
                    py: 1,
                    fontSize: '0.9rem',
                    backdropFilter: 'blur(4px)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: 'rgba(0,0,0,0.9)'
                    }
                  }}
                >
                  Войти в конференцию
                </Button>

                {canManageConference && (
                  <Button
                    variant="contained"
                    size="medium"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={onEndConference}
                    sx={{
                      borderRadius: 6,
                      textTransform: 'none',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      color: '#d32f2f',
                      px: 3,
                      py: 1,
                      fontSize: '0.9rem',
                      backdropFilter: 'blur(4px)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: '#b71c1c'
                      }
                    }}
                  >
                    ЗАВЕРШИТЬ
                  </Button>
                )}
              </>
            )}

            <Button
              variant="contained"
              size="medium"
              startIcon={<MenuBookIcon />}
              onClick={onShowProgram}
              sx={{
                borderRadius: 6,
                textTransform: 'none',
                backgroundColor: 'rgba(255,255,255,0.8)',
                color: 'rgba(0,0,0,0.7)',
                px: 3,
                py: 1,
                fontSize: '0.9rem',
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: 'rgba(0,0,0,0.9)'
                }
              }}
            >
              Программа
            </Button>

            <Button
              variant="contained"
              size="medium"
              startIcon={<FolderIcon />}
              onClick={handleShowDocuments}
              sx={{
                borderRadius: 6,
                textTransform: 'none',
                backgroundColor: 'rgba(255,255,255,0.8)',
                color: 'rgba(0,0,0,0.7)',
                px: 3,
                py: 1,
                fontSize: '0.9rem',
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: 'rgba(0,0,0,0.9)'
                }
              }}
            >
              Документы
            </Button>
          </Box>
        </Box>
      </Box>

      <EditEventModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={event}
        onSave={handleEventSaved}
      />

      <EventParticipantsModal
        open={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        eventId={event?.id}
        participants={participants}
        canManageApplications={canManageApplications}
        onParticipantsUpdate={onParticipantsUpdate}
      />

      <ManageRolesModal
        open={manageRolesModalOpen}
        onClose={() => setManageRolesModalOpen(false)}
        eventId={event?.id}
        eventTitle={event?.title}
        eventCreator={event?.created_by}
        sections={sections}
        participants={participants}
        existingOrganizers={organizers}
        existingSectionModerators={sectionModerators}
        existingPlenaryModerators={plenaryModerators}
        onSave={handleSaveRoles}
        onRemoveOrganizer={handleRemoveOrganizer}
        onRemoveModerator={handleRemoveModerator}
        onRemovePlenaryModerator={handleRemovePlenaryModerator}
        onOrganizersUpdate={handleLocalOrganizersUpdate}
        onSectionModeratorsUpdate={handleLocalSectionModeratorsUpdate}
        onPlenaryModeratorsUpdate={handleLocalPlenaryModeratorsUpdate}
        isLoading={loading}
        initialTab={manageRolesInitialTab}
        readOnly={!canManageModerators}
      />

      <EventDocumentsModal
        open={documentsModalOpen}
        onClose={() => setDocumentsModalOpen(false)}
        eventId={event?.id}
        documents={eventDocuments}
        canManageDocuments={canManageDocuments}
        onDocumentsUpdate={handleDocumentsUpdate}
      />

      <EventParticipateModal
        open={participateModalOpen}
        onClose={() => setParticipateModalOpen(false)}
        eventId={eventDataRef.current.id}
        eventTitle={eventDataRef.current.title}
        sections={eventDataRef.current.sections}
        existingParticipant={existingParticipant}
        mode={participateMode}
        onSuccess={handleParticipationSuccess}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            borderRadius: 2,
            boxShadow: 3,
            minWidth: 300
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </HeaderContainer>
  );
};

export default EventHeader;