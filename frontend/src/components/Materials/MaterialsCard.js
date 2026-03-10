// frontend/src/components/Materials/MaterialsCard.js
import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tooltip,
  alpha,
  useTheme,
  Chip
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const CardContainer = styled(Paper)(({ theme }) => ({
  minWidth: 150,
  maxWidth: 200,
  height: 150,
  borderRadius: theme.spacing(4),
  padding: '10px',
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  boxShadow: 'none',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  padding: theme.spacing(2),
  position: 'relative',
  border: `0.5px solid transparent`,
  '&:hover': {
    transform: 'translateY(-4px)',
    borderColor: theme.palette.primary.main,

  }
}));

const IconContainer = styled(Box)(({ theme }) => ({
  fontSize: 48,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(1),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}));

const NameText = styled(Typography)(({ theme }) => ({
  fontSize: '0.95rem',
  fontWeight: 500,
  textAlign: 'center',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  lineHeight: 1.3,
  width: '100%',
  padding: '0 4px'
}));

const CountChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.75rem',
  fontWeight: 500,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  '& .MuiChip-label': {
    px: 1
  }
}));

const EmptyChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.75rem',
  fontWeight: 400,
  backgroundColor: alpha(theme.palette.grey[500], 0.1),
  color: theme.palette.text.secondary,
  '& .MuiChip-label': {
    px: 1
  }
}));

const ProjectChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.75rem',
  fontWeight: 500,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  '& .MuiChip-label': {
    px: 1
  }
}));

const StatusIndicator = styled(Box)(({ theme, color }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: color,
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: `0 0 0 1px ${alpha(color, 0.3)}`
}));

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const MaterialsCard = ({
  material,
  onClick
}) => {
  const theme = useTheme();

  // 🔍 Диагностика структуры материала
  useEffect(() => {
    if (material) {
      console.log('📦 MaterialsCard получил материал:', {
        id: material.id,
        // Проверяем все возможные места хранения файлов
        uploaded_files: material.uploaded_files?.length,
        participantUploadedFiles: material.participant?.uploaded_files?.length,
        participantDetailsUploadedFiles: material.participant_details?.uploaded_files?.length,
        files: material.files?.length,
        materials: material.materials?.length,
        hasParticipant: !!material.participant,
        hasParticipantDetails: !!material.participant_details
      });
    }
  }, [material]);

  // Получаем информацию об участнике из разных возможных источников
  const participant = material.participant || material.participant_details || {};

  // Формируем полное имя
  const fullName = participant.full_name ||
                   (participant.user ?
                     `${participant.user.first_name || ''} ${participant.user.last_name || ''}`.trim() :
                     '') ||
                   material.participant_name ||
                   'Докладчик';

  // 🔥 ПРАВИЛЬНЫЙ ПОДСЧЕТ ФАЙЛОВ из всех возможных источников
  const filesFromMaterial = material.files?.length || 0;

  // Файлы из uploaded_files могут быть в разных местах
  const filesFromUploaded = material.uploaded_files?.length ||
                            material.participant?.uploaded_files?.length ||
                            material.participant_details?.uploaded_files?.length ||
                            0;

  const filesFromMaterials = material.materials?.reduce((acc, m) => acc + (m.files?.length || 0), 0) || 0;

  // Общее количество файлов
  const fileCount = filesFromMaterial + filesFromUploaded + filesFromMaterials;

  // Проверяем наличие проекта
  const hasProject = !!(participant.project || material.participant?.project || material.project);

  // Определяем источники файлов
  const hasUploadedFiles = filesFromUploaded > 0;
  const hasMaterialFiles = filesFromMaterial > 0 || filesFromMaterials > 0;

  // Функция для отображения чипа
  const getFileChip = () => {
    if (fileCount > 0) {
      return (
        <CountChip
          label={`${fileCount} ${fileCount === 1 ? 'файл' : fileCount < 5 ? 'файла' : 'файлов'}`}
          size="small"
        />
      );
    } else if (hasProject) {
      return (
        <ProjectChip
          label="есть проект"
          size="small"
        />
      );
    } else {
      return (
        <EmptyChip
          label="нет файлов"
          size="small"
        />
      );
    }
  };

  // Определяем цвет индикатора
  const getIndicatorColor = () => {
    if (hasProject && fileCount > 0) return theme.palette.secondary.main;
    if (hasProject) return theme.palette.primary.main;
    if (fileCount > 0) {
      if (hasUploadedFiles) return theme.palette.success.main;
      if (hasMaterialFiles) return theme.palette.info.main;
    }
    return theme.palette.grey[400];
  };

  // Определяем подсказку для индикатора
  const getIndicatorTooltip = () => {
    const sources = [];
    if (hasProject && fileCount > 0) sources.push('проект с файлами');
    else if (hasProject) sources.push('проект (без файлов)');
    if (hasUploadedFiles) sources.push('загруженные файлы');
    if (hasMaterialFiles) sources.push('доп. материалы');

    if (sources.length > 0) {
      return `Есть: ${sources.join(', ')}`;
    }
    return 'Нет материалов';
  };

  return (
    <CardContainer onClick={() => onClick(material)}>
      <IconContainer>
        <FolderIcon sx={{ fontSize: 48 }} />
      </IconContainer>

      <NameText>
        {fullName}
      </NameText>

      {getFileChip()}

      {/* Индикатор наличия материалов */}
      <Tooltip title={getIndicatorTooltip()} arrow placement="top">
        <StatusIndicator color={getIndicatorColor()} />
      </Tooltip>
    </CardContainer>
  );
};

export default MaterialsCard;