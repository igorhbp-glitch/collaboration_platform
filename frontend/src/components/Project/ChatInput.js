// frontend/src/components/Project/ChatInput.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React from 'react';
import {
  Box,
  IconButton,
  TextField,
  CircularProgress
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';

// 🔥 ИСПРАВЛЕНО: Стилизованное поле ввода с multiline
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    backgroundColor: 'transparent',
    '&:before, &:after': {
      display: 'none'
    },
    // 🔥 НОВОЕ: Стили для multiline
    '&.MuiInputBase-multiline': {
      padding: 0,
    }
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 0),
    fontSize: '0.95rem',
    color: 'white',
    fontFamily: '"Noto Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 100,
    lineHeight: 1.5,
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.7)',
      opacity: 0.8,
      fontFamily: '"Noto Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 100
    },
    // 🔥 НОВОЕ: Ограничиваем максимальную высоту
    maxHeight: '4.5em', // 3 строки * 1.5em
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '2px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255,255,255,0.3)',
      borderRadius: '2px',
      '&:hover': {
        background: 'rgba(255,255,255,0.4)',
      },
    },
  }
}));

const ChatInput = ({
  value,
  onChange,
  onSend,
  onAttach,
  disabled,
  sending,
  inputRef
}) => {
  const theme = useTheme();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box sx={{
      position: 'sticky',
      bottom: 0,
      width: '100%',
      p: 2,
      backgroundColor: 'transparent'
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '0.5px solid rgba(255, 255, 255, 0.8)',
        borderRadius: theme.spacing(5),
        padding: theme.spacing(0.5, 0.5, 0.5, 2),
        backdropFilter: 'blur(4px)',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          borderColor: 'white'
        },
        '&:focus-within': {
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          borderColor: 'white'
        }
      }}>
        <StyledTextField
          fullWidth
          placeholder="Напишите сообщение..."
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          inputRef={inputRef}
          variant="standard"
          autoComplete="off"
          name="chat-message"
          id="chat-message-input"
          // 🔥 НОВЫЕ АТРИБУТЫ
          multiline
          maxRows={3}
          inputProps={{
            'aria-label': 'chat message',
            'data-lpignore': 'true',
            'data-1p-ignore': 'true',
            'spellCheck': 'false' // Отключаем проверку орфографии
          }}
        />

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            onClick={onAttach}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            <AttachFileIcon />
          </IconButton>

          <IconButton
            onClick={onSend}
            disabled={(!value?.trim() && false) || disabled}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInput;