// frontend/src/components/Profile/ProfileProjectCard.js
import React, { useState } from 'react';
import { Box, Paper, Typography, Chip, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material';

// Упрощенная версия StackedCard - всего 2 слоя вместо 3
const CardStack = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: 200, // 👈 УМЕНЬШИЛИ ВЫСОТУ
  cursor: 'pointer',
  perspective: '1200px',
}));

const CardLayer = styled(Paper)(({ theme, index, isHovered }) => {
  const getTransform = () => {
    const baseOffset = index * 6; // Меньше смещение

    let translateY = baseOffset;
    let translateX = baseOffset;

    if (isHovered) {
      translateY = baseOffset - 8; // Меньше подъем
      translateX = baseOffset + 2;
    }

    return `translate(${translateX}px, ${translateY}px)`;
  };

  const getBackgroundColor = () => {
    if (index === 1) return '#ffffff'; // передняя - белая
    return '#f8f9fa'; // задняя - серая
  };

  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: theme.spacing(2), // Меньше скругление
    backgroundColor: getBackgroundColor(),
    boxShadow: index === 1
      ? '0 4px 12px rgba(0,0,0,0.06)'
      : '0 2px 6px rgba(0,0,0,0.03)',
    zIndex: index,
    transform: getTransform(),
    transition: 'transform 0.4s ease',
    transitionDelay: isHovered
      ? `${index * 80}ms`
      : `${(1 - index) * 100}ms`,
  };
});

const ContentContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 10,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  backgroundColor: '#ffffff',
}));

const CardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2), // Меньше отступы
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}));

const Divider = styled(Box)(({ theme }) => ({
  height: '1px',
  backgroundColor: '#eaeef2',
  width: '100%',
}));

const CardFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#fafcff',
}));

const ProfileProjectCard = ({ project, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Активный' : 'В разработке';
  };

  return (
    <CardStack
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Задний слой */}
      <CardLayer index={0} isHovered={isHovered} elevation={0} />

      {/* Передний слой с контентом */}
      <CardLayer index={1} isHovered={isHovered} elevation={0}>
        <ContentContainer>
          <CardContent>
            <Typography
              variant="subtitle1"
              fontWeight="600"
              sx={{
                mb: 0.5,
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {project.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.4,
                flex: 1
              }}
            >
              {project.description || 'Нет описания'}
            </Typography>
          </CardContent>

          <Divider />

          <CardFooter>
            <Chip
              size="small"
              label={getStatusLabel(project.status)}
              color={getStatusColor(project.status)}
              sx={{
                height: 22,
                fontSize: '0.7rem',
                '& .MuiChip-label': { px: 1 }
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {project.member_count || 1} {project.member_count === 1 ? 'участник' : 'участников'}
            </Typography>
          </CardFooter>
        </ContentContainer>
      </CardLayer>
    </CardStack>
  );
};

export default ProfileProjectCard;