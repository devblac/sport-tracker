// Challenge Rewards Manager - Manages special rewards and bonuses
// Implements task 14.3 - Special rewards for challenge completion

import { 
  Challenge, 
  ChallengeReward, 
  ChallengeParticipant 
} from '@/types';
import { 
  CHALLENGE_XP_REWARDS, 
  DIFFICULTY_MULTIPLIERS,
  REWARD_RARITY_INFO 
} from '../constants/challenges';

// Special reward types
export interface SpecialReward {
  id: string;
  type: 'streak_bonus' | 'perfect_score' | 'comeback_victory' | 'speed_bonus' | 'consistency_master' | 'overachiever';
  name: string;
  description: string;
  xp_bonus: number;
  special_badge?: string;
  special_title?: string;
  unlock_content?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  visual_effects: {
    confetti: boolean;
    fireworks: boolean;
    glow: boolean;
    sound: string;
  };
}

// Reward calculation result
export interface RewardCalculationResult {
  base_rewards: ChallengeReward[];
  special_rewards: SpecialReward[];
  total_xp: number;
  bonus_xp: number;
  achievements_unlocked: string[];
  titles_earned: string[];
  badges_earned: string[];
}

// Challenge performance metrics
export interface ChallengePerformanceMetrics {
  completion_percentage: number;
  completion_time_days: number;
  rank: number;
  total_participants: number;
  requirements_exceeded: number;
  consistency_score: number;
  speed_score: number;
  improvement_score: number;
}

export class ChallengeRewardsManager {
  private specialRewardTemplates: SpecialReward[] = [
    {
      id: 'streak_bonus',
      type: 'streak_bonus',
      name: 'Streak Master',
      description: 'Completed challenge while maintaining a perfect streak',
      xp_bonus: 500,
      special_badge: 'streak_master_badge',
      special_title: 'Streak Master',
      rarity: 'epic',
      visual_effects: {
        confetti: true,
        fireworks: true,
        glow: true,
        sound: 'epic_achievement'
      }
    },
    {
      id: 'perfect_score',
      type: 'perfect_score',
      name: 'Perfectionist',
      description: 'Achieved 100% completion with perfect execution',
      xp_bonus: 750,
      special_badge: 'perfectionist_badge',
      special_title: 'The Perfectionist',
      rarity: 'legendary',
      visual_effects: {
        confetti: true,
        fireworks: true,
        glow: true,
        sound: 'legendary_achievement'
      }
    },
    {
      id: 'comeback_victory',
      type: 'comeback_victory',
      name: 'Comeback King',
      description: 'Rose from bottom 50% to top 10% during the challenge',
      xp_bonus: 400,
      special_badge: 'comeback_badge',
      special_title: 'Comeback Champion',
      rarity: 'rare',
      visual_effects: {
        confetti: true,
        fireworks: false,
        glow: true,
        sound: 'comeback_victory'
      }
    },
    {
      id: 'speed_bonus',
      type: 'speed_bonus',
      name: 'Speed Demon',
      description: 'Completed challenge in record time',
      xp_bonus: 300,
      special_badge: 'speed_demon_badge',
      special_title: 'Speed Demon',
      rarity: 'rare',
      visual_effects: {
        confetti: true,
        fireworks: false,
        glow: true,
        sound: 'speed_achievement'
      }
    },
    {
      id: 'consistency_master',
      type: 'consistency_master',
      name: 'Consistency Master',
      description: 'Maintained perfect consistency throughout the challenge',
      xp_bonus: 600,
      special_badge: 'consistency_badge',
      special_title: 'Master of Consistency',
      rarity: 'epic',
      visual_effects: {
        confetti: true,
        fireworks: true,
        glow: true,
        sound: 'consistency_master'
      }
    },
    {
      id: 'overachiever',
      type: 'overachiever',
      name: 'Overachiever',
      description: 'Exceeded all requirements by 150% or more',
      xp_bonus: 800,
      special_badge: 'overachiever_badge',
      special_title: 'The Overachiever',
      unlock_content: 'advanced_training_guide',
      rarity: 'legendary',
      visual_effects: {
        confetti: true,
        fireworks: true,
        glow: true,
        sound: 'overachiever_fanfare'
      }
    }
  ];

