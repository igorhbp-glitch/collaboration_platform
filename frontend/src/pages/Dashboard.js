// src/pages/Dashboard.js
import React, { useRef, useState } from 'react'; // 🔥 добавил useState
import {
  Typography,
  Box,
  IconButton,
  useTheme,
  Alert,
  Snackbar,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import NewsFeed from '../components/News/NewsFeed';
import logo from '../assets/logo.svg';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const PageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  paddingTop: 0,
  paddingBottom: theme.spacing(6),
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
}));

// 🔥 ШАПКА
const AnimatedHeader = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '50%',
  minWidth: '600px',
  minHeight: 300,
  marginTop: '-80px',
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(2),
  background: 'linear-gradient(135deg, #284b63 0%, #3c6e71 50%, #58b6b9 100%)',
  animation: 'AnimateBG 10s ease infinite',
  backgroundSize: '300% 300%',
  overflow: 'hidden',
  boxShadow: 'none',
  '@keyframes AnimateBG': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' }
  },
  // На мобильных устройствах
  [theme.breakpoints.down('md')]: {
    width: 'calc(100% - 32px)',
    minWidth: 'auto',
    marginLeft: '16px',
    marginRight: '16px'
  }
}));

// 🔥 КОНТЕЙНЕР ДЛЯ КУБИКОВ
const CubesContainer = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  zIndex: 1
});

// 🔥 СТИЛИ ДЛЯ КУБИКОВ
const Cube = styled(Box)(({ delay, size, left }) => ({
  position: 'absolute',
  display: 'block',
  listStyle: 'none',
  width: size || '20px',
  height: size || '20px',
  background: 'rgba(255, 255, 255, 0.15)',
  bottom: '-150px',
  left: left || 'auto',
  animation: 'animate 25s ease-in infinite',
  animationDelay: delay || '0s',
  '@keyframes animate': {
    '0%': {
      transform: 'translateY(0) rotate(0deg)',
      opacity: 1,
      borderRadius: 0
    },
    '100%': {
      transform: 'translateY(-1000px) rotate(720deg)',
      opacity: 0,
      borderRadius: '50%'
    }
  }
}));

// 🔥 ЛОГОТИП - БЕЛЫЙ И ПОЛУПРОЗРАЧНЫЙ
const LogoImage = styled('img')({
  position: 'absolute',
  top: '33%',
  left: '65%',
  transform: 'translate(-50%, -50%)',
  height: '80px',
  width: 'auto',
  opacity: 0.6,
  filter: 'brightness(0) invert(1)',
  zIndex: 2,
  pointerEvents: 'none'
});

// 🔥 КНОПКА ОБНОВЛЕНИЯ В ПРАВОМ НИЖНЕМ УГЛУ
const RefreshButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  color: 'white',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  border: '0.5px solid rgba(255, 255, 255, 0.8)',
  zIndex: 10,
  padding: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'white'
  }
}));

const HeaderContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  zIndex: 5,
  bottom: theme.spacing(6),
  left: 0,
  right: 0,
  padding: theme.spacing(0, 4),
  color: theme.palette.common.white
}));

const Dashboard = () => {
  const theme = useTheme();

  // 🔥 СОЗДАЕМ REF ДЛЯ ДОСТУПА К МЕТОДАМ NewsFeed
  const newsFeedRef = useRef();

  // 🔥 СОСТОЯНИЕ ДЛЯ УВЕДОМЛЕНИЯ ОБ ОБНОВЛЕНИИ
  const [refreshNotification, setRefreshNotification] = useState(null);

  const cubes = [
    { left: '5%', size: '60px', delay: '0s' },
    { left: '15%', size: '25px', delay: '2s' },
    { left: '25%', size: '40px', delay: '4s' },
    { left: '35%', size: '80px', delay: '1s' },
    { left: '45%', size: '20px', delay: '3s' },
    { left: '55%', size: '70px', delay: '5s' },
    { left: '65%', size: '35px', delay: '2s' },
    { left: '75%', size: '50px', delay: '6s' },
    { left: '85%', size: '30px', delay: '4s' },
    { left: '95%', size: '45px', delay: '0s' },
  ];

  // 🔥 ТЕПЕРЬ ВЫЗЫВАЕМ МЕТОД ИЗ NewsFeed
  const handleRefresh = () => {
    if (newsFeedRef.current) {
      const result = newsFeedRef.current.refreshNews(); // вызываем метод компонента

      // 🔥 ПОКАЗЫВАЕМ УВЕДОМЛЕНИЕ
      if (result === 'no-news') {
        setRefreshNotification({
          type: 'info',
          message: 'Новостей пока нет, но скоро появятся!'
        });
      } else if (result === 'loaded') {
        setRefreshNotification({
          type: 'success',
          message: 'Новости обновлены'
        });
      }
    }
  };

  const handleCloseNotification = () => {
    setRefreshNotification(null);
  };

  return (
    <PageContainer>
      <Snackbar
        open={!!refreshNotification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={refreshNotification?.type || 'info'}
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: 3,
            minWidth: '300px',
            justifyContent: 'center'
          }}
        >
          {refreshNotification?.message}
        </Alert>
      </Snackbar>

      <AnimatedHeader>
        <CubesContainer>
          {cubes.map((cube, index) => (
            <Cube
              key={index}
              left={cube.left}
              size={cube.size}
              delay={cube.delay}
            />
          ))}
        </CubesContainer>

        <LogoImage src={logo} alt="Логотип" />

        {/* 🔥 КНОПКА ТЕПЕРЬ ВЫЗЫВАЕТ handleRefresh */}
        <RefreshButton onClick={handleRefresh} size="small">
          <RefreshIcon />
        </RefreshButton>

        <HeaderContent>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 900,
              opacity: 0.7,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              lineHeight: 1.2
            }}
          >
            СИСТЕМА НАУЧНОЙ КОЛЛАБОРАЦИИ
          </Typography>
        </HeaderContent>
      </AnimatedHeader>

      {/* 🔥 ПЕРЕДАЕМ REF В NewsFeed */}
      <NewsFeed ref={newsFeedRef} />
    </PageContainer>
  );
};

export default Dashboard;