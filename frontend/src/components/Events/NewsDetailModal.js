// frontend/src/components/Events/NewsDetailModal.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Paper,
  alpha,
  useTheme,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Snackbar,
  GlobalStyles
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { newsAPI } from '../../services/eventsAPI';
import CreateEditNewsModal from './CreateEditNewsModal';

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

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 800,
    width: '90%',
    maxHeight: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: theme.palette.background.paper
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: 0,
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

const MediaContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 400,
  backgroundColor: theme.palette.grey[900],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
}));

const MediaImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain'
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

const MediaCounter = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 16,
  right: 16,
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: 'white',
  borderRadius: theme.spacing(3),
  padding: '4px 12px',
  fontSize: '0.875rem',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  zIndex: 2
}));

const ContentSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3)
}));

const AuthorChip = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  borderRadius: theme.spacing(5),
  width: 'fit-content'
}));

const StatBadge = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary
}));

// ============================================
// 🔥 НАТИВНЫЙ ВИДЕО-ПЛЕЕР
// ============================================

const NativeVideoPlayer = ({ url }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    containerRef.current.innerHTML = '';

    const video = document.createElement('video');
    video.controls = true;
    video.src = url;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
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
        minHeight: 400,
        bgcolor: '#000',
        position: 'relative'
      }}
    />
  );
};

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const NewsDetailModal = ({
  open,
  onClose,
  news,
  onDelete,
  canEdit = false,
  canDelete = false,
  isLiked = false,           // 🔥 НОВЫЙ ПРОПС
  onLikeToggle               // 🔥 НОВЫЙ ПРОПС
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [likesCount, setLikesCount] = useState(news?.likes_count || 0);
  const [viewsCount, setViewsCount] = useState(news?.views_count || 0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const mediaItems = news?.media || [];
  const currentMedia = mediaItems[currentMediaIndex];

  // Синхронизируем счетчик при изменении пропса
  useEffect(() => {
    setLikesCount(news?.likes_count || 0);
    setViewsCount(news?.views_count || 0);
  }, [news]);

  // Сброс индекса при смене новости
  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [news]);

  const handlePreviousMedia = () => {
    setCurrentMediaIndex((prev) =>
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex((prev) =>
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };

  // 🔥 ОБРАБОТЧИК ЛАЙКА
  const handleLike = async (e) => {
    e.stopPropagation();

    try {
      // Оптимистичное обновление счетчика
      if (isLiked) {
        setLikesCount(prev => prev - 1);
      } else {
        setLikesCount(prev => prev + 1);
      }

      // Вызываем родительскую функцию
      await onLikeToggle(news.id, e);

    } catch (err) {
      console.error('Ошибка при лайке:', err);
      // Откат при ошибке
      setLikesCount(news?.likes_count || 0);
      setSnackbar({
        open: true,
        message: 'Не удалось поставить лайк',
        severity: 'error'
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setSnackbar({
      open: true,
      message: 'Ссылка скопирована в буфер обмена',
      severity: 'success'
    });
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setEditModalOpen(true);
  };

  const handleDelete = async () => {
    handleMenuClose();
    if (!window.confirm('Вы уверены, что хотите удалить эту новость?')) return;

    setLoading(true);
    try {
      await newsAPI.deleteNews(news.id);
      setSnackbar({
        open: true,
        message: 'Новость успешно удалена',
        severity: 'success'
      });
      setTimeout(() => {
        onClose(true);
        if (onDelete) onDelete();
      }, 1500);
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      setSnackbar({
        open: true,
        message: 'Не удалось удалить новость',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = (updatedNews) => {
    setEditModalOpen(false);
    onClose(true);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!news) return null;

  return (
    <>
      <GlobalStyles styles={animationStyles} />

      <StyledDialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
        <StyledDialogTitle>
          <Typography variant="h6" fontWeight="700" component="span">
            {news.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(canEdit || canDelete) && (
              <>
                <IconButton onClick={handleMenuOpen} size="small">
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  {canEdit && (
                    <MenuItem onClick={handleEdit}>
                      <ListItemIcon>
                        <EditIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Редактировать</ListItemText>
                    </MenuItem>
                  )}
                  {canDelete && (
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                      <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText>Удалить</ListItemText>
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
            <IconButton onClick={() => onClose(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </StyledDialogTitle>

        <StyledDialogContent>
          {/* Медиа-карусель */}
          {mediaItems.length > 0 && (
            <MediaContainer>
              {currentMedia.type === 'video' ? (
                <NativeVideoPlayer url={currentMedia.url} />
              ) : (
                <MediaImage src={currentMedia.url} alt={`media-${currentMediaIndex}`} />
              )}

              {mediaItems.length > 1 && (
                <>
                  <MediaNavButton
                    onClick={handlePreviousMedia}
                    sx={{ left: 16 }}
                    size="small"
                  >
                    <ArrowBackIcon />
                  </MediaNavButton>
                  <MediaNavButton
                    onClick={handleNextMedia}
                    sx={{ right: 16 }}
                    size="small"
                  >
                    <ArrowForwardIcon />
                  </MediaNavButton>
                  <MediaCounter>
                    {currentMedia.type === 'video' ? <VideoIcon /> : <ImageIcon />}
                    {currentMediaIndex + 1} / {mediaItems.length}
                  </MediaCounter>
                </>
              )}
            </MediaContainer>
          )}

          <ContentSection>
            {/* Информация об авторе и дате */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <AuthorChip>
                <Avatar src={news.created_by?.avatar} sx={{ width: 24, height: 24 }}>
                  {news.created_by?.full_name?.charAt(0) || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="500">
                    {news.created_by?.full_name || news.created_by?.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(news.created_at)}
                  </Typography>
                </Box>
              </AuthorChip>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <StatBadge>
                  <VisibilityIcon fontSize="small" />
                  <Typography variant="body2">{viewsCount}</Typography>
                </StatBadge>

                {/* 🔥 ЛАЙК С АНИМАЦИЕЙ */}
                <StatBadge>
                  <IconButton
                    size="small"
                    onClick={handleLike}
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
                          color: 'error.main',
                          fontSize: 20,
                          filter: 'drop-shadow(0 0 4px rgba(196, 69, 69, 0.5))',
                          animation: 'heartBeat 0.3s ease-in-out'
                        }}
                      />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                  <Typography variant="body2">{likesCount}</Typography>
                </StatBadge>

                <IconButton size="small" onClick={handleShare}>
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Контент новости */}
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
                color: 'text.primary'
              }}
            >
              {news.content}
            </Typography>

            {/* Мета-информация */}
            {news.section && (
              <Box sx={{ mt: 3 }}>
                <Chip
                  label={`Секция: ${news.section_title}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(news.section_color || theme.palette.primary.main, 0.1),
                    color: news.section_color || theme.palette.primary.main
                  }}
                />
              </Box>
            )}
          </ContentSection>
        </StyledDialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => onClose(false)} variant="outlined" sx={{ borderRadius: 5 }}>
            Закрыть
          </Button>
        </DialogActions>
      </StyledDialog>

      {/* Модалка редактирования */}
      {editModalOpen && (
        <CreateEditNewsModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          eventId={news.event}
          sections={[]}
          newsToEdit={news}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Снэкбар */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NewsDetailModal;