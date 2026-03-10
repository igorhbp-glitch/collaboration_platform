// frontend/src/pages/EventDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Breadcrumbs,
  Link,
  IconButton,
  Snackbar,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Импорт компонентов
import EventHeader from '../components/Events/EventHeader';
import EventNewsCarousel from '../components/Events/EventNewsCarousel';
import EventInfoBlock from '../components/Events/EventInfoBlock';
import EventSectionsGrid from '../components/Events/EventSectionsGrid';
import EventMaterialsCarousel from '../components/Events/EventMaterialsCarousel';
import EventParticipateModal from '../components/Events/EventParticipateModal';
import EditCoverModal from '../components/Events/EditCoverModal';
import ConferenceJitsi from '../components/Events/ConferenceJitsi';
import EventProgramModal from '../components/Events/EventProgramModal';
import EditEventModal from '../components/Events/EditEventModal';

// API
import { eventsAPI, sectionsAPI, participantsAPI, newsAPI, materialsAPI } from '../services/eventsAPI';
import { projectsAPI } from '../services/api';

// Константы для типов и уровней
const EVENT_TYPES = {
  conference: { label: 'Конференция', icon: '🗣️', color: '#4361ee' },
  seminar: { label: 'Семинар', icon: '📚', color: '#3a0ca3' },
  symposium: { label: 'Симпозиум', icon: '🔬', color: '#7209b7' },
  workshop: { label: 'Воркшоп', icon: '🛠️', color: '#f72585' },
  school: { label: 'Школа', icon: '🏫', color: '#4cc9f0' },
  congress: { label: 'Конгресс', icon: '🌍', color: '#4895ef' },
  forum: { label: 'Форум', icon: '🗣️', color: '#560bad' },
  roundtable: { label: 'Круглый стол', icon: '🔄', color: '#b5179e' },
  competition: { label: 'Конкурс', icon: '🏆', color: '#f8961e' },
  festival: { label: 'Фестиваль', icon: '🎪', color: '#f94144' }
};

