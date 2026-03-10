// frontend/src/components/Events/EventSectionsGrid.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Fade,
  IconButton,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  Event as EventIcon,
  VideoCall as VideoCallIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const SectionsSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4, 2, 3, 2),
  boxShadow: 'none'
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(0, 1)
}));

const CardsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: theme.spacing(4),
  paddingLeft: 20,
  marginBottom: theme.spacing(3)
}));

const SectionCard = styled(Card)(({ theme }) => ({
  flex: '1 0 280px',
  maxWidth: 320,
  height: 280,
  background: 'linear-gradient(135deg, #3c6e71 0%, #284b63 100%)',
  color: 'white',
  cursor: 'pointer',
  borderRadius: theme.spacing(4),
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)',
    pointerEvents: 'none'
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

const SectionCount = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: 'rgba(255,255,255,0.2)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(0.5, 1.5),
  fontSize: '0.8rem',
  fontWeight: 600,
  backdropFilter: 'blur(4px)',
  zIndex: 2,
  color: 'white'
}));

const StyledCardContent = styled(CardContent)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  padding: '24px !important',
  position: 'relative',
  zIndex: 1
});

// 🔥 НОМЕР СЕКЦИИ СО СЛОВОМ "СЕКЦИЯ"
const SectionNumber = styled(Box)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 800,
  lineHeight: 1.2,
  marginBottom: theme.spacing(1),
  color: 'white'
}));

// 🔥 НАЗВАНИЕ СЕКЦИИ - ТОНЬШЕ И МЕНЬШЕ
const SectionName = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 100,
  fontFamily: '"Noto Sans", "Roboto", "Helvetica", "Arial", sans-serif',
  textTransform: 'uppercase',
  lineHeight: 1.4,
  color: 'white',
  opacity: 0.9,
  maxWidth: '90%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical'
}));

// 🔥 УБИРАЕМ ModeratorInfo и ConferenceButton - они больше не используются

const LoadMoreButton = styled(Button)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(6),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  color: theme.palette.primary.main,
  border: `0.5px solid ${theme.palette.primary.main}`,
  textTransform: 'uppercase',
  fontWeight: 300,
  letterSpacing: '1px',
  fontSize: '1rem',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1)
  }
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const EventSectionsGrid = ({
  sections = [],
  eventId,
  isModerator,
  plenaryModerator,
  sectionModerators = {},
  onCreateConference,
  onJoinConference
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);

  // 🔥 ПОКАЗЫВАЕМ ТОЛЬКО ПЕРВЫЕ 6 СЕКЦИЙ
  const displayedSections = showAll ? sections : sections.slice(0, 6);
  const hasMoreSections = sections.length > 6;

  const handleSectionClick = (sectionId) => {
    navigate(`/events/${eventId}/sections/${sectionId}`);
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
  };

  const isSectionModerator = (sectionId) => {
    return sectionModerators[sectionId] || false;
  };

  const canManageSectionConference = (sectionId) => {
    if (plenaryModerator) return true;
    return isSectionModerator(sectionId);
  };

  const handleConferenceClick = (e, section) => {
    e.stopPropagation();
    if (section.conference_link) {
      onJoinConference(section.conference_link);
    } else {
      onCreateConference(section.id, section.title);
    }
  };

  const handleLoadMore = () => {
    setShowAll(true);
  };

  if (!sections || sections.length === 0) {
    return (
      <SectionsSection>
        <SectionHeader>
          <Typography variant="h6" fontWeight="600" color="primary.main">
            Секции мероприятия
          </Typography>
          <Chip
            label="0"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              fontWeight: 600
            }}
          />
        </SectionHeader>
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
          <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
          <Typography color="text.secondary">
            Секции не добавлены
          </Typography>
        </Box>
      </SectionsSection>
    );
  }

  return (
    <SectionsSection>
      <SectionHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight="700" color="primary.main">
            СЕКЦИИ
          </Typography>
          <Chip
            label={sections.length}
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              fontWeight: 600
            }}
          />
        </Box>
      </SectionHeader>

      <CardsContainer>
        {displayedSections.map((section, index) => (
          <Fade in={true} key={section.id} timeout={500} style={{ transitionDelay: `${index * 50}ms` }}>
            <SectionCard onClick={() => handleSectionClick(section.id)}>
              <SectionCount>
                {section.speakers_count || 0} {getSpeakerWord(section.speakers_count || 0)}
              </SectionCount>

              <StyledCardContent>
                {/* 🔥 НОМЕР СЕКЦИИ СО СЛОВОМ "СЕКЦИЯ" */}
                <SectionNumber>
                  СЕКЦИЯ {index + 1}
                </SectionNumber>

                {/* 🔥 НАЗВАНИЕ СЕКЦИИ - ТОНЬШЕ И МЕНЬШЕ */}
                <SectionName>
                  {section.title}
                </SectionName>

                {/* 🔥 УБРАНЫ ModeratorInfo и ConferenceButton */}
              </StyledCardContent>
            </SectionCard>
          </Fade>
        ))}
      </CardsContainer>

      {/* 🔥 КНОПКА С ПРАВИЛЬНЫМ СЧЕТОМ */}
      {hasMoreSections && !showAll && (
        <LoadMoreButton
          onClick={handleLoadMore}
          endIcon={<ExpandMoreIcon />}
        >
          ЗАГРУЗИТЬ ВСЕ СЕКЦИИ ({sections.length - 6})
        </LoadMoreButton>
      )}
    </SectionsSection>
  );
};

const getSpeakerWord = (count) => {
  if (count % 10 === 1 && count % 100 !== 11) return 'докладчик';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'докладчика';
  return 'докладчиков';
};

export default EventSectionsGrid;