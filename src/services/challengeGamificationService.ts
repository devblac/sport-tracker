// Challenge Gamification Service - Integrates challenges with XP and rewards
// Implements requirement 12.3 - Challenge gamification integration

import { 
  Challenge, 
  ChallengeParticipant, 
  ChallengeReward,
  ChallengeProgress 
} from '@/types';
import { 
  CHALLENGE_XP_REWARDS, 
  DIFFICULTY_MULTIPLIERS,
  CHALLENGE_MILESTONES 
} from '../constants/challenges';

// Gamification event types
export interface GamificationEvent {
  id: string;
  type: 'challenge_joined' | 'progress_made' | 'requirement_completed' | 'challenge_completed' | 'challenge_won' | 'rank_improved';
  user_id: string;
  challenge_id: string;
  data: any;
  xp_awarded: number;
  timestamp: Date;
}

// XP calculation result
export interface XPCalculationResult {
  base_xp: number;
  difficulty_multiplier: number;
  bonus_xp: number;
  total_xp: number;
  reason: string;
}

// Achievement unlock result
export interface AchievementUnlock {
  achievement_id: string;
  name: string;
  description: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Celebration data for UI
export interface CelebrationData {
  type: 'xp_gained' | 'achievement_unlocked' | 'level_up' | 'challenge_completed' | 'rank_improved';
  title: string;
  message: string;
  xp_gained?: number;
  achievements?: AchievementUnlock[];
  level_gained?: number;
  rank_change?: { from: number; to: number };
  visual_effects: {
    confetti: boolean;
    fireworks: boolean;
    glow: boolean;
    sound: string;
  };
}

export class ChallengeGamificationService {
  private events: GamificationEvent[] = [];
  private userStats: Map<string, UserGamificationStats> = new Map();

  // Process challenge join event
  async processJoinChallenge(
    userId: string, 
    challenge: Challenge, 
    participant: ChallengeParticipant
  ): Promise<CelebrationData> {
    const xpResult = this.calculateJoinXP(challenge);
    
    // Award XP
    await this.awardXP(userId, xpResult.total_xp, 'Joined challenge');
    
    // Check for achievements
    const achievements = await this.checkJoinAchievements(userId, challenge);
    
    // Record event
    const event: GamificationEvent = {
      id: this.generateId(),
      type: 'challenge_joined',
      user_id: userId,
      challenge_id: challenge.id,
      data: { participant_id: participant.id },
      xp_awarded: xpResult.total_xp,
      timestamp: new Date()
    };
    this.events.push(event);

    // Create celebration
    return this.createCelebration({
      type: 'xp_gained',
      title: 'Challenge Joined!',
      message: `You joined "${challenge.name}" and earned ${xpResult.total_xp} XP!`,
      xp_gained: xpResult.total_xp,
      achievements,
      visual_effects: {
        confetti: achievements.length > 0,
        fireworks: false,
        glow: true,
        sound: 'join_success'
      }
    });
  }

  // Process progress update event
  async processProgressUpdate(
    userId: string,
    challenge: Challenge,
    participant: ChallengeParticipant,
    progressRecords: ChallengeProgress[],
    previousProgress: number
  ): Promise<CelebrationData | null> {
    const progressIncrease = participant.progress - previousProgress;
    
    // Only celebrate significant progress (>10%)
    if (progressIncrease < 10) return null;

    const xpResult = this.calculateProgressXP(challenge, progressIncrease);
    
    // Award XP
    await this.awardXP(userId, xpResult.total_xp, 'Challenge progress');
    
    // Check for milestone achievements
    const achievements = await this.checkProgressAchievements(userId, challenge, participant);
    
    // Check for requirement completion
    const completedRequirements = progressRecords.filter(p => p.is_completed);
    let requirementCompletionXP = 0;
    
    for (const req of completedRequirements) {
      const reqXP = this.calculateRequirementCompletionXP(challenge);
      requirementCompletionXP += reqXP.total_xp;
      await this.awardXP(userId, reqXP.total_xp, 'Requirement completed');
    }

    // Record event
    const event: GamificationEvent = {
      id: this.generateId(),
      type: 'progress_made',
      user_id: userId,
      challenge_id: challenge.id,
      data: { 
        progress_increase: progressIncrease,
        completed_requirements: completedRequirements.length
      },
      xp_awarded: xpResult.total_xp + requirementCompletionXP,
      timestamp: new Date()
    };
    this.events.push(event);

    // Create celebration
    return this.createCelebration({
      type: 'xp_gained',
      title: 'Great Progress!',
      message: `You're ${Math.round(participant.progress)}% through "${challenge.name}"!`,
      xp_gained: xpResult.total_xp + requirementCompletionXP,
      achievements,
      visual_effects: {
        confetti: completedRequirements.length > 0,
        fireworks: false,
        glow: true,
        sound: 'progress_made'
      }
    });
  }

