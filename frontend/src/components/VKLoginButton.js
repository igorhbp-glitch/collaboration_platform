// frontend/src/components/VKLoginButton.js
import React, { useState, useEffect } from 'react';
import { Button, Box, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles'; // 🔥 ДОБАВЛЯЕМ ИМПОРТ
import * as VKID from '@vkid/sdk';

// СТАРЫЙ РАБОЧИЙ ID
const VK_APP_ID = 54454413;

// 🔥 СТИЛИЗОВАННАЯ КНОПКА С БОЛЬШИМ СКРУГЛЕНИЕМ
const StyledVKButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3), // 🔥 24px скругление
  py: 1.5,
  borderColor: '#0077FF',
  color: '#0077FF',
  textTransform: 'none',
  fontWeight: 300,
  fontSize: '0.95rem',
  height: 48,
  '&:hover': {
    borderColor: '#0055AA',
    backgroundColor: 'rgba(0, 119, 255, 0.04)',
  },
  '&.Mui-disabled': {
    borderColor: 'rgba(0, 119, 255, 0.3)',
    color: 'rgba(0, 119, 255, 0.5)'
  }
}));

const VKLoginButton = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateCodeVerifier = () => {
      const array = new Uint8Array(64);
      crypto.getRandomValues(array);
      return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 128);
    };

    const codeVerifier = generateCodeVerifier();

    const generateCodeChallenge = async (verifier) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const setupAuth = async () => {
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const stateData = {
        verifier: codeVerifier,
        random: Math.random().toString(36).substring(7)
      };
      const state = btoa(JSON.stringify(stateData));

      localStorage.setItem('vk_code_verifier', codeVerifier);
      localStorage.setItem('vk_state', state);

      VKID.Config.init({
        app: VK_APP_ID,
        redirectUrl: 'http://localhost',
        state: state,
        codeChallenge: codeChallenge,
        scope: 'email',
        mode: VKID.ConfigAuthMode.Auto,
      });

      console.log('VK SDK initialized with app ID:', VK_APP_ID);
      console.log('Redirect URL: http://localhost:3000');
    };

    setupAuth();
  }, []);

  const handleVKLogin = () => {
    setLoading(true);
    try {
      VKID.Auth.login();
    } catch (error) {
      console.error('VK Login error:', error);
      alert('Ошибка авторизации: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <StyledVKButton
      fullWidth
      variant="outlined"
      onClick={handleVKLogin}
      disabled={loading}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={20} sx={{ mr: 1, color: '#0077FF' }} />
          Перенаправление на VK...
        </Box>
      ) : (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box component="span" sx={{ mr: 1, fontSize: '1.2rem', fontWeight: 'bold' }}>VK</Box>
          Войти через VK ID
        </Box>
      )}
    </StyledVKButton>
  );
};

export default VKLoginButton;