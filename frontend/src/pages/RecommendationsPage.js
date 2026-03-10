// src/pages/RecommendationsPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
  Badge,
  Stack,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Diversity3 as Diversity3Icon,
  Science as ScienceIcon,
  FilterList as FilterListIcon,
  Interests as InterestsIcon,
  PsychologyAlt as PsychologyAltIcon,
  AccountCircle as AccountCircleIcon,
  Sort as SortIcon,
  AutoAwesome as AutoAwesomeIcon,
  Work as WorkIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import InviteModal from '../components/InviteModal/InviteModal';
import { authAPI, projectsAPI } from '../services/api';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ (как в EventsPage)
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

// 🔥 ШАПКА В СТИЛЕ DASHBOARD (как в EventsPage)
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
  marginTop: 110,
  zIndex: 2,
  padding: theme.spacing(2, 5),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  color: theme.palette.common.white
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

// Красивая цветовая схема
const MATCH_COLORS = {
  excellent: '#3c6e71',
  good: '#284b63',
  moderate: '#cea569',
  low: '#b46463'
};

// 🔥 Функция для получения цвета кнопки в зависимости от процента
const getButtonColor = (score) => {
  if (score >= 80) return MATCH_COLORS.excellent;
  if (score >= 60) return MATCH_COLORS.good;
  if (score >= 40) return MATCH_COLORS.moderate;
  return MATCH_COLORS.low;
};

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

const RecommendationsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('match');

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasCompetencies, setHasCompetencies] = useState(false);
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false);
  const [competencyQuestionnaireId, setCompetencyQuestionnaireId] = useState(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================

  const getMatchColor = useCallback((score) => {
    if (score >= 0.8) return MATCH_COLORS.excellent;
    if (score >= 0.6) return MATCH_COLORS.good;
    if (score >= 0.4) return MATCH_COLORS.moderate;
    return MATCH_COLORS.low;
  }, []);

  const getMatchLabel = useCallback((score) => {
    if (score >= 0.8) return 'Отличная';
    if (score >= 0.6) return 'Хорошая';
    if (score >= 0.4) return 'Средняя';
    return 'Начальная';
  }, []);

  const getRoleLabel = useCallback((role) => {
    const roleMap = {
      'professor': 'Профессор',
      'researcher': 'Исследователь',
      'teacher': 'Преподаватель',
      'student': 'Студент'
    };
    return roleMap[role] || role;
  }, []);

  const getInitials = (firstName, lastName) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    return '?';
  };

  // ============================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await projectsAPI.getUserRecommendations();

      if (response?.needs_questionnaire) {
        setNeedsQuestionnaire(true);
        setRecommendations([]);
        return;
      }

      let data = [];
      if (response?.recommendations) {
        data = response.recommendations;
      } else if (Array.isArray(response)) {
        data = response;
      }

      const formatted = data
        .filter(item => {
          const role = (item.role || '').toLowerCase();
          return !role.includes('admin');
        })
        .map(item => {
          const researchInterests = item.research_interests || item.research_fields || [];
          return {
          id: item.id,
          email: item.email,
          first_name: item.first_name || '',
          last_name: item.last_name || '',
          full_name: item.full_name ||
                    `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
                    'Пользователь',
          role: item.role || 'user',
          university: item.university || 'Финансовый университет',
          branch: item.branch || null,
          position: item.position || null,
          match_score: Math.min(0.99, Math.max(0.3, item.match_score || 0.5)),
          competencies: (item.competencies || []),
          research_interests: researchInterests,
          bio: item.bio || '',
          compatibility_type: item.compatibility_type || 'Потенциальный коллега',
          avatar: item.avatar || null
        };
      });

      setRecommendations(formatted);
    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      setError('Не удалось загрузить рекомендации');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkUserProfile = useCallback(async () => {
    try {
      const userData = await authAPI.getProfile();

      const hasComp = userData.competencies &&
                     Object.keys(userData.competencies).length > 0;

      setHasCompetencies(hasComp);

      if (!hasComp) {
        setNeedsQuestionnaire(true);

        const questionnaires = await authAPI.getQuestionnairesList();
        const competencyQuest = questionnaires.find(
          q => q.title === "Анкета научных компетенций"
        );

        if (competencyQuest) {
          setCompetencyQuestionnaireId(competencyQuest.id);
        }
      } else {
        loadRecommendations();
      }
    } catch (error) {
      console.error('❌ Ошибка проверки профиля:', error);
      setError('Не удалось проверить профиль');
    } finally {
      setCheckingProfile(false);
    }
  }, [loadRecommendations]);

  useEffect(() => {
    checkUserProfile();
  }, [checkUserProfile]);

  // Сортировка и фильтрация
  const sortedAndFilteredRecommendations = useMemo(() => {
    if (!recommendations.length) return [];

    let filtered = [...recommendations];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(query) ||
        user.university.toLowerCase().includes(query) ||
        user.competencies.some(c => c.toLowerCase().includes(query)) ||
        user.research_interests.some(i => i.toLowerCase().includes(query))
      );
    }

    switch (sortBy) {
      case 'match':
        return filtered.sort((a, b) => b.match_score - a.match_score);
      case 'university':
        return filtered.sort((a, b) => a.university.localeCompare(b.university));
      case 'role':
        return filtered.sort((a, b) => a.role.localeCompare(b.role));
      default:
        return filtered;
    }
  }, [recommendations, searchQuery, sortBy]);

  // ============================================
  // ОБРАБОТЧИКИ
  // ============================================

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  const handleOpenInviteModal = useCallback((user) => {
    setSelectedUser(user);
    setInviteModalOpen(true);
  }, []);

  const handleCloseInviteModal = useCallback(() => {
    setInviteModalOpen(false);
    setSelectedUser(null);
  }, []);

  // ============================================
  // КОМПОНЕНТЫ
  // ============================================

  const SkeletonCard = useCallback(() => (
    <Card sx={{
      height: 400,
      width: '100%',
      maxWidth: 360,
      margin: '0 auto',
      borderRadius: 4
    }}>
      <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
        <Skeleton variant="circular" width={60} height={60} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="80%" height={24} />
          <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
          <Skeleton width="70%" height={16} sx={{ mt: 1 }} />
        </Box>
      </Box>
      <CardContent>
        <Skeleton width="100%" height={16} />
        <Skeleton width="90%" height={80} sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  ), []);

  // ============================================
  // УСЛОВНЫЙ РЕНДЕРИНГ
  // ============================================

  if (checkingProfile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
          Проверяем ваш профиль...
        </Typography>
      </Container>
    );
  }

  if (needsQuestionnaire) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Fade in={true} timeout={800}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
              background: 'linear-gradient(135deg, #284b63 0%, #3c6e71 50%, #58b6b9 100%)',
              color: 'white'
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 80, mb: 3, opacity: 0.9 }} />
            <Typography variant="h3" gutterBottom fontWeight="700">
              Добро пожаловать!
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Заполните анкету, чтобы получать рекомендации
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => window.location.href = `/questionnaire/${competencyQuestionnaireId}`}
              sx={{
                py: 2,
                px: 6,
                borderRadius: 4,
                bgcolor: 'white',
                color: '#284b63'
              }}
            >
              Заполнить анкету
            </Button>
          </Paper>
        </Fade>
      </Container>
    );
  }

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
                НАУЧНОЕ КОММЬЮНИТИ
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
                {sortedAndFilteredRecommendations.length} исследователей готовы к коллаборации
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
                  <GroupsIcon fontSize="small" />
                  <Typography variant="body2">Всего: {sortedAndFilteredRecommendations.length}</Typography>
                </StatChip>
                <StatChip elevation={0}>
                  <StarIcon fontSize="small" />
                  <Typography variant="body2">
                    Лучшее: {Math.round(sortedAndFilteredRecommendations[0]?.match_score * 100 || 0)}%
                  </Typography>
                </StatChip>
              </Box>
            </Box>
          </Box>
        </HeaderContent>
      </AnimatedHeader>

      {/* 🔥 СТИЛИЗОВАННЫЙ БЛОК ПОИСКА */}
      <FilterSection elevation={0}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
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
            fullWidth
            placeholder="Поиск по имени, университету, навыкам, интересам..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ flex: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon sx={{ color: theme.palette.primary.main }} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            width: { xs: '100%', md: 'auto' }
          }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel sx={{
                fontWeight: 500,
                color: theme.palette.primary.main,
                '&.Mui-focused': {
                  color: theme.palette.primary.main
                }
              }}>
                Сортировать
              </InputLabel>
              <Select
                value={sortBy}
                label="Сортировать"
                onChange={handleSortChange}
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
                <MenuItem value="match">По совместимости</MenuItem>
                <MenuItem value="university">По университету</MenuItem>
                <MenuItem value="role">По роли</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Обновить">
              <IconButton
                onClick={loadRecommendations}
                disabled={loading}
                sx={{
                  borderRadius: theme.spacing(2),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </FilterSection>

      {/* Ошибка */}
      {error && (
        <Alert severity="error" sx={{ maxWidth: 960, width: '100%', mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* 🔥 Сетка карточек */}
      <Box sx={{
        width: '100%',
        maxWidth: 960,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 3,
        justifyContent: 'center',
        mx: 'auto'
      }}>
        {loading ? (
          Array.from(new Array(6)).map((_, i) => (
            <Box key={i} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' }, maxWidth: 360 }}>
              <SkeletonCard />
            </Box>
          ))
        ) : sortedAndFilteredRecommendations.length > 0 ? (
          sortedAndFilteredRecommendations.map((user, index) => {
            const matchScore = Math.round(user.match_score * 100);
            const matchColor = getMatchColor(user.match_score);
            const buttonColor = getButtonColor(matchScore);

            return (
              <Box
                key={user.id}
                sx={{
                  width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                  maxWidth: 360,
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card
                    onClick={() => navigate(`/profile/${user.id}`)}
                    sx={{
                      cursor: 'pointer',
                      height: '100%',
                      width: '100%',
                      borderRadius: 5,
                      transition: '0.2s',
                      borderColor: 'divider',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 30px rgba(0,0,0,0.1)',
                        borderColor: alpha(matchColor, 0.3)
                      }
                    }}
                  >
                    {/* Шапка карточки */}
                    <Box sx={{
                      p: 2,
                      background: `linear-gradient(135deg, ${alpha(matchColor, 0.1)} 0%, ${alpha(matchColor, 0.05)} 100%)`,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      gap: 2
                    }}>
                      <Avatar
                        src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:8001${user.avatar}`) : null}
                        sx={{
                          width: 65,
                          height: 65,
                          bgcolor: 'white',
                          color: buttonColor,
                          border: '2px solid white',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {!user.avatar && getInitials(user.first_name, user.last_name)}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight="700" noWrap>
                          {user.full_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0.5 }}>
                          {user.position || getRoleLabel(user.role)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {user.branch || user.university}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Контент карточки */}
                    <CardContent sx={{ p: 2 }}>
                      {/* Прогресс-бар */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Совместимость
                          </Typography>
                          <Typography variant="caption" fontWeight="700" color={matchColor}>
                            {matchScore}%
                          </Typography>
                        </Box>
                        <Box sx={{
                          height: 4,
                          bgcolor: alpha(matchColor, 0.1),
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{
                            width: `${matchScore}%`,
                            height: '100%',
                            bgcolor: matchColor,
                            borderRadius: 2
                          }} />
                        </Box>
                      </Box>

                      {/* Навыки */}
                      {user.competencies && user.competencies.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Навыки
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {user.competencies.slice(0, 3).map((skill, i) => (
                              <Chip
                                key={i}
                                label={skill.length > 12 ? skill.substring(0, 10) + '...' : skill}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.65rem',
                                  bgcolor: alpha('#2196F3', 0.08),
                                  color: '#1976D2'
                                }}
                              />
                            ))}
                            {user.competencies.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: '22px' }}>
                                +{user.competencies.length - 3}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Научные интересы */}
                      {user.research_interests && user.research_interests.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Научные интересы
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {user.research_interests.slice(0, 2).map((interest, i) => (
                              <Chip
                                key={i}
                                label={interest.length > 15 ? interest.substring(0, 13) + '...' : interest}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 22,
                                  fontSize: '0.65rem',
                                  borderColor: alpha('#9C27B0', 0.3),
                                  color: '#9C27B0'
                                }}
                              />
                            ))}
                            {user.research_interests.length > 2 && (
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: '22px' }}>
                                +{user.research_interests.length - 2}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    </CardContent>

                    {/* Кнопка */}
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInviteModal(user);
                        }}
                        startIcon={<EmailIcon />}
                        sx={{
                          py: 0.8,
                          borderRadius: 3,
                          bgcolor: buttonColor,
                          fontSize: '0.8rem',
                          '&:hover': {
                            bgcolor: alpha(buttonColor, 0.8)
                          }
                        }}
                      >
                        Пригласить
                      </Button>
                    </CardActions>
                  </Card>
                </Zoom>
              </Box>
            );
          })
        ) : (
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
              <GroupsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {searchQuery ? 'Ничего не найдено' : 'Нет рекомендаций'}
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Модалка приглашения */}
      <InviteModal
        open={inviteModalOpen}
        onClose={handleCloseInviteModal}
        user={selectedUser}
        onSuccess={loadRecommendations}
      />
    </PageContainer>
  );
};

export default RecommendationsPage;