/**
 * Feature Access Control
 * 
 * Defines which features are available to different user types
 * and provides utilities to check feature access.
 */

import type { User } from '@/schemas/user';

export type UserRole = 'guest' | 'basic' | 'premium' | 'trainer' | 'admin';

export interface FeatureAccess {
  // Core Features
  workoutTracking: boolean;
  exerciseLibrary: boolean;
  progressTracking: boolean;
  
  // Social Features
  socialFeed: boolean;
  friendSystem: boolean;
  shareWorkouts: boolean;
  comments: boolean;
  
  // Gamification
  xpSystem: boolean;
  achievements: boolean;
  streaks: boolean;
  leaderboards: boolean;
  
  // Advanced Features
  workoutTemplates: boolean;
  customExercises: boolean;
  dataExport: boolean;
  advancedAnalytics: boolean;
  
  // Premium Features
  unlimitedTemplates: boolean;
  premiumAnalytics: boolean;
  prioritySupport: boolean;
  adFree: boolean;
  
  // Limits
  maxWorkoutTemplates: number;
  maxFriends: number;
  dataRetentionDays: number;
}

const FEATURE_ACCESS_MAP: Record<UserRole, FeatureAccess> = {
  guest: {
    // Core Features - Limited
    workoutTracking: true,
    exerciseLibrary: true,
    progressTracking: false, // No progress saved
    
    // Social Features - None
    socialFeed: false,
    friendSystem: false,
    shareWorkouts: false,
    comments: false,
    
    // Gamification - Limited
    xpSystem: false,
    achievements: false,
    streaks: true, // Allow streaks for motivation, but no persistence
    leaderboards: false,
    
    // Advanced Features - None
    workoutTemplates: false,
    customExercises: false,
    dataExport: false,
    advancedAnalytics: false,
    
    // Premium Features - None
    unlimitedTemplates: false,
    premiumAnalytics: false,
    prioritySupport: false,
    adFree: false,
    
    // Limits
    maxWorkoutTemplates: 0,
    maxFriends: 0,
    dataRetentionDays: 0, // No data persistence
  },
  
  basic: {
    // Core Features - Full
    workoutTracking: true,
    exerciseLibrary: true,
    progressTracking: true,
    
    // Social Features - Full
    socialFeed: true,
    friendSystem: true,
    shareWorkouts: true,
    comments: true,
    
    // Gamification - Full
    xpSystem: true,
    achievements: true,
    streaks: true,
    leaderboards: true,
    
    // Advanced Features - Limited
    workoutTemplates: true,
    customExercises: false,
    dataExport: false,
    advancedAnalytics: false,
    
    // Premium Features - None
    unlimitedTemplates: false,
    premiumAnalytics: false,
    prioritySupport: false,
    adFree: false,
    
    // Limits
    maxWorkoutTemplates: 5,
    maxFriends: 50,
    dataRetentionDays: 365,
  },
  
  premium: {
    // Core Features - Full
    workoutTracking: true,
    exerciseLibrary: true,
    progressTracking: true,
    
    // Social Features - Full
    socialFeed: true,
    friendSystem: true,
    shareWorkouts: true,
    comments: true,
    
    // Gamification - Full
    xpSystem: true,
    achievements: true,
    streaks: true,
    leaderboards: true,
    
    // Advanced Features - Full
    workoutTemplates: true,
    customExercises: true,
    dataExport: true,
    advancedAnalytics: true,
    
    // Premium Features - Full
    unlimitedTemplates: true,
    premiumAnalytics: true,
    prioritySupport: true,
    adFree: true,
    
    // Limits
    maxWorkoutTemplates: -1, // Unlimited
    maxFriends: 500,
    dataRetentionDays: -1, // Unlimited
  },
  
  trainer: {
    // Same as premium plus trainer-specific features
    workoutTracking: true,
    exerciseLibrary: true,
    progressTracking: true,
    socialFeed: true,
    friendSystem: true,
    shareWorkouts: true,
    comments: true,
    xpSystem: true,
    achievements: true,
    streaks: true,
    leaderboards: true,
    workoutTemplates: true,
    customExercises: true,
    dataExport: true,
    advancedAnalytics: true,
    unlimitedTemplates: true,
    premiumAnalytics: true,
    prioritySupport: true,
    adFree: true,
    maxWorkoutTemplates: -1,
    maxFriends: 1000,
    dataRetentionDays: -1,
  },
  
  admin: {
    // Full access to everything
    workoutTracking: true,
    exerciseLibrary: true,
    progressTracking: true,
    socialFeed: true,
    friendSystem: true,
    shareWorkouts: true,
    comments: true,
    xpSystem: true,
    achievements: true,
    streaks: true,
    leaderboards: true,
    workoutTemplates: true,
    customExercises: true,
    dataExport: true,
    advancedAnalytics: true,
    unlimitedTemplates: true,
    premiumAnalytics: true,
    prioritySupport: true,
    adFree: true,
    maxWorkoutTemplates: -1,
    maxFriends: -1,
    dataRetentionDays: -1,
  },
};