  // Process challenge completion event
  async processChallengeCompletion(
    userId: string,
    challenge: Challenge,
    participant: ChallengeParticipant,
    finalRank: number
  ): Promise<CelebrationData> {
    const xpResult = this.calculateCompletionXP(challenge, finalRank);
    
    // Award completion XP
    await this.awardXP(userId, xpResult.total_xp, 'Challenge completed');
    
    // Award rank-based rewards
    const rankRewards = await this.processRankRewards(userId, challenge, finalRank);
    
    // Check for completion achievements
    const achievements = await this.checkCompletionAchievements(userId, challenge, finalRank);
    
    // Record event
    const event: GamificationEvent = {
      id: this.generateId(),
      type: 'challenge_completed',
      user_id: userId,
      challenge_id: challenge.id,
      data: { 
        final_rank: finalRank,
        completion_time: participant.completion_date
      },
      xp_awarded: xpResult.total_xp,
      timestamp: new Date()
    };
    this.events.push(event);

    // Create epic celebration for completion
    return this.createCelebration({
      type: 'challenge_completed',
      title: 'Challenge Completed! 🎉',
      message: `Congratulations! You finished "${challenge.name}" in rank #${finalRank}!`,
      xp_gained: xpResult.total_xp,
      achievements,
      visual_effects: {
        confetti: true,
        fireworks: finalRank <= 3,
        glow: true,
        sound: finalRank === 1 ? 'victory_fanfare' : 'completion_success'
      }
    });
  }

  // Process rank improvement event
  async processRankImprovement(
    userId: string,
    challenge: Challenge,
    oldRank: number,
    newRank: number
  ): Promise<CelebrationData | null> {
    // Only celebrate significant rank improvements
    const rankImprovement = oldRank - newRank;
    if (rankImprovement < 3) return null;

    const xpResult = this.calculateRankImprovementXP(challenge, rankImprovement);
    
    // Award XP
    await this.awardXP(userId, xpResult.total_xp, 'Rank improvement');
    
    // Record event
    const event: GamificationEvent = {
      id: this.generateId(),
      type: 'rank_improved',
      user_id: userId,
      challenge_id: challenge.id,
      data: { old_rank: oldRank, new_rank: newRank },
      xp_awarded: xpResult.total_xp,
      timestamp: new Date()
    };
    this.events.push(event);

    // Create celebration
    return this.createCelebration({
      type: 'rank_improved',
      title: 'Rank Up!',
      message: `You climbed from #${oldRank} to #${newRank} in "${challenge.name}"!`,
      xp_gained: xpResult.total_xp,
      rank_change: { from: oldRank, to: newRank },
      visual_effects: {
        confetti: newRank <= 10,
        fireworks: newRank <= 3,
        glow: true,
        sound: 'rank_up'
      }
    });
  }

  // XP Calculation Methods
  private calculateJoinXP(challenge: Challenge): XPCalculationResult {
    const baseXP = CHALLENGE_XP_REWARDS.JOIN_CHALLENGE;
    const multiplier = DIFFICULTY_MULTIPLIERS[challenge.difficulty_level];
    const bonusXP = challenge.type === 'global' ? 25 : 0; // Bonus for global challenges
    
    return {
      base_xp: baseXP,
      difficulty_multiplier: multiplier,
      bonus_xp: bonusXP,
      total_xp: Math.round(baseXP * multiplier + bonusXP),
      reason: `Base: ${baseXP}, Difficulty: x${multiplier}, Bonus: ${bonusXP}`
    };
  }

  private calculateProgressXP(challenge: Challenge, progressIncrease: number): XPCalculationResult {
    const baseXP = Math.round(progressIncrease * 2); // 2 XP per % progress
    const multiplier = DIFFICULTY_MULTIPLIERS[challenge.difficulty_level];
    const bonusXP = 0;
    
    return {
      base_xp: baseXP,
      difficulty_multiplier: multiplier,
      bonus_xp: bonusXP,
      total_xp: Math.round(baseXP * multiplier),
      reason: `Progress: ${progressIncrease}% x 2 x ${multiplier}`
    };
  }

  private calculateRequirementCompletionXP(challenge: Challenge): XPCalculationResult {
    const baseXP = CHALLENGE_XP_REWARDS.COMPLETE_REQUIREMENT;
    const multiplier = DIFFICULTY_MULTIPLIERS[challenge.difficulty_level];
    const bonusXP = 0;
    
    return {
      base_xp: baseXP,
      difficulty_multiplier: multiplier,
      bonus_xp: bonusXP,
      total_xp: Math.round(baseXP * multiplier),
      reason: `Requirement completion: ${baseXP} x ${multiplier}`
    };
  }

