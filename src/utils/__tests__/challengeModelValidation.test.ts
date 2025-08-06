import { describe, it, expect } from 'vitest';
import { ChallengeValidator, ChallengeValidationUtils } from '../challengeModelValidation';
import { 
  Challenge, 
  ChallengeParticipant, 
  ChallengeRequirement, 
  ChallengeReward,
  ChallengeProgressRecord 
} from '../../types/challengeModels';

describe('ChallengeValidator', () => {
  describe('validateChallenge', () => {
    it('should validate a complete valid challenge', () => {
      const validChallenge: Partial<Challenge> = {
        name: 'Test Challenge',
        description: 'A test challenge for validation',
        type: 'individual',
        category: 'strength',
        difficulty: 'intermediate',
        difficulty_level: 5,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        requirements: [
          {
            id: 'req1',
            challenge_id: 'challenge1',
            name: 'Test Requirement',
            description: 'A test requirement',
            type: 'exercise_reps',
            target_value: 100,
            operator: 'greater_equal',
            unit: 'reps',
            weight: 1.0,
            is_mandatory: true,
            allows_partial_credit: true,
            verification_required: false
          }
        ],
        rewards: [
          {
            id: 'reward1',
            challenge_id: 'challenge1',
            name: 'Test Reward',
            description: 'A test reward',
            type: 'xp',
            value: 500,
            unlock_condition: 'completion',
            is_unique: false,
            is_transferable: false,
            rarity: 'common'
          }
        ]
      };

      const result = ChallengeValidator.validateChallenge(validChallenge);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const invalidChallenge: Partial<Challenge> = {
        description: 'Missing name and other required fields'
      };

      const result = ChallengeValidator.validateChallenge(invalidChallenge);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should fail validation for invalid date range', () => {
      const invalidChallenge: Partial<Challenge> = {
        name: 'Test Challenge',
        description: 'Test description',
        type: 'individual',
        category: 'strength',
        difficulty: 'intermediate',
        start_date: new Date('2024-01-31'),
        end_date: new Date('2024-01-01'), // End before start
        requirements: []
      };

      const result = ChallengeValidator.validateChallenge(invalidChallenge);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_DATE_RANGE')).toBe(true);
    });

    it('should warn about very short challenges', () => {
      const shortChallenge: Partial<Challenge> = {
        name: 'Short Challenge',
        description: 'Very short challenge',
        type: 'individual',
        category: 'strength',
        difficulty: 'intermediate',
        start_date: new Date('2024-01-01T00:00:00'),
        end_date: new Date('2024-01-01T12:00:00'), // 12 hours
        requirements: [
          {
            id: 'req1',
            challenge_id: 'challenge1',
            name: 'Test Requirement',
            description: 'A test requirement',
            type: 'exercise_reps',
            target_value: 100,
            operator: 'greater_equal',
            unit: 'reps',
            weight: 1.0,
            is_mandatory: true,
            allows_partial_credit: true,
            verification_required: false
          }
        ]
      };

      const result = ChallengeValidator.validateChallenge(shortChallenge);
      expect(result.warnings.some(w => w.field === 'duration')).toBe(true);
    });
  });

  describe('validateRequirement', () => {
    it('should validate a complete valid requirement', () => {
      const validRequirement: Partial<ChallengeRequirement> = {
        name: 'Test Requirement',
        description: 'A test requirement',
        type: 'exercise_reps',
        target_value: 100,
        operator: 'greater_equal',
        unit: 'reps',
        weight: 0.5,
        is_mandatory: true,
        allows_partial_credit: true,
        verification_required: false
      };

      const result = ChallengeValidator.validateRequirement(validRequirement);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for invalid weight', () => {
      const invalidRequirement: Partial<ChallengeRequirement> = {
        name: 'Test Requirement',
        type: 'exercise_reps',
        target_value: 100,
        weight: 1.5 // Invalid weight > 1
      };

      const result = ChallengeValidator.validateRequirement(invalidRequirement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'OUT_OF_RANGE')).toBe(true);
    });

    it('should fail validation for zero or negative target value', () => {
      const invalidRequirement: Partial<ChallengeRequirement> = {
        name: 'Test Requirement',
        type: 'exercise_reps',
        target_value: 0,
        weight: 0.5
      };

      const result = ChallengeValidator.validateRequirement(invalidRequirement);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MIN_VALUE')).toBe(true);
    });
  });

  describe('validateReward', () => {
    it('should validate a complete valid reward', () => {
      const validReward: Partial<ChallengeReward> = {
        name: 'Test Reward',
        description: 'A test reward',
        type: 'xp',
        value: 500,
        unlock_condition: 'completion',
        is_unique: false,
        is_transferable: false,
        rarity: 'common'
      };

      const result = ChallengeValidator.validateReward(validReward);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for zero XP reward', () => {
      const invalidReward: Partial<ChallengeReward> = {
        name: 'Test Reward',
        type: 'xp',
        value: 0 // Invalid XP amount
      };

      const result = ChallengeValidator.validateReward(invalidReward);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MIN_VALUE')).toBe(true);
    });

    it('should warn about very high XP rewards', () => {
      const highXPReward: Partial<ChallengeReward> = {
        name: 'High XP Reward',
        type: 'xp',
        value: 15000 // Very high XP
      };

      const result = ChallengeValidator.validateReward(highXPReward);
      expect(result.warnings.some(w => w.message.includes('very high'))).toBe(true);
    });
  });

  describe('validateParticipant', () => {
    it('should validate a complete valid participant', () => {
      const validParticipant: Partial<ChallengeParticipant> = {
        challenge_id: 'challenge1',
        user_id: 'user1',
        progress: 50,
        current_score: 75,
        rank: 5
      };

      const result = ChallengeValidator.validateParticipant(validParticipant);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for invalid progress percentage', () => {
      const invalidParticipant: Partial<ChallengeParticipant> = {
        challenge_id: 'challenge1',
        user_id: 'user1',
        progress: 150 // Invalid progress > 100
      };

      const result = ChallengeValidator.validateParticipant(invalidParticipant);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'OUT_OF_RANGE')).toBe(true);
    });

    it('should fail validation for negative score', () => {
      const invalidParticipant: Partial<ChallengeParticipant> = {
        challenge_id: 'challenge1',
        user_id: 'user1',
        current_score: -10 // Negative score
      };

      const result = ChallengeValidator.validateParticipant(invalidParticipant);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'MIN_VALUE')).toBe(true);
    });
  });

  describe('validateProgressRecord', () => {
    it('should validate a complete valid progress record', () => {
      const validRecord: Partial<ChallengeProgressRecord> = {
        participant_id: 'participant1',
        requirement_id: 'requirement1',
        current_value: 75,
        target_value: 100,
        percentage_complete: 75
      };

      const result = ChallengeValidator.validateProgressRecord(validRecord);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const invalidRecord: Partial<ChallengeProgressRecord> = {
        current_value: 75
        // Missing participant_id and requirement_id
      };

      const result = ChallengeValidator.validateProgressRecord(invalidRecord);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'participant_id')).toBe(true);
      expect(result.errors.some(e => e.field === 'requirement_id')).toBe(true);
    });
  });
});

