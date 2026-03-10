// frontend/src/pages/EventsPage.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  useTheme,
  alpha,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Event as EventIcon,
  Add as AddIcon  // 🔥 ДОБАВИЛИ ИМПОРТ
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/eventsAPI';
import EventCard from '../components/Events/EventCard';

// ============================================
// КОНСТАНТЫ
// ============================================

const EVENT_TYPES = [
  { value: '', label: 'Все типы', icon: '📋' },
  { value: 'conference', label: 'Конференция', icon: '🗣️', color: '#4361ee' },
  { value: 'seminar', label: 'Семинар', icon: '📚', color: '#3a0ca3' },
  { value: 'symposium', label: 'Симпозиум', icon: '🔬', color: '#7209b7' },
  { value: 'workshop', label: 'Воркшоп', icon: '🛠️', color: '#f72585' },
  { value: 'school', label: 'Школа', icon: '🏫', color: '#4cc9f0' },
  { value: 'congress', label: 'Конгресс', icon: '🌍', color: '#4895ef' },
  { value: 'forum', label: 'Форум', icon: '🗣️', color: '#560bad' },
  { value: 'roundtable', label: 'Круглый стол', icon: '🔄', color: '#b5179e' },
  { value: 'competition', label: 'Конкурс', icon: '🏆', color: '#f8961e' },
  { value: 'festival', label: 'Фестиваль', icon: '🎪', color: '#f94144' }
];

const EVENT_LEVELS = [
  { value: '', label: 'Все уровни' },
  { value: 'international', label: 'Международный' },
  { value: 'national', label: 'Всероссийский' },
  { value: 'interregional', label: 'Межрегиональный' },
  { value: 'regional', label: 'Региональный' },
  { value: 'university', label: 'Внутривузовский' }
];

const EVENT_STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'published', label: 'Опубликовано' },
  { value: 'in_progress', label: 'Идёт' },
  { value: 'completed', label: 'Завершено' },
  { value: 'draft', label: 'Черновик' }
];

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const PageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  paddingTop: 0,
  paddingBottom: theme.spacing(6),
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}));

// 🔥 ШАПКА В СТИЛЕ DASHBOARD
const AnimatedHeader = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '960px',
  minWidth: '640px',
  minHeight: 300,
  marginTop: '-100px',
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(3),
  background: 'linear-gradient(135deg, #284b63 0%, #3c6e71 50%, #58b6b9 100%)',
  animation: 'AnimateBG 10s ease infinite',
  backgroundSize: '300% 300%',
  overflow: 'hidden',
  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
  '@keyframes AnimateBG': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' }
  },
  [theme.breakpoints.down('md')]: {
    width: 'calc(100% - 32px)',
    minWidth: 'auto',
    marginLeft: '16px',
    marginRight: '16px'
  }
}));

// 🔥 КОНТЕЙНЕР ДЛЯ КУБИКОВ
const CubesContainer = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  zIndex: 1
});

// 🔥 СТИЛИ ДЛЯ КУБИКОВ
const Cube = styled(Box)(({ delay, size, left }) => ({
  position: 'absolute',
  display: 'block',
  listStyle: 'none',
  width: size || '20px',
  height: size || '20px',
  background: 'rgba(255, 255, 255, 0.15)',
  bottom: '-150px',
  left: left || 'auto',
  animation: 'animate 25s ease-in infinite',
  animationDelay: delay || '0s',
  '@keyframes animate': {
    '0%': {
      transform: 'translateY(0) rotate(0deg)',
      opacity: 1,
      borderRadius: 0
    },
    '100%': {
      transform: 'translateY(-1000px) rotate(720deg)',
      opacity: 0,
      borderRadius: '50%'
    }
  }
}));

// 🔥 КОНТЕЙНЕР ДЛЯ КОНТЕНТА ШАПКИ - прижимаем к низу
const HeaderContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop:110,
  zIndex: 2,
  padding: theme.spacing(2,5),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  color: theme.palette.common.white
}));

// 🔥 ЛЕВАЯ ЧАСТЬ С ТЕКСТОМ И КНОПКОЙ
const HeaderLeft = styled(Box)({
  display: 'flex',
  width: '100%',
  justifyContent: 'flex-start',
  flexDirection: 'column',
  gap: 1
});

// 🔥 ПРАВАЯ ЧАСТЬ СО СТАТИСТИКОЙ
const HeaderRight = styled(Box)({
  display: 'flex',
  gap: 2,
  width: '100%',
  marginLeft: 'auto',
});

