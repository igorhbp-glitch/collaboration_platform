// src/pages/ProjectsPage.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  useTheme,
  Paper,
  Pagination
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Add as AddIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Science as ScienceIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Folder as FolderIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { projectsAPI } from '../services/api';

// Импортируем новый компонент StackedCard
import StackedCard from '../components/UI/StackedCard';

// Импортируем данные из справочников
import {
  RESEARCH_FIELDS,
  POPULAR_RESEARCH_AREAS
} from '../data/scienceData';

// 🔥 ИМПОРТИРУЕМ ЦВЕТА И ИКОНКИ ИЗ НОВОГО ФАЙЛА
import {
  getFieldColor,
  getCompetencyIcon,
  getProjectTypeIcon,
  getStatusColor
} from '../data/themeData';

// ============================================
// КОНСТАНТЫ
// ============================================

const PROJECT_STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'recruiting', label: 'Ищут участников' },
  { value: 'draft', label: 'Черновики' },
  { value: 'completed', label: 'Завершенные' }
];

const PROJECT_TYPES = [
  { value: '', label: 'Все типы' },
  { value: 'research_paper', label: 'Научная статья' },
  { value: 'dissertation', label: 'Диссертация' },
  { value: 'grant', label: 'Грантовый проект' },
  { value: 'conference', label: 'Конференция' },
  { value: 'book', label: 'Книга/Монография' },
  { value: 'creative', label: 'Творческий проект' },
  { value: 'other', label: 'Другой проект' }
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

// 🔥 АНИМИРОВАННАЯ ШАПКА
const AnimatedHeader = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '960px',
  minWidth: '800px',
  minHeight: 300,
  marginTop: '-100px',
  marginBottom: theme.spacing(4),
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

const CubesContainer = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  zIndex: 1
});

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

const CreateProjectButton = styled(IconButton)(({ theme }) => ({
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

const FilterSection = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 960,
  padding: theme.spacing(2, 3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  boxShadow: 'none'
}));

// 🔥 Компонент для компетенций
const CompetencyChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  height: 24,
  fontSize: '0.75rem',
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
  '& .MuiChip-icon': {
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
    fontSize: '1rem',
  }
}));

const ProjectsGrid = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 960,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing(5, 3),
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

function ProjectsPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Фильтры
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: ''
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

  useEffect(() => {
    fetchProjects();
  }, [page, filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll({
        page,
        page_size: 12,
        search: filters.search || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined
      });

      let projectsData = response;

      if (!Array.isArray(projectsData)) {
        if (projectsData && projectsData.results && Array.isArray(projectsData.results)) {
          projectsData = projectsData.results;
          setTotalPages(Math.ceil((projectsData.count || 0) / 12));
        } else if (projectsData && projectsData.data && Array.isArray(projectsData.data)) {
          projectsData = projectsData.data;
        } else if (projectsData && Array.isArray(projectsData.items)) {
          projectsData = projectsData.items;
        } else {
          projectsData = [];
        }
      } else {
        setTotalPages(Math.ceil(projectsData.length / 12));
      }

      setProjects(projectsData);
      setError(null);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      setError(error.message || 'Не удалось загрузить проекты. Проверьте подключение к серверу.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Статистика
  const totalProjects = Array.isArray(projects) ? projects.length : 0;
  const activeProjectsCount = Array.isArray(projects)
    ? projects.filter(p => p && p.status === 'active').length
    : 0;
  const recruitingProjectsCount = Array.isArray(projects)
    ? projects.filter(p => p && p.status === 'recruiting').length
    : 0;

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      type: ''
    });
    setPage(1);
  };

  const hasActiveFilters = filters.search || filters.status || filters.type;

  const getStatusText = (status) => {
    const statusMap = {
      'draft': 'Черновик',
      'recruiting': 'Ищут участников',
      'active': 'Активный',
      'completed': 'Завершен',
      'on_hold': 'На паузе',
      'archived': 'В архиве'
    };
    return statusMap[status] || status;
  };

  const getProjectTypeText = (type) => {
    const typeMap = {
      'research_paper': 'Научная статья',
      'dissertation': 'Диссертация',
      'grant': 'Грантовый проект',
      'conference': 'Конференция',
      'book': 'Книга/Монография',
      'creative': 'Творческий проект',
      'other': 'Другой проект'
    };
    return typeMap[type] || type;
  };

  const getResearchFieldCategory = (field) => {
    if (!field) return null;
    for (const [key, category] of Object.entries(RESEARCH_FIELDS)) {
      if (category.items.includes(field)) {
        return category.name;
      }
    }
    return null;
  };

  const isPopularField = (field) => {
    if (!field) return false;
    return POPULAR_RESEARCH_AREAS.includes(field);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указан';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Некорректная дата';
    }
  };

  const safeGet = (project, property, defaultValue = '') => {
    if (!project || typeof project !== 'object') return defaultValue;
    return project[property] !== undefined ? project[property] : defaultValue;
  };

  if (loading && projects.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <PageContainer>
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

        <Tooltip title="Создать проект">
          <CreateProjectButton onClick={() => navigate('/projects/create')} size="small">
            <AddIcon sx={{ fontSize: 24 }} />
          </CreateProjectButton>
        </Tooltip>

        <HeaderContent>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: '100%',
            width: '100%'
          }}>
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
                НАУЧНЫЕ ПРОЕКТЫ
              </Typography>
            </Box>

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
                Платформа для науки, творчества и объединения усилий
              </Typography>
            </Box>

            <Box sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 2
            }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <StatChip elevation={0}>
                  <FolderIcon fontSize="small" />
                  <Typography variant="body2">Всего: {totalProjects}</Typography>
                </StatChip>
                <StatChip elevation={0}>
                  <Typography variant="body2">Активных: {activeProjectsCount}</Typography>
                </StatChip>
                <StatChip elevation={0}>
                  <Typography variant="body2">Ищут: {recruitingProjectsCount}</Typography>
                </StatChip>
              </Box>
            </Box>
          </Box>
        </HeaderContent>
      </AnimatedHeader>

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
            placeholder="Поиск проектов..."
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
            >
              {PROJECT_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel sx={{
              fontWeight: 500,
              color: theme.palette.primary.main,
              '&.Mui-focused': {
                color: theme.palette.primary.main
              }
            }}>
              Тип проекта
            </InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              label="Тип проекта"
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
            >
              {PROJECT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
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

      {error && (
        <Alert severity="error" sx={{ maxWidth: 1200, width: '100%', mb: 3, borderRadius: 3 }}>
          {error}
          <Button color="inherit" size="small" onClick={fetchProjects} sx={{ ml: 2 }}>
            Повторить
          </Button>
        </Alert>
      )}

      {Array.isArray(projects) && projects.length > 0 ? (
        <ProjectsGrid>
          {projects.map((project) => {
            if (!project || typeof project !== 'object') return null;

            const projectId = safeGet(project, 'id');
            const projectTitle = safeGet(project, 'title', 'Без названия');
            const projectStatus = safeGet(project, 'status');
            const projectType = safeGet(project, 'project_type');
            const scientificField = safeGet(project, 'scientific_field');
            const description = safeGet(project, 'description', '');
            const memberCount = typeof safeGet(project, 'member_count') === 'number'
              ? safeGet(project, 'member_count')
              : 0;
            const deadline = safeGet(project, 'deadline');

            const fieldCategory = getResearchFieldCategory(scientificField);
            const fieldColor = getFieldColor(scientificField); // 🔥 ПОЛУЧАЕМ ЦВЕТ ИЗ НОВОГО ФАЙЛА

            const competencies = safeGet(project, 'required_competencies', []);
            const displayCompetencies = competencies.slice(0, 3);
            const remainingCompetencies = competencies.length - 3;

            return (
              <StackedCard
                key={projectId}
                onClick={() => navigate(`/projects/${projectId}`)}
                gradientColor={fieldColor} // 🔥 ИСПОЛЬЗУЕМ ПОЛУЧЕННЫЙ ЦВЕТ
              >
                {{
                  top: (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h4" sx={{ lineHeight: 1 }}>
                            {getProjectTypeIcon(projectType)} {/* 🔥 ИЗ НОВОГО ФАЙЛА */}
                          </Typography>
                          {isPopularField(scientificField) && (
                            <Tooltip title="Популярное научное направление">
                              <Typography variant="h6" sx={{ lineHeight: 1, color: '#ffb74d' }}>
                                ⭐
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                        <Chip
                          label={getStatusText(projectStatus)}
                          sx={{
                            ml: 1,
                            flexShrink: 0,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            height: 20,
                            backgroundColor: alpha(getStatusColor(projectStatus), 0.1),
                            color: getStatusColor(projectStatus),
                            borderColor: alpha(getStatusColor(projectStatus), 0.3)
                          }}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          lineHeight: 1.3,
                          mb: 0.5,
                          fontSize: '1rem'
                        }}
                      >
                        {projectTitle}
                      </Typography>

                      <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {getProjectTypeText(projectType)}
                        </Typography>

                        {scientificField && (
                          <>
                            <Typography variant="caption" color="text.secondary">•</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: fieldColor,
                                  display: 'inline-block'
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {scientificField}
                              </Typography>
                            </Box>
                          </>
                        )}

                        {fieldCategory && (
                          <Chip
                            label={fieldCategory}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              ml: 0.5
                            }}
                          />
                        )}
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.75rem',
                          fontWeight: 300,
                          color: alpha('#000', 0.7),
                          lineHeight: 1.4,
                          textAlign: 'left'
                        }}
                      >
                        {description || 'Нет описания'}
                      </Typography>

                      {displayCompetencies.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, mt: 0.5 }}>
                          {displayCompetencies.map((comp, idx) => (
                            <CompetencyChip
                              key={idx}
                              icon={<span>{getCompetencyIcon(comp)}</span>}
                              label={comp}
                              size="small"
                            />
                          ))}
                          {remainingCompetencies > 0 && (
                            <CompetencyChip
                              label={`+${remainingCompetencies}`}
                              size="small"
                            />
                          )}
                        </Box>
                      )}
                    </>
                  ),

                  bottom: (
                    <Box sx={{ width: '100%' }}>
                      {project.owner && (
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 0.5
                        }}>
                          <PersonIcon sx={{ fontSize: 12 }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {project.owner.first_name || project.owner.email}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PeopleIcon sx={{ fontSize: 14 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                            {memberCount}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            участников
                          </Typography>
                        </Box>

                        {deadline && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 12 }} />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              {formatDate(deadline)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )
                }}
              </StackedCard>
            );
          })}
        </ProjectsGrid>
      ) : (
        <Box sx={{
          maxWidth: 1200,
          width: '100%',
          p: 8,
          textAlign: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          borderRadius: 3
        }}>
          <ScienceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {Array.isArray(projects) ? 'У вас пока нет проектов' : 'Не удалось загрузить проекты'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {Array.isArray(projects)
              ? 'Создайте свой первый научный проект для коллаборации с коллегами'
              : 'Проверьте подключение к серверу или попробуйте обновить страницу'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/create')}
            size="large"
            sx={{ borderRadius: 5 }}
          >
            Создать проект
          </Button>
        </Box>
      )}

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
}

export default ProjectsPage;