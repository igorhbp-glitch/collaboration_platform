// frontend/src/components/News/NewsFeed.js
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle
} from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Fade,
  Paper,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { newsAPI } from '../../services/eventsAPI';
import { useAuth } from '../../contexts/AuthContext';
import NewsFeedCard from './NewsFeedCard';
import NewsDetailModal from '../Events/NewsDetailModal';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const FeedContainer = styled(Box)(({ theme }) => ({
  width: '50%',
  minWidth: '600px',
  margin: '0 auto',
  padding: theme.spacing(2, 0, 4, 0),
  [theme.breakpoints.down('md')]: {
    width: 'calc(100% - 32px)',
    minWidth: 'auto'
  }
}));

const LoaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(4)
}));

const EndMessage = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  color: theme.palette.text.secondary,
  padding: theme.spacing(4)
}));

// 🔥 НОВЫЙ КОМПОНЕНТ ДЛЯ ПУСТОГО СОСТОЯНИЯ
const EmptyStateContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6, 4),
  marginTop: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  borderRadius: theme.spacing(3),
  border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderColor: alpha(theme.palette.primary.main, 0.3),
  }
}));

const EmptyIcon = styled(NewspaperIcon)(({ theme }) => ({
  fontSize: 80,
  color: alpha(theme.palette.primary.main, 0.3),
  marginBottom: theme.spacing(2)
}));

const EmptyTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.5rem',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1)
}));

const EmptyDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(3),
  maxWidth: '400px',
  margin: '0 auto',
  lineHeight: 1.6
}));

const RefreshEmptyButton = styled(IconButton)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: theme.palette.primary.main,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  padding: theme.spacing(1.5),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
  }
}));

