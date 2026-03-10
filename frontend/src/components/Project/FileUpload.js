// frontend/src/components/Project/FileUpload.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PresentationIcon,
  Archive as ArchiveIcon,
  TextFields as TextIcon,
  Code as CodeIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5; // Максимум 5 файлов

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.ppt', '.pptx', '.txt', '.md', '.rtf',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.py', '.js', '.html', '.css', '.json', '.xml', '.csv'
];

// Функция для форматирования размера файла
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Функция для получения иконки файла
const getFileIcon = (file) => {
  const extension = file.name?.split('.').pop()?.toLowerCase() || file.extension;

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return <ImageIcon sx={{ color: '#4caf50' }} />;
  }
  if (extension === 'pdf') {
    return <PdfIcon sx={{ color: '#f44336' }} />;
  }
  if (['doc', 'docx'].includes(extension)) {
    return <DocIcon sx={{ color: '#2196f3' }} />;
  }
  if (['xls', 'xlsx'].includes(extension)) {
    return <ExcelIcon sx={{ color: '#4caf50' }} />;
  }
  if (['ppt', 'pptx'].includes(extension)) {
    return <PresentationIcon sx={{ color: '#ff9800' }} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return <ArchiveIcon sx={{ color: '#795548' }} />;
  }
  if (['txt', 'md', 'rtf'].includes(extension)) {
    return <TextIcon sx={{ color: '#607d8b' }} />;
  }
  if (['py', 'js', 'html', 'css', 'json', 'xml', 'csv'].includes(extension)) {
    return <CodeIcon sx={{ color: '#9c27b0' }} />;
  }
  return <FileIcon sx={{ color: '#757575' }} />;
};

const FileUpload = ({ onFilesChange, error, disabled, initialFiles = [] }) => {
  const [files, setFiles] = useState(initialFiles);
  const [uploadError, setUploadError] = useState(null);

  // Синхронизация с initialFiles
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Проверка на превышение лимита
    if (files.length + acceptedFiles.length > MAX_FILES) {
      setUploadError(`Максимум ${MAX_FILES} файлов`);
      return;
    }

    // Обработка отклоненных файлов
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.file.size > MAX_FILE_SIZE) {
          return `${file.file.name}: файл слишком большой (макс. 10MB)`;
        }
        return `${file.file.name}: недопустимый тип файла`;
      });
      setUploadError(errors.join('. '));
      return;
    }

    setUploadError(null);

    // 🔥 ПРОСТО СОХРАНЯЕМ ВЫБРАННЫЕ ФАЙЛЫ В СОСТОЯНИИ, НЕ ЗАГРУЖАЯ ИХ
    const newFiles = acceptedFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`, // Временный ID
      file: file, // Сохраняем сам File объект
      name: file.name,
      size: file.size,
      extension: file.name.split('.').pop().toLowerCase(),
      url: null, // URL будет после отправки
      uploaded: false
    }));

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    // Передаем выбранные файлы родителю
    onFilesChange?.(updatedFiles.map(f => f.file)); // Передаем только File объекты

  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_EXTENSIONS.join(','),
    disabled: disabled || files.length >= MAX_FILES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES - files.length
  });

  const handleRemoveFile = (fileToRemove) => {
    const newFiles = files.filter(f => f.id !== fileToRemove.id);
    setFiles(newFiles);

    // Передаем родителю оставшиеся File объекты
    onFilesChange?.(newFiles.map(f => f.file));
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Область загрузки */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 2,
          mb: 2,
          textAlign: 'center',
          cursor: disabled || files.length >= MAX_FILES ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          transition: 'all 0.2s',
          opacity: disabled ? 0.7 : 1,
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />

        <UploadIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
        <Typography variant="body2" gutterBottom>
          {isDragActive ? 'Отпустите файлы' : 'Перетащите файлы или кликните для выбора'}
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          {`Макс. ${MAX_FILES} файлов, до 10MB каждый`}
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          {`Поддерживаются: PDF, DOC, XLS, PPT, изображения, архивы, код`}
        </Typography>

        {files.length >= MAX_FILES && (
          <Chip
            size="small"
            color="warning"
            icon={<WarningIcon />}
            label={`Достигнут лимит (${MAX_FILES} файлов)`}
            sx={{ mt: 1 }}
          />
        )}
      </Paper>

      {/* Ошибки */}
      {(error || uploadError) && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setUploadError(null)}
        >
          {error || uploadError}
        </Alert>
      )}

      {/* Список выбранных файлов */}
      {files.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ p: 1, pb: 0 }}>
            Выбранные файлы ({files.length}/{MAX_FILES})
          </Typography>
          <List dense>
            {files.map((file) => (
              <ListItem key={file.id} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getFileIcon(file)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Tooltip title={file.name}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ maxWidth: 200 }}
                      >
                        {file.name}
                      </Typography>
                    </Tooltip>
                  }
                  secondary={formatFileSize(file.size)}
                />
                <ListItemSecondaryAction>
                  {!disabled && (
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFile(file)}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload;