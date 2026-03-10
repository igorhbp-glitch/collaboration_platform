// frontend/src/services/api.js - ПОЛНАЯ ВЕРСИЯ С APIUtils (БЕЗ МЕТОДОВ КОММЕНТАРИЕВ)

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api';

// Создаем экземпляр axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
  withCredentials: false,
  // 🔥 УДАЛЕНА ОПАСНАЯ validateStatus
});

// ==================== ИНТЕРЦЕПТОР ЗАПРОСОВ ====================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ==================== ИНТЕРЦЕПТОР ОТВЕТОВ ====================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Логируем только ошибки
    if (error.response) {
      console.error('🔥 API Error:', {
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
    }

    const originalRequest = error.config;

    // Обработка 401 - просроченный токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // 🔥 Очищаем все данные аутентификации
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');

          // 🔥 Перенаправляем на страницу логина с параметром
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?session_expired=true';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // 🔥 Нет refresh token - просто очищаем и редирект
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?auth_required=true';
        }
      }
    }

    if (error.code === 'ECONNABORTED' || !error.response) {
      throw new Error('Проблемы с подключением к серверу');
    }

    return Promise.reject(error);
  }
);

// ==================== ОБРАБОТКА ОШИБОК ====================
const handleApiError = (error, defaultMessage = 'Ошибка API') => {
  if (!error.response) {
    throw new Error(error.message || 'Нет ответа от сервера');
  }

  const { status, data } = error.response;

  // 🔥 ПОНЯТНЫЕ СООБЩЕНИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ
  let message = defaultMessage;

  // Сначала пытаемся получить сообщение от сервера
  if (data?.detail) {
    message = data.detail;
  } else if (data?.message) {
    message = data.message;
  } else if (data?.error) {
    message = data.error;
  } else if (typeof data === 'string') {
    message = data;
  } else if (data && typeof data === 'object') {
    // Если пришёл объект с ошибками полей
    const firstError = Object.values(data)[0];
    if (firstError) {
      message = Array.isArray(firstError) ? firstError[0] : String(firstError);
    }
  }

  // 🔥 ПРЕОБРАЗУЕМ ТЕХНИЧЕСКИЕ КОДЫ В ПОНЯТНЫЕ СООБЩЕНИЯ
  if (status === 400) {
    if (message.includes('Unable to log in with provided credentials')) {
      message = 'Неверный email или пароль';
    } else if (message.includes('No active account')) {
      message = 'Аккаунт не активирован. Проверьте почту';
    } else if (message.includes('password')) {
      message = 'Неверный пароль';
    } else if (message.includes('email')) {
      message = 'Пользователь с таким email не найден';
    } else {
      message = message || 'Неверный email или пароль';
    }
  } else if (status === 401) {
    message = 'Требуется авторизация. Пожалуйста, войдите заново';
  } else if (status === 403) {
    message = 'У вас нет прав для этого действия';
  } else if (status === 404) {
    message = 'Запрашиваемый ресурс не найден';
  } else if (status === 500) {
    message = 'Временная ошибка на сервере. Попробуйте позже';
  }

  const errorObj = new Error(message);
  errorObj.status = status;
  errorObj.data = data;
  throw errorObj;
};

