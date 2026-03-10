// frontend/src/components/News/NewsFeedCard.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Avatar,
  Tooltip,
  useTheme,
  Chip,
  alpha
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Schedule as ScheduleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const CardContainer = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  marginBottom: theme.spacing(3),
  boxShadow: 'none',
  cursor: 'pointer',
  transition: 'none',
  '&:hover': {
    boxShadow: 'none'
  }
}));

// 🔥 КОНТЕЙНЕР ДЛЯ МЕДИА С ПОЛЯМИ - БЕЛЫЙ ФОН
const MediaWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 3, 0, 3),
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  position: 'relative'
}));

// 🔥 МЕДИА КОНТЕЙНЕР
const MediaContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 300,
  backgroundColor: theme.palette.grey[900],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  borderRadius: 20
}));

// 🔥 КОНТЕЙНЕР ДЛЯ КНОПОК ВНИЗУ
const BottomButtonsContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  zIndex: 10
}));

// 🔥 КНОПКА МЕРОПРИЯТИЯ С ТЕКСТОМ
const EventButton = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  border: '0.5px solid rgba(255, 255, 255, 0.8)',
  borderRadius: theme.spacing(5),
  padding: theme.spacing(0.75, 2),
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  cursor: 'pointer',
  backdropFilter: 'blur(4px)',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'white'
  }
}));

const EventButtonText = styled(Typography)(({ theme }) => ({
  color: 'white',
  fontWeight: 500,
  fontSize: '0.9rem',
  textTransform: 'none'
}));

// 🔥 ЧИП ДЛЯ ТИПА МЕРОПРИЯТИЯ - В ЦВЕТЕ PRIMARY
const EventTypeChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.8),
  color: 'white',
  borderRadius: theme.spacing(5),
  height: 32,
  backdropFilter: 'blur(4px)',
  marginRight: theme.spacing(1),
  border: 'none',
  '& .MuiChip-label': {
    fontWeight: 500,
    fontSize: '0.8rem',
    padding: theme.spacing(0, 2)
  }
}));

const MediaImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  cursor: 'pointer'
});

const MediaNavButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(255,255,255,0.8)',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.9)'
  },
  zIndex: 2
}));

// 🔥 СЧЕТЧИК МЕДИА
const MediaCounter = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(0.5, 1.5),
  fontSize: '0.875rem',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  zIndex: 2
}));

// 🔥 КОНТЕНТ
const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 3, 3, 4)
}));

const StatsBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`
}));

const StatItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary
}));

// ============================================
// НАТИВНЫЙ ВИДЕО-ПЛЕЕР
// ============================================

const NativeVideoPlayer = ({ url }) => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!containerRef.current || !url) return;

    containerRef.current.innerHTML = '';

    const video = document.createElement('video');
    video.controls = true;
    video.src = url;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.backgroundColor = '#000';
    video.setAttribute('playsinline', '');
    video.setAttribute('controlsList', 'nodownload');

    containerRef.current.appendChild(video);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [url]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: '#000',
        position: 'relative'
      }}
    />
  );
};

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const NewsFeedCard = ({
  news,
  isLiked = false,
  onLikeToggle,
  onClick
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const mediaItems = news.media || [];
  const currentMedia = mediaItems[currentMediaIndex];

  const handlePreviousMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) =>
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };

  const handleNextMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) =>
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };

  const handleEventClick = (e) => {
    e.stopPropagation();
    navigate(`/events/${news.event}`);
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ru
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
  };

  const getEventDisplayName = () => {
    if (!news.event_title) return 'Мероприятие';
    if (news.event_title.length > 25) {
      return news.event_title.substring(0, 22) + '...';
    }
    return news.event_title;
  };

  // 🔥 ТИП МЕРОПРИЯТИЯ С БЭКЕНДА
  const eventTypeDisplay = news.event_type_display;

  return (
    <CardContainer onClick={() => onClick(news)}>
      {/* МЕДИА С ПОЛЯМИ */}
      {mediaItems.length > 0 && (
        <MediaWrapper>
          <MediaContainer>
            {currentMedia.type === 'video' ? (
              <NativeVideoPlayer url={currentMedia.url} />
            ) : (
              <MediaImage
                src={currentMedia.url}
                alt={`media-${currentMediaIndex}`}
              />
            )}

            {mediaItems.length > 1 && (
              <>
                <MediaNavButton
                  onClick={handlePreviousMedia}
                  sx={{ left: theme.spacing(2) }}
                  size="small"
                >
                  <ChevronLeftIcon />
                </MediaNavButton>
                <MediaNavButton
                  onClick={handleNextMedia}
                  sx={{ right: theme.spacing(2) }}
                  size="small"
                >
                  <ChevronRightIcon />
                </MediaNavButton>
              </>
            )}

            {/* СЧЕТЧИК МЕДИА */}
            <MediaCounter>
              {currentMedia.type === 'video' ? <VideoIcon /> : <ImageIcon />}
              {currentMediaIndex + 1} / {mediaItems.length}
            </MediaCounter>

            {/* КОНТЕЙНЕР ДЛЯ КНОПОК ВНИЗУ */}
            <BottomButtonsContainer>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* 🔥 ТИП МЕРОПРИЯТИЯ - В ЦВЕТЕ PRIMARY */}
                {eventTypeDisplay && (
                  <EventTypeChip
                    label={eventTypeDisplay}
                    size="small"
                  />
                )}

                {/* 🔥 НАЗВАНИЕ МЕРОПРИЯТИЯ */}
                <EventButton onClick={handleEventClick}>
                  <EventIcon sx={{ fontSize: 16, color: 'white' }} />
                  <EventButtonText variant="body2">
                    {getEventDisplayName()}
                  </EventButtonText>
                </EventButton>
              </Box>
            </BottomButtonsContainer>
          </MediaContainer>
        </MediaWrapper>
      )}

      {/* Контент */}
      <ContentContainer>
        {/* Заголовок */}
        <Typography
          variant="h5"
          fontWeight="700"
          sx={{
            mb: 1.5,
            textAlign: 'left'
          }}
        >
          {news.title}
        </Typography>

        {/* Краткое содержание */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mb: 2,
            lineHeight: 1.6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            textAlign: 'left'
          }}
        >
          {news.display_excerpt || news.content}
        </Typography>

        {/* Статистика */}
        <StatsBar>
          <StatItem>
            <ScheduleIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">
              {formatDate(news.created_at)}
            </Typography>
          </StatItem>

          <StatItem>
            <VisibilityIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2">
              {news.views_count || 0}
            </Typography>
          </StatItem>

          <StatItem>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onLikeToggle(news.id, e);
              }}
              sx={{
                p: 0,
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'scale(1.2)'
                },
                '&:active': {
                  transform: 'scale(1.5)'
                }
              }}
            >
              {isLiked ? (
                <FavoriteIcon
                  sx={{
                    fontSize: 20,
                    color: '#c44545',
                    filter: 'drop-shadow(0 0 4px rgba(196, 69, 69, 0.5))'
                  }}
                />
              ) : (
                <FavoriteBorderIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
              )}
            </IconButton>
            <Typography variant="body2">
              {news.likes_count || 0}
            </Typography>
          </StatItem>

          {news.created_by && (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title={`Автор: ${news.created_by.full_name || news.created_by.email}`}>
                <Avatar
                  src={news.created_by.avatar}
                  sx={{
                    width: 32,
                    height: 32,
                    border: `2px solid ${theme.palette.primary.light}`
                  }}
                >
                  {getInitials(news.created_by.first_name, news.created_by.last_name)}
                </Avatar>
              </Tooltip>
            </Box>
          )}
        </StatsBar>
      </ContentContainer>
    </CardContainer>
  );
};

export default NewsFeedCard;