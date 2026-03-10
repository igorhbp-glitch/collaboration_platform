// frontend/src/services/eventsAPI.js
import api from './api';

const EVENTS_BASE_URL = '/conferences/events/';
const SECTIONS_BASE_URL = '/conferences/sections/';
const PARTICIPANTS_BASE_URL = '/conferences/participants/';
const NEWS_BASE_URL = '/conferences/news/';
const MATERIALS_BASE_URL = '/conferences/materials/';

export const eventsAPI = {
  /**
   * Получить список мероприятий с фильтрацией
   */
  getEvents: async (params = {}) => {
    try {
      const response = await api.get(EVENTS_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки мероприятий:', error);
      throw error;
    }
  },

  /**
   * Получить детали мероприятия по ID
   */
  getEventById: async (id) => {
    try {
      const response = await api.get(`${EVENTS_BASE_URL}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки мероприятия ${id}:`, error);
      throw error;
    }
  },

  /**
   * Создать новое мероприятие
   */
  createEvent: async (eventData) => {
    try {
      const response = await api.post(EVENTS_BASE_URL, eventData);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка создания мероприятия:', error);
      throw error;
    }
  },

  /**
   * Обновить мероприятие
   */
  updateEvent: async (id, eventData) => {
    try {
      console.log('🔄 Обновление мероприятия:', eventData);
      const response = await api.put(`${EVENTS_BASE_URL}${id}/`, eventData);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка обновления мероприятия ${id}:`, error);
      throw error;
    }
  },

  /**
   * Частичное обновление мероприятия
   */
  patchEvent: async (id, eventData) => {
    try {
      const response = await api.patch(`${EVENTS_BASE_URL}${id}/`, eventData);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка обновления мероприятия ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удалить мероприятие
   */
  deleteEvent: async (id) => {
    try {
      const response = await api.delete(`${EVENTS_BASE_URL}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка удаления мероприятия ${id}:`, error);
      throw error;
    }
  },

  /**
   * Опубликовать мероприятие
   */
  publishEvent: async (id) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${id}/publish/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка публикации мероприятия ${id}:`, error);
      throw error;
    }
  },

  /**
   * Завершить мероприятие
   */
  completeEvent: async (id) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${id}/complete/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка завершения мероприятия ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получить статистику мероприятия
   */
  getEventStats: async (id) => {
    try {
      const response = await api.get(`${EVENTS_BASE_URL}${id}/stats/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки статистики мероприятия ${id}:`, error);
      throw error;
    }
  },

  /**
   * Загрузить изображение для обложки
   */
  uploadCoverImage: async (eventId, formData, onProgress) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${eventId}/upload-cover/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки изображения:', error);
      throw error;
    }
  },

  /**
   * Обновить список изображений обложки
   */
  updateCoverImages: async (eventId, images) => {
    try {
      const response = await api.patch(`${EVENTS_BASE_URL}${eventId}/`, {
        cover_images: images
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления изображений:', error);
      throw error;
    }
  },

  /**
   * Сохранить ссылку на конференцию мероприятия
   */
  saveConferenceLink: async (eventId, conferenceLink) => {
    try {
      const response = await api.patch(`${EVENTS_BASE_URL}${eventId}/`, {
        conference_link: conferenceLink
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка сохранения ссылки:', error);
      throw error;
    }
  },

  /**
   * Удалить ссылку на конференцию мероприятия
   */
  clearConferenceLink: async (eventId) => {
    try {
      const response = await api.patch(`${EVENTS_BASE_URL}${eventId}/`, {
        conference_link: null
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка удаления ссылки:', error);
      throw error;
    }
  },

  /**
   * Обновить статус мероприятия
   */
  updateEventStatus: async (eventId, status) => {
    try {
      const response = await api.patch(`${EVENTS_BASE_URL}${eventId}/`, {
        status: status
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления статуса:', error);
      throw error;
    }
  },

  /**
   * Получить документы мероприятия
   */
  getEventDocuments: async (eventId) => {
    try {
      const response = await api.get(`${EVENTS_BASE_URL}${eventId}/documents/`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки документов:', error);
      throw error;
    }
  },

  /**
   * Загрузить документ мероприятия
   */
  uploadEventDocument: async (eventId, formData, onProgress) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${eventId}/upload-document/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки документа:', error);
      throw error;
    }
  },

  /**
   * Удалить документ мероприятия
   */
  deleteEventDocument: async (eventId, documentId) => {
    try {
      const response = await api.delete(`${EVENTS_BASE_URL}${eventId}/documents/${documentId}/`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка удаления документа:', error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте updateEventRoles
   */
  getOrganizers: async (eventId) => {
    try {
      const response = await api.get(`${EVENTS_BASE_URL}${eventId}/organizers/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки организаторов мероприятия ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте updateEventRoles
   */
  addOrganizers: async (eventId, userIds) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${eventId}/add_organizers/`, {
        user_ids: userIds
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка добавления организаторов в мероприятие ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте updateEventRoles
   */
  removeOrganizer: async (eventId, userId) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${eventId}/remove_organizer/`, {
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка удаления организатора из мероприятия ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте updateEventRoles
   */
  getPlenaryModerators: async (eventId) => {
    try {
      const response = await api.get(`${EVENTS_BASE_URL}${eventId}/plenary_moderators/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки модераторов пленарного заседания ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте updateEventRoles
   */
  addPlenaryModerators: async (eventId, userIds) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${eventId}/add_plenary_moderators/`, {
        user_ids: userIds
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка добавления модераторов в пленарное заседание ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте updateEventRoles
   */
  removePlenaryModerator: async (eventId, userId) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${eventId}/remove_plenary_moderator/`, {
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка удаления модератора из пленарного заседания ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Единый метод для массового обновления всех ролей
   */
  updateEventRoles: async (eventId, roleData) => {
    try {
      const backendData = {
        add_organizers: roleData.addOrganizers || [],
        remove_organizers: roleData.removeOrganizers || [],
        add_plenary_moderators: roleData.addPlenaryModerators || [],
        remove_plenary_moderators: roleData.removePlenaryModerators || [],
        add_section_moderators: roleData.addSectionModerators || {},
        remove_section_moderators: roleData.removeSectionModerators || {}
      };

      const response = await api.post(
        `${EVENTS_BASE_URL}${eventId}/update_roles/`,
        backendData
      );

      return response.data;
    } catch (error) {
      console.error('❌ Ошибка массового обновления ролей:', error);
      throw error;
    }
  }
};


// ============================================
// 🔥 API ДЛЯ СЕКЦИЙ
// ============================================

export const sectionsAPI = {
  /**
   * Получить список секций мероприятия
   */
  getSections: async (eventId) => {
    try {
      const response = await api.get(SECTIONS_BASE_URL, { params: { event: eventId } });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки секций:', error);
      throw error;
    }
  },

  /**
   * Создать новую секцию
   */
  createSection: async (sectionData) => {
    try {
      const response = await api.post(SECTIONS_BASE_URL, sectionData);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка создания секции:', error);
      throw error;
    }
  },

  /**
   * Получить детали секции по ID
   */
  getSectionById: async (id) => {
    try {
      const response = await api.get(`${SECTIONS_BASE_URL}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки секции ${id}:`, error);
      throw error;
    }
  },

  /**
   * Обновить секцию
   */
  updateSection: async (id, sectionData) => {
    try {
      console.log('🔄 Обновление секции:', sectionData);
      const response = await api.put(`${SECTIONS_BASE_URL}${id}/`, sectionData);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка обновления секции ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удалить секцию
   */
  deleteSection: async (id) => {
    try {
      const response = await api.delete(`${SECTIONS_BASE_URL}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка удаления секции ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получить список выступающих в секции
   */
  getSectionSpeakers: async (id) => {
    try {
      const response = await api.get(`${SECTIONS_BASE_URL}${id}/speakers/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки выступающих секции ${id}:`, error);
      throw error;
    }
  },

  /**
   * Получить материалы секции
   */
  getSectionMaterials: async (id) => {
    try {
      const response = await api.get(`${SECTIONS_BASE_URL}${id}/materials/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки материалов секции ${id}:`, error);
      throw error;
    }
  },

  /**
   * Сохранить ссылку на конференцию секции
   */
  saveSectionConferenceLink: async (sectionId, conferenceLink) => {
    try {
      const response = await api.patch(`${SECTIONS_BASE_URL}${sectionId}/`, {
        conference_link: conferenceLink
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка сохранения ссылки секции:', error);
      throw error;
    }
  },

  /**
   * Удалить ссылку на конференцию секции
   */
  clearSectionConferenceLink: async (sectionId) => {
    try {
      const response = await api.patch(`${SECTIONS_BASE_URL}${sectionId}/`, {
        conference_link: null
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка удаления ссылки секции:', error);
      throw error;
    }
  },

  /**
   * 🔥 Загрузить изображение для обложки секции
   */
  uploadCoverImage: async (sectionId, formData, onProgress) => {
    try {
      const response = await api.post(`${SECTIONS_BASE_URL}${sectionId}/upload-cover/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки изображения секции:', error);
      throw error;
    }
  },

  /**
   * 🔥 Обновить список изображений обложки секции
   */
  updateCoverImages: async (sectionId, images) => {
    try {
      const response = await api.patch(`${SECTIONS_BASE_URL}${sectionId}/update-cover-images/`, {
        cover_images: images
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления изображений секции:', error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте eventsAPI.updateEventRoles
   */
  getModerators: async (sectionId) => {
    try {
      const response = await api.get(`${SECTIONS_BASE_URL}${sectionId}/moderators/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки модераторов секции ${sectionId}:`, error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте eventsAPI.updateEventRoles
   */
  addModerators: async (sectionId, userIds) => {
    try {
      const response = await api.post(`${SECTIONS_BASE_URL}${sectionId}/add_moderators/`, {
        user_ids: userIds
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка добавления модераторов в секцию ${sectionId}:`, error);
      throw error;
    }
  },

  /**
   * @deprecated Используйте eventsAPI.updateEventRoles
   */
  removeModerator: async (sectionId, userId) => {
    try {
      const response = await api.post(`${SECTIONS_BASE_URL}${sectionId}/remove_moderator/`, {
        user_id: userId
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка удаления модератора из секции ${sectionId}:`, error);
      throw error;
    }
  }
};

// ============================================
// API ДЛЯ УЧАСТНИКОВ
// ============================================

export const participantsAPI = {
  /**
   * Получить участников с возможностью исключить создателя
   */
  getParticipants: async (params = {}) => {
    try {
      const response = await api.get(PARTICIPANTS_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки участников:', error);
      throw error;
    }
  },

  /**
   * Получить потенциальных организаторов
   */
  getPotentialOrganizers: async (eventId) => {
    try {
      const response = await api.get('/conferences/participants/potential_organizers/', {
        params: { event: eventId }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки потенциальных организаторов:', error);
      throw error;
    }
  },

  /**
   * Получить потенциальных модераторов
   */
  getPotentialModerators: async (eventId, sectionId = null) => {
    try {
      const params = { event: eventId };
      if (sectionId) {
        params.section = sectionId;
      }
      const response = await api.get('/conferences/participants/potential_moderators/', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки потенциальных модераторов:', error);
      throw error;
    }
  },

  /**
   * Загрузить файл для заявки на участие
   */
  uploadParticipationFile: async (eventId, file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `${EVENTS_BASE_URL}${eventId}/upload-participation-file/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки файла:', error);
      throw error;
    }
  },

  /**
   * Подать заявку на участие
   */
  participate: async (eventId, participationData) => {
    try {
      const response = await api.post(`${EVENTS_BASE_URL}${eventId}/participate/`, participationData);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка подачи заявки:', error);
      throw error;
    }
  },

  /**
   * Обновить существующее участие (с умной логикой)
   */
  updateParticipant: async (participantId, data) => {
    try {
      const response = await api.patch(`${PARTICIPANTS_BASE_URL}${participantId}/update_participation/`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления участия:', error);
      throw error;
    }
  },

  /**
   * Одобрить заявку
   */
  approveParticipant: async (participantId, comment = '') => {
    try {
      const response = await api.post(`${PARTICIPANTS_BASE_URL}${participantId}/approve/`, { comment });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка одобрения заявки ${participantId}:`, error);
      throw error;
    }
  },

  /**
   * Отклонить заявку
   */
  rejectParticipant: async (participantId, comment = '') => {
    try {
      const response = await api.post(`${PARTICIPANTS_BASE_URL}${participantId}/reject/`, { comment });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка отклонения заявки ${participantId}:`, error);
      throw error;
    }
  },

  /**
   * Отменить своё участие
   */
  cancelParticipation: async (participantId) => {
    try {
      const response = await api.post(`${PARTICIPANTS_BASE_URL}${participantId}/cancel/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка отмены участия ${participantId}:`, error);
      throw error;
    }
  },

  /**
   * Массовое обновление порядка докладчиков
   */
  bulkUpdateSpeakerOrder: async (items) => {
    try {
      console.log('🔄 Массовое обновление порядка докладчиков:', items);
      const response = await api.post('/conferences/participants/bulk-update-speaker-order/', items);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления порядка докладчиков:', error);
      throw error;
    }
  }
};

// ============================================
// API ДЛЯ НОВОСТЕЙ
// ============================================

let newsCache = {
  data: null,
  timestamp: null,
  page: 1,
  hasMore: true
};

const NEWS_CACHE_DURATION = 5 * 60 * 1000;

export const newsAPI = {
  getNews: async (params = {}) => {
    try {
      const response = await api.get(NEWS_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки новостей:', error);
      throw error;
    }
  },

  getAllNewsPaginated: async (page = 1, pageSize = 15, forceRefresh = false) => {
    try {
      if (!forceRefresh && page === 1 && newsCache.data && newsCache.timestamp) {
        const now = Date.now();
        if (now - newsCache.timestamp < NEWS_CACHE_DURATION) {
          return {
            results: newsCache.data,
            page: newsCache.page,
            hasMore: newsCache.hasMore
          };
        }
      }

      const response = await api.get(NEWS_BASE_URL, {
        params: {
          page: page,
          page_size: pageSize,
          ordering: '-created_at'
        }
      });

      let results = response.data.results || response.data;
      const hasMore = results.length === pageSize;

      if (page === 1) {
        newsCache = {
          data: results,
          timestamp: Date.now(),
          page: 1,
          hasMore: hasMore
        };
      }

      return {
        results,
        page,
        hasMore
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки всех новостей:', error);
      throw error;
    }
  },

  clearNewsCache: () => {
    newsCache = {
      data: null,
      timestamp: null,
      page: 1,
      hasMore: true
    };
  },

  loadNextPage: async (currentPage, pageSize = 15) => {
    const nextPage = currentPage + 1;
    return await newsAPI.getAllNewsPaginated(nextPage, pageSize, true);
  },

  getNewsById: async (id) => {
    try {
      const response = await api.get(`${NEWS_BASE_URL}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки новости ${id}:`, error);
      throw error;
    }
  },

  createNews: async (formData) => {
    try {
      if (!(formData instanceof FormData)) {
        throw new Error('createNews ожидает FormData');
      }

      const response = await api.post(NEWS_BASE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Ошибка создания новости:', error);
      throw error;
    }
  },

  updateNews: async (id, newsData) => {
    try {
      const response = await api.patch(`${NEWS_BASE_URL}${id}/`, newsData);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка обновления новости ${id}:`, error);
      throw error;
    }
  },

  deleteNews: async (id) => {
    try {
      const response = await api.delete(`${NEWS_BASE_URL}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка удаления новости ${id}:`, error);
      throw error;
    }
  },

  incrementView: async (id) => {
    try {
      const response = await api.post(`${NEWS_BASE_URL}${id}/increment-view/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка увеличения просмотров новости ${id}:`, error);
      throw error;
    }
  },

  likeNews: async (id) => {
    try {
      const response = await api.post(`${NEWS_BASE_URL}${id}/like/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка лайка новости ${id}:`, error);
      throw error;
    }
  },

  unlikeNews: async (id) => {
    try {
      const response = await api.post(`${NEWS_BASE_URL}${id}/unlike/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка при снятии лайка новости ${id}:`, error);
      throw error;
    }
  },

  uploadMedia: async (newsId, file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        `${NEWS_BASE_URL}${newsId}/upload-media/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки медиа:', error);
      throw error;
    }
  },

  deleteMedia: async (newsId, mediaId) => {
    try {
      const response = await api.delete(`${NEWS_BASE_URL}${newsId}/media/${mediaId}/`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка удаления медиа:', error);
      throw error;
    }
  },

  getMedia: async (newsId) => {
    try {
      const news = await api.get(`${NEWS_BASE_URL}${newsId}/`);
      return news.data.media || [];
    } catch (error) {
      console.error(`❌ Ошибка загрузки медиа новости ${newsId}:`, error);
      throw error;
    }
  }
};

// frontend/src/services/eventsAPI.js
// ============================================
// 🔥 ОБНОВЛЕННЫЙ API ДЛЯ МАТЕРИАЛОВ
// ============================================

export const materialsAPI = {
  // 🔥 КЕШ ПЕРЕНОСИМ ВНУТРЬ ОБЪЕКТА
  _cache: {
    data: null,
    timestamp: null,
    page: 1,
    hasMore: true
  },

  _CACHE_DURATION: 5 * 60 * 1000, // 5 минут

  /**
   * Получить материалы с фильтрацией
   * @param {Object} params - параметры фильтрации
   */
  getMaterials: async (params = {}) => {
    try {
      const response = await api.get(MATERIALS_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки материалов:', error);
      throw error;
    }
  },

  /**
   * Получить материалы с пагинацией (для главной страницы)
   * @param {number} page - номер страницы
   * @param {number} pageSize - размер страницы
   * @param {Object} filters - фильтры (event, section, is_plenary)
   * @param {boolean} forceRefresh - игнорировать кеш
   */
  getAllMaterialsPaginated: async function(page = 1, pageSize = 10, filters = {}, forceRefresh = false) {
    try {
      // Проверяем кеш только для первой страницы без фильтров
      if (!forceRefresh && page === 1 && !filters.section && !filters.event && this._cache && this._cache.data && this._cache.timestamp) {
        const now = Date.now();
        if (now - this._cache.timestamp < this._CACHE_DURATION) {
          console.log('📦 Использую кеш материалов');
          return {
            results: this._cache.data,
            page: this._cache.page,
            hasMore: this._cache.hasMore
          };
        }
      }

      console.log(`🌐 Загрузка страницы ${page} материалов...`, filters);

      // Формируем параметры запроса
      const params = {
        page: page,
        page_size: pageSize,
        ...filters
      };

      const response = await api.get(MATERIALS_BASE_URL, { params });

      let results = response.data.results || response.data;
      const hasMore = results.length === pageSize;

      // Обновляем кеш для первой страницы без фильтров
      if (page === 1 && !filters.section && !filters.event) {
        this._cache = {
          data: results,
          timestamp: Date.now(),
          page: 1,
          hasMore: hasMore
        };
      }

      return {
        results,
        page,
        hasMore
      };
    } catch (error) {
      console.error('❌ Ошибка загрузки материалов с пагинацией:', error);
      throw error;
    }
  },

 // frontend/src/services/eventsAPI.js

/**
 * Получить материалы для пленарных докладчиков (для главной)
 * @param {number} page - номер страницы
 * @param {number} pageSize - размер страницы
 */

getPlenaryMaterials: async function(eventId, page = 1, pageSize = 10) {
  try {
    console.log(`📡 Загрузка пленарных материалов для мероприятия ${eventId}, страница ${page}, размер ${pageSize}`);

    // 1. Получаем всех пленарных докладчиков ТОЛЬКО для указанного мероприятия
    const speakersResponse = await api.get('/conferences/participants/', {
      params: {
        event: eventId,
        is_plenary: true,
        status: 'approved',
        participation_type: 'speaker',
        page: 1,
        page_size: 100
      }
    });

    const plenarySpeakers = speakersResponse.data.results || speakersResponse.data;

    if (!plenarySpeakers.length) {
      console.log('ℹ️ Нет пленарных докладчиков для мероприятия', eventId);
      return { results: [], page: 1, hasMore: false, totalCount: 0 };
    }

    console.log(`📦 Найдено ${plenarySpeakers.length} пленарных докладчиков для мероприятия ${eventId}`);

    // 2. Получаем реальные материалы из SpeakerMaterial для этих докладчиков
    const speakerIds = plenarySpeakers.map(s => s.id);

    // Показываем информацию о каждом докладчике
    plenarySpeakers.forEach(speaker => {
      console.log(`   👤 Докладчик ID ${speaker.id}: ${speaker.user?.full_name || 'Без имени'}, файлов: ${speaker.uploaded_files?.length || 0}, проект: ${speaker.project ? 'да' : 'нет'}`);
    });

    const materialsResponse = await api.get(MATERIALS_BASE_URL, {
      params: {
        participant__in: speakerIds.join(','),
        page: 1,
        page_size: 100
      }
    });

    const realMaterials = materialsResponse.data.results || materialsResponse.data;
    console.log(`📦 Найдено ${realMaterials.length} реальных материалов из SpeakerMaterial`);

    // 3. Создаем карточки для ВСЕХ докладчиков
    const allSpeakerCards = plenarySpeakers.map(speaker => {
      // Проверяем, есть ли реальные материалы для этого докладчика
      const speakerRealMaterials = realMaterials.filter(m => m.participant === speaker.id);

      // Базовая карточка докладчика
      return {
        id: `speaker-${speaker.id}`,
        participant: speaker,
        files: speakerRealMaterials.length > 0 ? speakerRealMaterials[0].files : [],
        materials: speakerRealMaterials,
        uploaded_files: speaker.uploaded_files || [],
        hasProject: !!(speaker.project),
        participant_details: {
          id: speaker.id,
          full_name: speaker.user?.full_name ||
                    `${speaker.user?.first_name || ''} ${speaker.user?.last_name || ''}`.trim() ||
                    'Докладчик',
          talk_title: speaker.talk_title,
          project: speaker.project
        }
      };
    });

    console.log(`📦 Создано ${allSpeakerCards.length} карточек докладчиков для мероприятия ${eventId}`);

    // 4. Применяем пагинацию
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedResults = allSpeakerCards.slice(start, end);
    const hasMore = end < allSpeakerCards.length;

    console.log(`📦 Результаты для страницы ${page}: ${paginatedResults.length} карточек, hasMore: ${hasMore}, всего: ${allSpeakerCards.length}`);

    return {
      results: paginatedResults,
      page,
      hasMore,
      totalCount: allSpeakerCards.length
    };

  } catch (error) {
    console.error('❌ Ошибка загрузки пленарных материалов:', error);
    throw error;
  }
},

  /**
   * Получить материалы для конкретной секции
   * @param {number} sectionId - ID секции
   * @param {number} page - номер страницы
   * @param {number} pageSize - размер страницы
   */
  getSectionMaterials: async function(sectionId, page = 1, pageSize = 10) {
    try {
      // Получаем всех докладчиков секции
      const speakersResponse = await api.get('/conferences/participants/', {
        params: {
          section: sectionId,
          status: 'approved',
          participation_type: 'speaker',
          page: 1,
          page_size: 100
        }
      });

      const sectionSpeakers = speakersResponse.data.results || speakersResponse.data;

      if (!sectionSpeakers.length) {
        return { results: [], page: 1, hasMore: false };
      }

      // Получаем материалы для этих докладчиков
      const speakerIds = sectionSpeakers.map(s => s.id);
      const materialsResponse = await api.get(MATERIALS_BASE_URL, {
        params: {
          participant__in: speakerIds.join(','),
          page: page,
          page_size: pageSize
        }
      });

      const results = materialsResponse.data.results || materialsResponse.data;
      const hasMore = results.length === pageSize;

      return {
        results,
        page,
        hasMore
      };
    } catch (error) {
      console.error(`❌ Ошибка загрузки материалов секции ${sectionId}:`, error);
      throw error;
    }
  },

  /**
   * Получить материалы конкретного участника
   * @param {number} participantId - ID участника
   */
  getParticipantMaterials: async function(participantId) {
    try {
      const response = await api.get(MATERIALS_BASE_URL, {
        params: {
          participant: participantId
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки материалов участника ${participantId}:`, error);
      throw error;
    }
  },

  /**
   * Загрузить материал
   */
  createMaterial: async function(materialData) {
    try {
      const response = await api.post(MATERIALS_BASE_URL, materialData);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки материала:', error);
      throw error;
    }
  },

  /**
   * Обновить материал
   */
  updateMaterial: async function(id, materialData) {
    try {
      const response = await api.put(`${MATERIALS_BASE_URL}${id}/`, materialData);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка обновления материала ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удалить материал
   */
  deleteMaterial: async function(id) {
    try {
      const response = await api.delete(`${MATERIALS_BASE_URL}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка удаления материала ${id}:`, error);
      throw error;
    }
  },

  /**
   * Очистить кеш материалов
   */
  clearMaterialsCache: function() {
    console.log('🧹 Очистка кеша материалов');
    this._cache = {
      data: null,
      timestamp: null,
      page: 1,
      hasMore: true
    };
  }
};

// ============================================
// API ДЛЯ ПРОГРАММЫ МЕРОПРИЯТИЯ
// ============================================

export const scheduleAPI = {
  /**
   * Получить программу мероприятия
   */
  getSchedule: async (params = {}) => {
    try {
      const response = await api.get('/conferences/schedule/', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки программы:', error);
      throw error;
    }
  },

  /**
   * Получить конкретный пункт программы по ID
   */
  getScheduleItem: async (id) => {
    try {
      const response = await api.get(`/conferences/schedule/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки пункта программы ${id}:`, error);
      throw error;
    }
  },

  /**
   * Создать новый пункт программы
   */
  createScheduleItem: async (data) => {
    try {
      console.log('📝 Создание пункта программы:', data);
      const response = await api.post('/conferences/schedule/', data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка создания пункта программы:', error);
      throw error;
    }
  },

  /**
   * Обновить пункт программы
   */
  updateScheduleItem: async (id, data) => {
    try {
      console.log(`🔄 Обновление пункта программы ${id}:`, data);
      const response = await api.patch(`/conferences/schedule/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка обновления пункта программы ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удалить пункт программы
   */
  deleteScheduleItem: async (id) => {
    try {
      console.log(`🗑️ Удаление пункта программы ${id}`);
      const response = await api.delete(`/conferences/schedule/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка удаления пункта программы ${id}:`, error);
      throw error;
    }
  },

  /**
   * Массовое обновление порядка пунктов (для drag-and-drop)
   */
  bulkUpdateOrder: async (items) => {
    try {
      console.log('🔄 Массовое обновление порядка:', items);
      const response = await api.post('/conferences/schedule/bulk-update-order/', items);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления порядка:', error);
      throw error;
    }
  },

  /**
   * Получить докладчиков для пленарного заседания
   */
  getPlenarySpeakers: async (eventId) => {
    try {
      const response = await api.get('/conferences/participants/', {
        params: {
          event: eventId,
          status: 'approved',
          participation_type: 'speaker',
          is_plenary: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки пленарных докладчиков:', error);
      throw error;
    }
  },

  /**
   * Получить докладчиков для секции
   */
  getSectionSpeakers: async (sectionId) => {
    try {
      const response = await api.get('/conferences/participants/', {
        params: {
          section: sectionId,
          status: 'approved',
          participation_type: 'speaker'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Ошибка загрузки докладчиков секции ${sectionId}:`, error);
      throw error;
    }
  }
};