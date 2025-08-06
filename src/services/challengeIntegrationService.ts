// Challenge Integration Service - Complete integration with gamification system
// Implements task 14.3 - Integrar challenges con gamificación

import { challengeService } from './challengeService';
import { challengeGamificationService, CelebrationData } from './challengeGamificationService';
import { XPIntegrationService } from './XPIntegrationService';
import { challengeRewardsManager, RewardCalculationResult } from './challengeRewardsManager';
import { 
  Challenge, 
  ChallengeParticipant, 
  UpdateChallengeProgressRequest,
  ChallengeReward 
} from '../types/challenges';
import { CHALLENGE_XP_REWARDS, DIFFICULTY_MULTIPLIERS } from '../constants/challenges';

// Enhanced challenge completion result
export interface ChallengeCompletionResult {
  participant: ChallengeParticipant;
  celebration: CelebrationData;
  rewards: ChallengeReward[];
  achievements: any[];
  xp_gained: number;
  level_gained?: number;
  rank_improvement?: { from: number; to: number };
}

// Challenge milestone tracking
export interface ChallengeMilestone {
  id: string;
  challenge_id: string;
  user_id: string;
  milestone_type: 'progress_25' | 'progress_50' | 'progress_75' | 'first_requirement' | 'halfway_point' | 'final_sprint';
  achieved_at: Date;
  xp_awarded: number;
  celebration_shown: boolean;
}

// Special challenge events
export interface SpecialChallengeEvent {
  id: string;
  type: 'perfect_week' | 'comeback_story' | 'consistency_master' | 'speed_demon' | 'overachiever';
  challenge_id: string;
  user_id: string;
  description: string;
  bonus_xp: number;
  special_reward?: string;
  created_at: Date;
}

export class ChallengeIntegrationService {
  private milestones: Map<string, ChallengeMilestone[]> = new Map();
  private specialEvents: SpecialChallengeEvent[] = [];

  // Enhanced challenge joining with full gamification integration
  async joinChallengeWithIntegration(
    challengeId: string, 
    userId: string
  ): Promise<{ participant: ChallengeParticipant; celebration: CelebrationData }> {
    // Join the challenge through the main service
    const result = await challengeService.joinChallenge({
      challenge_id: challengeId,
      user_id: userId
    });

    // Check for special joining bonuses
    const challenge = await challengeService.getChallenge(challengeId);
    const bonusXP = await this.calculateJoiningBonuses(challenge, userId);
    
    if (bonusXP > 0) {
      // Add bonus XP to celebration
      result.celebration.xp_gained = (result.celebration.xp_gained || 0) + bonusXP;
      result.celebration.message += ` Plus ${bonusXP} bonus XP!`;
    }

    // Initialize milestone tracking
    await this.initializeMilestoneTracking(challengeId, userId, result.participant.id);

    return result;
  }

  // Enhanced progress update with milestone detection
  async updateProgressWithIntegration(
    request: UpdateChallengeProgressRequest
  ): Promise<{
    progressRecords: any[];
    celebration?: CelebrationData;
    milestones?: ChallengeMilestone[];
    specialEvents?: SpecialChallengeEvent[];
  }> {
    // Update progress through main service
    const result = await challengeService.updateProgress(request);
    
    // Get participant and challenge info
    const participant = await this.getParticipantById(request.participant_id);
    const challenge = await challengeService.getChallenge(participant.challenge_id);
    
    // Check for milestones
    const newMilestones = await this.checkProgressMilestones(
      challenge, 
      participant, 
      result.progressRecords
    );

    // Check for special events
    const specialEvents = await this.checkSpecialEvents(
      challenge, 
      participant, 
      result.progressRecords
    );

    // Enhance celebration with milestone and special event data
    if (result.celebration && (newMilestones.length > 0 || specialEvents.length > 0)) {
      result.celebration = await this.enhanceCelebration(
        result.celebration,
        newMilestones,
        specialEvents
      );
    }

    return {
      ...result,
      milestones: newMilestones,
      specialEvents
    };
  }

