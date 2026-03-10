// frontend/src/components/Project/FileAttachment.js - ФИНАЛЬНАЯ ВЕРСИЯ СО СТИЛЯМИ

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  GetApp as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PresentationIcon,
  Archive as ArchiveIcon,
  TextFields as TextIcon,
  Code as CodeIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Возвращает иконку для типа файла
 */
const getFileIcon = (extension, isOwn) => {
  const ext = extension?.toLowerCase() || '';
  const iconColor = isOwn ? '#ffffff' : '#757575';

  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
    return <ImageIcon sx={{ color: iconColor, fontSize: 20 }} />;
  }
  if (ext === 'pdf') {
    return <PdfIcon sx={{ color: iconColor, fontSize: 20 }} />;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <DocIcon sx={{ color: iconColor, fontSize: 20 }} />;
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return <ExcelIcon sx={{ color: iconColor, fontSize: 20 }} />;
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return <PresentationIcon sx={{ color: iconColor, fontSize: 20 }} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <ArchiveIcon sx={{ color: iconColor, fontSize: 20 }} />;
  }
  if (['txt', 'md', 'rtf'].includes(ext)) {
    return <TextIcon sx={{ color: iconColor, fontSize: 20 }} />;
  }
  if (['py', 'js', 'html', 'css', 'json', 'xml', 'csv'].includes(ext)) {
    return <CodeIcon sx={{ color: iconColor, fontSize: 20 }} />;
  }
  return <FileIcon sx={{ color: iconColor, fontSize: 20 }} />;
};

/**
 * Форматирует размер файла
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============================================================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ - МИНИМАЛИСТИЧНЫЕ
// ============================================================================

const AttachmentContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '4px 0',
  cursor: 'pointer',
  width: '100%'
});

const FileInfo = styled(Box)({
  flex: 1,
  minWidth: 0,
  marginLeft: 8,
  marginRight: 8
});

const FileName = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  fontWeight: 400,
  fontSize: '0.85rem',
  lineHeight: 1.3,
  color: isOwn ? '#ffffff' : theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}));

const FileSize = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  fontSize: '0.7rem',
  color: isOwn ? 'rgba(255, 255, 255, 0.6)' : theme.palette.text.secondary,
  lineHeight: 1.2
}));

const DownloadButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  display: 'flex',
  alignItems: 'center',
  color: isOwn ? 'rgba(255, 255, 255, 0.6)' : theme.palette.text.secondary,
  cursor: 'pointer',
  padding: 2,
  '&:hover': {
    color: isOwn ? '#ffffff' : theme.palette.text.primary
  }
}));

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

const FileAttachment = ({ file, isOwn = false }) => {

  const handleDownload = async () => {
    if (!file?.url) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(file.url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Ошибка скачивания:', error);
      window.open(file.url, '_blank');
    }
  };

  const handleContainerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDownload();
  };

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDownload();
  };

  if (!file) return null;

  return (
    <AttachmentContainer onClick={handleContainerClick}>
      {/* Иконка файла - всегда белая для своих, серая для чужих */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {getFileIcon(file.extension, isOwn)}
      </Box>

      {/* Информация о файле */}
      <FileInfo>
        <Tooltip title={file.name} placement="top">
          <FileName isOwn={isOwn} variant="body2">
            {file.name}
          </FileName>
        </Tooltip>
        <FileSize isOwn={isOwn} variant="caption">
          {formatFileSize(file.size)}
        </FileSize>
      </FileInfo>

      {/* Кнопка скачивания - без рамки и фона */}
      <DownloadButton
        isOwn={isOwn}
        onClick={handleButtonClick}
      >
        <DownloadIcon sx={{ fontSize: 16 }} />
      </DownloadButton>
    </AttachmentContainer>
  );
};

export default FileAttachment;