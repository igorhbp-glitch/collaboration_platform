// frontend/src/pages/Login.js
import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  useTheme,
  alpha,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import VKLoginButton from '../components/VKLoginButton';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

// 🔥 ПОЛНОЭКРАННЫЙ КОНТЕЙНЕР
const FullScreenContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #284b63 0%, #3c6e71 50%, #58b6b9 100%)',
  animation: 'AnimateBG 10s ease infinite',
  backgroundSize: '300% 300%',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
  '@keyframes AnimateBG': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' }
  }
}));

// 🔥 КОМПАКТНОЕ ОКНО (узкое, по центру)
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  borderRadius: theme.spacing(3),
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(10px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  width: '100%',
  maxWidth: 400,
  margin: theme.spacing(2)
}));

// 🔥 ЛОГОТИП
const Logo = styled(Typography)(({ theme }) => ({
  fontFamily: '"Montserrat", sans-serif',
  fontWeight: 900,
  fontSize: '2rem',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(0.5),
  letterSpacing: '-0.5px'
}));

// 🔥 ПОЛЯ ВВОДА С БОЛЬШИМ СКРУГЛЕНИЕМ
const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
    transition: 'all 0.2s',
    height: 44,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.primary.main, 0.02),
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: 1,
        borderColor: theme.palette.primary.main
      }
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.9rem',
    transform: 'translate(14px, 12px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -6px) scale(0.75)'
    }
  },
  '& .MuiInputBase-input': {
    fontSize: '0.95rem',
    padding: '12px 14px'
  }
}));

// 🔥 КНОПКА ВХОДА С БОЛЬШИМ СКРУГЛЕНИЕМ
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1),
  textTransform: 'none',
  fontSize: '0.95rem',
  fontWeight: 600,
  boxShadow: 'none',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  height: 44,
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  }
}));

const Login = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('test123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);

      if (result?.success) {
        navigate('/dashboard');
      } else {
        setError(result?.error || 'Неверный email или пароль');
      }
    } catch (err) {
      setError(`Ошибка: ${err.message || 'Не удалось подключиться к серверу'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <FullScreenContainer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <StyledPaper elevation={0}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Logo>
              ФИНКОЛЛАБ
            </Logo>
            <Typography variant="body2" sx={{ fontWeight: 300, color: 'text.secondary' }}>
              Вход в научную коллаборацию
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 3,
                py: 0.5,
                fontSize: '0.85rem'
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <StyledTextField
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: theme.palette.primary.main, opacity: 0.7, fontSize: '1.2rem' }} />
                  </InputAdornment>
                )
              }}
            />

            <StyledTextField
              required
              fullWidth
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: theme.palette.primary.main, opacity: 0.7, fontSize: '1.2rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                      size="small"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </StyledButton>
          </form>

          <Divider sx={{ my: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              или
            </Typography>
          </Divider>

          <VKLoginButton />
        </StyledPaper>
      </Box>
    </FullScreenContainer>
  );
};

export default Login;