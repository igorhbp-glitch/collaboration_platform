// frontend/src/pages/NotificationsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Markunread as MarkUnreadIcon,
  MarkChatRead as MarkReadIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { notificationsAPI } from '../services/notificationsAPI';
import NotificationCard from '../components/Notifications/NotificationCard';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const PageHeader = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    minHeight: 48,
    transition: 'all 0.2s'
  },
  '& .Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 700
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: theme.spacing(1.5),
    backgroundColor: theme.palette.primary.main
  }
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(8),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  borderRadius: theme.spacing(3)
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const NotificationsPage = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNotifications = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const params = {
        page: reset ? 1 : page,
        page_size: 20,
        ...(tabValue === 1 && { is_read: false }),
        ...(tabValue === 2 && { is_read: true })
      };

      const data = await notificationsAPI.getAll(params);

      if (reset) {
        setNotifications(data.results || []);
      } else {
        setNotifications(prev => [...prev, ...(data.results || [])]);
      }

      setHasMore(data.next !== null);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить уведомления');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, tabValue]);

  useEffect(() => {
    loadNotifications(true);
  }, [tabValue]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      loadNotifications();
    }
  }, [page]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('Ошибка при отметке:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Ошибка при отметке всех:', err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await notificationsAPI.archive(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Ошибка при архивации:', err);
    }
  };

  const handleNotificationAction = (url) => {
    window.location.href = url;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <PageHeader elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <NotificationsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="700">
            Уведомления
          </Typography>
          {unreadCount > 0 && (
            <Paper
              sx={{
                ml: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 5,
                bgcolor: 'error.main',
                color: 'white'
              }}
            >
              <Typography variant="body2" fontWeight="600">
                {unreadCount} новых
              </Typography>
            </Paper>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {unreadCount > 0 && (
            <Tooltip title="Отметить все как прочитанные">
              <Button
                variant="outlined"
                startIcon={<MarkReadIcon />}
                onClick={handleMarkAllAsRead}
                sx={{ borderRadius: 5 }}
              >
                Прочитать все
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Обновить">
            <IconButton
              onClick={() => loadNotifications(true)}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </PageHeader>

      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <StyledTabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Все" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Непрочитанные</span>
                {unreadCount > 0 && (
                  <Paper
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 3,
                      bgcolor: 'error.main',
                      color: 'white'
                    }}
                  >
                    <Typography variant="caption" fontWeight="600">
                      {unreadCount}
                    </Typography>
                  </Paper>
                )}
              </Box>
            }
          />
          <Tab label="Прочитанные" />
        </StyledTabs>
        <Divider />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
          <Button color="inherit" size="small" onClick={() => loadNotifications(true)} sx={{ ml: 2 }}>
            Повторить
          </Button>
        </Alert>
      )}

      {loading && notifications.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : notifications.length > 0 ? (
        <Box>
          {notifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkAsRead}
              onArchive={handleArchive}
              onAction={handleNotificationAction}
            />
          ))}

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loadingMore}
                sx={{ borderRadius: 5 }}
              >
                {loadingMore ? <CircularProgress size={24} /> : 'Загрузить ещё'}
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        <EmptyState>
          <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            У вас пока нет уведомлений
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь будут появляться уведомления о приглашениях, заявках и задачах
          </Typography>
        </EmptyState>
      )}
    </Container>
  );
};

export default NotificationsPage;