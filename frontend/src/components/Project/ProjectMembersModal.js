// frontend/src/components/Project/ProjectMembersModal.js
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
  Slide,
  alpha,
  useTheme,
  Zoom,
  Menu,
  MenuItem,
  ListItemIcon
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
  Verified as VerifiedIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Science as ScienceIcon,
  Analytics as AnalyticsIcon,
  EditNote as EditNoteIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Assistant as AssistantIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { projectsAPI } from '../../services/api';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

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

const MemberListItem = styled(ListItem)(({ theme }) => ({
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

// 🔥 Стиль для карточки владельца
const OwnerListItem = styled(MemberListItem)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.warning.main, 0.05),
  borderColor: alpha(theme.palette.warning.main, 0.3),
  '&:hover': {
    borderColor: theme.palette.warning.main,
    backgroundColor: alpha(theme.palette.warning.main, 0.08)
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

// 🔥 Чип для владельца
const OwnerChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  height: 24,
  fontWeight: 600,
  fontSize: '0.7rem',
  backgroundColor: alpha(theme.palette.warning.main, 0.1),
  color: theme.palette.warning.main,
  border: 'none',
  '& .MuiChip-icon': {
    color: 'inherit'
  }
}));

const RoleChip = styled(Chip)(({ theme, rolecolor }) => ({
  borderRadius: theme.spacing(5),
  height: 28,
  backgroundColor: alpha(rolecolor || theme.palette.primary.main, 0.1),
  color: rolecolor || theme.palette.primary.main,
  fontWeight: 500,
  fontSize: '0.75rem',
  '& .MuiChip-label': {
    px: 1.5
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

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return '?';
  return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
};

const getRoleIcon = (role) => {
  const icons = {
    'owner': '👑',
    'product_owner': '👑',
    'scrum_master': '🔄',
    'lead_researcher': '🔬',
    'researcher': '🔍',
    'analyst': '📊',
    'writer': '✍️',
    'reviewer': '👁️',
    'editor': '📝',
    'assistant': '🤝',
    'viewer': '👀'
  };
  return icons[role] || '👤';
};

const getRoleColor = (role) => {
  const colors = {
    'owner': '#FF9800',
    'product_owner': '#9C27B0',
    'scrum_master': '#2196F3',
    'lead_researcher': '#4CAF50',
    'researcher': '#FF9800',
    'analyst': '#795548',
    'writer': '#9C27B0',
    'reviewer': '#607D8B',
    'editor': '#3F51B5',
    'assistant': '#009688',
    'viewer': '#757575'
  };
  return colors[role] || '#757575';
};

const getRoleDisplay = (role) => {
  const displays = {
    'owner': 'Создатель проекта',
    'product_owner': 'Product Owner',
    'scrum_master': 'Scrum Master',
    'lead_researcher': 'Ведущий исследователь',
    'researcher': 'Исследователь',
    'analyst': 'Аналитик',
    'writer': 'Автор текста',
    'reviewer': 'Рецензент',
    'editor': 'Редактор',
    'assistant': 'Ассистент',
    'viewer': 'Наблюдатель'
  };
  return displays[role] || role;
};

// ============================================
// АНИМИРОВАННЫЙ ЭЛЕМЕНТ СПИСКА
// ============================================

const AnimatedMemberItem = ({
  member,
  isOwner = false,
  showActions,
  onApprove,
  onReject,
  onItemClick,
  onRoleChange,
  canManageRoles
}) => {
  const theme = useTheme();
  const [exiting, setExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);

  const handleApprove = async (e) => {
    e.stopPropagation();
    setExitDirection('right');
    setExiting(true);
    setActionLoading(true);

    try {
      await onApprove(member, e);
    } catch (error) {
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
      await onReject(member, e);
    } catch (error) {
      setExiting(false);
      setExitDirection(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleMenuOpen = (e) => {
    e.stopPropagation();
    setRoleMenuAnchor(e.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
  };

  const handleRoleSelect = (newRole) => {
    handleRoleMenuClose();
    if (onRoleChange && member.status === 'approved') {
      onRoleChange(member, newRole);
    }
  };

  if (exiting) {
    return (
      <Zoom in={false} timeout={300}>
        <Box sx={{ height: 80, mb: 1 }} />
      </Zoom>
    );
  }

  const roleColor = getRoleColor(member.role || 'owner');
  const roleIcon = getRoleIcon(member.role || 'owner');
  const roleDisplay = getRoleDisplay(member.role || 'owner');

  const ListItemComponent = isOwner ? OwnerListItem : MemberListItem;

  return (
    <Slide
      direction={exitDirection || 'down'}
      in={!exiting}
      mountOnEnter
      unmountOnExit
      timeout={300}
    >
      <ListItemComponent onClick={() => onItemClick(member)}>
        <ListItemAvatar sx={{ minWidth: 64 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Tooltip title={roleDisplay}>
                <Box
                  sx={{
                    bgcolor: roleColor,
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
                    {roleIcon}
                  </Typography>
                </Box>
              </Tooltip>
            }
          >
            <Avatar
              src={member.avatar || member.user?.avatar}
              sx={{
                width: 48,
                height: 48,
                bgcolor: roleColor,
                boxShadow: theme.shadows[1]
              }}
            >
              {getInitials(member.first_name || member.user?.first_name, member.last_name || member.user?.last_name)}
            </Avatar>
          </Badge>
        </ListItemAvatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight="600" noWrap>
              {member.first_name || member.user?.first_name} {member.last_name || member.user?.last_name}
            </Typography>
            {isOwner && (
              <OwnerChip
                label="Создатель"
                size="small"
                icon={<StarIcon style={{ fontSize: 14 }} />}
              />
            )}
            {!isOwner && member.status === 'approved' && (
              <StatusChip
                label="Участник"
                size="small"
                statuscolor="approved"
                icon={<VerifiedIcon style={{ fontSize: 14 }} />}
              />
            )}
            {!isOwner && member.status === 'pending' && (
              <StatusChip
                label="Ожидает"
                size="small"
                statuscolor="pending"
                icon={<HowToRegIcon style={{ fontSize: 14 }} />}
              />
            )}
            {!isOwner && member.status === 'rejected' && (
              <StatusChip
                label="Отклонён"
                size="small"
                statuscolor="rejected"
                icon={<CancelIcon style={{ fontSize: 14 }} />}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {member.email || member.user?.email}
          </Typography>

          {member.branch && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOnIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled" noWrap>
                {member.branch}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          ml: 'auto',
          mr: 2
        }}>
          {!isOwner && (
            <Box sx={{ minWidth: 150, display: 'flex', justifyContent: 'flex-end' }}>
              <RoleChip
                label={roleDisplay}
                rolecolor={roleColor}
                size="small"
              />
            </Box>
          )}

          {/* 🔥 Кнопки действий показываем только если есть права и это заявка */}
          {!isOwner && showActions && member.status === 'pending' && (
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

          {/* 🔥 Изменение роли только для approved и если есть права */}
          {!isOwner && canManageRoles && member.status === 'approved' && (
            <>
              <IconButton
                size="small"
                onClick={handleRoleMenuOpen}
                sx={{ borderRadius: 2 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={roleMenuAnchor}
                open={Boolean(roleMenuAnchor)}
                onClose={handleRoleMenuClose}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: 3
                  }
                }}
              >
                <MenuItem disabled>
                  <Typography variant="caption" color="text.secondary">
                    Изменить роль
                  </Typography>
                </MenuItem>
                <Divider />
                {Object.entries({
                  'product_owner': 'Product Owner',
                  'scrum_master': 'Scrum Master',
                  'lead_researcher': 'Ведущий исследователь',
                  'researcher': 'Исследователь',
                  'analyst': 'Аналитик',
                  'writer': 'Автор текста',
                  'reviewer': 'Рецензент',
                  'editor': 'Редактор',
                  'assistant': 'Ассистент',
                  'viewer': 'Наблюдатель'
                }).map(([value, label]) => (
                  <MenuItem
                    key={value}
                    onClick={() => handleRoleSelect(value)}
                    selected={member.role === value}
                    sx={{
                      backgroundColor: member.role === value ? alpha(getRoleColor(value), 0.1) : 'transparent'
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="body2">{getRoleIcon(value)}</Typography>
                    </ListItemIcon>
                    <Typography variant="body2">{label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      </ListItemComponent>
    </Slide>
  );
};

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const ProjectMembersModal = ({
  open,
  onClose,
  projectId,
  project,
  allMembers = [],     // все члены (включая pending)
  canManageApplications,
  canManageRoles,
  onMembersUpdate
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [drawerMember, setDrawerMember] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // 🔥 ПРЕОБРАЗУЕМ allMembers В МАССИВ (с защитой от ошибок)
  const safeAllMembers = React.useMemo(() => {
    // Если это уже массив
    if (Array.isArray(allMembers)) {
      return allMembers;
    }
    // Если это объект (например, пришёл с бэкенда как объект)
    if (allMembers && typeof allMembers === 'object') {
      try {
        // Пробуем получить значения объекта как массив
        return Object.values(allMembers);
      } catch (e) {
        console.warn('⚠️ Ошибка преобразования allMembers:', e);
        return [];
      }
    }
    // Во всех остальных случаях возвращаем пустой массив
    return [];
  }, [allMembers]);

  // 🔥 Фильтрация по статусам (используем safeAllMembers)
  const pendingRequests = safeAllMembers.filter(m => m && m.status === 'pending');
  const approvedMembers = safeAllMembers.filter(m => m && m.status === 'approved');
  const rejectedMembers = safeAllMembers.filter(m => m && m.status === 'rejected');

  // Владелец проекта (всегда показываем отдельно)
  const owner = project?.owner ? {
    id: project.owner.id,
    first_name: project.owner.first_name,
    last_name: project.owner.last_name,
    email: project.owner.email,
    avatar: project.owner.avatar,
    branch: project.owner.branch,
    role: 'owner',
    role_display: 'Создатель проекта'
  } : null;

  // Логируем для отладки
  useEffect(() => {
    console.log('🔍 ProjectMembersModal: canManageApplications =', canManageApplications);
    console.log('🔍 ProjectMembersModal: canManageRoles =', canManageRoles);
    console.log('📊 allMembers (оригинал):', allMembers);
    console.log('📊 safeAllMembers (после обработки):', safeAllMembers);
    console.log('📊 owner:', owner);
    console.log('📊 pending:', pendingRequests.length);
    console.log('📊 approved:', approvedMembers.length);
    console.log('📊 rejected:', rejectedMembers.length);
  }, [canManageApplications, canManageRoles, allMembers, safeAllMembers, owner, pendingRequests.length, approvedMembers.length, rejectedMembers.length]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRowClick = (member) => {
    setDrawerMember(member);
    setDetailDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDetailDrawerOpen(false);
    setDrawerMember(null);
  };

  const refreshData = async () => {
    if (!onMembersUpdate) return;
    try {
      const result = await onMembersUpdate();
      if (result && drawerMember) {
        const updated = result.find(m => m.id === drawerMember.id);
        if (updated) {
          setDrawerMember({...updated});
        } else {
          handleCloseDrawer();
        }
      }
      setUpdateTrigger(prev => prev + 1);
    } catch (err) {
      console.error('❌ Ошибка обновления:', err);
    }
  };

  const handleApprove = async (member, event) => {
    event.stopPropagation();
    setActionLoading(prev => ({ ...prev, [member.id]: 'approve' }));

    try {
      await projectsAPI.approveMember(projectId, member.id);
      await refreshData();
    } catch (err) {
      console.error('❌ Ошибка при одобрении:', err);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[member.id];
        return newState;
      });
    }
  };

  const handleReject = async (member, event) => {
    event.stopPropagation();
    setActionLoading(prev => ({ ...prev, [member.id]: 'reject' }));

    try {
      await projectsAPI.rejectMember(projectId, member.id);
      await refreshData();
    } catch (err) {
      console.error('❌ Ошибка при отклонении:', err);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[member.id];
        return newState;
      });
    }
  };

  const handleRoleChange = async (member, newRole) => {
    setActionLoading(prev => ({ ...prev, [member.id]: 'role' }));

    try {
      await projectsAPI.updateMemberRole(projectId, member.id, newRole);
      await refreshData();
    } catch (err) {
      console.error('❌ Ошибка при изменении роли:', err);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[member.id];
        return newState;
      });
    }
  };

  const filterMembers = (list) => {
    if (!searchQuery) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(m =>
      m.first_name?.toLowerCase().includes(query) ||
      m.last_name?.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      (m.branch && m.branch.toLowerCase().includes(query)) ||
      (m.role_display && m.role_display.toLowerCase().includes(query))
    );
  };

  const filterOwner = (owner) => {
    if (!owner || !searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      owner.first_name?.toLowerCase().includes(query) ||
      owner.last_name?.toLowerCase().includes(query) ||
      owner.email?.toLowerCase().includes(query) ||
      (owner.branch && owner.branch.toLowerCase().includes(query))
    );
  };

  const filteredPending = filterMembers(pendingRequests);
  const filteredApproved = filterMembers(approvedMembers);
  const filteredRejected = filterMembers(rejectedMembers);
  const showOwner = filterOwner(owner);

  const renderMemberDetails = () => {
    if (!drawerMember) return null;

    const roleColor = getRoleColor(drawerMember.role);
    const roleIcon = getRoleIcon(drawerMember.role);
    const roleDisplay = getRoleDisplay(drawerMember.role);
    const isOwner = drawerMember.role === 'owner';

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="700" color="primary.main">
            Детали
          </Typography>
          <IconButton onClick={handleCloseDrawer} sx={{ borderRadius: theme.spacing(1.5) }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DetailSection sx={{ p: 2.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={drawerMember.avatar}
              sx={{
                width: 70,
                height: 70,
                boxShadow: theme.shadows[1],
                bgcolor: roleColor
              }}
            >
              {getInitials(drawerMember.first_name, drawerMember.last_name)}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="700">
                {drawerMember.first_name} {drawerMember.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {drawerMember.email}
              </Typography>
              {drawerMember.branch && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.disabled">
                    {drawerMember.branch}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {!isOwner && (
              <RoleChip
                label={roleDisplay}
                rolecolor={roleColor}
                icon={<span style={{ fontSize: '1rem' }}>{roleIcon}</span>}
              />
            )}

            {isOwner ? (
              <OwnerChip
                label="Создатель проекта"
                icon={<StarIcon style={{ fontSize: 14 }} />}
                sx={{ height: 28 }}
              />
            ) : (
              <StatusChip
                label={
                  drawerMember.status === 'approved' ? 'Участник' :
                  drawerMember.status === 'pending' ? 'Ожидает' : 'Отклонён'
                }
                statuscolor={drawerMember.status}
                icon={
                  drawerMember.status === 'approved' ? <VerifiedIcon /> :
                  drawerMember.status === 'pending' ? <HowToRegIcon /> :
                  <CancelIcon />
                }
                sx={{ height: 28 }}
              />
            )}
          </Box>
        </DetailSection>

        <DetailSection sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {isOwner ? 'Дата создания проекта' : 'Дата подачи заявки'}
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {drawerMember.created_at
                ? new Date(drawerMember.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : project?.created_at
                ? new Date(project.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : 'Дата не указана'}
            </Typography>
          </Box>
        </DetailSection>

        {!isOwner && drawerMember.message && (
          <DetailSection sx={{ p: 2, mb: 2 }}>
            <SectionTitle sx={{ fontSize: '0.7rem', mb: 0.5 }}>Сопроводительное сообщение</SectionTitle>
            <Typography variant="body2">
              {drawerMember.message}
            </Typography>
          </DetailSection>
        )}

        {!isOwner && drawerMember.rejection_reason && (
          <DetailSection sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.error.main, 0.02) }}>
            <SectionTitle sx={{ fontSize: '0.7rem', mb: 0.5, color: theme.palette.error.main }}>
              Причина отказа
            </SectionTitle>
            <Typography variant="body2" color="error.main">
              {drawerMember.rejection_reason}
            </Typography>
          </DetailSection>
        )}

        {/* 🔥 Кнопки действий только для заявок и если есть права */}
        {!isOwner && drawerMember.status === 'pending' && canManageApplications && (
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
                handleApprove(drawerMember, e);
              }}
              disabled={!!actionLoading[drawerMember.id]}
              sx={{
                borderRadius: theme.spacing(5),
                py: 1.5
              }}
            >
              {actionLoading[drawerMember.id] === 'approve' ? (
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
                handleReject(drawerMember, e);
              }}
              disabled={!!actionLoading[drawerMember.id]}
              sx={{
                borderRadius: theme.spacing(5),
                py: 1.5
              }}
            >
              {actionLoading[drawerMember.id] === 'reject' ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Отклонить'
              )}
            </Button>
          </Box>
        )}

        {/* 🔥 Изменение роли только для approved и если есть права */}
        {!isOwner && drawerMember.status === 'approved' && canManageRoles && (
          <Box sx={{
            mt: 'auto',
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Изменить роль
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries({
                'product_owner': 'Product Owner',
                'scrum_master': 'Scrum Master',
                'lead_researcher': 'Ведущий исследователь',
                'researcher': 'Исследователь',
                'analyst': 'Аналитик',
                'writer': 'Автор текста',
                'reviewer': 'Рецензент',
                'editor': 'Редактор',
                'assistant': 'Ассистент',
                'viewer': 'Наблюдатель'
              }).map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  onClick={() => handleRoleChange(drawerMember, value)}
                  color={drawerMember.role === value ? 'primary' : 'default'}
                  variant={drawerMember.role === value ? 'filled' : 'outlined'}
                  sx={{
                    borderRadius: 5,
                    mb: 0.5
                  }}
                />
              ))}
            </Box>
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
              Участники проекта
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
            placeholder="🔍 Поиск по имени, email, филиалу или роли..."
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
                      badgeContent={approvedMembers.length + (owner ? 1 : 0)}
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
              {/* 🔥 Вкладка "Заявки" только для тех, у кого есть права */}
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
              {/* 🔥 Вкладка "Отклонённые" только для тех, у кого есть права */}
              {canManageApplications && (
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CancelIcon fontSize="small" />
                      <span>Отклонённые</span>
                      <Badge
                        badgeContent={rejectedMembers.length}
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
            {/* 🔥 ВКЛАДКА "УЧАСТНИКИ" - доступна всем */}
            {tabValue === 0 && (
              (showOwner || filteredApproved.length > 0) ? (
                <List>
                  {/* Всегда показываем создателя */}
                  {showOwner && owner && (
                    <AnimatedMemberItem
                      key="owner"
                      member={owner}
                      isOwner={true}
                      showActions={false}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onItemClick={handleRowClick}
                      onRoleChange={handleRoleChange}
                      canManageRoles={false}
                    />
                  )}

                  {/* Показываем утверждённых участников (без кнопок действий) */}
                  {filteredApproved.map((m) => (
                    <AnimatedMemberItem
                      key={m.id}
                      member={m}
                      isOwner={false}
                      showActions={false}  // ← для обычного просмотра кнопки не показываем
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onItemClick={handleRowClick}
                      onRoleChange={handleRoleChange}
                      canManageRoles={canManageRoles && canManageApplications}  // ← права на изменение ролей
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
                    {searchQuery ? 'Ничего не найдено' : 'Нет участников'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'Попробуйте изменить параметры поиска' : 'Когда кто-то подаст заявку, она появится здесь'}
                  </Typography>
                </Box>
              )
            )}

            {/* 🔥 ВКЛАДКА "ЗАЯВКИ" - только для менеджеров */}
            {canManageApplications && tabValue === 1 && (
              filteredPending.length > 0 ? (
                <List>
                  {filteredPending.map((m) => (
                    <AnimatedMemberItem
                      key={m.id}
                      member={m}
                      isOwner={false}
                      showActions={true}  // ← показываем кнопки одобрения/отклонения
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onItemClick={handleRowClick}
                      onRoleChange={handleRoleChange}
                      canManageRoles={canManageRoles}
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

            {/* 🔥 ВКЛАДКА "ОТКЛОНЁННЫЕ" - только для менеджеров */}
            {canManageApplications && tabValue === 2 && (
              filteredRejected.length > 0 ? (
                <List>
                  {filteredRejected.map((m) => (
                    <AnimatedMemberItem
                      key={m.id}
                      member={m}
                      isOwner={false}
                      showActions={false}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onItemClick={handleRowClick}
                      onRoleChange={handleRoleChange}
                      canManageRoles={canManageRoles}
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
        {renderMemberDetails()}
      </StyledDrawer>
    </>
  );
};

export default ProjectMembersModal;