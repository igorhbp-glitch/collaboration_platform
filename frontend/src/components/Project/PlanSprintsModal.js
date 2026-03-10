// frontend/src/components/Project/PlanSprintsModal.js

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  Grid,
  Paper,
  Fade,
  alpha,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Check as CheckIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 32,
    maxWidth: 700,
    minWidth: 600,
    maxHeight: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: '#fafafa',
    boxShadow: 'none'
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
  padding: theme.spacing(3)
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const PlanSprintsModal = ({ open, onClose, onSave, initialTotal = 0 }) => {
  const theme = useTheme();
  const [totalSprints, setTotalSprints] = useState(initialTotal || 0);
  const [sprintTitles, setSprintTitles] = useState([]);
  const [error, setError] = useState('');

  // Сбрасываем состояние при открытии модального окна
  useEffect(() => {
    if (open) {
      setTotalSprints(initialTotal || 0);
      setSprintTitles([]);
      setError('');
    }
  }, [open, initialTotal]);

  // Обновляем массив названий при изменении количества спринтов
  const handleTotalChange = (newTotal) => {
    if (newTotal < 0) {
      setError('Количество спринтов не может быть отрицательным');
      return;
    }
    if (newTotal > 20) {
      setError('Максимальное количество спринтов - 20');
      return;
    }

    setError('');
    setTotalSprints(newTotal);

    setSprintTitles(prev => {
      const newTitles = [...prev];
      if (newTotal > prev.length) {
        for (let i = prev.length; i < newTotal; i++) {
          newTitles.push(`Спринт ${i + 1}`);
        }
      } else {
        return prev.slice(0, newTotal);
      }
      return newTitles;
    });
  };

  const handleTitleChange = (index, value) => {
    setSprintTitles(prev => {
      const newTitles = [...prev];
      newTitles[index] = value;
      return newTitles;
    });
  };

  const handleSave = () => {
    if (totalSprints === 0) {
      setError('Укажите количество спринтов');
      return;
    }

    const emptyTitles = sprintTitles.some(title => !title.trim());
    if (emptyTitles) {
      setError('Заполните названия всех спринтов');
      return;
    }

    onSave({
      total_sprints: totalSprints,
      sprint_titles: sprintTitles
    });
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TimelineIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="700">
            Планирование спринтов
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            borderRadius: 2,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {/* Выбор количества спринтов */}
        <Box sx={{ mb: 4, mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="500">
            Сколько спринтов потребуется для проекта?
          </Typography>

          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              p: 2,
              mt: 2,
              bgcolor: '#fafafa',
              boxShadow: 'none'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => handleTotalChange(totalSprints - 1)}
                disabled={totalSprints <= 0}
                sx={{
                  border: '0.5px solid',
                  borderColor: alpha(theme.palette.primary.main, 1),
                  borderRadius: 6,
                  padding: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-disabled': {
                    borderColor: alpha(theme.palette.primary.main, 0.05),
                    opacity: 0.5
                  }
                }}
              >
                <RemoveIcon />
              </IconButton>

              <TextField
                type="number"
                value={totalSprints}
                onChange={(e) => handleTotalChange(parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 20, style: { textAlign: 'center' } }}
                sx={{
                  width: '100px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 6,
                    '& fieldset': {
                      borderWidth: '0.5px',
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main
                    }
                  }
                }}
              />

              <IconButton
                onClick={() => handleTotalChange(totalSprints + 1)}
                disabled={totalSprints >= 20}
                sx={{
                  border: '0.5px solid',
                  borderColor: alpha(theme.palette.primary.main, 1),
                  borderRadius: 6,
                  padding: 1,
                  marginRight: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main
                  },
                  '&.Mui-disabled': {
                    borderColor: alpha(theme.palette.primary.main, 0.05),
                    opacity: 0.5
                  }
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 300 }}>
              {totalSprints === 0 ? 'спринтов' :
               totalSprints === 1 ? 'спринт' :
               totalSprints < 5 ? 'спринта' : 'спринтов'}
            </Typography>
          </Paper>

          {totalSprints === 0 && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              Укажите количество спринтов, чтобы продолжить
            </Alert>
          )}
        </Box>

        {/* Названия спринтов */}
        {totalSprints > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="500">
              Названия спринтов
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              {sprintTitles.map((title, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 6, boxShadow: 'none', border: '0.5px solid',                    // ← добавляем
    borderColor: alpha(theme.palette.primary.main, 0.4) }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Спринт {index + 1}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Например: Спринт ${index + 1}: Подготовка`}
                      value={title}
                      onChange={(e) => handleTitleChange(index, e.target.value)}
                      sx={{
                        mt: 0.5,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 6,
                          '& fieldset': {
                            borderWidth: '0.5px',
                            borderColor: alpha(theme.palette.primary.main, 0.1)
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: '0.5px'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: '0.5px'
                          }
                        }
                      }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mt: 2, borderRadius: 6 }}>
          Вы сможете создавать спринты по одному, начиная с первого.
          После завершения спринта автоматически откроется возможность создать следующий.
        </Alert>
      </StyledDialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 6, borderWidth: '0.5px' }}>
          Отмена
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<CheckIcon />}
          disabled={totalSprints === 0}
          sx={{ borderRadius: 6, boxShadow: 'none' }}
        >
          Сохранить план
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default PlanSprintsModal;