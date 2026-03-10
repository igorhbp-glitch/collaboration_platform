// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import {
  ThemeProvider,
  createTheme
} from '@mui/material/styles';
import {
  CssBaseline,
  CircularProgress,
  Toolbar
} from '@mui/material';

// Контекст авторизации
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Компоненты
import Header from './components/Layout/Header';

// Страницы
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecommendationsPage from './pages/RecommendationsPage';
import MyInvitationsPage from './pages/MyInvitationsPage';
import ProjectsPage from './pages/ProjectsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage'; // 🔥 НОВАЯ СТРАНИЦА

// Страницы мероприятий
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import SectionDetailPage from './pages/SectionDetailPage';
import CreateEventPage from './pages/CreateEventPage';

// Обработчики VK авторизации
import VKCallbackHandler from './pages/VKCallbackHandler';
import VKLandingHandler from './components/VKLandingHandler';

// Современная анкета
import ModernQuestionnaire from './components/Questionnaires/ModernQuestionnaire';

import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3c6e71',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

// 🔒 Компонент для защищенных маршрутов (только для авторизованных)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// 🔓 Компонент для публичных маршрутов (только для неавторизованных)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      {/* Шапка отображается только для авторизованных пользователей */}
      {user && <Header />}
      {user && <Toolbar />} {/* Отступ под шапкой */}

      <main style={{
        minHeight: 'calc(100vh - 64px)',
        paddingTop: user ? '16px' : '0'
      }}>
        <Routes>
          {/* Корневой маршрут - обработчик редиректа с VK */}
          <Route path="/" element={<VKLandingHandler />} />

          {/* Публичные маршруты */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* Обработчик VK callback */}
          <Route path="/vk-callback" element={<VKCallbackHandler />} />

          {/* 🔒 Защищенные маршруты */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Анкета */}
          <Route path="/questionnaire/:id" element={
            <ProtectedRoute>
              <ModernQuestionnaire />
            </ProtectedRoute>
          } />

          {/* Коллеги / Рекомендации */}
          <Route path="/recommendations" element={
            <ProtectedRoute>
              <RecommendationsPage />
            </ProtectedRoute>
          } />

          {/* Приглашения */}
          <Route path="/my-invitations" element={
            <ProtectedRoute>
              <MyInvitationsPage />
            </ProtectedRoute>
          } />

          {/* 🔥 НОВЫЙ МАРШРУТ: Уведомления */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          {/* Проекты */}
          <Route path="/projects" element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          } />

          <Route path="/projects/create" element={
            <ProtectedRoute>
              <CreateProjectPage />
            </ProtectedRoute>
          } />

          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          } />

          {/* 🔥 НОВЫЕ МАРШРУТЫ МЕРОПРИЯТИЙ */}
          <Route path="/events" element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          } />

          <Route path="/events/create" element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          } />

          <Route path="/events/:id" element={
            <ProtectedRoute>
              <EventDetailPage />
            </ProtectedRoute>
          } />

          <Route path="/events/:eventId/sections/:sectionId" element={
            <ProtectedRoute>
              <SectionDetailPage />
            </ProtectedRoute>
          } />

          {/* 👤 УНИВЕРСАЛЬНЫЙ МАРШРУТ ПРОФИЛЯ */}
          {/* /profile - мой профиль */}
          {/* /profile/123 - профиль пользователя с id=123 */}
          <Route path="/profile/:userId?" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* ⚠️ 404 - если ни один маршрут не подошел */}
          <Route path="*" element={
            <Navigate to={user ? "/dashboard" : "/login"} replace />
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;