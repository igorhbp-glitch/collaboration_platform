// frontend/src/components/Project/TaskCommentsChat.js - УПРОЩЕННАЯ ВЕРСИЯ

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
  Forum as ForumIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { commentsAPI } from '../../services/commentsAPI';
import FileUpload from './FileUpload';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';

// ============================================================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================================================

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
  width: '100%'
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

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

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
// ФУНКЦИИ ГРУППИРОВКИ КОММЕНТАРИЕВ
// ============================================================================

const groupComments = (comments, currentUserId, timeThreshold = 10 * 60 * 1000) => {
  if (!comments.length) return [];

  const groups = [];
  let currentGroup = {
    author_id: comments[0].author_id,
    author_name: comments[0].author_name,
    author_avatar: comments[0].author_avatar,
    isOwn: comments[0].author_id === currentUserId,
    messages: [comments[0]],
    startTime: new Date(comments[0].created_at).getTime()
  };

  for (let i = 1; i < comments.length; i++) {
    const currentComment = comments[i];
    const prevComment = comments[i - 1];

    const currentTime = new Date(currentComment.created_at).getTime();
    const prevTime = new Date(prevComment.created_at).getTime();
    const timeDiff = currentTime - prevTime;

    if (currentComment.author_id !== currentGroup.author_id || timeDiff > timeThreshold) {
      groups.push(currentGroup);
      currentGroup = {
        author_id: currentComment.author_id,
        author_name: currentComment.author_name,
        author_avatar: currentComment.author_avatar,
        isOwn: currentComment.author_id === currentUserId,
        messages: [currentComment],
        startTime: currentTime
      };
    } else {
      currentGroup.messages.push(currentComment);
    }
  }

  groups.push(currentGroup);
  return groups;
};

const groupCommentsByDate = (comments) => {
  const groups = {};
  comments.forEach(comment => {
    const date = formatDate(comment.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(comment);
  });
  return groups;
};

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

const TaskCommentsChat = ({ taskId }) => {
  const theme = useTheme();
  const { user } = useAuth();

  // Состояния
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [contextComment, setContextComment] = useState(null);
  const [expandedAttachments, setExpandedAttachments] = useState({});

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Загрузка комментариев
  const loadComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await commentsAPI.getComments(taskId);
      const sortedComments = (data || []).sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );
      setComments(sortedComments);
    } catch (err) {
      console.error('❌ Ошибка загрузки комментариев:', err);
      setError('Не удалось загрузить комментарии');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при монтировании
  useEffect(() => {
    if (taskId) {
      loadComments();
    }
  }, [taskId]);

  // Скролл вниз при новых комментариях
  useEffect(() => {
    if (comments.length > 0 && !loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, loading]);

  // Отправка комментария
  const handleSendComment = async () => {
    if (!newComment.trim() && attachments.length === 0) {
      setError('Введите комментарий или прикрепите файл');
      return;
    }

    setSending(true);
    setError(null);

    try {
      let response;

      if (attachments.length > 0) {
        const formData = new FormData();
        formData.append('text', newComment.trim());

        attachments.forEach((file, index) => {
          formData.append(`attachments_${index}`, file);
        });

        if (replyTo) {
          formData.append('parent_message', replyTo.id);
        }

        response = await commentsAPI.createComment(taskId, formData);
      } else {
        const commentData = {
          text: newComment.trim()
        };

        if (replyTo) {
          commentData.parent_message = replyTo.id;
        }

        response = await commentsAPI.createComment(taskId, commentData);
      }

      setComments(prev => [...prev, response]);

      setNewComment('');
      setAttachments([]);
      setShowFileUpload(false);
      setReplyTo(null);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);

    } catch (err) {
      console.error('❌ Ошибка отправки комментария:', err);
      setError(err.message || 'Не удалось отправить комментарий');
    } finally {
      setSending(false);
    }
  };

  // Управление комментариями
  const handleCommentClick = (event, comment) => {
    event.stopPropagation();
    setContextComment(comment);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setContextComment(null);
  };

  const handleReplyToComment = () => {
    if (contextComment) {
      setReplyTo({
        id: contextComment.id,
        text: contextComment.text,
        author_name: contextComment.author_name
      });
      handleMenuClose();
      inputRef.current?.focus();
    }
  };

  const handleEditComment = () => {
    if (contextComment) {
      handleMenuClose();
    }
  };

  const handleDeleteComment = async () => {
    if (contextComment) {
      try {
        await commentsAPI.deleteComment(taskId, contextComment.id);
        setComments(prev => prev.filter(c => c.id !== contextComment.id));
      } catch (err) {
        console.error('❌ Ошибка удаления:', err);
        setError('Не удалось удалить комментарий');
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

  const toggleAttachments = (commentId) => {
    setExpandedAttachments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const canModifyComment = (comment) => {
    if (!comment || !user) return false;
    return comment.author_id === user.id;
  };

  // Группировка комментариев
  const dateGroups = groupCommentsByDate(comments);
  const groupedComments = {};

  Object.entries(dateGroups).forEach(([date, dateComments]) => {
    groupedComments[date] = groupComments(dateComments, user?.id);
  });

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      bgcolor: 'transparent'
    }}>
      {/* Индикатор ответа */}
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

      {/* Комментарии */}
      <MessagesContainer ref={messagesContainerRef}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ m: 2, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadComments}>
                Повторить
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {!loading && comments.length === 0 ? (
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
              Нет комментариев
            </Typography>
            <Typography variant="body2" align="center" sx={{ maxWidth: 400 }}>
              Будьте первым, кто оставит комментарий к этой задаче
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedComments).map(([date, groups]) => (
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
                      {group.messages.map((comment, commentIdx) => (
                        <Box
                          key={comment.id}
                          onClick={(e) => handleCommentClick(e, comment)}
                          sx={{
                            cursor: 'pointer',
                            width: '100%'
                          }}
                        >
                          <MessageBubble
                            message={comment}
                            isOwn={group.isOwn}
                            isLastInGroup={commentIdx === group.messages.length - 1}
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

      {/* Поле ввода */}
      <ChatInput
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        onSend={handleSendComment}
        onAttach={() => setShowFileUpload(true)}
        disabled={sending}
        sending={sending}
        inputRef={inputRef}
        placeholder="Напишите комментарий..."
      />

      {/* Индикатор прикрепленных файлов */}
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
            Прикрепите файлы к комментарию
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

      {/* Контекстное меню */}
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
        {contextComment?.author_id === user?.id && (
          <MenuItem onClick={handleEditComment} sx={{ borderRadius: 1, mx: 0.5, py: 0.8 }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <Typography variant="body2">Редактировать</Typography>
          </MenuItem>
        )}

        <MenuItem onClick={handleReplyToComment} sx={{ borderRadius: 1, mx: 0.5, py: 0.8 }}>
          <ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>
          <Typography variant="body2">Ответить</Typography>
        </MenuItem>

        {contextComment?.author_id === user?.id && (
          <Divider sx={{ my: 0.5 }} />
        )}

        {contextComment && contextComment.author_id === user?.id && (
          <MenuItem onClick={handleDeleteComment} sx={{ color: 'error.main', borderRadius: 1, mx: 0.5, py: 0.8 }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <Typography variant="body2">Удалить</Typography>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default TaskCommentsChat;