  // Calculate all rewards for a challenge completion
  async calculateRewards(
    challenge: Challenge,
    participant: ChallengeParticipant,
    performanceMetrics: ChallengePerformanceMetrics
  ): Promise<RewardCalculationResult> {
    // Get base rewards from challenge
    const baseRewards = this.getEligibleBaseRewards(challenge, participant.rank);
    
    // Calculate special rewards based on performance
    const specialRewards = await this.calculateSpecialRewards(
      challenge,
      participant,
      performanceMetrics
    );
    
    // Calculate total XP
    const baseXP = this.calculateBaseXP(baseRewards, challenge.difficulty_level);
    const bonusXP = specialRewards.reduce((sum, reward) => sum + reward.xp_bonus, 0);
    const totalXP = baseXP + bonusXP;
    
    // Extract achievements, titles, and badges
    const achievementsUnlocked = this.extractAchievements(baseRewards, specialRewards);
    const titlesEarned = specialRewards
      .filter(reward => reward.special_title)
      .map(reward => reward.special_title!);
    const badgesEarned = specialRewards
      .filter(reward => reward.special_badge)
      .map(reward => reward.special_badge!);
    
    return {
      base_rewards: baseRewards,
      special_rewards: specialRewards,
      total_xp: totalXP,
      bonus_xp: bonusXP,
      achievements_unlocked: achievementsUnlocked,
      titles_earned: titlesEarned,
      badges_earned: badgesEarned
    };
  }