// ==================== API АУТЕНТИФИКАЦИИ ====================
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка входа');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка регистрации');
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки профиля');
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.patch('/auth/profile/', userData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка обновления профиля');
    }
  },

  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/auth/upload-avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки аватарки');
    }
  },

  deleteAvatar: async () => {
    try {
      const response = await api.delete('/auth/delete-avatar/');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка удаления аватарки');
    }
  },

  getUserById: async (userId) => {
    try {
      console.log(`👤 Загрузка профиля пользователя ID: ${userId}`);
      const response = await api.get(`/auth/users/${userId}/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки пользователя');
    }
  },

  vkLogin: () => {
    window.location.href = 'http://localhost:8001/auth/login/vk-oauth2/';
  }
};

// ==================== API ПРОЕКТОВ ====================
export const projectsAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await api.get('/projects/', { params: filters });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки проектов');
    }
  },

  getById: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки проекта:', error);
      return handleApiError(error, 'Ошибка загрузки проекта');
    }
  },

  create: async (projectData) => {
    try {
      const response = await api.post('/projects/', projectData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка создания проекта');
    }
  },

  update: async (projectId, projectData) => {
    try {
      const response = await api.put(`/projects/${projectId}/`, projectData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка обновления проекта');
    }
  },

  patch: async (projectId, projectData) => {
    try {
      const response = await api.patch(`/projects/${projectId}/`, projectData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка обновления проекта');
    }
  },

  delete: async (projectId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка удаления проекта');
    }
  },

  getMembers: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/members/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки участников');
    }
  },

  completeProject: async (projectId) => {
    try {
      const response = await api.post(`/projects/${projectId}/complete/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка завершения проекта');
    }
  },

  // Конференции
  saveConferenceLink: async (projectId, conferenceLink) => {
    try {
      const response = await api.post(`/projects/${projectId}/save-conference-link/`, {
        conference_link: conferenceLink
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка сохранения ссылки');
    }
  },

  clearConferenceLink: async (projectId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/clear-conference-link/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка удаления ссылки');
    }
  },

  // 🔥 НОВЫЙ МЕТОД ДЛЯ РЕКОМЕНДАЦИЙ
  getUserRecommendations: async () => {
    try {
      console.log('👥 Загрузка рекомендаций пользователей');

      // Пробуем основной endpoint
      const response = await api.get('/projects/recommendations/users/');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Основной endpoint не работает, пробуем тестовый:', error.message);

      // Пробуем тестовый endpoint
      try {
        const testResponse = await api.get('/projects/test-recommendations/');
        return testResponse.data;
      } catch (testError) {
        console.warn('⚠️ Тестовый endpoint тоже не работает:', testError.message);

        // Возвращаем пустой результат
        return { recommendations: [] };
      }
    }
  },

  // Документы
  getDocuments: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/documents/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки документов');
    }
  },

  uploadDocument: async (projectId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/projects/${projectId}/documents/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки документа');
    }
  },

  // ==============================================
  // 🔥 ЗАЯВКИ НА УЧАСТИЕ В ПРОЕКТЕ
  // ==============================================

  requestJoin: async (projectId, data = {}) => {
    try {
      const response = await api.post(`/projects/${projectId}/request-join/`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка при подаче заявки');
    }
  },

  getMembershipRequests: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/membership-requests/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки заявок');
    }
  },

  approveMember: async (projectId, memberId) => {
    try {
      const response = await api.post(`/projects/${projectId}/members/${memberId}/approve/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка при одобрении заявки');
    }
  },

  rejectMember: async (projectId, memberId, reason = '') => {
    try {
      const response = await api.post(`/projects/${projectId}/members/${memberId}/reject/`, { reason });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка при отклонении заявки');
    }
  },

  cancelRequest: async (projectId, memberId) => {
    try {
      const response = await api.post(`/projects/${projectId}/members/${memberId}/cancel/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка при отзыве заявки');
    }
  },

  updateMemberRole: async (projectId, memberId, role) => {
    try {
      const response = await api.post(`/projects/${projectId}/members/${memberId}/update-role/`, { role });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка при изменении роли');
    }
  },

  getAllMembers: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/all-members/`);
      // 🔥 ГАРАНТИРУЕМ, ЧТО ВОЗВРАЩАЕМ МАССИВ
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Если пришёл объект, пробуем преобразовать в массив
        return Object.values(response.data);
      }
      return [];
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки всех участников');
    }
  },

  getMembersWithOwner: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/members-with-owner/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки участников');
    }
  },

  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/projects/documents/${documentId}/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка удаления документа');
    }
  },

  // ==============================================
  // 🔥 НОВЫЙ МЕТОД ДЛЯ ВЫХОДА ИЗ ПРОЕКТА
  // ==============================================

  leaveProject: async (projectId) => {
    try {
      console.log(`👋 Выход из проекта ${projectId}`);
      const response = await api.post(`/projects/${projectId}/leave/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка выхода из проекта');
    }
  }
};

