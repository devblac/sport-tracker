/**
 * Notification Templates
 * 
 * Predefined templates for different types of notifications.
 */

import type { NotificationTemplate, NotificationAction } from '@/types/notifications';

// ============================================================================
// Common Actions
// ============================================================================

const COMMON_ACTIONS: Record<string, NotificationAction> = {
  START_WORKOUT: {
    action: 'start_workout',
    title: 'Empezar Entrenamiento',
    icon: '💪'
  },
  VIEW_PROGRESS: {
    action: 'view_progress',
    title: 'Ver Progreso',
    icon: '📊'
  },
  VIEW_ACHIEVEMENTS: {
    action: 'view_achievements',
    title: 'Ver Logros',
    icon: '🏆'
  },
  DISMISS: {
    action: 'dismiss',
    title: 'Descartar',
    icon: '❌'
  },
  SNOOZE: {
    action: 'snooze',
    title: 'Recordar en 1h',
    icon: '⏰'
  },
  OPEN_APP: {
    action: 'open_app',
    title: 'Abrir App',
    icon: '📱'
  }
};

// ============================================================================
// Workout Reminder Templates
// ============================================================================

export const WORKOUT_REMINDER_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'workout_reminder_basic',
    type: 'workout_reminder',
    category: 'workout',
    title: '💪 ¡Hora de entrenar!',
    body: 'Es momento de tu entrenamiento programado. ¡Mantén tu racha de {streakCount} días!',
    icon: '/icons/workout-reminder.png',
    priority: 'normal',
    variables: ['streakCount'],
    actions: [COMMON_ACTIONS.START_WORKOUT, COMMON_ACTIONS.SNOOZE, COMMON_ACTIONS.DISMISS]
  },
  {
    id: 'workout_reminder_motivational',
    type: 'workout_reminder',
    category: 'workout',
    title: '🔥 ¡{userName}, es tu momento!',
    body: 'Tu cuerpo está listo para el siguiente nivel. ¡No rompas tu racha de {streakCount} días!',
    icon: '/icons/workout-fire.png',
    priority: 'normal',
    variables: ['userName', 'streakCount'],
    actions: [COMMON_ACTIONS.START_WORKOUT, COMMON_ACTIONS.SNOOZE]
  },
  {
    id: 'workout_reminder_streak_risk',
    type: 'workout_reminder',
    category: 'workout',
    title: '⚠️ ¡Tu racha está en riesgo!',
    body: 'Tienes {hoursLeft} horas para mantener tu racha de {streakCount} días. ¡No la pierdas ahora!',
    icon: '/icons/streak-warning.png',
    priority: 'high',
    variables: ['hoursLeft', 'streakCount'],
    actions: [COMMON_ACTIONS.START_WORKOUT, COMMON_ACTIONS.DISMISS]
  },
  {
    id: 'workout_reminder_first_time',
    type: 'workout_reminder',
    category: 'workout',
    title: '🌟 ¡Bienvenido a tu journey fitness!',
    body: '¡Es hora de tu primer entrenamiento! Cada gran journey comienza con un solo paso.',
    icon: '/icons/first-workout.png',
    priority: 'normal',
    variables: [],
    actions: [COMMON_ACTIONS.START_WORKOUT, COMMON_ACTIONS.DISMISS]
  }
];

// ============================================================================
// Streak Reminder Templates
// ============================================================================

export const STREAK_REMINDER_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'streak_at_risk_urgent',
    type: 'streak_at_risk',
    category: 'workout',
    title: '🚨 ¡Racha en peligro!',
    body: 'Tu racha de {streakCount} días expira en {hoursLeft} horas. ¡No la pierdas ahora!',
    icon: '/icons/streak-urgent.png',
    priority: 'urgent',
    variables: ['streakCount', 'hoursLeft'],
    actions: [COMMON_ACTIONS.START_WORKOUT, COMMON_ACTIONS.DISMISS]
  },
  {
    id: 'streak_reminder_daily',
    type: 'streak_reminder',
    category: 'workout',
    title: '🔥 Racha de {streakCount} días',
    body: '¡Increíble consistencia! ¿Listo para el día {nextDay}?',
    icon: '/icons/streak-fire.png',
    priority: 'normal',
    variables: ['streakCount', 'nextDay'],
    actions: [COMMON_ACTIONS.START_WORKOUT, COMMON_ACTIONS.VIEW_PROGRESS]
  },
  {
    id: 'streak_milestone_approaching',
    type: 'streak_reminder',
    category: 'achievement',
    title: '🎯 ¡Casi alcanzas {milestone} días!',
    body: 'Solo {daysLeft} días más para alcanzar este increíble hito. ¡Sigue así!',
    icon: '/icons/milestone-approaching.png',
    priority: 'normal',
    variables: ['milestone', 'daysLeft'],
    actions: [COMMON_ACTIONS.START_WORKOUT, COMMON_ACTIONS.VIEW_PROGRESS]
  }
];