  // Get eligible base rewards based on rank
  private getEligibleBaseRewards(challenge: Challenge, rank: number): ChallengeReward[] {
    return challenge.rewards.filter(reward => {
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
  }

  // Calculate special rewards based on performance metrics
  private async calculateSpecialRewards(
    challenge: Challenge,
    participant: ChallengeParticipant,
    metrics: ChallengePerformanceMetrics
  ): Promise<SpecialReward[]> {
    const specialRewards: SpecialReward[] = [];

    // Perfect Score Reward
    if (metrics.completion_percentage >= 100 && this.isPerfectExecution(participant)) {
      specialRewards.push(this.getSpecialReward('perfect_score'));
    }

    // Speed Bonus Reward
    if (this.isSpeedCompletion(challenge, metrics.completion_time_days)) {
      specialRewards.push(this.getSpecialReward('speed_bonus'));
    }

    // Consistency Master Reward
    if (challenge.category === 'consistency' && metrics.consistency_score >= 95) {
      specialRewards.push(this.getSpecialReward('consistency_master'));
    }

    // Overachiever Reward
    if (metrics.requirements_exceeded >= 1.5) {
      specialRewards.push(this.getSpecialReward('overachiever'));
    }

    // Comeback Victory Reward
    if (this.isComebackVictory(metrics)) {
      specialRewards.push(this.getSpecialReward('comeback_victory'));
    }

    // Streak Bonus Reward (would need streak data)
    if (this.hasActiveStreak(participant)) {
      specialRewards.push(this.getSpecialReward('streak_bonus'));
    }

    return specialRewards;
  }

  // Get special reward template
  private getSpecialReward(type: string): SpecialReward {
    const template = this.specialRewardTemplates.find(r => r.type === type);
    if (!template) {
      throw new Error(`Special reward template not found: ${type}`);
    }
    
    return {
      ...template,
      id: this.generateId()
    };
  }

  // Calculate base XP from rewards
  private calculateBaseXP(rewards: ChallengeReward[], difficultyLevel: number): number {
    const baseXP = rewards
      .filter(reward => reward.type === 'xp')
      .reduce((sum, reward) => sum + (reward.value as number), 0);
    
    const multiplier = DIFFICULTY_MULTIPLIERS[difficultyLevel];
    return Math.round(baseXP * multiplier);
  }

  // Extract achievement IDs from rewards
  private extractAchievements(baseRewards: ChallengeReward[], specialRewards: SpecialReward[]): string[] {
    const achievements: string[] = [];
    
    // Add base achievements
    baseRewards
      .filter(reward => reward.type === 'badge')
      .forEach(reward => achievements.push(reward.value as string));
    
    // Add special achievements
    specialRewards.forEach(reward => {
      if (reward.special_badge) {
        achievements.push(reward.special_badge);
      }
    });
    
    return achievements;
  }

  // Performance checking methods
  private isPerfectExecution(participant: ChallengeParticipant): boolean {
    // This would check if the participant had perfect execution
    // For now, return true if progress is exactly 100%
    return participant.progress === 100;
  }

  private isSpeedCompletion(challenge: Challenge, completionTimeDays: number): boolean {
    const challengeDurationDays = Math.ceil(
      (challenge.end_date.getTime() - challenge.start_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Speed completion if finished in less than 30% of available time
    return completionTimeDays < challengeDurationDays * 0.3;
  }

  private isComebackVictory(metrics: ChallengePerformanceMetrics): boolean {
    // This would check if the user had a significant rank improvement
    // For now, check if they finished in top 10% with good improvement score
    const topPercentage = (metrics.rank / metrics.total_participants) * 100;
    return topPercentage <= 10 && metrics.improvement_score >= 80;
  }

  private hasActiveStreak(participant: ChallengeParticipant): boolean {
    // This would check if the user has an active streak
    // For now, return true for demonstration
    return Math.random() > 0.7; // 30% chance for demo
  }

  // Create performance metrics from participant data
  createPerformanceMetrics(
    challenge: Challenge,
    participant: ChallengeParticipant,
    progressRecords: any[]
  ): ChallengePerformanceMetrics {
    const completionTimeDays = participant.completion_date
      ? Math.ceil((participant.completion_date.getTime() - participant.joined_at.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const requirementsExceeded = progressRecords.length > 0
      ? Math.max(...progressRecords.map(p => p.current_value / p.target_value))
      : 1;

    return {
      completion_percentage: participant.progress,
      completion_time_days: completionTimeDays,
      rank: participant.rank,
      total_participants: challenge.participants_count,
      requirements_exceeded: requirementsExceeded,
      consistency_score: this.calculateConsistencyScore(participant),
      speed_score: this.calculateSpeedScore(challenge, completionTimeDays),
      improvement_score: this.calculateImprovementScore(participant)
    };
  }

  private calculateConsistencyScore(participant: ChallengeParticipant): number {
    // This would calculate based on daily activity consistency
    // For now, return a score based on completion percentage
    return Math.min(participant.progress, 100);
  }

  private calculateSpeedScore(challenge: Challenge, completionTimeDays: number): number {
    const challengeDurationDays = Math.ceil(
      (challenge.end_date.getTime() - challenge.start_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (completionTimeDays === 0) return 0;
    
    // Higher score for faster completion
    const speedRatio = challengeDurationDays / completionTimeDays;
    return Math.min(speedRatio * 20, 100); // Cap at 100
  }

  private calculateImprovementScore(participant: ChallengeParticipant): number {
    // This would calculate based on rank improvement over time
    // For now, return a score based on final rank
    const rankPercentile = (1 - (participant.rank - 1) / 100) * 100;
    return Math.max(rankPercentile, 0);
  }

  // Generate special reward content for sharing
  generateShareableContent(
    challenge: Challenge,
    participant: ChallengeParticipant,
    rewardResult: RewardCalculationResult
  ): {
    title: string;
    description: string;
    image_data: any;
    hashtags: string[];
  } {
    const isWinner = participant.rank === 1;
    const hasSpecialRewards = rewardResult.special_rewards.length > 0;
    
    let title = `🏆 Challenge Completed!`;
    if (isWinner) {
      title = `👑 Challenge Champion!`;
    } else if (participant.rank <= 3) {
      title = `🥉 Podium Finish!`;
    }

    let description = `I just completed the "${challenge.name}" challenge`;
    if (isWinner) {
      description += ` and WON first place! 🥇`;
    } else {
      description += ` and finished #${participant.rank} out of ${challenge.participants_count} participants!`;
    }

    if (hasSpecialRewards) {
      const specialTitles = rewardResult.special_rewards.map(r => r.name).join(', ');
      description += ` Earned special rewards: ${specialTitles}!`;
    }

    description += ` 💪 ${Math.round(participant.progress)}% completion, ⚡ ${rewardResult.total_xp} XP earned!`;

    const hashtags = [
      '#FitnessChallenge',
      '#WorkoutMotivation',
      '#FitnessGoals',
      `#${challenge.category}Challenge`,
      '#GymLife'
    ];

    if (isWinner) {
      hashtags.push('#Champion', '#Winner');
    }

    if (hasSpecialRewards) {
      hashtags.push('#SpecialAchievement');
    }

    return {
      title,
      description,
      image_data: {
        challenge_name: challenge.name,
        rank: participant.rank,
        total_participants: challenge.participants_count,
        progress: Math.round(participant.progress),
        xp_earned: rewardResult.total_xp,
        special_rewards: rewardResult.special_rewards.map(r => r.name)
      },
      hashtags
    };
  }

  // Get reward rarity distribution for a challenge
  getRewardRarityDistribution(challenge: Challenge): Record<string, number> {
    const distribution: Record<string, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };

    challenge.rewards.forEach(reward => {
      distribution[reward.rarity]++;
    });

    return distribution;
  }

  // Estimate reward value for a challenge
  estimateRewardValue(challenge: Challenge, estimatedRank: number): {
    estimated_xp: number;
    estimated_rewards: number;
    special_rewards_possible: number;
  } {
    const eligibleRewards = this.getEligibleBaseRewards(challenge, estimatedRank);
    const baseXP = this.calculateBaseXP(eligibleRewards, challenge.difficulty_level);
    
    // Estimate possible special rewards based on challenge type and difficulty
    let specialRewardsPossible = 0;
    if (challenge.difficulty_level >= 3) specialRewardsPossible += 1;
    if (challenge.category === 'consistency') specialRewardsPossible += 1;
    if (estimatedRank <= 3) specialRewardsPossible += 1;

    return {
      estimated_xp: baseXP,
      estimated_rewards: eligibleRewards.length,
      special_rewards_possible: specialRewardsPossible
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }
}

// Export singleton instance
export const challengeRewardsManager = new ChallengeRewardsManager();