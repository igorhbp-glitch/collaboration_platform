// frontend/src/components/Project/ProjectHistory.js - С ГОРИЗОНТАЛЬНЫМ СКРОЛЛОМ
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Tooltip,
  Fade,
  IconButton
} from '@mui/material';
import {
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import SprintHistoryDetailModal from './SprintHistoryDetailModal';

// 🔥 Стилизованный контейнер с горизонтальным скроллом
const ScrollContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'auto',
  overflowY: 'hidden',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 0.5, 2, 0.5),
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': {
    height: '8px',
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
  },
}));

// 🔥 Карточка спринта с фиксированной шириной
const SprintCard = styled(Card)(({ theme }) => ({
  minWidth: 280,
  maxWidth: 280,
  borderRadius: theme.spacing(2),
  transition: 'all 0.2s',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,  // 🔥 Важно: не сжиматься
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[1],
    borderColor: theme.palette.primary.main
  }
}));

const HistoryContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderColor: theme.palette.divider
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  py: 4,
  color: theme.palette.text.secondary
}));

const ProjectHistory = ({ sprints = [], isViewOnly = false }) => {
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 🔥 Refs для скролла
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Фильтруем только завершенные спринты
  const completedSprints = sprints.filter(s => s.status === 'completed');

  // 🔥 Проверка возможности скролла
  useEffect(() => {
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
    }

    return () => {
      window.removeEventListener('resize', checkScroll);
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
    };
  }, [completedSprints.length]);

  // 🔥 Функции скролла
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Не указана';
    }
  };

  const handleSprintClick = (sprint) => {
    if (isViewOnly) return; // В режиме просмотра не открываем модалку
    setSelectedSprint(sprint);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSprint(null);
  };

  return (
    <>
      <HistoryContainer elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <HistoryIcon color="primary" />
          <Typography
              variant="h5"
              fontWeight="700"
              sx={{ color: 'primary.main' }}
            >
            История завершенных спринтов
          </Typography>
          {isViewOnly && (
            <Tooltip title="Режим только для просмотра">
              <LockIcon fontSize="small" sx={{ color: 'text.disabled', ml: 1, opacity: 0.5 }} />
            </Tooltip>
          )}
        </Box>

        {completedSprints.length === 0 ? (
          <EmptyState>
            <InfoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
            <Typography variant="body1" gutterBottom>
              Нет завершенных спринтов
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Завершенные спринты будут отображаться здесь
            </Typography>
          </EmptyState>
        ) : (
          <Box sx={{ position: 'relative' }}>
            {/* 🔥 Стрелки навигации */}
            {showLeftArrow && (
              <IconButton
                onClick={scrollLeft}
                sx={{
                  position: 'absolute',
                  left: -12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  zIndex: 1,
                  '&:hover': { bgcolor: 'grey.100' }
                }}
                size="small"
              >
                <ChevronLeftIcon />
              </IconButton>
            )}

            {showRightArrow && (
              <IconButton
                onClick={scrollRight}
                sx={{
                  position: 'absolute',
                  right: -12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  zIndex: 1,
                  '&:hover': { bgcolor: 'grey.100' }
                }}
                size="small"
              >
                <ChevronRightIcon />
              </IconButton>
            )}

            {/* 🔥 Горизонтальный скролл контейнер */}
            <ScrollContainer ref={scrollContainerRef}>
              {completedSprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  onClick={() => handleSprintClick(sprint)}
                  sx={{
                    cursor: isViewOnly ? 'default' : 'pointer',
                    opacity: isViewOnly ? 0.9 : 1,
                    '&:hover': isViewOnly ? {
                      transform: 'none',
                      boxShadow: 1
                    } : {}
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ flex: 1 }}>
                        {sprint.title || `Спринт ${sprint.id}`}
                      </Typography>
                      <Chip
                        label="Завершен"
                        size="small"
                        color="success"
                        sx={{ ml: 1, height: 20, '& .MuiChip-label': { fontSize: '0.7rem', px: 1 } }}
                      />
                    </Box>

                    {sprint.goal && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                        {sprint.goal.length > 60
                          ? `${sprint.goal.substring(0, 60)}...`
                          : sprint.goal}
                      </Typography>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlagIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        Длительность: {sprint.duration_days || '?'} дн.
                      </Typography>
                    </Box>

                    {/* Кнопка просмотра */}
                    {!isViewOnly && (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSprintClick(sprint);
                        }}
                        sx={{ mt: 2, borderRadius: 2 }}
                      >
                        Подробнее
                      </Button>
                    )}

                    {isViewOnly && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Chip
                          size="small"
                          icon={<LockIcon fontSize="small" />}
                          label="Доступно только для чтения"
                          sx={{ opacity: 0.7 }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </SprintCard>
              ))}
            </ScrollContainer>
          </Box>
        )}
      </HistoryContainer>

      {/* Модальное окно с деталями спринта */}
      <SprintHistoryDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        sprint={selectedSprint}
        isViewOnly={isViewOnly}
      />
    </>
  );
};

export default ProjectHistory;