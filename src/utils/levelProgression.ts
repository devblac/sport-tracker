/**
 * Level Progression Utilities
 * 
 * This module handles user level calculations, progression, and unlockable content.
 * It implements the level system requirements from the gamification design.
 */

import type { 
  LevelConfig, 
  UserLevel,
  XPAwardResult 
} from '@/types/gamification';

// ============================================================================
// Level Configuration
// ============================================================================

/**
 * Default level configurations with exponential XP requirements
 * Formula: XP_required = 100 * (1.5 ^ (level - 1))
 */
export const DEFAULT_LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    xpRequired: 0,
    title: 'Novice',
    description: 'Welcome to your fitness journey!',
    perks: ['Basic workout tracking', 'Exercise database access'],
    unlockedFeatures: ['workout_creation', 'exercise_search'],
    badgeIcon: '🥉',
    badgeColor: '#CD7F32'
  },
  {
    level: 2,
    xpRequired: 100,
    title: 'Beginner',
    description: 'You\'re getting started!',
    perks: ['Workout templates', 'Basic progress tracking'],
    unlockedFeatures: ['workout_templates', 'basic_analytics'],
    badgeIcon: '🏃',
    badgeColor: '#C0C0C0'
  },
  {
    level: 3,
    xpRequired: 250,
    title: 'Apprentice',
    description: 'Building consistency!',
    perks: ['Personal records tracking', 'Achievement system'],
    unlockedFeatures: ['personal_records', 'achievements'],
    badgeIcon: '💪',
    badgeColor: '#FFD700'
  },
  {
    level: 4,
    xpRequired: 475,
    title: 'Enthusiast',
    description: 'Fitness is becoming a habit!',
    perks: ['Social features', 'Gym friends'],
    unlockedFeatures: ['social_feed', 'gym_friends'],
    badgeIcon: '🔥',
    badgeColor: '#FF6B35'
  },
  {
    level: 5,
    xpRequired: 812,
    title: 'Dedicated',
    description: 'Committed to the grind!',
    perks: ['Advanced analytics', 'Progress charts'],
    unlockedFeatures: ['advanced_analytics', 'progress_charts'],
    badgeIcon: '📈',
    badgeColor: '#4ECDC4'
  },
  {
    level: 6,
    xpRequired: 1318,
    title: 'Warrior',
    description: 'Strength is your weapon!',
    perks: ['Challenge participation', 'Leaderboards'],
    unlockedFeatures: ['challenges', 'leaderboards'],
    badgeIcon: '⚔️',
    badgeColor: '#45B7D1'
  },
  {
    level: 7,
    xpRequired: 2077,
    title: 'Champion',
    description: 'Rising above the rest!',
    perks: ['Custom achievements', 'Streak shields'],
    unlockedFeatures: ['custom_achievements', 'streak_protection'],
    badgeIcon: '🏆',
    badgeColor: '#96CEB4'
  },
  {
    level: 8,
    xpRequired: 3215,
    title: 'Elite',
    description: 'Among the fitness elite!',
    perks: ['Mentorship access', 'Premium features trial'],
    unlockedFeatures: ['mentorship', 'premium_trial'],
    badgeIcon: '👑',
    badgeColor: '#FFEAA7'
  },
  {
    level: 9,
    xpRequired: 4893,
    title: 'Master',
    description: 'Mastery through dedication!',
    perks: ['Content creation', 'Advanced customization'],
    unlockedFeatures: ['content_creation', 'advanced_customization'],
    badgeIcon: '🎯',
    badgeColor: '#DDA0DD'
  },
  {
    level: 10,
    xpRequired: 7439,
    title: 'Grandmaster',
    description: 'Legendary dedication!',
    perks: ['All features unlocked', 'Exclusive content'],
    unlockedFeatures: ['all_features', 'exclusive_content'],
    badgeIcon: '⭐',
    badgeColor: '#FFD700'
  },
  {
    level: 11,
    xpRequired: 11259,
    title: 'Legend',
    description: 'Your dedication inspires others!',
    perks: ['Legendary status', 'Special recognition'],
    unlockedFeatures: ['legendary_status', 'special_recognition'],
    badgeIcon: '🌟',
    badgeColor: '#FF1493'
  },
  {
    level: 12,
    xpRequired: 16988,
    title: 'Mythic',
    description: 'Mythical levels of commitment!',
    perks: ['Mythic powers', 'Ultimate customization'],
    unlockedFeatures: ['mythic_powers', 'ultimate_customization'],
    badgeIcon: '🔮',
    badgeColor: '#8A2BE2'
  },
  {
    level: 13,
    xpRequired: 25582,
    title: 'Immortal',
    description: 'Immortalized in fitness history!',
    perks: ['Immortal legacy', 'Infinite possibilities'],
    unlockedFeatures: ['immortal_legacy', 'infinite_features'],
    badgeIcon: '♾️',
    badgeColor: '#00CED1'
  },
  {
    level: 14,
    xpRequired: 38473,
    title: 'Transcendent',
    description: 'Beyond mortal limitations!',
    perks: ['Transcendent abilities', 'Reality bending'],
    unlockedFeatures: ['transcendent_abilities', 'reality_bending'],
    badgeIcon: '🌌',
    badgeColor: '#4B0082'
  },
  {
    level: 15,
    xpRequired: 57809,
    title: 'Godlike',
    description: 'Achieved godlike status!',
    perks: ['Divine powers', 'Universe control'],
    unlockedFeatures: ['divine_powers', 'universe_control'],
    badgeIcon: '⚡',
    badgeColor: '#FFD700'
  }
];

