// frontend/src/constants/taskConstants.js
// Единые константы для задач и спринтов

// ==================== СТАТУСЫ ЗАДАЧ ====================
export const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
  CANCELLED: 'cancelled'
};

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.BACKLOG]: 'Бэклог',
  [TASK_STATUS.TODO]: 'К выполнению',
  [TASK_STATUS.IN_PROGRESS]: 'В работе',
  [TASK_STATUS.REVIEW]: 'На проверке',
  [TASK_STATUS.DONE]: 'Выполнено',
  [TASK_STATUS.CANCELLED]: 'Отменено'
};

export const TASK_STATUS_COLORS = {
  [TASK_STATUS.BACKLOG]: '#9e9e9e',
  [TASK_STATUS.TODO]: '#ffb74d',
  [TASK_STATUS.IN_PROGRESS]: '#4fc3f7',
  [TASK_STATUS.REVIEW]: '#ff8a65',
  [TASK_STATUS.DONE]: '#81c784',
  [TASK_STATUS.CANCELLED]: '#f44336'
};

export const TASK_STATUS_MUI_COLORS = {
  [TASK_STATUS.BACKLOG]: 'default',
  [TASK_STATUS.TODO]: 'info',
  [TASK_STATUS.IN_PROGRESS]: 'warning',
  [TASK_STATUS.REVIEW]: 'primary',
  [TASK_STATUS.DONE]: 'success',
  [TASK_STATUS.CANCELLED]: 'error'
};

// ==================== ПРИОРИТЕТЫ ЗАДАЧ ====================
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const PRIORITY_LABELS = {
  [PRIORITY.LOW]: 'Низкий',
  [PRIORITY.MEDIUM]: 'Средний',
  [PRIORITY.HIGH]: 'Высокий',
  [PRIORITY.CRITICAL]: 'Критический'
};

export const PRIORITY_COLORS = {
  [PRIORITY.LOW]: '#4caf50',
  [PRIORITY.MEDIUM]: '#ff9800',
  [PRIORITY.HIGH]: '#f44336',
  [PRIORITY.CRITICAL]: '#d32f2f'
};

export const PRIORITY_MUI_COLORS = {
  [PRIORITY.LOW]: 'success',
  [PRIORITY.MEDIUM]: 'warning',
  [PRIORITY.HIGH]: 'error',
  [PRIORITY.CRITICAL]: 'error'
};

// ==================== СТАТУСЫ СПРИНТОВ ====================
export const SPRINT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const SPRINT_STATUS_LABELS = {
  [SPRINT_STATUS.PLANNING]: 'Планирование',
  [SPRINT_STATUS.ACTIVE]: 'Активный',
  [SPRINT_STATUS.COMPLETED]: 'Завершен',
  [SPRINT_STATUS.CANCELLED]: 'Отменен'
};

export const SPRINT_STATUS_COLORS = {
  [SPRINT_STATUS.PLANNING]: '#9e9e9e',
  [SPRINT_STATUS.ACTIVE]: '#4caf50',
  [SPRINT_STATUS.COMPLETED]: '#2196f3',
  [SPRINT_STATUS.CANCELLED]: '#f44336'
};

// ==================== ТИПЫ ПРОЕКТОВ ====================
export const PROJECT_TYPE = {
  RESEARCH_PAPER: 'research_paper',
  DISSERTATION: 'dissertation',
  GRANT: 'grant',
  CONFERENCE: 'conference',
  BOOK: 'book',
  CREATIVE: 'creative',
  OTHER: 'other'
};

export const PROJECT_TYPE_LABELS = {
  [PROJECT_TYPE.RESEARCH_PAPER]: 'Научная статья',
  [PROJECT_TYPE.DISSERTATION]: 'Диссертация',
  [PROJECT_TYPE.GRANT]: 'Грантовый проект',
  [PROJECT_TYPE.CONFERENCE]: 'Подготовка к конференции',
  [PROJECT_TYPE.BOOK]: 'Книга/Монография',
  [PROJECT_TYPE.CREATIVE]: 'Творческий проект',
  [PROJECT_TYPE.OTHER]: 'Другой проект'
};

// ==================== СТАТУСЫ ПРОЕКТОВ ====================
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  RECRUITING: 'recruiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  ARCHIVED: 'archived'
};

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.DRAFT]: 'Черновик',
  [PROJECT_STATUS.RECRUITING]: 'Набор участников',
  [PROJECT_STATUS.ACTIVE]: 'Активный',
  [PROJECT_STATUS.COMPLETED]: 'Завершен',
  [PROJECT_STATUS.ON_HOLD]: 'На паузе',
  [PROJECT_STATUS.ARCHIVED]: 'В архиве'
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
export const getTaskStatusText = (status) => TASK_STATUS_LABELS[status] || status;
export const getTaskStatusColor = (status) => TASK_STATUS_COLORS[status] || '#9e9e9e';
export const getTaskStatusMuiColor = (status) => TASK_STATUS_MUI_COLORS[status] || 'default';

export const getPriorityText = (priority) => PRIORITY_LABELS[priority] || priority;
export const getPriorityColor = (priority) => PRIORITY_COLORS[priority] || '#ff9800';
export const getPriorityMuiColor = (priority) => PRIORITY_MUI_COLORS[priority] || 'warning';

export const getSprintStatusText = (status) => SPRINT_STATUS_LABELS[status] || status;
export const getSprintStatusColor = (status) => SPRINT_STATUS_COLORS[status] || '#9e9e9e';

export const getProjectTypeText = (type) => PROJECT_TYPE_LABELS[type] || type;
export const getProjectStatusText = (status) => PROJECT_STATUS_LABELS[status] || status;