  private calculateCompletionXP(challenge: Challenge, rank: number): XPCalculationResult {
    let baseXP = CHALLENGE_XP_REWARDS.COMPLETE_CHALLENGE;
    
    // Rank-based bonuses
    if (rank === 1) baseXP += CHALLENGE_XP_REWARDS.WIN_CHALLENGE;
    else if (rank <= 3) baseXP += CHALLENGE_XP_REWARDS.TOP_3_FINISH;
    else if (rank <= 10) baseXP += CHALLENGE_XP_REWARDS.TOP_10_FINISH;
    
    const multiplier = DIFFICULTY_MULTIPLIERS[challenge.difficulty_level];
    const bonusXP = challenge.type === 'global' ? 100 : 0; // Global challenge bonus
    
    return {
      base_xp: baseXP,
      difficulty_multiplier: multiplier,
      bonus_xp: bonusXP,
      total_xp: Math.round(baseXP * multiplier + bonusXP),
      reason: `Completion + rank bonus: ${baseXP} x ${multiplier} + ${bonusXP}`
    };
  }

  private calculateRankImprovementXP(challenge: Challenge, rankImprovement: number): XPCalculationResult {
    const baseXP = rankImprovement * 10; // 10 XP per rank improved
    const multiplier = DIFFICULTY_MULTIPLIERS[challenge.difficulty_level];
    const bonusXP = 0;
    
    return {
      base_xp: baseXP,
      difficulty_multiplier: multiplier,
      bonus_xp: bonusXP,
      total_xp: Math.round(baseXP * multiplier),
      reason: `Rank improvement: ${rankImprovement} ranks x 10 x ${multiplier}`
    };
  }

  // Achievement checking methods
  private async checkJoinAchievements(userId: string, challenge: Challenge): Promise<AchievementUnlock[]> {
    const achievements: AchievementUnlock[] = [];
    const userStats = this.getUserStats(userId);
    
    // First challenge join
    if (userStats.challenges_joined === 0) {
      achievements.push({
        achievement_id: 'first_challenge',
        name: CHALLENGE_MILESTONES.FIRST_CHALLENGE_JOIN.name,
        description: CHALLENGE_MILESTONES.FIRST_CHALLENGE_JOIN.description,
        xp_reward: CHALLENGE_MILESTONES.FIRST_CHALLENGE_JOIN.xp,
        rarity: 'common'
      });
    }

    // Challenge enthusiast (join 10 challenges)
    if (userStats.challenges_joined === 9) { // Will be 10 after this join
      achievements.push({
        achievement_id: 'challenge_enthusiast',
        name: 'Challenge Enthusiast',
        description: 'Join 10 different challenges',
        xp_reward: 500,
        rarity: 'rare'
      });
    }

    return achievements;
  }

  private async checkProgressAchievements(
    userId: string, 
    challenge: Challenge, 
    participant: ChallengeParticipant
  ): Promise<AchievementUnlock[]> {
    const achievements: AchievementUnlock[] = [];
    
    // Milestone achievements based on progress
    if (participant.progress >= 50 && participant.progress < 60) {
      achievements.push({
        achievement_id: 'halfway_hero',
        name: 'Halfway Hero',
        description: 'Reach 50% progress in a challenge',
        xp_reward: 200,
        rarity: 'common'
      });
    }
    
    if (participant.progress >= 75 && participant.progress < 85) {
      achievements.push({
        achievement_id: 'almost_there',
        name: 'Almost There',
        description: 'Reach 75% progress in a challenge',
        xp_reward: 300,
        rarity: 'rare'
      });
    }

    return achievements;
  }

  private async checkCompletionAchievements(
    userId: string, 
    challenge: Challenge, 
    rank: number
  ): Promise<AchievementUnlock[]> {
    const achievements: AchievementUnlock[] = [];
    const userStats = this.getUserStats(userId);
    
    // First challenge completion
    if (userStats.challenges_completed === 0) {
      achievements.push({
        achievement_id: 'first_completion',
        name: CHALLENGE_MILESTONES.FIRST_CHALLENGE_COMPLETE.name,
        description: CHALLENGE_MILESTONES.FIRST_CHALLENGE_COMPLETE.description,
        xp_reward: CHALLENGE_MILESTONES.FIRST_CHALLENGE_COMPLETE.xp,
        rarity: 'rare'
      });
    }

    // Winner achievement
    if (rank === 1) {
      achievements.push({
        achievement_id: 'challenge_winner',
        name: CHALLENGE_MILESTONES.CHALLENGE_WINNER.name,
        description: CHALLENGE_MILESTONES.CHALLENGE_WINNER.description,
        xp_reward: CHALLENGE_MILESTONES.CHALLENGE_WINNER.xp,
        rarity: 'epic'
      });
    }

    // Podium finish
    if (rank <= 3) {
      achievements.push({
        achievement_id: 'podium_finish',
        name: 'Podium Finish',
        description: 'Finish in the top 3 of a challenge',
        xp_reward: 750,
        rarity: 'rare'
      });
    }

    return achievements;
  }

