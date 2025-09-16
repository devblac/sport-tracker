/**
 * Streak Reward Service
 * 
 * Manages streak milestone rewards, titles, shields, and protections.
 * Integrates with the gamification system to award XP and achievements.
 */

import { MockGamificationService } from '@/services/MockGamificationService';
import { DEFAULT_STREAK_REWARD_CONFIG } from '@/data/streakRewards';

import type {
  StreakReward,
  StreakMilestoneReward,
  StreakTitle,
  StreakShield,
  UserStreakRewards,
  StreakRewardEvent,
  StreakRewardNotification,
  StreakRewardConfig
} from '@/types/streakRewards';

import type { StreakStats } from '@/types/streaks';

export class StreakRewardService {
  private static instance: StreakRewardService;
  private gamificationService: MockGamificationService;
  private config: StreakRewardConfig;
  private userRewards: Map<string, UserStreakRewards> = new Map();

  private constructor() {
    this.gamificationService = MockGamificationService.getInstance();
    this.config = DEFAULT_STREAK_REWARD_CONFIG;
  }

  public static getInstance(): StreakRewardService {
    if (!StreakRewardService.instance) {
      StreakRewardService.instance = new StreakRewardService();
    }
    return StreakRewardService.instance;
  }

  // ============================================================================
  // Milestone Rewards
  // ============================================================================

  /**
   * Check and award milestone rewards for a streak
   */
  public async checkMilestoneRewards(
    userId: string,
    streakStats: StreakStats
  ): Promise<StreakReward[]> {
    const currentStreak = streakStats.currentStreak;
    const userRewards = await this.getUserRewards(userId);
    const newRewards: StreakReward[] = [];

    // Find applicable milestones
    const applicableMilestones = this.config.milestones.filter(milestone => {
      // Check if streak length matches
      if (milestone.streakLength !== currentStreak) return false;

      // Check if already claimed (for non-repeatable rewards)
      if (!milestone.isRepeatable) {
        const alreadyClaimed = userRewards.milestoneRewards.some(
          reward => reward.streakLength === milestone.streakLength && reward.claimed
        );
        if (alreadyClaimed) return false;
      }

      // Check additional requirements
      if (milestone.requirements) {
        if (milestone.requirements.minWorkoutsPerWeek) {
          const avgWorkoutsPerWeek = this.calculateAverageWorkoutsPerWeek(streakStats);
          if (avgWorkoutsPerWeek < milestone.requirements.minWorkoutsPerWeek) return false;
        }

        if (milestone.requirements.maxMissedDays) {
          if (streakStats.totalMissedDays > milestone.requirements.maxMissedDays) return false;
        }

        if (milestone.requirements.perfectWeeksRequired) {
          if (streakStats.perfectWeeks < milestone.requirements.perfectWeeksRequired) return false;
        }
      }

      return true;
    });

    // Award rewards for each applicable milestone
    for (const milestone of applicableMilestones) {
      for (const reward of milestone.rewards) {
        const newReward: StreakReward = {
          ...reward,
          id: `${milestone.streakLength}_${reward.type}_${Date.now()}`,
          createdAt: new Date()
        };

        newRewards.push(newReward);

        // Award XP through gamification service
        if (reward.type === 'xp' && typeof reward.value === 'number') {
          await this.gamificationService.awardXP(userId, reward.value, {
            source: 'streak_milestone',
            details: {
              streakLength: milestone.streakLength,
              milestoneName: milestone.name
            }
          });
        }

        // Add title to user's collection
        if (reward.type === 'title') {
          await this.unlockTitle(userId, reward.value as string, milestone.streakLength);
        }

        // Add shield to user's collection
        if (reward.type === 'shield') {
          await this.awardShield(userId, reward.value as string, milestone.streakLength);
        }
      }

      // Record milestone completion
      userRewards.milestoneRewards.push({
        streakLength: milestone.streakLength,
        rewardId: milestone.name,
        unlockedAt: new Date(),
        claimed: true
      });

      // Create reward event
      await this.createRewardEvent(userId, 'milestone_reached', milestone.streakLength, milestone.name);

      // Create notification
      await this.createRewardNotification(userId, {
        type: 'milestone',
        title: milestone.name,
        message: milestone.description,
        icon: milestone.icon,
        rarity: milestone.rarity,
        actionRequired: false
      });
    }

    // Update user rewards
    userRewards.updatedAt = new Date();
    if (currentStreak > userRewards.longestRewardedStreak) {
      userRewards.longestRewardedStreak = currentStreak;
    }

    await this.saveUserRewards(userId, userRewards);

    return newRewards;
  }

  // ============================================================================
  // Title System
  // ============================================================================

  /**
   * Check and unlock titles based on streak performance
   */
  public async checkTitleUnlocks(
    userId: string,
    streakStats: StreakStats
  ): Promise<StreakTitle[]> {
    const userRewards = await this.getUserRewards(userId);
    const newTitles: StreakTitle[] = [];

    for (const titleConfig of this.config.titles) {
      // Check if already unlocked
      const alreadyUnlocked = userRewards.titles.some(title => title.name === titleConfig.name);
      if (alreadyUnlocked) continue;

      // Check requirements
      const meetsRequirements = this.checkTitleRequirements(titleConfig, streakStats);
      if (!meetsRequirements) continue;

      // Unlock title
      const newTitle: StreakTitle = {
        id: `title_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...titleConfig,
        isActive: userRewards.titles.length === 0, // First title is active by default
        unlockedAt: new Date()
      };

      userRewards.titles.push(newTitle);
      newTitles.push(newTitle);

      // Create events and notifications
      await this.createRewardEvent(userId, 'title_unlocked', streakStats.currentStreak, newTitle.id);
      await this.createRewardNotification(userId, {
        type: 'title',
        title: `¡Nuevo Título Desbloqueado!`,
        message: `Has desbloqueado: ${newTitle.name}`,
        icon: newTitle.icon,
        rarity: newTitle.rarity,
        actionRequired: true,
        actionText: 'Equipar Título',
        actionUrl: '/profile/titles'
      });
    }

    await this.saveUserRewards(userId, userRewards);
    return newTitles;
  }

  /**
   * Set active title for user
   */
  public async setActiveTitle(userId: string, titleId: string): Promise<boolean> {
    const userRewards = await this.getUserRewards(userId);
    const title = userRewards.titles.find(t => t.id === titleId);
    
    if (!title) return false;

    // Deactivate all titles
    userRewards.titles.forEach(t => t.isActive = false);
    
    // Activate selected title
    title.isActive = true;
    userRewards.activeTitle = titleId;
    userRewards.updatedAt = new Date();

    await this.saveUserRewards(userId, userRewards);
    return true;
  }

  // ============================================================================
  // Shield System
  // ============================================================================

  /**
   * Award a shield to user
   */
  public async awardShield(
    userId: string,
    shieldType: string,
    streakLength: number
  ): Promise<StreakShield | null> {
    const shieldConfig = this.config.shields.find(s => s.name.toLowerCase().includes(shieldType));
    if (!shieldConfig) return null;

    const userRewards = await this.getUserRewards(userId);

    const newShield: StreakShield = {
      id: `shield_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...shieldConfig,
      usesRemaining: shieldConfig.uses,
      isActive: false,
      createdAt: new Date()
    };

    userRewards.shields.push(newShield);
    userRewards.updatedAt = new Date();

    await this.saveUserRewards(userId, userRewards);
    await this.createRewardEvent(userId, 'shield_earned', streakLength, newShield.id);

    return newShield;
  }

  /**
   * Use a shield to protect streak
   */
  public async useShield(
    userId: string,
    shieldId: string
  ): Promise<{ success: boolean; shield?: StreakShield; message: string }> {
    const userRewards = await this.getUserRewards(userId);
    const shield = userRewards.shields.find(s => s.id === shieldId);

    if (!shield) {
      return { success: false, message: 'Escudo no encontrado' };
    }

    if (shield.usesRemaining <= 0) {
      return { success: false, message: 'Escudo sin usos restantes' };
    }

    if (shield.expiresAt && shield.expiresAt < new Date()) {
      return { success: false, message: 'Escudo expirado' };
    }

    // Use shield
    shield.usesRemaining--;
    shield.isActive = true;
    
    // Set expiration based on shield duration
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + shield.duration);
    shield.expiresAt = expirationDate;

    userRewards.updatedAt = new Date();
    await this.saveUserRewards(userId, userRewards);
    await this.createRewardEvent(userId, 'shield_used', 0, shieldId);

    return {
      success: true,
      shield,
      message: `Escudo ${shield.name} activado por ${shield.duration} días`
    };
  }

  /**
   * Get active shields for user
   */
  public async getActiveShields(userId: string): Promise<StreakShield[]> {
    const userRewards = await this.getUserRewards(userId);
    const now = new Date();

    return userRewards.shields.filter(shield => 
      shield.isActive && 
      shield.usesRemaining > 0 &&
      (!shield.expiresAt || shield.expiresAt > now)
    );
  }

  // ============================================================================
  // XP Multipliers
  // ============================================================================

  /**
   * Get XP multiplier for current streak length
   */
  public getStreakXPMultiplier(streakLength: number): number {
    // Find the highest applicable multiplier
    let multiplier = 1.0;
    
    for (const [length, mult] of Object.entries(this.config.xpMultipliers)) {
      const lengthNum = parseInt(length);
      if (streakLength >= lengthNum && mult > multiplier) {
        multiplier = mult;
      }
    }

    return multiplier;
  }

  // ============================================================================
  // User Data Management
  // ============================================================================

  /**
   * Get user's streak rewards data
   */
  public async getUserRewards(userId: string): Promise<UserStreakRewards> {
    if (this.userRewards.has(userId)) {
      return this.userRewards.get(userId)!;
    }

    // Try to load from storage (localStorage for now)
    const stored = localStorage.getItem(`streak_rewards_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      parsed.updatedAt = new Date(parsed.updatedAt);
      parsed.titles.forEach((title: any) => {
        if (title.unlockedAt) title.unlockedAt = new Date(title.unlockedAt);
      });
      parsed.shields.forEach((shield: any) => {
        shield.createdAt = new Date(shield.createdAt);
        if (shield.expiresAt) shield.expiresAt = new Date(shield.expiresAt);
      });
      parsed.milestoneRewards.forEach((reward: any) => {
        reward.unlockedAt = new Date(reward.unlockedAt);
      });

      this.userRewards.set(userId, parsed);
      return parsed;
    }

    // Create new user rewards
    const newUserRewards: UserStreakRewards = {
      userId,
      titles: [],
      shields: [],
      milestoneRewards: [],
      totalXPFromStreaks: 0,
      longestRewardedStreak: 0,
      updatedAt: new Date()
    };

    this.userRewards.set(userId, newUserRewards);
    return newUserRewards;
  }

  /**
   * Save user rewards data
   */
  private async saveUserRewards(userId: string, rewards: UserStreakRewards): Promise<void> {
    this.userRewards.set(userId, rewards);
    localStorage.setItem(`streak_rewards_${userId}`, JSON.stringify(rewards));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculateAverageWorkoutsPerWeek(streakStats: StreakStats): number {
    const weeks = Math.max(1, Math.floor(streakStats.currentStreak / 7));
    return streakStats.totalWorkouts / weeks;
  }

  private checkTitleRequirements(
    titleConfig: Omit<StreakTitle, 'id' | 'isActive' | 'unlockedAt'>,
    streakStats: StreakStats
  ): boolean {
    const { requirements } = titleConfig;

    // Check streak length
    if (streakStats.currentStreak < requirements.minStreakLength) return false;
    if (requirements.maxStreakLength && streakStats.currentStreak > requirements.maxStreakLength) return false;

    // Check perfect weeks
    if (requirements.perfectWeeks && streakStats.perfectWeeks < requirements.perfectWeeks) return false;

    // Check consistency
    if (requirements.consistency) {
      const consistency = (streakStats.currentStreak / (streakStats.currentStreak + streakStats.totalMissedDays)) * 100;
      if (consistency < requirements.consistency) return false;
    }

    // Check special conditions
    if (requirements.specialConditions) {
      for (const condition of requirements.specialConditions) {
        if (condition === 'no_shields_used' && streakStats.shieldsUsed > 0) return false;
        if (condition === 'perfect_year' && streakStats.currentStreak >= 365 && streakStats.totalMissedDays > 0) return false;
      }
    }

    return true;
  }

  private async createRewardEvent(
    userId: string,
    type: StreakRewardEvent['type'],
    streakLength: number,
    rewardId: string
  ): Promise<void> {
    const event: StreakRewardEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      streakLength,
      rewardId,
      data: {},
      timestamp: new Date()
    };

    // Store event (localStorage for now)
    const events = JSON.parse(localStorage.getItem(`streak_events_${userId}`) || '[]');
    events.push(event);
    localStorage.setItem(`streak_events_${userId}`, JSON.stringify(events));
  }

  private async createRewardNotification(
    userId: string,
    notification: Omit<StreakRewardNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
  ): Promise<void> {
    const fullNotification: StreakRewardNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ...notification,
      isRead: false,
      createdAt: new Date()
    };

    // Store notification (localStorage for now)
    const notifications = JSON.parse(localStorage.getItem(`streak_notifications_${userId}`) || '[]');
    notifications.push(fullNotification);
    localStorage.setItem(`streak_notifications_${userId}`, JSON.stringify(notifications));
  }

  /**
   * Get user's streak notifications
   */
  public async getNotifications(userId: string): Promise<StreakRewardNotification[]> {
    const notifications = JSON.parse(localStorage.getItem(`streak_notifications_${userId}`) || '[]');
    return notifications.map((notif: any) => ({
      ...notif,
      createdAt: new Date(notif.createdAt),
      expiresAt: notif.expiresAt ? new Date(notif.expiresAt) : undefined
    }));
  }

  /**
   * Mark notification as read
   */
  public async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notifications = JSON.parse(localStorage.getItem(`streak_notifications_${userId}`) || '[]');
    const notification = notifications.find((n: any) => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      localStorage.setItem(`streak_notifications_${userId}`, JSON.stringify(notifications));
    }
  }
}