const EVENT_LEVELS = [
  { value: 'international', label: 'Международный', color: '#9C27B0' },
  { value: 'national', label: 'Всероссийский', color: '#2196F3' },
  { value: 'interregional', label: 'Межрегиональный', color: '#4CAF50' },
  { value: 'regional', label: 'Региональный', color: '#FF9800' },
  { value: 'university', label: 'Внутривузовский', color: '#795548' }
];

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isEventModerator, isEventParticipant } = useAuth();

  // Состояния
  const [event, setEvent] = useState(null);
  const [sections, setSections] = useState([]);
  const [news, setNews] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialsTotal, setMaterialsTotal] = useState(0);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [likedNews, setLikedNews] = useState({});

  // Модальные окна
  const [participateModalOpen, setParticipateModalOpen] = useState(false);
  const [editCoverModalOpen, setEditCoverModalOpen] = useState(false);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [conferenceModalOpen, setConferenceModalOpen] = useState(false);
  const [conferenceLink, setConferenceLink] = useState(null);
  const [conferenceForSection, setConferenceForSection] = useState(null);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);

  // Уведомления
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Состояния для карусели обложки
  const [coverImages, setCoverImages] = useState([]);

  // Загрузка данных
  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchEventData();
      fetchUserProjects();
    } else {
      setError('Некорректный ID мероприятия');
      setLoading(false);
    }
  }, [id]);

  // Загрузка материалов после получения event
  useEffect(() => {
    if (event?.id) {
      fetchMaterials();
    }
  }, [event]);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      const eventData = await eventsAPI.getEventById(id);
      setEvent(eventData);

      if (eventData.cover_images && eventData.cover_images.length > 0) {
        setCoverImages(eventData.cover_images);
      }

      if (eventData.conference_link) {
        setConferenceLink(eventData.conference_link);
      }

      if (eventData.has_sections) {
        const sectionsData = await sectionsAPI.getSections(id);
        setSections(sectionsData);
      }

      const newsData = await newsAPI.getNews({ event: id });
      setNews(Array.isArray(newsData) ? newsData : []);

      const participantsData = await participantsAPI.getParticipants({ event: id });
      setParticipants(Array.isArray(participantsData) ? participantsData : []);

    } catch (err) {
      console.error('❌ Ошибка загрузки мероприятия:', err);
      setError('Не удалось загрузить данные мероприятия');
      showNotification('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProjects = async () => {
    try {
      const projectsData = await projectsAPI.getAll();
      const userProjectsList = projectsData.filter(p =>
        p.owner?.id === user?.id || p.members?.some(m => m.id === user?.id)
      );
      setUserProjects(userProjectsList);
    } catch (err) {
      console.error('❌ Ошибка загрузки проектов пользователя:', err);
    }
  };


const refreshParticipantsFromServer = async () => {
  try {
    console.log('🔄 EventDetailPage: запрашиваем свежие данные участников...');
    const participantsData = await participantsAPI.getParticipants({ event: id });

    console.log('📦 Полученные данные:', participantsData);

    // Убеждаемся, что данные - массив
    const newParticipantsArray = Array.isArray(participantsData)
      ? participantsData
      : (participantsData.results || []);

    console.log('✅ EventDetailPage: получены участники:', newParticipantsArray.length);

    // 🔥 ВАЖНО: выводим первого участника для проверки
    if (newParticipantsArray.length > 0) {
      console.log('🔍 Первый участник:', newParticipantsArray[0]);
      console.log('🔍 Его секция:', newParticipantsArray[0].section);
    }

    // Маппим данные
    const mappedParticipants = newParticipantsArray.map(p => ({
      ...p,
      section: p.section ? {
        id: p.section.id,
        title: p.section.title,
        color: p.section.color,
        description: p.section.description
      } : null
    }));

    setParticipants(mappedParticipants);

    // 🔥 Возвращаем обновленные данные
    return mappedParticipants;

  } catch (err) {
    console.error('❌ Ошибка обновления участников:', err);
    showNotification('Ошибка обновления участников', 'error');
    return [];
  }
};

  const refreshNews = async () => {
    try {
      const newsData = await newsAPI.getNews({ event: id });
      setNews(Array.isArray(newsData) ? newsData : []);
    } catch (err) {
      console.error('❌ Ошибка обновления новостей:', err);
    }
  };

  const handleLikeToggle = async (newsId, e) => {
    e.stopPropagation();

    try {
      const isCurrentlyLiked = likedNews[newsId];

      setLikedNews(prev => ({
        ...prev,
        [newsId]: !isCurrentlyLiked
      }));

      setNews(prevNews =>
        prevNews.map(item => {
          if (item.id === newsId) {
            return {
              ...item,
              likes_count: isCurrentlyLiked
                ? (item.likes_count - 1)
                : (item.likes_count + 1)
            };
          }
          return item;
        })
      );

      if (isCurrentlyLiked) {
        await newsAPI.unlikeNews(newsId);
      } else {
        await newsAPI.likeNews(newsId);
      }

    } catch (err) {
      console.error('❌ Ошибка при лайке:', err);

      setLikedNews(prev => ({
        ...prev,
        [newsId]: !prev[newsId]
      }));

      setNews(prevNews =>
        prevNews.map(item => {
          if (item.id === newsId) {
            return {
              ...item,
              likes_count: likedNews[newsId]
                ? (item.likes_count + 1)
                : (item.likes_count - 1)
            };
          }
          return item;
        })
      );

      showNotification('Не удалось поставить лайк', 'error');
    }
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleParticipate = async (data) => {
    try {
      await participantsAPI.participate(id, data);
      setParticipateModalOpen(false);
      await refreshParticipantsFromServer();
      showNotification('Заявка успешно отправлена!');
    } catch (err) {
      console.error('❌ Ошибка подачи заявки:', err);
      showNotification(err.message || 'Ошибка при подаче заявки', 'error');
    }
  };

  const handleEdit = () => {
    setEditCoverModalOpen(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить мероприятие?')) {
      try {
        await eventsAPI.deleteEvent(id);
        showNotification('Мероприятие удалено');
        setTimeout(() => navigate('/events'), 1500);
      } catch (err) {
        console.error('❌ Ошибка удаления:', err);
        showNotification('Ошибка при удалении', 'error');
      }
    }
  };

  const handlePublish = async (newStatus) => {
    try {
      const updatedEvent = await eventsAPI.updateEventStatus(id, newStatus || 'published');
      setEvent(updatedEvent);
      await fetchEventData();
      showNotification(`Мероприятие ${newStatus === 'published' ? 'опубликовано' : 'обновлено'}`);
    } catch (err) {
      console.error('❌ Ошибка при обновлении статуса:', err);
      showNotification('Не удалось обновить статус', 'error');
    }
  };

  const handleCancel = async () => {
    try {
      const updatedEvent = await eventsAPI.updateEventStatus(id, 'cancelled');
      setEvent(updatedEvent);
      await fetchEventData();
      showNotification('Мероприятие отменено');
    } catch (err) {
      console.error('❌ Ошибка при отмене мероприятия:', err);
      showNotification('Не удалось отменить мероприятие', 'error');
    }
  };

  const handleCreateConference = () => {
    setConferenceForSection(null);
    setConferenceModalOpen(true);
  };

  const handleCreateSectionConference = (sectionId, sectionTitle) => {
    setConferenceForSection({ id: sectionId, title: sectionTitle });
    setConferenceModalOpen(true);
  };

  const handleJoinConference = () => {
    if (conferenceLink) {
      window.open(conferenceLink, '_blank');
    }
  };

  const handleJoinSectionConference = (link) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  const handleEndConference = async () => {
    if (!window.confirm('Вы уверены, что хотите завершить конференцию? Ссылка будет удалена.')) {
      return;
    }

    try {
      if (conferenceForSection) {
        await sectionsAPI.clearSectionConferenceLink(conferenceForSection.id);
        setSections(prev => prev.map(s =>
          s.id === conferenceForSection.id
            ? { ...s, conference_link: null }
            : s
        ));
        showNotification('Конференция секции завершена');
      } else {
        await eventsAPI.clearConferenceLink(id);
        setConferenceLink(null);
        setEvent(prev => ({ ...prev, conference_link: null }));
        await fetchEventData();
        showNotification('Конференция мероприятия завершена');
      }
    } catch (err) {
      console.error('❌ Ошибка при завершении конференции:', err);
      showNotification('Не удалось завершить конференцию', 'error');
    }
  };

  const sectionModerators = sections.reduce((acc, section) => {
      if (section.moderators?.some(m => m.id === user?.id)) {
        acc[section.id] = true;
      }
      return acc;
    }, {});
  const handleConferenceCreated = async (link) => {
    if (conferenceForSection) {
      setSections(prev => prev.map(s =>
        s.id === conferenceForSection.id
          ? { ...s, conference_link: link }
          : s
      ));
    } else {
      setConferenceLink(link);
      setEvent(prev => ({ ...prev, conference_link: link }));
      await fetchEventData();
    }

    if (link) {
      showNotification('Конференция создана');
    }
  };

  const handleShowProgram = () => {
    setProgramModalOpen(true);
  };

  const handleShowDocuments = () => {
    showNotification('Документы появятся позже', 'info');
  };

  const handleCoverSaved = (newImages) => {
    setCoverImages(newImages);
    setEvent(prev => ({ ...prev, cover_images: newImages }));
    showNotification('Обложка обновлена');
  };

  const handleProgramUpdate = () => {
    console.log('Программа обновлена');
  };

  const handleEditInfo = () => {
    setEditEventModalOpen(true);
  };

  const handleEventSaved = (updatedEvent) => {
    setEvent(updatedEvent);
    fetchEventData();
    showNotification('Информация обновлена');
  };

  // ЕДИНЫЙ ИСТОЧНИК ПРАВ
  const isCreator = event?.created_by?.id === user?.id;
  const isOrganizer = event?.organizers?.some(org => org.id === user?.id) || false;
  const isPlenaryModerator = event?.plenary_moderators?.some(m => m.id === user?.id) || false;
  const isSectionModerator = sections.some(section =>
    section.moderators?.some(m => m.id === user?.id)
  ) || false;
  const isAnyModerator = isPlenaryModerator || isSectionModerator;

  const canEditAnything = isCreator || isOrganizer || isAnyModerator;
  const canCreateNews = isCreator || isOrganizer || isPlenaryModerator;
  const canEditInfo = isCreator || isOrganizer;

  const isParticipant = isEventParticipant ? isEventParticipant(event) : false;
  const hasPendingRequest = Array.isArray(participants)
    ? participants.some(p => p.user?.id === user?.id && p.status === 'pending')
    : false;

  const typeInfo = event ? EVENT_TYPES[event.type] : null;
  const levelInfo = event ? EVENT_LEVELS.find(l => l.value === event.level) : null;

// 🔥 ОБНОВЛЕННЫЙ МЕТОД fetchMaterials

const fetchMaterials = async () => {
  if (!event?.id) {
    console.log('❌ Нет event.id');
    return;
  }

  setMaterialsLoading(true);
  setMaterialsError(null);

  try {
    console.log('📡 Загружаем пленарных докладчиков для мероприятия:', event.id);

    // Получаем всех пленарных докладчиков
    const speakersResponse = await participantsAPI.getParticipants({
      event: event.id,
      status: 'approved',
      participation_type: 'speaker',
      is_plenary: true
    });

    const plenarySpeakers = Array.isArray(speakersResponse) ? speakersResponse : [];

    if (plenarySpeakers.length === 0) {
      console.log('ℹ️ Нет пленарных докладчиков');
      setMaterials([]);
      setMaterialsTotal(0);
      setMaterialsLoading(false);
      return;
    }

    console.log(`📡 Загружаем материалы для ${plenarySpeakers.length} докладчиков`);

    // Получаем материалы для этих докладчиков
    const speakerIds = plenarySpeakers.map(s => s.id);
    const materialsResponse = await materialsAPI.getAllMaterialsPaginated(1, 100, {
      participant__in: speakerIds.join(',')
    });

    const materialsList = materialsResponse.results || [];
    console.log('📦 Пример докладчика:', plenarySpeakers[0]);
    console.log('📦 uploaded_files докладчика:', plenarySpeakers[0]?.uploaded_files);
    // Создаем виртуальные папки для всех докладчиков
    const folders = plenarySpeakers.map(speaker => {
      const speakerMaterials = materialsList.filter(m => m.participant === speaker.id);

      console.log(`   - Докладчик ID ${speaker.id}:`, {
        materialsCount: speakerMaterials.length,
        uploadedFilesCount: speaker.uploaded_files?.length || 0,
        hasProject: !!speaker.project
      });

      return {
        id: `speaker-${speaker.id}`,
        participant: speaker,
        files: speakerMaterials.length > 0 ? speakerMaterials[0].files : [],
        materials: speakerMaterials,
        // 🔥 ЯВНО ПЕРЕДАЕМ ВСЕ НУЖНЫЕ ПОЛЯ
        uploaded_files: speaker.uploaded_files || [],
        hasProject: !!(speaker.project)
      };
    });

    console.log(`✅ Создано ${folders.length} папок`);
    setMaterials(folders);
    setMaterialsTotal(folders.length);

  } catch (err) {
    console.error('❌ Ошибка в fetchMaterials:', err);
    setMaterialsError(`Ошибка: ${err.message}`);
  } finally {
    setMaterialsLoading(false);
  }

};

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Загрузка мероприятия...</Typography>
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || 'Мероприятие не найдено'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/events')}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          К списку мероприятий
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 6 }}>
      {/* Хлебные крошки */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton
          onClick={() => navigate('/events')}
          sx={{ borderRadius: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Breadcrumbs>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="small" /> Главная
          </Link>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/events')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <EventIcon fontSize="small" /> Мероприятия
          </Link>
          <Typography color="text.primary">{event.title}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Шапка мероприятия */}
      <EventHeader
        event={event}
        participants={participants}
        sections={sections}
        isCreator={isCreator}
        isPlenaryModerator={isPlenaryModerator}
        isSectionModerator={isSectionModerator}
        isAnyModerator={isAnyModerator}
        isParticipant={isParticipant}
        hasPendingRequest={hasPendingRequest}
        typeInfo={typeInfo}
        levelInfo={levelInfo}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShowProgram={handleShowProgram}
        onShowDocuments={handleShowDocuments}
        coverImages={coverImages}
        onEventUpdate={fetchEventData}
        onParticipantsUpdate={refreshParticipantsFromServer}
        conferenceLink={conferenceLink}
        onCreateConference={handleCreateConference}
        onJoinConference={handleJoinConference}
        onEndConference={handleEndConference}
        onPublish={handlePublish}
        onCancel={handleCancel}
      />

      {/* НОВОСТИ МЕРОПРИЯТИЯ */}
      <EventNewsCarousel
        news={news}
        eventId={id}
        sections={sections}
        canCreateNews={canCreateNews}
        onNewsUpdate={refreshNews}
        likedNews={likedNews}
        onLikeToggle={handleLikeToggle}
      />

      {/* БЛОК ИНФОРМАЦИИ */}
      <EventInfoBlock
        title="О МЕРОПРИЯТИИ"
        content={event.additional_info}
        icon="info"
        eventId={event.id}
        canEdit={canEditInfo}
        onUpdate={fetchEventData}
      />

      {/* Секции (если есть) */}
      {event.has_sections && sections.length > 0 && (
        <EventSectionsGrid
          sections={sections}
          eventId={id}
          isModerator={isAnyModerator}
          plenaryModerator={isPlenaryModerator}
          sectionModerators={sections.reduce((acc, section) => {
            if (section.moderators?.some(m => m.id === user?.id)) {
              acc[section.id] = true;
            }
            return acc;
          }, {})}
          onCreateConference={handleCreateSectionConference}
          onJoinConference={handleJoinSectionConference}
        />
      )}

      {/* МАТЕРИАЛЫ ПЛЕНАРНЫХ ДОКЛАДЧИКОВ - ВСЕГДА */}
      <EventMaterialsCarousel
        materials={materials}
        eventId={event.id}
        isPlenary={true}
        totalCount={materialsTotal}
        loading={materialsLoading}
        error={materialsError}
        title="МАТЕРИАЛЫ"
      />

      {/* Модальные окна */}
      <EventParticipateModal
        open={participateModalOpen}
        onClose={() => setParticipateModalOpen(false)}
        eventId={event?.id}
        eventTitle={event?.title}
        sections={sections}
        existingParticipant={null}
        mode="create"
        onSuccess={() => {
          fetchEventData();
          refreshParticipantsFromServer();
          setParticipateModalOpen(false);
        }}
      />

      <EditCoverModal
        open={editCoverModalOpen}
        onClose={() => setEditCoverModalOpen(false)}
        eventId={id}
        currentImages={coverImages}
        onSave={handleCoverSaved}
      />

      <ConferenceJitsi
        open={conferenceModalOpen}
        onClose={() => setConferenceModalOpen(false)}
        eventId={id}
        sectionId={conferenceForSection?.id}
        eventTitle={event?.title}
        sectionTitle={conferenceForSection?.title}
        onConferenceCreated={handleConferenceCreated}
        existingLink={conferenceForSection
          ? sections.find(s => s.id === conferenceForSection.id)?.conference_link
          : conferenceLink
        }
      />

      <EventProgramModal
      open={programModalOpen}
      onClose={() => setProgramModalOpen(false)}
      eventId={event?.id}
      eventTitle={event?.title}
      eventStartDate={event?.start_date}
      eventEndDate={event?.end_date}
      sections={sections}
      canEditProgram={canEditAnything}
      onProgramUpdate={handleProgramUpdate}
      userRoles={{
        isCreator,
        isOrganizer,
        isPlenaryModerator,
        isSectionModerator: (sectionId) => {
          return sectionModerators[sectionId] || false;
        },
        sectionModerators: Object.keys(sectionModerators).map(Number)
      }}
    />

      <EditEventModal
        open={editEventModalOpen}
        onClose={() => setEditEventModalOpen(false)}
        event={event}
        onSave={handleEventSaved}
      />

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            borderRadius: 2,
            boxShadow: 3,
            minWidth: 300
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EventDetailPage;