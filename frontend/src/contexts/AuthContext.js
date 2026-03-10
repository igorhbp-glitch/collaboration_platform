// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          // Устанавливаем токен в заголовки
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Парсим сохранённого пользователя
          const parsedUser = JSON.parse(userData);

          // 🔥 ПРОВЕРЯЕМ, ЧТО ЭТО ДЕЙСТВИТЕЛЬНО ОБЪЕКТ ПОЛЬЗОВАТЕЛЯ
          if (!parsedUser || !parsedUser.id) {
            throw new Error('Неверные данные пользователя');
          }

          setUser(parsedUser);

          // В фоне проверяем актуальность данных на сервере
          refreshUserData();
        } catch (error) {
          console.error('Ошибка при чтении данных пользователя:', error);
          clearAuthData();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Обновление данных пользователя с сервера
  const refreshUserData = async () => {
    try {
      const response = await api.get('/auth/profile/');

      // 🔥 ПРОВЕРЯЕМ, ЧТО ПРИШЁЛ ИМЕННО ПОЛЬЗОВАТЕЛЬ
      if (!response.data || !response.data.id) {
        throw new Error('Сервер не вернул данные пользователя');
      }

      const userData = response.data;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Не удалось обновить данные пользователя:', error);
      // Если ошибка 401 - токен протух, очищаем данные
      if (error.response?.status === 401) {
        clearAuthData();
      }
    }
  };

  // Очистка всех данных аутентификации
  const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Вход по email/пароль
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });

      // 🔥 ПРОВЕРЯЕМ СТАТУС ОТВЕТА
      if (response.status !== 200) {
        throw new Error('Сервер вернул ошибку');
      }

      const { access, refresh } = response.data;

      // 🔥 ПРОВЕРЯЕМ НАЛИЧИЕ ТОКЕНОВ
      if (!access || !refresh) {
        throw new Error('Сервер не вернул токены доступа');
      }

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      // Загружаем профиль пользователя
      const userResponse = await api.get('/auth/profile/');

      // 🔥 ПРОВЕРЯЕМ, ЧТО ПРОФИЛЬ ДЕЙСТВИТЕЛЬНО ПРИШЁЛ
      if (userResponse.status !== 200 || !userResponse.data || !userResponse.data.id) {
        throw new Error('Не удалось загрузить профиль пользователя');
      }

      const userData = userResponse.data;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Ошибка входа:', error);

      // 🔥 ОЧИЩАЕМ ВСЕ ДАННЫЕ ПРИ ОШИБКЕ
      clearAuthData();

      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Ошибка входа'
      };
    }
  };

  // 🔥 ИСПРАВЛЕНО: выход с редиректом
  const logout = async () => {
    try {
      // Пробуем уведомить сервер о выходе
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Ошибка при выходе на сервере:', error);
    } finally {
      // В любом случае очищаем локальные данные
      clearAuthData();

      // 🔥 Принудительный редирект на страницу логина
      window.location.href = '/login';
    }
    return true;
  };

  // Регистрация нового пользователя
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return {
        success: false,
        error: error.response?.data || 'Ошибка регистрации'
      };
    }
  };

  // Обновление профиля
  const updateProfile = async (profileData) => {
    try {
      const response = await api.patch('/auth/profile/', profileData);

      // 🔥 ПРОВЕРЯЕМ ОТВЕТ
      if (!response.data || !response.data.id) {
        throw new Error('Сервер не вернул обновленные данные');
      }

      const updatedUser = response.data;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      return {
        success: false,
        error: error.response?.data || 'Ошибка обновления профиля'
      };
    }
  };

  // Загрузка аватарки
  const uploadAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/auth/upload-avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Обновляем данные пользователя
      await refreshUserData();

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Ошибка загрузки аватарки:', error);
      return {
        success: false,
        error: error.response?.data || 'Ошибка загрузки аватарки'
      };
    }
  };

  // Удаление аватарки
  const deleteAvatar = async () => {
    try {
      const response = await api.delete('/auth/delete-avatar/');

      // Обновляем данные пользователя
      await refreshUserData();

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Ошибка удаления аватарки:', error);
      return {
        success: false,
        error: error.response?.data || 'Ошибка удаления аватарки'
      };
    }
  };

  // Проверка прав создателя мероприятия
  const isEventCreator = (event) => {
    if (!user || !event) return false;
    return event.created_by?.id === user.id;
  };

  // Проверка прав модератора секции
  const isSectionModerator = (section) => {
    if (!user || !section) return false;
    return section.moderator?.id === user.id;
  };

  // Проверка прав модератора мероприятия (создатель или модератор секции)
  const isEventModerator = (event, sectionId = null) => {
    if (!user || !event) return false;

    // Создатель мероприятия всегда модератор
    if (event.created_by?.id === user.id) return true;

    // Если указана секция, проверяем модератора секции
    if (sectionId && event.sections) {
      const section = event.sections.find(s => s.id === sectionId);
      return section?.moderator?.id === user.id;
    }

    return false;
  };

  // Проверка, является ли пользователь участником мероприятия
  const isEventParticipant = (event, status = 'approved') => {
    if (!user || !event || !event.participants) return false;

    return event.participants.some(p =>
      p.user?.id === user.id && (!status || p.status === status)
    );
  };

  // Получение роли пользователя в мероприятии
  const getUserEventRole = (event) => {
    if (!user || !event) return null;

    if (event.created_by?.id === user.id) return 'creator';

    if (event.participants) {
      const participant = event.participants.find(p => p.user?.id === user.id);
      if (participant) {
        if (participant.participation_type === 'moderator') return 'moderator';
        if (participant.participation_type === 'speaker') return 'speaker';
        if (participant.participation_type === 'listener') return 'listener';
        if (participant.participation_type === 'organizer') return 'organizer';
      }
    }

    return null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      updateProfile,
      uploadAvatar,
      deleteAvatar,
      refreshUserData,
      isEventCreator,
      isSectionModerator,
      isEventModerator,
      isEventParticipant,
      getUserEventRole,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};