// ==================== API СПРИНТОВ ====================
export const sprintsAPI = {
  getProjectSprints: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/sprints/`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getSprint: async (sprintId) => {
    try {
      const response = await api.get(`/projects/sprints/${sprintId}/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки спринта');
    }
  },

  createSprint: async (projectId, sprintData) => {
    try {
      const response = await api.post(`/projects/${projectId}/sprints/create/`, sprintData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка создания спринта');
    }
  },

  updateSprint: async (sprintId, sprintData) => {
    try {
      const response = await api.put(`/projects/sprints/${sprintId}/`, sprintData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка обновления спринта');
    }
  },

  startSprint: async (sprintId) => {
    try {
      const response = await api.post(`/projects/sprints/${sprintId}/start/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка запуска спринта');
    }
  },

  completeSprint: async (sprintId) => {
    try {
      const response = await api.post(`/projects/sprints/${sprintId}/complete/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка завершения спринта');
    }
  },

  getSprintTasks: async (sprintId) => {
    try {
      const response = await api.get('/projects/tasks/', {
        params: { sprint_id: sprintId }
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }
};

// ==================== API ЗАДАЧ ====================
export const tasksAPI = {
  getProjectTasks: async (projectId, filters = {}) => {
    try {
      const params = { project_id: projectId, ...filters };
      const response = await api.get('/projects/tasks/', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getTask: async (taskId) => {
    try {
      const response = await api.get(`/projects/tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки задачи');
    }
  },

  createTask: async (taskData) => {
    try {
      console.log('🚀 Создание задачи с данными:', taskData);
      const response = await api.post('/projects/tasks/', taskData);
      console.log('✅ Задача успешно создана:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка создания задачи:', error);
      if (error.response) {
        console.error('📊 Детали ошибки:', error.response.data);
      }
      return handleApiError(error, 'Ошибка создания задачи');
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.patch(`/projects/tasks/${taskId}/`, taskData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка обновления задачи');
    }
  },

  updateTaskStatus: async (taskId, status) => {
    try {
      const response = await api.post(`/projects/tasks/${taskId}/update_status/`, { status });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка обновления статуса');
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/projects/tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка удаления задачи');
    }
  },

  getTaskHistory: async (taskId) => {
    try {
      const response = await api.get(`/projects/tasks/${taskId}/history/`);
      return response.data;
    } catch (error) {
      return [];
    }
  }
};

// ==================== API ПРИГЛАШЕНИЙ ====================
export const invitationsAPI = {
  getAll: async () => {
    try {
      console.log('📨 Загрузка всех приглашений пользователя');
      const response = await api.get('/invitations/');

      // Обрабатываем разные форматы ответа
      if (response.data && response.data.results) {
        return response.data.results; // пагинация DRF
      } else if (Array.isArray(response.data)) {
        return response.data; // просто массив
      } else if (response.data && response.data.data) {
        return response.data.data; // обёртка в data
      }

      return response.data || [];
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки приглашений');
    }
  },

  getReceived: async () => {
    try {
      const response = await api.get('/invitations/received/');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getSent: async () => {
    try {
      const response = await api.get('/invitations/sent/');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  create: async (invitationData) => {
    try {
      const response = await api.post('/invitations/', invitationData);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка создания приглашения');
    }
  },

  accept: async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/accept/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка принятия приглашения');
    }
  },

  reject: async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/reject/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка отклонения приглашения');
    }
  }
};

// ==================== API АНКЕТ ====================
export const questionnairesAPI = {
  getQuestionnaires: async () => {
    try {
      const response = await api.get('/questionnaires/');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  submitQuestionnaire: async (id, answers) => {
    try {
      const response = await api.post(`/questionnaires/${id}/submit/`, { answers });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка отправки анкеты');
    }
  },

  getMyAnswers: async () => {
    try {
      const response = await api.get('/questionnaires/my-answers/');
      return response.data;
    } catch (error) {
      return [];
    }
  }
};

// ==================== API UTILS ====================
export const APIUtils = {
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  downloadFile: async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      return { success: true };
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      return { success: false };
    }
  },

  getFileIcon: (fileType) => {
    const icons = {
      'image': '🖼️',
      'pdf': '📄',
      'doc': '📝',
      'excel': '📊',
      'presentation': '📽️',
      'archive': '📦',
      'text': '📃',
      'code': '💻',
      'unknown': '📎'
    };
    return icons[fileType] || '📎';
  }
};

// ==================== 🔥 НОВЫЙ API УВЕДОМЛЕНИЙ ====================
export const notificationsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/notifications/', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки уведомлений');
    }
  },

  getFeed: async () => {
    try {
      const response = await api.get('/notifications/feed/');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка загрузки ленты уведомлений');
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread_count/');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка получения количества уведомлений');
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.post(`/notifications/${id}/read/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка при отметке уведомления');
    }
  },

  markAllAsRead: async (notificationIds = []) => {
    try {
      const response = await api.post('/notifications/read_all/', {
        notification_ids: notificationIds,
        mark_all: notificationIds.length === 0
      });
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка при отметке всех уведомлений');
    }
  },

  archive: async (id) => {
    try {
      const response = await api.post(`/notifications/${id}/archive/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Ошибка при архивации уведомления');
    }
  }
};

// ==================== АЛИАСЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ ====================
export const invitationsApi = invitationsAPI;

// ==================== ЭКСПОРТЫ ====================
export default api;

// 🔥 ВАЖНО: экспортируем всё, что нужно
export { handleApiError };
export { API_BASE_URL };

export const API = {
  auth: authAPI,
  projects: projectsAPI,
  sprints: sprintsAPI,
  tasks: tasksAPI,
  invitations: invitationsAPI,
  questionnaires: questionnairesAPI,
  notifications: notificationsAPI,
  utils: APIUtils
};