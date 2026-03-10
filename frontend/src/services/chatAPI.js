// frontend/src/services/chatAPI.js - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ

import api from './api';

/**
 * API для работы с чатом проекта
 * Все методы используют общий экземпляр axios из api.js
 */
class ChatAPI {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000;
  }

  // ==========================================================================
  // МЕТОДЫ ДЛЯ ПАГИНАЦИИ
  // ==========================================================================

  /**
   * Получить сообщения с пагинацией
   */
  async getMessagesPaginated(projectId, options = {}) {
    const {
      page = 1,
      pageSize = 50,
      beforeId = null,
      afterId = null,
      ordering = '-created_at',
      useCache = true
    } = options;

    console.log(`📥 getMessagesPaginated: project=${projectId}, page=${page}, ordering=${ordering}`);

    const cacheKey = `project_${projectId}_page_${page}_size_${pageSize}_${ordering}`;
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        console.log(`📦 Используем кеш для страницы ${page}`);
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    const params = new URLSearchParams();
    params.append('page_size', pageSize);
    params.append('ordering', ordering);

    if (page) params.append('page', page);
    if (beforeId) params.append('before_id', beforeId);
    if (afterId) params.append('after_id', afterId);

    try {
      const response = await api.get(`/projects/${projectId}/chat/messages/`, { params });
      const data = response.data;

      if (useCache) {
        this.cache.set(cacheKey, {
          timestamp: Date.now(),
          data: data
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Ошибка загрузки сообщений:', error);
      throw error;
    }
  }

  /**
   * Загрузить более старые сообщения (при скролле вверх)
   */
  async loadOlderMessages(projectId, oldestMessageId, pageSize = 30) {
    console.log(`⬆️ loadOlderMessages: project=${projectId}, oldestId=${oldestMessageId}`);
    return this.getMessagesPaginated(projectId, {
      beforeId: oldestMessageId,
      pageSize,
      ordering: '-created_at',
      useCache: false
    });
  }

  /**
   * Загрузить более новые сообщения (при скролле вниз)
   */
  async loadNewerMessages(projectId, newestMessageId, pageSize = 30) {
    console.log(`⬇️ loadNewerMessages: project=${projectId}, newestId=${newestMessageId}`);
    return this.getMessagesPaginated(projectId, {
      afterId: newestMessageId,
      pageSize,
      ordering: '-created_at',
      useCache: false
    });
  }

  /**
   * Получить последние сообщения (для открытия чата)
   */
  async getLatestMessages(projectId, limit = 50) {
    console.log(`🆕 getLatestMessages: project=${projectId}, limit=${limit}`);
    try {
      const data = await this.getMessagesPaginated(projectId, {
        page: 1,
        pageSize: limit,
        ordering: '-created_at',
        useCache: false
      });

      const messages = data.messages || [];
      console.log(`✅ Загружено ${messages.length} сообщений`);

      return {
        ...data,
        messages: messages.reverse()
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки последних сообщений:', error);
      return {
        messages: [],
        total_count: 0,
        has_next: false
      };
    }
  }

  /**
   * Очистить кеш для проекта
   */
  clearCache(projectId) {
    console.log(`🧹 Очистка кеша для проекта ${projectId}`);
    for (const key of this.cache.keys()) {
      if (key.startsWith(`project_${projectId}_`)) {
        this.cache.delete(key);
      }
    }
  }

  // ==========================================================================
  // 🔥 ОТПРАВКА СООБЩЕНИЙ С ФАЙЛАМИ (ИСПРАВЛЕНО)
  // ==========================================================================

  /**
   * Подготовка FormData для отправки с файлами
   */
  prepareFormData(text, files, replyTo = null) {
    console.log('📦 prepareFormData: начало подготовки');
    console.log(`   - text: "${text}"`);
    console.log(`   - files: ${files?.length || 0} файлов`);

    const formData = new FormData();

    if (text && text.trim()) {
      formData.append('text', text.trim());
      console.log('   ✅ добавлен text');
    }

    if (files && files.length > 0) {
      console.log('   📎 обработка файлов:');
      files.forEach((file, index) => {
        if (file instanceof File) {
          console.log(`      [${index}] File объект:`);
          console.log(`         - name: ${file.name}`);
          console.log(`         - size: ${file.size} bytes`);
          console.log(`         - type: ${file.type}`);

          // 🔥 ВАЖНО: добавляем с правильным ключом и именем
          formData.append(`attachments_${index}`, file, file.name);
          console.log(`         ✅ добавлен как attachments_${index}`);
        } else {
          console.log(`      [${index}] Неизвестный тип файла:`, file);
        }
      });
    } else {
      console.log('   📎 нет файлов для добавления');
    }

    if (replyTo) {
      console.log(`   💬 replyTo: message ${replyTo.id}`);
      formData.append('parent_message', replyTo.id);
    }

    // Логируем содержимое FormData
    console.log('📦 Содержимое FormData:');
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`   - ${pair[0]}: File(name=${pair[1].name}, size=${pair[1].size}, type=${pair[1].type})`);
      } else {
        console.log(`   - ${pair[0]}: ${pair[1]}`);
      }
    }

    return formData;
  }

  /**
   * Отправить новое сообщение - ИСПРАВЛЕНО
   */
  async sendMessage(projectId, messageData) {
    console.log(`\n📤 sendMessage: проект ${projectId}`);
    console.log('   Тип данных:', messageData instanceof FormData ? 'FormData' : 'JSON');

    try {
      let response;

      if (messageData instanceof FormData) {
        console.log('   🔧 Отправка FormData с файлами');

        // 🔥 ПОЛУЧАЕМ ТОКЕН
        const token = localStorage.getItem('access_token');
        console.log('   🔑 Токен:', token ? 'присутствует' : 'ОТСУТСТВУЕТ');

        // 🔥 ВАЖНО: создаём кастомную конфигурацию для axios
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',  // Явно указываем тип
            'Authorization': `Bearer ${token}`       // Добавляем токен
          },
          // 🔥 ЗАПРЕЩАЕМ axios преобразовывать данные
          transformRequest: [(data) => data],
          // 🔥 Отслеживание прогресса загрузки
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`   ⬆️ Прогресс загрузки: ${percentCompleted}%`);
            }
          }
        };

        // Выводим информацию о файлах перед отправкой
        console.log('   📦 Размер FormData (приблизительно):', this._getFormDataSize(messageData), 'bytes');

        response = await api.post(`/projects/${projectId}/chat/`, messageData, config);

        console.log('   ✅ Ответ сервера получен');
        console.log('   📊 Статус:', response.status);
      } else {
        console.log('   🔧 Отправка JSON');
        response = await api.post(`/projects/${projectId}/chat/`, messageData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
      }

      // Очищаем кеш при отправке нового сообщения
      this.clearCache(projectId);

      if (response.data) {
        console.log('   ✅ Сообщение отправлено успешно');
        console.log('   📄 ID сообщения:', response.data.id);
        console.log('   📎 Вложений:', response.data.attachments?.length || 0);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);

      // Детальный лог ошибки
      if (error.response) {
        console.error('   Статус:', error.response.status);
        console.error('   Данные:', error.response.data);
        console.error('   Заголовки:', error.response.headers);
      } else if (error.request) {
        console.error('   Запрос был отправлен, но нет ответа');
        console.error('   error.request:', error.request);
      } else {
        console.error('   Ошибка настройки запроса:', error.message);
      }

      throw error;
    }
  }

  /**
   * Вспомогательный метод для оценки размера FormData
   */
  _getFormDataSize(formData) {
    let size = 0;
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        size += pair[1].size;
      } else {
        size += pair[1].length;
      }
    }
    return size;
  }

  // ==========================================================================
  // ОСТАЛЬНЫЕ МЕТОДЫ
  // ==========================================================================

  /**
   * Получить все сообщения чата проекта (для обратной совместимости)
   */
  async getMessages(projectId) {
    try {
      console.log(`💬 getMessages: проект ${projectId}`);
      const response = await api.get(`/projects/${projectId}/chat/`);

      if (response.data?.messages) {
        return response.data.messages;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('❌ Ошибка загрузки сообщений:', error);
      throw error;
    }
  }

  /**
   * Удалить сообщение
   */
  async deleteMessage(projectId, messageId) {
    try {
      console.log(`🗑️ deleteMessage: проект ${projectId}, сообщение ${messageId}`);
      await api.delete(`/projects/${projectId}/chat/${messageId}/`);
      this.clearCache(projectId);
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления сообщения:', error);
      throw error;
    }
  }

  /**
   * Получить количество непрочитанных сообщений
   */
  async getUnreadCount(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/chat/unread_count/`);
      return response.data?.unread_count || 0;
    } catch (error) {
      console.error('❌ Ошибка получения непрочитанных:', error);
      return 0;
    }
  }

  /**
   * Отметить сообщение как прочитанное
   */
  async markAsRead(projectId, messageId) {
    try {
      const response = await api.post(`/projects/${projectId}/chat/${messageId}/mark_read/`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка отметки прочитанного:', error);
      throw error;
    }
  }

  /**
   * Поиск по сообщениям
   */
  async searchMessages(projectId, query) {
    try {
      if (!query || query.length < 2) return [];

      const response = await api.get(`/projects/${projectId}/chat/search/`, {
        params: { q: query }
      });
      return response.data?.results || [];
    } catch (error) {
      console.error('❌ Ошибка поиска:', error);
      throw error;
    }
  }

  /**
   * Получить историю сообщений
   */
  async getHistory(projectId, params = {}) {
    try {
      const response = await api.get(`/projects/${projectId}/chat/history/`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки истории:', error);
      throw error;
    }
  }

  /**
   * Получить статистику чата
   */
  async getStats(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/chat/stats/`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики:', error);
      return {
        total_messages: 0,
        total_participants: 0,
        last_message_at: null
      };
    }
  }
}

// Создаём и экспортируем экземпляр класса
export const chatAPI = new ChatAPI();

// Для обратной совместимости экспортируем и как default
export default chatAPI;