  // Enhanced challenge completion with comprehensive rewards
  async completeChallengeWithIntegration(
    challengeId: string,
    userId: string
  ): Promise<ChallengeCompletionResult> {
    const challenge = await challengeService.getChallenge(challengeId);
    const participants = await challengeService.getLeaderboard(challengeId);
    const userParticipant = participants.participants.find(p => p.user_id === userId);
    
    if (!userParticipant) {
      throw new Error('User is not participating in this challenge');
    }

    // Process completion through gamification service
    const celebration = await challengeGamificationService.processChallengeCompletion(
      userId,
      challenge,
      userParticipant as any, // Type conversion needed
      userParticipant.rank
    );

    // Calculate all rewards earned
    const rewards = await this.calculateAllRewards(challenge, userParticipant.rank);
    
    // Check for completion achievements
    const achievements = await this.getCompletionAchievements(challenge, userParticipant);
    
    // Calculate total XP gained
    const totalXP = this.calculateCompletionXP(challenge, userParticipant.rank);
    
    // Check for level up
    const levelGained = await this.checkLevelUp(userId, totalXP);
    
    // Create comprehensive completion result
    return {
      participant: userParticipant as any,
      celebration,
      rewards,
      achievements,
      xp_gained: totalXP,
      level_gained: levelGained,
      rank_improvement: undefined // Would be calculated from previous rank
    };
  }

  // Calculate special joining bonuses
  private async calculateJoiningBonuses(challenge: Challenge, userId: string): Promise<number> {
    let bonusXP = 0;
    
    // Early bird bonus (join within first 24 hours)
    const hoursAfterStart = (Date.now() - challenge.created_at.getTime()) / (1000 * 60 * 60);
    if (hoursAfterStart <= 24) {
      bonusXP += 50;
    }
    
    // Global challenge bonus
    if (challenge.type === 'global') {
      bonusXP += 25;
    }
    
    // High difficulty bonus
    if (challenge.difficulty_level >= 4) {
      bonusXP += challenge.difficulty_level * 10;
    }
    
    // First-time category bonus
    const userStats = challengeGamificationService.getUserGamificationStats(userId);
    // This would check if user has never done this category before
    // For now, we'll give a small bonus
    bonusXP += 15;
    
    return bonusXP;
  }

  // Initialize milestone tracking for a participant
  private async initializeMilestoneTracking(
    challengeId: string, 
    userId: string, 
    participantId: string
  ): Promise<void> {
    const milestones: ChallengeMilestone[] = [];
    this.milestones.set(participantId, milestones);
  }

  // Check for progress milestones
  private async checkProgressMilestones(
    challenge: Challenge,
    participant: ChallengeParticipant,
    progressRecords: any[]
  ): Promise<ChallengeMilestone[]> {
    const newMilestones: ChallengeMilestone[] = [];
    const existingMilestones = this.milestones.get(participant.id) || [];
    
    // Check progress percentage milestones
    const progressMilestones = [
      { threshold: 25, type: 'progress_25' as const, xp: 50 },
      { threshold: 50, type: 'progress_50' as const, xp: 100 },
      { threshold: 75, type: 'progress_75' as const, xp: 150 }
    ];
    
    for (const milestone of progressMilestones) {
      if (participant.progress >= milestone.threshold) {
        const alreadyAchieved = existingMilestones.some(m => m.milestone_type === milestone.type);
        if (!alreadyAchieved) {
          const newMilestone: ChallengeMilestone = {
            id: this.generateId(),
            challenge_id: challenge.id,
            user_id: participant.user_id,
            milestone_type: milestone.type,
            achieved_at: new Date(),
            xp_awarded: milestone.xp,
            celebration_shown: false
          };
          newMilestones.push(newMilestone);
          existingMilestones.push(newMilestone);
        }
      }
    }
    
    // Check first requirement completion
    const completedRequirements = progressRecords.filter(p => p.is_completed);
    if (completedRequirements.length === 1) {
      const alreadyAchieved = existingMilestones.some(m => m.milestone_type === 'first_requirement');
      if (!alreadyAchieved) {
        const milestone: ChallengeMilestone = {
          id: this.generateId(),
          challenge_id: challenge.id,
          user_id: participant.user_id,
          milestone_type: 'first_requirement',
          achieved_at: new Date(),
          xp_awarded: 75,
          celebration_shown: false
        };
        newMilestones.push(milestone);
        existingMilestones.push(milestone);
      }
    }
    
    this.milestones.set(participant.id, existingMilestones);
    return newMilestones;
  }