describe('ChallengeValidationUtils', () => {
  describe('isChallengeActive', () => {
    it('should return true for active challenge within date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const activeChallenge: Challenge = {
        id: 'challenge1',
        name: 'Active Challenge',
        description: 'Test challenge',
        type: 'individual',
        category: 'strength',
        difficulty: 'intermediate',
        difficulty_level: 5,
        start_date: yesterday,
        end_date: tomorrow,
        duration_days: 2,
        status: 'active',
        requirements: [],
        rules: [],
        scoring_method: { type: 'points', description: 'Test scoring' },
        current_participants: 0,
        is_public: true,
        requires_approval: false,
        rewards: [],
        created_by: 'system',
        created_at: now,
        updated_at: now,
        tags: [],
        is_featured: false,
        is_special_event: false,
        allow_comments: true,
        allow_sharing: true,
        leaderboard_visible: true
      };

      const result = ChallengeValidationUtils.isChallengeActive(activeChallenge);
      expect(result).toBe(true);
    });

    it('should return false for inactive challenge', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const inactiveChallenge: Challenge = {
        id: 'challenge1',
        name: 'Inactive Challenge',
        description: 'Test challenge',
        type: 'individual',
        category: 'strength',
        difficulty: 'intermediate',
        difficulty_level: 5,
        start_date: yesterday,
        end_date: tomorrow,
        duration_days: 2,
        status: 'completed', // Not active
        requirements: [],
        rules: [],
        scoring_method: { type: 'points', description: 'Test scoring' },
        current_participants: 0,
        is_public: true,
        requires_approval: false,
        rewards: [],
        created_by: 'system',
        created_at: now,
        updated_at: now,
        tags: [],
        is_featured: false,
        is_special_event: false,
        allow_comments: true,
        allow_sharing: true,
        leaderboard_visible: true
      };

      const result = ChallengeValidationUtils.isChallengeActive(inactiveChallenge);
      expect(result).toBe(false);
    });
  });

  describe('canUserJoinChallenge', () => {
    const mockChallenge: Challenge = {
      id: 'challenge1',
      name: 'Test Challenge',
      description: 'Test challenge',
      type: 'individual',
      category: 'strength',
      difficulty: 'intermediate',
      difficulty_level: 5,
      start_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      duration_days: 2,
      status: 'active',
      requirements: [],
      rules: [],
      scoring_method: { type: 'points', description: 'Test scoring' },
      current_participants: 0,
      max_participants: 10,
      is_public: true,
      requires_approval: false,
      rewards: [],
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date(),
      tags: [],
      is_featured: false,
      is_special_event: false,
      allow_comments: true,
      allow_sharing: true,
      leaderboard_visible: true
    };

    it('should allow user to join active challenge', () => {
      const result = ChallengeValidationUtils.canUserJoinChallenge(
        mockChallenge,
        'user1',
        []
      );
      expect(result.isValid).toBe(true);
    });

    it('should prevent user from joining if already participating', () => {
      const existingParticipants: ChallengeParticipant[] = [
        {
          id: 'participant1',
          challenge_id: 'challenge1',
          user_id: 'user1',
          joined_at: new Date(),
          status: 'active',
          progress: 0,
          current_score: 0,
          max_possible_score: 100,
          rank: 0,
          percentile: 0,
          requirements_completed: 0,
          requirements_total: 0,
          is_completed: false,
          is_public: true,
          allow_messages: true,
          last_activity_at: new Date()
        }
      ];

      const result = ChallengeValidationUtils.canUserJoinChallenge(
        mockChallenge,
        'user1',
        existingParticipants
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'ALREADY_PARTICIPATING')).toBe(true);
    });
  });
});