// frontend/src/components/Materials/AllMaterialsModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  Pagination,
  Stack,
  CircularProgress,
  Alert,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import MaterialsCard from './MaterialsCard';
import MaterialFolderModal from './MaterialFolderModal';

const MATERIALS_PER_PAGE = 10;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: '90vw',  // адаптивная ширина
    width: 'auto',
    minWidth: 400,
    maxHeight: '90vh',
    backgroundColor: theme.palette.background.paper
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}));

const MaterialsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  justifyContent: 'flex-start',  // выравнивание по левому краю
  minHeight: 400,
  position: 'relative'
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(3, 3, 4, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  position: 'sticky',
  bottom: 0,
  zIndex: 10
}));

const LoaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 400,
  width: '100%'
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 400,
  width: '100%',
  color: theme.palette.text.secondary
}));

const AllMaterialsModal = ({
  open,
  onClose,
  materials = [],
  totalCount,
  loading,
  error,
  onPageChange,
  currentPage,
  hasMore,
  onMaterialClick
}) => {
  const theme = useTheme();
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    if (open) {
      console.log('📦 AllMaterialsModal пропсы:', {
        materialsLength: materials.length,
        totalCount,
        loading,
        error,
        currentPage,
        hasMore
      });
    }
  }, [open, materials, totalCount, loading, error, currentPage, hasMore]);

  const totalPages = Math.ceil((totalCount || materials.length) / MATERIALS_PER_PAGE);

  const handlePageChange = (event, value) => {
    onPageChange(value);
    const contentElement = document.querySelector('.MuiDialogContent-root');
    if (contentElement) {
      contentElement.scrollTop = 0;
    }
  };

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
    setFolderModalOpen(true);
  };

  const handleFolderModalClose = () => {
    setFolderModalOpen(false);
    setSelectedMaterial(null);
  };

  return (
    <>
      <StyledDialog open={open} onClose={onClose} maxWidth={false} fullWidth={false}>
        <StyledDialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="div" fontWeight="700">
              Материалы
            </Typography>
            <Typography variant="body2" component="span" sx={{ color: 'white', opacity: 0.8 }}>
              ({totalCount || materials.length})
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <MaterialsContainer>
            {loading ? (
              <LoaderContainer>
                <CircularProgress size={60} />
              </LoaderContainer>
            ) : materials.length === 0 ? (
              <EmptyState>
                <FolderIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Нет материалов
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Материалы пока не загружены
                </Typography>
              </EmptyState>
            ) : (
              materials.map((material) => (
                <MaterialsCard
                  key={material.id}
                  material={material}
                  onClick={handleMaterialClick}
                />
              ))
            )}
          </MaterialsContainer>

          {totalPages > 1 && (
            <PaginationContainer>
              <Stack spacing={2}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                  siblingCount={1}
                  boundaryCount={1}
                  disabled={loading}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: theme.spacing(1),
                      fontSize: '1rem'
                    }
                  }}
                />
              </Stack>
            </PaginationContainer>
          )}
        </DialogContent>
      </StyledDialog>

      <MaterialFolderModal
        open={folderModalOpen}
        onClose={handleFolderModalClose}
        material={selectedMaterial}
      />
    </>
  );
};

export default AllMaterialsModal;