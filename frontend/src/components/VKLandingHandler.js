// frontend/src/components/VKLandingHandler.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VKLandingHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Получаем параметры из URL
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const device_id = searchParams.get('device_id');

    console.log('📥 VKLandingHandler получил параметры:', {
      fullUrl: window.location.href,
      code: code ? code.substring(0, 20) + '...' : null,
      state: state ? state.substring(0, 20) + '...' : null,
      device_id: device_id
    });

    if (code && state) {
      // Пробуем извлечь code_verifier из state
      let codeVerifier = '';
      try {
        // Декодируем state (он в base64)
        const stateData = JSON.parse(atob(state));
        codeVerifier = stateData.verifier;
        console.log('✅ Извлечен code_verifier из state, длина:', codeVerifier.length);
      } catch (e) {
        console.error('❌ Ошибка декодирования state:', e);
        // Пробуем достать из localStorage
        codeVerifier = localStorage.getItem('vk_code_verifier');
        console.log('📦 Использую code_verifier из localStorage:', !!codeVerifier);
      }

      // 🔥 ВАЖНО: проверяем, что code_verifier есть
      if (!codeVerifier) {
        console.error('❌ Нет code_verifier ни в state, ни в localStorage');
        codeVerifier = ''; // Пустая строка, чтобы не ломать запрос
      }

      // Формируем URL с ВСЕМИ параметрами
      const redirectUrl = `/vk-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}&device_id=${encodeURIComponent(device_id || '')}&code_verifier=${encodeURIComponent(codeVerifier)}`;

      console.log('🔄 Перенаправляем на:', redirectUrl);
      navigate(redirectUrl);
    } else if (code) {
      // Если есть code, но нет state
      console.warn('⚠️ Получен code без state');
      const token = localStorage.getItem('access_token');
      if (token) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } else {
      // Нет кода - просто заход на главную
      console.log('🏠 Нет кода, проверяем авторизацию');
      const token = localStorage.getItem('access_token');
      if (token) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <p>Перенаправление...</p>
    </div>
  );
};

export default VKLandingHandler;