  // Check for special events
  private async checkSpecialEvents(
    challenge: Challenge,
    participant: ChallengeParticipant,
    progressRecords: any[]
  ): Promise<SpecialChallengeEvent[]> {
    const specialEvents: SpecialChallengeEvent[] = [];
    
    // Perfect week detection (for consistency challenges)
    if (challenge.category === 'consistency' && this.isPerfectWeek(participant)) {
      specialEvents.push({
        id: this.generateId(),
        type: 'perfect_week',
        challenge_id: challenge.id,
        user_id: participant.user_id,
        description: 'Completed a perfect week of consistency!',
        bonus_xp: 200,
        special_reward: 'Perfect Week Badge',
        created_at: new Date()
      });
    }
    
    // Overachiever detection (exceeding target by 50%+)
    const overachievingRequirements = progressRecords.filter(p => 
      p.current_value > p.target_value * 1.5
    );
    if (overachievingRequirements.length > 0) {
      specialEvents.push({
        id: this.generateId(),
        type: 'overachiever',
        challenge_id: challenge.id,
        user_id: participant.user_id,
        description: 'Exceeded challenge requirements by 50%+!',
        bonus_xp: 300,
        special_reward: 'Overachiever Title',
        created_at: new Date()
      });
    }
    
    // Speed demon (completing very quickly)
    const challengeDuration = challenge.end_date.getTime() - challenge.start_date.getTime();
    const participationTime = Date.now() - participant.joined_at.getTime();
    if (participant.is_completed && participationTime < challengeDuration * 0.3) {
      specialEvents.push({
        id: this.generateId(),
        type: 'speed_demon',
        challenge_id: challenge.id,
        user_id: participant.user_id,
        description: 'Completed challenge in record time!',
        bonus_xp: 250,
        special_reward: 'Speed Demon Badge',
        created_at: new Date()
      });
    }
    
    this.specialEvents.push(...specialEvents);
    return specialEvents;
  }

  // Enhance celebration with milestone and special event data
  private async enhanceCelebration(
    baseCelebration: CelebrationData,
    milestones: ChallengeMilestone[],
    specialEvents: SpecialChallengeEvent[]
  ): Promise<CelebrationData> {
    let enhancedCelebration = { ...baseCelebration };
    
    // Add milestone XP
    const milestoneXP = milestones.reduce((sum, m) => sum + m.xp_awarded, 0);
    if (milestoneXP > 0) {
      enhancedCelebration.xp_gained = (enhancedCelebration.xp_gained || 0) + milestoneXP;
    }
    
    // Add special event XP
    const eventXP = specialEvents.reduce((sum, e) => sum + e.bonus_xp, 0);
    if (eventXP > 0) {
      enhancedCelebration.xp_gained = (enhancedCelebration.xp_gained || 0) + eventXP;
    }
    
    // Enhance visual effects for special achievements
    if (specialEvents.length > 0) {
      enhancedCelebration.visual_effects.fireworks = true;
      enhancedCelebration.visual_effects.confetti = true;
    }
    
    // Update message with milestone/event info
    if (milestones.length > 0 || specialEvents.length > 0) {
      const bonusMessages = [];
      if (milestones.length > 0) {
        bonusMessages.push(`${milestones.length} milestone${milestones.length > 1 ? 's' : ''} achieved`);
      }
      if (specialEvents.length > 0) {
        bonusMessages.push(`${specialEvents.length} special event${specialEvents.length > 1 ? 's' : ''} unlocked`);
      }
      enhancedCelebration.message += ` 🎉 ${bonusMessages.join(' and ')}!`;
    }
    
    return enhancedCelebration;
  }

