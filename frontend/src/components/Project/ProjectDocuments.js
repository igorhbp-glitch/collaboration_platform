// frontend/src/components/Project/ProjectDocuments.js - С ПОДДЕРЖКОЙ РЕЖИМА ТОЛЬКО ДЛЯ ПРОСМОТРА
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Chip,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Refresh as RefreshIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import DocumentTile from './DocumentTile';
import FileUpload from './FileUpload';
import { projectsAPI, API_BASE_URL } from '../../services/api';

const DocumentsContainer = styled(Paper)(({ theme }) => ({
  paddingTop: theme.spacing(11),
  paddingLeft: theme.spacing(4),
  paddingBottom: theme.spacing(3),
  paddingRight: theme.spacing(4),
  marginTop: theme.spacing(-11),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderColor: theme.palette.divider
}));

const DocumentsGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  minHeight: '140px'
}));

const EmptyState = styled(Box)(({ theme }) => ({
  width: '100%',
  py: 4,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2)
}));

const ProjectDocuments = ({
  projectId,
  isOwner,
  isMember,
  isViewOnly = false,  // 🔥 НОВЫЙ ПРОПС
  onDocumentChange
}) => {
  const [documents, setDocuments] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const theme = useTheme();

  // Загрузка документов проекта
  useEffect(() => {
    if (projectId) {
      fetchDocuments();
    } else {
      setDocuments([]);
    }
  }, [projectId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      console.log(`📥 Загрузка документов проекта ${projectId}`);
      const data = await projectsAPI.getDocuments(projectId);
      setDocuments(data || []);
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
      showNotification('Ошибка загрузки документов', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleUploadClick = () => {
    if (isViewOnly) {
      showNotification('В режиме просмотра нельзя загружать документы', 'info');
      return;
    }
    setUploadDialogOpen(true);
  };

  const handleUploadClose = () => {
    setUploadDialogOpen(false);
  };


  const handleFilesUploaded = async (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;

    setLoading(true);

    try {
      // Загружаем каждый файл по отдельности
      for (const file of newFiles) {
        try {
          await projectsAPI.uploadDocument(projectId, file);
        } catch (uploadError) {
          console.error(`Ошибка загрузки файла ${file.name}:`, uploadError);
          showNotification(`Ошибка при загрузке ${file.name}`, 'error');
        }
      }

      // Обновляем список документов
      await fetchDocuments();

      showNotification(`Загружено ${newFiles.length} ${getFileWord(newFiles.length)}`, 'success');

      if (onDocumentChange) onDocumentChange();
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      showNotification('Ошибка при загрузке файлов', 'error');
    } finally {
      setLoading(false);
      setUploadDialogOpen(false);
    }
  };

  // 🔥 ИСПРАВЛЕНО: скачивание с проверкой прав
  const handleDownload = (document) => {
    if (isViewOnly) {
      showNotification('В режиме просмотра нельзя скачивать файлы', 'info');
      return;
    }
    if (document.url) {
      window.open(document.url, '_blank');
    } else {
      showNotification('Файл временно недоступен', 'warning');
    }
  };

  // 🔥 ИСПРАВЛЕНО: удаление только для владельца/участника
  const handleDelete = async (document) => {
    if (isViewOnly) {
      showNotification('В режиме просмотра нельзя удалять файлы', 'info');
      return;
    }
    if (!window.confirm(`Удалить файл "${document.name}"?`)) return;

    try {
      setLoading(true);

      await projectsAPI.deleteDocument(document.id);

      // Обновляем список документов
      setDocuments(documents.filter(d => d.id !== document.id));
      showNotification('Файл удален', 'success');

      if (onDocumentChange) onDocumentChange();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      showNotification('Ошибка при удалении файла', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ИСПРАВЛЕНО: шаринг с предупреждением
  const handleShare = (document) => {
    if (isViewOnly) {
      showNotification('В режиме просмотра нельзя делиться файлами', 'info');
      return;
    }
    // Копируем ссылку в буфер обмена
    navigator.clipboard?.writeText(document.url || window.location.href);
    showNotification('Ссылка скопирована в буфер обмена', 'info');
  };

  const handleRefresh = () => {
    fetchDocuments();
  };

  const getFileWord = (count) => {
    if (count === 1) return 'файл';
    if (count > 1 && count < 5) return 'файла';
    return 'файлов';
  };

  const canUpload = (isOwner || isMember) && !isViewOnly;

  return (
    <>
      <DocumentsContainer elevation={0}>
        {/* Заголовок с кнопками */}
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <Box>
    <Typography
      variant="h5"
      fontWeight="700"
      sx={{ color: 'primary.main' }}
    >
      Документы проекта
    </Typography>

    {/* 🔥 СТРОКА С КОЛИЧЕСТВОМ ФАЙЛОВ - ПО ЛЕВОМУ КРАЮ */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
        {documents.length} {getFileWord(documents.length)}
      </Typography>

      {isViewOnly && (
        <Chip
          size="small"
          icon={<VisibilityOffIcon />}
          label="Только просмотр"
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      )}
    </Box>
  </Box>

  {/* Кнопки справа (без изменений) */}
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Tooltip title="Обновить список">
      <IconButton onClick={handleRefresh} disabled={loading} size="small">
        <RefreshIcon />
      </IconButton>
    </Tooltip>

    {canUpload && (
      <Tooltip title="Загрузить документ">
        <IconButton
          onClick={handleUploadClick}
          disabled={loading}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
    )}
  </Box>
</Box>

        {/* Сетка документов */}
        <DocumentsGrid>
          {loading ? (
            <EmptyState>
              <CircularProgress size={40} />
              <Typography variant="body2">
                Загрузка документов...
              </Typography>
            </EmptyState>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <DocumentTile
                key={doc.id}
                document={{
                  id: doc.id,
                  name: doc.name,
                  size: doc.size,
                  extension: doc.extension,
                  url: doc.url,
                  uploaded_by: doc.uploaded_by_user,
                  uploaded_at: doc.uploaded_at
                }}
                onDownload={handleDownload}
                onDelete={!isViewOnly && (isOwner || isMember) ? handleDelete : null}
                onShare={!isViewOnly ? handleShare : null}
                isViewOnly={isViewOnly}  // 🔥 ПЕРЕДАЁМ ПРОПС В ДОЧЕРНИЙ КОМПОНЕНТ
              />
            ))
          ) : (
            <EmptyState>
              <FileIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 300,        // ← очень тонкий шрифт
                  mb: 0,                  // ← уменьшен отступ снизу (было по умолчанию больше)
                  color: 'text.secondary'
                }}
              >
                Нет загруженных документов
              </Typography>
              {canUpload && (
                <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={handleUploadClick}
                      sx={{
                        mt: 0,
                        borderRadius: theme.spacing(3),  // ← большое скругление
                        borderWidth: '0.5px',             // ← очень тонкая граница
                        textTransform: 'none',             // ← не капсом
                        fontWeight: 300,
                        px: 3,
                        py: 0.8,
                        '&:hover': {
                          borderWidth: '0.5px'            // ← сохраняем тонкую границу при наведении
                        }
                      }}
                    >
                  Загрузить первый файл
                </Button>
              )}
            </EmptyState>
          )}
        </DocumentsGrid>
      </DocumentsContainer>

      {/* Диалог загрузки файлов */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Загрузка документов
          </Typography>
        </DialogTitle>
        <DialogContent>
          <FileUpload
            onFilesChange={handleFilesUploaded}
            disabled={loading}
            uploadEndpoint={`${API_BASE_URL}/projects/${projectId}/documents/`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose} disabled={loading}>
            Отмена
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.type || 'info'}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProjectDocuments;