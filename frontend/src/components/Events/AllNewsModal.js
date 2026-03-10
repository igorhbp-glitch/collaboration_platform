// frontend/src/components/Events/AllNewsModal.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  Pagination,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import NewsCard from './NewsCard';

// Количество новостей на странице
const NEWS_PER_PAGE = 12;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 1000,
    width: '100%',
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

// FLEX КОНТЕЙНЕР
const NewsFlexContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(3),
  padding: theme.spacing(3),
  justifyContent: 'flex-start',
  '& > *': {
    flex: '0 0 auto',
    width: 280
  }
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

const AllNewsModal = ({
  open,
  onClose,
  news = [],
  sections = [],
  likedNews = {},        // 🔥 ПОЛУЧАЕМ ИЗ ПРОПСОВ
  onLikeToggle,          // 🔥 ПОЛУЧАЕМ ИЗ ПРОПСОВ
  onNewsClick
}) => {
  const theme = useTheme();

  // Состояние для текущей страницы
  const [currentPage, setCurrentPage] = useState(1);

  // Вычисляем общее количество страниц
  const totalPages = Math.ceil(news.length / NEWS_PER_PAGE);

  // Получаем новости для текущей страницы
  const paginatedNews = news.slice(
    (currentPage - 1) * NEWS_PER_PAGE,
    currentPage * NEWS_PER_PAGE
  );

  // Обработчик смены страницы
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Прокручиваем контент вверх при смене страницы
    const contentElement = document.querySelector('.MuiDialogContent-root');
    if (contentElement) {
      contentElement.scrollTop = 0;
    }
  };

  // 🔥 ОБРАБОТЧИК ЛАЙКА - просто вызываем родительскую функцию
  const handleLikeWrapper = (newsId, e) => {
    e.stopPropagation();
    onLikeToggle(newsId, e);
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h5" fontWeight="700">
          Все новости ({news.length})
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent>
        {news.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">
              Пока нет новостей
            </Typography>
          </Box>
        ) : (
          <>
            {/* FLEX КОНТЕЙНЕР */}
            <NewsFlexContainer>
              {paginatedNews.map((item) => (
                <NewsCard
                  key={item.id}
                  news={item}
                  sections={sections}
                  isLiked={likedNews[item.id]}                    // 🔥 ИСПОЛЬЗУЕМ ПРОПС
                  onLikeToggle={(e) => handleLikeWrapper(item.id, e)} // 🔥 ВЫЗЫВАЕМ РОДИТЕЛЬСКУЮ ФУНКЦИЮ
                  onClick={() => {
                    onNewsClick(item);
                    onClose();
                  }}
                />
              ))}
            </NewsFlexContainer>

            {/* Пагинация - показываем только если больше 1 страницы */}
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
          </>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default AllNewsModal;