// frontend/src/pages/ProjectDetailPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Breadcrumbs,
  Link,
  Fade
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HowToRegIcon from '@mui/icons-material/HowToReg';

import api, { projectsAPI, tasksAPI, sprintsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Импортируем компоненты
import ProjectHeaderNew from '../components/Project/ProjectHeaderNew';
import ProjectDocuments from '../components/Project/ProjectDocuments';
import ProjectSprint from '../components/Project/ProjectSprint';
import ProjectHistory from '../components/Project/ProjectHistory';
import ProjectTasksTab from '../components/Project/ProjectTasksTab';
import ProjectChat from '../components/Project/ProjectChat';
import ConferenceJitsi from '../components/Project/ConferenceJitsi';
import EditProjectModal from '../components/Project/EditProjectModal';
import ProjectJoinModal from '../components/Project/ProjectJoinModal';
import ProjectMembersModal from '../components/Project/ProjectMembersModal';

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Проверка ID
  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
      navigate('/projects');
    }
  }, [id, navigate]);

  // Состояния
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalSprints: 0,
    completedSprints: 0
  });

  // Состояния для спринтов
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [sprintsLoading, setSprintsLoading] = useState(false);

  // Состояния для задач
  const [tasks, setTasks] = useState([]);

  // Состояния для чата
  const [chatOpen, setChatOpen] = useState(false);

  // Состояния для конференции
  const [conferenceOpen, setConferenceOpen] = useState(false);
  const [conferenceLink, setConferenceLink] = useState(null);

  // Состояния для диалогов
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [completeProjectDialogOpen, setCompleteProjectDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  // 🔥 Состояние для всех участников (включая pending) - доступно всем
  const [allMembers, setAllMembers] = useState([]);

  const [notification, setNotification] = useState(null);

  // ============================================
  // 🔥 ЕДИНЫЙ ИСТОЧНИК ПРАВ
  // ============================================

  const isOwner = project?.owner?.id === user?.id;

  // Текущий пользователь как участник
  const currentUserMember = useMemo(() => {
    if (!project?.members) return null;
    return project.members.find(m =>
      m.user?.id === user?.id || m.id === user?.id
    );
  }, [project, user]);

  const userRole = currentUserMember?.role;

  // Права на основе роли
  const canManageMembers = useMemo(() => {
    if (isOwner) return true;
    if (!currentUserMember || currentUserMember.status !== 'approved') return false;
    return ['product_owner', 'scrum_master'].includes(userRole) ||
           currentUserMember.can_invite_members;
  }, [isOwner, currentUserMember, userRole]);

  const canManageRoles = useMemo(() => {
    if (isOwner) return true;
    if (!currentUserMember || currentUserMember.status !== 'approved') return false;
    return ['product_owner', 'scrum_master'].includes(userRole);
  }, [isOwner, currentUserMember, userRole]);

  const canManageSprints = useMemo(() => {
    if (isOwner) return true;
    if (!currentUserMember || currentUserMember.status !== 'approved') return false;
    return ['product_owner', 'scrum_master', 'lead_researcher'].includes(userRole);
  }, [isOwner, currentUserMember, userRole]);

  const canManageTasks = useMemo(() => {
    if (isOwner) return true;
    if (!currentUserMember || currentUserMember.status !== 'approved') return false;
    return currentUserMember.can_manage_tasks ||
           ['product_owner', 'scrum_master', 'lead_researcher'].includes(userRole);
  }, [isOwner, currentUserMember, userRole]);

  // Статус заявки текущего пользователя
  const hasPendingRequest = useMemo(() => {
    if (!project?.members) return false;
    return project.members.some(m =>
      (m.user?.id === user?.id || m.id === user?.id) &&
      m.status === 'pending'
    );
  }, [project, user]);

  const isMember = useMemo(() => {
    if (!project?.members) return false;
    return project.members.some(m =>
      (m.user?.id === user?.id || m.id === user?.id) &&
      m.status === 'approved'
    );
  }, [project, user]);

  const canInteract = isOwner || isMember;

  // Для обратной совместимости
  const isCompleted = project?.status === 'completed';
  const isAuthenticated = !!user?.id;

  // ============================================
  // Функции обновления данных
  // ============================================

  const updateStats = useCallback((tasksData) => {
    const completedTasks = tasksData.filter(t => t.status === 'done').length;
    const inProgressTasks = tasksData.filter(t =>
      t.status === 'in_progress' || t.status === 'review'
    ).length;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdueTasks = tasksData.filter(task => {
      if (!task.due_date || task.status === 'done') return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < now;
    }).length;

    setStats(prev => ({
      ...prev,
      totalTasks: tasksData.length,
      completedTasks,
      inProgressTasks,
      overdueTasks
    }));
  }, []);

  const handleTaskUpdate = useCallback(async (taskId, newStatus) => {
    if (!canInteract) {
      showNotification('Только участники могут изменять задачи', 'warning');
      return;
    }

    try {
      await tasksAPI.updateTaskStatus(taskId, newStatus);

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
            : task
        )
      );

      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      updateStats(updatedTasks);

      showNotification('Статус задачи обновлен', 'success');
    } catch (error) {
      showNotification('Ошибка при обновлении задачи', 'error');
    }
  }, [tasks, updateStats, canInteract]);

  const fetchSprints = useCallback(async () => {
    if (!id || isNaN(Number(id))) return;

    setSprintsLoading(true);
    try {
      const data = await sprintsAPI.getProjectSprints(id);
      const sprintsArray = Array.isArray(data) ? data : [];
      setSprints(sprintsArray);

      let selectedSprint = null;
      const activeSprint = sprintsArray.find(s => s.status === 'active');
      if (activeSprint) {
        selectedSprint = activeSprint;
      } else {
        const planningSprint = sprintsArray.find(s => s.status === 'planning');
        if (planningSprint) {
          selectedSprint = planningSprint;
        }
      }

      setCurrentSprint(selectedSprint);

      const completedCount = sprintsArray.filter(s => s.status === 'completed').length;
      setStats(prev => ({
        ...prev,
        totalSprints: sprintsArray.length,
        completedSprints: completedCount
      }));

    } catch (error) {
      setSprints([]);
      setCurrentSprint(null);
    } finally {
      setSprintsLoading(false);
    }
  }, [id]);

  const fetchProjectData = useCallback(async () => {
    if (!id || id === 'undefined' || isNaN(Number(id))) {
      navigate('/projects');
      return;
    }

    try {
      setLoading(true);

      let projectData;
      try {
        projectData = await projectsAPI.getById(id);
      } catch (error) {
        const response = await api.get(`/projects/${id}/`);
        projectData = response.data;
      }

      let tasksData = [];
      try {
        tasksData = await tasksAPI.getProjectTasks(id);
        setTasks(tasksData);
        updateStats(tasksData);
      } catch (error) {
        // Ignore error
      }

      // Обрабатываем members (только approved для шапки)
      let members = [];
        if (Array.isArray(projectData.members)) {
          members = projectData.members;
        } else if (projectData.members && typeof projectData.members === 'object') {
          try {
            members = Object.values(projectData.members);
          } catch (e) {
            members = [];
          }
        }

      const enrichedProject = {
        ...projectData,
        members: members,
        member_count: members.length,
        tasks_count: tasksData.length,
        conference_link: projectData.conference_link || conferenceLink
      };

      setProject(enrichedProject);

      if (projectData.conference_link) {
        setConferenceLink(projectData.conference_link);
      }

      await fetchSprints();

    } catch (error) {
      setError(error.message || 'Не удалось загрузить проект');
    } finally {
      setLoading(false);
    }
  }, [id, fetchSprints, updateStats, conferenceLink, navigate]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // ============================================
  // Уведомления
  // ============================================

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // ============================================
  // Обработчики действий
  // ============================================

  const handleEditProject = () => {
    if (!canInteract) {
      showNotification('Только участники могут редактировать проект', 'warning');
      return;
    }
    setEditModalOpen(true);
  };

  const handleProjectSaved = (updatedProject) => {
    fetchProjectData();
    showNotification('Проект успешно обновлен', 'success');
  };

  const handleInviteMembers = () => {
    if (!canInteract) {
      showNotification('Только участники могут приглашать', 'warning');
      return;
    }
    showNotification('Функция приглашения будет доступна в следующем обновлении', 'info');
  };

  const handleDeleteProject = () => {
    if (!isOwner) {
      showNotification('Только владелец может удалить проект', 'warning');
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleLeaveProject = () => {
    if (!isMember) {
      showNotification('Вы не участник проекта', 'warning');
      return;
    }
    setLeaveDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await projectsAPI.delete(id);
      showNotification('Проект успешно удален', 'success');
      setTimeout(() => {
        navigate('/projects');
      }, 1500);
    } catch (error) {
      showNotification('Не удалось удалить проект', 'error');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // 🔥 ИСПРАВЛЕННЫЙ обработчик подтверждения выхода
  const handleConfirmLeave = async () => {
    try {
      showNotification('Выход из проекта...', 'info');

      await projectsAPI.leaveProject(project.id);

      showNotification('Вы успешно покинули проект', 'success');
      setTimeout(() => navigate('/projects'), 1500);

    } catch (error) {
      console.error('❌ Ошибка выхода из проекта:', error);
      showNotification(error.message || 'Не удалось покинуть проект', 'error');
      setLeaveDialogOpen(false);
    }
  };

  // 🔥 Обработчик подачи заявки
  const handleJoinProject = () => {
    if (!isAuthenticated) {
      showNotification('Пожалуйста, войдите в систему', 'warning');
      navigate('/login');
      return;
    }

    if (hasPendingRequest) {
      showNotification('У вас уже есть ожидающая заявка', 'info');
      return;
    }

    if (isMember) {
      showNotification('Вы уже являетесь участником проекта', 'info');
      return;
    }

    setJoinModalOpen(true);
  };

  const handleJoinSuccess = (response) => {
    loadAllMembers();  // ← обновляем список всех участников
    fetchProjectData();   // ← обновляем данные проекта (для шапки)
    showNotification('Заявка успешно отправлена! Ожидайте решения руководителя.', 'success');
  };

  // 🔥 Загрузка ВСЕХ участников (для модалки) - доступна всем!
  const loadAllMembers = async () => {
  try {
    console.log('📥 Загрузка всех участников проекта');
    const data = await projectsAPI.getAllMembers(id);
    // 🔥 ПРЕОБРАЗУЕМ В МАССИВ, ЕСЛИ НУЖНО
    const membersArray = Array.isArray(data) ? data :
                        (data && typeof data === 'object' ? Object.values(data) : []);
    console.log('✅ Загружено участников:', membersArray.length);
    setAllMembers(membersArray);
    return membersArray;
  } catch (err) {
    console.error('❌ Ошибка загрузки всех участников:', err);
    return [];
  }
};

  // 🔥 Открытие модалки участников
  const handleOpenMembersModal = () => {
    loadAllMembers();  // ← загружаем всех участников (независимо от прав)
    setMembersModalOpen(true);
  };

  const handleConfirmCompleteProject = async () => {
    try {
      await projectsAPI.completeProject(id);
      showNotification('Проект успешно завершен!', 'success');
      setCompleteProjectDialogOpen(false);
      await fetchProjectData();
    } catch (error) {
      showNotification('Не удалось завершить проект', 'error');
      setCompleteProjectDialogOpen(false);
    }
  };

  const handleOpenChat = () => {
    if (!canInteract) {
      showNotification('Только участники могут открывать чат', 'warning');
      return;
    }
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
  };

  const handleCreateConference = () => {
    if (!isOwner) {
      showNotification('Только владелец может создавать конференции', 'warning');
      return;
    }
    setConferenceOpen(true);
  };

  const handleJoinConference = () => {
    if (!canInteract) {
      showNotification('Только участники могут входить в конференцию', 'warning');
      return;
    }
    if (conferenceLink) {
      window.open(conferenceLink, '_blank');
    } else {
      showNotification('Сначала создайте конференцию', 'warning');
    }
  };

  const handleEndConference = async () => {
    if (!isOwner) {
      showNotification('Только владелец может завершить конференцию', 'warning');
      return;
    }
    if (!window.confirm('Вы уверены, что хотите завершить конференцию? Ссылка будет удалена из проекта.')) {
      return;
    }

    try {
      showNotification('Завершение конференции...', 'info');
      await projectsAPI.clearConferenceLink(id);
      setConferenceLink(null);
      setProject(prev => ({ ...prev, conference_link: null }));
      showNotification('Конференция завершена', 'success');
    } catch (error) {
      showNotification('Не удалось завершить конференцию', 'error');
    }
  };

  const handleConferenceCreated = (link) => {
    setConferenceLink(link);
    setProject(prev => ({ ...prev, conference_link: link }));
    showNotification('Конференция создана! Скопируйте ссылку', 'success');
  };

  const handleSprintCreate = async (sprintData) => {
    if (!canManageSprints) {
      showNotification('У вас нет прав для создания спринтов', 'warning');
      return;
    }
    try {
      await sprintsAPI.createSprint(id, {
        title: sprintData.title,
        goal: sprintData.goal,
        start_date: sprintData.start_date?.toISOString().split('T')[0],
        end_date: sprintData.end_date?.toISOString().split('T')[0],
        status: 'planning'
      });

      showNotification('Спринт успешно создан', 'success');
      await fetchSprints();
    } catch (error) {
      showNotification('Ошибка при создании спринта', 'error');
    }
  };

  const handleSprintEdit = async (sprintId, sprintData) => {
    if (!canManageSprints) {
      showNotification('У вас нет прав для редактирования спринтов', 'warning');
      return;
    }
    try {
      await sprintsAPI.updateSprint(sprintId, {
        title: sprintData.title,
        goal: sprintData.goal,
        start_date: sprintData.start_date?.toISOString().split('T')[0],
        end_date: sprintData.end_date?.toISOString().split('T')[0]
      });

      showNotification('Спринт обновлен', 'success');
      await fetchSprints();
    } catch (error) {
      showNotification('Ошибка при обновлении спринта', 'error');
    }
  };

  const handleSprintStart = async (sprintId) => {
    if (!canManageSprints) {
      showNotification('У вас нет прав для запуска спринтов', 'warning');
      return;
    }
    try {
      await sprintsAPI.startSprint(sprintId);
      showNotification('Спринт запущен!', 'success');
      await fetchSprints();
    } catch (error) {
      showNotification('Ошибка при запуске спринта', 'error');
    }
  };

  const handleSprintComplete = async (sprintId) => {
    if (!canManageSprints) {
      showNotification('У вас нет прав для завершения спринтов', 'warning');
      return;
    }
    try {
      await sprintsAPI.completeSprint(sprintId);
      showNotification('Спринт завершен!', 'success');
      await fetchSprints();
    } catch (error) {
      showNotification('Ошибка при завершении спринта', 'error');
    }
  };

  const handlePlanSprints = async (planData) => {
    if (!canManageSprints) {
      showNotification('У вас нет прав для планирования спринтов', 'warning');
      return;
    }
    try {
      await projectsAPI.patch(id, {
        total_sprints: planData.total_sprints,
        sprint_titles: planData.sprint_titles
      });

      showNotification('План спринтов сохранен', 'success');
      await fetchProjectData();

    } catch (error) {
      showNotification('Ошибка при сохранении плана', 'error');
    }
  };

  // ============================================
  // Рендеринг
  // ============================================

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 3, color: 'text.secondary' }}>
            Загрузка проекта...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchProjectData}>
              Повторить
            </Button>
          }
        >
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          К списку проектов
        </Button>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Проект не найден
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          variant="contained"
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Вернуться к проектам
        </Button>
      </Container>
    );
  }

  const tasksStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 6 }}>
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification?.type || 'info'}
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: 3 }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton
          onClick={() => navigate('/projects')}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
              bgcolor: 'action.hover'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Главная
          </Link>
          <Link
            component={RouterLink}
            to="/projects"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <FolderIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Проекты
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 500 }}>
            {project.title}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ maxWidth: '1100px', mx: 'auto', width: '100%' }}>
        <ProjectHeaderNew
          project={project}
          stats={stats}
          sprints={sprints}
          isOwner={isOwner}
          isMember={isMember}
          isAuthenticated={isAuthenticated}
          currentUserId={user?.id}
          onEditProject={handleEditProject}
          onInviteMembers={handleInviteMembers}
          onDeleteProject={handleDeleteProject}
          onLeaveProject={handleLeaveProject}
          onOpenChat={handleOpenChat}
          onCreateConference={handleCreateConference}
          onJoinConference={handleJoinConference}
          onEndConference={handleEndConference}
          onJoinProject={handleJoinProject}
          onOpenMembersModal={handleOpenMembersModal}
          conferenceLink={conferenceLink}
        />

        <ProjectDocuments
          projectId={project.id}
          isOwner={isOwner}
          isMember={isMember}
          isViewOnly={!canInteract}
        />

        {/* БЛОК СПРИНТОВ */}
        {canInteract ? (
          // Показываем блок только участникам
          !isCompleted && (
            <>
              {canManageSprints ? (
                // 🔥 Участники с правами видят полный функционал (ИСПРАВЛЕНО - добавлен canManageSprints)
                <ProjectSprint
                  project={project}
                  sprint={currentSprint}
                  sprints={sprints}
                  isOwner={isOwner}
                  isMember={isMember}
                  canManageSprints={canManageSprints}
                  isLoading={sprintsLoading}
                  onSprintCreate={handleSprintCreate}
                  onSprintEdit={handleSprintEdit}
                  onSprintStart={handleSprintStart}
                  onSprintComplete={handleSprintComplete}
                  onPlanSprints={handlePlanSprints}
                  showKanban={true}
                  tasksStats={tasksStats}
                  kanbanComponent={
                    currentSprint && (
                      <ProjectTasksTab
                        project={project}
                        currentSprint={currentSprint}
                        tasks={tasks}
                        setTasks={setTasks}
                        isOwner={isOwner}
                        isMember={isMember}
                        onTaskUpdate={handleTaskUpdate}
                      />
                    )
                  }
                />
              ) : (
                // Участники без прав видят информационное сообщение или спринты только для чтения
                !project?.total_sprints ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      mb: 3,
                      borderRadius: 6,
                      bgcolor: '#ffffff',
                      textAlign: 'center'
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: '#3c6e71',
                        fontWeight: 600,
                        fontSize: '1.25rem'
                      }}
                    >
                      📋 Спринты пока не спланированы
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 300,
                        fontSize: '0.9rem'
                      }}
                    >
                      Руководитель проекта еще не создал план спринтов
                    </Typography>
                  </Paper>
                ) : (
                  <ProjectSprint
                    project={project}
                    sprint={currentSprint}
                    sprints={sprints}
                    isOwner={isOwner}
                    isMember={isMember}
                    canManageSprints={canManageSprints}
                    isLoading={sprintsLoading}
                    onSprintCreate={handleSprintCreate}
                    onSprintEdit={handleSprintEdit}
                    onSprintStart={handleSprintStart}
                    onSprintComplete={handleSprintComplete}
                    onPlanSprints={handlePlanSprints}
                    showKanban={true}
                    tasksStats={tasksStats}
                    kanbanComponent={
                      currentSprint && (
                        <ProjectTasksTab
                          project={project}
                          currentSprint={currentSprint}
                          tasks={tasks}
                          setTasks={setTasks}
                          isOwner={isOwner}
                          isMember={isMember}
                          onTaskUpdate={handleTaskUpdate}
                        />
                      )
                    }
                  />
                )
              )}
            </>
          )
        ) : null}
        {/* КОНЕЦ БЛОКА СПРИНТОВ */}

          <ProjectHistory
          sprints={sprints}
          isViewOnly={!canInteract}
        />

        {isOwner && !isCompleted && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={() => setCompleteProjectDialogOpen(true)}
              sx={{
                borderRadius: 8,
                px: 2,
                py: 1,
                fontSize: '1.1rem',
                fontFamily: '"Noto Sans", "Roboto", "Helvetica", "Arial", sans-serif',
                fontWeight: 100,
                textTransform: 'none',
                boxShadow: 1,
                '&:hover': { boxShadow: 2 }
              }}
            >
              ЗАВЕРШИТЬ ПРОЕКТ
            </Button>
          </Box>
        )}
      </Box>

      {project && canInteract && (
        <ProjectChat
          open={chatOpen}
          onClose={handleCloseChat}
          projectId={project.id}
          projectTitle={project.title}
          isMember={isMember}
          isOwner={isOwner}
        />
      )}

      <ConferenceJitsi
        open={conferenceOpen}
        onClose={() => setConferenceOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
        onConferenceCreated={handleConferenceCreated}
      />

      {/* 🔥 МОДАЛЬНЫЕ ОКНА */}
      <ProjectJoinModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        projectId={project.id}
        projectTitle={project.title}
        onSuccess={handleJoinSuccess}
      />

      <ProjectMembersModal
        open={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        projectId={project.id}
        project={project}
        allMembers={allMembers}
        canManageApplications={canManageMembers}
        canManageRoles={canManageRoles}
        onMembersUpdate={loadAllMembers}
      />

      <EditProjectModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={project}
        onSave={handleProjectSaved}
      />

      {/* Диалог удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" fontWeight="600">
            Удаление проекта
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Вы уверены, что хотите удалить проект "{project?.title}"?
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Все задачи, документы, сообщения в чате и данные проекта будут безвозвратно удалены.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Отмена
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Удалить проект
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔥 СТИЛИЗОВАННЫЙ ДИАЛОГ ВЫХОДА */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: '#fafafa',
            boxShadow: 'none'
          }
        }}
      >
        <DialogTitle sx={{
          pb: 1,
          pt: 3,
          px: 3,
          borderBottom: '0.5px solid',
          borderColor: 'rgba(60, 110, 113, 0.1)'
        }}>
          <Typography variant="h5" component="div" fontWeight="600" color="primary.main">
            Покинуть проект
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Alert
            severity="info"
            sx={{
              mb: 2,
              borderRadius: 3,
              border: '0.5px solid',
              borderColor: 'rgba(2, 136, 209, 0.2)',
              '& .MuiAlert-icon': {
                color: '#0288d1'
              }
            }}
          >
            <Typography variant="body1" fontWeight="700">
              Вы уверены, что хотите покинуть проект?
            </Typography>
          </Alert>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'rgba(60, 110, 113, 0.02)',
              border: '0.5px solid',
              borderColor: 'rgba(60, 110, 113, 0.1)'
            }}
          >
            <Typography variant="subtitle1" fontWeight="300" gutterBottom color="primary.main">
              {project?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              После выхода вы потеряете доступ к:
            </Typography>
            <Box component="ul" fontWeight="300" sx={{
              m: 0,
              pl: 2,
              color: 'text.secondary',
              fontSize: '0.875rem'
            }}>
              <li>Задачам и канбан-доске</li>
              <li>Документам проекта</li>
              <li>Чату и обсуждениям</li>
              <li>Истории спринтов</li>
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{
          p: 3,
          pt: 0,
          gap: 1,
          justifyContent: 'flex-end',
          borderTop: '0.5px solid',
          borderColor: 'rgba(60, 110, 113, 0.1)'
        }}>
          <Button
            onClick={() => setLeaveDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 6,
              px: 2,
              py: 1,
              borderWidth: '0.5px',
              textTransform: 'none',
              fontWeight: 300,
              '&:hover': {
                borderWidth: '0.5px'
              }
            }}
          >
            ОТМЕНА
          </Button>
          <Button
            onClick={handleConfirmLeave}
            variant="contained"
            color="warning"
            sx={{
              borderRadius: 6,
              px: 2,
              py: 1,
              textTransform: 'none',
              fontWeight: 300,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none'
              }
            }}
          >
            ПОКИНУТЬ ПРОЕКТ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог завершения */}
      <Dialog
        open={completeProjectDialogOpen}
        onClose={() => setCompleteProjectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" fontWeight="600">
            Завершение проекта
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Вы уверены, что хотите завершить проект "{project?.title}"?
          </Alert>
          <Typography variant="body2" color="text.secondary" paragraph>
            При завершении проекта:
          </Typography>
          <Typography component="div" variant="body2" color="text.secondary">
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li>Текущий спринт будет автоматически завершен</li>
              <li>Канбан-доска станет доступна только для просмотра</li>
              <li>Создание новых задач будет недоступно</li>
              <li>Проект переместится в архив завершенных</li>
            </ul>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setCompleteProjectDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Отмена
          </Button>
          <Button onClick={handleConfirmCompleteProject} color="error" variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Завершить проект
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ProjectDetailPage;