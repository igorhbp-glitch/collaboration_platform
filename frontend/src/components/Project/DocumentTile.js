// frontend/src/components/Project/DocumentTile.js - С ПОДДЕРЖКОЙ РЕЖИМА ТОЛЬКО ДЛЯ ПРОСМОТРА
import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PresentationIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Стилизованная плитка документа
const TileContainer = styled(Box)(({ theme, isviewonly }) => ({
  width: '120px',
  height: '120px',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  cursor: isviewonly === 'true' ? 'default' : 'pointer',
  transition: 'all 0.2s',
  borderColor: theme.palette.divider,
  position: 'relative',
  opacity: isviewonly === 'true' ? 0.9 : 1,
  '&:hover': {
    transform: isviewonly === 'true' ? 'none' : 'translateY(-2px)',
    boxShadow: isviewonly === 'true' ? theme.shadows[1] : theme.shadows[1],
    borderColor: isviewonly === 'true' ? theme.palette.divider : theme.palette.primary.main,
    '& .document-actions': {
      opacity: 1
    }
  }
}));

const DocumentTile = ({ document, onDownload, onDelete, onShare, isViewOnly = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    if (isViewOnly) return; // 🔥 Блокируем меню в режиме просмотра
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleDownload = (event) => {
    event.stopPropagation();
    handleMenuClose();
    if (onDownload) onDownload(document);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    handleMenuClose();
    if (onDelete) onDelete(document);
  };

  const handleShare = (event) => {
    event.stopPropagation();
    handleMenuClose();
    if (onShare) onShare(document);
  };

  // Клик по плитке - скачивание (если не view only)
  const handleTileClick = () => {
    if (!isViewOnly && onDownload) {
      onDownload(document);
    }
  };

  // 🔥 ПОЛУЧАЕМ РАСШИРЕНИЕ БЕЗ ТОЧКИ
  const getExtension = () => {
    if (document.extension) {
      return document.extension.toLowerCase().replace('.', '');
    }
    if (document.name) {
      const parts = document.name.split('.');
      if (parts.length > 1) {
        return parts.pop().toLowerCase();
      }
    }
    return '';
  };

  const ext = getExtension();

  // Логируем для отладки
  console.log('🎨 DocumentTile:', {
    name: document.name,
    extension: document.extension,
    cleanExt: ext,
    size: document.size,
    isViewOnly
  });

  // 🔥 ОПРЕДЕЛЯЕМ ИКОНКУ ПО РАСШИРЕНИЮ
  const getFileIcon = () => {
    // Изображения
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return <ImageIcon sx={{ fontSize: 48, color: '#4caf50' }} />;
    }

    // PDF
    if (ext === 'pdf') {
      return <PdfIcon sx={{ fontSize: 48, color: '#f44336' }} />;
    }

    // Документы Word
    if (['doc', 'docx'].includes(ext)) {
      return <DocIcon sx={{ fontSize: 48, color: '#2196f3' }} />;
    }

    // Таблицы Excel
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <ExcelIcon sx={{ fontSize: 48, color: '#4caf50' }} />;
    }

    // Презентации
    if (['ppt', 'pptx'].includes(ext)) {
      return <PresentationIcon sx={{ fontSize: 48, color: '#ff9800' }} />;
    }

    // Архивы
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <ArchiveIcon sx={{ fontSize: 48, color: '#795548' }} />;
    }

    // Текстовые файлы
    if (['txt', 'md', 'rtf'].includes(ext)) {
      return <DescriptionIcon sx={{ fontSize: 48, color: '#607d8b' }} />;
    }

    // Код
    if (['py', 'js', 'html', 'css', 'json', 'xml'].includes(ext)) {
      return <CodeIcon sx={{ fontSize: 48, color: '#9c27b0' }} />;
    }

    // По умолчанию
    console.log('⚠️ Неизвестное расширение:', ext);
    return <FileIcon sx={{ fontSize: 48, color: '#757575' }} />;
  };

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Обрезаем длинное имя файла
  const getDisplayName = (name) => {
    if (!name) return 'Без названия';
    if (name.length > 15) {
      const ext = name.split('.').pop();
      const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
      return nameWithoutExt.substring(0, 10) + '...' + (ext ? '.' + ext : '');
    }
    return name;
  };

  return (
    <Tooltip title={document.name} arrow placement="top">
      <TileContainer onClick={handleTileClick} isviewonly={isViewOnly.toString()}>
        {/* Иконка файла */}
        <Box sx={{ mb: 1 }}>
          {getFileIcon()}
        </Box>

        {/* Название файла */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {getDisplayName(document.name)}
        </Typography>

        {/* Размер файла */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.6rem',
            mt: 0.5
          }}
        >
          {formatFileSize(document.size)}
        </Typography>

        {/* 🔥 ИНДИКАТОР РЕЖИМА ПРОСМОТРА */}
        {isViewOnly && (
          <Tooltip title="Только просмотр">
            <VisibilityOffIcon
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                fontSize: 14,
                color: 'text.disabled',
                opacity: 0.6
              }}
            />
          </Tooltip>
        )}

        {/* Кнопка меню - скрыта в режиме просмотра */}
        {!isViewOnly && (
          <Box
            className="document-actions"
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              opacity: 0,
              transition: 'opacity 0.2s'
            }}
          >
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                '&:hover': { backgroundColor: 'white' }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Меню действий */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            Скачать
          </MenuItem>
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            Поделиться
          </MenuItem>
          {onDelete && (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              Удалить
            </MenuItem>
          )}
        </Menu>
      </TileContainer>
    </Tooltip>
  );
};

export default DocumentTile;