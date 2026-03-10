// frontend/src/components/Events/EventMaterialsCarousel.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { materialsAPI } from '../../services/eventsAPI';
import MaterialsCard from '../Materials/MaterialsCard';
import AllMaterialsModal from '../Materials/AllMaterialsModal';
import MaterialFolderModal from '../Materials/MaterialFolderModal';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const MaterialsSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(4),
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(3, 2),
  boxShadow: 'none',
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(0, 1)
}));

const ScrollContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'auto',
  overflowY: 'hidden',
  gap: theme.spacing(2),
  padding: theme.spacing(2, 1, 3, 1),
  scrollBehavior: 'smooth',

  '&::-webkit-scrollbar': {
    height: '8px',
    background: 'transparent'
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
    borderRadius: '4px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'transparent',
    borderRadius: '4px'
  },
  '&:hover::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
  },
  '&:hover::-webkit-scrollbar-thumb:hover': {
    background: theme.palette.grey[600],
  },
  '&:hover::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
  }
}));

const NavButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: theme.palette.background.paper,
  zIndex: 10,
  '&:hover': {
    backgroundColor: theme.palette.grey[100]
  }
}));

const AllMaterialsCard = styled(Paper)(({ theme }) => ({
  minWidth: 150,
  maxWidth: 200,
  height: 150,
  borderRadius: theme.spacing(4),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  border: `1px dashed ${theme.palette.primary.main}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  padding: theme.spacing(2),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'scale(1.02)'
  }
}));

const LoaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 200,
  width: '100%'
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const EventMaterialsCarousel = ({
  materials = [],
  eventId,
  sectionId = null,
  isPlenary = false,
  totalCount = 0,
  loading = false,
  error = null,
  onLoadMore,
  hasMore = false,
  title = "МАТЕРИАЛЫ"
}) => {
  const theme = useTheme();
  const scrollRef = useRef(null);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [allMaterialsModalOpen, setAllMaterialsModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [allMaterials, setAllMaterials] = useState([]);
  const [allMaterialsTotal, setAllMaterialsTotal] = useState(0);
  const [allMaterialsLoading, setAllMaterialsLoading] = useState(false);
  const [allMaterialsError, setAllMaterialsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);

  // Отображаем только первые 10 материалов
  const displayedMaterials = materials.slice(0, 10);
  const hasMoreMaterials = materials.length > 10 || hasMore;

  // Проверка скролла
  useEffect(() => {
    const checkScroll = () => {
      const container = scrollRef.current;
      if (container) {
        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 10
        );
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
    }

    return () => {
      window.removeEventListener('resize', checkScroll);
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
    };
  }, [displayedMaterials]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleMaterialClick = (material) => {
    console.log('📦 Выбран материал:', material);
    setSelectedMaterial(material);
    setFolderModalOpen(true);
  };

  const handleFolderModalClose = () => {
    setFolderModalOpen(false);
    setSelectedMaterial(null);
  };

  // 🔥 ОБНОВЛЕННЫЙ МЕТОД ЗАГРУЗКИ ВСЕХ МАТЕРИАЛОВ
  const loadAllMaterials = async (page = 1) => {
    if (!eventId) return;

    setAllMaterialsLoading(true);
    setAllMaterialsError(null);

    try {
      let response;

      if (sectionId) {
        response = await materialsAPI.getSectionMaterials(sectionId, page, 10);
      } else if (isPlenary) {
        // 🔥 ВАЖНО: передаем eventId для фильтрации по мероприятию
        response = await materialsAPI.getPlenaryMaterials(eventId, page, 10);
      } else {
        response = await materialsAPI.getAllMaterialsPaginated(page, 10, { event: eventId });
      }

      console.log('📦 loadAllMaterials response:', response);

      if (page === 1) {
        setAllMaterials(response.results || []);
        setAllMaterialsTotal(response.totalCount || response.results?.length || 0);
      } else {
        setAllMaterials(prev => [...prev, ...(response.results || [])]);
      }
      setCurrentPage(page);
      setHasMorePages(response.hasMore);

    } catch (err) {
      console.error('❌ Ошибка загрузки всех материалов:', err);
      setAllMaterialsError('Не удалось загрузить материалы');
    } finally {
      setAllMaterialsLoading(false);
    }
  };

  // 🔥 ОБРАБОТЧИК "Показать все"
  const handleShowAll = () => {
    setAllMaterialsModalOpen(true);
    loadAllMaterials(1);
  };

  // 🔥 ОБРАБОТЧИК СМЕНЫ СТРАНИЦЫ
  const handlePageChange = async (page) => {
    await loadAllMaterials(page);
  };

  // Блок всегда отображается, даже если нет материалов
  return (
    <>
      <MaterialsSection>
        <SectionHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" fontWeight="700" color="primary.main">
              {title}
            </Typography>
            {totalCount > 0 && (
              <Chip
                label={totalCount}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 600
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {materials.length > 0 && (
              <Button
                variant="outlined"
                onClick={handleShowAll}
                sx={{ borderRadius: 5 }}
              >
                Показать все
              </Button>
            )}
          </Box>
        </SectionHeader>

        <Box sx={{ position: 'relative' }}>
          {showLeftArrow && (
            <NavButton
              onClick={scrollLeft}
              sx={{ left: -12 }}
              size="small"
            >
              <ChevronLeftIcon />
            </NavButton>
          )}

          {showRightArrow && (
            <NavButton
              onClick={scrollRight}
              sx={{ right: -12 }}
              size="small"
            >
              <ChevronRightIcon />
            </NavButton>
          )}

          {loading ? (
            <LoaderContainer>
              <CircularProgress size={40} />
            </LoaderContainer>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          ) : materials.length === 0 ? (

              <Box
                sx={{
                  py: 3,
                  textAlign: 'center',
                }}
              >
                <FolderIcon
                  sx={{
                    fontSize: 32,
                    color: alpha(theme.palette.primary.main, 0.3),
                    mb: 1
                  }}
                />
                <Typography
                  variant="body1"
                  color="primary.main"
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Пока нет докладчиков
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    fontWeight: 300,
                    maxWidth: 300,
                    mx: 'auto'
                  }}
                >
                  Когда появятся докладчики, их материалы будут отображаться здесь
                </Typography>
              </Box>
          ) : (
            <ScrollContainer ref={scrollRef}>
              {displayedMaterials.map((material) => (
                <MaterialsCard
                  key={material.id}
                  material={material}
                  onClick={handleMaterialClick}
                />
              ))}

              {hasMoreMaterials && (
                <AllMaterialsCard onClick={handleShowAll}>
                  <Typography variant="h4" fontWeight="300" color="primary.main" sx={{ mb: 1 }}>
                    +{Math.max(0, totalCount - 10)}
                  </Typography>
                  <Typography variant="body1" fontWeight="500" color="primary.main">
                    Показать все
                  </Typography>
                  <ArrowForwardIcon sx={{ mt: 2, color: 'primary.main', opacity: 0.7 }} />
                </AllMaterialsCard>
              )}
            </ScrollContainer>
          )}
        </Box>
      </MaterialsSection>

      {/* Модальное окно со всеми материалами */}
      <AllMaterialsModal
        open={allMaterialsModalOpen}
        onClose={() => setAllMaterialsModalOpen(false)}
        materials={allMaterials}
        totalCount={allMaterialsTotal}
        loading={allMaterialsLoading}
        error={allMaterialsError}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        hasMore={hasMorePages}
        onMaterialClick={handleMaterialClick}
      />

      {/* Модальное окно с содержимым папки */}
      <MaterialFolderModal
        open={folderModalOpen}
        onClose={handleFolderModalClose}
        material={selectedMaterial}
      />
    </>
  );
};

export default EventMaterialsCarousel;