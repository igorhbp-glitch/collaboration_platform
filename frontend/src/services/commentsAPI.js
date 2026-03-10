// frontend/src/services/commentsAPI.js

import api from './api';

/**
 * API для работы с комментариями к задачам
 */
class CommentsAPI {
  /**
   * Получить все комментарии к задаче
   * @param {number} taskId - ID задачи
   * @returns {Promise<Array>} Массив комментариев
   */
  async getComments(taskId) {
    try {
      console.log(`💬 Загрузка комментариев для задачи ${taskId}`);
      const response = await api.get(`/projects/tasks/${taskId}/comments/`);

      // Обрабатываем разные форматы ответа
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.results) {
        return response.data.results;
      }
      return response.data || [];
    } catch (error) {
      console.error('❌ Ошибка загрузки комментариев:', error);
      throw error;
    }
  }

  /**
   * Создать новый комментарий
   * @param {number} taskId - ID задачи
   * @param {Object|FormData} commentData - данные комментария
   * @returns {Promise<Object>} Созданный комментарий
   */

async createComment(taskId, commentData) {
  try {
    console.log(`📤 Создание комментария для задачи ${taskId}`);

    let response;

    if (commentData instanceof FormData) {
      // 🔥 ВАЖНО: для FormData нужно использовать специальную конфигурацию
      response = await api.post(`/projects/tasks/${taskId}/comments/`, commentData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // явно указываем
        },
        // 🔥 Запрещаем axios преобразовывать данные
        transformRequest: [(data) => data],
      });
    } else {
      response = await api.post(`/projects/tasks/${taskId}/comments/`, commentData, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return response.data;
  } catch (error) {
    console.error('❌ Ошибка создания комментария:', error);
    throw error;
  }
}

  /**
   * Обновить комментарий
   * @param {number} taskId - ID задачи
   * @param {number} commentId - ID комментария
   * @param {Object} commentData - данные для обновления
   * @returns {Promise<Object>} Обновленный комментарий
   */
  async updateComment(taskId, commentId, commentData) {
    try {
      console.log(`✏️ Обновление комментария ${commentId}`);
      const response = await api.patch(
        `/projects/tasks/${taskId}/comments/${commentId}/`,
        commentData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления комментария:', error);
      throw error;
    }
  }

  /**
   * Удалить комментарий
   * @param {number} taskId - ID задачи
   * @param {number} commentId - ID комментария
   * @returns {Promise<Object>}
   */
  async deleteComment(taskId, commentId) {
    try {
      console.log(`🗑️ Удаление комментария ${commentId}`);
      await api.delete(`/projects/tasks/${taskId}/comments/${commentId}/`);
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления комментария:', error);
      throw error;
    }
  }

  /**
   * Получить количество комментариев к задаче
   * @param {number} taskId - ID задачи
   * @returns {Promise<number>}
   */
  async getCommentsCount(taskId) {
    try {
      const response = await api.get(`/projects/tasks/${taskId}/comments/count/`);
      return response.data?.count || 0;
    } catch (error) {
      console.error('❌ Ошибка получения количества комментариев:', error);
      return 0;
    }
  }

  /**
   * Подготовка FormData для отправки с файлами
   * @param {string} text - Текст комментария
   * @param {Array} files - Массив файлов
   * @param {Object} replyTo - Комментарий, на который отвечаем
   * @returns {FormData}
   */
  prepareFormData(text, files, replyTo = null) {
    const formData = new FormData();

    if (text && text.trim()) {
      formData.append('text', text.trim());
    }

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        if (file instanceof File) {
          formData.append(`attachments_${index}`, file);
          console.log(`📎 Добавлен файл ${index}: ${file.name} (${file.size} bytes)`);
        }
      });
    }

    if (replyTo) {
      formData.append('parent_message', replyTo.id);
    }

    return formData;
  }

  /**
   * Обработка ответа с комментариями для группировки
   * @param {Array} comments - массив комментариев
   * @returns {Array} обработанные комментарии
   */
  processComments(comments) {
    return (comments || []).map(comment => ({
      ...comment,
      has_attachments: comment.attachments && comment.attachments.length > 0,
      attachments_count: comment.attachments?.length || 0,
      created_at: comment.created_at || new Date().toISOString(),
    }));
  }
}

// Создаем и экспортируем экземпляр
export const commentsAPI = new CommentsAPI();
export default commentsAPI;