// ============================================================================
// Achievement Celebration Templates
// ============================================================================

export const ACHIEVEMENT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'achievement_unlocked_basic',
    type: 'achievement_unlocked',
    category: 'achievement',
    title: '🏆 ¡Logro desbloqueado!',
    body: 'Has desbloqueado: {achievementName}. ¡{achievementDescription}!',
    icon: '/icons/achievement-unlocked.png',
    priority: 'high',
    variables: ['achievementName', 'achievementDescription'],
    actions: [COMMON_ACTIONS.VIEW_ACHIEVEMENTS, COMMON_ACTIONS.DISMISS]
  },
  {
    id: 'achievement_rare',
    type: 'achievement_unlocked',
    category: 'achievement',
    title: '💎 ¡Logro Raro Desbloqueado!',
    body: '¡Increíble! Has desbloqueado "{achievementName}" - Solo el {percentage}% de usuarios lo tienen.',
    icon: '/icons/rare-achievement.png',
    priority: 'high',
    variables: ['achievementName', 'percentage'],
    actions: [COMMON_ACTIONS.VIEW_ACHIEVEMENTS, COMMON_ACTIONS.OPEN_APP]
  },
  {
    id: 'level_up_celebration',
    type: 'level_up',
    category: 'achievement',
    title: '⬆️ ¡Subiste de nivel!',
    body: '¡Felicidades! Ahora eres nivel {newLevel}. Has ganado {xpGained} XP.',
    icon: '/icons/level-up.png',
    priority: 'high',
    variables: ['newLevel', 'xpGained'],
    actions: [COMMON_ACTIONS.VIEW_PROGRESS, COMMON_ACTIONS.DISMISS]
  },
  {
    id: 'milestone_reached',
    type: 'milestone_reached',
    category: 'achievement',
    title: '🎉 ¡Hito Alcanzado!',
    body: '¡{milestoneTitle}! Has completado {count} {activity}. ¡Sigue así!',
    icon: '/icons/milestone.png',
    priority: 'normal',
    variables: ['milestoneTitle', 'count', 'activity'],
    actions: [COMMON_ACTIONS.VIEW_ACHIEVEMENTS, COMMON_ACTIONS.DISMISS]
  }
];

// ============================================================================
// Progress and Weekly Summary Templates
// ============================================================================

export const PROGRESS_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'weekly_progress_summary',
    type: 'weekly_progress',
    category: 'progress',
    title: '📊 Resumen Semanal',
    body: 'Esta semana: {workoutsCompleted} entrenamientos, {xpGained} XP ganado. ¡{weeklyMessage}!',
    icon: '/icons/weekly-summary.png',
    priority: 'normal',
    variables: ['workoutsCompleted', 'xpGained', 'weeklyMessage'],
    actions: [COMMON_ACTIONS.VIEW_PROGRESS, COMMON_ACTIONS.DISMISS]
  },
  {
    id: 'personal_record',
    type: 'milestone_reached',
    category: 'achievement',
    title: '🚀 ¡Nuevo Récord Personal!',
    body: 'Nuevo PR en {exerciseName}: {newRecord} ({improvement} de mejora)',
    icon: '/icons/personal-record.png',
    priority: 'high',
    variables: ['exerciseName', 'newRecord', 'improvement'],
    actions: [COMMON_ACTIONS.VIEW_PROGRESS, COMMON_ACTIONS.DISMISS]
  }
];

// ============================================================================
// Social Templates
// ============================================================================

