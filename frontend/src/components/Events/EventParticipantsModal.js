// frontend/src/components/Events/EventParticipantsModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Tab,
  Tabs,
  Badge,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Drawer,
  Paper,
  Grid,
  Slide,
  alpha,
  useTheme,
  Zoom
} from '@mui/material';
import {
  Close as CloseIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  HowToReg as HowToRegIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
  Check as CheckIcon,
  Close as CloseIconSmall,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { participantsAPI } from '../../services/eventsAPI';

// 🔥 СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 1000,
    minWidth: 800,
    height: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: theme.palette.grey[50],
    boxShadow: theme.shadows[10]
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(5),
    marginTop: 20,
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.2s',
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: 1
      }
    }
  }
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

const ParticipantListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.spacing(6),
  marginBottom: theme.spacing(1),
  padding: theme.spacing(2, 2),
  backgroundColor: theme.palette.background.paper,
  border: '0.5px solid',
  borderColor: theme.palette.divider,
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  minHeight: 80,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

const ActionButton = styled(Button)(({ theme, actioncolor }) => ({
  minWidth: 40,
  width: 40,
  height: 40,
  borderRadius: theme.spacing(5),
  padding: 0,
  backgroundColor: actioncolor === 'approve'
    ? alpha(theme.palette.success.main, 0.1)
    : alpha(theme.palette.error.main, 0.1),
  color: actioncolor === 'approve'
    ? theme.palette.success.main
    : theme.palette.error.main,
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: actioncolor === 'approve'
      ? theme.palette.success.main
      : theme.palette.error.main,
    color: theme.palette.common.white
  }
}));

const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  borderRadius: theme.spacing(1.5),
  height: 24,
  fontWeight: 600,
  fontSize: '0.7rem',
  backgroundColor: statuscolor === 'approved'
    ? alpha(theme.palette.success.main, 0.1)
    : statuscolor === 'pending'
    ? alpha(theme.palette.warning.main, 0.1)
    : alpha(theme.palette.error.main, 0.1),
  color: statuscolor === 'approved'
    ? theme.palette.success.main
    : statuscolor === 'pending'
    ? theme.palette.warning.main
    : theme.palette.error.main,
  border: 'none',
  '& .MuiChip-icon': {
    color: 'inherit'
  }
}));

const SectionChip = styled(Chip)(({ theme, bgcolor }) => ({
  borderRadius: theme.spacing(5),
  height: 32,
  backgroundColor: bgcolor || theme.palette.grey[100],
  color: theme.palette.text.primary,
  fontWeight: 500,
  fontSize: '0.8rem',
  maxWidth: 200,
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: '0 12px'
  },
  '&:hover': {
    backgroundColor: bgcolor || theme.palette.grey[200]
  }
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 450,
    borderTopLeftRadius: theme.spacing(3),
    borderBottomLeftRadius: theme.spacing(3),
    padding: theme.spacing(3),
    boxSizing: 'border-box',
    zIndex: 1300,
    position: 'fixed',
    right: 0,
    top: 30,
    height: '90vh',
    boxShadow: theme.shadows[10],
    backgroundColor: theme.palette.grey[50]
  }
}));

const DetailSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  border: '0.5px solid',
  borderColor: theme.palette.divider,
  boxShadow: 'none',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1)
}));

const ListContainer = styled(Box)(({ theme }) => ({
  maxHeight: 'calc(90vh - 280px)',
  overflow: 'auto',
  paddingRight: theme.spacing(1),
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.grey[600],
    },
  }
}));

// 🔥 Вспомогательная функция для инициалов
const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return '?';
  return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
};