/**
 * Get feature access for a user
 */
export function getFeatureAccess(user: User | null): FeatureAccess {
  if (!user) {
    return FEATURE_ACCESS_MAP.guest;
  }
  
  return FEATURE_ACCESS_MAP[user.role as UserRole] || FEATURE_ACCESS_MAP.basic;
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  user: User | null, 
  feature: keyof FeatureAccess
): boolean {
  const access = getFeatureAccess(user);
  return Boolean(access[feature]);
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    guest: 'Guest User',
    basic: 'Basic User',
    premium: 'Premium User',
    trainer: 'Certified Trainer',
    admin: 'Administrator',
  };
  
  return roleNames[role] || 'Unknown';
}

/**
 * Get features that require upgrade
 */
export function getUpgradeFeatures(currentRole: UserRole): string[] {
  const currentAccess = FEATURE_ACCESS_MAP[currentRole];
  const premiumAccess = FEATURE_ACCESS_MAP.premium;
  
  const upgradeFeatures: string[] = [];
  
  // Check each feature
  Object.entries(premiumAccess).forEach(([feature, hasAccess]) => {
    if (hasAccess && !currentAccess[feature as keyof FeatureAccess]) {
      upgradeFeatures.push(feature);
    }
  });
  
  return upgradeFeatures;
}

/**
 * Feature descriptions for UI
 */
export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  workoutTracking: 'Track your workouts and exercises',
  exerciseLibrary: 'Access exercise database and instructions',
  progressTracking: 'Save and track your fitness progress',
  socialFeed: 'See updates from friends and community',
  friendSystem: 'Connect with other fitness enthusiasts',
  shareWorkouts: 'Share your workouts with friends',
  comments: 'Comment on posts and workouts',
  xpSystem: 'Earn XP and level up your fitness journey',
  achievements: 'Unlock achievements and badges',
  streaks: 'Build and maintain workout streaks',
  leaderboards: 'Compete with friends on leaderboards',
  workoutTemplates: 'Create and save workout templates',
  customExercises: 'Add your own custom exercises',
  dataExport: 'Export your workout data',
  advancedAnalytics: 'Detailed performance analytics',
  unlimitedTemplates: 'Create unlimited workout templates',
  premiumAnalytics: 'Advanced insights and recommendations',
  prioritySupport: 'Priority customer support',
  adFree: 'Ad-free experience',
};

/**
 * Get feature comparison for upgrade prompts
 */
export function getFeatureComparison(currentRole: UserRole, targetRole: UserRole = 'premium') {
  const current = FEATURE_ACCESS_MAP[currentRole];
  const target = FEATURE_ACCESS_MAP[targetRole];
  
  const comparison = {
    current: [] as string[],
    upgrade: [] as string[],
  };
  
  Object.entries(FEATURE_DESCRIPTIONS).forEach(([feature, description]) => {
    const hasCurrentAccess = current[feature as keyof FeatureAccess];
    const hasTargetAccess = target[feature as keyof FeatureAccess];
    
    if (hasCurrentAccess) {
      comparison.current.push(description);
    } else if (hasTargetAccess) {
      comparison.upgrade.push(description);
    }
  });
  
  return comparison;
}

export default {
  getFeatureAccess,
  hasFeatureAccess,
  getRoleDisplayName,
  getUpgradeFeatures,
  getFeatureComparison,
  FEATURE_DESCRIPTIONS,
};