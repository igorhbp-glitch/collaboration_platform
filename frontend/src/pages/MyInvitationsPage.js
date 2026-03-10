// frontend/src/pages/MyInvitationsPage.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as AcceptedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { invitationsApi } from '../services/api';
import InvitationCard from '../components/Invitations/InvitationCard';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const PageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  paddingTop: 0,
  paddingBottom: theme.spacing(6),
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}));

// 🔥 ШАПКА В СТИЛЕ DASHBOARD
const AnimatedHeader = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '960px',
  minWidth: '640px',
  minHeight: 250,
  marginTop: '-80px',
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(3),
  background: 'linear-gradient(135deg, #284b63 0%, #3c6e71 50%, #58b6b9 100%)',
  animation: 'AnimateBG 10s ease infinite',
  backgroundSize: '300% 300%',
  overflow: 'hidden',
  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
  '@keyframes AnimateBG': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' }
  },
  [theme.breakpoints.down('md')]: {
    width: 'calc(100% - 32px)',
    minWidth: 'auto',
    marginLeft: '16px',
    marginRight: '16px'
  }
}));

// 🔥 КОНТЕЙНЕР ДЛЯ КУБИКОВ
const CubesContainer = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  zIndex: 1
});

// 🔥 СТИЛИ ДЛЯ КУБИКОВ
const Cube = styled(Box)(({ delay, size, left }) => ({
  position: 'absolute',
  display: 'block',
  listStyle: 'none',
  width: size || '20px',
  height: size || '20px',
  background: 'rgba(255, 255, 255, 0.15)',
  bottom: '-150px',
  left: left || 'auto',
  animation: 'animate 25s ease-in infinite',
  animationDelay: delay || '0s',
  '@keyframes animate': {
    '0%': {
      transform: 'translateY(0) rotate(0deg)',
      opacity: 1,
      borderRadius: 0
    },
    '100%': {
      transform: 'translateY(-1000px) rotate(720deg)',
      opacity: 0,
      borderRadius: '50%'
    }
  }
}));

// 🔥 КОНТЕЙНЕР ДЛЯ КОНТЕНТА ШАПКИ
const HeaderContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: 80,
  zIndex: 2,
  padding: theme.spacing(2, 5),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  color: theme.palette.common.white
}));

const StatChip = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(3),
  backgroundColor: 'rgba(255,255,255,0.15)',
  backdropFilter: 'blur(4px)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

// 🔥 СТИЛИЗОВАННЫЙ КОНТЕЙНЕР ДЛЯ КАРТОЧЕК
const CardsContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 960,
  marginTop: theme.spacing(4)
}));

