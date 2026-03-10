// frontend/src/components/Project/ProjectHeaderNew.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Button,
  Tooltip,
  Paper,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitToAppIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  Science as ScienceIcon,
  Task as TaskIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  Timeline as TimelineIcon,
  HowToReg as HowToRegIcon
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import InviteToProjectModal from './InviteToProjectModal';
import { chatAPI } from '../../services/chatAPI';

const GradientHeader = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(5),
  padding: theme.spacing(5, 6),
  marginBottom: theme.spacing(3),
  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    pointerEvents: 'none'
  }
}));

const StatChipNew = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(0.75, 1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'transform 0.2s, background-color 0.2s',
  minWidth: '100px',
  maxWidth: '120px',
  height: 40,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: 'translateY(-2px)'
  }
}));

const StatValue = styled(Typography)({
  color: 'white',
  fontWeight: 700,
  fontSize: '1.2rem',
  lineHeight: 1
});

const StatLabel = styled(Typography)({
  color: 'rgba(255,255,255,0.8)',
  fontSize: '0.75rem',
  lineHeight: 1,
  whiteSpace: 'nowrap'
});

const LeaveButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: 'white',
  marginLeft: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: 'scale(1.05)'
  },
  borderRadius: '50%',
  transition: 'all 0.2s ease'
}));

