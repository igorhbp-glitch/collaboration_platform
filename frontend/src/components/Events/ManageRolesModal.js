// frontend/src/components/Events/ManageRolesModal.js
import React, { useState, useEffect, useRef } from 'react';
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
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  alpha,
  useTheme,
  Alert,
  Paper,
  Badge,
  Tab,
  Tabs
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Close as CloseIconSmall,
  Group as GroupIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  SupervisorAccount as ModeratorIcon,
  EventSeat as SectionIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 1000,
    minWidth: 800,
    height: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: theme.palette.grey[100],
    display: 'flex',
    flexDirection: 'column'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(3),
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

const StickyHeader = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor: theme.palette.grey[100],
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(2)
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(5),
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.2s',
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: 1
      }
    }
  }
}));

const RoleCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(6),
  backgroundColor: theme.palette.background.paper,
  border: '0.5px solid',
  borderColor: theme.palette.divider,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  }
}));

const SectionContainer = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(3),
  overflow: 'hidden',
  border: '0.5px solid',
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.grey[50]
}));

const SectionHeader = styled(Box)(({ theme, bgcolor }) => ({
  padding: theme.spacing(2, 3),
  backgroundColor: bgcolor || alpha(theme.palette.primary.main, 0.05),
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const ModeratorChip = styled(Chip)(({ theme, color }) => ({
  borderRadius: theme.spacing(5),
  height: 32,
  backgroundColor: alpha(color || theme.palette.primary.main, 0.1),
  color: color || theme.palette.primary.main,
  fontWeight: 500,
  margin: theme.spacing(0.5),
  '& .MuiChip-deleteIcon': {
    color: 'inherit'
  }
}));

const ParticipantListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.spacing(6),
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.background.paper,
  border: '0.5px solid',
  borderColor: theme.palette.divider,
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  minHeight: 70,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02)
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderWidth: 2
  },
  '&.disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    '&:hover': {
      borderColor: theme.palette.divider,
      backgroundColor: 'transparent'
    }
  }
}));

