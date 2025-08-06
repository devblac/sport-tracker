/**
 * Challenge Model Validation - Validation utilities for challenge data structures
 * Implements task 14.1 - Sistema de requirements y validación
 */

import {
  Challenge,
  ChallengeParticipant,
  ChallengeRequirement,
  ChallengeRule,
  ChallengeReward,
  ChallengeTeam,
  ChallengeProgressRecord,
  ChallengeType,
  ChallengeCategory,
  ChallengeDifficulty,
  RequirementType,
  RewardType
} from '../types/challengeModels';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Challenge validation
export class ChallengeValidator {
  
  /**
   * Validate a complete challenge object
   */
  static validateChallenge(challenge: Partial<Challenge>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields validation
    if (!challenge.name || challenge.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Challenge name is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (!challenge.description || challenge.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Challenge description is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    // Name length validation
    if (challenge.name && challenge.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Challenge name must be 100 characters or less',
        code: 'MAX_LENGTH',
        severity: 'error'
      });
    }

    if (challenge.name && challenge.name.length < 3) {
      errors.push({
        field: 'name',
        message: 'Challenge name must be at least 3 characters',
        code: 'MIN_LENGTH',
        severity: 'error'
      });
    }

    // Type validation
    if (!challenge.type) {
      errors.push({
        field: 'type',
        message: 'Challenge type is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    } else if (!this.isValidChallengeType(challenge.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid challenge type',
        code: 'INVALID_VALUE',
        severity: 'error'
      });
    }

    // Category validation
    if (!challenge.category) {
      errors.push({
        field: 'category',
        message: 'Challenge category is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    } else if (!this.isValidChallengeCategory(challenge.category)) {
      errors.push({
        field: 'category',
        message: 'Invalid challenge category',
        code: 'INVALID_VALUE',
        severity: 'error'
      });
    }

    // Difficulty validation
    if (!challenge.difficulty) {
      errors.push({
        field: 'difficulty',
        message: 'Challenge difficulty is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    } else if (!this.isValidChallengeDifficulty(challenge.difficulty)) {
      errors.push({
        field: 'difficulty',
        message: 'Invalid challenge difficulty',
        code: 'INVALID_VALUE',
        severity: 'error'
      });
    }

    // Difficulty level validation
    if (challenge.difficulty_level !== undefined) {
      if (challenge.difficulty_level < 1 || challenge.difficulty_level > 10) {
        errors.push({
          field: 'difficulty_level',
          message: 'Difficulty level must be between 1 and 10',
          code: 'OUT_OF_RANGE',
          severity: 'error'
        });
      }
    }

    // Date validation
    if (!challenge.start_date) {
      errors.push({
        field: 'start_date',
        message: 'Start date is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (!challenge.end_date) {
      errors.push({
        field: 'end_date',
        message: 'End date is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (challenge.start_date && challenge.end_date) {
      if (challenge.end_date <= challenge.start_date) {
        errors.push({
          field: 'end_date',
          message: 'End date must be after start date',
          code: 'INVALID_DATE_RANGE',
          severity: 'error'
        });
      }

      // Check if challenge is too short
      const durationMs = challenge.end_date.getTime() - challenge.start_date.getTime();
      const durationDays = durationMs / (1000 * 60 * 60 * 24);
      
      if (durationDays < 1) {
        warnings.push({
          field: 'duration',
          message: 'Challenge duration is less than 1 day',
          suggestion: 'Consider extending the challenge duration for better engagement'
        });
      }

      if (durationDays > 365) {
        warnings.push({
          field: 'duration',
          message: 'Challenge duration is more than 1 year',
          suggestion: 'Very long challenges may have lower completion rates'
        });
      }
    }

    // Participant limits validation
    if (challenge.max_participants !== undefined && challenge.max_participants < 1) {
      errors.push({
        field: 'max_participants',
        message: 'Maximum participants must be at least 1',
        code: 'MIN_VALUE',
        severity: 'error'
      });
    }

    if (challenge.min_participants !== undefined && challenge.min_participants < 1) {
      errors.push({
        field: 'min_participants',
        message: 'Minimum participants must be at least 1',
        code: 'MIN_VALUE',
        severity: 'error'
      });
    }

    if (challenge.min_participants && challenge.max_participants) {
      if (challenge.min_participants > challenge.max_participants) {
        errors.push({
          field: 'min_participants',
          message: 'Minimum participants cannot exceed maximum participants',
          code: 'INVALID_RANGE',
          severity: 'error'
        });
      }
    }

    // Team size validation for group challenges
    if (challenge.type === 'team' || challenge.type === 'group') {
      if (!challenge.team_size || challenge.team_size < 2) {
        errors.push({
          field: 'team_size',
          message: 'Team challenges must have team size of at least 2',
          code: 'MIN_VALUE',
          severity: 'error'
        });
      }
    }

    // Requirements validation
    if (!challenge.requirements || challenge.requirements.length === 0) {
      errors.push({
        field: 'requirements',
        message: 'Challenge must have at least one requirement',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    } else {
      challenge.requirements.forEach((req, index) => {
        const reqValidation = this.validateRequirement(req);
        reqValidation.errors.forEach(error => {
          errors.push({
            ...error,
            field: `requirements[${index}].${error.field}`
          });
        });
      });
    }

    // Rewards validation
    if (challenge.rewards && challenge.rewards.length > 0) {
      challenge.rewards.forEach((reward, index) => {
        const rewardValidation = this.validateReward(reward);
        rewardValidation.errors.forEach(error => {
          errors.push({
            ...error,
            field: `rewards[${index}].${error.field}`
          });
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a challenge requirement
   */
  static validateRequirement(requirement: Partial<ChallengeRequirement>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!requirement.name || requirement.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Requirement name is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (!requirement.type) {
      errors.push({
        field: 'type',
        message: 'Requirement type is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    } else if (!this.isValidRequirementType(requirement.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid requirement type',
        code: 'INVALID_VALUE',
        severity: 'error'
      });
    }

    if (requirement.target_value === undefined || requirement.target_value === null) {
      errors.push({
        field: 'target_value',
        message: 'Target value is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    } else if (requirement.target_value <= 0) {
      errors.push({
        field: 'target_value',
        message: 'Target value must be greater than 0',
        code: 'MIN_VALUE',
        severity: 'error'
      });
    }

    // Weight validation
    if (requirement.weight === undefined || requirement.weight === null) {
      errors.push({
        field: 'weight',
        message: 'Requirement weight is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    } else if (requirement.weight < 0 || requirement.weight > 1) {
      errors.push({
        field: 'weight',
        message: 'Requirement weight must be between 0 and 1',
        code: 'OUT_OF_RANGE',
        severity: 'error'
      });
    }

    // Exercise-specific validation
    if (requirement.type?.startsWith('exercise_') && !requirement.exercise_id) {
      warnings.push({
        field: 'exercise_id',
        message: 'Exercise ID recommended for exercise-based requirements',
        suggestion: 'Specify an exercise ID for better tracking'
      });
    }

    // Min/max value validation
    if (requirement.min_value !== undefined && requirement.max_value !== undefined) {
      if (requirement.min_value >= requirement.max_value) {
        errors.push({
          field: 'min_value',
          message: 'Minimum value must be less than maximum value',
          code: 'INVALID_RANGE',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a challenge reward
   */
  static validateReward(reward: Partial<ChallengeReward>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!reward.name || reward.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Reward name is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (!reward.type) {
      errors.push({
        field: 'type',
        message: 'Reward type is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    } else if (!this.isValidRewardType(reward.type)) {
      errors.push({
        field: 'type',
        message: 'Invalid reward type',
        code: 'INVALID_VALUE',
        severity: 'error'
      });
    }

    if (!reward.value) {
      errors.push({
        field: 'value',
        message: 'Reward value is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    // XP reward validation
    if (reward.type === 'xp' && typeof reward.value === 'number') {
      if (reward.value <= 0) {
        errors.push({
          field: 'value',
          message: 'XP reward must be greater than 0',
          code: 'MIN_VALUE',
          severity: 'error'
        });
      }

      if (reward.value > 10000) {
        warnings.push({
          field: 'value',
          message: 'XP reward is very high',
          suggestion: 'Consider if this XP amount is balanced with other rewards'
        });
      }
    }

    // Rank requirement validation
    if (reward.rank_requirement !== undefined && reward.rank_requirement < 1) {
      errors.push({
        field: 'rank_requirement',
        message: 'Rank requirement must be at least 1',
        code: 'MIN_VALUE',
        severity: 'error'
      });
    }

    // Percentage requirement validation
    if (reward.percentage_requirement !== undefined) {
      if (reward.percentage_requirement < 0 || reward.percentage_requirement > 100) {
        errors.push({
          field: 'percentage_requirement',
          message: 'Percentage requirement must be between 0 and 100',
          code: 'OUT_OF_RANGE',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a challenge participant
   */
  static validateParticipant(participant: Partial<ChallengeParticipant>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!participant.challenge_id) {
      errors.push({
        field: 'challenge_id',
        message: 'Challenge ID is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (!participant.user_id) {
      errors.push({
        field: 'user_id',
        message: 'User ID is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    // Progress validation
    if (participant.progress !== undefined) {
      if (participant.progress < 0 || participant.progress > 100) {
        errors.push({
          field: 'progress',
          message: 'Progress must be between 0 and 100',
          code: 'OUT_OF_RANGE',
          severity: 'error'
        });
      }
    }

    // Score validation
    if (participant.current_score !== undefined && participant.current_score < 0) {
      errors.push({
        field: 'current_score',
        message: 'Current score cannot be negative',
        code: 'MIN_VALUE',
        severity: 'error'
      });
    }

    // Rank validation
    if (participant.rank !== undefined && participant.rank < 1) {
      errors.push({
        field: 'rank',
        message: 'Rank must be at least 1',
        code: 'MIN_VALUE',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate progress record
   */
  static validateProgressRecord(record: Partial<ChallengeProgressRecord>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!record.participant_id) {
      errors.push({
        field: 'participant_id',
        message: 'Participant ID is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (!record.requirement_id) {
      errors.push({
        field: 'requirement_id',
        message: 'Requirement ID is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (record.current_value === undefined || record.current_value === null) {
      errors.push({
        field: 'current_value',
        message: 'Current value is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    if (record.target_value === undefined || record.target_value === null) {
      errors.push({
        field: 'target_value',
        message: 'Target value is required',
        code: 'REQUIRED_FIELD',
        severity: 'error'
      });
    }

    // Value validation
    if (record.current_value !== undefined && record.current_value < 0) {
      errors.push({
        field: 'current_value',
        message: 'Current value cannot be negative',
        code: 'MIN_VALUE',
        severity: 'error'
      });
    }

    if (record.target_value !== undefined && record.target_value <= 0) {
      errors.push({
        field: 'target_value',
        message: 'Target value must be greater than 0',
        code: 'MIN_VALUE',
        severity: 'error'
      });
    }

    // Percentage validation
    if (record.percentage_complete !== undefined) {
      if (record.percentage_complete < 0 || record.percentage_complete > 100) {
        errors.push({
          field: 'percentage_complete',
          message: 'Percentage complete must be between 0 and 100',
          code: 'OUT_OF_RANGE',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Type validation helpers
  private static isValidChallengeType(type: string): type is ChallengeType {
    return ['individual', 'group', 'global', 'team'].includes(type);
  }

  private static isValidChallengeCategory(category: string): category is ChallengeCategory {
    return ['strength', 'endurance', 'consistency', 'volume', 'technique', 'social'].includes(category);
  }

  private static isValidChallengeDifficulty(difficulty: string): difficulty is ChallengeDifficulty {
    return ['beginner', 'intermediate', 'advanced', 'expert', 'legendary'].includes(difficulty);
  }

  private static isValidRequirementType(type: string): type is RequirementType {
    return [
      'exercise_reps', 'exercise_weight', 'exercise_volume', 
      'workout_count', 'streak_days', 'time_duration', 'custom_metric'
    ].includes(type);
  }

  private static isValidRewardType(type: string): type is RewardType {
    return ['xp', 'badge', 'title', 'avatar_item', 'premium_feature', 'custom'].includes(type);
  }
}

// Utility functions for common validations
export const ChallengeValidationUtils = {
  /**
   * Check if a challenge is currently active
   */
  isChallengeActive(challenge: Challenge): boolean {
    const now = new Date();
    return challenge.status === 'active' && 
           challenge.start_date <= now && 
           challenge.end_date > now;
  },

  /**
   * Check if a user can join a challenge
   */
  canUserJoinChallenge(challenge: Challenge, userId: string, existingParticipants: ChallengeParticipant[]): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if challenge is active
    if (!this.isChallengeActive(challenge)) {
      errors.push({
        field: 'challenge',
        message: 'Challenge is not currently active',
        code: 'CHALLENGE_INACTIVE',
        severity: 'error'
      });
    }

    // Check if user is already participating
    const existingParticipant = existingParticipants.find(p => p.user_id === userId);
    if (existingParticipant) {
      errors.push({
        field: 'user',
        message: 'User is already participating in this challenge',
        code: 'ALREADY_PARTICIPATING',
        severity: 'error'
      });
    }

    // Check participant limits
    if (challenge.max_participants && existingParticipants.length >= challenge.max_participants) {
      errors.push({
        field: 'participants',
        message: 'Challenge has reached maximum participants',
        code: 'MAX_PARTICIPANTS_REACHED',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  },

  /**
   * Validate challenge completion
   */
  validateChallengeCompletion(challenge: Challenge, participant: ChallengeParticipant, progressRecords: ChallengeProgressRecord[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if all mandatory requirements are met
    const mandatoryRequirements = challenge.requirements.filter(req => req.is_mandatory);
    const completedMandatory = mandatoryRequirements.filter(req => {
      const progress = progressRecords.find(p => p.requirement_id === req.id);
      return progress && progress.percentage_complete >= 100;
    });

    if (completedMandatory.length < mandatoryRequirements.length) {
      errors.push({
        field: 'requirements',
        message: `${mandatoryRequirements.length - completedMandatory.length} mandatory requirements not completed`,
        code: 'MANDATORY_REQUIREMENTS_INCOMPLETE',
        severity: 'error'
      });
    }

    // Check minimum progress threshold
    if (participant.progress < 100) {
      warnings.push({
        field: 'progress',
        message: 'Challenge completion with less than 100% progress',
        suggestion: 'Consider completing more requirements for better rewards'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
};