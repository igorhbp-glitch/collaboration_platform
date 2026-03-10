// frontend/src/components/Events/SectionHeader.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Avatar,
  AvatarGroup,
  Tooltip,
  IconButton,
  Button
} from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  MenuBook as MenuBookIcon,
  Settings as SettingsIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';

// Импорт для слайдера
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Импорт модалок
import EditSectionCoverModal from './EditSectionCoverModal';
import EditSectionModal from './EditSectionModal';
import ConferenceJitsi from './ConferenceJitsi';

// API
import { sectionsAPI } from '../../services/eventsAPI'; // 🔥 ДОБАВЛЯЕМ ИМПОРТ

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

const SectionHeader = ({
  section,
  speakers = [],
  isCreator,
  isOrganizer,
  isSectionModerator,
  canEditCover,
  canManageConference,
  onEdit,
  onDelete,
  onVideoConference,
  onShowProgram,
  onSpeakersClick
}) => {
  const { user } = useAuth();
  const [coverImages, setCoverImages] = useState(section.cover_images || []);
  const [editCoverModalOpen, setEditCoverModalOpen] = useState(false);
  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [conferenceModalOpen, setConferenceModalOpen] = useState(false);
  const [conferenceLink, setConferenceLink] = useState(section.conference_link);

  // Права на редактирование
  const canEdit = isCreator || isOrganizer || isSectionModerator;

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'd MMMM yyyy', { locale: ru });
    } catch {
      return dateString;
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

  const handleEditCover = () => {
    setEditCoverModalOpen(true);
  };

  const handleCoverSaved = (newImages) => {
    setCoverImages(newImages);
    section.cover_images = newImages;
  };

  const handleEditSection = () => {
    setEditSectionModalOpen(true);
  };

  const handleSectionSaved = (updatedSection) => {
    section.title = updatedSection.title;
    section.description = updatedSection.description;
    section.about = updatedSection.about;
    setEditSectionModalOpen(false);
  };

  const handleCreateConference = () => {
    setConferenceModalOpen(true);
  };

  const handleConferenceCreated = (link) => {
    setConferenceLink(link);
    section.conference_link = link;
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗАВЕРШЕНИЯ КОНФЕРЕНЦИИ
  const handleEndConference = async () => {
    if (!window.confirm('Вы уверены, что хотите завершить конференцию? Ссылка будет удалена.')) {
      return;
    }

    try {
      // Вызываем API для удаления ссылки
      await sectionsAPI.clearSectionConferenceLink(section.id);

      // Обновляем локальное состояние
      setConferenceLink(null);
      section.conference_link = null;

      // Показываем уведомление (нужно добавить пропс для этого)
      if (onVideoConference) {
        // Можно передать уведомление через родителя
        console.log('✅ Конференция завершена');
      }
    } catch (err) {
      console.error('❌ Ошибка при завершении конференции:', err);
      // Здесь можно показать уведомление об ошибке
    }
  };

  // Берём первых 5 выступающих для аватарок
  const topSpeakers = speakers.slice(0, 5);

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
          {/* Чипы с информацией из мероприятия */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {section.event_type && (
              <Chip
                label={section.event_type_display || section.event_type}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }}
              />
            )}
            {section.event_level && (
              <Chip
                label={section.event_level_display || section.event_level}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }}
              />
            )}
            {section.event_status && (
              <Chip
                label={section.event_status_display || section.event_status}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 500 }}
              />
            )}
          </Box>

          {/* Название секции */}
          <Typography variant="h3" fontWeight="700" gutterBottom sx={{ color: 'white', textAlign: 'left' }}>
            {section.title}
          </Typography>

          {/* Даты мероприятия */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {section.event_start_date && section.event_end_date && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon fontSize="small" />
                <Typography variant="body2">
                  {formatDate(section.event_start_date)} — {formatDate(section.event_end_date)}
                </Typography>
              </Box>
            )}
            {section.event_registration_deadline && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FlagIcon fontSize="small" />
                <Typography variant="body2">
                  Регистрация до {formatDate(section.event_registration_deadline)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Описание секции */}
          {section.description && (
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '80%', mb: 3, textAlign: 'left' }}>
              {section.description}
            </Typography>
          )}

          {/* Модераторы и выступающие */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {/* Модераторы */}
            {section.moderators && section.moderators.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Модераторы:
                </Typography>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.75rem', border: '2px solid white' } }}>
                  {section.moderators.slice(0, 3).map(mod => (
                    <Tooltip key={mod.id} title={`${mod.first_name} ${mod.last_name}`}>
                      <Avatar src={mod.avatar} sx={{ bgcolor: 'success.main' }}>
                        {getInitials(mod.first_name, mod.last_name)}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
                {section.moderators.length > 3 && (
                  <Typography variant="caption" sx={{ color: 'white', ml: 0.5 }}>
                    +{section.moderators.length - 3}
                  </Typography>
                )}
              </Box>
            )}

            {/* Выступающие - кликабельные */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 }
              }}
              onClick={onSpeakersClick}
            >
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Докладчики:
              </Typography>
              {speakers.length > 0 ? (
                <>
                  <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.75rem', border: '2px solid white' } }}>
                    {topSpeakers.map((speaker) => {
                      const firstName = speaker.user?.first_name || speaker.first_name || '';
                      const lastName = speaker.user?.last_name || speaker.last_name || '';
                      const fullName = speaker.name || `${firstName} ${lastName}`.trim() || 'Докладчик';
                      const avatarUrl = speaker.user?.avatar || speaker.avatar;

                      return (
                        <Tooltip key={speaker.id} title={fullName}>
                          <Avatar
                            src={avatarUrl}
                            sx={{ bgcolor: 'primary.dark' }}
                          >
                            {getInitials(firstName, lastName)}
                          </Avatar>
                        </Tooltip>
                      );
                    })}
                  </AvatarGroup>
                  {speakers.length > 5 && (
                    <Typography variant="caption" sx={{ color: 'white', ml: 0.5 }}>
                      +{speakers.length - 5}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                  Нет докладчиков
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
            {/* Кнопка редактирования обложки */}
            {canEditCover && (
              <Tooltip title="Редактировать обложку">
                <IconButton
                  onClick={handleEditCover}
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

            {/* Кнопка редактирования секции */}
            {canEdit && (
              <Tooltip title="Редактировать секцию">
                <IconButton
                  onClick={handleEditSection}
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
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* Кнопка программы */}
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

            {/* Кнопка видеоконференции */}
            {canManageConference && !conferenceLink && (
              <Button
                variant="contained"
                size="medium"
                startIcon={<VideoCallIcon />}
                onClick={handleCreateConference}
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
                Создать конференцию
              </Button>
            )}

            {conferenceLink && (
              <>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<VideoCallIcon />}
                  onClick={onVideoConference}
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

                {/* 🔥 ИСПРАВЛЕННАЯ КНОПКА ЗАВЕРШЕНИЯ */}
                {canManageConference && (
                  <Button
                    variant="contained"
                    size="medium"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleEndConference}
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
                    Завершить
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Модальное окно редактирования обложки */}
      <EditSectionCoverModal
        open={editCoverModalOpen}
        onClose={() => setEditCoverModalOpen(false)}
        sectionId={section.id}
        currentImages={coverImages}
        onSave={handleCoverSaved}
      />

      {/* Модальное окно редактирования секции */}
      <EditSectionModal
        open={editSectionModalOpen}
        onClose={() => setEditSectionModalOpen(false)}
        section={section}
        onSave={handleSectionSaved}
      />

      {/* Модальное окно конференции */}
      <ConferenceJitsi
        open={conferenceModalOpen}
        onClose={() => setConferenceModalOpen(false)}
        eventId={section.event}
        sectionId={section.id}
        eventTitle={section.event_title}
        sectionTitle={section.title}
        onConferenceCreated={handleConferenceCreated}
        existingLink={conferenceLink}
      />
    </HeaderContainer>
  );
};

export default SectionHeader;