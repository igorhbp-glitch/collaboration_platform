// frontend/src/components/Project/MessageBubble.js - ОБНОВЛЕННАЯ ВЕРСИЯ

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  IconButton,
  Collapse,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

import FileAttachment from './FileAttachment';

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function getWordEnding(number, words) {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
}

const formatTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

// ============================================================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================================================

const BubbleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  marginBottom: theme.spacing(0.5)
}));

const Bubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  display: 'inline-block',
  maxWidth: '70%',
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(3),
  backgroundColor: isOwn
    ? theme.palette.primary.main
    : theme.palette.grey[100],
  color: isOwn
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
}));

const MessageRow = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  width: '100%'
}));

const MessageText = styled('span')(({ theme }) => ({
  fontSize: '0.95rem',
  lineHeight: 1.4,
  fontWeight: 400,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  flex: '1 1 auto'
}));

const MessageTime = styled('span', {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: isOwn
    ? 'rgba(255, 255, 255, 0.7)'
    : theme.palette.text.disabled,
  fontSize: '0.65rem',
  whiteSpace: 'nowrap',
  flexShrink: 0
}));

// 🔥 НОВЫЙ КОМПОНЕНТ: Контейнер для вложений
const AttachmentsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}));

// 🔥 НОВЫЙ КОМПОНЕНТ: Заголовок для свернутых вложений
const AttachmentsHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: theme.spacing(0.5, 0),
  color: isOwn
    ? 'rgba(255, 255, 255, 0.8)'
    : theme.palette.text.secondary,
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s',
  '&:hover': {
    color: isOwn ? 'white' : theme.palette.text.primary,
    backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.05)' : alpha(theme.palette.primary.main, 0.05)
  }
}));

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

const MessageBubble = ({
  message,
  isOwn,
  isLastInGroup,
  onAttachmentToggle,
  expandedAttachments,
  theme,
  onClick
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleAttachments = (e) => {
    e.stopPropagation();
    if (onAttachmentToggle) {
      onAttachmentToggle(message.id);
    } else {
      setExpanded(!expanded);
    }
  };

  const isExpanded = onAttachmentToggle
    ? expandedAttachments?.[message.id]
    : expanded;

  const hasAttachments = message.attachments && message.attachments.length > 0;
  const attachmentsCount = message.attachments?.length || 0;

  // Сообщение только с файлами (без текста)
  const isFileOnly = !message.text && hasAttachments;

  return (
    <BubbleContainer
      sx={{ justifyContent: isOwn ? 'flex-end' : 'flex-start' }}
      onClick={onClick}
    >
      <Bubble isOwn={isOwn}>
        {/* 🔥 ТЕКСТ СООБЩЕНИЯ (если есть) */}
        {message.text && (
          <MessageRow>
            <MessageText>
              {message.text}
            </MessageText>
            <MessageTime isOwn={isOwn}>
              {formatTime(message.created_at)}
              {isOwn && isLastInGroup && (
                <>
                  {message.read_by_count > 0 ? (
                    <Tooltip title={`Прочитано ${message.read_by_count} ${getWordEnding(message.read_by_count, ['участником', 'участниками', 'участниками'])}`}>
                      <DoneAllIcon sx={{ fontSize: '0.8rem' }} />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Отправлено">
                      <DoneIcon sx={{ fontSize: '0.8rem', opacity: 0.7 }} />
                    </Tooltip>
                  )}
                </>
              )}
            </MessageTime>
          </MessageRow>
        )}

        {/* 🔥 ВЛОЖЕНИЯ */}
        {hasAttachments && (
          <AttachmentsContainer>
            {/* Заголовок с количеством вложений (для сворачивания) */}
            {attachmentsCount > 1 && (
              <AttachmentsHeader
                isOwn={isOwn}
                onClick={handleToggleAttachments}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                  {isExpanded ? 'Скрыть' : 'Показать'} вложения ({attachmentsCount})
                </Typography>
                <IconButton
                  size="small"
                  sx={{
                    ml: 0.5,
                    p: 0.5,
                    color: 'inherit'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isExpanded ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
              </AttachmentsHeader>
            )}

            {/* Список вложений */}
            <Collapse in={attachmentsCount === 1 ? true : isExpanded}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                mt: attachmentsCount > 1 ? 1 : 0
              }}>
                {message.attachments.map((file, idx) => (
                  <FileAttachment
                    key={idx}
                    file={file}
                    isOwn={isOwn}
                  />
                ))}
              </Box>
            </Collapse>

            {/* Время для сообщений только с файлами */}
            {isFileOnly && (
              <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mt: 0.5
              }}>
                <MessageTime isOwn={isOwn}>
                  {formatTime(message.created_at)}
                  {isOwn && isLastInGroup && (
                    <>
                      {message.read_by_count > 0 ? (
                        <Tooltip title={`Прочитано ${message.read_by_count} ${getWordEnding(message.read_by_count, ['участником', 'участниками', 'участниками'])}`}>
                          <DoneAllIcon sx={{ fontSize: '0.8rem' }} />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Отправлено">
                          <DoneIcon sx={{ fontSize: '0.8rem', opacity: 0.7 }} />
                        </Tooltip>
                      )}
                    </>
                  )}
                </MessageTime>
              </Box>
            )}
          </AttachmentsContainer>
        )}

        {/* 🔥 Время для сообщений без вложений (уже есть в MessageRow) */}
      </Bubble>
    </BubbleContainer>
  );
};

export default MessageBubble;