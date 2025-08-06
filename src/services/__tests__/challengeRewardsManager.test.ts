import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChallengeRewardsManager } from '../challengeRewardsManager';
import { GamificationService } from '../GamificationService';

// Mock dependencies
vi.mock('../GamificationService');

describe('ChallengeRewardsManager', () => {
  let rewardsManager: ChallengeRewardsManager;
  let mockGamificationService: any;

  const mockChallenge = {
    id: 'challenge-1',
    title: 'Strength Challenge',
    type: 'individual' as const,
    category: 'strength' as const,
    difficulty: 'hard' as const,
    rewards: {
      xp: 1000,
      badge: 'strength-master',
      title: 'Iron Warrior'
    }
  };

  const mockParticipant = {
    id: 'participant-1',
    userId: 'user-1',
    challengeId: 'challenge-1',
    progress: 100,
    completedAt: new Date(),
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    milestones: [25, 50, 75, 100]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockGamificationService = {
      awardXP: vi.fn(),
      unlockAchievement: vi.fn(),
      getCurrentLevel: vi.fn().mockReturnValue({ level: 8, xp: 2500 })
    };

    (GamificationService as any).mockImplementation(() => mockGamificationService);
    rewardsManager = new ChallengeRewardsManager();
  });

  describe('calculateChallengeRewards', () => {
    it('should calculate base rewards correctly', () => {
      const rewards = rewardsManager.calculateChallengeRewards(
        mockChallenge,
        mockParticipant
      );

      expect(rewards.baseXP).toBe(1000);
      expect(rewards.bonusXP).toBeGreaterThan(0);
      expect(rewards.totalXP).toBe(rewards.baseXP + rewards.bonusXP);
      expect(rewards.specialRewards).toContain('speed_demon'); // Completed in 7 days
    });

    it('should award perfectionist bonus for 100% completion', () => {
      const perfectParticipant = {
        ...mockParticipant,
        progress: 100,
        milestones: [25, 50, 75, 100] // Hit all milestones
      };

      const rewards = rewardsManager.calculateChallengeRewards(
        mockChallenge,
        perfectParticipant
      );

      expect(rewards.specialRewards).toContain('perfectionist');
      expect(rewards.bonusXP).toBeGreaterThan(200); // Perfectionist bonus
    });

    it('should award streak master bonus for consistent progress', () => {
      const streakParticipant = {
        ...mockParticipant,
        dailyProgress: Array(7).fill(true) // 7 consecutive days
      };

      const rewards = rewardsManager.calculateChallengeRewards(
        mockChallenge,
        streakParticipant
      );

      expect(rewards.specialRewards).toContain('streak_master');
    });

    it('should apply difficulty multipliers', () => {
      const easyChallenge = { ...mockChallenge, difficulty: 'easy' as const };
      const hardChallenge = { ...mockChallenge, difficulty: 'hard' as const };

      const easyRewards = rewardsManager.calculateChallengeRewards(
        easyChallenge,
        mockParticipant
      );
      const hardRewards = rewardsManager.calculateChallengeRewards(
        hardChallenge,
        mockParticipant
      );

      expect(hardRewards.totalXP).toBeGreaterThan(easyRewards.totalXP);
    });
  });

  describe('awardSpecialBonus', () => {
    it('should award first challenge completion bonus', async () => {
      const result = await rewardsManager.awardSpecialBonus(
        'user-1',
        'first_challenge_completion',
        { challengeCount: 1 }
      );

      expect(result.success).toBe(true);
      expect(result.bonusXP).toBe(500);
      expect(mockGamificationService.awardXP).toHaveBeenCalledWith(
        'user-1',
        500,
        'first_challenge_completion'
      );
    });

    it('should award challenge streak bonus', async () => {
      const result = await rewardsManager.awardSpecialBonus(
        'user-1',
        'challenge_streak',
        { streakCount: 5 }
      );

      expect(result.success).toBe(true);
      expect(result.bonusXP).toBe(250); // 5 * 50
      expect(mockGamificationService.unlockAchievement).toHaveBeenCalledWith(
        'user-1',
        'challenge_streak_5'
      );
    });

    it('should award special event completion bonus', async () => {
      const result = await rewardsManager.awardSpecialBonus(
        'user-1',
        'special_event_completion',
        { eventMultiplier: 2.0, baseXP: 1000 }
      );

      expect(result.success).toBe(true);
      expect(result.bonusXP).toBe(1000); // 100% bonus
    });
  });

  describe('triggerEpicCelebration', () => {
    it('should trigger celebration for challenge completion', async () => {
      const celebrationData = {
        type: 'challenge_completion' as const,
        challengeTitle: 'Epic Challenge',
        rewards: {
          baseXP: 1000,
          bonusXP: 500,
          specialRewards: ['perfectionist', 'speed_demon'],
          totalXP: 1500
        },
        rank: 1,
        totalParticipants: 50
      };

      const result = await rewardsManager.triggerEpicCelebration(
        'user-1',
        celebrationData
      );

      expect(result.success).toBe(true);
      expect(result.celebration).toBeDefined();
      expect(result.celebration.type).toBe('challenge_completion');
      expect(result.celebration.effects).toContain('fireworks');
      expect(result.celebration.effects).toContain('confetti');
    });

    it('should trigger special celebration for first place finish', async () => {
      const celebrationData = {
        type: 'challenge_completion' as const,
        challengeTitle: 'Competition Challenge',
        rewards: {
          baseXP: 2000,
          bonusXP: 1000,
          specialRewards: ['champion'],
          totalXP: 3000
        },
        rank: 1,
        totalParticipants: 100
      };

      const result = await rewardsManager.triggerEpicCelebration(
        'user-1',
        celebrationData
      );

      expect(result.celebration.intensity).toBe('epic');
      expect(result.celebration.effects).toContain('golden_shower');
      expect(result.celebration.title).toContain('Champion');
    });

    it('should handle milestone celebrations', async () => {
      const celebrationData = {
        type: 'milestone_reached' as const,
        challengeTitle: 'Progress Challenge',
        milestone: 75,
        rewards: {
          baseXP: 200,
          bonusXP: 50,
          specialRewards: [],
          totalXP: 250
        }
      };

      const result = await rewardsManager.triggerEpicCelebration(
        'user-1',
        celebrationData
      );

      expect(result.celebration.type).toBe('milestone_reached');
      expect(result.celebration.intensity).toBe('moderate');
    });
  });

  describe('Performance Bonuses', () => {
    it('should calculate speed demon bonus correctly', () => {
      const fastParticipant = {
        ...mockParticipant,
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completedAt: new Date()
      };

      const rewards = rewardsManager.calculateChallengeRewards(
        mockChallenge,
        fastParticipant
      );

      expect(rewards.specialRewards).toContain('speed_demon');
      expect(rewards.bonusXP).toBeGreaterThan(300); // Speed bonus
    });

    it('should calculate consistency bonus', () => {
      const consistentParticipant = {
        ...mockParticipant,
        dailyProgress: Array(14).fill(true), // 14 consecutive days
        averageDailyProgress: 7.5 // Good daily average
      };

      const rewards = rewardsManager.calculateChallengeRewards(
        mockChallenge,
        consistentParticipant
      );

      expect(rewards.specialRewards).toContain('streak_master');
      expect(rewards.bonusXP).toBeGreaterThan(400); // Consistency bonus
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid bonus types gracefully', async () => {
      const result = await rewardsManager.awardSpecialBonus(
        'user-1',
        'invalid_bonus_type' as any,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid bonus type');
    });

    it('should handle celebration errors gracefully', async () => {
      // Mock a service error
      mockGamificationService.awardXP.mockRejectedValue(new Error('Service error'));

      const celebrationData = {
        type: 'challenge_completion' as const,
        challengeTitle: 'Test Challenge',
        rewards: {
          baseXP: 100,
          bonusXP: 50,
          specialRewards: [],
          totalXP: 150
        }
      };

      const result = await rewardsManager.triggerEpicCelebration(
        'user-1',
        celebrationData
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});