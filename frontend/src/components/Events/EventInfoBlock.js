// frontend/src/components/Events/EventInfoBlock.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  useTheme,
  alpha,
  Snackbar,
  Alert,
  Paper
} from '@mui/material';
import {
  Info as InfoIcon,
  History as HistoryIcon,
  EmojiEvents as EmojiEventsIcon,
  Groups as GroupsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { eventsAPI } from '../../services/eventsAPI';
import { sectionsAPI } from '../../services/eventsAPI'; // 🔥 ДОБАВЛЯЕМ ИМПОРТ

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const InfoSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4, 3, 4, 3),
  boxShadow: 'none'
}));

const HeaderWithIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2)
}));

const TitleContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%'
});

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderColor: alpha(theme.palette.primary.main, 0.1)
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  textAlign: 'left',
  width: '100%'
}));

const CollapsibleContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  maxHeight: 120,
  overflow: 'hidden',
  transition: 'max-height 0.3s ease-in-out',
  '&.expanded': {
    maxHeight: 'none',
    overflow: 'visible'
  }
}));

const GradientOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 80,
  background: `linear-gradient(to bottom, transparent, ${theme.palette.background.paper})`,
  pointerEvents: 'none',
  zIndex: 1
}));

const ContentText = styled(Typography)(({ theme }) => ({
  whiteSpace: 'pre-wrap',
  lineHeight: 1.7,
  color: theme.palette.text.primary,
  fontSize: '1rem',
  fontWeight: 300,
  textAlign: 'left',
  '& strong': {
    fontWeight: 500,
  },
  '& ul, & ol': {
    paddingLeft: theme.spacing(3),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  '& li': {
    fontWeight: 300,
    marginBottom: theme.spacing(0.5)
  }
}));

const ToggleButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: theme.palette.primary.main,
  fontWeight: 500,
  textTransform: 'none',
  fontSize: '0.95rem',
  '&:hover': {
    backgroundColor: 'transparent',
    textDecoration: 'underline'
  }
}));