const ProjectHeaderNew = ({
  project,
  stats,
  sprints = [],
  isOwner,
  isMember,
  isAuthenticated,
  currentUserId,
  onEditProject,
  onInviteMembers,
  onDeleteProject,
  onLeaveProject,
  onOpenChat,
  onCreateConference,
  onJoinConference,
  onEndConference,
  onJoinProject,
  onOpenMembersModal,
  conferenceLink
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const open = Boolean(anchorEl);

  const isCompleted = project?.status === 'completed';

  // Загружаем количество непрочитанных сообщений
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!project?.id) return;

      try {
        const count = await chatAPI.getUnreadCount(project.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Ошибка загрузки непрочитанных:', error);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [project?.id]);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    if (onEditProject) onEditProject();
  };

  const handleInviteClick = () => {
    handleMenuClose();
    setInviteModalOpen(true);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    if (onDeleteProject) onDeleteProject();
  };

  const handleLeaveClick = () => {
    if (onLeaveProject) onLeaveProject();
  };

  const handleJoinClick = () => {
    if (onJoinProject) onJoinProject();
  };

  const handleMembersClick = () => {
    if (onOpenMembersModal) onOpenMembersModal();
  };

  const handleInviteSuccess = (successful, failed) => {
    if (failed > 0) {
      console.log(`✅ Приглашений отправлено: ${successful}, ошибок: ${failed}`);
    }
  };

  const handleChatClick = () => {
    setUnreadCount(0);
    if (onOpenChat) onOpenChat();
  };

  const getUserInitials = (user) => {
    if (!user) return '?';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return initials.trim() || user.email?.charAt(0)?.toUpperCase() || '?';
  };

  const getUserFullName = (user) => {
    if (!user) return 'Неизвестный пользователь';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || 'Неизвестный пользователь';
  };

  const getUserAvatar = (member) => {
    if (!member) return undefined;
    if (member.user) {
      return member.user.avatar || member.user.avatar_url || undefined;
    }
    return member.avatar || member.avatar_url || undefined;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Не указана';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'draft': 'Черновик',
      'recruiting': 'Набор участников',
      'active': 'Активный',
      'completed': 'Завершен',
      'on_hold': 'На паузе',
      'archived': 'В архиве'
    };
    return statusMap[status] || status;
  };

  const getProjectTypeText = (type) => {
    const typeMap = {
      'research_paper': 'Научная статья',
      'dissertation': 'Диссертация',
      'grant': 'Грантовый проект',
      'conference': 'Подготовка к конференции',
      'book': 'Книга/Монография',
      'creative': 'Творческий проект',
      'other': 'Другой проект'
    };
    return typeMap[type] || type;
  };

  const taskProgressPercentage = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const totalSprints = project?.total_sprints || 0;
  const completedSprints = sprints.filter(s => s.status === 'completed').length;
  const sprintProgressPercentage = totalSprints > 0
    ? Math.round((completedSprints / totalSprints) * 100)
    : 0;

  const displayProgress = totalSprints > 0 ? sprintProgressPercentage : taskProgressPercentage;
  const progressLabel = totalSprints > 0
    ? `Прогресс проекта (${completedSprints}/${totalSprints} спринтов)`
    : 'Прогресс задач';

  const daysUntilDeadline = () => {
    if (!project.deadline) return null;
    try {
      const deadline = new Date(project.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);
      const diffTime = deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  };

  const daysLeft = daysUntilDeadline();
  const isDeadlineOverdue = daysLeft < 0;

  const pendingRequestsCount = project?.members?.filter(m => m.status === 'pending').length || 0;

  return (
    <>
      <GradientHeader elevation={0}>
        {/* Верхняя строка с заголовком и действиями */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 1,
          mt: 4
        }}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="800"
            sx={{
              color: 'white',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              textAlign: 'left'
            }}
          >
            {project.title}
          </Typography>

          {/* Иконки действий (только для активных проектов) */}
          {!isCompleted && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isOwner && (
                <Tooltip title="Настройки проекта">
                  <IconButton
                    onClick={handleMenuClick}
                    size="large"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        transform: 'rotate(90deg)'
                      },
                      borderRadius: '50%',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              )}

              {isMember && !isOwner && (
                <Tooltip title="Покинуть проект">
                  <LeaveButton
                    onClick={handleLeaveClick}
                    size="large"
                  >
                    <ExitToAppIcon />
                  </LeaveButton>
                </Tooltip>
              )}
            </Box>
          )}

          {/* Меню настроек (только для владельца) */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: 3
              }
            }}
          >
            <MenuItem onClick={handleEditClick}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Редактировать проект
            </MenuItem>

            <MenuItem onClick={handleInviteClick}>
              <ListItemIcon>
                <PersonAddIcon fontSize="small" />
              </ListItemIcon>
              Пригласить участников
            </MenuItem>

            <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              Удалить проект
            </MenuItem>
          </Menu>
        </Box>

        {/* ОПИСАНИЕ ПРОЕКТА */}
        {project.description && (
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'left',
              fontWeight: 300,
              fontSize: '1rem',
              letterSpacing: '0.3px',
              width: '100%'
            }}
          >
            {project.description}
          </Typography>
        )}

        {/* ОСНОВНОЙ КОНТЕЙНЕР С GRID */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { md: '1fr 1fr' },
          gap: 6,
          mb: 3,
          alignItems: 'start'
        }}>
          {/* ЛЕВЫЙ БЛОК */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            {/* МЕТА-ИНФОРМАЦИЯ */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                label={getStatusText(project.status)}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 500,
                  '& .MuiChip-label': { px: 1.5 }
                }}
              />
              <Chip
                icon={<ScienceIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                label={getProjectTypeText(project.project_type)}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
              {project.scientific_field && (
                <Chip
                  label={project.scientific_field}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                />
              )}
            </Box>

            {/* КОМПЕТЕНЦИИ */}
            {project.required_competencies && project.required_competencies.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Компетенции:
                </Typography>
                {project.required_competencies.map((comp, index) => (
                  <Chip
                    key={index}
                    label={comp}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }
                    }}
                  />
                ))}
              </Box>
            )}

            {/* ДАТА СОЗДАНИЯ */}
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                display: 'block',
                textAlign: 'left'
              }}
            >
              Создан: {formatDate(project.created_at)}
            </Typography>
          </Box>

          {/* ПРАВЫЙ БЛОК */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignSelf: 'flex-end',
            width: '100%'
          }}>
            {/* ЧИПСЫ СТАТИСТИКИ */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 1,
              mb: 2,
              width: '100%',
            }}>
              <StatChipNew>
                <TaskIcon sx={{ fontSize: 18, color: 'white' }} />
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <StatValue>{stats.totalTasks}</StatValue>
                  <StatLabel>задач</StatLabel>
                </Box>
              </StatChipNew>

              <StatChipNew>
                <CheckCircleIcon sx={{ fontSize: 18, color: 'white' }} />
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <StatValue>{stats.completedTasks}</StatValue>
                  <StatLabel>выполнено</StatLabel>
                </Box>
              </StatChipNew>

              <StatChipNew>
                <AccessTimeIcon sx={{ fontSize: 18, color: 'white' }} />
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <StatValue>{stats.inProgressTasks}</StatValue>
                  <StatLabel>в работе</StatLabel>
                </Box>
              </StatChipNew>

              <StatChipNew>
                <TrendingUpIcon sx={{ fontSize: 18, color: 'white' }} />
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <StatValue>{stats.completedSprints}</StatValue>
                  <StatLabel>спринтов</StatLabel>
                </Box>
              </StatChipNew>
            </Box>

            {/* ПРОГРЕСС-БАР */}
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 500 }}>
                    {progressLabel}
                  </Typography>
                </Box>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                  {displayProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={displayProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: totalSprints > 0 ? '#4caf50' : 'white'
                  }
                }}
              />
              {totalSprints > 0 && (
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', mt: 0.5, textAlign: 'right' }}>
                  {completedSprints} из {totalSprints} спринтов завершено
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* НИЖНЯЯ СТРОКА */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          pt: 3,
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          {/* Левая часть */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* КЛИКАБЕЛЬНЫЕ АВАТАРКИ */}
            {(project.members?.length > 0 || project.owner) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Участники:</Typography>
                <Badge
                  badgeContent={pendingRequestsCount}
                  color="warning"
                  sx={{
                    cursor: 'pointer',
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      height: 20,
                      minWidth: 20,
                      right: 8,
                      top: 8
                    }
                  }}
                >
                  <AvatarGroup
                    max={5}
                    onClick={handleMembersClick}
                    sx={{
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem',
                        border: '2px solid white',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)'
                        }
                      }
                    }}
                  >
                    {/* Создатель (всегда сверху) */}
                    {project.owner && (
                      <Tooltip
                        key="owner"
                        title={getUserFullName(project.owner)}
                        placement="top"
                      >
                        <Avatar
                          src={getUserAvatar(project.owner)}
                          sx={{ bgcolor: 'warning.main' }}
                        >
                          {getUserInitials(project.owner)}
                        </Avatar>
                      </Tooltip>
                    )}

                    {/* Остальные участники (исключая создателя) */}
                    {project.members
                      ?.filter(member => {
                        const userId = member.user?.id || member.id;
                        return userId !== project.owner?.id;
                      })
                      .map((member) => {
                        const userData = member.user || member;
                        return (
                          <Tooltip
                            key={member.id}
                            title={getUserFullName(userData)}
                            placement="top"
                          >
                            <Avatar
                              src={getUserAvatar(userData)}
                              sx={{ bgcolor: 'primary.dark' }}
                            >
                              {getUserInitials(userData)}
                            </Avatar>
                          </Tooltip>
                        );
                      })}
                  </AvatarGroup>
                </Badge>
              </Box>
            )}

            {project.owner && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Создатель:</Typography>
                <Tooltip title={getUserFullName(project.owner)} placement="top">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                    <Avatar
                      src={getUserAvatar(project.owner)}
                      sx={{ width: 24, height: 24, bgcolor: 'warning.main', fontSize: '0.75rem' }}
                    >
                      {getUserInitials(project.owner)}
                    </Avatar>
                    <Typography sx={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>
                      {project.owner.first_name || project.owner.username || 'Неизвестно'}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            )}

            {project.deadline && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FlagIcon fontSize="small" sx={{ color: isDeadlineOverdue ? 'error.light' : 'white' }} />
                <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>{formatDate(project.deadline)}</Typography>
                {!isDeadlineOverdue && daysLeft !== null && daysLeft > 0 && (
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                    (осталось {daysLeft} дн.)
                  </Typography>
                )}
                {isDeadlineOverdue && (
                  <Typography sx={{ color: 'error.light', fontSize: '0.7rem' }}>(просрочен)</Typography>
                )}
              </Box>
            )}

            {stats.overdueTasks > 0 && (
              <Chip
                label={`${stats.overdueTasks} просрочено`}
                size="small"
                sx={{
                  backgroundColor: 'error.main',
                  color: 'white',
                  fontWeight: 500,
                  height: 24,
                  '& .MuiChip-label': { px: 1, fontSize: '0.7rem' }
                }}
              />
            )}
          </Box>

          {/* ПРАВАЯ ЧАСТЬ - КНОПКИ */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {isCompleted ? (
              // 🔥 ИСПРАВЛЕНО: для завершенных проектов показываем некликабельную кнопку
              <Button
    variant="outlined"
    disabled
    sx={{
      borderRadius: 6,
      textTransform: 'none',
      px: 2,
      py: 1,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
      borderWidth: '0.5px',
      opacity: 1,
      cursor: 'default',
      '&:hover': {
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.primary.main,
        opacity: 0.9
      }
    }}
  >
    ПРОЕКТ УСПЕШНО ЗАВЕРШЕН
  </Button>
            ) : (isOwner || isMember ? (
              <>
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  overlap="circular"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      height: 18,
                      minWidth: 18,
                      right: -3,
                      top: 5
                    }
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<ChatIcon />}
                    onClick={handleChatClick}
                    sx={{
                      borderRadius: 4,
                      textTransform: 'none',
                      backgroundColor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    Чат
                  </Button>
                </Badge>

                {isOwner ? (
                  <>
                    <Button
                      variant={conferenceLink ? "outlined" : "contained"}
                      color={conferenceLink ? "inherit" : "secondary"}
                      startIcon={<VideoCallIcon />}
                      onClick={conferenceLink ? onJoinConference : onCreateConference}
                      sx={{
                        borderRadius: 4,
                        textTransform: 'none',
                        ...(conferenceLink && {
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            borderColor: 'white'
                          }
                        })
                      }}
                    >
                      {conferenceLink ? 'Войти в конференцию' : 'Создать конференцию'}
                    </Button>

                    {conferenceLink && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={onEndConference}
                        sx={{
                          borderRadius: 4,
                          textTransform: 'none',
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          color: '#ff4444',
                          borderColor: 'rgba(255,255,255,0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderColor: '#ff4444'
                          }
                        }}
                      >
                        ЗАВЕРШИТЬ
                      </Button>
                    )}
                  </>
                ) : (
                  conferenceLink && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<VideoCallIcon />}
                      onClick={onJoinConference}
                      sx={{
                        borderRadius: 4,
                        textTransform: 'none',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          borderColor: 'white'
                        }
                      }}
                    >
                      Войти в конференцию
                    </Button>
                  )
                )}
              </>
            ) : (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<HowToRegIcon />}
                onClick={handleJoinClick}
                sx={{
                  borderRadius: 4,
                  textTransform: 'none',
                  px: 4,
                  py: 1,
                  backgroundColor: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#45a049'
                  }
                }}
              >
                Принять участие в проекте
              </Button>
            ))}
          </Box>
        </Box>
      </GradientHeader>

      <InviteToProjectModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        projectId={project?.id}
        projectTitle={project?.title}
        onSuccess={handleInviteSuccess}
      />
    </>
  );
};

export default ProjectHeaderNew;