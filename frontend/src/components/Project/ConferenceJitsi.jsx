// frontend/src/components/Project/ConferenceJitsi.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import DeleteIcon from '@mui/icons-material/Delete';
import { projectsAPI } from '../../services/api';

const ConferenceJitsi = ({
  open,
  onClose,
  projectId,
  projectTitle,
  onConferenceCreated,
  existingLink
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conferenceLink, setConferenceLink] = useState(existingLink || null);
  const [copied, setCopied] = useState(false);

  // Генерируем уникальное имя комнаты
  const generateRoomName = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `collab-${projectId}-${timestamp}-${random}`;
  };

  // Создание конференции
  const handleCreateConference = async () => {
    setLoading(true);
    setError(null);

    try {
      const roomName = generateRoomName();
      const jitsiLink = `https://meet.jit.si/${roomName}`;

      console.log('📞 Создание конференции Jitsi:', jitsiLink);

      // Сохраняем на бэкенде
      console.log('💾 Сохраняем ссылку на бэкенде...');
      const response = await projectsAPI.saveConferenceLink(projectId, jitsiLink);
      console.log('✅ Ответ от сервера:', response);

      setConferenceLink(jitsiLink);

      // Сообщаем родительскому компоненту
      if (onConferenceCreated) {
        onConferenceCreated(jitsiLink);
      }

      // Открываем в новой вкладке
      window.open(jitsiLink, '_blank');

      // 🔥 ЗАКРЫВАЕМ МОДАЛЬНОЕ ОКНО ПОСЛЕ СОЗДАНИЯ
      onClose();

    } catch (err) {
      console.error('❌ Ошибка:', err);
      setError(err.message || 'Не удалось создать конференцию');
    } finally {
      setLoading(false);
    }
  };

  // Удаление ссылки (когда конференция закончилась)
  const handleClearLink = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить ссылку на конференцию?')) {
      return;
    }

    setLoading(true);
    try {
      console.log('🗑️ Удаляем ссылку с бэкенда...');
      await projectsAPI.clearConferenceLink(projectId);
      console.log('✅ Ссылка удалена');

      setConferenceLink(null);
      if (onConferenceCreated) {
        onConferenceCreated(null); // передаём null, чтобы очистить ссылку
      }

      // После удаления тоже можно закрыть окно
      onClose();

    } catch (err) {
      console.error('❌ Ошибка удаления ссылки:', err);
      setError(err.message || 'Не удалось удалить ссылку');
    } finally {
      setLoading(false);
    }
  };

  // Копирование ссылки
  const handleCopyLink = () => {
    navigator.clipboard.writeText(conferenceLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">Видеоконференция</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!conferenceLink ? (
          // Этап 1: Создание конференции
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <VideoCallIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Создать видеоконференцию
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Конференция будет создана на Jitsi Meet. Ссылка сохранится в проекте.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VideoCallIcon />}
              onClick={handleCreateConference}
              disabled={loading}
              sx={{ mt: 2, px: 4, py: 1.5 }}
            >
              {loading ? 'Создание...' : 'Создать конференцию'}
            </Button>
          </Box>
        ) : (
          // Этап 2: Конференция создана
          <Box>
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              ✅ Конференция создана! Ссылка сохранена.
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ссылка для участников:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <TextField
                  fullWidth
                  value={conferenceLink}
                  variant="outlined"
                  size="small"
                  InputProps={{ readOnly: true }}
                />
                <Button
                  variant="contained"
                  onClick={handleCopyLink}
                  startIcon={<ContentCopyIcon />}
                  sx={{ minWidth: '120px' }}
                >
                  {copied ? 'Готово!' : 'Копировать'}
                </Button>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<VideoCallIcon />}
                onClick={() => window.open(conferenceLink, '_blank')}
              >
                Войти
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearLink}
                disabled={loading}
              >
                Удалить ссылку
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
              После завершения конференции можно удалить ссылку
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConferenceJitsi;