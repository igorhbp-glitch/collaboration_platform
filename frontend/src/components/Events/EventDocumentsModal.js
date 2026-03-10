// frontend/src/components/Events/EventDocumentsModal.js
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
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  alpha,
  useTheme,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import { eventsAPI } from '../../services/eventsAPI';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 900,
    minWidth: 500,
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

// Область загрузки
const DropzoneArea = styled(Paper)(({ theme, isdragactive }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: theme.palette.background.paper,
  border: '1px dashed',
  borderColor: isdragactive === 'true' ? theme.palette.primary.main : theme.palette.divider,
  borderRadius: theme.spacing(2),
  transition: 'all 0.2s',
  width: '100%',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

// Карточка документа
const DocumentCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(5),
  transition: 'all 0.2s',
  border: '0.5px solid',
  borderColor: theme.palette.divider,
  height: 'auto',
  maxWidth: '120px',
  display: 'flex',
  boxShadow: theme.shadows[0],
  flexDirection: 'column',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[0],
    borderColor: theme.palette.primary.main
  }
}));

// Бейдж удаления в правом верхнем углу
const DeleteBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 6,
  right: 6,
  zIndex: 20,
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  borderRadius: '50%',
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: theme.shadows[0],
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
    transform: 'scale(1.1)'
  }
}));

// Иконка документа
const DocumentIcon = styled(Box)(({ theme }) => ({
  fontSize: 32,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2, 0, 1, 0)
}));

// Название документа
const DocumentName = styled(Typography)({
  fontWeight: 300,
  fontSize: '0.9rem',
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  lineHeight: 1.3,
  minHeight: 36,
  padding: '0 8px'
});

const getFileIcon = (fileName) => {
  if (!fileName) return <FileIcon sx={{ fontSize: 32, color: '#757575' }} />;

  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') return <PdfIcon sx={{ fontSize: 32, color: '#f44336' }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon sx={{ fontSize: 32, color: '#4caf50' }} />;
  if (['doc', 'docx'].includes(ext)) return <DescriptionIcon sx={{ fontSize: 32, color: '#2196f3' }} />;
  if (['xls', 'xlsx'].includes(ext)) return <DescriptionIcon sx={{ fontSize: 32, color: '#4caf50' }} />;
  if (['ppt', 'pptx'].includes(ext)) return <DescriptionIcon sx={{ fontSize: 32, color: '#ff9800' }} />;

  return <FileIcon sx={{ fontSize: 32, color: '#757575' }} />;
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFullFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/media')) return `http://localhost:8001${path}`;
  return `http://localhost:8001/media/${path}`;
};

const getFileName = (doc) => {
  if (!doc) return 'Документ';
  return doc.name || doc.filename || 'Документ';
};

const getDocumentId = (doc, index) => {
  if (!doc) return `doc-${index}`;
  return doc.id || `doc-${index}`;
};

const getDocumentUrl = (doc) => {
  if (!doc) return null;
  return doc.url || null;
};

const getDocumentSize = (doc) => {
  if (!doc) return 0;
  return doc.size || 0;
};

const getDocumentDate = (doc) => {
  if (!doc) return null;
  return doc.uploaded_at || doc.created_at || null;
};

const EventDocumentsModal = ({
  open,
  onClose,
  eventId,
  documents = [],
  canManageDocuments = false,  // 🔥 заменяем isOrganizer на canManageDocuments
  onDocumentsUpdate
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [localDocuments, setLocalDocuments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      const validDocs = Array.isArray(documents)
        ? documents.filter(doc => doc !== null && doc !== undefined)
        : [];
      setLocalDocuments(validDocs);
      setError('');
      setSuccess(false);
    }
  }, [open, documents]);

  const onDrop = async (acceptedFiles) => {
    if (!canManageDocuments) return;  // 🔥 проверка прав

    setUploading(true);
    setError('');

    try {
      const uploadedDocs = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const formData = new FormData();
        formData.append('document', file);

        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const response = await eventsAPI.uploadEventDocument(eventId, formData, (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });

        if (response) {
          uploadedDocs.push({
            id: response.id || Date.now() + i,
            name: file.name,
            filename: file.name,
            size: file.size,
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

      const newDocuments = [...localDocuments, ...uploadedDocs];
      setLocalDocuments(newDocuments);

      if (onDocumentsUpdate) {
        onDocumentsUpdate(newDocuments);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось загрузить файлы');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !canManageDocuments || uploading,  // 🔥 отключаем, если нет прав
    maxSize: 10 * 1024 * 1024,
  });

  const handleDocumentClick = (url, filename) => {
    if (!url) return;
    window.open(getFullFileUrl(url), '_blank');
  };

  const handleDelete = async (documentId, event) => {
    if (!canManageDocuments || !documentId) return;  // 🔥 проверка прав

    event.stopPropagation();

    if (!window.confirm('Удалить этот документ?')) return;

    setLoading(true);
    try {
      await eventsAPI.deleteEventDocument(eventId, documentId);

      const newDocuments = localDocuments.filter(doc => doc && doc.id !== documentId);
      setLocalDocuments(newDocuments);

      if (onDocumentsUpdate) {
        onDocumentsUpdate(newDocuments);
      }

    } catch (err) {
      console.error('Ошибка удаления:', err);
      setError('Не удалось удалить документ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FolderIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            Документы мероприятия
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white', borderRadius: theme.spacing(1.5) }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: theme.spacing(2) }}>
            Документ успешно загружен
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: theme.spacing(2) }}>
            {error}
          </Alert>
        )}

        {/* Зона загрузки - только для тех, у кого есть права */}
        {canManageDocuments && (
          <DropzoneArea
            {...getRootProps()}
            isdragactive={isDragActive ? 'true' : 'false'}
          >
            <input {...getInputProps()} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <UploadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="600">
                  {isDragActive ? 'Отпустите файлы' : 'Загрузить документы'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Перетащите файлы или кликните для выбора (макс. 10MB)
                </Typography>
              </Box>
            </Box>
          </DropzoneArea>
        )}

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

        {/* Сетка документов */}
        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mt: 2 }}>
          Загруженные документы ({localDocuments.length})
        </Typography>

        {localDocuments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <FolderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
            <Typography color="text.secondary">
              Нет загруженных документов
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {localDocuments.map((doc, index) => {
              const docId = getDocumentId(doc, index);
              const fileName = getFileName(doc);
              const fileUrl = getDocumentUrl(doc);

              return (
                <Grid item key={docId}>
                  <DocumentCard
                    onClick={() => handleDocumentClick(fileUrl, fileName)}
                    sx={{ position: 'relative' }}
                  >
                    {/* Бейдж удаления - только для тех, у кого есть права */}
                    {canManageDocuments && doc.id && (
                      <DeleteBadge onClick={(e) => handleDelete(doc.id, e)}>
                        <Tooltip title="Удалить">
                          <DeleteIcon
                            sx={{
                              fontSize: 18,
                              color: theme.palette.error.main
                            }}
                          />
                        </Tooltip>
                      </DeleteBadge>
                    )}

                    <DocumentIcon>
                      {getFileIcon(fileName)}
                    </DocumentIcon>
                    <CardContent sx={{ p: 1, pt: 0 }}>
                      <DocumentName>
                        {fileName}
                      </DocumentName>
                    </CardContent>
                  </DocumentCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default EventDocumentsModal;