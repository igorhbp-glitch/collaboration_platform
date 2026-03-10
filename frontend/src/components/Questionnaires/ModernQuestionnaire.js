// frontend/src/components/Questionnaires/ModernQuestionnaire.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Autocomplete,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  Tooltip,
  Zoom,
  Fade,
  useTheme,
  alpha,
  LinearProgress,
  FormHelperText,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
  Code as CodeIcon,
  Language as LanguageIcon,
  Group as GroupIcon,
  Psychology as PsychologyIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // 👈 Добавлен useLocation

// Импортируем справочник
import {
  EDUCATION_LEVELS,
  UNIVERSITY_BRANCHES,
  STUDY_PROGRAMS,
  POSITIONS,
  ACADEMIC_DEGREES,
  DEPARTMENTS,
  COMPETENCIES,
  METHODOLOGIES,
  PUBLICATION_TYPES,
  COLLABORATION_TYPES,
  POPULAR_RESEARCH_AREAS,
  getUniqueProgramNames,
  getLevelsForProgram,
  searchScienceData
} from '../../data/scienceData';

const steps = ['Образование', 'Научные интересы', 'Компетенции', 'Опыт', 'Сотрудничество'];

const ModernQuestionnaire = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Получаем информацию о текущем маршруте
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Для условного отображения кафедры
  const [isStaff, setIsStaff] = useState(false);

  // Для поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  // Для отслеживания развернутых категорий на 3 странице
  const [expandedCategories, setExpandedCategories] = useState({});

  // Состояния для выбора программы
  const [selectedProgramName, setSelectedProgramName] = useState('');
  const [availableLevels, setAvailableLevels] = useState([]);
  const [selectedProgramLevel, setSelectedProgramLevel] = useState('');

  // 🔥 Получаем страницу, с которой пришли (или устанавливаем dashboard как запасной вариант)
  const from = location.state?.from?.pathname || '/dashboard';

  // Загружаем сохраненные данные пользователя (если есть)
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Эффект для обновления доступных уровней при выборе программы
  useEffect(() => {
    if (selectedProgramName) {
      const levels = getLevelsForProgram(selectedProgramName);
      setAvailableLevels(levels);

      // Если у пользователя уже был выбран уровень, проверяем его доступность
      if (answers.study_program_level) {
        const levelExists = levels.some(l => l.value === answers.study_program_level);
        if (levelExists) {
          setSelectedProgramLevel(answers.study_program_level);
        } else {
          setSelectedProgramLevel('');
        }
      }
    } else {
      setAvailableLevels([]);
      setSelectedProgramLevel('');
    }
  }, [selectedProgramName, answers.study_program_level]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8001/api/auth/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('📥 Загружен профиль пользователя:', userData);

        // Заполняем форму данными из профиля
        const programName = userData.study_program_detail?.name || '';
        const programLevel = userData.study_program_detail?.level || '';

        setSelectedProgramName(programName);
        setSelectedProgramLevel(programLevel);

        setAnswers({
          // Шаг 1: Образование
          branch: userData.branch_detail?.name || '',
          study_program: programName,
          study_program_level: programLevel,
          position: userData.position || '',
          academic_degree: userData.academic_degree || '',
          department: userData.department_detail?.name || '',

          // Шаг 2: Научные интересы
          research_fields: userData.research_fields || [],
          methodologies: userData.methodologies || [],

          // Шаг 3: Компетенции
          competencies: userData.competencies || [],

          // Шаг 4: Опыт
          publications_count: userData.publications_count || 0,
          publication_types: userData.publication_types || [],
          projects_experience: userData.projects_experience || '',

          // Шаг 5: Сотрудничество
          collaboration_types: userData.collaboration_types || []
        });

        // Определяем, сотрудник ли пользователь по значению position
        if (userData.position) {
          const selectedPosition = POSITIONS.find(p => p.value === userData.position);
          setIsStaff(selectedPosition?.category === 'staff');
        }
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки профиля:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ОБРАБОТЧИКИ
  // ============================================

  const handleInputChange = (field, value) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePositionChange = (selectedValue) => {
    console.log('📌 Выбрана должность (value):', selectedValue);

    // Находим выбранную позицию в справочнике
    const selectedPosition = POSITIONS.find(p => p.value === selectedValue);

    if (selectedPosition) {
      console.log('📌 Русское название:', selectedPosition.name);
      console.log('📌 Категория:', selectedPosition.category);

      // Сохраняем value (код), а не русское название
      handleInputChange('position', selectedPosition.value);

      // Проверяем, сотрудник ли это (не студент)
      setIsStaff(selectedPosition.category === 'staff');
    } else {
      console.warn('⚠️ Должность с value не найдена:', selectedValue);
    }
  };

  const handleProgramNameChange = (newValue) => {
    setSelectedProgramName(newValue || '');
    handleInputChange('study_program', newValue || '');
    // Сбрасываем уровень
    setSelectedProgramLevel('');
    handleInputChange('study_program_level', '');
  };

  const handleProgramLevelChange = (event) => {
    const level = event.target.value;
    setSelectedProgramLevel(level);
    handleInputChange('study_program_level', level);
  };

  const handleAddToArray = (field, value) => {
    if (!value) return;

    setAnswers(prev => {
      const current = prev[field] || [];
      if (!current.includes(value)) {
        return {
          ...prev,
          [field]: [...current, value]
        };
      }
      return prev;
    });
  };

  const handleRemoveFromArray = (field, itemToRemove) => {
    setAnswers(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(item => item !== itemToRemove)
    }));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchScienceData(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectFromSearch = (result) => {
    if (result.type === 'Компетенция') {
      handleAddToArray('competencies', result.value);
    } else if (result.type === 'Методология') {
      handleAddToArray('methodologies', result.value);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleExpandCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // ============================================
  // ВАЛИДАЦИЯ
  // ============================================

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return answers.branch &&
               answers.study_program &&
               answers.study_program_level &&
               answers.position;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setError('');
    } else {
      setError('Пожалуйста, заполните обязательные поля (филиал, специальность, уровень образования, должность)');
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  // ============================================
  // ОТПРАВКА ДАННЫХ
  // ============================================

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        navigate('/login');
        return;
      }

      console.log('📤 Отправка данных профиля:', answers);

      const response = await fetch('http://localhost:8001/api/auth/profile/update/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(answers)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Профиль успешно обновлен:', data);
        setSuccess(true);

        // Обновляем данные в localStorage
        if (data.email) {
          localStorage.setItem('user', JSON.stringify({
            id: data.id,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            role: data.role
          }));
        }

        // 🔥 Перенаправляем на страницу, с которой пришли
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 2000);

      } else {
        console.error('❌ Ошибка сервера:', data);
        setError(data.error || 'Ошибка при сохранении данных');
      }

    } catch (err) {
      console.error('❌ Ошибка при отправке:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // РЕНДЕР ШАГОВ
  // ============================================

  const renderStep0 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Образование и должность
      </Typography>

      {/* Филиал */}
      <FormControl fullWidth margin="normal">
        <Autocomplete
          options={UNIVERSITY_BRANCHES}
          value={answers.branch || null}
          onChange={(e, newValue) => handleInputChange('branch', newValue || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Выберите филиал *"
              variant="outlined"
              required
            />
          )}
        />
      </FormControl>

      {/* Выбор названия специальности */}
      <FormControl fullWidth margin="normal">
        <Autocomplete
          options={getUniqueProgramNames()}
          value={selectedProgramName}
          onChange={(e, newValue) => handleProgramNameChange(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Выберите направление подготовки *"
              variant="outlined"
              required
            />
          )}
        />
      </FormControl>

      {/* Выбор уровня образования */}
      {selectedProgramName && (
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Уровень образования *</InputLabel>
          <Select
            value={selectedProgramLevel}
            onChange={handleProgramLevelChange}
            label="Уровень образования *"
          >
            {availableLevels.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Выберите уровень вашей программы</FormHelperText>
        </FormControl>
      )}

      {/* Должность */}
      <FormControl fullWidth margin="normal">
        <Autocomplete
          options={POSITIONS}
          getOptionLabel={(option) => option.name || option}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={POSITIONS.find(p => p.value === answers.position) || null}
          onChange={(e, newValue) => handlePositionChange(newValue?.value || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Должность / Статус *"
              variant="outlined"
              required
            />
          )}
          groupBy={(option) => option.category === 'student' ? 'Обучающиеся' : 'Сотрудники'}
        />
      </FormControl>

      {/* Ученая степень */}
      <FormControl fullWidth margin="normal">
        <Autocomplete
          options={ACADEMIC_DEGREES}
          value={answers.academic_degree || null}
          onChange={(e, newValue) => handleInputChange('academic_degree', newValue || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Ученая степень (при наличии)"
              variant="outlined"
            />
          )}
        />
      </FormControl>

      {/* Кафедра (только для сотрудников) */}
      {isStaff && (
        <FormControl fullWidth margin="normal">
          <Autocomplete
            freeSolo
            options={DEPARTMENTS}
            value={answers.department || null}
            onChange={(e, newValue) => handleInputChange('department', newValue || '')}
            onInputChange={(e, newValue) => handleInputChange('department', newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Кафедра"
                variant="outlined"
                placeholder="Выберите из списка или введите свою"
                helperText="Можно выбрать из списка или ввести название вручную"
              />
            )}
          />
        </FormControl>
      )}

      <FormHelperText sx={{ mt: 2 }}>
        * Обязательные поля
      </FormHelperText>
    </Box>
  );

  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Научные интересы
      </Typography>

      {/* Поиск */}
      <TextField
        fullWidth
        margin="normal"
        label="Поиск научных направлений"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Начните вводить для поиска..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />

      {/* Результаты поиска */}
      {searchResults.length > 0 && (
        <Paper sx={{ mt: 1, mb: 2, maxHeight: 200, overflow: 'auto' }}>
          {searchResults.map((result, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderBottom: index < searchResults.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => handleSelectFromSearch(result)}
            >
              <Typography variant="body2" color="primary">
                {result.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {result.category}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Популярные направления */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          Популярные направления:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {POPULAR_RESEARCH_AREAS.map((area) => (
            <Chip
              key={area}
              label={area}
              onClick={() => handleAddToArray('research_fields', area)}
              variant={answers.research_fields.includes(area) ? 'filled' : 'outlined'}
              color={answers.research_fields.includes(area) ? 'primary' : 'default'}
              size="small"
            />
          ))}
        </Box>
      </Box>

      {/* Выбранные направления */}
      {answers.research_fields.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Ваши научные интересы:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {answers.research_fields.map((field) => (
              <Chip
                key={field}
                label={field}
                onDelete={() => handleRemoveFromArray('research_fields', field)}
                deleteIcon={<DeleteIcon />}
                color="primary"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Методологии */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Методологии и подходы (опционально)
        </Typography>

        <FormControl fullWidth margin="normal">
          <Autocomplete
            multiple
            options={METHODOLOGIES}
            value={answers.methodologies}
            onChange={(e, newValue) => handleInputChange('methodologies', newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option}
                    size="small"
                    {...tagProps}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Выберите методологии"
                placeholder="Начните вводить..."
              />
            )}
          />
        </FormControl>
      </Box>
    </Box>
  );

  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <CodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Компетенции
      </Typography>

      {/* Поиск */}
      <TextField
        fullWidth
        margin="normal"
        label="Поиск компетенций"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Начните вводить для поиска..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />

      {/* Результаты поиска */}
      {searchResults.length > 0 && (
        <Paper sx={{ mt: 1, mb: 2, maxHeight: 200, overflow: 'auto' }}>
          {searchResults.map((result, index) => (
            <Box
              key={index}
              sx={{
                p: 1.5,
                borderBottom: index < searchResults.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => handleSelectFromSearch(result)}
            >
              <Typography variant="body2" color="primary">
                {result.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {result.category}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      {/* Категории */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom color="text.secondary">
          Категории:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="Все"
            onClick={() => setActiveCategory('all')}
            color={activeCategory === 'all' ? 'primary' : 'default'}
            variant={activeCategory === 'all' ? 'filled' : 'outlined'}
          />
          {Object.entries(COMPETENCIES).map(([key, category]) => (
            <Chip
              key={key}
              label={category.name}
              onClick={() => {
                setActiveCategory(key);
                if (!expandedCategories[key]) {
                  setExpandedCategories(prev => ({ ...prev, [key]: false }));
                }
              }}
              color={activeCategory === key ? 'primary' : 'default'}
              variant={activeCategory === key ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Компетенции по категориям */}
      {Object.entries(COMPETENCIES)
        .filter(([key]) => activeCategory === 'all' || key === activeCategory)
        .map(([key, category]) => {
          const isExpanded = expandedCategories[key];
          const itemsToShow = isExpanded ? category.items : category.items.slice(0, 10);
          const hasMore = category.items.length > 10;

          return (
            <Box key={key} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {category.name} {!isExpanded && `(${Math.min(10, category.items.length)} из ${category.items.length})`}
                </Typography>
                {hasMore && (
                  <Button
                    size="small"
                    onClick={() => handleExpandCategory(key)}
                    sx={{ textTransform: 'none' }}
                  >
                    {isExpanded ? 'Свернуть' : `Показать все ${category.items.length}`}
                  </Button>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {itemsToShow.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    onClick={() => handleAddToArray('competencies', item)}
                    variant={answers.competencies.includes(item) ? 'filled' : 'outlined'}
                    color={answers.competencies.includes(item) ? 'primary' : 'default'}
                    size="small"
                    sx={{
                      '&:hover': {
                        bgcolor: answers.competencies.includes(item)
                          ? alpha(theme.palette.primary.main, 0.8)
                          : alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          );
      })}

      {/* Выбранные компетенции */}
      {answers.competencies.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Ваши компетенции:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {answers.competencies.map((comp) => (
              <Chip
                key={comp}
                label={comp}
                onDelete={() => handleRemoveFromArray('competencies', comp)}
                deleteIcon={<DeleteIcon />}
                color="primary"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderStep3 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <MenuBookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Опыт и публикации
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          (опционально)
        </Typography>
      </Typography>

      {/* Количество публикаций */}
      <TextField
        fullWidth
        margin="normal"
        type="number"
        label="Количество научных публикаций"
        value={answers.publications_count}
        onChange={(e) => handleInputChange('publications_count', parseInt(e.target.value) || 0)}
        InputProps={{ inputProps: { min: 0 } }}
        helperText="Если пока нет публикаций, оставьте 0"
      />

      {/* Типы публикаций */}
      <FormControl fullWidth margin="normal">
        <Autocomplete
          multiple
          options={PUBLICATION_TYPES}
          value={answers.publication_types}
          onChange={(e, newValue) => handleInputChange('publication_types', newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Типы публикаций"
              placeholder="Выберите типы"
              helperText="Можно выбрать несколько"
            />
          )}
        />
      </FormControl>

      {/* Опыт в проектах */}
      <TextField
        fullWidth
        margin="normal"
        multiline
        rows={4}
        label="Опыт участия в научных проектах"
        value={answers.projects_experience}
        onChange={(e) => handleInputChange('projects_experience', e.target.value)}
        placeholder="Расскажите о проектах, в которых вы участвовали (если есть)..."
        helperText="Необязательное поле"
      />
    </Box>
  );

  const renderStep4 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Предпочтения по сотрудничеству
      </Typography>

      {/* Типы сотрудничества */}
      <FormControl fullWidth margin="normal">
        <Autocomplete
          multiple
          options={COLLABORATION_TYPES}
          value={answers.collaboration_types}
          onChange={(e, newValue) => handleInputChange('collaboration_types', newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  {...tagProps}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Типы сотрудничества"
              placeholder="Выберите интересующие вас форматы"
            />
          )}
        />
      </FormControl>
    </Box>
  );

  // ============================================
  // ОСНОВНОЙ РЕНДЕР
  // ============================================

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Загрузка анкеты...</Typography>
      </Container>
    );
  }

  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Fade in={true}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
          {/* Заголовок */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="600">
              Анкета научных компетенций
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Расскажите о себе, чтобы мы могли найти идеальных коллег для сотрудничества
            </Typography>

            {/* Прогресс */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {activeStep + 1} из {steps.length}
              </Typography>
            </Box>
          </Box>

          {/* Степпер */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Контент шага */}
          <Zoom in={true} key={activeStep}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                {activeStep === 0 && renderStep0()}
                {activeStep === 1 && renderStep1()}
                {activeStep === 2 && renderStep2()}
                {activeStep === 3 && renderStep3()}
                {activeStep === 4 && renderStep4()}
              </CardContent>
            </Card>
          </Zoom>

          {/* Ошибки */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Анкета успешно отправлена! Перенаправляем...
            </Alert>
          )}

          {/* Кнопки навигации */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              disabled={activeStep === 0 || saving || success}
              variant="outlined"
            >
              Назад
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={saving || success}
                startIcon={saving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              >
                {saving ? 'Отправка...' : 'Завершить'}
              </Button>
            ) : (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
              >
                Далее
              </Button>
            )}
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default ModernQuestionnaire;