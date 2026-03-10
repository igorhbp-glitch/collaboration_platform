// frontend/src/components/Events/NewsCard.js
import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Avatar,
  Tooltip,
  alpha,
  useTheme,
  GlobalStyles
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// ============================================
// ГЛОБАЛЬНЫЕ СТИЛИ ДЛЯ АНИМАЦИИ
// ============================================
const animationStyles = {
  '@keyframes heartBeat': {
    '0%': { transform: 'scale(1)' },
    '25%': { transform: 'scale(1.3)' },
    '50%': { transform: 'scale(1)' },
    '75%': { transform: 'scale(1.2)' },
    '100%': { transform: 'scale(1)' }
  }
};

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const CardContainer = styled(Box)(({ theme }) => ({
  minWidth: 280,
  maxWidth: 280,
  position: 'relative',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  marginBottom: theme.spacing(2),
  '&:hover': {
    transform: 'translateY(0)',
    '& .bottom-card': {
      transform: 'translateY(20px)',
      boxShadow: theme.shadows[1]
    }
  }
}));

const TopCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 160,
  borderRadius: theme.spacing(3),
  overflow: 'hidden',
  zIndex: 2,
  boxShadow: theme.shadows[0],
  backgroundColor: theme.palette.grey[900],
  '& img, & video': {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
}));

const BottomCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  marginTop: -60,
  padding: theme.spacing(3, 2, 2, 2),
  borderRadius: theme.spacing(4),
  boxShadow: theme.shadows[1],
  backgroundColor: theme.palette.grey[50],
  zIndex: 1,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  minHeight: 140,
  transform: 'translateY(0)'
}));

const MediaIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  borderRadius: theme.spacing(2),
  padding: '2px 8px',
  fontSize: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  zIndex: 3
}));

const SectionChip = styled(Chip)(({ theme, color }) => ({
  position: 'absolute',
  top: 8,
  left: 8,
  backgroundColor: color || theme.palette.primary.main,
  color: 'white',
  fontSize: '0.7rem',
  height: 24,
  zIndex: 3,
  '& .MuiChip-label': {
    px: 1
  }
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const NewsCard = ({
  news,
  sections = [],
  isLiked = false,
  onLikeToggle,
  onClick
}) => {
  const theme = useTheme();

  const getFirstMedia = (media) => {
    if (!media || media.length === 0) return null;
    return media[0];
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'только что';
      if (diffMins < 60) return `${diffMins} мин. назад`;
      if (diffHours < 24) return `${diffHours} ч. назад`;
      if (diffDays === 1) return 'вчера';
      if (diffDays < 7) return `${diffDays} дн. назад`;

      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const firstMedia = getFirstMedia(news.media);
  const section = sections.find(s => s.id === news.section);

  // 🔥 ОБРАБОТЧИК ЛАЙКА С ПРЕДОТВРАЩЕНИЕМ ВСПЛЫТИЯ
  const handleLikeClick = (e) => {
    e.stopPropagation();
    onLikeToggle(news.id, e);
  };

  return (
    <>
      <GlobalStyles styles={animationStyles} />
      <CardContainer onClick={onClick}>
        <TopCard>
          {firstMedia ? (
            firstMedia.type === 'video' ? (
              <video
                src={firstMedia.url}
                muted={news.video_plays_automuted}
                autoPlay={false}
                loop
                playsInline
              />
            ) : (
              <img src={firstMedia.url} alt={news.title} />
            )
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.200'
              }}
            >
              <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
            </Box>
          )}

          {news.media?.length > 1 && (
            <MediaIndicator>
              {news.media[0].type === 'video' ? <VideoIcon /> : <ImageIcon />}
              {news.media.length}
            </MediaIndicator>
          )}

          {section && (
            <SectionChip
              label={section.title}
              size="small"
              color={section.color}
            />
          )}
        </TopCard>

        <BottomCard className="bottom-card">
          {/* Краткое описание */}
          <Typography
            variant="body2"
            fontWeight="300"
            sx={{
              color: '#2d3e50',
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontSize: '0.8rem',
              minHeight: 36,
              opacity: 0.8
            }}
          >
            {news.display_excerpt || news.content}
          </Typography>

          {/* Заголовок */}
          <Typography
            variant="h6"
            fontWeight="300"
            textTransform="uppercase"
            sx={{
              color: '#3c6e71',
              mb: 1,
              mt: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              letterSpacing: '0.5px',
              lineHeight: 1.3
            }}
          >
            {news.title}
          </Typography>

          {/* Индикаторы */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Дата */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: 14, color: '#4a5b6b' }} />
              <Typography variant="caption" sx={{ color: '#4a5b6b' }}>
                {formatDate(news.created_at)}
              </Typography>
            </Box>

            {/* Просмотры */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <VisibilityIcon sx={{ fontSize: 14, color: '#4a5b6b' }} />
              <Typography variant="caption" sx={{ color: '#4a5b6b' }}>
                {news.views_count || 0}
              </Typography>
            </Box>

            {/* 🔥 ЛАЙК С АНИМАЦИЕЙ - ВАРИАНТ 4 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleLikeClick}
                sx={{
                  p: 0,
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: 'scale(1.2)',
                    color: '#c44545'
                  },
                  '&:active': {
                    transform: 'scale(1.5)'
                  },
                  '& .MuiSvgIcon-root': {
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                {isLiked ? (
                  <FavoriteIcon
                    sx={{
                      fontSize: 14,
                      color: '#c44545',
                      filter: 'drop-shadow(0 0 2px rgba(196, 69, 69, 0.5))',
                      animation: 'heartBeat 0.3s ease-in-out'
                    }}
                  />
                ) : (
                  <FavoriteBorderIcon sx={{ fontSize: 14, color: '#6b7c8c' }} />
                )}
              </IconButton>
              <Typography variant="caption" sx={{ color: '#4a5b6b' }}>
                {news.likes_count || 0}
              </Typography>
            </Box>

            {/* Автор */}
            {news.created_by && (
              <Tooltip title={`Автор: ${news.created_by.full_name || news.created_by.email}`}>
                <Avatar
                  src={news.created_by.avatar}
                  sx={{
                    width: 20,
                    height: 20,
                    ml: 'auto',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  {news.created_by.full_name?.charAt(0) || '?'}
                </Avatar>
              </Tooltip>
            )}
          </Box>
        </BottomCard>
      </CardContainer>
    </>
  );
};

export default NewsCard;