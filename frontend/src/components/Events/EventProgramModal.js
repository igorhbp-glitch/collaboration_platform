// frontend/src/components/Events/EventProgramModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
  Avatar,
  TextField,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  MenuBook as MenuBookIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DragIndicator as DragIndicatorIcon,
  Star as StarIcon,
  Coffee as CoffeeIcon,
  LunchDining as LunchDiningIcon,
  EmojiPeople as EmojiPeopleIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { scheduleAPI, participantsAPI } from '../../services/eventsAPI';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// 🔥 ИМПОРТЫ ДЛЯ DRAG-AND-DROP
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================
// СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ
// ============================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    maxWidth: 900,
    minWidth: 700,
    height: '90vh',
    overflow: 'hidden',
    zIndex: 1300,
    backgroundColor: theme.palette.grey[50]
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(3),
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[400],
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.grey[600],
    },
  }
}));

const BlockCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isplenary'
})(({ theme, isplenary }) => ({
  padding: theme.spacing(2, 3),
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(6),
  boxShadow: theme.shadows[0],
  backgroundColor: theme.palette.background.paper,
  border: '0.5px solid',
  borderColor: theme.palette.divider,
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: isplenary ? theme.palette.warning.main : theme.palette.primary.main,
    backgroundColor: alpha(isplenary ? theme.palette.warning.main : theme.palette.primary.main, 0.02),
  }
}));

const BlockHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  width: '100%'
});

const SpeakerRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2),
  marginLeft: theme.spacing(4),
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(4),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  border: '0.5px solid',
  borderColor: theme.palette.divider
}));

const TimeChip = styled(Chip)(({ theme, color }) => ({
  borderRadius: theme.spacing(5),
  backgroundColor: alpha(color || theme.palette.primary.main, 0.1),
  color: color || theme.palette.primary.main,
  fontWeight: 600,
  minWidth: 100,
  '& .MuiChip-icon': {
    color: 'inherit'
  },
  '&:hover': {
    backgroundColor: alpha(color || theme.palette.primary.main, 0.2),
    cursor: 'pointer'
  }
}));

const PlenaryBadge = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(5),
  backgroundColor: alpha(theme.palette.warning.main, 0.1),
  color: theme.palette.warning.main,
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: theme.palette.warning.main
  }
}));

const SectionBadge = styled(Chip)(({ theme, color }) => ({
  borderRadius: theme.spacing(5),
  backgroundColor: alpha(color || theme.palette.primary.main, 0.1),
  color: color || theme.palette.primary.main,
  fontWeight: 600,
  '& .MuiChip-icon': {
    color: 'inherit'
  }
}));

const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(5),
  padding: theme.spacing(1.5, 3),
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  border: '1px dashed',
  borderColor: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    borderColor: theme.palette.primary.main
  }
}));

const FormCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  border: '1px solid',
  borderColor: theme.palette.divider,
  marginBottom: theme.spacing(3)
}));

// 🔥 КОМПОНЕНТ ДЛЯ ПЕРЕТАСКИВАЕМОГО БЛОКА
const SortableBlock = ({
  block,
  children,
  isDragDisabled
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: 'block',
      block: block
    },
    disabled: isDragDisabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 2,
        cursor: isDragDisabled ? 'default' : 'grab',
        '&:active': {
          cursor: isDragDisabled ? 'default' : 'grabbing'
        }
      }}
    >
      {children}
    </Box>
  );
};

