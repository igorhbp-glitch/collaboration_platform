// src/components/Profile/EditCollaborationDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  alpha,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import HandshakeIcon from '@mui/icons-material/Handshake';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { COLLABORATION_TYPES } from '../../data/scienceData';

const EditCollaborationDialog = ({ open, onClose, user, onSave }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (user) {
      setSelectedTypes(user.collaboration_types || []);
    }
  }, [user]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = COLLABORATION_TYPES.filter(type =>
        type.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddType = (type) => {
    if (!selectedTypes.includes(type)) {
      setSelectedTypes([...selectedTypes, type]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveType = (type) => {
    setSelectedTypes(selectedTypes.filter(t => t !== type));
  };

  const handleSave = () => {
    console.log('📤 Отправка типов сотрудничества:', selectedTypes);
    onSave({ collaboration_types: selectedTypes });
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        pb: 2
      }}>
        <Typography variant="h6" component="div" fontWeight="600">
          Типы сотрудничества
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Поиск */}
          <TextField
            fullWidth
            label="Поиск типов сотрудничества"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Начните вводить для поиска..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
          />

          {/* Результаты поиска */}
          {searchResults.length > 0 && (
            <Box sx={{
              maxHeight: 200,
              overflow: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}>
              {searchResults.map((result, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    borderBottom: index < searchResults.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleAddType(result)}
                >
                  <Typography variant="body2" color="primary">
                    {result}
                  </Typography>
                  <AddIcon fontSize="small" color="action" />
                </Box>
              ))}
            </Box>
          )}

          <Divider />

          {/* Все доступные типы */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Все доступные типы сотрудничества:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {COLLABORATION_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onClick={() => handleAddType(type)}
                  variant={selectedTypes.includes(type) ? 'filled' : 'outlined'}
                  color={selectedTypes.includes(type) ? 'error' : 'default'}
                  icon={selectedTypes.includes(type) ? <HandshakeIcon /> : undefined}
                  sx={{
                    '&:hover': {
                      bgcolor: selectedTypes.includes(type)
                        ? alpha('#d32f2f', 0.8)
                        : alpha('#d32f2f', 0.1)
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Выбранные типы */}
          {selectedTypes.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Вы выбрали:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTypes.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    onDelete={() => handleRemoveType(type)}
                    deleteIcon={<DeleteIcon />}
                    color="error"
                    icon={<HandshakeIcon />}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="error"
          startIcon={<SaveIcon />}
          sx={{ borderRadius: 2 }}
        >
          Сохранить ({selectedTypes.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditCollaborationDialog;