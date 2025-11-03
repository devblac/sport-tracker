/**
 * Gamification Logic - MVP Version
 * 
 * Simplified XP calculation and level system for the MVP.
 * Focuses on core functionality without over-engineering.
 */

// ============================================================================
// Level System Configuration
// ============================================================================

/**
 * XP thresholds for each level (simplified progression)
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 3: 250 XP
 * Level 4: 500 XP
 * Level 5: 1000 XP
 * ... and so on with exponential growth
 */
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  3500,   // Level 7
  5500,   // Level 8
  8000,   // Level 9
  11000,  // Level 10
  15000,  // Level 11
  20000,  // Level 12
  26000,  // Level 13
  33000,  // Level 14
  41000,  // Level 15
  50000,  // Level 16
  60000,  // Level 17
  72000,  // Level 18
  85000,  // Level 19
  100000, // Level 20
];

/**
 * Streak multipliers for XP calculation
 */
export const STREAK_MULTIPLIERS: Record<number, number> = {
  7: 1.2,   // 20% bonus after 1 week
  14: 1.3,  // 30% bonus after 2 weeks
  30: 1.5,  // 50% bonus after 1 month
  60: 1.7,  // 70% bonus after 2 months
  90: 2.0,  // 100% bonus after 3 months
};

// ============================================================================
// XP Calculation Functions
// ============================================================================

/**
 * Calculate XP for completing a workout (simplified for MVP)
 * 
 * Formula:
 * - Base XP: 20
 * - Duration bonus: 1 XP per minute (max 60)
 * - Exercise variety bonus: 5 XP per unique exercise (max 30)
 * - Streak multiplier: Applied based on current streak
 * 
 * @param durationMinutes - Workout duration in minutes
 * @param exerciseCount - Number of unique exercises
 * @param currentStreak - Current workout streak in days
 * @returns Total XP earned
 */
export function calculateWorkoutXP(
  durationMinutes: number,
  exerciseCount: number,
  currentStreak: number = 0
): number {
  // Base XP for completing a workout
  let totalXP = 20;

  // Duration bonus (1 XP per minute, max 60)
  const durationXP = Math.min(Math.floor(durationMinutes), 60);
  totalXP += durationXP;

  // Exercise variety bonus (5 XP per exercise, max 30)
  const varietyXP = Math.min(exerciseCount * 5, 30);
  totalXP += varietyXP;

  // Apply streak multiplier
  const streakMultiplier = getStreakMultiplier(currentStreak);
  totalXP *= streakMultiplier;

  return Math.round(totalXP);
}

/**
 * Get streak multiplier based on current streak
 * 
 * @param currentStreak - Current workout streak in days
 * @returns Multiplier to apply to XP
 */
export function getStreakMultiplier(currentStreak: number): number {
  // Find the highest applicable streak multiplier
  const streakLevels = Object.keys(STREAK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending

  for (const level of streakLevels) {
    if (currentStreak >= level) {
      return STREAK_MULTIPLIERS[level];
    }
  }

  return 1.0; // No multiplier for streaks < 7 days
}

// ============================================================================
// Level Calculation Functions
// ============================================================================

/**
 * Calculate user level based on total XP
 * 
 * @param totalXP - User's total accumulated XP
 * @returns Current level (1-20+)
 */
export function calculateLevel(totalXP: number): number {
  // Find the highest level threshold that the user has reached
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1; // Levels are 1-indexed
    }
  }

  return 1; // Minimum level
}

/**
 * Calculate XP required for next level
 * 
 * @param currentLevel - User's current level
 * @returns XP required to reach next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    // Beyond max level, use exponential formula
    const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const increment = 15000; // 15k XP per level beyond max
    return lastThreshold + (currentLevel - LEVEL_THRESHOLDS.length) * increment;
  }

  return LEVEL_THRESHOLDS[currentLevel]; // currentLevel is 1-indexed, array is 0-indexed
}

/**
 * Calculate progress percentage to next level
 * 
 * @param totalXP - User's total accumulated XP
 * @param currentLevel - User's current level
 * @returns Progress percentage (0-100)
 */
export function calculateLevelProgress(totalXP: number, currentLevel: number): number {
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;

  if (xpNeededForLevel <= 0) {
    return 100; // Max level reached
  }

  const progress = (xpInCurrentLevel / xpNeededForLevel) * 100;
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
}

/**
 * Get level info for a user
 * 
 * @param totalXP - User's total accumulated XP
 * @returns Object with level, progress, and XP info
 */
export function getLevelInfo(totalXP: number) {
  const level = calculateLevel(totalXP);
  const progress = calculateLevelProgress(totalXP, level);
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXP = getXPForNextLevel(level);
  const xpToNextLevel = nextLevelXP - totalXP;

  return {
    level,
    progress,
    currentLevelXP,
    nextLevelXP,
    xpToNextLevel,
  };
}
