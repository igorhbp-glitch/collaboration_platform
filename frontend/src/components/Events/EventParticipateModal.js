// frontend/src/components/Events/EventParticipateModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  alpha,
  useTheme,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Mic as MicIcon,
  Headset as HeadsetIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Article as ArticleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import { projectsAPI } from '../../services/api';
import { participantsAPI } from '../../services/eventsAPI';
import { useAuth } from '../../contexts/AuthContext';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ (как в EventProgramModal)
// ============================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 700,
    minWidth: 600,
    maxHeight: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: theme.palette.grey[50],
    boxShadow: theme.shadows[0]  // убираем тень
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(3),
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

// Карточка выбора типа участия (упрощённая, без теней)
const TypeCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(5),  // 🔥 увеличил скругление
  border: '0.5px solid',
  borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.02) : theme.palette.background.paper,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: theme.shadows[0],  // убираем тень
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

// Карточка проекта (упрощённая, без теней)
const ProjectCard = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(5),  // 🔥 увеличил скругление
  border: '0.5px solid',
  borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginBottom: theme.spacing(1),
  boxShadow: theme.shadows[0],  // убираем тень
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

// Зона загрузки файлов (упрощённая)
const DropzoneArea = styled(Paper)(({ theme, isdragactive }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.background.paper,
  border: '0.5px dashed',
  borderColor: isdragactive === 'true' ? theme.palette.primary.main : theme.palette.divider,
  borderRadius: theme.spacing(5),  // 🔥 увеличил скругление
  transition: 'all 0.2s',
  width: '100%',
  boxShadow: theme.shadows[0],  // убираем тень
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

// Переключатель источника материалов
const SourceToggle = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  '& .MuiButton-root': {
    flex: 1,
    borderRadius: theme.spacing(5),
    padding: theme.spacing(1.5),
    textTransform: 'none',
    fontWeight: 600,
    border: '0.5px solid',
    borderColor: theme.palette.divider,
    '&:hover': {
      borderColor: theme.palette.primary.main
    }
  }
}));

// Заголовок мероприятия (как в EventProgramModal)
const EventTitle = styled(Box)(({ theme }) => ({
  mb: 3,
  ml: 2,
  '& .MuiTypography-root': {
    fontWeight: 700,
    color: theme.palette.primary.main
  }
}));