// ============================================================================
// Level Calculation Functions
// ============================================================================

/**
 * Calculate user's current level based on total XP
 */
export function calculateUserLevel(
  totalXP: number,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): UserLevel {
  // Find the highest level the user has reached
  let currentLevel = 1;
  let currentLevelConfig = levelConfigs[0];

  for (const config of levelConfigs) {
    if (totalXP >= config.xpRequired) {
      currentLevel = config.level;
      currentLevelConfig = config;
    } else {
      break;
    }
  }

  // Find next level config
  const nextLevelConfig = levelConfigs.find(config => config.level === currentLevel + 1);
  
  // Calculate XP for current and next level
  const xpForCurrentLevel = currentLevelConfig.xpRequired;
  const xpForNextLevel = nextLevelConfig?.xpRequired || totalXP;
  
  // Calculate current XP within the level
  const currentXP = totalXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  
  // Calculate progress percentage (0-1)
  const progress = xpNeededForNext > 0 ? currentXP / xpNeededForNext : 1;

  return {
    userId: '', // Will be set by caller
    level: currentLevel,
    currentXP: currentXP,
    totalXP: totalXP,
    xpForCurrentLevel: xpForCurrentLevel,
    xpForNextLevel: xpForNextLevel,
    progress: Math.min(progress, 1),
    title: currentLevelConfig.title,
    perks: currentLevelConfig.perks,
    updatedAt: new Date()
  };
}

/**
 * Check if user levels up after gaining XP
 */
export function checkLevelUp(
  currentTotalXP: number,
  newTotalXP: number,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): XPAwardResult['levelUp'] | undefined {
  const currentLevel = calculateUserLevel(currentTotalXP, levelConfigs);
  const newLevel = calculateUserLevel(newTotalXP, levelConfigs);

  if (newLevel.level > currentLevel.level) {
    const newLevelConfig = levelConfigs.find(config => config.level === newLevel.level);
    
    return {
      oldLevel: currentLevel.level,
      newLevel: newLevel.level,
      newTitle: newLevel.title,
      unlockedFeatures: newLevelConfig?.unlockedFeatures || []
    };
  }

  return undefined;
}

/**
 * Get level configuration by level number
 */
export function getLevelConfig(
  level: number,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): LevelConfig | undefined {
  return levelConfigs.find(config => config.level === level);
}

/**
 * Get all unlocked features for a user level
 */
export function getUnlockedFeatures(
  level: number,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): string[] {
  const unlockedFeatures: string[] = [];
  
  for (const config of levelConfigs) {
    if (config.level <= level) {
      unlockedFeatures.push(...config.unlockedFeatures);
    } else {
      break;
    }
  }

  return [...new Set(unlockedFeatures)]; // Remove duplicates
}

/**
 * Get next milestone level and XP needed
 */
export function getNextMilestone(
  currentLevel: number,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): { level: number; xpNeeded: number; title: string } | null {
  // Define milestone levels (every 5 levels)
  const milestones = [5, 10, 15, 20, 25, 30];
  
  const nextMilestone = milestones.find(milestone => milestone > currentLevel);
  
  if (!nextMilestone) {
    return null;
  }

  const milestoneConfig = levelConfigs.find(config => config.level === nextMilestone);
  
  if (!milestoneConfig) {
    return null;
  }

  return {
    level: nextMilestone,
    xpNeeded: milestoneConfig.xpRequired,
    title: milestoneConfig.title
  };
}

/**
 * Calculate XP needed to reach a specific level
 */
