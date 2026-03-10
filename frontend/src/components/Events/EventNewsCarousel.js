// frontend/src/components/Events/EventNewsCarousel.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  alpha,
  useTheme,
  Button
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { newsAPI } from '../../services/eventsAPI';
import CreateEditNewsModal from './CreateEditNewsModal';
import NewsDetailModal from './NewsDetailModal';
import AllNewsModal from './AllNewsModal';
import NewsCard from './NewsCard';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const NewsSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(-15),
  zIndex: 5,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(3, 2),
  paddingTop: theme.spacing(15),
  boxShadow: theme.shadows[0],
  borderColor: theme.palette.divider
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(0, 1)
}));

const AddNewsButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  width: 40,
  height: 40,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  }
}));

const ScrollContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'auto',
  overflowY: 'hidden',
  gap: theme.spacing(3),
  padding: theme.spacing(2, 1, 4, 1),
  scrollBehavior: 'smooth',

  // СКРОЛЛБАР ПОЛНОСТЬЮ ПРОЗРАЧНЫЙ
  '&::-webkit-scrollbar': {
    height: '8px',
    background: 'transparent'
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
    borderRadius: '4px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'transparent',
    borderRadius: '4px'
  },
  '&:hover::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
  },
  '&:hover::-webkit-scrollbar-thumb:hover': {
    background: theme.palette.grey[600],
  },
  '&:hover::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
  }
}));

const NavButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  zIndex: 10,
  '&:hover': {
    backgroundColor: theme.palette.grey[100]
  }
}));