const EventParticipateModal = ({
  open,
  onClose,
  eventId,
  eventTitle,
  sections = [],
  existingParticipant = null,
  mode = 'create',
  onSuccess
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  // Состояния формы
  const [participationType, setParticipationType] = useState('listener');
  const [selectedSection, setSelectedSection] = useState(null);
  const [isPlenary, setIsPlenary] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sourceType, setSourceType] = useState('files');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [talkTitle, setTalkTitle] = useState('');

  // Данные
  const [completedProjects, setCompletedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Определяем, можно ли выбирать роль слушателя (заблокировано для докладчиков)
  const isSpeakerInEditMode = mode === 'edit' && existingParticipant?.participation_type === 'speaker';

  // Загрузка завершенных проектов при открытии
  useEffect(() => {
    if (open && user) {
      loadCompletedProjects();
    }
  }, [open, user]);

  // Загрузка данных существующего участия (для режима редактирования)
  useEffect(() => {
    if (open && mode === 'edit' && existingParticipant) {
      setParticipationType(existingParticipant.participation_type);
      setTalkTitle(existingParticipant.talk_title || '');
      setIsPlenary(existingParticipant.is_plenary || false);

      if (existingParticipant.section) {
        setSelectedSection(existingParticipant.section);
      }

      if (existingParticipant.project) {
        setSourceType('project');
        setSelectedProject(existingParticipant.project);
      } else if (existingParticipant.uploaded_files?.length > 0) {
        setSourceType('files');
        setUploadedFiles(existingParticipant.uploaded_files);
      }
    }
  }, [open, mode, existingParticipant]);

  // Сбрасываем ошибку при изменении формы
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [participationType, sourceType, selectedSection, isPlenary, selectedProject, uploadedFiles, talkTitle]);

  const loadCompletedProjects = async () => {
    try {
      const projects = await projectsAPI.getAll({
        status: 'completed'
      });

      const validProjects = projects.filter(p => p !== null && p !== undefined);

      const userProjects = validProjects.filter(p =>
        p.owner?.id === user?.id ||
        p.members?.some(m => m.id === user?.id)
      );

      setCompletedProjects(userProjects);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
  };

  const handleTypeSelect = (type) => {
    if (isSpeakerInEditMode && type === 'listener') return;
    setParticipationType(type);
    if (type === 'listener') {
      setSelectedSection(null);
      setIsPlenary(false);
      setSelectedProject(null);
      setSourceType('files');
      setUploadedFiles([]);
      setTalkTitle('');
    }
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setIsPlenary(false);
  };

  const handlePlenarySelect = () => {
    setSelectedSection(null);
    setIsPlenary(true);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  const handleSourceChange = (newSource) => {
    setSourceType(newSource);
    if (newSource === 'project') {
      setUploadedFiles([]);
    } else {
      setSelectedProject(null);
    }
  };

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    setError('');

    try {
      const newFiles = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];

        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const response = await participantsAPI.uploadParticipationFile(eventId, file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });

        if (response) {
          newFiles.push({
            id: response.id || Date.now() + i,
            name: file.name,
            size: file.size,
            type: file.type,
            url: response.url,
            uploaded_at: new Date().toISOString()
          });
        }

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      console.error('Ошибка загрузки файлов:', err);
      setError('Не удалось загрузить файлы');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    maxSize: 10 * 1024 * 1024,
  });

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleCancelParticipation = async () => {
    if (!window.confirm('Вы уверены, что хотите отказаться от участия?')) return;

    setLoading(true);
    try {
      await participantsAPI.cancelParticipation(existingParticipant.id);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Ошибка при отказе от участия:', err);
      setError('Не удалось отказаться от участия');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!participationType) {
      setError('Выберите тип участия');
      return false;
    }

    if (participationType === 'speaker') {
      if (!isPlenary && sections.length > 0 && !selectedSection) {
        setError('Выберите секцию или пленарное заседание');
        return false;
      }

      if (!talkTitle.trim()) {
        setError('Укажите тему доклада');
        return false;
      }

      if (sourceType === 'project' && !selectedProject) {
        setError('Выберите проект');
        return false;
      }

      if (sourceType === 'files' && uploadedFiles.length === 0) {
        setError('Загрузите файлы материалов');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!eventId) {
      setError('Ошибка: ID мероприятия не найден');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        participation_type: participationType,
        section_id: selectedSection?.id || null,
        is_plenary: isPlenary,
        project_id: selectedProject?.id || null,
        uploaded_files: sourceType === 'files' ? uploadedFiles : [],
        talk_title: participationType === 'speaker' ? talkTitle : ''
      };

      console.log('📦 ОТПРАВКА ДАННЫХ НА СЕРВЕР:', {
        ...data,
        uploaded_files: data.uploaded_files.length
      });

      let response;
      if (mode === 'create') {
        response = await participantsAPI.participate(eventId, data);
      } else {
        response = await participantsAPI.updateParticipant(existingParticipant.id, data);
      }

      console.log('✅ ОТВЕТ ОТ СЕРВЕРА:', response);

      setSuccess(true);

      if (mode === 'edit' && response.status === 'pending') {
        alert('Ваша заявка отправлена на повторное рассмотрение организатору');
      }

      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err) {
      console.error('❌ ОШИБКА ПРИ ОТПРАВКЕ:', err);

      let errorMessage = 'Не удалось отправить заявку';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data && typeof err.response.data === 'object') {
        const errorMessages = Object.values(err.response.data).flat();
        errorMessage = errorMessages.join('; ');
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth={false} fullWidth={false}>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {mode === 'create' ? (
            <>
              <CheckCircleIcon sx={{ fontSize: 28 }} />
              <Typography variant="h5" fontWeight="700">
                Подача заявки
              </Typography>
            </>
          ) : (
            <>
              <ArticleIcon sx={{ fontSize: 28 }} />
              <Typography variant="h5" fontWeight="700">
                Управление участием
              </Typography>
            </>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white', borderRadius: theme.spacing(1.5) }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {/* Заголовок мероприятия (как в EventProgramModal) */}
        <Box sx={{ mt: 1, mb: 3 }}>
          <Typography variant="h4" fontWeight="700" color="primary.main">
            {eventTitle || 'Мероприятие'}
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
            {mode === 'create' ? 'Заявка успешно отправлена!' : 'Изменения сохранены!'}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
          Тип участия
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TypeCard
            selected={participationType === 'listener'}
            onClick={() => handleTypeSelect('listener')}
            sx={{
              flex: 1,
              opacity: isSpeakerInEditMode ? 0.5 : 1,
              cursor: isSpeakerInEditMode ? 'not-allowed' : 'pointer'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <HeadsetIcon color={participationType === 'listener' ? 'primary' : 'inherit'} />
              <Typography variant="subtitle1" fontWeight="600">
                Слушатель
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Посещение мероприятия без доклада
            </Typography>
            {isSpeakerInEditMode && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                Недоступно для докладчиков
              </Typography>
            )}
          </TypeCard>

          <TypeCard
            selected={participationType === 'speaker'}
            onClick={() => handleTypeSelect('speaker')}
            sx={{ flex: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MicIcon color={participationType === 'speaker' ? 'primary' : 'inherit'} />
              <Typography variant="subtitle1" fontWeight="600">
                Докладчик
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Презентация своего проекта или доклада
            </Typography>
          </TypeCard>
        </Box>

        {participationType === 'speaker' && (
          <>
            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="600" gutterBottom>
              Детали выступления
            </Typography>

            <TextField
              fullWidth
              label="Тема доклада *"
              value={talkTitle}
              onChange={(e) => setTalkTitle(e.target.value)}
              placeholder="Например: 'Влияние искусственного интеллекта на современную науку'"
              multiline
              rows={2}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <Typography variant="subtitle2" fontWeight="500" gutterBottom sx={{ mt: 2 }}>
              Место выступления *
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mb: 3 }}>
              {/* Пленарное заседание */}
              <ProjectCard
                selected={selectedSection === null && isPlenary}
                onClick={handlePlenarySelect}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    🎤
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="600">
                      Пленарное заседание
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Выступление на главной сцене
                    </Typography>
                  </Box>
                  {selectedSection === null && isPlenary && (
                    <CheckCircleIcon color="primary" />
                  )}
                </Box>
              </ProjectCard>

              {/* Секции */}
              {sections.map((section) => (
                <ProjectCard
                  key={section.id}
                  selected={selectedSection?.id === section.id}
                  onClick={() => handleSectionSelect(section)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: section.color || theme.palette.primary.main, width: 32, height: 32 }}>
                      {section.title[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="600">
                        {section.title}
                      </Typography>
                      {section.description && (
                        <Typography variant="caption" color="text.secondary">
                          {section.description}
                        </Typography>
                      )}
                    </Box>
                    {selectedSection?.id === section.id && (
                      <CheckCircleIcon color="primary" />
                    )}
                  </Box>
                </ProjectCard>
              ))}
            </Box>

            {completedProjects.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight="500" gutterBottom>
                  Источник материалов
                </Typography>
                <SourceToggle>
                  <Button
                    variant={sourceType === 'project' ? 'contained' : 'outlined'}
                    onClick={() => handleSourceChange('project')}
                    startIcon={<FolderIcon />}
                  >
                    Использовать проект
                  </Button>
                  <Button
                    variant={sourceType === 'files' ? 'contained' : 'outlined'}
                    onClick={() => handleSourceChange('files')}
                    startIcon={<UploadIcon />}
                  >
                    Загрузить файлы
                  </Button>
                </SourceToggle>
              </>
            )}

            {sourceType === 'project' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="500" gutterBottom>
                  Выберите завершенный проект *
                </Typography>
                {completedProjects.length > 0 ? (
                  completedProjects.map((project) => {
                    if (!project || !project.id) return null;

                    const projectTitle = project.title || 'Без названия';
                    const memberCount = project.member_count || 0;

                    return (
                      <ProjectCard
                        key={project.id}
                        selected={selectedProject?.id === project.id}
                        onClick={() => handleProjectSelect(project)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32 }}>
                            <CheckIcon fontSize="small" />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              {projectTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Завершен • {memberCount} участников
                            </Typography>
                          </Box>
                          {selectedProject?.id === project.id && (
                            <CheckCircleIcon color="primary" />
                          )}
                        </Box>
                      </ProjectCard>
                    );
                  })
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    У вас нет завершенных проектов
                  </Alert>
                )}
              </Box>
            )}

            {sourceType === 'files' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="500" gutterBottom>
                  Загрузите материалы *
                </Typography>

                <DropzoneArea
                  {...getRootProps()}
                  isdragactive={isDragActive ? 'true' : 'false'}
                >
                  <input {...getInputProps()} />
                  <UploadIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight="600">
                    {isDragActive ? 'Отпустите файлы' : 'Перетащите файлы'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    или кликните для выбора (макс. 10MB)
                  </Typography>
                </DropzoneArea>

                {Object.keys(uploadProgress).length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                      <Box key={fileName} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" noWrap sx={{ maxWidth: 250 }}>
                            {fileName}
                          </Typography>
                          <Typography variant="caption">{progress}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}

                {uploadedFiles.length > 0 && (
                  <List sx={{ mt: 2 }}>
                    {uploadedFiles.map((file) => {
                      if (!file) return null;

                      const fileName = file.name || 'Файл';
                      const fileSize = file.size || 0;

                      return (
                        <ListItem
                          key={file.id}
                          sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            mb: 1,
                            border: '0.5px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <ListItemIcon>
                            <DescriptionIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={fileName}
                            secondary={formatFileSize(fileSize)}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleRemoveFile(file.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            )}
          </>
        )}

        {participationType === 'listener' && (
          <Box sx={{
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 6,
            border: '0.5px dashed',
            borderColor: 'divider'
          }}>
            <Typography variant="body1" gutterBottom>
              Вы выбрали участие в качестве слушателя.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              После подтверждения заявки вы сможете посещать все секции мероприятия.
            </Typography>
          </Box>
        )}
      </StyledDialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1, justifyContent: 'space-between' }}>
        <Box>
          {mode === 'edit' && (
            <Button
              onClick={handleCancelParticipation}
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              sx={{ borderRadius: 5, px: 4 }}
            >
              Отказаться
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ borderRadius: 5, px: 4 }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={mode === 'create' ? 'primary' : 'success'}
            disabled={loading || (participationType === 'speaker' && sourceType === 'files' && uploading)}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            sx={{ borderRadius: 5, px: 4 }}
          >
            {loading
              ? 'Отправка...'
              : mode === 'create'
                ? 'Отправить заявку'
                : 'Сохранить изменения'}
          </Button>
        </Box>
      </DialogActions>
    </StyledDialog>
  );
};

export default EventParticipateModal;