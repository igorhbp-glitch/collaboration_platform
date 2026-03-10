// frontend/src/components/Events/EventRequestsModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HowToReg as HowToRegIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { participantsAPI } from '../../services/eventsAPI';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 600
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

const EventRequestsModal = ({ open, onClose, eventId, participants = [], onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (open) {
      // Фильтруем только заявки со статусом 'pending'
      const pendingRequests = participants.filter(p => p.status === 'pending');
      setRequests(pendingRequests);
    }
  }, [open, participants]);

  const handleApprove = async (participantId) => {
    setLoading(true);
    try {
      await participantsAPI.approveParticipant(participantId);
      // Обновляем список
      setRequests(prev => prev.filter(r => r.id !== participantId));
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Ошибка при одобрении:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (participantId) => {
    setLoading(true);
    try {
      await participantsAPI.rejectParticipant(participantId);
      setRequests(prev => prev.filter(r => r.id !== participantId));
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Ошибка при отклонении:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HowToRegIcon />
          <Typography variant="h6" fontWeight="600">
            Заявки на участие
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              Нет новых заявок
            </Typography>
          </Box>
        ) : (
          <List>
            {requests.map((request, index) => (
              <React.Fragment key={request.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{ py: 2 }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        color="success"
                        onClick={() => handleApprove(request.id)}
                        disabled={loading}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleReject(request.id)}
                        disabled={loading}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={request.user?.avatar}>
                      {getInitials(request.user?.first_name, request.user?.last_name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${request.user?.first_name} ${request.user?.last_name}`}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={request.participation_type === 'speaker' ? 'Докладчик' : 'Слушатель'}
                          size="small"
                          color={request.participation_type === 'speaker' ? 'primary' : 'default'}
                        />
                        {request.section && (
                          <Chip
                            label={request.section.title}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, px: 3 }}>
          Закрыть
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default EventRequestsModal;