// Карточка "Все новости" в конце скролла
const AllNewsCard = styled(Paper)(({ theme }) => ({
  minWidth: 280,
  maxWidth: 280,
  height: 'auto',
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  border: `1px dashed ${theme.palette.primary.main}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'scale(1.02)'
  }
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const EventNewsCarousel = ({
  news = [],
  eventId,
  sections = [],
  currentSectionId = null,
  canCreateNews = false,
  onNewsUpdate,
  likedNews = {},           // 🔥 ПОЛУЧАЕМ СВЕРХУ
  onLikeToggle              // 🔥 ПОЛУЧАЕМ СВЕРХУ
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const scrollRef = useRef(null);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [allNewsModalOpen, setAllNewsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  // 🔥 УБРАЛИ ЛОКАЛЬНОЕ СОСТОЯНИЕ likedNews - теперь используем пропс

  // Берем только первые 15 новостей для карусели
  const displayedNews = news.slice(0, 15);
  const hasMoreNews = news.length > 15;

  // Проверка скролла
  useEffect(() => {
    const checkScroll = () => {
      const container = scrollRef.current;
      if (container) {
        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
    }

    return () => {
      window.removeEventListener('resize', checkScroll);
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
    };
  }, [displayedNews]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleNewsClick = async (newsItem) => {
    setSelectedNews(newsItem);
    setDetailModalOpen(true);

    try {
      await newsAPI.incrementView(newsItem.id);
      if (onNewsUpdate) onNewsUpdate();
    } catch (err) {
      console.error('Ошибка при увеличении просмотров:', err);
    }
  };

  // 🔥 ОБРАБОТЧИК ЛАЙКА - просто вызываем родительскую функцию
  const handleLikeWrapper = (newsId, e) => {
    onLikeToggle(newsId, e);
  };

  const handleCreateSuccess = (newNews) => {
    if (onNewsUpdate) onNewsUpdate();
    setCreateModalOpen(false);
  };

  const handleDetailClose = (updated) => {
    setDetailModalOpen(false);
    setSelectedNews(null);
    if (updated && onNewsUpdate) onNewsUpdate();
  };

  const handleDeleteFromDetail = () => {
    if (onNewsUpdate) onNewsUpdate();
    setDetailModalOpen(false);
    setSelectedNews(null);
  };

  // Если нет новостей и нет прав на создание, не показываем блок
  if (news.length === 0 && !canCreateNews) {
  return (
    <NewsSection>
      <SectionHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight="700" color="primary.main">
            НОВОСТИ
          </Typography>
        </Box>
      </SectionHeader>

      <Box sx={{ py: 3, textAlign: 'center' }}>
        <FolderIcon
          sx={{
            fontSize: 32,
            color: alpha(theme.palette.primary.main, 0.3),
            mb: 1
          }}
        />
        <Typography
          variant="body1"
          color="primary.main"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          Пока нет новостей
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            fontWeight: 300
          }}
        >
          Новости мероприятия появятся здесь
        </Typography>
      </Box>
    </NewsSection>
  );
}

  return (
    <NewsSection>
      <SectionHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight="700" color="primary.main">
            НОВОСТИ
          </Typography>
          {news.length > 0 && (
            <Chip
              label={news.length}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                fontWeight: 600
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {canCreateNews && (
            <AddNewsButton onClick={() => setCreateModalOpen(true)}>
              <AddIcon />
            </AddNewsButton>
          )}

          {/* Кнопка "Все новости" в хедере */}
          {news.length > 0 && (
            <Button
              variant="outlined"
              onClick={() => setAllNewsModalOpen(true)}
              sx={{ borderRadius: 5 }}
            >
              Все новости
            </Button>
          )}
        </Box>
      </SectionHeader>

      <Box sx={{ position: 'relative' }}>
        {showLeftArrow && (
          <NavButton
            onClick={scrollLeft}
            sx={{ left: -12 }}
            size="small"
          >
            <ChevronLeftIcon />
          </NavButton>
        )}

        {showRightArrow && (
          <NavButton
            onClick={scrollRight}
            sx={{ right: -12 }}
            size="small"
          >
            <ChevronRightIcon />
          </NavButton>
        )}

        {news.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <Typography color="text.secondary" gutterBottom>
              Пока нет новостей
            </Typography>
            {canCreateNews && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateModalOpen(true)}
                sx={{ mt: 2, borderRadius: 5 }}
              >
                Создать первую новость
              </Button>
            )}
          </Paper>
        ) : (
          <ScrollContainer ref={scrollRef}>
            {/* Отображаем первые 15 новостей */}
            {displayedNews.map((item) => (
              <NewsCard
                key={item.id}
                news={item}
                sections={sections}
                isLiked={likedNews[item.id]}           // 🔥 ИСПОЛЬЗУЕМ ПРОПС
                onLikeToggle={handleLikeWrapper}        // 🔥 ВЫЗЫВАЕМ РОДИТЕЛЬСКУЮ ФУНКЦИЮ
                onClick={() => handleNewsClick(item)}
              />
            ))}

            {/* Если новостей больше 15, показываем карточку "Все новости" */}
            {hasMoreNews && (
              <AllNewsCard onClick={() => setAllNewsModalOpen(true)}>
                <Typography variant="h3" fontWeight="300" color="primary.main" sx={{ mb: 1 }}>
                  +{news.length - 15}
                </Typography>
                <Typography variant="body1" fontWeight="500" color="primary.main">
                  Все новости
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {news.length} всего
                </Typography>
                <ArrowForwardIcon sx={{ mt: 2, color: 'primary.main', opacity: 0.7 }} />
              </AllNewsCard>
            )}
          </ScrollContainer>
        )}
      </Box>

      <CreateEditNewsModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        eventId={eventId}
        sections={sections}
        currentSectionId={currentSectionId}
        onSuccess={handleCreateSuccess}
      />

      {selectedNews && (
        <NewsDetailModal
          open={detailModalOpen}
          onClose={handleDetailClose}
          news={selectedNews}
          onDelete={handleDeleteFromDetail}
          canEdit={selectedNews.can_edit}
          canDelete={selectedNews.can_delete}
          isLiked={likedNews[selectedNews.id]}    // 🔥 ПЕРЕДАЕМ ПРОПС
          onLikeToggle={onLikeToggle}              // 🔥 ПЕРЕДАЕМ ФУНКЦИЮ
        />
      )}

      <AllNewsModal
        open={allNewsModalOpen}
        onClose={() => setAllNewsModalOpen(false)}
        news={news}
        sections={sections}
        likedNews={likedNews}                       // 🔥 ПЕРЕДАЕМ ПРОПС
        onLikeToggle={onLikeToggle}                 // 🔥 ПЕРЕДАЕМ ФУНКЦИЮ
        onNewsClick={handleNewsClick}
      />
    </NewsSection>
  );
};

export default EventNewsCarousel;