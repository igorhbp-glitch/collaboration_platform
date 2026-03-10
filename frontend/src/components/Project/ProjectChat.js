// frontend/src/components/Project/ProjectChat.js - ОБНОВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  TextField,
  alpha,
  useTheme,
  Snackbar,
  Fade,
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
  Forum as ForumIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { chatAPI } from '../../services/chatAPI';
import FileUpload from './FileUpload';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';

// ============================================================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 800,
    minWidth: 600,
    height: '80vh',
    maxHeight: '800px',
    overflow: 'hidden',
    zIndex: 1300,
    background: `linear-gradient(
      180deg,
      ${alpha(theme.palette.grey[100], 0.95)} 0%,
      ${alpha(theme.palette.grey[100], 0.7)} 75%,
      ${alpha(theme.palette.grey[100], 0.65)} 80%,
      ${alpha(theme.palette.grey[100], 0.60)} 83%,
      ${alpha(theme.palette.grey[100], 0.4)} 86%,
      ${alpha(theme.palette.grey[100], 0.3)} 87%,
      ${alpha(theme.palette.primary.main, 0.1)} 89%,
      ${alpha(theme.palette.primary.main, 0.15)} 89%,
      ${alpha(theme.palette.primary.main, 0.2)} 91%,
      ${alpha(theme.palette.primary.main, 0.25)} 93%,
      ${alpha(theme.palette.primary.main, 0.3)} 95%,
      ${alpha(theme.palette.primary.main, 0.35)} 96%,
      ${alpha(theme.palette.primary.main, 0.4)} 97%,
      ${alpha(theme.palette.primary.main, 0.45)} 98%,
      ${alpha(theme.palette.primary.main, 0.5)} 99%,
      ${theme.palette.primary.main} 100%
    )`,
    boxShadow: theme.shadows[0]
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2, 3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'transparent',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[200],
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.grey[600],
    },
  },
}));

const MessageGroup = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  display: 'flex',
  marginBottom: theme.spacing(2),
  justifyContent: isOwn ? 'flex-end' : 'flex-start',
  width: '100%'
}));

const MessagesInGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  width: '100%',
  minWidth: '200px' // Минимальная ширина для коротких сообщений
}));

const MessageAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'isOwn'
})(({ theme, isOwn }) => ({
  width: 36,
  height: 36,
  flexShrink: 0,
  backgroundColor: theme.palette.primary.main,
  fontSize: '0.9rem',
  border: '2px solid white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  ...(isOwn && {
    marginLeft: theme.spacing(1.5)
  }),
  ...(!isOwn && {
    marginRight: theme.spacing(1.5)
  })
}));

const ReplyIndicator = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const DateDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  margin: theme.spacing(2, 0),
  '&::before, &::after': {
    content: '""',
    flex: 1,
    borderBottom: `1px solid ${theme.palette.divider}`,
    margin: 'auto'
  },
  '&::before': {
    marginRight: theme.spacing(2)
  },
  '&::after': {
    marginLeft: theme.spacing(2)
  }
}));

const NetworkStatusAlert = styled(Alert)(({ theme }) => ({
  margin: theme.spacing(2),
  borderRadius: theme.spacing(2),
  '& .MuiAlert-icon': {
    alignItems: 'center'
  }
}));

const LoadMoreIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
  color: theme.palette.text.secondary
}));

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

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return 'Сегодня';
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';

    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

// ============================================================================
// ФУНКЦИИ ГРУППИРОВКИ СООБЩЕНИЙ
// ============================================================================

