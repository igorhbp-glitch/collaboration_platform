// frontend/src/services/notificationsAPI.js
import api from './api';  // ← импортируем по умолчанию

export const notificationsAPI = {
  /**
   * Получить список уведомлений с пагинацией
   * @param {Object} params - параметры (page, page_size, is_read и т.д.)
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/notifications/', { params });
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      throw error;
    }
  },

  /**
   * Получить ленту уведомлений для хедера (последние 5)
   */
  getFeed: async () => {
    try {
      const response = await api.get('/notifications/feed/');
      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки ленты уведомлений:', error);
      throw error;
    }
  },

  /**
   * Получить количество непрочитанных уведомлений
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread_count/');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения количества уведомлений:', error);
      throw error;
    }
  },

  /**
   * Отметить уведомление как прочитанное
   * @param {number} id - ID уведомления
   */
  markAsRead: async (id) => {
    try {
      const response = await api.post(`/notifications/${id}/read/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при отметке уведомления:', error);
      throw error;
    }
  },

  /**
   * Отметить все уведомления как прочитанные
   * @param {Array} notificationIds - опционально, список ID для отметки
   */
  markAllAsRead: async (notificationIds = []) => {
    try {
      const response = await api.post('/notifications/read_all/', {
        notification_ids: notificationIds,
        mark_all: notificationIds.length === 0
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений:', error);
      throw error;
    }
  },

  /**
   * Архивировать уведомление
   * @param {number} id - ID уведомления
   */
  archive: async (id) => {
    try {
      const response = await api.post(`/notifications/${id}/archive/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при архивации уведомления:', error);
      throw error;
    }
  }
};