  // Calculate all rewards for a challenge completion
  private async calculateAllRewards(challenge: Challenge, rank: number): Promise<ChallengeReward[]> {
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

  // Get completion achievements
  private async getCompletionAchievements(challenge: Challenge, participant: any): Promise<any[]> {
    // This would integrate with the main achievement system
    // For now, return mock achievements
    const achievements = [];
    
    if (participant.rank === 1) {
      achievements.push({
        id: 'challenge_winner',
        name: 'Challenge Champion',
        description: `Won the ${challenge.name} challenge!`,
        rarity: 'legendary'
      });
    }
    
    if (participant.rank <= 3) {
      achievements.push({
        id: 'podium_finish',
        name: 'Podium Finisher',
        description: 'Finished in the top 3 of a challenge',
        rarity: 'epic'
      });
    }
    
    return achievements;
  }

  // Calculate total completion XP
  private calculateCompletionXP(challenge: Challenge, rank: number): number {
    let baseXP = CHALLENGE_XP_REWARDS.COMPLETE_CHALLENGE;
    
    // Rank bonuses
    if (rank === 1) baseXP += CHALLENGE_XP_REWARDS.WIN_CHALLENGE;
    else if (rank <= 3) baseXP += CHALLENGE_XP_REWARDS.TOP_3_FINISH;
    else if (rank <= 10) baseXP += CHALLENGE_XP_REWARDS.TOP_10_FINISH;
    
    // Apply difficulty multiplier
    const multiplier = DIFFICULTY_MULTIPLIERS[challenge.difficulty_level];
    
    return Math.round(baseXP * multiplier);
  }

  // Check if user leveled up
  private async checkLevelUp(userId: string, xpGained: number): Promise<number | undefined> {
    const userStats = challengeGamificationService.getUserGamificationStats(userId);
    const oldLevel = userStats.current_level;
    const newLevel = this.calculateLevel(userStats.total_xp + xpGained);
    
    return newLevel > oldLevel ? newLevel : undefined;
  }

  // Helper methods
  private isPerfectWeek(participant: ChallengeParticipant): boolean {
    // This would check if the user has been perfectly consistent
    // For now, return a simple check
    return participant.progress >= 100 && 
           (Date.now() - participant.joined_at.getTime()) <= 7 * 24 * 60 * 60 * 1000;
  }

  private calculateLevel(totalXP: number): number {
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  private async getParticipantById(participantId: string): Promise<ChallengeParticipant> {
    // This would be implemented to fetch participant by ID
    // For now, throw an error to indicate it needs implementation
    throw new Error('getParticipantById not implemented - would fetch from storage');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  // Public query methods
  public getMilestonesForParticipant(participantId: string): ChallengeMilestone[] {
    return this.milestones.get(participantId) || [];
  }

  public getSpecialEventsForUser(userId: string): SpecialChallengeEvent[] {
    return this.specialEvents.filter(event => event.user_id === userId);
  }

  public getSpecialEventsForChallenge(challengeId: string): SpecialChallengeEvent[] {
    return this.specialEvents.filter(event => event.challenge_id === challengeId);
  }

  // Challenge leaderboard with enhanced gamification data
  async getEnhancedLeaderboard(challengeId: string) {
    const baseLeaderboard = await challengeService.getLeaderboard(challengeId);
    
    // Enhance each participant with gamification data
    const enhancedParticipants = baseLeaderboard.participants.map(participant => ({
      ...participant,
      milestones: this.getMilestonesForParticipant(participant.user_id),
      special_events: this.getSpecialEventsForUser(participant.user_id)
        .filter(event => event.challenge_id === challengeId),
      total_bonus_xp: this.calculateTotalBonusXP(participant.user_id, challengeId)
    }));
    
    return {
      ...baseLeaderboard,
      participants: enhancedParticipants
    };
  }

  private calculateTotalBonusXP(userId: string, challengeId: string): number {
    const userMilestones = this.specialEvents
      .filter(event => event.user_id === userId && event.challenge_id === challengeId);
    
    return userMilestones.reduce((sum, event) => sum + event.bonus_xp, 0);
  }

  // ============================================================================
  // XP SYSTEM INTEGRATION - Task 14.3 Implementation
  // ============================================================================

  /**
   * Award XP for challenge-related activities through the main XP system
   */
  async awardChallengeXP(
    userId: string,
    xpAmount: number,
    source: string,
    challengeId: string,
    metadata?: any
  ): Promise<void> {
    try {
      const xpService = XPIntegrationService.getInstance();
      
      await xpService.awardCustomXP(userId, {
        amount: xpAmount,
        source: `challenge_${source}` as any,
        description: `Challenge activity: ${source}`,
        metadata: {
          challenge_id: challengeId,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Failed to award challenge XP:', error);
    }
  }

  /**
   * Complete challenge integration with full XP and rewards
   */
  async completeChallenge(
    challengeId: string,
    userId: string,
    participantId: string
  ): Promise<ChallengeCompletionResult> {
    try {
      // Get challenge and participant data
      const challenge = await challengeService.getChallenge(challengeId);
      const participant = await this.getParticipantById(participantId);
      
      // Calculate comprehensive rewards using the rewards manager
      const performanceMetrics = challengeRewardsManager.createPerformanceMetrics(
        challenge,
        participant,
        [] // Would pass actual progress records
      );
      
      const rewardResult: RewardCalculationResult = await challengeRewardsManager.calculateRewards(
        challenge,
        participant,
        performanceMetrics
      );

      // Award XP through the main XP system
      await this.awardChallengeXP(
        userId,
        rewardResult.total_xp,
        'completion',
        challengeId,
        {
          rank: participant.rank,
          progress: participant.progress,
          special_rewards: rewardResult.special_rewards.length
        }
      );

      // Award bonus XP for special rewards
      for (const specialReward of rewardResult.special_rewards) {
        await this.awardChallengeXP(
          userId,
          specialReward.xp_bonus,
          `special_${specialReward.type}`,
          challengeId,
          { reward_name: specialReward.name }
        );
      }

      // Create epic celebration
      const celebration: CelebrationData = {
        type: 'challenge_completed',
        title: participant.rank === 1 ? '👑 CHAMPION!' : '🏆 Challenge Complete!',
        message: `Congratulations! You finished "${challenge.name}" in ${this.getOrdinalRank(participant.rank)} place!`,
        xp_gained: rewardResult.total_xp,
        achievements: rewardResult.achievements_unlocked.map(id => ({
          achievement_id: id,
          name: this.getAchievementName(id),
          description: this.getAchievementDescription(id),
          xp_reward: 100,
          rarity: 'epic' as const
        })),
        visual_effects: {
          confetti: true,
          fireworks: participant.rank <= 3,
          glow: true,
          sound: participant.rank === 1 ? 'champion_fanfare' : 'victory_fanfare'
        }
      };

      return {
        participant,
        celebration,
        rewards: rewardResult.base_rewards,
        achievements: rewardResult.achievements_unlocked,
        xp_gained: rewardResult.total_xp,
        level_gained: await this.checkLevelUp(userId, rewardResult.total_xp),
        rank_improvement: undefined // Would calculate from historical data
      };
    } catch (error) {
      console.error('Failed to complete challenge integration:', error);
      throw error;
    }
  }

  /**
   * Award milestone XP through the main system
   */
  async awardMilestoneXP(
    userId: string,
    milestone: ChallengeMilestone
  ): Promise<void> {
    await this.awardChallengeXP(
      userId,
      milestone.xp_awarded,
      `milestone_${milestone.milestone_type}`,
      milestone.challenge_id,
      { milestone_id: milestone.id }
    );
  }

  /**
   * Award special event XP through the main system
   */
  async awardSpecialEventXP(
    userId: string,
    specialEvent: SpecialChallengeEvent
  ): Promise<void> {
    await this.awardChallengeXP(
      userId,
      specialEvent.bonus_xp,
      `special_event_${specialEvent.type}`,
      specialEvent.challenge_id,
      { 
        event_id: specialEvent.id,
        event_description: specialEvent.description
      }
    );
  }

  // Helper methods for XP integration
  private getOrdinalRank(rank: number): string {
    const suffix = ['th', 'st', 'nd', 'rd'][rank % 10] || 'th';
    if (rank >= 11 && rank <= 13) return `${rank}th`;
    return `${rank}${suffix}`;
  }

  private getAchievementName(achievementId: string): string {
    const names: Record<string, string> = {
      'challenge_winner': 'Challenge Champion',
      'podium_finish': 'Podium Finisher',
      'challenge_complete': 'Challenge Completer',
      'perfect_score': 'Perfectionist',
      'speed_demon': 'Speed Demon',
      'consistency_master': 'Consistency Master'
    };
    return names[achievementId] || 'Special Achievement';
  }

  private getAchievementDescription(achievementId: string): string {
    const descriptions: Record<string, string> = {
      'challenge_winner': 'Won a fitness challenge',
      'podium_finish': 'Finished in the top 3 of a challenge',
      'challenge_complete': 'Successfully completed a challenge',
      'perfect_score': 'Achieved perfect execution',
      'speed_demon': 'Completed challenge in record time',
      'consistency_master': 'Maintained perfect consistency'
    };
    return descriptions[achievementId] || 'Earned through exceptional performance';
  }
}

// Export singleton instance
export const challengeIntegrationService = new ChallengeIntegrationService();