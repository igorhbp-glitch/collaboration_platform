// frontend/src/pages/VKCallbackHandler.js
import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VKCallbackHandler = () => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 🔥 Флаг для предотвращения повторных запросов
  const processed = useRef(false);

  useEffect(() => {
    // Если уже обработали - выходим
    if (processed.current) {
      console.log('⏭️ Callback уже обработан, пропускаем');
      return;
    }

    const handleCallback = async () => {
      try {
        // Помечаем как обработанный
        processed.current = true;

        // Получаем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const deviceId = urlParams.get('device_id');
        let codeVerifier = urlParams.get('code_verifier');

        console.log('\n' + '='.repeat(80));
        console.log('🔥 VKCallbackHandler');
        console.log('='.repeat(80));
        console.log('📥 Параметры из URL:');
        console.log(`   code: ${code ? code.substring(0, 20) + '...' : 'null'}`);
        console.log(`   state: ${state ? state.substring(0, 20) + '...' : 'null'}`);
        console.log(`   deviceId: ${deviceId}`);
        console.log(`   codeVerifier из URL: ${codeVerifier ? codeVerifier.substring(0, 20) + '...' : 'null'}`);

        if (!code) {
          console.error('❌ Код авторизации отсутствует');
          setError('Не получен код авторизации');
          setStatus('error');
          return;
        }

        // Проверяем, есть ли уже токен в localStorage
        const existingToken = localStorage.getItem('access_token');
        if (existingToken) {
          console.log('✅ Токен уже есть, перенаправляем на dashboard');
          window.location.href = '/dashboard';
          return;
        }

        // Если code_verifier не пришёл в URL, пробуем достать из localStorage
        if (!codeVerifier) {
          codeVerifier = localStorage.getItem('vk_code_verifier');
          console.log(`📦 codeVerifier из localStorage: ${codeVerifier ? codeVerifier.substring(0, 20) + '...' : 'null'}`);

          // Также пробуем достать из state
          if (!codeVerifier && state) {
            try {
              const stateData = JSON.parse(atob(state));
              codeVerifier = stateData.verifier;
              console.log(`📦 codeVerifier из state: ${codeVerifier ? codeVerifier.substring(0, 20) + '...' : 'null'}`);
            } catch (e) {
              console.log('❌ Не удалось распарсить state');
            }
          }
        }

        if (!codeVerifier) {
          console.error('❌ codeVerifier отсутствует во всех источниках');
          setError('Не получен code_verifier');
          setStatus('error');
          return;
        }

        setStatus('processing');

        // Формируем данные для отправки
        const postData = {
          code: code,
          device_id: deviceId || '',
          code_verifier: codeVerifier
        };

        console.log('\n' + '-'.repeat(40));
        console.log('📤 Отправка данных на бэкенд:');
        console.log(`   URL: http://localhost:8001/api/auth/vk-exchange/`);
        console.log(`   Метод: POST`);
        console.log(`   Content-Type: application/json`);
        console.log(`   Данные:`, {
          code: code.substring(0, 20) + '...',
          device_id: deviceId,
          code_verifier: codeVerifier.substring(0, 20) + '...'
        });
        console.log('-'.repeat(40));

        // Отправляем код на бэкенд
        const response = await axios.post('http://localhost:8001/api/auth/vk-exchange/', postData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        });

        console.log('\n' + '-'.repeat(40));
        console.log('📥 Ответ от бэкенда:');
        console.log(`   Статус: ${response.status}`);
        console.log(`   Статус текст: ${response.statusText}`);
        console.log(`   Данные:`, response.data);
        console.log('-'.repeat(40));

        if (response.data.access_token) {
          // Сохраняем токены
          localStorage.setItem('access_token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          console.log('\n' + '✅'.repeat(10));
          console.log('✅ Токены сохранены:');
          console.log(`   access_token: ${response.data.access_token.substring(0, 20)}...`);
          console.log(`   refresh_token: ${response.data.refresh_token.substring(0, 20)}...`);
          console.log(`   user:`, response.data.user);
          console.log('✅'.repeat(10));

          // Очищаем временные данные
          localStorage.removeItem('vk_code_verifier');
          localStorage.removeItem('vk_state');

          setStatus('success');

          // Перенаправляем на dashboard
          setTimeout(() => {
            console.log('\n🔄 Перенаправляем на /dashboard...');
            window.location.href = '/dashboard';
          }, 1500);

        } else {
          console.error('\n❌ Ошибка: нет access_token в ответе');
          setError('Не получен токен доступа');
          setStatus('error');
        }

      } catch (err) {
        // Если это дубль запроса - игнорируем
        if (processed.current === false) {
          return;
        }

        console.error('\n' + '❌'.repeat(20));
        console.error('❌ Ошибка в callback:');
        console.error('❌'.repeat(20));

        if (err.code === 'ECONNABORTED') {
          console.error('   Таймаут запроса');
          setError('Сервер не отвечает (таймаут)');
        } else if (err.response) {
          console.error(`   Статус: ${err.response.status}`);
          console.error(`   Данные:`, err.response.data);
          console.error(`   Заголовки:`, err.response.headers);

          let errorMessage = err.response.data?.error ||
                            err.response.data?.detail ||
                            `Ошибка сервера: ${err.response.status}`;
          setError(errorMessage);

        } else if (err.request) {
          console.error(`   Запрос был отправлен, но ответа нет`);
          console.error(`   err.request:`, err.request);
          setError('Сервер не отвечает. Проверьте подключение.');
        } else {
          console.error(`   Сообщение: ${err.message}`);
          setError(err.message);
        }

        console.error('❌'.repeat(20) + '\n');
        setStatus('error');
      }
    };

    handleCallback();
  }, []);

  if (status === 'error') {
    return (
      <Container component="main" maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/login'}
            >
              Вернуться на страницу входа
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <Typography variant="h5" gutterBottom>
                Перенаправление с VK...
              </Typography>
              <CircularProgress sx={{ mt: 2 }} />
            </>
          )}

          {status === 'processing' && (
            <>
              <Typography variant="h5" gutterBottom>
                Обработка данных...
              </Typography>
              <CircularProgress sx={{ mt: 2 }} />
            </>
          )}

          {status === 'success' && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Авторизация успешна! Перенаправляем...
              </Alert>
              <CircularProgress size={30} />
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VKCallbackHandler;