// frontend/src/components/Events/EventCard.js
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  alpha
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Функция для получения полного URL изображения
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:8001${path}`;
};

const EventCard = ({ event, typeInfo, levelInfo, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'd MMMM yyyy', { locale: ru });
    } catch {
      return dateString;
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? event.cover_images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === event.cover_images.length - 1 ? 0 : prev + 1
    );
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (event.cover_images?.length > 1) {
      handleNextImage(e);
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: 'pointer',
        borderRadius: 6,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 2,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {event.cover_images && event.cover_images.length > 0 ? (
          <>
            <CardMedia
              component="img"
              height="200"
              image={getFullImageUrl(event.cover_images[currentImageIndex])}
              alt={event.title}
              sx={{
                objectFit: 'cover',
                cursor: 'pointer'
              }}
              onClick={handleImageClick}
            />

            {/* Тёмный оверлей */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
                zIndex: 1
              }}
            />

            {/* Название по центру, капсом */}
            <Typography
              variant="h5"
              fontWeight="800"
              textTransform="uppercase"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                color: 'white',
                textAlign: 'center',
                zIndex: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.3
              }}
            >
              {event.title}
            </Typography>

            {/* ТИП МЕРОПРИЯТИЯ - В ЛЕВОМ НИЖНЕМ УГЛУ */}
            <Chip
              label={`${typeInfo.icon} ${typeInfo.label}`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                bgcolor: alpha(typeInfo.color, 0.1),
                color: typeInfo.color,
                fontWeight: 500,
                borderRadius: 16,
                height: 24,
                zIndex: 3,
                backdropFilter: 'blur(4px)',
                border: '1px solid',
                borderColor: alpha(typeInfo.color, 0.3)
              }}
            />

            {/* ДАТА - В ПРАВОМ НИЖНЕМ УГЛУ */}
            <Chip
              label={formatDate(event.start_date)}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: alpha('#000000', 0.1),
                color: 'white',
                fontWeight: 500,
                borderRadius: 16,
                height: 24,
                zIndex: 3,
                backdropFilter: 'blur(4px)',
                border: '1px solid',
                borderColor: alpha('#ffffff', 0.3)
              }}
            />

            {/* Стрелки навигации */}
            {event.cover_images.length > 1 && (
              <>
                <IconButton
                  size="small"
                  onClick={handlePrevImage}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.7)'
                    },
                    zIndex: 3
                  }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.7)'
                    },
                    zIndex: 3
                  }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>

                {/* Индикатор */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 0.5,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    borderRadius: 2,
                    px: 1,
                    py: 0.5,
                    zIndex: 3
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    {currentImageIndex + 1}/{event.cover_images.length}
                  </Typography>
                </Box>
              </>
            )}
          </>
        ) : (
          // Если нет фото
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(typeInfo.color, 0.1)
            }}
          >
            <Typography
              variant="h5"
              fontWeight="800"
              textTransform="uppercase"
              sx={{
                width: '90%',
                textAlign: 'center',
                color: typeInfo.color,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.3
              }}
            >
              {event.title}
            </Typography>

            {/* Тип в левом нижнем углу (без фото) */}
            <Chip
              label={`${typeInfo.icon} ${typeInfo.label}`}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                bgcolor: alpha(typeInfo.color, 0.1),
                color: typeInfo.color,
                fontWeight: 500,
                borderRadius: 16,
                height: 24,
                zIndex: 3,
                border: '1px solid',
                borderColor: alpha(typeInfo.color, 0.3)
              }}
            />

            {/* Дата в правом нижнем углу (без фото) */}
            <Chip
              label={formatDate(event.start_date)}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: alpha('#000000', 0.1),
                color: '#000000',
                fontWeight: 500,
                borderRadius: 16,
                height: 24,
                zIndex: 3,
                border: '1px solid',
                borderColor: alpha('#000000', 0.3)
              }}
            />
          </Box>
        )}

        <Chip
          label={levelInfo.label}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: levelInfo.color,
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
            borderRadius: 16,
            zIndex: 3
          }}
        />
      </Box>

      {/* Контент ниже фото */}
      <CardContent sx={{
        p: 2,
        flex: 1,
        '&:last-child': { pb: 2 }
      }}>
        {/* 🔥 ТЕКСТ ОПИСАНИЯ - СУПЕРТОНКИЙ И ПО ЛЕВОМУ КРАЮ */}
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: 36,
            lineHeight: 1.4,
            fontWeight: 300, // 🔥 СУПЕРТОНКИЙ
            fontSize: '0.8rem',
            color: 'text.secondary',
            textAlign: 'left' // 🔥 ВЫРАВНИВАНИЕ ПО ЛЕВОМУ КРАЮ
          }}
        >
          {event.short_description || event.description}
        </Typography>

        {/* Филиал */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          mb: 1,
        }}>
          <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
            {event.organizer_branches?.join(', ') || 'Филиал не указан'}
          </Typography>
        </Box>

        {/* Участники и кнопка */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {event.participant_count || 0} участников
            </Typography>
          </Box>

          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              p: 0.5
            }}
          >
            Подробнее
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;