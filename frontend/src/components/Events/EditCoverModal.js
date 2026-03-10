// frontend/src/components/Events/EditCoverModal.js
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
  Paper,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { eventsAPI } from '../../services/eventsAPI';
import { styled } from '@mui/material/styles';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 🔥 Стилизованный диалог с большим скруглением
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 700
  }
}));

// 🔥 Стилизованный заголовок
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

// 🔥 Контейнер для миниатюры
const ThumbnailContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 120,
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  cursor: 'pointer',
  border: '2px solid transparent',
  transition: 'all 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
    '& .delete-overlay': {
      opacity: 1
    }
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`
  }
}));

// 🔥 Изображение миниатюры
const ThumbnailImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
});

// 🔥 Оверлей для удаления
const DeleteOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s',
  zIndex: 2
});

// 🔥 Заглушка для отсутствующего изображения
const PlaceholderThumbnail = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 120,
  backgroundColor: theme.palette.grey[200],
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  color: theme.palette.grey[600],
  borderRadius: theme.spacing(2)
}));

// Функция для получения полного URL изображения
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:8001${path}`;
};

// Функция для проверки ориентации изображения
const checkImageOrientation = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const isLandscape = img.width > img.height;
        const isSquare = Math.abs(img.width - img.height) < 10;
        resolve(isLandscape || isSquare);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const EditCoverModal = ({ open, onClose, eventId, currentImages = [], onSave }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (files.length + acceptedFiles.length > MAX_IMAGES) {
      setError(`Максимум ${MAX_IMAGES} изображений`);
      return;
    }

    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(f => {
        if (f.file.size > MAX_FILE_SIZE) {
          return `${f.file.name}: файл слишком большой (макс. 5MB)`;
        }
        return `${f.file.name}: недопустимый формат (JPEG, PNG, WEBP, GIF)`;
      });
      setError(errors.join('. '));
      return;
    }

    setError('');

    for (const file of acceptedFiles) {
      const isValid = await checkImageOrientation(file);
      if (!isValid) {
        setError(`Изображение "${file.name}" должно быть горизонтальным или квадратным`);
        return;
      }
    }

    setFiles(prev => [...prev, ...acceptedFiles]);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif']
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_IMAGES - files.length
  });

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!window.confirm('Удалить это изображение?')) return;

    try {
      const newImages = currentImages.filter(url => url !== imageUrl);
      await eventsAPI.updateCoverImages(eventId, newImages);
      onSave(newImages);
      if (selectedImage === imageUrl) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Ошибка удаления:', err);
      setError('Не удалось удалить изображение');
    }
  };

  const handleSetAsCurrent = (imageUrl) => {
    setSelectedImage(imageUrl);
    // TODO: отправить запрос на установку этого изображения как текущего
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const response = await eventsAPI.uploadCoverImage(
          eventId,
          formData,
          (progress) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }
        );

        uploadedUrls.push(response.url);

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }

      const allImages = [...currentImages, ...uploadedUrls];
      await eventsAPI.updateCoverImages(eventId, allImages);

      onSave(allImages);
      setFiles([]);

    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить изображения');
    } finally {
      setUploading(false);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h6" fontWeight="600">
          Редактирование обложки
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Текущие изображения */}
        {currentImages.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Текущие изображения ({currentImages.length}/{MAX_IMAGES})
            </Typography>
            <Grid container spacing={2}>
              {currentImages.map((url, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <ThumbnailContainer
                    className={selectedImage === url ? 'selected' : ''}
                    onClick={() => handleSetAsCurrent(url)}
                  >
                    <ThumbnailImage
                      src={getFullImageUrl(url)}
                      alt={`Обложка ${index + 1}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `
                          <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#f5f5f5; color:#999; flex-direction:column; gap:8px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/>
                            </svg>
                            <span style="font-size:12px;">Изображение</span>
                          </div>
                        `;
                      }}
                    />
                    <DeleteOverlay className="delete-overlay">
                      <IconButton
                        size="small"
                        sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(url);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </DeleteOverlay>
                    {selectedImage === url && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          bgcolor: 'primary.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 3
                        }}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </Box>
                    )}
                  </ThumbnailContainer>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Область загрузки */}
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            mb: 3,
            textAlign: 'center',
            cursor: uploading || files.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'grey.50',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            borderRadius: 3,
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Отпустите файлы' : 'Перетащите изображения'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            или кликните для выбора
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Горизонтальные или квадратные изображения (JPEG, PNG, WEBP, GIF)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Макс. 5 изображений, до 5MB каждое
          </Typography>
        </Paper>

        {/* Прогресс загрузки */}
        {Object.keys(uploadProgress).length > 0 && (
          <Box sx={{ mb: 3 }}>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <Box key={fileName} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                    {fileName}
                  </Typography>
                  <Typography variant="body2">{progress}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Ошибка */}
        {error && (
          <Alert
            severity="error"
            sx={{ borderRadius: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* Новые файлы */}
        {files.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Новые изображения ({files.length})
            </Typography>
            <Grid container spacing={2}>
              {files.map((file, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <ThumbnailContainer>
                    <ThumbnailImage
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                    />
                    <DeleteOverlay className="delete-overlay">
                      <IconButton
                        size="small"
                        sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
                        onClick={() => handleRemoveFile(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </DeleteOverlay>
                  </ThumbnailContainer>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          sx={{ borderRadius: 2, px: 4 }}
        >
          {uploading ? 'Загрузка...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default EditCoverModal;