// Маленькая аккуратная кнопка
const AddInfoButton = styled(Button)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  color: theme.palette.primary.main,
  border: `0.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(0.5, 1.5),
  fontSize: '0.8rem',
  fontWeight: 500,
  textTransform: 'none',
  minWidth: 'auto',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    borderColor: theme.palette.primary.main
  }
}));

// Редактор
const EditorContainer = styled(Box)(({ theme }) => ({
  width: '100%'
}));

const EditorActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2)
}));

const EmptyState = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.text.secondary
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const EventInfoBlock = ({
  title = "О МЕРОПРИЯТИИ",
  content,
  icon = "info",
  eventId,
  sectionId,  // 🔥 НОВЫЙ ПРОПС для секций
  canEdit = false,
  onUpdate
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content || '');
  const [saving, setSaving] = useState(false);

  // Уведомления
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const getIcon = () => {
    switch (icon) {
      case 'history':
        return <HistoryIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />;
      case 'goals':
        return <EmojiEventsIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />;
      case 'organizers':
        return <GroupsIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />;
      default:
        return <InfoIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />;
    }
  };

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleEditStart = () => {
    setEditValue(content || '');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(content || '');
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ

const handleEditSave = async () => {
  if (!eventId && !sectionId) {
    console.error('❌ Нет eventId или sectionId');
    return;
  }

  setSaving(true);
  try {
    console.log('📝 Сохраняем информацию:', editValue);

    let response;

    // Если есть sectionId - обновляем секцию
    if (sectionId) {
      console.log('📝 Обновляем секцию ID:', sectionId);

      // 🔥 ИСПРАВЛЕНО: сначала получаем текущие данные секции
      const currentSection = await sectionsAPI.getSectionById(sectionId);

      // Отправляем все поля, которые были, плюс обновленное about
      const updateData = {
        title: currentSection.title,
        description: currentSection.description || '',
        about: editValue,
        color: currentSection.color || '#4CAF50',
        status: currentSection.status || 'active'
      };

      response = await sectionsAPI.updateSection(sectionId, updateData);
    }
    // Иначе обновляем мероприятие
    else if (eventId) {
      console.log('📝 Обновляем мероприятие ID:', eventId);
      response = await eventsAPI.patchEvent(eventId, {
        additional_info: editValue
      });
    }

    console.log('✅ Ответ от сервера:', response);

    setSnackbar({
      open: true,
      message: 'Информация сохранена',
      severity: 'success'
    });

    setIsEditing(false);

    if (onUpdate) {
      console.log('🔄 Вызываем onUpdate для обновления страницы');
      await onUpdate();
    }

  } catch (err) {
    console.error('❌ Ошибка сохранения:', err);
    setSnackbar({
      open: true,
      message: 'Ошибка при сохранении',
      severity: 'error'
    });
  } finally {
    setSaving(false);
  }
};

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Режим редактирования
  if (isEditing) {
    return (
      <InfoSection>
        <HeaderWithIcon>
          {getIcon()}
          <TitleContainer>
            <Typography
              variant="h5"
              fontWeight="700"
              color="primary.main"
              sx={{ textTransform: 'uppercase' }}
            >
              {title}
            </Typography>

            <IconButton
              onClick={handleEditCancel}
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </TitleContainer>
        </HeaderWithIcon>

        <StyledDivider />

        <EditorContainer>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Введите информацию..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper
              }
            }}
          />

          <EditorActions>
            <Button
              variant="outlined"
              onClick={handleEditCancel}
              disabled={saving}
              sx={{ borderRadius: 5 }}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleEditSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ borderRadius: 5 }}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </EditorActions>
        </EditorContainer>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </InfoSection>
    );
  }

  // Пустое состояние (нет контента)
  if (!content) {
    return (
      <InfoSection>
        <HeaderWithIcon>
          {getIcon()}
          <TitleContainer>
            <Typography
              variant="h5"
              fontWeight="700"
              color="primary.main"
              sx={{ textTransform: 'uppercase' }}
            >
              {title}
            </Typography>

            {canEdit && (
              <AddInfoButton
                startIcon={<AddIcon fontSize="small" />}
                onClick={handleEditStart}
                size="small"
              >
                Добавить информацию
              </AddInfoButton>
            )}
          </TitleContainer>
        </HeaderWithIcon>

        <StyledDivider />

        <ContentContainer>
          {!canEdit ? (
            <EmptyState elevation={0}>
              <Typography color="text.secondary">
                Нет информации
              </Typography>
            </EmptyState>
          ) : null}
        </ContentContainer>
      </InfoSection>
    );
  }

  // Заполненное состояние
  return (
    <InfoSection>
      <HeaderWithIcon>
        {getIcon()}
        <TitleContainer>
          <Typography
            variant="h5"
            fontWeight="700"
            color="primary.main"
            sx={{ textTransform: 'uppercase' }}
          >
            {title}
          </Typography>

          {/* Карандаш для редактирования */}
          {canEdit && (
            <IconButton
              onClick={handleEditStart}
              size="small"
              sx={{
                color: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </TitleContainer>
      </HeaderWithIcon>

      <StyledDivider />

      <ContentContainer>
        <Box sx={{ position: 'relative' }}>
          <CollapsibleContent className={expanded ? 'expanded' : ''}>
            <ContentText>
              {content}
            </ContentText>
          </CollapsibleContent>

          {!expanded && content.length > 300 && <GradientOverlay />}
        </Box>

        {content.length > 300 && (
          <ToggleButton
            onClick={handleToggle}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            disableRipple
          >
            {expanded ? 'Скрыть' : 'Читать дальше'}
          </ToggleButton>
        )}
      </ContentContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </InfoSection>
  );
};

export default EventInfoBlock;