const groupMessages = (messages, currentUserId, timeThreshold = 10 * 60 * 1000) => {
  if (!messages.length) return [];

  const groups = [];
  let currentGroup = {
    author_id: messages[0].author_id,
    author_name: messages[0].author_name,
    author_avatar: messages[0].author_avatar,
    isOwn: messages[0].author_id === currentUserId,
    messages: [messages[0]],
    startTime: new Date(messages[0].created_at).getTime()
  };

  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i];
    const prevMessage = messages[i - 1];

    const currentTime = new Date(currentMessage.created_at).getTime();
    const prevTime = new Date(prevMessage.created_at).getTime();
    const timeDiff = currentTime - prevTime;

    if (currentMessage.author_id !== currentGroup.author_id || timeDiff > timeThreshold) {
      groups.push(currentGroup);
      currentGroup = {
        author_id: currentMessage.author_id,
        author_name: currentMessage.author_name,
        author_avatar: currentMessage.author_avatar,
        isOwn: currentMessage.author_id === currentUserId,
        messages: [currentMessage],
        startTime: currentTime
      };
    } else {
      currentGroup.messages.push(currentMessage);
    }
  }

  groups.push(currentGroup);
  return groups;
};

const groupMessagesByDate = (messages) => {
  const groups = {};
  messages.forEach(message => {
    const date = formatDate(message.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
  });
  return groups;
};

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ ЧАТА
// ============================================================================

const ProjectChat = ({
  open,
  onClose,
  projectId,
  projectTitle,
  isMember,
  isOwner
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  // Состояния
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [contextMessage, setContextMessage] = useState(null);
  const [expandedAttachments, setExpandedAttachments] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [networkError, setNetworkError] = useState(null);
  const [pendingMessages, setPendingMessages] = useState([]);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // ========================================================================
  // 🔥 ОБНОВЛЕННЫЕ МЕТОДЫ ЗАГРУЗКИ
  // ========================================================================

  // Загрузка последних сообщений (при открытии чата)
  const loadLatestMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await chatAPI.getLatestMessages(projectId, pageSize);

      setMessages(data.messages || []);
      setTotalMessages(data.total_count || 0);
      setHasMore(data.has_next || false);
      setPage(1);

      // Скроллим к последним сообщениям
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);

    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);

      if (!navigator.onLine) {
        setNetworkError('Нет подключения к интернету. Невозможно загрузить сообщения.');
      } else {
        setError('Не удалось загрузить сообщения чата');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, pageSize]);

  // Загрузка более старых сообщений (при скролле вверх)
  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setLoadingMore(true);

    try {
      const data = await chatAPI.loadOlderMessages(projectId, oldestMessage.id, pageSize);

      if (data.messages && data.messages.length > 0) {
        // Добавляем старые сообщения в начало
        setMessages(prev => [...data.messages.reverse(), ...prev]);
        setHasMore(data.has_next || false);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки старых сообщений:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [projectId, pageSize, messages, loadingMore, hasMore]);

  // Загрузка при открытии
  useEffect(() => {
    if (open && projectId) {
      loadLatestMessages();
      loadUnreadCount();

      const interval = setInterval(loadUnreadCount, 15000);
      return () => clearInterval(interval);
    }
  }, [open, projectId, loadLatestMessages]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    if (messages.length > 0 && !loading && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;

      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, loading]);

  // Обработчик скролла
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loadingMore || !hasMore) return;

    const { scrollTop } = messagesContainerRef.current;

    if (scrollTop < 100 && hasMore && !loadingMore && !loading) {
      loadOlderMessages();
    }
  }, [loadingMore, hasMore, loading, loadOlderMessages]);

  // Добавление слушателя скролла
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Обработчики сети
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setNetworkError(null);

      if (pendingMessages.length > 0) {
        retryPendingMessages();
      }

      loadLatestMessages();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setNetworkError('Потеряно соединение с интернетом. Сообщения будут отправлены при восстановлении связи.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingMessages, loadLatestMessages]);

  // ========================================================================
  // 🔥 ОБНОВЛЕННАЯ ОТПРАВКА СООБЩЕНИЙ
  // ========================================================================

  const handleSendMessage = async () => {
  // 🔥 ИСПРАВЛЕНО: можно отправлять только файлы без текста
  if (!newMessage.trim() && attachments.length === 0) {
    setError('Введите сообщение или прикрепите файл');
    return;
  }

  if (!isMember && !isOwner) {
    setError('Только участники проекта могут отправлять сообщения');
    return;
  }

  setSending(true);
  setError(null);
  setNetworkError(null);

  try {
    let response;

    if (attachments.length > 0) {
      // Используем метод prepareFormData
      const formData = chatAPI.prepareFormData(newMessage, attachments, replyTo);
      response = await chatAPI.sendMessage(projectId, formData);
    } else {
      const messageData = {
        text: newMessage.trim()
      };
      if (replyTo) {
        messageData.parent_message = replyTo.id;
      }
      response = await chatAPI.sendMessage(projectId, messageData);
    }

    // Добавляем новое сообщение в конец списка
    setMessages(prev => [...prev, response]);
    setTotalMessages(prev => prev + 1);

    // Очищаем форму
    setNewMessage('');
    setAttachments([]);
    setShowFileUpload(false);
    setReplyTo(null);

    // Возвращаем фокус в поле ввода
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    // Скроллим к новому сообщению
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

  } catch (err) {
    console.error('❌ Ошибка отправки:', err);

    if (err.message?.includes('интернет') || !navigator.onLine) {
      setNetworkError('Нет подключения к интернету. Сообщение будет отправлено позже.');
      setPendingMessages(prev => [...prev, {
        text: newMessage,
        attachments,
        replyTo
      }]);
      setNewMessage('');
      setAttachments([]);
      setReplyTo(null);
    } else {
      setError(err.message || 'Не удалось отправить сообщение');
    }
  } finally {
    setSending(false);
  }
};

  // ========================================================================
  // ОСТАЛЬНЫЕ МЕТОДЫ (без изменений)
  // ========================================================================

  const retryPendingMessages = async () => {
    if (pendingMessages.length === 0) return;

    const messagesToRetry = [...pendingMessages];
    setPendingMessages([]);

    for (const msg of messagesToRetry) {
      try {
        let response;

        if (msg.attachments.length > 0) {
          const formData = chatAPI.prepareFormData(msg.text, msg.attachments, msg.replyTo);
          response = await chatAPI.sendMessage(projectId, formData);
        } else {
          const messageData = { text: msg.text };
          if (msg.replyTo) {
            messageData.parent_message = msg.replyTo.id;
          }
          response = await chatAPI.sendMessage(projectId, messageData);
        }

        setMessages(prev => [...prev, response]);
        setTotalMessages(prev => prev + 1);
      } catch (error) {
        console.error('❌ Не удалось отправить отложенное сообщение:', error);
        setPendingMessages(prev => [...prev, msg]);
      }
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await chatAPI.getUnreadCount(projectId);
      setUnreadCount(count);
    } catch (err) {
      console.warn('⚠️ Не удалось загрузить количество непрочитанных:', err);
    }
  };

  const handleMessageClick = (event, message) => {
    event.stopPropagation();
    setContextMessage(message);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setContextMessage(null);
  };

  const handleReplyToMessage = () => {
    if (contextMessage) {
      setReplyTo({
        id: contextMessage.id,
        text: contextMessage.text,
        author_name: contextMessage.author_name
      });
      handleMenuClose();
      inputRef.current?.focus();
    }
  };

  const handleDeleteMessage = async () => {
    if (contextMessage) {
      try {
        await chatAPI.deleteMessage(projectId, contextMessage.id);
        setMessages(prev => prev.map(msg =>
          msg.id === contextMessage.id
            ? { ...msg, text: '[Сообщение удалено]', attachments: [] }
            : msg
        ));
      } catch (err) {
        console.error('❌ Ошибка удаления:', err);
        setError('Не удалось удалить сообщение');
      }
      handleMenuClose();
    }
  };

  const handleFileAttached = (files) => {
    setAttachments(files);
    setShowFileUpload(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const toggleAttachments = (messageId) => {
    setExpandedAttachments(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const canModifyMessage = (message) => {
    if (!message || !user) return false;
    return message.author_id === user.id || isOwner;
  };

  // Группировка сообщений
  const dateGroups = groupMessagesByDate(messages);
  const groupedMessages = {};

  Object.entries(dateGroups).forEach(([date, dateMessages]) => {
    groupedMessages[date] = groupMessages(dateMessages, user?.id);
  });

  const pendingCount = pendingMessages.length;

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth={false} fullWidth={false}>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ForumIcon sx={{ fontSize: 24 }} />
          <Box>
            <Typography variant="h6" fontWeight="700">
              Чат проекта
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {projectTitle}
            </Typography>
          </Box>

          {totalMessages > 0 && (
            <Tooltip title={`Всего сообщений: ${totalMessages}`}>
              <Chip
                label={totalMessages}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  height: 20,
                  fontSize: '0.7rem'
                }}
              />
            </Tooltip>
          )}

          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} новых`}
              size="small"
              sx={{
                bgcolor: 'error.main',
                color: 'white',
                fontWeight: 600,
                height: 20,
                fontSize: '0.7rem'
              }}
            />
          )}

          {isOffline && (
            <Tooltip title="Нет подключения к интернету">
              <Chip
                icon={<WifiOffIcon sx={{ fontSize: 14 }} />}
                label="Оффлайн"
                size="small"
                sx={{
                  bgcolor: 'warning.main',
                  color: 'white',
                  fontWeight: 600,
                  height: 20,
                  fontSize: '0.7rem'
                }}
              />
            </Tooltip>
          )}

          {pendingCount > 0 && (
            <Tooltip title={`${pendingCount} сообщений ожидают отправки`}>
              <Chip
                label={pendingCount}
                size="small"
                sx={{
                  bgcolor: 'info.main',
                  color: 'white',
                  fontWeight: 600,
                  height: 20,
                  fontSize: '0.7rem',
                  minWidth: 20
                }}
              />
            </Tooltip>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            borderRadius: theme.spacing(1.5),
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'transparent'
      }}>
        {/* Уведомления */}
        {isOffline && (
          <NetworkStatusAlert
            severity="warning"
            icon={<WifiOffIcon />}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => window.location.reload()}
                startIcon={<RefreshIcon />}
              >
                Обновить
              </Button>
            }
          >
            Нет подключения к интернету. Сообщения будут сохранены и отправлены при восстановлении связи.
          </NetworkStatusAlert>
        )}

        {networkError && !isOffline && (
          <NetworkStatusAlert severity="error" onClose={() => setNetworkError(null)}>
            {networkError}
          </NetworkStatusAlert>
        )}

        {pendingCount > 0 && !isOffline && (
          <NetworkStatusAlert
            severity="info"
            icon={<WifiIcon />}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={retryPendingMessages}
              >
                Отправить сейчас
              </Button>
            }
          >
            {pendingCount} {getWordEnding(pendingCount, ['сообщение', 'сообщения', 'сообщений'])} ожидают отправки
          </NetworkStatusAlert>
        )}

        {replyTo && (
          <ReplyIndicator>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReplyIcon fontSize="small" color="primary" />
              <Typography variant="body2">
                <strong>{replyTo.author_name}</strong>: {replyTo.text?.substring(0, 50)}
                {replyTo.text?.length > 50 ? '...' : ''}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReplyTo(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </ReplyIndicator>
        )}

        <MessagesContainer ref={messagesContainerRef}>
          {/* Индикатор загрузки старых сообщений */}
          {loadingMore && (
            <LoadMoreIndicator>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="caption">Загрузка истории...</Typography>
            </LoadMoreIndicator>
          )}

          {/* Кнопка загрузки ещё */}
          {hasMore && !loadingMore && !loading && messages.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                size="small"
                startIcon={<ArrowUpwardIcon />}
                onClick={loadOlderMessages}
                variant="outlined"
                sx={{ borderRadius: 4, fontSize: '0.7rem' }}
              >
                Загрузить ещё
              </Button>
            </Box>
          )}

          {/* Индикатор начала переписки */}
          {!hasMore && messages.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                py: 1,
                mb: 2,
                color: 'text.disabled',
                borderBottom: '1px dashed',
                borderColor: 'divider'
              }}
            >
              ⏳ Начало переписки
            </Typography>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert
              severity="error"
              sx={{ m: 2, borderRadius: 2 }}
              action={
                <Button color="inherit" size="small" onClick={loadLatestMessages}>
                  Повторить
                </Button>
              }
            >
              {error}
            </Alert>
          ) : messages.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              p: 4
            }}>
              <ForumIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" fontWeight="300" gutterBottom>
                Добро пожаловать в чат!
              </Typography>
              <Typography variant="body2" align="center" sx={{ maxWidth: 400 }}>
                Здесь вы можете общаться с участниками проекта, обмениваться файлами и обсуждать задачи
              </Typography>
            </Box>
          ) : (
            // Сообщения
            Object.entries(groupedMessages).map(([date, groups]) => (
              <Box key={date}>
                <DateDivider>
                  <Chip
                    label={date}
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: 24,
                      borderRadius: 3
                    }}
                  />
                </DateDivider>

                {groups.map((group, groupIndex) => (
                  <MessageGroup key={`group-${groupIndex}`} isOwn={group.isOwn}>
                    {!group.isOwn && (
                      <MessageAvatar
                        src={group.author_avatar}
                        isOwn={group.isOwn}
                      >
                        {group.author_name?.[0] || 'U'}
                      </MessageAvatar>
                    )}

                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: group.isOwn ? 'flex-end' : 'flex-start',
                      maxWidth: '70%'
                    }}>
                      {!group.isOwn && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: '0.75rem',
                            mb: 0.5,
                            ml: 1
                          }}
                        >
                          {group.author_name}
                        </Typography>
                      )}

                      <MessagesInGroup>
                        {group.messages.map((message, messageIdx) => (
                          <Box
                            key={message.id}
                            onClick={(e) => handleMessageClick(e, message)}
                            sx={{
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            <MessageBubble
                              message={message}
                              isOwn={group.isOwn}
                              isLastInGroup={messageIdx === group.messages.length - 1}
                              onAttachmentToggle={toggleAttachments}
                              expandedAttachments={expandedAttachments}
                              theme={theme}
                            />
                          </Box>
                        ))}
                      </MessagesInGroup>
                    </Box>

                    {group.isOwn && (
                      <MessageAvatar
                        src={group.author_avatar}
                        isOwn={group.isOwn}
                      >
                        {group.author_name?.[0] || 'U'}
                      </MessageAvatar>
                    )}
                  </MessageGroup>
                ))}
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Строка ввода */}
        {(isMember || isOwner) ? (
          <ChatInput
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onSend={handleSendMessage}
            onAttach={() => setShowFileUpload(true)}
            disabled={sending || (isOffline && pendingCount > 5)}
            sending={sending}
            inputRef={inputRef}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              p: 2,
              textAlign: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            Только участники проекта могут отправлять сообщения
          </Typography>
        )}

        {attachments.length > 0 && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1,
              fontWeight: 500,
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'left',
              mx: 2
            }}
          >
            📎 Прикреплено файлов: {attachments.length}
          </Typography>
        )}
      </DialogContent>

      {/* Диалог загрузки файлов */}
      <Dialog
        open={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: theme.spacing(3),
            backgroundColor: theme.palette.grey[50],
            boxShadow: theme.shadows[0]
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3, fontWeight: 600, color: 'primary.main' }}>
          <Typography variant="h5" fontWeight="700">
            Загрузка файлов
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Прикрепите файлы к сообщению
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <FileUpload
            onFilesChange={handleFileAttached}
            disabled={sending}
            initialFiles={attachments}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setShowFileUpload(false)}
            variant="outlined"
            sx={{
              borderRadius: theme.spacing(3),
              textTransform: 'none',
              px: 4,
              borderWidth: '0.5px',
              '&:hover': { borderWidth: '0.5px' }
            }}
          >
            Готово
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 180, boxShadow: 3, mt: 1 }
        }}
      >
        <MenuItem onClick={handleReplyToMessage} sx={{ borderRadius: 1, mx: 0.5, py: 0.8 }}>
          <ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>
          <Typography variant="body2">Ответить</Typography>
        </MenuItem>

        {contextMessage && canModifyMessage(contextMessage) && (
          <MenuItem onClick={handleDeleteMessage} sx={{ color: 'error.main', borderRadius: 1, mx: 0.5, py: 0.8 }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <Typography variant="body2">Удалить</Typography>
          </MenuItem>
        )}
      </Menu>
    </StyledDialog>
  );
};

export default ProjectChat;