// Данные для кубиков
const cubes = [
  { left: '5%', size: '60px', delay: '0s' },
  { left: '15%', size: '25px', delay: '2s' },
  { left: '25%', size: '40px', delay: '4s' },
  { left: '35%', size: '80px', delay: '1s' },
  { left: '45%', size: '20px', delay: '3s' },
  { left: '55%', size: '70px', delay: '5s' },
  { left: '65%', size: '35px', delay: '2s' },
  { left: '75%', size: '50px', delay: '6s' },
  { left: '85%', size: '30px', delay: '4s' },
  { left: '95%', size: '45px', delay: '0s' },
];

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const MyInvitationsPage = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [allInvitations, setAllInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Получаем ID текущего пользователя из localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      } catch (e) {
        console.error('Ошибка парсинга user данных:', e);
      }
    }
  }, []);

  const fetchAllInvitations = async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      const all = await invitationsApi.getAll() || [];

      let invitationsData = all;

      if (all && all.data !== undefined) {
        invitationsData = all.data;
      }

      if (all && all.results !== undefined) {
        invitationsData = all.results;
      }

      if (!Array.isArray(invitationsData)) {
        invitationsData = [];
      }

      setAllInvitations(invitationsData);
    } catch (err) {
      console.error('Ошибка при загрузке приглашений:', err);
      setError(err.message || 'Не удалось загрузить приглашения');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchAllInvitations();
    }
  }, [currentUserId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInvitationAction = () => {
    fetchAllInvitations();
  };

  const getSenderId = (invitation) => {
    if (!invitation) return null;
    if (invitation.sender && typeof invitation.sender === 'object' && invitation.sender.id) {
      return invitation.sender.id;
    }
    if (typeof invitation.sender === 'number') return invitation.sender;
    if (invitation.sender_id) return invitation.sender_id;
    return null;
  };

  const getReceiverId = (invitation) => {
    if (!invitation) return null;
    if (invitation.receiver && typeof invitation.receiver === 'object' && invitation.receiver.id) {
      return invitation.receiver.id;
    }
    if (typeof invitation.receiver === 'number') return invitation.receiver;
    if (invitation.receiver_id) return invitation.receiver_id;
    return null;
  };

  const getInvitationsByRole = (role) => {
    if (!currentUserId || !allInvitations || !Array.isArray(allInvitations)) return [];

    return allInvitations.filter(invitation => {
      if (!invitation) return false;

      if (role === 'received') {
        const receiverId = getReceiverId(invitation);
        return receiverId === currentUserId;
      } else if (role === 'sent') {
        const senderId = getSenderId(invitation);
        return senderId === currentUserId;
      }
      return false;
    });
  };

  const getReceivedInvitations = () => getInvitationsByRole('received');
  const getSentInvitations = () => getInvitationsByRole('sent');
  const getUserAllInvitations = () => {
    if (!currentUserId || !allInvitations || !Array.isArray(allInvitations)) return [];
    return allInvitations.filter(invitation => {
      if (!invitation) return false;
      const senderId = getSenderId(invitation);
      const receiverId = getReceiverId(invitation);
      return senderId === currentUserId || receiverId === currentUserId;
    });
  };

  const groupInvitationsByStatus = (invitationsList) => {
    if (!Array.isArray(invitationsList)) return { pending: [], accepted: [], rejected: [], cancelled: [] };
    return {
      pending: invitationsList.filter(inv => inv && inv.status === 'pending'),
      accepted: invitationsList.filter(inv => inv && inv.status === 'accepted'),
      rejected: invitationsList.filter(inv => inv && inv.status === 'rejected'),
      cancelled: invitationsList.filter(inv => inv && inv.status === 'cancelled')
    };
  };

  const renderInvitationsList = (invitationsList, isSent = false) => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchAllInvitations}>
              Повторить
            </Button>
          }
        >
          {error}
        </Alert>
      );
    }

    if (!invitationsList || invitationsList.length === 0) {
      const message = isSent
        ? 'Вы еще не отправили ни одного приглашения'
        : 'У вас нет приглашений';

      const description = isSent
        ? 'Найдите интересных коллег на странице рекомендаций и отправьте им приглашение!'
        : 'Здесь появятся приглашения, связанные с вами.';

      return (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          borderRadius: 5,
          border: '0.5px dashed',
          borderColor: 'divider'
        }}>
          <EventIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 300 }}>
            {message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Paper>
      );
    }

    const { pending, accepted, rejected, cancelled } = groupInvitationsByStatus(invitationsList);

    const sortedInvitations = [...invitationsList].sort((a, b) => {
      const statusOrder = { pending: 1, accepted: 2, rejected: 3, cancelled: 4 };
      const statusDiff = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
      if (statusDiff !== 0) return statusDiff;
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {pending.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                color: 'warning.main',
                fontWeight: 600
              }}
            >
              <PendingIcon fontSize="small" />
              Ожидают ответа ({pending.length})
            </Typography>
            {sortedInvitations
              .filter(inv => inv && inv.status === 'pending')
              .map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  isSent={isSent}
                  currentUserId={currentUserId}
                  onAction={handleInvitationAction}
                />
              ))}
          </Box>
        )}

        {accepted.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                mt: pending.length > 0 ? 3 : 0,
                color: 'success.main',
                fontWeight: 600
              }}
            >
              <AcceptedIcon fontSize="small" />
              Принятые ({accepted.length})
            </Typography>
            {sortedInvitations
              .filter(inv => inv && inv.status === 'accepted')
              .map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  isSent={isSent}
                  currentUserId={currentUserId}
                  onAction={handleInvitationAction}
                />
              ))}
          </Box>
        )}

        {rejected.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                mt: (pending.length > 0 || accepted.length > 0) ? 3 : 0,
                color: 'error.main',
                fontWeight: 600
              }}
            >
              <RejectedIcon fontSize="small" />
              Отклоненные ({rejected.length})
            </Typography>
            {sortedInvitations
              .filter(inv => inv && inv.status === 'rejected')
              .map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  isSent={isSent}
                  currentUserId={currentUserId}
                  onAction={handleInvitationAction}
                />
              ))}
          </Box>
        )}

        {cancelled.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                mt: (pending.length > 0 || accepted.length > 0 || rejected.length > 0) ? 3 : 0,
                color: 'text.disabled',
                fontWeight: 600
              }}
            >
              <RejectedIcon fontSize="small" />
              Отмененные ({cancelled.length})
            </Typography>
            {sortedInvitations
              .filter(inv => inv && inv.status === 'cancelled')
              .map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  isSent={isSent}
                  currentUserId={currentUserId}
                  onAction={handleInvitationAction}
                />
              ))}
          </Box>
        )}
      </Box>
    );
  };

  const getPendingReceivedCount = () => {
    const received = getReceivedInvitations();
    return received.filter(inv => inv && inv.status === 'pending').length;
  };

  const getSentCount = () => getSentInvitations().length;
  const getAllCount = () => getUserAllInvitations().length;

  return (
    <PageContainer>
      {/* 🔥 АНИМИРОВАННАЯ ШАПКА */}
      <AnimatedHeader>
        <CubesContainer>
          {cubes.map((cube, index) => (
            <Cube
              key={index}
              left={cube.left}
              size={cube.size}
              delay={cube.delay}
            />
          ))}
        </CubesContainer>

        <HeaderContent>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: '100%',
            width: '100%'
          }}>
            <Box sx={{ width: '100%' }}>
              <Typography
                variant="h3"
                fontWeight="900"
                sx={{
                  fontFamily: '"Montserrat", sans-serif',
                  letterSpacing: '-0.5px',
                  opacity: '0.9',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  textAlign: 'left'
                }}
              >
                ПРИГЛАШЕНИЯ
              </Typography>
            </Box>

            <Box sx={{ width: '100%', mt: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Noto Sans", sans-serif',
                  fontWeight: 100,
                  fontSize: 18,
                  opacity: 0.7,
                  textAlign: 'left'
                }}
              >
                Управление приглашениями в проекты
              </Typography>
            </Box>

            <Box sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 2
            }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <StatChip elevation={0}>
                  <InboxIcon fontSize="small" />
                  <Typography variant="body2">Входящие: {getReceivedInvitations().length}</Typography>
                </StatChip>
                <StatChip elevation={0}>
                  <SendIcon fontSize="small" />
                  <Typography variant="body2">Исходящие: {getSentCount()}</Typography>
                </StatChip>
                <StatChip elevation={0}>
                  <Badge
                    badgeContent={getPendingReceivedCount()}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none', mr: 1 } }}
                  >
                    <PendingIcon fontSize="small" />
                  </Badge>
                  <Typography variant="body2">Новых: {getPendingReceivedCount()}</Typography>
                </StatChip>
              </Box>
            </Box>
          </Box>
        </HeaderContent>
      </AnimatedHeader>

      {/* Вкладки */}
      <Paper sx={{
        maxWidth: 960,
        width: '100%',
        mb: 4,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab
            icon={<InboxIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Входящие
                {getPendingReceivedCount() > 0 && (
                  <Box
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {getPendingReceivedCount()}
                  </Box>
                )}
              </Box>
            }
          />
          <Tab
            icon={<SendIcon />}
            iconPosition="start"
            label={`Исходящие (${getSentCount()})`}
          />
          <Tab
            label={`Все (${getAllCount()})`}
          />
        </Tabs>
      </Paper>

      {/* Список приглашений */}
      <CardsContainer>
        {tabValue === 0 && renderInvitationsList(getReceivedInvitations(), false)}
        {tabValue === 1 && renderInvitationsList(getSentInvitations(), true)}
        {tabValue === 2 && renderInvitationsList(getUserAllInvitations(), false)}
      </CardsContainer>

      {/* Статистика */}
      {!loading && !error && getAllCount() > 0 && (
        <Paper sx={{
          maxWidth: 960,
          width: '100%',
          p: 3,
          mt: 4,
          borderRadius: 5,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          border: '0.5px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Статистика приглашений
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {getAllCount()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h5" color="warning.main" fontWeight="bold">
                  {getPendingReceivedCount()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ожидают
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  {getUserAllInvitations().filter(inv => inv && inv.status === 'accepted').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Принято
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h5" color="error.main" fontWeight="bold">
                  {getUserAllInvitations().filter(inv => inv && inv.status === 'rejected').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Отклонено
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </PageContainer>
  );
};

export default MyInvitationsPage;