// 🔥 КОМПОНЕНТ ДЛЯ АНИМИРОВАННОГО УДАЛЕНИЯ
const AnimatedParticipantItem = ({
  participant,
  showActions,
  onApprove,
  onReject,
  onItemClick
}) => {
  const theme = useTheme();
  const [exiting, setExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async (e) => {
    e.stopPropagation();
    setExitDirection('right');
    setExiting(true);
    setActionLoading(true);

    try {
      await onApprove(participant, e);
    } catch (error) {
      console.error('Ошибка при одобрении:', error);
      setExiting(false);
      setExitDirection(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    setExitDirection('left');
    setExiting(true);
    setActionLoading(true);

    try {
      await onReject(participant, e);
    } catch (error) {
      console.error('Ошибка при отклонении:', error);
      setExiting(false);
      setExitDirection(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (exiting) {
    return (
      <Zoom in={false} timeout={300}>
        <Box sx={{ height: 80, mb: 1 }} />
      </Zoom>
    );
  }

  return (
    <Slide
      direction={exitDirection || 'down'}
      in={!exiting}
      mountOnEnter
      unmountOnExit
      timeout={300}
    >
      <ParticipantListItem
        onClick={() => onItemClick(participant)}
      >
        <ListItemAvatar sx={{ minWidth: 64 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              participant.participation_type === 'speaker' ? (
                <Tooltip title="Докладчик">
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      borderRadius: theme.spacing(1),
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      boxShadow: theme.shadows[1]
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
                      🎤
                    </Typography>
                  </Box>
                </Tooltip>
              ) : null
            }
          >
            <Avatar
              src={participant.user?.avatar}
              sx={{
                width: 48,
                height: 48,
                bgcolor: participant.participation_type === 'speaker'
                  ? 'primary.main'
                  : 'grey.400',
                boxShadow: theme.shadows[1]
              }}
            >
              {getInitials(participant.user?.first_name, participant.user?.last_name)}
            </Avatar>
          </Badge>
        </ListItemAvatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight="600" noWrap>
              {participant.user?.first_name} {participant.user?.last_name}
            </Typography>
            {participant.status === 'pending' && (
              <StatusChip
                label="Ожидает"
                size="small"
                statuscolor="pending"
                icon={<HowToRegIcon style={{ fontSize: 14 }} />}
              />
            )}
            {participant.status === 'approved' && (
              <StatusChip
                label="Подтверждён"
                size="small"
                statuscolor="approved"
                icon={<VerifiedIcon style={{ fontSize: 14 }} />}
              />
            )}
            {participant.status === 'rejected' && (
              <StatusChip
                label="Отклонён"
                size="small"
                statuscolor="rejected"
                icon={<CancelIcon style={{ fontSize: 14 }} />}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {participant.user?.email}
          </Typography>

          {participant.user?.branch && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOnIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled" noWrap>
                {participant.user.branch}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          ml: 'auto',
          mr: 2,
          minWidth: showActions ? 300 : 180
        }}>
          <Box sx={{
            minWidth: 180,
            maxWidth: 220,
            display: 'flex',
            justifyContent: 'flex-end'

          }}>
            {participant.section ? (
              <Tooltip title={participant.section.description || participant.section.title}>
                <SectionChip
                  label={participant.section.title}
                  bgcolor={participant.section.color ? alpha(participant.section.color, 0.2) : undefined}
                />
              </Tooltip>
            ) : participant.participation_type === 'speaker' ? (
              <SectionChip
                label="Пленарное заседание"
                bgcolor={alpha(theme.palette.primary.main, 0.1)}
              />
            ) : null}
          </Box>

          {showActions && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ActionButton
                actioncolor="approve"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CheckIcon />
                )}
              </ActionButton>
              <ActionButton
                actioncolor="reject"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CloseIconSmall />
                )}
              </ActionButton>
            </Box>
          )}
        </Box>
      </ParticipantListItem>
    </Slide>
  );
};

const EventParticipantsModal = ({
  open,
  onClose,
  eventId,
  participants,
  canManageApplications,  // 🔥 заменяем isOrganizer на canManageApplications
  onParticipantsUpdate
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [drawerParticipant, setDrawerParticipant] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // 🔥 ДИАГНОСТИКА: проверяем наличие onParticipantsUpdate
  useEffect(() => {
    console.log('🔍 EventParticipantsModal: onParticipantsUpdate', onParticipantsUpdate ? '✅ ПЕРЕДАН' : '❌ НЕ ПЕРЕДАН');
    if (!onParticipantsUpdate) {
      console.warn('⚠️ ВНИМАНИЕ: onParticipantsUpdate не передан! Список не будет обновляться после действий.');
    }
  }, [onParticipantsUpdate]);

  // 🔥 ДИАГНОСТИКА: логируем изменения participants
  useEffect(() => {
    console.log('📊 EventParticipantsModal participants обновились:', {
      количество: participants.length,
      ожидают: participants.filter(p => p.status === 'pending').length,
      подтверждены: participants.filter(p => p.status === 'approved').length,
      отклонены: participants.filter(p => p.status === 'rejected').length
    });
  }, [participants]);

  const pendingRequests = participants.filter(p => p.status === 'pending');
  const approvedParticipants = participants.filter(p => p.status === 'approved');
  const rejectedParticipants = participants.filter(p => p.status === 'rejected');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRowClick = (participant) => {
    setDrawerParticipant(participant);
    setDetailDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDetailDrawerOpen(false);
    setDrawerParticipant(null);
  };

  // 🔥 Функция для принудительного обновления данных с сервера
  const refreshDataFromServer = async () => {
    console.log('🔄 EventParticipantsModal: запрашиваем свежие данные с сервера...');

    if (!onParticipantsUpdate) {
      console.error('❌ EventParticipantsModal: onParticipantsUpdate не передан! Невозможно обновить данные.');
      return;
    }

    try {
      console.log('📞 EventParticipantsModal: вызываем onParticipantsUpdate родителя');
      const result = await onParticipantsUpdate();
      console.log('✅ EventParticipantsModal: родитель вернул результат:', result ? `массив из ${result.length} участников` : 'undefined');

      if (result && drawerParticipant) {
        const updatedParticipant = result.find(p => p.id === drawerParticipant.id);
        if (updatedParticipant) {
          console.log('🔄 EventParticipantsModal: обновляем drawer для участника:', updatedParticipant.id);
          setDrawerParticipant({...updatedParticipant});
        } else {
          console.log('🗑️ EventParticipantsModal: участник больше не существует, закрываем drawer');
          handleCloseDrawer();
        }
      } else if (!result && drawerParticipant) {
        console.log('📥 EventParticipantsModal: родитель не вернул данные, загружаем напрямую');
        const updatedParticipants = await participantsAPI.getParticipants({ event: eventId });
        const updatedParticipant = updatedParticipants.find(p => p.id === drawerParticipant.id);
        if (updatedParticipant) {
          setDrawerParticipant({...updatedParticipant});
        } else {
          handleCloseDrawer();
        }
      }

      setUpdateTrigger(prev => prev + 1);
      console.log('🔄 EventParticipantsModal: updateTrigger увеличен');

    } catch (err) {
      console.error('❌ EventParticipantsModal: ошибка при обновлении данных:', err);
    }
  };

  const handleApprove = async (participant, event) => {
    event.stopPropagation();
    console.log('✅ Одобряем заявку:', participant.id);
    setActionLoading(prev => ({ ...prev, [participant.id]: 'approve' }));

    try {
      await participantsAPI.approveParticipant(participant.id);
      console.log('✅ API запрос выполнен успешно');
      await refreshDataFromServer();
    } catch (err) {
      console.error('❌ Ошибка при одобрении:', err);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[participant.id];
        return newState;
      });
    }
  };

  const handleReject = async (participant, event) => {
    event.stopPropagation();
    console.log('❌ Отклоняем заявку:', participant.id);
    setActionLoading(prev => ({ ...prev, [participant.id]: 'reject' }));

    try {
      await participantsAPI.rejectParticipant(participant.id);
      console.log('✅ API запрос выполнен успешно');
      await refreshDataFromServer();
    } catch (err) {
      console.error('❌ Ошибка при отклонении:', err);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[participant.id];
        return newState;
      });
    }
  };

  const filterParticipants = (list) => {
    if (!searchQuery) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(p =>
      p.user?.first_name?.toLowerCase().includes(query) ||
      p.user?.last_name?.toLowerCase().includes(query) ||
      p.user?.email?.toLowerCase().includes(query) ||
      (p.user?.branch && p.user.branch.toLowerCase().includes(query)) ||
      (p.section?.title && p.section.title.toLowerCase().includes(query))
    );
  };

  const filteredPending = filterParticipants(pendingRequests);
  const filteredApproved = filterParticipants(approvedParticipants);
  const filteredRejected = filterParticipants(rejectedParticipants);

  const renderParticipantDetails = () => {
    if (!drawerParticipant) return null;

    const sectionColor = drawerParticipant.section?.color || theme.palette.primary.main;
    const sectionBgColor = alpha(sectionColor, 0.1);

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="700" color="primary.main">
            Детали заявки
          </Typography>
          <IconButton onClick={handleCloseDrawer} sx={{ borderRadius: theme.spacing(1.5) }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DetailSection sx={{ p: 2.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={drawerParticipant.user?.avatar}
              sx={{
                width: 70,
                height: 70,
                boxShadow: theme.shadows[1],
                bgcolor: drawerParticipant.participation_type === 'speaker'
                  ? 'primary.main'
                  : 'grey.400'
              }}
            >
              {getInitials(drawerParticipant.user?.first_name, drawerParticipant.user?.last_name)}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="700">
                {drawerParticipant.user?.first_name} {drawerParticipant.user?.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {drawerParticipant.user?.email}
              </Typography>
              {drawerParticipant.user?.branch && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled">
                    {drawerParticipant.user.branch}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={drawerParticipant.participation_type === 'speaker' ? 'Докладчик' : 'Слушатель'}
              icon={drawerParticipant.participation_type === 'speaker' ? '🎤' : '👂'}
              size="small"
              sx={{
                borderRadius: theme.spacing(1.5),
                bgcolor: drawerParticipant.participation_type === 'speaker'
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.secondary.main, 0.1),
                color: drawerParticipant.participation_type === 'speaker'
                  ? 'primary.main'
                  : 'secondary.main',
                fontWeight: 600,
                height: 28,
                '& .MuiChip-label': {
                  px: 2
                }
              }}
            />

            <StatusChip
              label={drawerParticipant.status === 'approved' ? 'Подтверждён' :
                     drawerParticipant.status === 'pending' ? 'Ожидает' : 'Отклонён'}
              statuscolor={drawerParticipant.status}
              icon={
                drawerParticipant.status === 'approved' ? <VerifiedIcon /> :
                drawerParticipant.status === 'pending' ? <HowToRegIcon /> :
                <CancelIcon />
              }
              sx={{ height: 28 }}
            />

            {drawerParticipant.section && (
              <Chip
                label={drawerParticipant.section.title}
                size="small"
                sx={{
                  borderRadius: theme.spacing(5),
                  height: 28,
                  backgroundColor: sectionBgColor,
                  color: sectionColor,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  maxWidth: 200,
                  ml: '1',
                  '& .MuiChip-label': {
                    px: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            )}
          </Box>
        </DetailSection>

        <DetailSection sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Дата подачи заявки
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {drawerParticipant.created_at
                ? new Date(drawerParticipant.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Дата не указана'}
            </Typography>
          </Box>
        </DetailSection>

        {drawerParticipant.project && (
          <DetailSection sx={{ p: 2, mb: 2 }}>
            <SectionTitle sx={{ fontSize: '0.7rem', mb: 0.5 }}>Связанный проект</SectionTitle>
            <Typography variant="body2" fontWeight="500">
              {drawerParticipant.project.title}
            </Typography>
          </DetailSection>
        )}

        {drawerParticipant.uploaded_files &&
         Array.isArray(drawerParticipant.uploaded_files) &&
         drawerParticipant.uploaded_files.length > 0 && (
          <DetailSection sx={{ p: 2, mb: 2 }}>
            <SectionTitle sx={{ fontSize: '0.7rem', mb: 1 }}>Загруженные файлы</SectionTitle>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {drawerParticipant.uploaded_files
                .filter(file => file !== null && file !== undefined)
                .map((file, index) => {
                  const fileName = file?.name || file?.filename || file?.title || 'Файл';
                  const fileUrl = file?.url || file?.path || '#';

                  return (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      startIcon={<DescriptionIcon />}
                      onClick={() => {
                        if (fileUrl && fileUrl !== '#') {
                          window.open(fileUrl, '_blank');
                        }
                      }}
                      disabled={!fileUrl || fileUrl === '#'}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        borderRadius: theme.spacing(1.5),
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: 'text.primary',
                        fontSize: '0.75rem',
                        py: 0.5,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: alpha(theme.palette.primary.main, 0.02)
                        },
                        '&.Mui-disabled': {
                          opacity: 0.5,
                          cursor: 'not-allowed'
                        }
                      }}
                    >
                      {fileName}
                    </Button>
                  );
              })}
            </Box>
          </DetailSection>
        )}

        {drawerParticipant.status === 'pending' && canManageApplications && (
          <Box sx={{
            display: 'flex',
            gap: 2,
            mt: 'auto',
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={(e) => {
                handleApprove(drawerParticipant, e);
              }}
              disabled={!!actionLoading[drawerParticipant.id]}
              sx={{
                borderRadius: theme.spacing(5),
                py: 1.5
              }}
            >
              {actionLoading[drawerParticipant.id] === 'approve' ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Одобрить'
              )}
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={(e) => {
                handleReject(drawerParticipant, e);
              }}
              disabled={!!actionLoading[drawerParticipant.id]}
              sx={{
                borderRadius: theme.spacing(5),
                py: 1.5
              }}
            >
              {actionLoading[drawerParticipant.id] === 'reject' ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Отклонить'
              )}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <StyledDialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
        style={{ zIndex: 1300 }}
      >
        <StyledDialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HowToRegIcon sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight="700">
              Участники мероприятия
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)'
              },
              borderRadius: theme.spacing(1.5)
            }}
          >
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <SearchField
            fullWidth
            placeholder="🔍 Поиск по имени, email, филиалу или секции..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIconSmall fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <StyledTabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    <span>Участники</span>
                    <Badge
                      badgeContent={approvedParticipants.length}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          position: 'relative',
                          transform: 'none',
                          ml: 1,
                          fontWeight: 600
                        }
                      }}
                    />
                  </Box>
                }
              />
              {canManageApplications && (
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HowToRegIcon fontSize="small" />
                      <span>Заявки</span>
                      <Badge
                        badgeContent={pendingRequests.length}
                        color="warning"
                        sx={{
                          '& .MuiBadge-badge': {
                            position: 'relative',
                            transform: 'none',
                            ml: 1,
                            fontWeight: 600
                          }
                        }}
                      />
                    </Box>
                  }
                />
              )}
              {canManageApplications && (
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CancelIcon fontSize="small" />
                      <span>Отклонённые</span>
                      <Badge
                        badgeContent={rejectedParticipants.length}
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            position: 'relative',
                            transform: 'none',
                            ml: 1,
                            fontWeight: 600
                          }
                        }}
                      />
                    </Box>
                  }
                />
              )}
            </StyledTabs>
          </Box>

          <ListContainer key={updateTrigger}>
            {tabValue === 0 && (
              filteredApproved.length > 0 ? (
                <List>
                  {filteredApproved.map((p) => (
                    <AnimatedParticipantItem
                      key={p.id}
                      participant={p}
                      showActions={false}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onItemClick={handleRowClick}
                    />
                  ))}
                </List>
              ) : (
                <Box sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: theme.spacing(1.5)
                }}>
                  <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {searchQuery ? 'Ничего не найдено' : 'Нет подтверждённых участников'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'Попробуйте изменить параметры поиска' : 'Когда кто-то подаст заявку, она появится здесь'}
                  </Typography>
                </Box>
              )
            )}

            {canManageApplications && tabValue === 1 && (
              filteredPending.length > 0 ? (
                <List>
                  {filteredPending.map((p) => (
                    <AnimatedParticipantItem
                      key={p.id}
                      participant={p}
                      showActions={true}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onItemClick={handleRowClick}
                    />
                  ))}
                </List>
              ) : (
                <Box sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: theme.spacing(1.5)
                }}>
                  <HowToRegIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {searchQuery ? 'Ничего не найдено' : 'Нет новых заявок'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'Попробуйте изменить параметры поиска' : 'Когда кто-то подаст заявку, она появится здесь'}
                  </Typography>
                </Box>
              )
            )}

            {canManageApplications && tabValue === 2 && (
              filteredRejected.length > 0 ? (
                <List>
                  {filteredRejected.map((p) => (
                    <AnimatedParticipantItem
                      key={p.id}
                      participant={p}
                      showActions={false}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onItemClick={handleRowClick}
                    />
                  ))}
                </List>
              ) : (
                <Box sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: theme.spacing(1.5)
                }}>
                  <CancelIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {searchQuery ? 'Ничего не найдено' : 'Нет отклонённых заявок'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'Попробуйте изменить параметры поиска' : 'Отклонённые заявки будут отображаться здесь'}
                  </Typography>
                </Box>
              )
            )}
          </ListContainer>
        </DialogContent>
      </StyledDialog>

      <StyledDrawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={handleCloseDrawer}
        SlideProps={{ direction: 'left' }}
        transitionDuration={300}
        hideBackdrop={false}
        style={{ zIndex: 1300 }}
        ModalProps={{
          disableEnforceFocus: true,
          hideBackdrop: false,
          style: { zIndex: 1300 }
        }}
      >
        {renderParticipantDetails()}
      </StyledDrawer>
    </>
  );
};

export default EventParticipantsModal;