// 🔥 ОБЕРНУЛИ КОМПОНЕНТ В forwardRef
const NewsFeed = forwardRef((props, ref) => {
  const { user } = useAuth();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedNews, setLikedNews] = useState({});
  const [refreshAttempted, setRefreshAttempted] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  const observerRef = useRef();
  const lastNewsElementRef = useRef();

  // 🔥 ОТКРЫВАЕМ МЕТОДЫ ДЛЯ РОДИТЕЛЯ
  useImperativeHandle(ref, () => ({
    refreshNews: () => {
      newsAPI.clearNewsCache();
      setRefreshAttempted(true);
      return loadInitialNews();
    }
  }));

  useEffect(() => {
    loadInitialNews();
  }, []);

  const loadInitialNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await newsAPI.getAllNewsPaginated(1, 15, false);

      // 🔥 ПРОВЕРЯЕМ, ЧТО data.results - МАССИВ
      const newsArray = Array.isArray(data?.results) ? data.results : [];

      setNews(newsArray);
      setPage(data?.page || 1);
      setHasMore(data?.hasMore || false);

      const initialLiked = {};
      newsArray.forEach(item => {
        if (item && item.id) {
          initialLiked[item.id] = false;
        }
      });
      setLikedNews(initialLiked);

      return newsArray.length > 0 ? 'loaded' : 'no-news';

    } catch (err) {
      console.error('❌ Ошибка загрузки новостей:', err);
      setError('Не удалось загрузить новости');
      return 'error';
    } finally {
      setLoading(false);
    }
  };

  const loadMoreNews = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const data = await newsAPI.getAllNewsPaginated(nextPage, 15, true);

      // 🔥 ПРОВЕРЯЕМ, ЧТО data.results - МАССИВ
      const newResults = Array.isArray(data?.results) ? data.results : [];

      if (newResults.length > 0) {
        setNews(prev => [...prev, ...newResults]);
        setPage(data?.page || nextPage);
        setHasMore(data?.hasMore || false);

        setLikedNews(prev => {
          const newLiked = { ...prev };
          newResults.forEach(item => {
            if (item && item.id && newLiked[item.id] === undefined) {
              newLiked[item.id] = false;
            }
          });
          return newLiked;
        });
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error('❌ Ошибка загрузки следующих новостей:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page]);

  useEffect(() => {
    if (loading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && news.length > 0) {
        loadMoreNews();
      }
    }, {
      rootMargin: '100px',
    });

    if (lastNewsElementRef.current) {
      observerRef.current.observe(lastNewsElementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, loadMoreNews, news.length]);

  const handleLikeToggle = async (newsId, e) => {
    e.stopPropagation();

    try {
      const isCurrentlyLiked = likedNews[newsId];

      setLikedNews(prev => ({
        ...prev,
        [newsId]: !isCurrentlyLiked
      }));

      setNews(prevNews =>
        prevNews.map(item => {
          if (item.id === newsId) {
            return {
              ...item,
              likes_count: isCurrentlyLiked
                ? (item.likes_count - 1)
                : (item.likes_count + 1)
            };
          }
          return item;
        })
      );

      if (isCurrentlyLiked) {
        await newsAPI.unlikeNews(newsId);
      } else {
        await newsAPI.likeNews(newsId);
      }

    } catch (err) {
      console.error('❌ Ошибка при лайке:', err);

      setLikedNews(prev => ({
        ...prev,
        [newsId]: !prev[newsId]
      }));

      setNews(prevNews =>
        prevNews.map(item => {
          if (item.id === newsId) {
            return {
              ...item,
              likes_count: likedNews[newsId]
                ? (item.likes_count + 1)
                : (item.likes_count - 1)
            };
          }
          return item;
        })
      );
    }
  };

  const handleNewsClick = (newsItem) => {
    setSelectedNews(newsItem);
    setDetailModalOpen(true);

    newsAPI.incrementView(newsItem.id).catch(err => {
      console.error('Ошибка при увеличении просмотров:', err);
    });
  };

  const handleDetailClose = (updated) => {
    setDetailModalOpen(false);
    setSelectedNews(null);

    if (updated) {
      loadInitialNews();
      newsAPI.clearNewsCache();
    }
  };

  const handleManualRefresh = () => {
    loadInitialNews();
  };

  // 🔥 ЕСЛИ НОВОСТЕЙ НЕТ ПОСЛЕ ЗАГРУЗКИ
  if (!loading && news.length === 0 && !error) {
    return (
      <FeedContainer>
        <Fade in={true} timeout={800}>
          <EmptyStateContainer elevation={0}>
            <EmptyIcon />
            <EmptyTitle variant="h5">
              Пока нет новостей
            </EmptyTitle>
            <EmptyDescription variant="body1">
              {refreshAttempted
                ? 'Новостей пока нет, но они обязательно появятся! Следите за обновлениями.'
                : 'Здесь будут появляться новости о мероприятиях, проектах и научной жизни университета.'}
            </EmptyDescription>
            <RefreshEmptyButton
              onClick={handleManualRefresh}
              size="large"
              title="Обновить"
            >
              <RefreshIcon />
            </RefreshEmptyButton>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.disabled' }}>
              нажмите для обновления
            </Typography>
          </EmptyStateContainer>
        </Fade>
      </FeedContainer>
    );
  }

  if (loading && news.length === 0) {
    return (
      <FeedContainer>
        <LoaderContainer>
          <CircularProgress size={60} />
        </LoaderContainer>
      </FeedContainer>
    );
  }

  if (error && news.length === 0) {
    return (
      <FeedContainer>
        <Alert
          severity="error"
          sx={{ borderRadius: 2, mb: 2, boxShadow: 'none' }}
        >
          {error}
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <IconButton onClick={handleManualRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </FeedContainer>
    );
  }

  return (
    <>
      <FeedContainer>
        {/* 🔥 ПРОВЕРЯЕМ, ЧТО news - МАССИВ ПЕРЕД map */}
        {Array.isArray(news) && news.map((item, index) => {
          if (!item || !item.id) return null; // пропускаем некорректные элементы

          if (news.length === index + 1) {
            return (
              <div ref={lastNewsElementRef} key={item.id}>
                <NewsFeedCard
                  news={item}
                  isLiked={likedNews[item.id] || false}
                  onLikeToggle={handleLikeToggle}
                  onClick={handleNewsClick}
                />
              </div>
            );
          } else {
            return (
              <NewsFeedCard
                key={item.id}
                news={item}
                isLiked={likedNews[item.id] || false}
                onLikeToggle={handleLikeToggle}
                onClick={handleNewsClick}
              />
            );
          }
        })}

        {loadingMore && (
          <LoaderContainer>
            <CircularProgress size={40} />
          </LoaderContainer>
        )}

        {!hasMore && news.length > 0 && (
          <Fade in={true}>
            <EndMessage variant="body1">
              🎉 Вы просмотрели все новости
            </EndMessage>
          </Fade>
        )}
      </FeedContainer>

      {selectedNews && (
        <NewsDetailModal
          open={detailModalOpen}
          onClose={handleDetailClose}
          news={selectedNews}
          canEdit={selectedNews.can_edit}
          canDelete={selectedNews.can_delete}
          isLiked={likedNews[selectedNews.id] || false}
          onLikeToggle={handleLikeToggle}
        />
      )}
    </>
  );
});

export default NewsFeed;