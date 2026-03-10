// frontend/src/pages/SectionDetailPage.js
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
  Tooltip,
  Avatar,
  AvatarGroup
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Импорт компонентов
import SectionHeader from '../components/Events/SectionHeader';
import EventNewsCarousel from '../components/Events/EventNewsCarousel';
import EventInfoBlock from '../components/Events/EventInfoBlock';
import EventMaterialsCarousel from '../components/Events/EventMaterialsCarousel';
import EventProgramModal from '../components/Events/EventProgramModal';
import ConferenceJitsi from '../components/Events/ConferenceJitsi';
import EventParticipantsModal from '../components/Events/EventParticipantsModal';

// API
import { sectionsAPI, newsAPI, materialsAPI, participantsAPI } from '../services/eventsAPI';

const SectionDetailPage = () => {
  const { eventId, sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Состояния
  const [section, setSection] = useState(null);
  const [news, setNews] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialsTotal, setMaterialsTotal] = useState(0);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState(null);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Состояние для модалки программы
  const [programModalOpen, setProgramModalOpen] = useState(false);

  // Состояния для конференции
  const [conferenceModalOpen, setConferenceModalOpen] = useState(false);
  const [conferenceLink, setConferenceLink] = useState(null);

  // Состояние для модалки докладчиков
  const [speakersModalOpen, setSpeakersModalOpen] = useState(false);

  // Уведомления
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Загрузка данных
  useEffect(() => {
    fetchSectionData();
  }, [sectionId]);

  // Загрузка материалов после получения секции
  useEffect(() => {
    if (section?.id) {
      fetchMaterials();
    }
  }, [section]);

  const fetchSectionData = async () => {
    setLoading(true);
    try {
      // Загружаем информацию о секции
      const sectionData = await sectionsAPI.getSectionById(sectionId);
      console.log('📦 Загружена секция:', sectionData);
      setSection(sectionData);
      setConferenceLink(sectionData.conference_link);

      // Загрузка новостей секции
      const newsData = await newsAPI.getNews({ section: sectionId });
      console.log('📦 Загружены новости:', newsData);
      setNews(Array.isArray(newsData) ? newsData : []);

      // Загружаем выступающих
      const speakersData = await sectionsAPI.getSectionSpeakers(sectionId);
      console.log('📦 Загружены докладчики:', speakersData);
      setSpeakers(speakersData);

    } catch (err) {
      console.error('❌ Ошибка загрузки секции:', err);
      setError('Не удалось загрузить данные секции');
      showNotification('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка материалов докладчиков секции
  const fetchMaterials = async () => {
    if (!section?.id) return;

    setMaterialsLoading(true);
    setMaterialsError(null);

    try {
      console.log('📡 Загружаем материалы для секции:', sectionId);

      // Сначала получаем всех докладчиков секции
      const speakersData = await sectionsAPI.getSectionSpeakers(sectionId);
      console.log('👥 Докладчики секции:', speakersData);

      if (!speakersData || speakersData.length === 0) {
        console.log('ℹ️ Нет докладчиков в секции');
        setMaterials([]);
        setMaterialsTotal(0);
        setMaterialsLoading(false);
        return;
      }

      // Получаем ID докладчиков
      const speakerIds = speakersData.map(s => s.id);
      console.log('🆔 ID докладчиков:', speakerIds);

      // Загружаем материалы для этих докладчиков
      const response = await materialsAPI.getAllMaterialsPaginated(1, 100, {
        participant__in: speakerIds.join(',')
      });

      console.log('📦 Получены материалы:', response);

      // Создаем виртуальные папки для всех докладчиков
      const materialsList = response.results || [];

      const folders = speakersData.map(speaker => {
        // Ищем материалы для этого докладчика
        const speakerMaterials = materialsList.filter(m => m.participant === speaker.id);

        return {
          id: `speaker-${speaker.id}`,
          participant: speaker,
          files: speakerMaterials.length > 0 ? speakerMaterials[0].files : [],
          materials: speakerMaterials,
          uploaded_files: speaker.uploaded_files || [],
          hasProject: !!(speaker.project)
        };
      });

      console.log('📁 Создано папок:', folders.length);
      setMaterials(folders);
      setMaterialsTotal(folders.length);

    } catch (err) {
      console.error('❌ Ошибка загрузки материалов секции:', err);
      setMaterialsError('Не удалось загрузить материалы');
    } finally {
      setMaterialsLoading(false);
    }
  };

  // Функция для обновления новостей
  const refreshNews = async () => {
    try {
      const newsData = await newsAPI.getNews({ section: sectionId });
      setNews(Array.isArray(newsData) ? newsData : []);
    } catch (err) {
      console.error('❌ Ошибка обновления новостей:', err);
    }
  };

  // Функция для обновления докладчиков
  const refreshSpeakersFromServer = async () => {
    try {
      console.log('🔄 Обновляем данные докладчиков...');
      const speakersData = await sectionsAPI.getSectionSpeakers(sectionId);
      setSpeakers(speakersData);
      return speakersData;
    } catch (err) {
      console.error('❌ Ошибка обновления докладчиков:', err);
      return [];
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

  // Обработчики для секции
  const handleEdit = () => {
    // Будет реализовано в модальном окне
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить секцию?')) {
      try {
        await sectionsAPI.deleteSection(sectionId);
        showNotification('Секция удалена');
        setTimeout(() => navigate(`/events/${eventId}`), 1500);
      } catch (err) {
        console.error('❌ Ошибка удаления секции:', err);
        showNotification('Ошибка при удалении', 'error');
      }
    }
  };

  // Обработчики для конференции
  const handleCreateConference = () => {
    setConferenceModalOpen(true);
  };

  const handleConferenceCreated = async (link) => {
    setConferenceLink(link);
    setSection(prev => ({ ...prev, conference_link: link }));
    if (link) {
      showNotification('Конференция создана');
    }
  };

  const handleShowProgram = () => {
    setProgramModalOpen(true);
  };

  const handleProgramUpdate = () => {
    console.log('Программа секции обновлена');
  };

  // Обработчик открытия модалки докладчиков
  const handleShowSpeakers = () => {
    setSpeakersModalOpen(true);
  };

  // ПРАВА ДОСТУПА
  const isCreator = section?.event_created_by?.id === user?.id;
  const isOrganizer = section?.event_organizers?.some(org => org.id === user?.id) || false;
  const isSectionModerator = section?.moderators?.some(mod => mod.id === user?.id) || false;

  const canEditSection = isCreator || isOrganizer || isSectionModerator;
  const canCreateNews = isCreator || isOrganizer || isSectionModerator;
  const canEditCover = isCreator || isOrganizer || isSectionModerator;
  const canManageConference = isCreator || isOrganizer || isSectionModerator;
  const canManageApplications = isCreator || isOrganizer || isSectionModerator;

  // Функция для получения инициалов
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Загрузка секции...</Typography>
      </Container>
    );
  }

  if (error || !section) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Секция не найдена'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/events/${eventId}`)}
          sx={{ mt: 2 }}
        >
          К мероприятию
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 6 }}>
      {/* Хлебные крошки */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(`/events/${eventId}`)}>
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
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate(`/events/${eventId}`)}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {section.event_title}
          </Link>
          <Typography color="text.primary">{section.title}</Typography>
        </Breadcrumbs>
      </Box>

      {/* ШАПКА СЕКЦИИ */}
      <SectionHeader
        section={section}
        speakers={speakers}
        isCreator={isCreator}
        isOrganizer={isOrganizer}
        isSectionModerator={isSectionModerator}
        canEditCover={canEditCover}
        canManageConference={canManageConference}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onVideoConference={handleCreateConference}
        onShowProgram={handleShowProgram}
        onSpeakersClick={handleShowSpeakers}
      />

      {/* БЛОК ДОКЛАДЧИКОВ - кликабельный */}
      {speakers.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            mt: 2,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={handleShowSpeakers}
        >
          <Typography variant="body2" color="text.secondary">
            Докладчики:
          </Typography>
          <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.75rem' } }}>
            {speakers.slice(0, 5).map(s => {
              const firstName = s.user?.first_name || s.first_name || '';
              const lastName = s.user?.last_name || s.last_name || '';
              const fullName = s.name || `${firstName} ${lastName}`.trim() || 'Докладчик';
              const avatarUrl = s.user?.avatar || s.avatar;

              return (
                <Tooltip key={s.id} title={fullName}>
                  <Avatar src={avatarUrl} sx={{ bgcolor: 'primary.dark' }}>
                    {getInitials(firstName, lastName)}
                  </Avatar>
                </Tooltip>
              );
            })}
          </AvatarGroup>
          {speakers.length > 5 && (
            <Typography variant="caption" color="text.secondary">
              +{speakers.length - 5}
            </Typography>
          )}
        </Box>
      )}

      {/* НОВОСТИ СЕКЦИИ */}
      <EventNewsCarousel
        news={news}
        eventId={parseInt(eventId)}
        sections={[section]}
        currentSectionId={parseInt(sectionId)}
        canCreateNews={canCreateNews}
        onNewsUpdate={refreshNews}
      />

      {/* ИНФОРМАЦИЯ О СЕКЦИИ */}
      <EventInfoBlock
        title="О СЕКЦИИ"
        content={section.about}
        icon="info"
        sectionId={section.id}
        canEdit={canEditSection}
        onUpdate={fetchSectionData}
      />

      {/* МАТЕРИАЛЫ ДОКЛАДЧИКОВ СЕКЦИИ */}
      <EventMaterialsCarousel
        materials={materials}
        eventId={parseInt(eventId)}
        sectionId={parseInt(sectionId)}
        totalCount={materialsTotal}
        loading={materialsLoading}
        error={materialsError}
        title="МАТЕРИАЛЫ ДОКЛАДЧИКОВ"
      />

      {/* Модальное окно программы */}
      <EventProgramModal
        open={programModalOpen}
        onClose={() => setProgramModalOpen(false)}
        eventId={parseInt(eventId)}
        eventTitle={section.event_title}
        eventStartDate={section.event_start_date}
        eventEndDate={section.event_end_date}
        sections={section.event?.sections || []}
        currentSectionId={parseInt(sectionId)}
        canEditProgram={canEditSection}
        onProgramUpdate={handleProgramUpdate}
        userRoles={{
          isCreator,
          isOrganizer,
          isPlenaryModerator: false,
          isSectionModerator: (id) => id === parseInt(sectionId) && isSectionModerator,
          sectionModerators: isSectionModerator ? [parseInt(sectionId)] : []
        }}
      />

      {/* Модальное окно конференции */}
      <ConferenceJitsi
        open={conferenceModalOpen}
        onClose={() => setConferenceModalOpen(false)}
        eventId={parseInt(eventId)}
        sectionId={parseInt(sectionId)}
        eventTitle={section.event_title}
        sectionTitle={section.title}
        onConferenceCreated={handleConferenceCreated}
        existingLink={conferenceLink}
      />

      {/* МОДАЛЬНОЕ ОКНО ДОКЛАДЧИКОВ */}
      <EventParticipantsModal
        open={speakersModalOpen}
        onClose={() => setSpeakersModalOpen(false)}
        eventId={parseInt(eventId)}
        participants={speakers}
        canManageApplications={canManageApplications}
        onParticipantsUpdate={refreshSpeakersFromServer}
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
          sx={{ borderRadius: 2, boxShadow: 3, minWidth: 300 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SectionDetailPage;