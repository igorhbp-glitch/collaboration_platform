// src/components/Layout/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import MailIcon from '@mui/icons-material/Mail';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import FolderIcon from '@mui/icons-material/Folder';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import NotificationsIcon from '@mui/icons-material/Notifications'; // 🔥 НОВАЯ ИКОНКА
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

import logo from '../../assets/logo.svg';

import { useAuth } from '../../contexts/AuthContext';
import { invitationsApi, authAPI } from '../../services/api';
import { notificationsAPI } from '../../services/notificationsAPI';// 🔥 ДОБАВИЛИ notificationsAPI

// 🔥 СТИЛИЗОВАННАЯ КНОПКА ДЛЯ МЕНЮ
const MenuButton = styled(Button)(({ theme }) => ({
  fontFamily: '"Noto Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  fontWeight: 300,
  fontSize: '1.1rem',
  borderRadius: '10px',
  textTransform: 'none',
  color: 'inherit',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.1)',
  }
}));

// 🔥 СТИЛИ ДЛЯ УВЕДОМЛЕНИЙ
const NotificationMenuItem = styled(MenuItem)(({ theme, isread }) => ({
  padding: theme.spacing(2, 2),
  backgroundColor: isread === 'false'
    ? alpha(theme.palette.primary.main, 0.02)
    : 'transparent',
  borderBottom: `1px solid ${theme.palette.divider}`,
  minWidth: 320,
  maxWidth: 360,
  whiteSpace: 'normal',
  '&:hover': {
    backgroundColor: isread === 'false'
      ? alpha(theme.palette.primary.main, 0.08)
      : theme.palette.action.hover
  }
}));

