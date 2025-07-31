/**
 * Gamification Components Index
 * 
 * Centralized exports for all gamification-related components
 */

// XP Progress Components
export {
  XPProgressBar,
  CompactXPProgressBar,
  DetailedXPProgressBar
} from './XPProgressBar';

// Level Badge Components
export {
  LevelBadge,
  AnimatedLevelBadge,
  ClickableLevelBadge,
  DetailedLevelBadge
} from './LevelBadge';

// Level Up Celebration Components
export {
  LevelUpCelebration,
  LevelUpToast
} from './LevelUpCelebration';

// Dashboard Components
export {
  GamificationDashboard,
  CompactGamificationSummary
} from './GamificationDashboard';

// XP Integration Components
export {
  XPNotifications,
  useXPNotifications,
  FloatingXPIndicator,
  XPProgressIndicator
} from './XPNotifications';

export {
  XPIntegrationProvider,
  useXPIntegration,
  withXPIntegration,
  XPActionWrapper,
  XPPreview,
  XPButton,
  XPMultiplierDisplay
} from './withXPIntegration';

// Re-export types for convenience
export type {
  UserLevel,
  GamificationStats,
  UserStreak,
  Achievement,
  UserAchievement,
  XPSource,
  XPAwardResult,
  GamificationEvent
} from '@/types/gamification';