// frontend/src/components/Materials/MaterialFolderModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../services/api';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 600,
    width: '100%',
    maxHeight: '80vh',
    backgroundColor: theme.palette.background.paper
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2, 3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

const SpeakerInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 3),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.9rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: theme.spacing(2, 3, 1, 3)
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1, 3),
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05)
  }
}));

const FileIconStyled = styled(Box)(({ theme }) => ({
  minWidth: 40,
  display: 'flex',
  justifyContent: 'center',
  color: theme.palette.primary.main
}));

const LoaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4)
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  color: theme.palette.text.secondary
}));

const getFileIcon = (fileName) => {
  if (!fileName) return <FileIcon />;

  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') return <PdfIcon sx={{ color: '#f44336' }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon sx={{ color: '#4caf50' }} />;
  if (['doc', 'docx'].includes(ext)) return <DescriptionIcon sx={{ color: '#2196f3' }} />;
  if (['xls', 'xlsx'].includes(ext)) return <DescriptionIcon sx={{ color: '#4caf50' }} />;
  if (['ppt', 'pptx'].includes(ext)) return <DescriptionIcon sx={{ color: '#ff9800' }} />;

  return <FileIcon />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const ensureAbsoluteUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http')) return url;

  const baseUrl = 'http://localhost:8001';
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

const MaterialFolderModal = ({
  open,
  onClose,
  material
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loadingProjectFiles, setLoadingProjectFiles] = useState(false);

  useEffect(() => {
    if (open && material) {
      console.log('📦 MaterialFolderModal получил material:', material);

      const project = material.participant?.project || material.project;

      if (project?.id) {
        loadProjectFiles(project.id);
      }
    }
  }, [open, material]);

  const loadProjectFiles = async (projectId) => {
    if (!projectId) return;

    setLoadingProjectFiles(true);
    try {
      const files = await projectsAPI.getDocuments(projectId);
      console.log('📦 Файлы проекта:', files);
      setProjectFiles(Array.isArray(files) ? files : []);
    } catch (err) {
      console.error('❌ Ошибка загрузки файлов проекта:', err);
    } finally {
      setLoadingProjectFiles(false);
    }
  };


const handleFileClick = (url) => {
  if (!url) {
    console.log('❌ URL файла отсутствует');
    return;
  }

  console.log('📂 Исходный URL:', url);
  console.log('📂 Тип URL:', typeof url);
  console.log('📂 Начинается с http?', url.startsWith('http'));

  const absoluteUrl = ensureAbsoluteUrl(url);
  console.log('📂 Преобразованный URL:', absoluteUrl);

  // Проверяем, что URL валидный
  try {
    new URL(absoluteUrl);
    console.log('✅ URL валидный');
  } catch (e) {
    console.log('❌ Некорректный URL:', e.message);
    return;
  }

  // Пробуем открыть
  console.log('🚀 Открываем в новой вкладке...');
  const newWindow = window.open(absoluteUrl, '_blank');

  if (!newWindow) {
    console.log('⚠️ Возможно, браузер блокирует всплывающие окна');
    // Пробуем альтернативный способ
    const link = document.createElement('a');
    link.href = absoluteUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('📎 Альтернативный способ использован');
  } else {
    console.log('✅ Вкладка открыта');
  }
};

  const handleProjectClick = (projectId) => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
      onClose();
    }
  };

  if (!material) return null;

  const participant = material.participant || {};
  const fullName = participant.user?.full_name ||
                   (participant.user ?
                     `${participant.user.first_name || ''} ${participant.user.last_name || ''}`.trim() :
                     '') ||
                   'Выступающий';

  const project = participant.project || material.project;

  // 🔥 Берем файлы из правильных мест
  const uploadedFiles = material.uploaded_files || [];  // файлы из заявки
  const materialFiles = material.files || [];           // файлы из SpeakerMaterial

  console.log('📊 MaterialFolderModal данные:', {
    fullName,
    hasProject: !!project,
    uploadedFilesCount: uploadedFiles.length,
    materialFilesCount: materialFiles.length,
    projectFilesCount: projectFiles.length
  });

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="div" fontWeight="600">
            Материалы
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <SpeakerInfo>
        <PersonIcon sx={{ color: theme.palette.primary.main }} />
        <Box>
          <Typography variant="subtitle1" component="div" fontWeight="600">
            {fullName}
          </Typography>
          {participant.talk_title && (
            <Typography variant="caption" component="div" color="text.secondary">
              {participant.talk_title}
            </Typography>
          )}
        </Box>
      </SpeakerInfo>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <LoaderContainer>
            <CircularProgress />
          </LoaderContainer>
        ) : error ? (
          <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Материалы из проекта */}
            {project && (
              <>
                <SectionTitle component="div">
                  Материалы из проекта
                </SectionTitle>
                <List>
                  <StyledListItem onClick={() => handleProjectClick(project.id)}>
                    <FileIconStyled>
                      <FolderIcon color="primary" />
                    </FileIconStyled>
                    <ListItemText
                      primary={project.title}
                      secondary="Перейти к проекту"
                    />
                    <LinkIcon sx={{ color: theme.palette.primary.main, opacity: 0.7 }} />
                  </StyledListItem>

                  {loadingProjectFiles ? (
                    <StyledListItem>
                      <CircularProgress size={20} sx={{ mr: 2 }} />
                      <ListItemText primary="Загрузка файлов..." />
                    </StyledListItem>
                  ) : projectFiles.length > 0 ? (
                    projectFiles.map((file, index) => (
                      <StyledListItem
                        key={file.id || index}
                        onClick={() => handleFileClick(file.url)}
                      >
                        <FileIconStyled>
                          {getFileIcon(file.name)}
                        </FileIconStyled>
                        <ListItemText
                          primary={file.name || 'Файл'}
                          secondary={formatFileSize(file.size)}
                        />
                        <DownloadIcon sx={{ color: theme.palette.primary.main, opacity: 0.7 }} />
                      </StyledListItem>
                    ))
                  ) : (
                    <StyledListItem>
                      <ListItemText
                        primary="Нет файлов в проекте"
                        secondary="Файлы не загружены"
                      />
                    </StyledListItem>
                  )}
                </List>
              </>
            )}

            {/* Загруженные файлы из заявки */}
            {uploadedFiles.length > 0 && (
              <>
                <SectionTitle component="div">
                  Загруженные файлы
                </SectionTitle>
                <List>
                  {uploadedFiles.map((file, index) => {
  console.log(`📎 Файл ${index}:`, file);
  console.log(`📎 URL файла ${index}:`, file.url);

  return (
    <StyledListItem
      key={index}
      onClick={() => handleFileClick(file.url)}
    >
      <FileIconStyled>
        {getFileIcon(file.name)}
      </FileIconStyled>
      <ListItemText
        primary={file.name || 'Файл'}
        secondary={formatFileSize(file.size)}
      />
      <DownloadIcon sx={{ color: theme.palette.primary.main, opacity: 0.7 }} />
    </StyledListItem>
  );
})}
                </List>
              </>
            )}

            {/* Файлы из SpeakerMaterial */}
            {materialFiles.length > 0 && (
              <>
                <SectionTitle component="div">
                  Дополнительные материалы
                </SectionTitle>
                <List>
                  {materialFiles.map((file, index) => (
                    <StyledListItem
                      key={index}
                      onClick={() => handleFileClick(file.url)}
                    >
                      <FileIconStyled>
                        {getFileIcon(file.name)}
                      </FileIconStyled>
                      <ListItemText
                        primary={file.name || 'Файл'}
                        secondary={formatFileSize(file.size)}
                      />
                      <DownloadIcon sx={{ color: theme.palette.primary.main, opacity: 0.7 }} />
                    </StyledListItem>
                  ))}
                </List>
              </>
            )}

            {/* Если нет никаких материалов */}
            {!project && uploadedFiles.length === 0 && materialFiles.length === 0 && (
              <EmptyState>
                <FolderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                <Typography color="text.secondary">
                  Нет материалов
                </Typography>
              </EmptyState>
            )}
          </>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default MaterialFolderModal;