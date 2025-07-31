/**
 * Streak Rewards System Types
 * 
 * Type definitions for streak milestone rewards, titles, shields, and protections.
 */

export interface StreakReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  type: 'xp' | 'title' | 'badge' | 'shield' | 'feature' | 'cosmetic';
  value: number | string;
  isActive?: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface StreakMilestoneReward {
  streakLength: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  rewards: StreakReward[];
  celebrationLevel: 'normal' | 'epic' | 'legendary';
  isRepeatable: boolean;
  requirements?: {
    minWorkoutsPerWeek?: number;
    maxMissedDays?: number;
    perfectWeeksRequired?: number;
  };
}

export interface StreakTitle {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirements: {
    minStreakLength: number;
    maxStreakLength?: number;
    perfectWeeks?: number;
    consistency?: number; // 0-100
    specialConditions?: string[];
  };
  isActive: boolean;
  unlockedAt?: Date;
}

export interface StreakShield {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'freeze' | 'compensation' | 'grace' | 'protection';
  duration: number; // Days
  uses: number; // How many times it can be used
  usesRemaining: number;
  requirements: {
    minStreakLength: number;
    earnedThrough: 'milestone' | 'purchase' | 'achievement' | 'event';
  };
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface UserStreakRewards {
  userId: string;
  titles: StreakTitle[];
  activeTitle?: string;
  shields: StreakShield[];
  milestoneRewards: {
    streakLength: number;
    rewardId: string;
    unlockedAt: Date;
    claimed: boolean;
  }[];
  totalXPFromStreaks: number;
  longestRewardedStreak: number;
  updatedAt: Date;
}

export interface StreakRewardEvent {
  id: string;
  userId: string;
  type: 'milestone_reached' | 'title_unlocked' | 'shield_earned' | 'shield_used' | 'reward_claimed';
  streakLength: number;
  rewardId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface StreakRewardNotification {
  id: string;
  userId: string;
  type: 'milestone' | 'title' | 'shield' | 'warning';
  title: string;
  message: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  actionRequired: boolean;
  actionText?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Predefined milestone rewards configuration
export interface StreakRewardConfig {
  milestones: StreakMilestoneReward[];
  titles: Omit<StreakTitle, 'id' | 'isActive' | 'unlockedAt'>[];
  shields: Omit<StreakShield, 'id' | 'usesRemaining' | 'isActive' | 'expiresAt' | 'createdAt'>[];
  xpMultipliers: {
    [streakLength: number]: number;
  };
  titleRotationEnabled: boolean;
  shieldAutoActivation: boolean;
}

export default {
  StreakReward,
  StreakMilestoneReward,
  StreakTitle,
  StreakShield,
  UserStreakRewards,
  StreakRewardEvent,
  StreakRewardNotification,
  StreakRewardConfig
};