export const SOCIAL_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'friend_request_received',
    type: 'friend_request',
    category: 'social',
    title: '👥 Nueva solicitud de amistad',
    body: '{friendName} quiere ser tu gym buddy. ¡Entrenen juntos!',
    icon: '/icons/friend-request.png',
    priority: 'normal',
    variables: ['friendName'],
    actions: [
      { action: 'accept_friend', title: 'Aceptar', icon: '✅' },
      { action: 'decline_friend', title: 'Rechazar', icon: '❌' }
    ]
  },
  {
    id: 'friend_achievement',
    type: 'friend_achievement',
    category: 'social',
    title: '🎉 ¡Tu amigo logró algo increíble!',
    body: '{friendName} desbloqueó "{achievementName}". ¡Felicítalo!',
    icon: '/icons/friend-achievement.png',
    priority: 'low',
    variables: ['friendName', 'achievementName'],
    actions: [
      { action: 'congratulate', title: 'Felicitar', icon: '👏' },
      COMMON_ACTIONS.DISMISS
    ]
  }
];

// ============================================================================
// System Templates
// ============================================================================

export const SYSTEM_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'app_update_available',
    type: 'system_update',
    category: 'system',
    title: '🔄 Actualización disponible',
    body: 'Nueva versión disponible con mejoras y nuevas funciones.',
    icon: '/icons/app-update.png',
    priority: 'low',
    variables: [],
    actions: [
      { action: 'update_app', title: 'Actualizar', icon: '⬇️' },
      COMMON_ACTIONS.DISMISS
    ]
  },
  {
    id: 'maintenance_notice',
    type: 'maintenance',
    category: 'system',
    title: '🔧 Mantenimiento programado',
    body: 'Mantenimiento el {date} de {startTime} a {endTime}. Funcionalidad limitada.',
    icon: '/icons/maintenance.png',
    priority: 'normal',
    variables: ['date', 'startTime', 'endTime'],
    actions: [COMMON_ACTIONS.DISMISS]
  }
];

// ============================================================================
// All Templates Export
// ============================================================================

export const ALL_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  ...WORKOUT_REMINDER_TEMPLATES,
  ...STREAK_REMINDER_TEMPLATES,
  ...ACHIEVEMENT_TEMPLATES,
  ...PROGRESS_TEMPLATES,
  ...SOCIAL_TEMPLATES,
  ...SYSTEM_TEMPLATES
];

export const TEMPLATES_BY_TYPE: Record<string, NotificationTemplate[]> = {
  workout_reminder: WORKOUT_REMINDER_TEMPLATES,
  streak_reminder: STREAK_REMINDER_TEMPLATES,
  streak_at_risk: STREAK_REMINDER_TEMPLATES.filter(t => t.type === 'streak_at_risk'),
  achievement_unlocked: ACHIEVEMENT_TEMPLATES.filter(t => t.type === 'achievement_unlocked'),
  level_up: ACHIEVEMENT_TEMPLATES.filter(t => t.type === 'level_up'),
  milestone_reached: ACHIEVEMENT_TEMPLATES.filter(t => t.type === 'milestone_reached'),
  weekly_progress: PROGRESS_TEMPLATES.filter(t => t.type === 'weekly_progress'),
  friend_request: SOCIAL_TEMPLATES.filter(t => t.type === 'friend_request'),
  friend_achievement: SOCIAL_TEMPLATES.filter(t => t.type === 'friend_achievement'),
  system_update: SYSTEM_TEMPLATES.filter(t => t.type === 'system_update'),
  maintenance: SYSTEM_TEMPLATES.filter(t => t.type === 'maintenance')
};

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  workoutReminders: true,
  achievementCelebrations: true,
  streakReminders: true,
  socialUpdates: true,
  weeklyProgress: true,
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  },
  frequency: {
    workoutReminders: 'workout_days' as const,
    achievementCelebrations: 'immediate' as const,
    streakReminders: 'at_risk' as const
  }
};

export default {
  ALL_NOTIFICATION_TEMPLATES,
  TEMPLATES_BY_TYPE,
  WORKOUT_REMINDER_TEMPLATES,
  STREAK_REMINDER_TEMPLATES,
  ACHIEVEMENT_TEMPLATES,
  PROGRESS_TEMPLATES,
  SOCIAL_TEMPLATES,
  SYSTEM_TEMPLATES,
  DEFAULT_NOTIFICATION_SETTINGS
};