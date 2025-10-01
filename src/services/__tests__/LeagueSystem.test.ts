/**
 * League System Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leagueManager } from '../LeagueManager';
import { weeklyLeagueGroupingService } from '../WeeklyLeagueGroupingService';
import { leaguePromotionRelegationService } from '../LeaguePromotionRelegationService';
import { leagueRewardsService } from '../LeagueRewardsService';
import { weeklyCompetitionService } from '../WeeklyCompetitionService';

// Mock the database manager
vi.mock('@/db/IndexedDBManager', () => ({
  dbManager: {
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    put: vi.fn(),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn()
  }
}));

// Mock analytics manager
vi.mock('../AnalyticsManager', () => ({
  analyticsManager: {
    track: vi.fn()
  }
}));

// Mock real-time manager
vi.mock('../RealTimeManager', () => ({
  realTimeManager: {
    emit: vi.fn()
  }
}));

describe('League System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LeagueManager', () => {
    it('should initialize with 10 leagues', () => {
      const leagues = leagueManager.getAllLeagues();
      expect(leagues).toHaveLength(10);
      
      // Check league progression
      expect(leagues[0].name).toBe('Bronze');
      expect(leagues[0].level).toBe(1);
      expect(leagues[9].name).toBe('Phoenix');
      expect(leagues[9].level).toBe(10);
    });

    it('should have correct league point ranges', () => {
      const leagues = leagueManager.getAllLeagues();
      
      // Bronze league
      expect(leagues[0].minPoints).toBe(0);
      expect(leagues[0].maxPoints).toBe(999);
      
      // Phoenix league
      expect(leagues[9].minPoints).toBe(320000);
      expect(leagues[9].maxPoints).toBe(Infinity);
    });

    it('should add points to user correctly', async () => {
      const userId = 'test-user-1';
      const points = 500;
      
      await expect(leagueManager.addPoints(userId, points, 'test_workout')).resolves.not.toThrow();
    });
  });

  describe('WeeklyLeagueGroupingService', () => {
    it('should execute weekly grouping', async () => {
      const result = await weeklyLeagueGroupingService.executeWeeklyGrouping();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('groupsCreated');
      expect(result).toHaveProperty('totalParticipants');
      expect(result).toHaveProperty('averageGroupSize');
    });

    it('should handle empty user list gracefully', async () => {
      const result = await weeklyLeagueGroupingService.executeWeeklyGrouping({
        minGroupSize: 100 // Set high to trigger empty user scenario
      });
      
      expect(result.success).toBe(false);
      expect(result.groupsCreated).toBe(0);
    });
  });

  describe('LeaguePromotionRelegationService', () => {
    it('should process weekly results', async () => {
      const result = await leaguePromotionRelegationService.processWeeklyResults();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('groupsProcessed');
      expect(result).toHaveProperty('promotions');
      expect(result).toHaveProperty('relegations');
      expect(result).toHaveProperty('stayedSame');
    });

    it('should preview promotion/relegation results', async () => {
      const result = await leaguePromotionRelegationService.previewPromotionRelegation();
      
      expect(result).toHaveProperty('groups');
      expect(result).toHaveProperty('predictedChanges');
      expect(Array.isArray(result.groups)).toBe(true);
      expect(Array.isArray(result.predictedChanges)).toBe(true);
    });
  });

  describe('LeagueRewardsService', () => {
    it('should initialize with league rewards', () => {
      const rewards = leagueRewardsService.getAllRewards();
      
      expect(rewards.length).toBeGreaterThan(0);
      
      // Check for different reward types
      const rewardTypes = rewards.map(r => r.type);
      expect(rewardTypes).toContain('weekly_position');
      expect(rewardTypes).toContain('promotion');
      expect(rewardTypes).toContain('milestone');
    });

    it('should process weekly rewards', async () => {
      const userId = 'test-user-1';
      const mockLeague = {
        id: 'league_1',
        name: 'Bronze',
        level: 1,
        icon: '🥉',
        color: '#CD7F32',
        description: 'Start your fitness journey',
        minPoints: 0,
        maxPoints: 999
      };

      const result = await leagueRewardsService.processWeeklyRewards(
        userId,
        1, // First place
        true, // Was promoted
        false, // Was not relegated
        mockLeague
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('rewardsGranted');
      expect(result).toHaveProperty('totalXP');
    });
  });

  describe('WeeklyCompetitionService', () => {
    it('should start new competition cycle', async () => {
      const result = await weeklyCompetitionService.triggerNewCycle();
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('weekNumber');
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('active');
    });

    it('should get competition history', async () => {
      const history = await weeklyCompetitionService.getCompetitionHistory(5);
      
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('League System Integration Flow', () => {
    it('should complete full weekly cycle', async () => {
      // 1. Start new competition
      const competition = await weeklyCompetitionService.triggerNewCycle();
      expect(competition.status).toBe('active');

      // 2. Add points to simulate user activity
      await leagueManager.addPoints('user1', 1000, 'workout');
      await leagueManager.addPoints('user2', 800, 'workout');
      await leagueManager.addPoints('user3', 600, 'workout');

      // 3. Process weekly results
      const promotionResult = await leaguePromotionRelegationService.processWeeklyResults();
      expect(promotionResult).toHaveProperty('success');

      // 4. Verify rewards were processed
      const rewards = await leagueRewardsService.getAvailableRewards('user1');
      expect(Array.isArray(rewards)).toBe(true);
    });
  });
});

describe('League Eligibility', () => {
  it('should check league eligibility correctly', async () => {
    const { checkLeagueEligibility } = await import('@/utils/leagueEligibility');
    
    // Mock user
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      username: 'testuser',
      role: 'basic' as const,
      profile: {},
      settings: {},
      gamification: {},
      created_at: new Date()
    };

    // Test with enough users
    const result1 = checkLeagueEligibility(mockUser, 100);
    expect(result1.isEligible).toBe(true);

    // Test with not enough users
    const result2 = checkLeagueEligibility(mockUser, 10);
    expect(result2.isEligible).toBe(false);
    expect(result2.reason).toContain('Not enough users');

    // Test with guest user
    const guestUser = { ...mockUser, role: 'guest' as const };
    const result3 = checkLeagueEligibility(guestUser, 100);
    expect(result3.isEligible).toBe(false);
    expect(result3.reason).toContain('registered users');
  });
});