const NotificationIcon = styled(Box)(({ theme, type }) => ({
  width: 36,
  height: 36,
  borderRadius: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1.5),
  backgroundColor: (() => {
    if (type?.includes('invitation')) return alpha('#ff9800', 0.1);
    if (type?.includes('project')) return alpha('#4caf50', 0.1);
    if (type?.includes('task')) return alpha('#2196f3', 0.1);
    if (type?.includes('event')) return alpha('#9c27b0', 0.1);
    return alpha('#757575', 0.1);
  })(),
  color: (() => {
    if (type?.includes('invitation')) return '#ff9800';
    if (type?.includes('project')) return '#4caf50';
    if (type?.includes('task')) return '#2196f3';
    if (type?.includes('event')) return '#9c27b0';
    return '#757575';
  })(),
}));

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null); // 🔥 НОВОЕ
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 🔥 НОВЫЕ СОСТОЯНИЯ ДЛЯ УВЕДОМЛЕНИЙ
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Загружаем актуальные данные при монтировании и когда меняется user
  useEffect(() => {
    if (user) {
      loadCurrentUser();
      loadNotifications(); // 🔥 загружаем уведомления
    } else {
      setCurrentUser(null);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // 🔥 ЗАГРУЗКА УВЕДОМЛЕНИЙ
  const loadNotifications = async () => {
    if (!user) return;

    try {
      const feed = await notificationsAPI.getFeed();
      setNotifications(feed.notifications || []);
      setUnreadCount(feed.unread_count || 0);
    } catch (error) {
      console.error('❌ Ошибка загрузки уведомлений:', error);
    }
  };

  // 🔥 ПЕРИОДИЧЕСКОЕ ОБНОВЛЕНИЕ УВЕДОМЛЕНИЙ
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      notificationsAPI.getUnreadCount()
        .then(data => setUnreadCount(data.unread_count || 0))
        .catch(err => console.error('Ошибка обновления счётчика:', err));
    }, 30000); // каждые 30 секунд

    return () => clearInterval(interval);
  }, [user]);

  const loadCurrentUser = async () => {
    try {
      const userData = await authAPI.getProfile();
      console.log('📥 Header: загружен актуальный профиль', userData);
      setCurrentUser(userData);
    } catch (err) {
      console.error('❌ Ошибка загрузки профиля в Header:', err);
    }
  };

  const fetchPendingInvitations = async () => {
    if (!user) return;

    setLoadingInvitations(true);
    try {
      const response = await invitationsApi.getReceived();
      const receivedInvitations = response.data || [];

      const pendingCount = receivedInvitations.filter(inv => inv.status === 'pending').length;

      setPendingInvitationsCount(pendingCount);
    } catch (error) {
      console.error('Ошибка загрузки приглашений для хедера:', error);
      setPendingInvitationsCount(0);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingInvitations();

      const intervalId = setInterval(fetchPendingInvitations, 30000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  // 🔥 ОБРАБОТЧИКИ ДЛЯ УВЕДОМЛЕНИЙ
  const handleNotificationsOpen = async (event) => {
    setNotificationsAnchor(event.currentTarget);
    // Обновляем ленту при открытии
    await loadNotifications();
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleNotificationClick = (notification) => {
  handleNotificationsClose();

  // Отмечаем как прочитанное
  if (!notification.is_read) {
    notificationsAPI.markAsRead(notification.id).catch(console.error);
  }

  // Переходим по ссылке
  if (notification.action_url) {
    navigate(notification.action_url);
  }
};

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Ошибка при отметке всех:', error);
    }
  };

  const handleLogout = async () => {
    if (mobileMenuAnchor) handleMobileMenuClose();
    if (profileMenuAnchor) handleProfileMenuClose();
    if (notificationsAnchor) handleNotificationsClose();

    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      navigate('/login');
    }
  };

  const handleRefreshInvitations = () => {
    fetchPendingInvitations();
  };

  const getInitials = () => {
    const userData = currentUser || user;
    if (!userData) return 'U';

    if (userData.first_name && userData.last_name) {
      return `${userData.first_name[0]}${userData.last_name[0]}`.toUpperCase();
    }
    if (userData.first_name && userData.first_name[0]) {
      return userData.first_name[0].toUpperCase();
    }
    if (userData.email && userData.email[0]) {
      return userData.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    const userData = currentUser || user;
    if (!userData) return 'Пользователь';

    if (userData.first_name && userData.last_name) {
      return `${userData.first_name} ${userData.last_name}`;
    }
    if (userData.first_name) {
      return userData.first_name;
    }
    if (userData.email && typeof userData.email === 'string') {
      return userData.email.split('@')[0];
    }
    return 'Пользователь';
  };

  const getUserEmail = () => {
    const userData = currentUser || user;
    return userData?.email || 'Email не указан';
  };

  const getAvatar = () => {
    const userData = currentUser || user;
    return userData?.avatar || null;
  };

  // 🔥 Функция для получения иконки уведомления по типу
  const getNotificationIcon = (type) => {
    if (type?.includes('invitation')) return <MailIcon fontSize="small" />;
    if (type?.includes('project')) return <FolderIcon fontSize="small" />;
    if (type?.includes('task')) return <CheckCircleIcon fontSize="small" />;
    if (type?.includes('event')) return <EventIcon fontSize="small" />;
    return <InfoIcon fontSize="small" />;
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: '#3C6E71',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to={user ? "/dashboard" : "/"}
          sx={{
            flexGrow: 1,
            ml: 7,
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'flex-end',
            fontSize: 32,
            fontWeight: 900,
            fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
            textShadow: 'none'
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Логотип"
            sx={{
              height: 40,
              width: 'auto',
              mr: 1.5,
              mb: 1.5,
              mt: 1,
              display: 'block',
              filter: 'brightness(0) invert(1)'
            }}
          />
          ФИНКОЛЛАБ
        </Typography>

        {user ? (
          <>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <MenuButton
                component={Link}
                to="/dashboard"
                startIcon={<HomeIcon />}
              >
                ГЛАВНАЯ
              </MenuButton>

              <MenuButton
                component={Link}
                to="/projects"
                startIcon={<FolderIcon />}
              >
                ПРОЕКТЫ
              </MenuButton>

              <MenuButton
                component={Link}
                to="/events"
                startIcon={<EventIcon />}
              >
                МЕРОПРИЯТИЯ
              </MenuButton>

              <MenuButton
                component={Link}
                to="/recommendations"
                startIcon={<GroupsIcon />}
              >
                КОЛЛЕГИ
              </MenuButton>

              {/* 🔥 ИКОНКА УВЕДОМЛЕНИЙ */}
              <Tooltip title="Уведомления">
                <IconButton
                  onClick={handleNotificationsOpen}
                  sx={{
                    p: 1,
                    ml: 1,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    max={99}
                  >
                    {unreadCount > 0 ? (
                      <NotificationsActiveIcon />
                    ) : (
                      <NotificationsIcon />
                    )}
                  </Badge>
                </IconButton>
              </Tooltip>

              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  p: 0.5,
                  ml: 1,
                  border: '2px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.8)'
                  }
                }}
              >
                <Avatar
                  src={getAvatar()}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.light',
                    fontSize: '0.9rem',
                    objectFit: 'cover'
                  }}
                >
                  {!getAvatar() && getInitials()}
                </Avatar>
              </IconButton>

              {/* 🔥 МЕНЮ УВЕДОМЛЕНИЙ */}
              <Menu
                anchorEl={notificationsAnchor}
                open={Boolean(notificationsAnchor)}
                onClose={handleNotificationsClose}
                PaperProps={{
                  sx: {
                    width: 380,
                    maxHeight: 480,
                    mt: 1.5,
                    borderRadius: 3,
                    overflow: 'hidden'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="600">
                    Уведомления
                  </Typography>
                  {unreadCount > 0 && (
                    <Button
                      size="small"
                      onClick={handleMarkAllAsRead}
                      sx={{ textTransform: 'none', borderRadius: 5 }}
                    >
                      Прочитать все
                    </Button>
                  )}
                </Box>
                <Divider />

                {loadingNotifications ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : notifications.length > 0 ? (
                  <>
                    {notifications.map((notification) => (
                      <NotificationMenuItem
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        isread={notification.is_read ? 'true' : 'false'}
                      >
                        <NotificationIcon type={notification.type}>
                          {getNotificationIcon(notification.type)}
                        </NotificationIcon>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={notification.is_read ? 400 : 600}
                            sx={{ mb: 0.5 }}
                          >
                            {notification.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {notification.time_ago}
                          </Typography>
                        </Box>
                        {!notification.is_read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              ml: 1
                            }}
                          />
                        )}
                      </NotificationMenuItem>
                    ))}
                    <Divider />
                    <MenuItem
                      component={Link}
                      to="/notifications"
                      onClick={handleNotificationsClose}
                      sx={{
                        py: 1.5,
                        justifyContent: 'center',
                        color: 'primary.main',
                        fontWeight: 500
                      }}
                    >
                      Все уведомления
                    </MenuItem>
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                    <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      У вас пока нет уведомлений
                    </Typography>
                  </Box>
                )}
              </Menu>

              {/* Меню профиля */}
              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}
                PaperProps={{
                  sx: {
                    width: 250,
                    mt: 1.5,
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem sx={{ py: 1.5, cursor: 'default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={getAvatar()}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'primary.light',
                        fontSize: '1.2rem',
                        objectFit: 'cover'
                      }}
                    >
                      {!getAvatar() && getInitials()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {getUserDisplayName()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getUserEmail()}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <Divider />

                <MenuItem
                  component={Link}
                  to="/profile"
                  onClick={handleProfileMenuClose}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Мой профиль" />
                </MenuItem>

                <MenuItem
                  component={Link}
                  to="/my-invitations"
                  onClick={() => {
                    handleProfileMenuClose();
                    handleRefreshInvitations();
                  }}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon>
                    <Badge
                      badgeContent={loadingInvitations ? null : pendingInvitationsCount}
                      color="error"
                      max={9}
                      invisible={loadingInvitations || pendingInvitationsCount === 0}
                    >
                      <MailIcon fontSize="small" />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary="Приглашения" />
                  {pendingInvitationsCount > 0 && (
                    <Typography variant="caption" color="error">
                      +{pendingInvitationsCount}
                    </Typography>
                  )}
                </MenuItem>

                <MenuItem
                  component={Link}
                  to="/questionnaire/3"
                  state={{ from: { pathname: location.pathname } }}
                  onClick={handleProfileMenuClose}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon>
                    <AssessmentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Пройти анкету" />
                </MenuItem>

                <Divider />

                <MenuItem
                  component={Link}
                  to="/settings"
                  onClick={handleProfileMenuClose}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Настройки" />
                </MenuItem>

                <MenuItem
                  onClick={handleLogout}
                  sx={{ py: 1.5 }}
                >
                  <ListItemIcon>
                    <ExitToAppIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Выйти" />
                </MenuItem>
              </Menu>
            </Box>

            {/* Мобильное меню (без изменений) */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                onClick={handleMobileMenuOpen}
                size="large"
              >
                <MenuIcon />
              </IconButton>
            </Box>

            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
              PaperProps={{
                sx: {
                  width: 250,
                },
              }}
            >
              {/* ... мобильное меню (без изменений) ... */}
              <MenuItem sx={{ py: 2, cursor: 'default', backgroundColor: 'primary.light', color: 'white' }}>
                <Avatar
                  src={getAvatar()}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'white',
                    color: 'primary.main',
                    mr: 2,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    objectFit: 'cover'
                  }}
                >
                  {!getAvatar() && getInitials()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {getUserDisplayName()}
                  </Typography>
                  <Typography variant="caption">
                    {getUserEmail()}
                  </Typography>
                </Box>
              </MenuItem>

              <MenuItem
                component={Link}
                to="/dashboard"
                onClick={handleMobileMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Главная" />
              </MenuItem>

              <MenuItem
                component={Link}
                to="/projects"
                onClick={handleMobileMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <FolderIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Проекты" />
              </MenuItem>

              <MenuItem
                component={Link}
                to="/events"
                onClick={handleMobileMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <EventIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Мероприятия" />
              </MenuItem>

              <MenuItem
                component={Link}
                to="/recommendations"
                onClick={handleMobileMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <GroupsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Коллеги" />
              </MenuItem>

              <Divider />

              <MenuItem
                component={Link}
                to="/profile"
                onClick={handleMobileMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Мой профиль" />
              </MenuItem>

              <MenuItem
                component={Link}
                to="/my-invitations"
                onClick={() => {
                  handleMobileMenuClose();
                  handleRefreshInvitations();
                }}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <Badge
                    badgeContent={loadingInvitations ? null : pendingInvitationsCount}
                    color="error"
                    max={9}
                    invisible={loadingInvitations || pendingInvitationsCount === 0}
                  >
                    <MailIcon fontSize="small" />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Приглашения" />
              </MenuItem>

              <MenuItem
                component={Link}
                to="/questionnaire/3"
                state={{ from: { pathname: location.pathname } }}
                onClick={handleMobileMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <AssessmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Пройти анкету" />
              </MenuItem>

              <MenuItem
                component={Link}
                to="/settings"
                onClick={handleMobileMenuClose}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Настройки" />
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={handleLogout}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Выйти" />
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              component={Link}
              to="/login"
            >
              Войти
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/register"
              variant="outlined"
              sx={{ borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Регистрация
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;