  // Reward processing
  private async processRankRewards(
    userId: string, 
    challenge: Challenge, 
    rank: number
  ): Promise<ChallengeReward[]> {
    const applicableRewards = challenge.rewards.filter(reward => {
      switch (reward.unlock_condition) {
        case 'participation':
          return true;
        case 'completion':
          return true;
        case 'top_10':
          return rank <= 10;
        case 'top_3':
          return rank <= 3;
        case 'winner':
          return rank === 1;
        default:
          return false;
      }
    });

    // Process each reward
    for (const reward of applicableRewards) {
      await this.processReward(userId, reward);
    }

    return applicableRewards;
  }

  private async processReward(userId: string, reward: ChallengeReward): Promise<void> {
    switch (reward.type) {
      case 'xp':
        await this.awardXP(userId, reward.value as number, `Reward: ${reward.description}`);
        break;
      case 'badge':
        await this.awardBadge(userId, reward.value as string);
        break;
      case 'title':
        await this.awardTitle(userId, reward.value as string);
        break;
      case 'premium_content':
        await this.unlockPremiumContent(userId, reward.value as string);
        break;
      case 'discount':
        await this.awardDiscount(userId, reward.value as number);
        break;
    }
  }

  // Gamification actions
  private async awardXP(userId: string, xp: number, reason: string): Promise<void> {
    const userStats = this.getUserStats(userId);
    userStats.total_xp += xp;
    userStats.current_level = this.calculateLevel(userStats.total_xp);
    this.userStats.set(userId, userStats);
    
    console.log(`Awarded ${xp} XP to user ${userId} for: ${reason}`);
  }

  private async awardBadge(userId: string, badgeId: string): Promise<void> {
    const userStats = this.getUserStats(userId);
    if (!userStats.badges.includes(badgeId)) {
      userStats.badges.push(badgeId);
      this.userStats.set(userId, userStats);
    }
  }

  private async awardTitle(userId: string, title: string): Promise<void> {
    const userStats = this.getUserStats(userId);
    if (!userStats.titles.includes(title)) {
      userStats.titles.push(title);
      this.userStats.set(userId, userStats);
    }
  }

  private async unlockPremiumContent(userId: string, contentId: string): Promise<void> {
    // Implementation would unlock premium content for user
    console.log(`Unlocked premium content ${contentId} for user ${userId}`);
  }

  private async awardDiscount(userId: string, discountPercent: number): Promise<void> {
    // Implementation would create discount code for user
    console.log(`Awarded ${discountPercent}% discount to user ${userId}`);
  }

  // Helper methods
  private getUserStats(userId: string): UserGamificationStats {
    if (!this.userStats.has(userId)) {
      this.userStats.set(userId, {
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        challenges_joined: 0,
        challenges_completed: 0,
        challenges_won: 0,
        badges: [],
        titles: [],
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    return this.userStats.get(userId)!;
  }

  private calculateLevel(totalXP: number): number {
    // Level formula: level = floor(sqrt(totalXP / 100)) + 1
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  private createCelebration(data: Partial<CelebrationData>): CelebrationData {
    return {
      type: data.type || 'xp_gained',
      title: data.title || 'Achievement Unlocked!',
      message: data.message || 'Great job!',
      xp_gained: data.xp_gained,
      achievements: data.achievements || [],
      level_gained: data.level_gained,
      rank_change: data.rank_change,
      visual_effects: data.visual_effects || {
        confetti: false,
        fireworks: false,
        glow: true,
        sound: 'success'
      }
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Public query methods
  public getUserEvents(userId: string): GamificationEvent[] {
    return this.events.filter(event => event.user_id === userId);
  }

  public getChallengeEvents(challengeId: string): GamificationEvent[] {
    return this.events.filter(event => event.challenge_id === challengeId);
  }

  public getUserGamificationStats(userId: string): UserGamificationStats {
    return this.getUserStats(userId);
  }
}

// User gamification statistics interface
interface UserGamificationStats {
  user_id: string;
  total_xp: number;
  current_level: number;
  challenges_joined: number;
  challenges_completed: number;
  challenges_won: number;
  badges: string[];
  titles: string[];
  created_at: Date;
  updated_at: Date;
}

// Export singleton instance
export const challengeGamificationService = new ChallengeGamificationService();