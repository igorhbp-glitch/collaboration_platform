// frontend/src/components/Events/CreateEditNewsModal.js
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  alpha,
  useTheme,
  Grid,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Movie as MovieIcon,
  Image as ImageIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import { newsAPI } from '../../services/eventsAPI';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 800,
    minWidth: 600,
    maxHeight: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: theme.palette.grey[50]
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

const DropzoneArea = styled(Paper)(({ theme, isdragactive }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.background.paper,
  border: '2px dashed',
  borderColor: isdragactive === 'true' ? theme.palette.primary.main : theme.palette.divider,
  borderRadius: theme.spacing(3),
  transition: 'all 0.2s',
  width: '100%',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

const MediaCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  position: 'relative',
  '&:hover .delete-overlay': {
    opacity: 1
  }
}));

const DeleteOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s',
  zIndex: 1
});

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const CreateEditNewsModal = ({
  open,
  onClose,
  eventId,
  sections = [],
  currentSectionId = null,
  newsToEdit = null,
  onSuccess
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Данные формы
  const [formData, setFormData] = useState({
    section: null,
    title: '',
    excerpt: '',
    content: ''
  });

  // Файлы для загрузки (временные, для отображения)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);

  // Валидация
  const [errors, setErrors] = useState({});

  // 🔥 ИСПРАВЛЕНО: при открытии сбрасываем все состояния
  useEffect(() => {
    if (open) {
      // Сбрасываем состояния
      setSuccess(false);
      setError('');
      setLoading(false);
      setUploadProgress({});

      if (newsToEdit) {
        // Режим редактирования
        setFormData({
          section: newsToEdit.section || null,
          title: newsToEdit.title || '',
          excerpt: newsToEdit.excerpt || '',
          content: newsToEdit.content || ''
        });
        setExistingMedia(newsToEdit.media || []);
        setSelectedFiles([]);
      } else {
        // Режим создания
        setFormData({
          // 🔥 ВАЖНО: используем currentSectionId для предварительного выбора
          section: currentSectionId || null,
          title: '',
          excerpt: '',
          content: ''
        });
        setSelectedFiles([]);
        setExistingMedia([]);
      }
      setErrors({});
    }
  }, [open, newsToEdit, currentSectionId]);

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Введите заголовок новости';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Введите содержание новости';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка выбора файлов
  const onDrop = (acceptedFiles) => {
    // Добавляем новые файлы к уже выбранным
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: `new-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov']
    },
    maxSize: 50 * 1024 * 1024, // 50MB для видео
    maxFiles: 10
  });

  const handleRemoveNewFile = (fileId) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleRemoveExistingMedia = async (mediaId) => {
    if (!newsToEdit) return;

    try {
      await newsAPI.deleteMedia(newsToEdit.id, mediaId);
      setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error('Ошибка удаления медиа:', err);
      setError('Не удалось удалить файл');
    }
  };

  // Подготовка FormData для отправки
  const prepareFormData = () => {
    const formDataObj = new FormData();

    // Добавляем основные поля
    formDataObj.append('event', eventId);

    // 🔥 ИСПРАВЛЕНО: правильно передаем ID секции
    if (formData.section) {
      // Если section - это объект с id
      if (typeof formData.section === 'object' && formData.section?.id) {
        formDataObj.append('section', formData.section.id);
      }
      // Если section - это просто число (ID)
      else if (typeof formData.section === 'number') {
        formDataObj.append('section', formData.section);
      }
    }

    formDataObj.append('title', formData.title);
    formDataObj.append('content', formData.content);

    if (formData.excerpt) {
      formDataObj.append('excerpt', formData.excerpt);
    }

    // Для существующих медиа (при редактировании)
    if (newsToEdit && existingMedia.length > 0) {
      formDataObj.append('media', JSON.stringify(existingMedia));
    }

    // 🔥 ВАЖНО: добавляем новые файлы
    selectedFiles.forEach((fileObj) => {
      formDataObj.append('media', fileObj.file);
    });

    // 🔥 Для отладки: логируем содержимое FormData
    console.log('📦 Отправляемые данные:');
    for (let pair of formDataObj.entries()) {
      if (pair[0] === 'media' && pair[1] instanceof File) {
        console.log(`   ${pair[0]}: ${pair[1].name} (${pair[1].size} bytes)`);
      } else {
        console.log(`   ${pair[0]}: ${pair[1]}`);
      }
    }

    return formDataObj;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (newsToEdit) {
        // Режим редактирования - обычный PATCH с JSON
        const updateData = {
          section: formData.section?.id || formData.section || null,
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          media: existingMedia
        };

        const response = await newsAPI.updateNews(newsToEdit.id, updateData);

        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess(response);
        }, 1500);
      } else {
        // Режим создания - отправляем FormData с файлами
        const formDataObj = prepareFormData();
        const response = await newsAPI.createNews(formDataObj);

        console.log('✅ Ответ от сервера:', response);

        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess(response);
        }, 1500);
      }
    } catch (err) {
      console.error('❌ Ошибка сохранения новости:', err);
      setError(err.response?.data?.error || 'Не удалось сохранить новость');
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    // Очищаем preview URL'ы
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    onClose();
  };

  const getMediaIcon = (type) => {
    if (type?.startsWith('video/')) return <MovieIcon />;
    return <ImageIcon />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isVideo = (file) => {
    return file.type?.startsWith('video/') ||
           file.name?.toLowerCase().includes('.mov') ||
           file.name?.toLowerCase().includes('.mp4');
  };

  return (
    <StyledDialog open={open} onClose={handleFormCancel} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ArticleIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            {newsToEdit ? 'Редактирование новости' : 'Создание новости'}
          </Typography>
        </Box>
        <IconButton onClick={handleFormCancel} sx={{ color: 'white', borderRadius: theme.spacing(1.5) }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
            Новость успешно сохранена!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: theme.spacing(2) }}>
            {error}
          </Alert>
        )}

        {/* Выбор секции (только если не привязаны к конкретной секции) */}
        {!currentSectionId && sections.length > 0 && (
          <Box sx={{ mt: 2, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Привязка к секции (необязательно)</InputLabel>
              <Select
                value={formData.section?.id || formData.section || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData({ ...formData, section: null });
                  } else {
                    // Ищем секцию в массиве
                    const section = sections.find(s => s.id === value);
                    setFormData({ ...formData, section: section || value });
                  }
                }}
                label="Привязка к секции (необязательно)"
                sx={{ borderRadius: 3, backgroundColor: 'white' }}
              >
                <MenuItem value="">
                  <em>Общая новость (без секции)</em>
                </MenuItem>
                {sections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: section.color || theme.palette.primary.main
                      }} />
                      {section.title}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Оставьте пустым для общей новости мероприятия
              </FormHelperText>
            </FormControl>
          </Box>
        )}

        {/* Заголовок */}
        <TextField
          fullWidth
          label="Заголовок новости *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={!!errors.title}
          helperText={errors.title}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'white'
            }
          }}
        />

        {/* Краткое описание */}
        <TextField
          fullWidth
          label="Краткое описание (необязательно)"
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          multiline
          rows={2}
          placeholder="Краткий текст для предпросмотра (если не указано, будет взято из начала содержания)"
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'white'
            }
          }}
        />

        {/* Содержание */}
        <TextField
          fullWidth
          label="Содержание новости *"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          multiline
          rows={6}
          error={!!errors.content}
          helperText={errors.content}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'white'
            }
          }}
        />

        <Divider sx={{ my: 3 }} />

        {/* Загрузка медиа */}
        <Typography variant="h6" fontWeight="600" gutterBottom>
          Медиафайлы
        </Typography>

        <DropzoneArea
          {...getRootProps()}
          isdragactive={isDragActive ? 'true' : 'false'}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="subtitle1" fontWeight="600">
            {isDragActive ? 'Отпустите файлы' : 'Перетащите файлы'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            или кликните для выбора (изображения и видео, макс. 50MB)
          </Typography>
        </DropzoneArea>

        {/* Прогресс загрузки */}
        {Object.keys(uploadProgress).length > 0 && (
          <Box sx={{ mt: 2 }}>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <Box key={fileName} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" noWrap sx={{ maxWidth: 300 }}>
                    {fileName}
                  </Typography>
                  <Typography variant="caption">{progress}%</Typography>
                </Box>
                <CircularProgress
                  variant="determinate"
                  value={progress}
                  size={24}
                  sx={{ display: 'block' }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Существующие медиа (при редактировании) */}
        {existingMedia.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Загруженные файлы
            </Typography>
            <Grid container spacing={2}>
              {existingMedia.map((media) => (
                <Grid item xs={6} sm={4} key={media.id}>
                  <MediaCard>
                    {media.type === 'video' ? (
                      <Box
                        sx={{
                          height: 120,
                          bgcolor: 'grey.900',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        <MovieIcon sx={{ fontSize: 40 }} />
                      </Box>
                    ) : (
                      <CardMedia
                        component="img"
                        height="120"
                        image={media.url}
                        alt=""
                      />
                    )}
                    <DeleteOverlay className="delete-overlay">
                      <IconButton
                        onClick={() => handleRemoveExistingMedia(media.id)}
                        sx={{ color: 'white' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </DeleteOverlay>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="caption" display="block" noWrap>
                        {media.name || media.filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(media.size)}
                      </Typography>
                    </Box>
                  </MediaCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Новые выбранные файлы */}
        {selectedFiles.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Новые файлы для загрузки
            </Typography>
            <Grid container spacing={2}>
              {selectedFiles.map((file) => (
                <Grid item xs={6} sm={4} key={file.id}>
                  <MediaCard>
                    {isVideo(file) ? (
                      <Box
                        sx={{
                          height: 120,
                          bgcolor: 'grey.900',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        <MovieIcon sx={{ fontSize: 40 }} />
                      </Box>
                    ) : file.preview ? (
                      <CardMedia
                        component="img"
                        height="120"
                        image={file.preview}
                        alt=""
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 120,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                      </Box>
                    )}
                    <DeleteOverlay className="delete-overlay">
                      <IconButton
                        onClick={() => handleRemoveNewFile(file.id)}
                        sx={{ color: 'white' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </DeleteOverlay>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="caption" display="block" noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  </MediaCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </StyledDialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button
          onClick={handleFormCancel}
          variant="outlined"
          startIcon={<CancelIcon />}
          sx={{ borderRadius: 5, px: 4 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          sx={{ borderRadius: 5, px: 4 }}
        >
          {loading ? 'Сохранение...' : newsToEdit ? 'Сохранить изменения' : 'Создать новость'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default CreateEditNewsModal;