const ParticipantsList = styled(Box)(({ theme }) => ({
  maxHeight: 300,
  overflow: 'auto',
  padding: theme.spacing(1),
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

const ActionBar = styled(Box)(({ theme }) => ({
  position: 'sticky',
  bottom: 0,
  zIndex: 10,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderTop: '0.5px solid',
  borderColor: theme.palette.divider,
  borderRadius: theme.spacing(2),
  marginTop: theme.spacing(2)
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    minHeight: 64,
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

const ManageRolesModal = ({
  open,
  onClose,
  eventId,
  eventTitle,
  eventCreator,
  sections = [],
  participants = [],
  existingOrganizers = [],
  existingSectionModerators = {},
  existingPlenaryModerators = [],
  onSave,
  onRemoveOrganizer,
  onRemoveModerator,
  onRemovePlenaryModerator,
  onOrganizersUpdate,
  onSectionModeratorsUpdate,
  onPlenaryModeratorsUpdate,
  isLoading = false,
  initialTab = 'organizers',
  readOnly = false  // 🔥 Если true - только просмотр, если false - можно редактировать
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueries, setSearchQueries] = useState({});

  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [selectedModerators, setSelectedModerators] = useState({});
  const [selectedPlenaryModerators, setSelectedPlenaryModerators] = useState([]);

  // useRef для хранения удаленных между рендерами
  const removedOrganizersRef = useRef([]);
  const removedPlenaryModeratorsRef = useRef([]);
  const removedSectionModeratorsRef = useRef({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Локальные копии existing данных для мгновенного обновления UI
  const [localOrganizers, setLocalOrganizers] = useState(existingOrganizers);
  const [localSectionModerators, setLocalSectionModerators] = useState(existingSectionModerators);
  const [localPlenaryModerators, setLocalPlenaryModerators] = useState(existingPlenaryModerators);

  // Инициализация при открытии
  useEffect(() => {
    if (open) {
      console.log('🔵 ManageRolesModal открыт, readOnly:', readOnly);

      setActiveTab(initialTab);
      setLocalOrganizers(existingOrganizers);
      setLocalSectionModerators(existingSectionModerators);
      setLocalPlenaryModerators(existingPlenaryModerators);

      // Инициализируем selected из существующих данных
      setSelectedOrganizers([]);
      setSelectedPlenaryModerators(
        existingPlenaryModerators.map(m => Number(m.id)).filter(id => id > 0)
      );

      const initialModerators = {};
      sections.forEach(section => {
        const sectionMods = existingSectionModerators[section.id] || [];
        initialModerators[section.id] = sectionMods.map(m => Number(m.id)).filter(id => id > 0);
      });
      setSelectedModerators(initialModerators);

      // НЕ сбрасываем refs! Они должны сохраняться

      setSearchQuery('');
      setSearchQueries({});
      setError('');
      setSuccess(false);
    }
  }, [open, initialTab, existingOrganizers, existingSectionModerators, existingPlenaryModerators, sections, readOnly]);

  // Фильтруем только подтвержденных участников
  const approvedParticipants = participants.filter(p =>
    p.status === 'approved' &&
    (p.participation_type === 'speaker' || p.participation_type === 'listener')
  );

  // Вспомогательные функции проверки ролей
  const isOrganizer = (userId) => {
    return localOrganizers.some(o => o.id === userId);
  };

  const isPlenaryModerator = (userId) => {
    return localPlenaryModerators.some(m => m.id === userId);
  };

  const isSectionModerator = (userId) => {
    return Object.values(localSectionModerators).some(mods =>
      mods.some(m => m.id === userId)
    );
  };

  const isModeratorInSection = (userId, sectionId) => {
    return localSectionModerators[sectionId]?.some(m => m.id === userId) || false;
  };

  const hasAnyRole = (userId) => {
    return isOrganizer(userId) || isPlenaryModerator(userId) || isSectionModerator(userId);
  };

  const isSelectedOrganizer = (userId) => {
    return selectedOrganizers.some(o => o.user?.id === userId);
  };

  const isSelectedPlenaryModerator = (userId) => {
    return selectedPlenaryModerators.includes(Number(userId));
  };

  const isSelectedSectionModerator = (userId) => {
    return Object.values(selectedModerators).some(mods =>
      mods.includes(Number(userId))
    );
  };

  const isSelectedInSection = (userId, sectionId) => {
    return selectedModerators[sectionId]?.includes(Number(userId)) || false;
  };

  const isSelectedAnywhere = (userId) => {
    return isSelectedOrganizer(userId) ||
           isSelectedPlenaryModerator(userId) ||
           isSelectedSectionModerator(userId);
  };

  // Доступные участники для разных ролей
  const availableForOrganizers = approvedParticipants.filter(p =>
    !hasAnyRole(p.user?.id) &&
    !isSelectedAnywhere(p.user?.id) &&
    p.user?.id !== eventCreator?.id
  );

  const availableForModerators = approvedParticipants.filter(p =>
    !isOrganizer(p.user?.id) &&
    !isPlenaryModerator(p.user?.id) &&
    !isSectionModerator(p.user?.id) &&
    !isSelectedAnywhere(p.user?.id) &&
    p.user?.id !== eventCreator?.id
  );

  // Обработчики поиска
  const handleSearchChange = (sectionId, value) => {
    if (sectionId === 'organizers') {
      setSearchQuery(value);
    } else {
      setSearchQueries(prev => ({
        ...prev,
        [sectionId]: value
      }));
    }
  };

  const filterParticipants = (list, query = '') => {
    if (!query) return list;
    const lowerQuery = query.toLowerCase();
    return list.filter(p =>
      p.user?.first_name?.toLowerCase().includes(lowerQuery) ||
      p.user?.last_name?.toLowerCase().includes(lowerQuery) ||
      p.user?.email?.toLowerCase().includes(lowerQuery)
    );
  };

  // Обработчики выбора/отмены выбора (только если не readOnly)
  const handleSelectOrganizer = (participant) => {
    if (readOnly) return;

    const participantId = participant.user?.id;

    if (isSelectedAnywhere(participantId)) {
      setError('Этот участник уже выбран в другой роли');
      return;
    }

    setSelectedOrganizers(prev => {
      const isSelected = prev.some(p => p.user?.id === participantId);
      if (isSelected) {
        return prev.filter(p => p.user?.id !== participantId);
      } else {
        return [...prev, participant];
      }
    });
    setError('');
  };

  const handleToggleModerator = (sectionId, participant) => {
    if (readOnly) return;

    const participantId = Number(participant.user?.id);

    if (!isModeratorInSection(participantId, sectionId) && isSectionModerator(participantId)) {
      setError('Этот участник уже является модератором другой секции');
      return;
    }

    if (isSelectedAnywhere(participantId) && !isSelectedInSection(participantId, sectionId)) {
      setError('Этот участник уже выбран в другой роли');
      return;
    }

    setSelectedModerators(prev => {
      const currentModerators = prev[sectionId] || [];
      const isSelected = currentModerators.includes(participantId);

      if (!isSelected && isOrganizer(participantId)) {
        setError('Организаторы не могут быть модераторами');
        return prev;
      }

      setError('');

      return {
        ...prev,
        [sectionId]: isSelected
          ? currentModerators.filter(id => Number(id) !== participantId)
          : [...currentModerators, participantId]
      };
    });
  };

  const handleTogglePlenaryModerator = (participant) => {
    if (readOnly) return;

    const participantId = Number(participant.user?.id);

    if (isSectionModerator(participantId)) {
      setError('Этот участник уже является модератором секции');
      return;
    }

    if (isSelectedAnywhere(participantId) && !isSelectedPlenaryModerator(participantId)) {
      setError('Этот участник уже выбран в другой роли');
      return;
    }

    setSelectedPlenaryModerators(prev => {
      const isSelected = prev.includes(participantId);

      if (!isSelected && isOrganizer(participantId)) {
        setError('Организаторы не могут быть модераторами');
        return prev;
      }

      setError('');

      return isSelected
        ? prev.filter(id => Number(id) !== participantId)
        : [...prev, participantId];
    });
  };

  // Обработчики удаления (только если не readOnly)
  const handleRemoveOrganizerClick = (userId) => {
    if (readOnly) return;

    removedOrganizersRef.current = [...removedOrganizersRef.current, Number(userId)];

    const newOrganizers = localOrganizers.filter(o => o.id !== userId);
    setLocalOrganizers(newOrganizers);

    if (onOrganizersUpdate) {
      onOrganizersUpdate(newOrganizers);
    }

    setSelectedOrganizers(prev => prev.filter(p => p.user?.id !== userId));
  };

  const handleRemoveModeratorClick = (sectionId, userId) => {
    if (readOnly) return;

    if (sectionId === 'plenary') {
      removedPlenaryModeratorsRef.current = [...removedPlenaryModeratorsRef.current, Number(userId)];

      const newPlenaryModerators = localPlenaryModerators.filter(m => m.id !== userId);
      setLocalPlenaryModerators(newPlenaryModerators);

      if (onPlenaryModeratorsUpdate) {
        onPlenaryModeratorsUpdate(newPlenaryModerators);
      }

      setSelectedPlenaryModerators(prev =>
        prev.filter(id => Number(id) !== Number(userId))
      );
    } else {
      const currentSectionRemoved = removedSectionModeratorsRef.current[sectionId] || [];
      removedSectionModeratorsRef.current = {
        ...removedSectionModeratorsRef.current,
        [sectionId]: [...currentSectionRemoved, Number(userId)]
      };

      const newSectionModerators = {
        ...localSectionModerators,
        [sectionId]: localSectionModerators[sectionId].filter(m => m.id !== userId)
      };
      setLocalSectionModerators(newSectionModerators);

      if (onSectionModeratorsUpdate) {
        onSectionModeratorsUpdate(sectionId, userId);
      }

      setSelectedModerators(prev => ({
        ...prev,
        [sectionId]: (prev[sectionId] || []).filter(id => Number(id) !== Number(userId))
      }));
    }
  };

  // Сохранение изменений (только если не readOnly)
  const handleSave = async () => {
    if (readOnly) return;

    const data = {
      addOrganizers: selectedOrganizers.map(p => Number(p.user?.id)).filter(id => id > 0),
      addPlenaryModerators: selectedPlenaryModerators.map(id => Number(id)).filter(id => id > 0),
      addSectionModerators: {},

      removeOrganizers: removedOrganizersRef.current.map(id => Number(id)).filter(id => id > 0),
      removePlenaryModerators: removedPlenaryModeratorsRef.current.map(id => Number(id)).filter(id => id > 0),
      removeSectionModerators: {}
    };

    // Добавляем модераторов секций (добавление)
    sections.forEach(section => {
      if (selectedModerators[section.id]?.length > 0) {
        data.addSectionModerators[String(section.id)] = selectedModerators[section.id]
          .map(id => Number(id))
          .filter(id => id > 0);
      }
    });

    // Добавляем удаленных модераторов секций
    const removeSectionData = {};
    Object.entries(removedSectionModeratorsRef.current).forEach(([sectionId, userIds]) => {
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        removeSectionData[String(sectionId)] = userIds
          .map(id => Number(id))
          .filter(id => id > 0);
      }
    });
    data.removeSectionModerators = removeSectionData;

    onSave(data);

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
  };

  // Актуальные счетчики на основе локальных данных
  const organizersCount = localOrganizers.length;
  const moderatorsCount = localPlenaryModerators.length +
                         Object.values(localSectionModerators).flat().length;

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <GroupIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            {readOnly ? 'Просмотр ролей' : 'Управление ролями'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white', borderRadius: theme.spacing(1.5) }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: theme.spacing(2) }}>
            Роли успешно обновлены!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: theme.spacing(2) }}>
            {error}
          </Alert>
        )}

        <StickyHeader>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <StyledTabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab
                value="organizers"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon fontSize="small" />
                    <span>Организаторы</span>
                    <Badge
                      badgeContent={organizersCount}
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                }
              />
              <Tab
                value="moderators"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ModeratorIcon fontSize="small" />
                    <span>Модераторы</span>
                    <Badge
                      badgeContent={moderatorsCount}
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                }
              />
            </StyledTabs>
          </Box>
        </StickyHeader>

        {activeTab === 'organizers' && (
          <>
            {eventCreator && (
              <RoleCard elevation={0} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05), mb: 3 }}>
                <Avatar
                  src={eventCreator.avatar}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'warning.main'
                  }}
                >
                  {getInitials(eventCreator.first_name, eventCreator.last_name)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight="600">
                      {eventCreator.first_name} {eventCreator.last_name}
                    </Typography>
                    <Chip
                      label="Создатель"
                      size="small"
                      icon={<StarIcon />}
                      sx={{
                        borderRadius: theme.spacing(5),
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        color: 'warning.main'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {eventCreator.email}
                  </Typography>
                </Box>
              </RoleCard>
            )}

            {localOrganizers.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, ml: 1 }}>
                  Организаторы:
                </Typography>
                {localOrganizers.map((organizer) => (
                  <RoleCard key={organizer.id} elevation={0}>
                    <Avatar
                      src={organizer.avatar}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {getInitials(organizer.first_name, organizer.last_name)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {organizer.first_name} {organizer.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {organizer.email}
                      </Typography>
                    </Box>
                    {!readOnly && (
                      <IconButton
                        onClick={() => handleRemoveOrganizerClick(organizer.id)}
                        disabled={isLoading}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </RoleCard>
                ))}
              </Box>
            )}

            {!readOnly && (
              <SectionContainer elevation={0}>
                <SectionHeader bgcolor={alpha(theme.palette.primary.main, 0.08)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon sx={{ color: theme.palette.primary.main }} />
                    <Typography variant="h6" fontWeight="600">
                      Добавить организаторов
                    </Typography>
                    <Chip
                      label={`Выбрано: ${selectedOrganizers.length}`}
                      size="small"
                      sx={{
                        borderRadius: theme.spacing(5),
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main
                      }}
                    />
                  </Box>
                </SectionHeader>

                <Box sx={{ p: 2 }}>
                  <SearchField
                    fullWidth
                    size="small"
                    placeholder="🔍 Поиск участников по имени или email..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange('organizers', e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
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

                  <ParticipantsList>
                    {filterParticipants(availableForOrganizers, searchQuery).length > 0 ? (
                      filterParticipants(availableForOrganizers, searchQuery).map((p) => {
                        const isSelected = selectedOrganizers.some(sp => sp.user?.id === p.user?.id);
                        const isDisabled = isSelectedAnywhere(p.user?.id) && !isSelected;

                        return (
                          <ParticipantListItem
                            key={p.id}
                            onClick={() => !isDisabled && handleSelectOrganizer(p)}
                            className={isSelected ? 'selected' : isDisabled ? 'disabled' : ''}
                            dense
                          >
                            <ListItemAvatar sx={{ minWidth: 48 }}>
                              <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                  isSelected && (
                                    <Box sx={{
                                      bgcolor: 'success.main',
                                      borderRadius: '50%',
                                      width: 20,
                                      height: 20,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '2px solid white'
                                    }}>
                                      <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />
                                    </Box>
                                  )
                                }
                              >
                                <Avatar
                                  src={p.user?.avatar}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: p.participation_type === 'speaker' ? 'primary.main' : 'grey.400'
                                  }}
                                >
                                  {getInitials(p.user?.first_name, p.user?.last_name)}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>

                            <ListItemText
                              primary={`${p.user?.first_name} ${p.user?.last_name}`}
                              secondary={p.user?.email}
                              primaryTypographyProps={{ variant: 'subtitle2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ParticipantListItem>
                        );
                      })
                    ) : (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                        {searchQuery ? 'Ничего не найдено' : 'Нет доступных участников'}
                      </Typography>
                    )}
                  </ParticipantsList>
                </Box>
              </SectionContainer>
            )}
          </>
        )}

        {activeTab === 'moderators' && (
          <>
            <SectionContainer elevation={0} sx={{ mt: 2 }}>
              <SectionHeader bgcolor={alpha(theme.palette.primary.main, 0.08)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupsIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight="600">
                    Пленарное заседание
                  </Typography>
                  <Chip
                    label={`Модераторы: ${selectedPlenaryModerators.length || 0}`}
                    size="small"
                    sx={{
                      borderRadius: theme.spacing(5),
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main
                    }}
                  />
                </Box>
              </SectionHeader>

              <Box sx={{ p: 2 }}>
                {selectedPlenaryModerators.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Назначенные модераторы:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedPlenaryModerators.map(userId => {
                        const participant = approvedParticipants.find(p => p.user?.id === userId);
                        if (!participant) return null;
                        return (
                          <ModeratorChip
                            key={userId}
                            label={`${participant.user?.first_name} ${participant.user?.last_name}`}
                            onDelete={readOnly ? undefined : () => handleRemoveModeratorClick('plenary', userId)}
                            deleteIcon={readOnly ? undefined : <DeleteIcon />}
                            color={theme.palette.primary.main}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {!readOnly && (
                  <>
                    <SearchField
                      fullWidth
                      size="small"
                      placeholder="🔍 Поиск участников для пленарного заседания..."
                      value={searchQueries['plenary'] || ''}
                      onChange={(e) => handleSearchChange('plenary', e.target.value)}
                      sx={{ mb: 1 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: searchQueries['plenary'] && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => handleSearchChange('plenary', '')}>
                              <CloseIconSmall fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />

                    <ParticipantsList>
                      {filterParticipants(availableForModerators, searchQueries['plenary']).length > 0 ? (
                        filterParticipants(availableForModerators, searchQueries['plenary']).map((p) => {
                          const isSelected = selectedPlenaryModerators.includes(Number(p.user?.id));
                          const isDisabled = (isSelectedAnywhere(p.user?.id) && !isSelected) ||
                                           isSectionModerator(p.user?.id) ||
                                           isOrganizer(p.user?.id);

                          return (
                            <ParticipantListItem
                              key={p.id}
                              onClick={() => !isDisabled && handleTogglePlenaryModerator(p)}
                              className={isSelected ? 'selected' : isDisabled ? 'disabled' : ''}
                              dense
                            >
                              <ListItemAvatar sx={{ minWidth: 48 }}>
                                <Avatar
                                  src={p.user?.avatar}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: p.participation_type === 'speaker' ? 'primary.main' : 'grey.400'
                                  }}
                                >
                                  {getInitials(p.user?.first_name, p.user?.last_name)}
                                </Avatar>
                              </ListItemAvatar>

                              <ListItemText
                                primary={`${p.user?.first_name} ${p.user?.last_name}`}
                                secondary={p.user?.email}
                                primaryTypographyProps={{ variant: 'subtitle2' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />

                              {isSelected && (
                                <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                              )}
                            </ParticipantListItem>
                          );
                        })
                      ) : (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                          Нет доступных участников
                        </Typography>
                      )}
                    </ParticipantsList>
                  </>
                )}
              </Box>
            </SectionContainer>

            {sections.map((section) => {
              const sectionColor = section.color || theme.palette.primary.main;

              return (
                <SectionContainer elevation={0} key={section.id}>
                  <SectionHeader bgcolor={alpha(sectionColor, 0.08)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SectionIcon sx={{ color: sectionColor }} />
                      <Typography variant="h6" fontWeight="600">
                        {section.title}
                      </Typography>
                      <Chip
                        label={`Модераторы: ${selectedModerators[section.id]?.length || 0}`}
                        size="small"
                        sx={{
                          borderRadius: theme.spacing(5),
                          bgcolor: alpha(sectionColor, 0.1),
                          color: sectionColor
                        }}
                      />
                    </Box>
                  </SectionHeader>

                  <Box sx={{ p: 2 }}>
                    {selectedModerators[section.id]?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Назначенные модераторы:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedModerators[section.id].map(userId => {
                            const participant = approvedParticipants.find(p => p.user?.id === userId);
                            if (!participant) return null;
                            return (
                              <ModeratorChip
                                key={userId}
                                label={`${participant.user?.first_name} ${participant.user?.last_name}`}
                                onDelete={readOnly ? undefined : () => handleRemoveModeratorClick(section.id, userId)}
                                deleteIcon={readOnly ? undefined : <DeleteIcon />}
                                color={sectionColor}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {!readOnly && (
                      <>
                        <SearchField
                          fullWidth
                          size="small"
                          placeholder={`🔍 Поиск участников для секции "${section.title}"...`}
                          value={searchQueries[section.id] || ''}
                          onChange={(e) => handleSearchChange(section.id, e.target.value)}
                          sx={{ mb: 1 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                            endAdornment: searchQueries[section.id] && (
                              <InputAdornment position="end">
                                <IconButton size="small" onClick={() => handleSearchChange(section.id, '')}>
                                  <CloseIconSmall fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />

                        <ParticipantsList>
                          {filterParticipants(availableForModerators, searchQueries[section.id]).length > 0 ? (
                            filterParticipants(availableForModerators, searchQueries[section.id]).map((p) => {
                              const isSelected = selectedModerators[section.id]?.includes(Number(p.user?.id));
                              const isDisabled = (isSelectedAnywhere(p.user?.id) && !isSelected) ||
                                               isOrganizer(p.user?.id) ||
                                               isPlenaryModerator(p.user?.id);

                              return (
                                <ParticipantListItem
                                  key={p.id}
                                  onClick={() => !isDisabled && handleToggleModerator(section.id, p)}
                                  className={isSelected ? 'selected' : isDisabled ? 'disabled' : ''}
                                  dense
                                >
                                  <ListItemAvatar sx={{ minWidth: 48 }}>
                                    <Avatar
                                      src={p.user?.avatar}
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: p.participation_type === 'speaker' ? 'primary.main' : 'grey.400'
                                      }}
                                    >
                                      {getInitials(p.user?.first_name, p.user?.last_name)}
                                    </Avatar>
                                  </ListItemAvatar>

                                  <ListItemText
                                    primary={`${p.user?.first_name} ${p.user?.last_name}`}
                                    secondary={p.user?.email}
                                    primaryTypographyProps={{ variant: 'subtitle2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                  />

                                  {isSelected && (
                                    <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                                  )}
                                </ParticipantListItem>
                              );
                            })
                          ) : (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                              Нет доступных участников
                            </Typography>
                          )}
                        </ParticipantsList>
                      </>
                    )}
                  </Box>
                </SectionContainer>
              );
            })}
          </>
        )}

        {!readOnly && (
          <ActionBar>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: theme.spacing(5), px: 4 }}
            >
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              sx={{ borderRadius: theme.spacing(5), px: 4 }}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </ActionBar>
        )}
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default ManageRolesModal;