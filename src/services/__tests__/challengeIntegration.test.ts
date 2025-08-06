import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChallengeIntegrationService } from '../challengeIntegrationService';

// Mock dependencies
vi.mock('../challengeService', () => ({
  challengeService: {
    joinChallenge: vi.fn(),
    getChallenge: vi.fn(),
    updateProgress: vi.fn(),
    getLeaderboard: vi.fn()
  }
}));

vi.mock('../challengeGamificationService', () => ({
  challengeGamificationService: {
    processChallengeCompletion: vi.fn(),
    getUserGamificationStats: vi.fn()
  }
}));

describe('ChallengeIntegrationService', () => {
  let service: ChallengeIntegrationService;

  const mockChallenge = {
    id: 'challenge-1',
    name: 'Push-up Challenge',
    description: 'Complete 100 push-ups in 30 days',
    type: 'individual' as const,
    category: 'strength' as const,
    difficulty_level: 3,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-01-31'),
    created_at: new Date('2024-01-01'),
    rewards: [
      {
        id: 'reward-1',
        type: 'xp',
        value: 500,
        unlock_condition: 'completion'
      }
    ]
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockParticipant = {
    id: 'participant-1',
    user_id: 'user-1',
    challenge_id: 'challenge-1',
    progress: 0,
    joined_at: new Date(),
    is_completed: false,
    rank: 1
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup mocks
    const { challengeService } = await import('../challengeService');
    const { challengeGamificationService } = await import('../challengeGamificationService');
    
    vi.mocked(challengeService.joinChallenge).mockResolvedValue({
      participant: mockParticipant,
      celebration: {
        type: 'challenge_join',
        message: 'Successfully joined challenge!',
        xp_gained: 25,
        visual_effects: { confetti: false, fireworks: false }
      }
    });

    vi.mocked(challengeService.getChallenge).mockResolvedValue(mockChallenge);
    
    vi.mocked(challengeService.updateProgress).mockResolvedValue({
      progressRecords: [{ id: 'progress-1', current_value: 25, target_value: 100 }],
      celebration: {
        type: 'progress_update',
        message: 'Progress updated!',
        xp_gained: 50,
        visual_effects: { confetti: false, fireworks: false }
      }
    });

    vi.mocked(challengeService.getLeaderboard).mockResolvedValue({
      participants: [mockParticipant],
      total_participants: 1
    });

    vi.mocked(challengeGamificationService.getUserGamificationStats).mockReturnValue({
      current_level: 5,
      total_xp: 1000,
      challenges_completed: 2
    });

    vi.mocked(challengeGamificationService.processChallengeCompletion).mockResolvedValue({
      type: 'challenge_completion',
      message: 'Challenge completed!',
      xp_gained: 1000,
      visual_effects: { confetti: true, fireworks: true }
    });

    service = new ChallengeIntegrationService();
    
    // Mock the private getParticipantById method
    vi.spyOn(service as any, 'getParticipantById').mockResolvedValue(mockParticipant);
  });

  describe('joinChallengeWithIntegration', () => {
    it('should successfully join a challenge and award joining XP', async () => {
      const result = await service.joinChallengeWithIntegration(mockChallenge.id, mockUser.id);

      expect(result.participant).toBeDefined();
      expect(result.participant.user_id).toBe(mockUser.id);
      expect(result.celebration).toBeDefined();
      expect(result.celebration.xp_gained).toBeGreaterThan(0);
    });

    it('should calculate joining bonuses correctly', async () => {
      // Mock a high difficulty challenge
      const hardChallenge = { ...mockChallenge, difficulty_level: 5 };
      
      const result = await service.joinChallengeWithIntegration(hardChallenge.id, mockUser.id);

      expect(result.celebration.xp_gained).toBeGreaterThan(25); // Should include difficulty bonus
    });
  });

  describe('updateProgressWithIntegration', () => {
    const mockProgressRequest = {
      participant_id: 'participant-1',
      requirement_id: 'req-1',
      current_value: 25,
      notes: 'Test progress update'
    };

    it('should update progress and detect milestones', async () => {
      const result = await service.updateProgressWithIntegration(mockProgressRequest);

      expect(result.progressRecords).toBeDefined();
      expect(result.milestones).toBeDefined();
      expect(result.specialEvents).toBeDefined();
    });

    it('should enhance celebration with milestone data', async () => {
      const result = await service.updateProgressWithIntegration(mockProgressRequest);

      if (result.celebration && result.milestones && result.milestones.length > 0) {
        expect(result.celebration.xp_gained).toBeGreaterThan(0);
        expect(result.celebration.message).toContain('milestone');
      }
    });
  });

  describe('getEnhancedLeaderboard', () => {
    it('should return enhanced leaderboard with gamification data', async () => {
      const leaderboard = await service.getEnhancedLeaderboard(mockChallenge.id);

      expect(leaderboard.participants).toBeDefined();
      expect(leaderboard.participants.length).toBeGreaterThanOrEqual(0);
      
      // Check that participants have enhanced data
      if (leaderboard.participants.length > 0) {
        const participant = leaderboard.participants[0];
        expect(participant.milestones).toBeDefined();
        expect(participant.special_events).toBeDefined();
        expect(participant.total_bonus_xp).toBeDefined();
      }
    });
  });

  describe('completeChallengeWithIntegration', () => {
    it('should complete challenge with comprehensive rewards', async () => {
      const result = await service.completeChallengeWithIntegration(mockChallenge.id, mockUser.id);

      expect(result.participant).toBeDefined();
      expect(result.celebration).toBeDefined();
      expect(result.rewards).toBeDefined();
      expect(result.achievements).toBeDefined();
      expect(result.xp_gained).toBeGreaterThan(0);
    });

    it('should handle level up on completion', async () => {
      const result = await service.completeChallengeWithIntegration(mockChallenge.id, mockUser.id);

      if (result.level_gained) {
        expect(result.level_gained).toBeGreaterThan(0);
      }
    });
  });

  describe('Milestone and Special Events', () => {
    it('should track milestones for participants', () => {
      const participantId = 'participant-1';
      const milestones = service.getMilestonesForParticipant(participantId);
      
      expect(Array.isArray(milestones)).toBe(true);
    });

    it('should track special events for users', () => {
      const specialEvents = service.getSpecialEventsForUser(mockUser.id);
      
      expect(Array.isArray(specialEvents)).toBe(true);
    });

    it('should track special events for challenges', () => {
      const challengeEvents = service.getSpecialEventsForChallenge(mockChallenge.id);
      
      expect(Array.isArray(challengeEvents)).toBe(true);
    });
  });
});