// 🔥 КНОПКА СОЗДАНИЯ МЕРОПРИЯТИЯ (как на Dashboard)
const CreateEventButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(3),
  left: theme.spacing(5),
  color: 'white',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  border: '0.5px solid rgba(255, 255, 255, 0.8)',
  zIndex: 10,
  padding: theme.spacing(1),
  backdropFilter: 'blur(4px)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'white'
  }
}));

const StatChip = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(3),
  backgroundColor: 'rgba(255,255,255,0.15)',
  backdropFilter: 'blur(4px)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

// 🔥 СТИЛИЗОВАННЫЙ БЛОК ФИЛЬТРОВ
const FilterSection = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 960,
  padding: theme.spacing(2, 3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  boxShadow: 'none'
}));

const EventsGrid = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 960,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(4)
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(4)
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const EventsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🔥 РЕАЛЬНАЯ СТАТИСТИКА
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    inProgress: 0,
    completed: 0
  });

  // Фильтры
  const [filters, setFilters] = useState({
    type: '',
    level: '',
    status: '',
    search: ''
  });

  // Данные для кубиков
  const cubes = [
    { left: '5%', size: '60px', delay: '0s' },
    { left: '15%', size: '25px', delay: '2s' },
    { left: '25%', size: '40px', delay: '4s' },
    { left: '35%', size: '80px', delay: '1s' },
    { left: '45%', size: '20px', delay: '3s' },
    { left: '55%', size: '70px', delay: '5s' },
    { left: '65%', size: '35px', delay: '2s' },
    { left: '75%', size: '50px', delay: '6s' },
    { left: '85%', size: '30px', delay: '4s' },
    { left: '95%', size: '45px', delay: '0s' },
  ];

  // Загрузка мероприятий и статистики
  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [page, filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: 15,
        ...filters
      };
      const response = await eventsAPI.getEvents(params);
      setEvents(response.results || []);
      setTotalPages(Math.ceil((response.count || 0) / 15));
    } catch (err) {
      console.error('❌ Ошибка загрузки мероприятий:', err);
      setError('Не удалось загрузить мероприятия');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ РЕАЛЬНОЙ СТАТИСТИКИ
  const fetchStats = async () => {
    try {
      // Получаем все мероприятия без пагинации для подсчета статистики
      const allEvents = await eventsAPI.getEvents({ page_size: 1000 });
      const eventsList = allEvents.results || [];

      const total = eventsList.length;
      const published = eventsList.filter(e => e.status === 'published').length;
      const inProgress = eventsList.filter(e => e.status === 'in_progress').length;
      const completed = eventsList.filter(e => e.status === 'completed').length;

      setStats({
        total,
        published,
        inProgress,
        completed
      });
    } catch (err) {
      console.error('❌ Ошибка загрузки статистики:', err);
    }
  };

  // 🔥 ОБРАБОТЧИК СОЗДАНИЯ МЕРОПРИЯТИЯ
  const handleCreateEvent = () => {
    navigate('/events/create');
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      level: '',
      status: '',
      search: ''
    });
    setPage(1);
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const getTypeInfo = (type) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
  };

  const getLevelInfo = (level) => {
    return EVENT_LEVELS.find(l => l.value === level) || EVENT_LEVELS[0];
  };

  const hasActiveFilters = filters.type || filters.level || filters.status || filters.search;

  return (
    <PageContainer>
      {/* 🔥 АНИМИРОВАННАЯ ШАПКА */}
      <AnimatedHeader>
        <CubesContainer>
          {cubes.map((cube, index) => (
            <Cube
              key={index}
              left={cube.left}
              size={cube.size}
              delay={cube.delay}
            />
          ))}
        </CubesContainer>

        {/* 🔥 КНОПКА СОЗДАНИЯ МЕРОПРИЯТИЯ - как на Dashboard */}
        <Tooltip title="Создать мероприятие">
          <CreateEventButton onClick={handleCreateEvent} size="small">
            <AddIcon sx={{ fontSize: 24 }} />
          </CreateEventButton>
        </Tooltip>

        <HeaderContent>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: '100%',
            width: '100%'
          }}>
            {/* 1 строка - Заголовок (слева) */}
            <Box sx={{ width: '100%' }}>
              <Typography
                variant="h3"
                fontWeight="900"
                sx={{
                  fontFamily: '"Montserrat", sans-serif',
                  letterSpacing: '-0.5px',
                  opacity: '0.9',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  textAlign: 'left'
                }}
              >
                МЕРОПРИЯТИЯ
              </Typography>
            </Box>

            {/* 2 строка - Описание (слева) */}
            <Box sx={{ width: '100%', mt: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Noto Sans", sans-serif',
                  fontWeight: 100,
                  fontSize: 18,
                  opacity: 0.7,
                  textAlign: 'left'
                }}
              >
                Научные конференции, семинары и другие события университета
              </Typography>
            </Box>

            {/* 3 строка - Чипсы (справа) */}
            <Box sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 2
            }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <StatChip elevation={0}>
                  <EventIcon fontSize="small" />
                  <Typography variant="body2">Всего: {stats.total}</Typography>
                </StatChip>
                <StatChip elevation={0}>
                  <Typography variant="body2">Активных: {stats.published + stats.inProgress}</Typography>
                </StatChip>
                <StatChip elevation={0}>
                  <Typography variant="body2">Завершено: {stats.completed}</Typography>
                </StatChip>
              </Box>
            </Box>
          </Box>
        </HeaderContent>
      </AnimatedHeader>

      {/* 🔥 СТИЛИЗОВАННЫЙ БЛОК ФИЛЬТРОВ */}
      <FilterSection elevation={0}>
        <Box sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          '& .MuiOutlinedInput-root': {
            borderRadius: theme.spacing(3),
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
            '&.Mui-focused': {
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
            }
          }
        }}>
          <TextField
            sx={{ flex: 2, minWidth: 250 }}
            placeholder="Поиск мероприятий..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleFilterChange('search', '')}>
                    <ClearIcon sx={{ color: theme.palette.primary.main }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
            size="small"
          />

          {/* ТИП - корпоративный зеленый */}
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel sx={{
              fontWeight: 500,
              color: theme.palette.primary.main,
              '&.Mui-focused': {
                color: theme.palette.primary.main
              }
            }}>
              Тип
            </InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              label="Тип"
              sx={{
                borderRadius: theme.spacing(3),
                color: theme.palette.primary.main,
                '& .MuiSelect-select': {
                  fontWeight: 500,
                  color: theme.palette.primary.main
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    '& .MuiMenuItem-root': {
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.15)
                        }
                      }
                    }
                  }
                }
              }}
            >
              {EVENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                    <span>{type.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* УРОВЕНЬ - корпоративный зеленый */}
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel sx={{
              fontWeight: 500,
              color: theme.palette.primary.main,
              '&.Mui-focused': {
                color: theme.palette.primary.main
              }
            }}>
              Уровень
            </InputLabel>
            <Select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              label="Уровень"
              sx={{
                borderRadius: theme.spacing(3),
                color: theme.palette.primary.main,
                '& .MuiSelect-select': {
                  fontWeight: 500,
                  color: theme.palette.primary.main
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    '& .MuiMenuItem-root': {
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.15)
                        }
                      }
                    }
                  }
                }
              }}
            >
              {EVENT_LEVELS.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* СТАТУС - корпоративный зеленый */}
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel sx={{
              fontWeight: 500,
              color: theme.palette.primary.main,
              '&.Mui-focused': {
                color: theme.palette.primary.main
              }
            }}>
              Статус
            </InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Статус"
              sx={{
                borderRadius: theme.spacing(3),
                color: theme.palette.primary.main,
                '& .MuiSelect-select': {
                  fontWeight: 500,
                  color: theme.palette.primary.main
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    '& .MuiMenuItem-root': {
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.15)
                        }
                      }
                    }
                  }
                }
              }}
            >
              {EVENT_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasActiveFilters && (
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<FilterIcon />}
              size="small"
              sx={{
                minWidth: 100,
                borderRadius: theme.spacing(3),
                borderColor: alpha(theme.palette.primary.main, 0.3),
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              Сброс
            </Button>
          )}
        </Box>
      </FilterSection>

      {/* Сетка мероприятий */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ maxWidth: 960, width: '100%', borderRadius: 3 }}>
          {error}
        </Alert>
      ) : events.length === 0 ? (
        <Box sx={{
          maxWidth: 960,
          width: '100%',
          p: 8,
          textAlign: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          borderRadius: 3
        }}>
          <EventIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Мероприятия не найдены
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Попробуйте изменить параметры поиска
          </Typography>
        </Box>
      ) : (
        <EventsGrid>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              typeInfo={getTypeInfo(event.type)}
              levelInfo={getLevelInfo(event.level)}
              onClick={() => handleEventClick(event.id)}
            />
          ))}
        </EventsGrid>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <PaginationContainer>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 2
              }
            }}
          />
        </PaginationContainer>
      )}
    </PageContainer>
  );
};

export default EventsPage;