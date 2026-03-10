// frontend/src/components/UI/StackedCard.js
import React, { useState } from 'react';
import { Box, Paper, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';

const CardStack = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: 360,
  cursor: 'pointer',
  perspective: '1200px',
}));

const CardLayer = styled(Paper)(({ theme, index, isHovered }) => {
  const getTransform = () => {
    const baseOffset = index * 8;

    let translateY = baseOffset;
    let translateX = baseOffset;
    let rotate = 0;

    if (isHovered) {
      const raiseAmount = [10, 16, 22];
      translateY = baseOffset - raiseAmount[index];
      translateX = baseOffset + index * 3;
      rotate = index * 0.3;
    }

    return `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
  };

  // 🔥 НОВЫЕ ЦВЕТА: средняя карточка стала светлее
  const getBackgroundColor = () => {
    if (index === 2) return '#ffffff';      // передняя - чисто белая
    if (index === 1) return '#fefefe';      // средняя - почти белая (было '#fafbfc')
    return '#f8f9fa';                        // задняя - чуть сероватая (было '#f5f7fa')
  };

  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: theme.spacing(3),
    backgroundColor: getBackgroundColor(),
    boxShadow: index === 2
      ? '0 4px 20px rgba(0,0,0,0.08)'
      : '0 2px 8px rgba(0,0,0,0.04)',
    zIndex: index,
    transform: getTransform(),
    transition: 'transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.1)',
    transformStyle: 'preserve-3d',
    willChange: 'transform',
    transitionDelay: isHovered
      ? `${index * 120}ms`
      : `${(2 - index) * 150}ms`,
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.spacing(3),
      border: index < 2 ? '1px solid rgba(0,0,0,0.03)' : 'none',
      pointerEvents: 'none',
    },
    ...(index < 2 && {
      borderRight: '1px solid rgba(0,0,0,0.05)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }),
  };
});

// 🔥 УСИЛЕННЫЙ градиент
const ContentContainer = styled(Box)(({ theme, gradientColor }) => ({
  position: 'relative',
  zIndex: 10,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(3),
  overflow: 'hidden',
  background: gradientColor
    ? `linear-gradient(180deg, #ffffff 0%, ${gradientColor} 100%)`
    : '#ffffff',
}));

const CardTop = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}));

const WhiteDivider = styled(Box)(({ theme }) => ({
  height: '1px',
  backgroundColor: '#ffffff',
  width: '100%',
  opacity: 0.9,
  boxShadow: '0 0 4px rgba(255,255,255,0.5)',
  margin: theme.spacing(0.5, 0),
}));

const CardBottom = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2.5),
  marginTop: 'auto',
  flexShrink: 0,
  width: '100%',
  '& .MuiTypography-root': {
    color: alpha('#000', 0.8),
  },
  '& .MuiSvgIcon-root': {
    color: alpha('#000', 0.6),
  },
}));

const EmptyCard = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  backgroundColor: 'inherit',
  borderRadius: theme.spacing(3),
}));

const StackedCard = ({ children, gradientColor, onClick, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);

  const topContent = children?.top || children;
  const bottomContent = children?.bottom;

  return (
    <CardStack
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      <CardLayer index={0} isHovered={isHovered} elevation={0}>
        <EmptyCard />
      </CardLayer>

      <CardLayer index={1} isHovered={isHovered} elevation={0}>
        <EmptyCard />
      </CardLayer>

      <CardLayer index={2} isHovered={isHovered} elevation={0}>
        <ContentContainer gradientColor={gradientColor}>
          <CardTop>
            {topContent}
          </CardTop>
          {bottomContent && (
            <>
              <WhiteDivider />
              <CardBottom>
                {bottomContent}
              </CardBottom>
            </>
          )}
        </ContentContainer>
      </CardLayer>
    </CardStack>
  );
};

export default StackedCard;