// 🔥 КОМПОНЕНТ: Зона для сброса даты
const DateDropZone = ({ date, children }) => {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${date}`,
    data: {
      type: 'date-zone',
      date: date
    }
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        mb: 1,
        p: 2,
        borderRadius: 5,
        backgroundColor: isOver ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
        border: isOver ? `0.5px dashed ${theme.palette.primary.main}` : 'none',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </Box>
  );
};

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

const EventProgramModal = ({
  open,
  onClose,
  eventId,
  eventTitle,
  eventStartDate,
  eventEndDate,
  sections = [],
  currentSectionId = null,
  canEditProgram = false,
  onProgramUpdate,
  userRoles
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  // Определяем режим отображения
  const isSectionPage = !!currentSectionId;

  // Состояния
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Данные
  const [plenarySpeakers, setPlenarySpeakers] = useState([]);
  const [sectionSpeakers, setSectionSpeakers] = useState({});
  const [blocksByDate, setBlocksByDate] = useState({});

  // Состояния для отслеживания изменений
  const [hasChanges, setHasChanges] = useState(false);
  const [hasSpeakerChanges, setHasSpeakerChanges] = useState(false);
  const [originalBlocksByDate, setOriginalBlocksByDate] = useState({});

  // Состояния для редактирования времени
  const [timeEditBlock, setTimeEditBlock] = useState(null);
  const [timeEditValue, setTimeEditValue] = useState('');

  // Для drag overlay
  const [activeBlock, setActiveBlock] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [formData, setFormData] = useState({ title: '' });

  // 🔥 ПРАВА ДЛЯ РАЗНЫХ ТИПОВ ПОЛЬЗОВАТЕЛЕЙ
  const isOrganizer = userRoles?.isOrganizer || false;
  const isCreator = userRoles?.isCreator || false;
  const isPlenaryModerator = userRoles?.isPlenaryModerator || false;

  // Функция для проверки, является ли пользователь модератором секции
  const isSectionModerator = (sectionId) => {
    if (!userRoles?.sectionModerators) return false;
    return userRoles.sectionModerators.includes(sectionId);
  };

  // Организаторы и создатель могут всё
  const canManageEverything = isCreator || isOrganizer;

  // 🔥 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

  const getDatesBetween = (start, end) => {
    if (!start || !end) return [];
    const dates = [];
    const currentDate = new Date(start);
    const endDate = new Date(end);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const formatDateHeader = (date) => {
    return format(date, 'd MMMM yyyy', { locale: ru });
  };

  const recalculateDayTimes = (blocks) => {
    if (!blocks || blocks.length === 0) return blocks;

    return blocks.map((block, index) => {
      const hours = 9 + index;
      const newTime = `${hours.toString().padStart(2, '0')}:00`;
      const updatedBlock = { ...block, time: newTime };
      if (block.startTime) {
        const date = new Date(block.startTime);
        date.setHours(hours, 0, 0, 0);
        updatedBlock.startTime = date.toISOString();
      }
      return updatedBlock;
    });
  };

  // Настройка сенсоров
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Загрузка данных
  useEffect(() => {
    if (open && eventId) {
      loadProgramData();
    }
  }, [open, eventId]);

  const loadProgramData = async () => {
    setLoading(true);
    setError('');
    try {
      const allParticipants = await participantsAPI.getParticipants({
        event: eventId,
        status: 'approved',
        participation_type: 'speaker'
      });

      // 🔥 СОРТИРУЕМ ДОКЛАДЧИКОВ ПО speaker_order
      const plenary = allParticipants
        .filter(p => p.is_plenary)
        .sort((a, b) => (a.speaker_order || 0) - (b.speaker_order || 0));

      const bySection = {};

      allParticipants.forEach(p => {
        if (!p.is_plenary && p.section) {
          if (!bySection[p.section.id]) {
            bySection[p.section.id] = [];
          }
          bySection[p.section.id].push(p);
        }
      });

      // 🔥 СОРТИРУЕМ ДОКЛАДЧИКОВ В КАЖДОЙ СЕКЦИИ
      Object.keys(bySection).forEach(sectionId => {
        bySection[sectionId].sort((a, b) => (a.speaker_order || 0) - (b.speaker_order || 0));
      });

      setPlenarySpeakers(plenary);
      setSectionSpeakers(bySection);

      const schedule = await scheduleAPI.getSchedule({ event: eventId });

      const plenaryBlocks = [];
      const sectionBlocks = [];
      const custom = [];

      schedule.forEach(item => {
        if (item.is_plenary) {
          plenaryBlocks.push({
            id: `plenary-${item.id}`,
            realId: item.id,
            type: 'plenary',
            title: 'Пленарное заседание',
            startTime: item.start_time,
            time: format(parseISO(item.start_time), 'HH:mm')
          });
        } else if (item.section) {
          const section = sections.find(s => s.id === item.section);
          sectionBlocks.push({
            id: `section-${item.id}`,
            realId: item.id,
            type: 'section',
            sectionId: item.section,
            title: item.title || section?.title || 'Секция',
            color: section?.color,
            startTime: item.start_time,
            time: format(parseISO(item.start_time), 'HH:mm')
          });
        } else if (item.title) {
          custom.push({
            id: `custom-${item.id}`,
            realId: item.id,
            type: 'custom',
            title: item.title,
            startTime: item.start_time,
            time: format(parseISO(item.start_time), 'HH:mm')
          });
        }
      });

      // Получаем все уникальные даты из блоков
      const allBlockDates = new Set();
      [...plenaryBlocks, ...sectionBlocks, ...custom].forEach(block => {
        if (block.startTime) {
          const blockDate = format(parseISO(block.startTime), 'yyyy-MM-dd');
          allBlockDates.add(blockDate);
        }
      });

      // Добавляем даты мероприятия
      const eventDates = getDatesBetween(eventStartDate, eventEndDate);
      eventDates.forEach(date => {
        allBlockDates.add(format(date, 'yyyy-MM-dd'));
      });

      // Сортируем даты
      const sortedDates = Array.from(allBlockDates).sort();

      // Инициализируем объект с пустыми массивами для каждой даты
      const groupedBlocks = {};
      sortedDates.forEach(dateStr => {
        groupedBlocks[dateStr] = [];
      });

      // Добавляем блоки в соответствующие даты
      [...plenaryBlocks, ...sectionBlocks, ...custom].forEach(block => {
        if (block.startTime) {
          const blockDate = format(parseISO(block.startTime), 'yyyy-MM-dd');
          if (groupedBlocks[blockDate]) {
            groupedBlocks[blockDate].push(block);
          } else {
            groupedBlocks[blockDate] = [block];
          }
        }
      });

      // Сортируем внутри каждого дня по времени
      Object.keys(groupedBlocks).forEach(dateStr => {
        groupedBlocks[dateStr].sort((a, b) => {
          const timeA = a.time || '00:00';
          const timeB = b.time || '00:00';
          return timeA.localeCompare(timeB);
        });
      });

      // Сортируем сами дни
      const sortedGroupedBlocks = {};
      Object.keys(groupedBlocks)
        .sort()
        .forEach(key => {
          sortedGroupedBlocks[key] = groupedBlocks[key];
        });

      setBlocksByDate(sortedGroupedBlocks);
      setOriginalBlocksByDate(JSON.parse(JSON.stringify(sortedGroupedBlocks)));

    } catch (err) {
      console.error('❌ Ошибка загрузки программы:', err);
      setError('Не удалось загрузить программу');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ФУНКЦИИ ДЛЯ РАБОТЫ С ДОКЛАДЧИКАМИ (кнопками)
  const moveSpeakerUp = (blockId, speakerId) => {
    const newBlocksByDate = JSON.parse(JSON.stringify(blocksByDate));

    Object.values(newBlocksByDate).forEach(blocks => {
      const block = blocks.find(b => b.id === blockId);
      if (block) {
        if (block.type === 'plenary') {
          const speakers = [...plenarySpeakers];
          const index = speakers.findIndex(s => s.id === speakerId);
          if (index > 0) {
            [speakers[index - 1], speakers[index]] = [speakers[index], speakers[index - 1]];
            setPlenarySpeakers(speakers);
            setHasChanges(true);
            setHasSpeakerChanges(true);
          }
        } else if (block.type === 'section') {
          const speakers = [...(sectionSpeakers[block.sectionId] || [])];
          const index = speakers.findIndex(s => s.id === speakerId);
          if (index > 0) {
            [speakers[index - 1], speakers[index]] = [speakers[index], speakers[index - 1]];
            setSectionSpeakers(prev => ({ ...prev, [block.sectionId]: speakers }));
            setHasChanges(true);
            setHasSpeakerChanges(true);
          }
        }
      }
    });
  };

  const moveSpeakerDown = (blockId, speakerId) => {
    const newBlocksByDate = JSON.parse(JSON.stringify(blocksByDate));

    Object.values(newBlocksByDate).forEach(blocks => {
      const block = blocks.find(b => b.id === blockId);
      if (block) {
        if (block.type === 'plenary') {
          const speakers = [...plenarySpeakers];
          const index = speakers.findIndex(s => s.id === speakerId);
          if (index < speakers.length - 1) {
            [speakers[index], speakers[index + 1]] = [speakers[index + 1], speakers[index]];
            setPlenarySpeakers(speakers);
            setHasChanges(true);
            setHasSpeakerChanges(true);
          }
        } else if (block.type === 'section') {
          const speakers = [...(sectionSpeakers[block.sectionId] || [])];
          const index = speakers.findIndex(s => s.id === speakerId);
          if (index < speakers.length - 1) {
            [speakers[index], speakers[index + 1]] = [speakers[index + 1], speakers[index]];
            setSectionSpeakers(prev => ({ ...prev, [block.sectionId]: speakers }));
            setHasChanges(true);
            setHasSpeakerChanges(true);
          }
        }
      }
    });
  };

  // 🔥 ОБРАБОТЧИК DRAG-AND-DROP
  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === 'block') {
      setActiveBlock(active.data.current.block);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    setActiveBlock(null);

    if (!over) return;
    if (over.id === active.id) return;
    if (active.data.current?.type !== 'block') return;

    // Находим исходную дату
    let sourceDate = null;
    let sourceBlock = null;
    let sourceIndex = -1;

    Object.entries(blocksByDate).forEach(([dateStr, blocks]) => {
      const index = blocks.findIndex(b => b.id === active.id);
      if (index !== -1) {
        sourceDate = dateStr;
        sourceBlock = blocks[index];
        sourceIndex = index;
      }
    });

    if (!sourceDate || !sourceBlock) return;

    // Создаём копию данных
    const newBlocksByDate = JSON.parse(JSON.stringify(blocksByDate));

    // Удаляем блок из исходной даты
    newBlocksByDate[sourceDate] = newBlocksByDate[sourceDate].filter(b => b.id !== active.id);

    // Определяем целевую дату
    let targetDate = null;
    let targetIndex = -1;

    if (over.data.current?.type === 'date-zone') {
      targetDate = over.data.current.date;
      targetIndex = newBlocksByDate[targetDate]?.length || 0;
    } else if (over.data.current?.type === 'block') {
      Object.entries(newBlocksByDate).forEach(([dateStr, blocks]) => {
        const index = blocks.findIndex(b => b.id === over.id);
        if (index !== -1) {
          targetDate = dateStr;
          targetIndex = index;
        }
      });
    }

    if (!targetDate) return;

    // Вставляем блок в целевую дату
    const blockToMove = { ...sourceBlock };

    if (blockToMove.startTime) {
      const oldDate = new Date(blockToMove.startTime);
      const newDate = new Date(targetDate);
      newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
      blockToMove.startTime = newDate.toISOString();
      blockToMove.time = format(newDate, 'HH:mm');
    }

    if (targetIndex === -1 || targetIndex >= newBlocksByDate[targetDate].length) {
      newBlocksByDate[targetDate].push(blockToMove);
    } else {
      newBlocksByDate[targetDate].splice(targetIndex, 0, blockToMove);
    }

    // Пересчитываем время для обеих дат
    if (newBlocksByDate[sourceDate]) {
      newBlocksByDate[sourceDate] = recalculateDayTimes(newBlocksByDate[sourceDate]);
    }
    newBlocksByDate[targetDate] = recalculateDayTimes(newBlocksByDate[targetDate]);

    setBlocksByDate(newBlocksByDate);
    setHasChanges(true);
  };

  // 🔥 ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ ВРЕМЕНИ
  const handleTimeClick = (block) => {
    if (!canEditProgram) return;
    setTimeEditBlock(block);
    setTimeEditValue(block.time || '09:00');
  };

  const handleTimeSave = async () => {
    if (!timeEditBlock) return;

    setLoading(true);
    try {
      let newStartTime = new Date(timeEditBlock.startTime || new Date());
      const [hours, minutes] = timeEditValue.split(':');
      newStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await scheduleAPI.updateScheduleItem(timeEditBlock.realId, {
        start_time: newStartTime.toISOString()
      });

      const newBlocksByDate = JSON.parse(JSON.stringify(blocksByDate));

      Object.values(newBlocksByDate).forEach(blocks => {
        const index = blocks.findIndex(b => b.id === timeEditBlock.id);
        if (index !== -1) {
          blocks[index] = {
            ...blocks[index],
            time: timeEditValue,
            startTime: newStartTime.toISOString()
          };
        }
      });

      Object.keys(newBlocksByDate).forEach(dateStr => {
        newBlocksByDate[dateStr] = recalculateDayTimes(newBlocksByDate[dateStr]);
      });

      setBlocksByDate(newBlocksByDate);
      setTimeEditBlock(null);
      setHasChanges(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('❌ Ошибка сохранения времени:', err);
      setError('Не удалось сохранить время');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ ВСЕХ ИЗМЕНЕНИЙ
const handleSaveChanges = async () => {
  setLoading(true);
  setError('');

  try {
    const blockUpdates = [];
    const speakerUpdates = [];

    // Сохраняем порядок блоков и их время
    Object.entries(blocksByDate).forEach(([dateStr, blocks]) => {
      blocks.forEach((block, index) => {
        if (block.realId) {
          // Для каждого блока отправляем и порядок, и время
          blockUpdates.push({
            id: block.realId,
            order: index,
            start_time: block.startTime  // 🔥 ДОБАВЛЯЕМ ВРЕМЯ
          });
        }
      });
    });

    // Сохраняем порядок докладчиков
    plenarySpeakers.forEach((speaker, index) => {
      speakerUpdates.push({
        id: speaker.id,
        order: index
      });
    });

    Object.entries(sectionSpeakers).forEach(([sectionId, speakers]) => {
      speakers.forEach((speaker, index) => {
        speakerUpdates.push({
          id: speaker.id,
          order: index
        });
      });
    });

    // Отправляем обновления блоков с временем
    if (blockUpdates.length > 0) {
      // Используем обычный update вместо bulkUpdate, так как нужно обновить время
      for (const update of blockUpdates) {
        await scheduleAPI.updateScheduleItem(update.id, {
          order: update.order,
          start_time: update.start_time
        });
      }
    }

    if (speakerUpdates.length > 0) {
      await participantsAPI.bulkUpdateSpeakerOrder(speakerUpdates);
    }

    setOriginalBlocksByDate(JSON.parse(JSON.stringify(blocksByDate)));
    setHasChanges(false);
    setHasSpeakerChanges(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);

  } catch (err) {
    console.error('❌ Ошибка сохранения:', err);
    setError('Не удалось сохранить изменения');
  } finally {
    setLoading(false);
  }
};

  const handleAddClick = () => {
    setEditingBlock(null);
    setFormData({ title: '' });
    setShowAddForm(true);
  };

  const handleEditBlock = (block) => {
    setEditingBlock(block);
    setFormData({ title: block.title });
    setShowAddForm(true);
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm('Удалить этот пункт из программы?')) return;

    setLoading(true);
    setError('');

    try {
      let blockToDelete = null;
      Object.values(blocksByDate).forEach(blocks => {
        const found = blocks.find(b => b.id === blockId);
        if (found) blockToDelete = found;
      });

      if (blockToDelete && blockToDelete.realId) {
        await scheduleAPI.deleteScheduleItem(blockToDelete.realId);
        await loadProgramData();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('❌ Ошибка удаления:', err);
      setError(err.response?.data?.error || 'Не удалось удалить пункт');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    setLoading(true);
    try {
      const dates = getDatesBetween(eventStartDate, eventEndDate);
      const firstDay = dates[0];
      firstDay.setHours(12, 0, 0, 0);

      const dataToSend = {
        event: eventId,
        section: null,
        is_plenary: false,
        participant: null,
        title: formData.title,
        description: '',
        start_time: firstDay.toISOString(),
        order: Object.values(blocksByDate).flat().length
      };

      if (editingBlock) {
        await scheduleAPI.updateScheduleItem(editingBlock.realId, dataToSend);
      } else {
        await scheduleAPI.createScheduleItem(dataToSend);
      }

      await loadProgramData();
      setShowAddForm(false);
      setEditingBlock(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('❌ Ошибка сохранения:', err);
      setError(err.response?.data?.error || 'Не удалось сохранить блок');
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingBlock(null);
    setFormData({ title: '' });
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '?';
    return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase();
  };

  const getBlockIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('кофе') || lowerTitle.includes('coffee')) return <CoffeeIcon />;
    if (lowerTitle.includes('обед') || lowerTitle.includes('lunch')) return <LunchDiningIcon />;
    if (lowerTitle.includes('регистрац')) return <EmojiPeopleIcon />;
    return <AccessTimeIcon />;
  };

  if (loading && !Object.keys(blocksByDate).length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <StyledDialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ScheduleIcon sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight="700">
              {isSectionPage ? 'Программа секции' : 'Программа мероприятия'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white', borderRadius: theme.spacing(1.5) }}>
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>

        <StyledDialogContent>
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: theme.spacing(2) }}>
              Изменения сохранены
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: theme.spacing(2) }}>
              {error}
            </Alert>
          )}

          {/* Заголовок мероприятия */}
          <Box sx={{ mt: 3, ml: 2 }}>
            <Typography variant="h4" fontWeight="700" color="primary.main">
              {eventTitle || 'Мероприятие'}
              {isSectionPage && currentSectionId && (
                <Typography component="span" variant="h6" sx={{ ml: 2, color: 'text.secondary' }}>
                  • {sections.find(s => s.id === currentSectionId)?.title}
                </Typography>
              )}
            </Typography>
          </Box>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {Object.entries(blocksByDate).map(([dateStr, dayBlocks]) => (
              <DateDropZone key={dateStr} date={dateStr}>
                {/* Заголовок даты */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    mb: 2,
                    borderBottom: '2px solid',
                    borderColor: 'primary.light',
                    pb: 1
                  }}
                >
                  {formatDateHeader(parseISO(dateStr))}
                </Typography>

                {/* Контейнер для блоков этого дня */}
                <SortableContext items={dayBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  {dayBlocks.map((block) => {
                    // 🔥 ОПРЕДЕЛЯЕМ ПРАВА ДЛЯ ЭТОГО БЛОКА
                    let canDragBlock = false;
                    let canDragSpeakers = false;

                    if (canManageEverything) {
                      canDragBlock = true;
                      canDragSpeakers = true;
                    } else if (block.type === 'plenary' && isPlenaryModerator) {
                      canDragSpeakers = true;
                    } else if (block.type === 'section' && block.sectionId) {
                      const isThisSectionModerator = isSectionModerator(block.sectionId);
                      if (isThisSectionModerator) {
                        canDragSpeakers = true;
                      }
                    }

                    return (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        isDragDisabled={!canDragBlock}
                      >
                        <BlockCard isplenary={block.type === 'plenary'}>
                          <BlockHeader>
                            <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 20 }} />

                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                              {block.type === 'plenary' && <StarIcon sx={{ color: theme.palette.warning.main }} />}
                              {block.type === 'section' && <MenuBookIcon sx={{ color: block.color || theme.palette.primary.main }} />}
                              {block.type === 'custom' && getBlockIcon(block.title)}

                              <Typography variant="subtitle1" fontWeight="600">
                                {block.title}
                              </Typography>

                              {block.type === 'plenary' && (
                                <PlenaryBadge label="Пленарное" size="small" icon={<StarIcon />} />
                              )}
                              {block.type === 'section' && (
                                <SectionBadge label="Секция" size="small" color={block.color} />
                              )}
                            </Box>

                            <TimeChip
                              icon={<AccessTimeIcon />}
                              label={block.time}
                              color={block.type === 'plenary' ? theme.palette.warning.main : block.color || theme.palette.grey[600]}
                              onClick={() => handleTimeClick(block)}
                            />

                            {block.type === 'custom' && canManageEverything && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteBlock(block.id)}
                                sx={{ color: theme.palette.error.main }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </BlockHeader>

                          {/* Докладчики пленарного заседания - только на главной странице */}
{block.type === 'plenary' && !isSectionPage && plenarySpeakers.length > 0 && (
  <Box sx={{ mt: 2 }}>
    {plenarySpeakers.map((speaker, idx) => (
      <SpeakerRow key={speaker.id}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
          {idx + 1}.
        </Typography>
        <Avatar src={speaker.user?.avatar} sx={{ width: 28, height: 28 }}>
          {getInitials(speaker.user?.first_name, speaker.user?.last_name)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight="500">
            {speaker.user?.first_name} {speaker.user?.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {speaker.talk_title}
          </Typography>
        </Box>

        {/* Кнопки для изменения порядка */}
        {(canManageEverything || (block.type === 'plenary' && isPlenaryModerator)) && (
          <Box>
            <IconButton
              size="small"
              onClick={() => moveSpeakerUp(block.id, speaker.id)}
              disabled={idx === 0}
            >
              <ArrowUpIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => moveSpeakerDown(block.id, speaker.id)}
              disabled={idx === plenarySpeakers.length - 1}
            >
              <ArrowDownIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </SpeakerRow>
    ))}
  </Box>
)}

{/* Докладчики секции - только на странице секции и только для текущей секции */}
{block.type === 'section' && isSectionPage && block.sectionId === currentSectionId &&
 sectionSpeakers[block.sectionId]?.length > 0 && (
  <Box sx={{ mt: 2 }}>
    {sectionSpeakers[block.sectionId].map((speaker, idx) => (
      <SpeakerRow key={speaker.id}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
          {idx + 1}.
        </Typography>
        <Avatar src={speaker.user?.avatar} sx={{ width: 28, height: 28 }}>
          {getInitials(speaker.user?.first_name, speaker.user?.last_name)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight="500">
            {speaker.user?.first_name} {speaker.user?.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {speaker.talk_title}
          </Typography>
        </Box>

        {/* Кнопки для изменения порядка */}
        {(canManageEverything ||
          (block.type === 'section' && isSectionModerator(block.sectionId))) && (
          <Box>
            <IconButton
              size="small"
              onClick={() => moveSpeakerUp(block.id, speaker.id)}
              disabled={idx === 0}
            >
              <ArrowUpIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => moveSpeakerDown(block.id, speaker.id)}
              disabled={idx === sectionSpeakers[block.sectionId].length - 1}
            >
              <ArrowDownIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </SpeakerRow>
    ))}
  </Box>
)}
                        </BlockCard>
                      </SortableBlock>
                    );
                  })}
                </SortableContext>
              </DateDropZone>
            ))}

            <DragOverlay>
              {activeBlock && (
                <BlockCard isplenary={activeBlock.type === 'plenary'}>
                  <BlockHeader>
                    <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight="600">
                      {activeBlock.title}
                    </Typography>
                  </BlockHeader>
                </BlockCard>
              )}
            </DragOverlay>
          </DndContext>

          {canManageEverything && !showAddForm && (
            <AddButton fullWidth startIcon={<AddIcon />} onClick={handleAddClick}>
              Добавить пункт в расписание
            </AddButton>
          )}

          {canManageEverything && showAddForm && (
            <FormCard elevation={0}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
                {editingBlock ? 'Редактирование блока' : 'Новый блок'}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Название блока *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Например: Кофе-брейк, Регистрация, Обед..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button variant="outlined" onClick={handleFormCancel} startIcon={<CancelIcon />} sx={{ borderRadius: 5, px: 4 }}>
                    Отмена
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleFormSubmit}
                    disabled={loading || !formData.title.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    sx={{ borderRadius: 5, px: 4 }}
                  >
                    {loading ? 'Сохранение...' : editingBlock ? 'Сохранить' : 'Добавить'}
                  </Button>
                </Box>
              </Box>
            </FormCard>
          )}

          {/* 🔥 КНОПКА СОХРАНЕНИЯ - ТЕПЕРЬ ПОКАЗЫВАЕТСЯ И ДЛЯ МОДЕРАТОРОВ */}
          {(hasChanges && (canManageEverything || hasSpeakerChanges)) && (
            <Box sx={{
              position: 'sticky',
              bottom: 0,
              mt: 2,
              p: 2,
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              zIndex: 10
            }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setBlocksByDate(JSON.parse(JSON.stringify(originalBlocksByDate)));
                  setHasChanges(false);
                  setHasSpeakerChanges(false);
                }}
                sx={{ borderRadius: 5, px: 4 }}
              >
                Отмена
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSaveChanges}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{ borderRadius: 5, px: 4 }}
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </Box>
          )}

          <MuiDialog open={!!timeEditBlock} onClose={() => setTimeEditBlock(null)}>
            <MuiDialogTitle>Редактирование времени</MuiDialogTitle>
            <MuiDialogContent>
              <TextField
                type="time"
                value={timeEditValue}
                onChange={(e) => setTimeEditValue(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ mt: 2 }}
              />
            </MuiDialogContent>
            <DialogActions>
              <Button onClick={() => setTimeEditBlock(null)}>Отмена</Button>
              <Button onClick={handleTimeSave} variant="contained" color="success">
                Сохранить
              </Button>
            </DialogActions>
          </MuiDialog>
        </StyledDialogContent>
      </StyledDialog>
    </LocalizationProvider>
  );
};

export default EventProgramModal;