export function getXPNeededForLevel(
  targetLevel: number,
  currentTotalXP: number,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): number {
  const targetConfig = levelConfigs.find(config => config.level === targetLevel);
  
  if (!targetConfig) {
    return 0;
  }

  return Math.max(0, targetConfig.xpRequired - currentTotalXP);
}

/**
 * Get level progression statistics
 */
export function getLevelProgressionStats(
  totalXP: number,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): {
  currentLevel: UserLevel;
  nextMilestone: { level: number; xpNeeded: number; title: string } | null;
  progressToNext: number;
  totalLevels: number;
  completionPercentage: number;
} {
  const currentLevel = calculateUserLevel(totalXP, levelConfigs);
  const nextMilestone = getNextMilestone(currentLevel.level, levelConfigs);
  const totalLevels = levelConfigs.length;
  
  // Calculate overall completion percentage
  const maxXP = levelConfigs[levelConfigs.length - 1].xpRequired;
  const completionPercentage = (totalXP / maxXP) * 100;

  return {
    currentLevel,
    nextMilestone,
    progressToNext: currentLevel.progress,
    totalLevels,
    completionPercentage: Math.min(completionPercentage, 100)
  };
}

/**
 * Generate level progression rewards preview
 */
export function getLevelRewardsPreview(
  currentLevel: number,
  previewLevels: number = 3,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): Array<{
  level: number;
  title: string;
  xpRequired: number;
  newPerks: string[];
  newFeatures: string[];
}> {
  const preview: Array<{
    level: number;
    title: string;
    xpRequired: number;
    newPerks: string[];
    newFeatures: string[];
  }> = [];

  for (let i = 1; i <= previewLevels; i++) {
    const targetLevel = currentLevel + i;
    const config = levelConfigs.find(c => c.level === targetLevel);
    
    if (config) {
      preview.push({
        level: config.level,
        title: config.title,
        xpRequired: config.xpRequired,
        newPerks: config.perks,
        newFeatures: config.unlockedFeatures
      });
    }
  }

  return preview;
}

/**
 * Check if a feature is unlocked at current level
 */
export function isFeatureUnlocked(
  feature: string,
  userLevel: number,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): boolean {
  const unlockedFeatures = getUnlockedFeatures(userLevel, levelConfigs);
  return unlockedFeatures.includes(feature);
}

/**
 * Get level at which a feature unlocks
 */
export function getFeatureUnlockLevel(
  feature: string,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): number | null {
  for (const config of levelConfigs) {
    if (config.unlockedFeatures.includes(feature)) {
      return config.level;
    }
  }
  return null;
}

/**
 * Calculate level progression velocity (levels per day)
 */
export function calculateProgressionVelocity(
  xpHistory: Array<{ date: Date; totalXP: number }>,
  levelConfigs: LevelConfig[] = DEFAULT_LEVEL_CONFIGS
): {
  xpPerDay: number;
  levelsPerWeek: number;
  estimatedTimeToNextLevel: number; // days
} {
  if (xpHistory.length < 2) {
    return {
      xpPerDay: 0,
      levelsPerWeek: 0,
      estimatedTimeToNextLevel: Infinity
    };
  }

  // Calculate XP per day over the last 30 days
  const recentHistory = xpHistory
    .filter(entry => {
      const daysDiff = (Date.now() - entry.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (recentHistory.length < 2) {
    return {
      xpPerDay: 0,
      levelsPerWeek: 0,
      estimatedTimeToNextLevel: Infinity
    };
  }

  const firstEntry = recentHistory[0];
  const lastEntry = recentHistory[recentHistory.length - 1];
  
  const daysDiff = (lastEntry.date.getTime() - firstEntry.date.getTime()) / (1000 * 60 * 60 * 24);
  const xpDiff = lastEntry.totalXP - firstEntry.totalXP;
  
  const xpPerDay = daysDiff > 0 ? xpDiff / daysDiff : 0;

  // Calculate levels per week
  const currentLevel = calculateUserLevel(lastEntry.totalXP, levelConfigs);
  const xpNeededForNextLevel = currentLevel.xpForNextLevel - lastEntry.totalXP;
  
  const levelsPerWeek = xpPerDay > 0 ? (7 * xpPerDay) / (currentLevel.xpForNextLevel - currentLevel.xpForCurrentLevel) : 0;
  const estimatedTimeToNextLevel = xpPerDay > 0 ? xpNeededForNextLevel / xpPerDay : Infinity;

  return {
    xpPerDay,
    levelsPerWeek,
    estimatedTimeToNextLevel
  };
}

// All functions are exported individually above