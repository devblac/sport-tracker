/**
 * Challenge Factory - Utility functions for creating challenge instances
 * Implements task 14.1 - Challenge creation helpers and templates
 */

import {
  Challenge,
  ChallengeParticipant,
  ChallengeRequirement,
  ChallengeReward,
  ChallengeRule,
  ChallengeTeam,
  ChallengeType,
  ChallengeCategory,
  ChallengeDifficulty,
  RequirementType,
  ScoringMethod,
  ParticipantStatus
} from '../types/challengeModels';

// Challenge template interface
export interface ChallengeTemplate {
  name: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  duration_days: number;
  requirements: Omit<ChallengeRequirement, 'id' | 'challenge_id'>[];
  rewards: Omit<ChallengeReward, 'id' | 'challenge_id'>[];
  rules?: Omit<ChallengeRule, 'id' | 'challenge_id'>[];
  tags: string[];
}

export class ChallengeFactory {
  
  /**
   * Create a new challenge from a template
   */
  static createFromTemplate(
    template: ChallengeTemplate,
    options: {
      type: ChallengeType;
      startDate: Date;
      createdBy: string;
      maxParticipants?: number;
      isPublic?: boolean;
    }
  ): Challenge {
    const challengeId = this.generateId();
    const now = new Date();
    const endDate = new Date(options.startDate);
    endDate.setDate(endDate.getDate() + template.duration_days);

    const challenge: Challenge = {
      id: challengeId,
      name: template.name,
      description: template.description,
      short_description: this.generateShortDescription(template.description),
      
      // Classification
      type: options.type,
      category: template.category,
      difficulty: template.difficulty,
      difficulty_level: this.getDifficultyLevel(template.difficulty),
      
      // Timing
      start_date: options.startDate,
      end_date: endDate,
      duration_days: template.duration_days,
      
      // Requirements and scoring
      requirements: template.requirements.map(req => ({
        ...req,
        id: this.generateId(),
        challenge_id: challengeId
      })),
      rules: template.rules?.map(rule => ({
        ...rule,
        id: this.generateId(),
        challenge_id: challengeId
      })) || [],
      scoring_method: this.getDefaultScoringMethod(template.category),
      
      // Participation
      max_participants: options.maxParticipants,
      min_participants: options.type === 'team' ? 4 : 1,
      current_participants: 0,
      is_public: options.isPublic ?? true,
      requires_approval: false,
      
      // Rewards
      rewards: template.rewards.map(reward => ({
        ...reward,
        id: this.generateId(),
        challenge_id: challengeId
      })),
      
      // Metadata
      created_by: options.createdBy,
      created_at: now,
      updated_at: now,
      status: 'draft',
      
      // Visual and content
      tags: template.tags,
      
      // Special properties
      is_featured: false,
      is_special_event: false,
      
      // Team properties
      team_size: options.type === 'team' ? 4 : undefined,
      allow_team_creation: options.type === 'team',
      
      // Social features
      allow_comments: true,
      allow_sharing: true,
      leaderboard_visible: true
    };

    return challenge;
  }

  /**
   * Create a basic individual challenge
   */
  static createIndividualChallenge(options: {
    name: string;
    description: string;
    category: ChallengeCategory;
    difficulty: ChallengeDifficulty;
    startDate: Date;
    durationDays: number;
    createdBy: string;
    requirements: Partial<ChallengeRequirement>[];
  }): Challenge {
    const template: ChallengeTemplate = {
      name: options.name,
      description: options.description,
      category: options.category,
      difficulty: options.difficulty,
      duration_days: options.durationDays,
      requirements: options.requirements.map(req => ({
        name: req.name || 'Requirement',
        description: req.description || '',
        type: req.type || 'custom_metric',
        target_value: req.target_value || 1,
        operator: req.operator || 'greater_equal',
        unit: req.unit || 'count',
        weight: req.weight || 1,
        is_mandatory: req.is_mandatory ?? true,
        allows_partial_credit: req.allows_partial_credit ?? true,
        verification_required: req.verification_required ?? false
      })),
      rewards: this.getDefaultRewards(options.difficulty),
      tags: [options.category, options.difficulty]
    };

    return this.createFromTemplate(template, {
      type: 'individual',
      startDate: options.startDate,
      createdBy: options.createdBy,
      isPublic: true
    });
  }

  /**
   * Create a team challenge
   */
  static createTeamChallenge(options: {
    name: string;
    description: string;
    category: ChallengeCategory;
    difficulty: ChallengeDifficulty;
    startDate: Date;
    durationDays: number;
    teamSize: number;
    maxTeams: number;
    createdBy: string;
    requirements: Partial<ChallengeRequirement>[];
  }): Challenge {
    const challenge = this.createIndividualChallenge({
      name: options.name,
      description: options.description,
      category: options.category,
      difficulty: options.difficulty,
      startDate: options.startDate,
      durationDays: options.durationDays,
      createdBy: options.createdBy,
      requirements: options.requirements
    });

    // Modify for team challenge
    challenge.type = 'team';
    challenge.team_size = options.teamSize;
    challenge.max_participants = options.maxTeams * options.teamSize;
    challenge.min_participants = 2 * options.teamSize; // At least 2 teams
    challenge.allow_team_creation = true;
    challenge.scoring_method = this.getTeamScoringMethod();

    return challenge;
  }

  /**
   * Create a participant for a challenge
   */
  static createParticipant(options: {
    challengeId: string;
    userId: string;
    teamId?: string;
    teamRole?: 'member' | 'captain' | 'co_captain';
  }): ChallengeParticipant {
    return {
      id: this.generateId(),
      challenge_id: options.challengeId,
      user_id: options.userId,
      
      // Participation details
      joined_at: new Date(),
      status: 'active' as ParticipantStatus,
      
      // Progress tracking
      progress: 0,
      current_score: 0,
      max_possible_score: 100,
      
      // Performance metrics
      rank: 0,
      percentile: 0,
      
      // Completion tracking
      requirements_completed: 0,
      requirements_total: 0,
      is_completed: false,
      
      // Team information
      team_id: options.teamId,
      team_role: options.teamRole || 'member',
      
      // Social features
      is_public: true,
      allow_messages: true,
      
      // Metadata
      last_activity_at: new Date()
    };
  }

  /**
   * Create a challenge team
   */
  static createTeam(options: {
    challengeId: string;
    name: string;
    captainId: string;
    maxMembers: number;
    description?: string;
  }): ChallengeTeam {
    return {
      id: this.generateId(),
      challenge_id: options.challengeId,
      name: options.name,
      description: options.description,
      
      // Team composition
      captain_id: options.captainId,
      member_ids: [options.captainId],
      max_members: options.maxMembers,
      current_members: 1,
      
      // Team performance
      total_score: 0,
      average_score: 0,
      rank: 0,
      
      // Team settings
      is_public: true,
      requires_approval: false,
      allow_invites: true,
      
      // Metadata
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  // Predefined challenge templates
  static getStrengthChallengeTemplate(): ChallengeTemplate {
    return {
      name: "30-Day Strength Builder",
      description: "Build strength across major compound movements over 30 days. Perfect for intermediate lifters looking to push their limits.",
      category: 'strength',
      difficulty: 'intermediate',
      duration_days: 30,
      requirements: [
        {
          name: "Squat Progress",
          description: "Increase your squat 1RM by 10 lbs",
          type: 'exercise_weight',
          target_value: 10,
          operator: 'greater_equal',
          unit: 'lbs',
          exercise_name: 'Squat',
          weight: 0.3,
          is_mandatory: true,
          allows_partial_credit: true,
          verification_required: false
        },
        {
          name: "Bench Press Progress",
          description: "Increase your bench press 1RM by 5 lbs",
          type: 'exercise_weight',
          target_value: 5,
          operator: 'greater_equal',
          unit: 'lbs',
          exercise_name: 'Bench Press',
          weight: 0.3,
          is_mandatory: true,
          allows_partial_credit: true,
          verification_required: false
        },
        {
          name: "Deadlift Progress",
          description: "Increase your deadlift 1RM by 15 lbs",
          type: 'exercise_weight',
          target_value: 15,
          operator: 'greater_equal',
          unit: 'lbs',
          exercise_name: 'Deadlift',
          weight: 0.4,
          is_mandatory: true,
          allows_partial_credit: true,
          verification_required: false
        }
      ],
      rewards: [
        {
          name: "Strength Builder Badge",
          description: "Awarded for completing the strength challenge",
          type: 'badge',
          value: 'strength_builder',
          unlock_condition: 'completion',
          is_unique: false,
          is_transferable: false,
          rarity: 'uncommon'
        },
        {
          name: "Strength XP Bonus",
          description: "XP reward for strength gains",
          type: 'xp',
          value: 500,
          unlock_condition: 'completion',
          is_unique: false,
          is_transferable: false,
          rarity: 'common'
        }
      ],
      tags: ['strength', 'powerlifting', '30-day', 'intermediate']
    };
  }

  static getConsistencyChallengeTemplate(): ChallengeTemplate {
    return {
      name: "21-Day Consistency Challenge",
      description: "Build the habit of consistent training. Work out at least 4 times per week for 3 weeks straight.",
      category: 'consistency',
      difficulty: 'beginner',
      duration_days: 21,
      requirements: [
        {
          name: "Weekly Workout Frequency",
          description: "Complete at least 4 workouts per week",
          type: 'workout_count',
          target_value: 12, // 4 workouts × 3 weeks
          operator: 'greater_equal',
          unit: 'workouts',
          frequency: 'total',
          weight: 0.7,
          is_mandatory: true,
          allows_partial_credit: true,
          verification_required: false
        },
        {
          name: "Streak Maintenance",
          description: "Maintain at least a 7-day workout streak",
          type: 'streak_days',
          target_value: 7,
          operator: 'greater_equal',
          unit: 'days',
          weight: 0.3,
          is_mandatory: false,
          allows_partial_credit: false,
          verification_required: false
        }
      ],
      rewards: [
        {
          name: "Consistency Champion",
          description: "Badge for completing the consistency challenge",
          type: 'badge',
          value: 'consistency_champion',
          unlock_condition: 'completion',
          is_unique: false,
          is_transferable: false,
          rarity: 'common'
        },
        {
          name: "Habit Builder XP",
          description: "XP for building consistent habits",
          type: 'xp',
          value: 300,
          unlock_condition: 'completion',
          is_unique: false,
          is_transferable: false,
          rarity: 'common'
        }
      ],
      tags: ['consistency', 'habit', '21-day', 'beginner']
    };
  }

  static getVolumeChallengeTemplate(): ChallengeTemplate {
    return {
      name: "Volume Crusher - 1 Million Pounds",
      description: "Lift a total of 1 million pounds across all exercises in 60 days. A true test of dedication and volume capacity.",
      category: 'volume',
      difficulty: 'advanced',
      duration_days: 60,
      requirements: [
        {
          name: "Total Volume Lifted",
          description: "Lift a combined total of 1,000,000 pounds",
          type: 'exercise_volume',
          target_value: 1000000,
          operator: 'greater_equal',
          unit: 'lbs',
          weight: 1.0,
          is_mandatory: true,
          allows_partial_credit: true,
          verification_required: false
        }
      ],
      rewards: [
        {
          name: "Volume Crusher Title",
          description: "Exclusive title for volume masters",
          type: 'title',
          value: 'Volume Crusher',
          unlock_condition: 'completion',
          is_unique: false,
          is_transferable: false,
          rarity: 'epic'
        },
        {
          name: "Million Pound Club Badge",
          description: "Elite badge for joining the million pound club",
          type: 'badge',
          value: 'million_pound_club',
          unlock_condition: 'completion',
          is_unique: false,
          is_transferable: false,
          rarity: 'legendary'
        },
        {
          name: "Volume Master XP",
          description: "Massive XP reward for volume achievement",
          type: 'xp',
          value: 2000,
          unlock_condition: 'completion',
          is_unique: false,
          is_transferable: false,
          rarity: 'epic'
        }
      ],
      tags: ['volume', 'advanced', '60-day', 'elite']
    };
  }

  // Helper methods
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  private static generateShortDescription(description: string): string {
    return description.length > 100 ? description.substring(0, 97) + '...' : description;
  }

  private static getDifficultyLevel(difficulty: ChallengeDifficulty): number {
    const levels = {
      'beginner': 2,
      'intermediate': 4,
      'advanced': 6,
      'expert': 8,
      'legendary': 10
    };
    return levels[difficulty];
  }

  private static getDefaultScoringMethod(category: ChallengeCategory): ScoringMethod {
    switch (category) {
      case 'strength':
        return {
          type: 'points',
          description: 'Points based on weight increases and PRs',
          max_points: 100,
          point_calculation: 'weighted_average',
          ranking_factors: [
            { name: 'weight_increase', weight: 0.6, direction: 'descending' },
            { name: 'consistency', weight: 0.4, direction: 'descending' }
          ],
          tiebreaker_rules: [
            { priority: 1, factor: 'completion_time', direction: 'ascending' }
          ]
        };
      
      case 'consistency':
        return {
          type: 'percentage',
          description: 'Percentage of required workouts completed',
          percentage_of_target: true,
          ranking_factors: [
            { name: 'completion_percentage', weight: 0.8, direction: 'descending' },
            { name: 'streak_length', weight: 0.2, direction: 'descending' }
          ],
          tiebreaker_rules: [
            { priority: 1, factor: 'streak_length', direction: 'descending' }
          ]
        };
      
      case 'volume':
        return {
          type: 'points',
          description: 'Points based on total volume lifted',
          max_points: 100,
          point_calculation: 'sum',
          ranking_factors: [
            { name: 'total_volume', weight: 1.0, direction: 'descending' }
          ],
          tiebreaker_rules: [
            { priority: 1, factor: 'completion_time', direction: 'ascending' }
          ]
        };
      
      default:
        return {
          type: 'points',
          description: 'Standard points-based scoring',
          max_points: 100,
          point_calculation: 'weighted_average',
          ranking_factors: [
            { name: 'completion_percentage', weight: 1.0, direction: 'descending' }
          ],
          tiebreaker_rules: [
            { priority: 1, factor: 'completion_time', direction: 'ascending' }
          ]
        };
    }
  }

  private static getTeamScoringMethod(): ScoringMethod {
    return {
      type: 'points',
      description: 'Team scoring based on combined member performance',
      max_points: 100,
      point_calculation: 'average',
      ranking_factors: [
        { name: 'team_average_score', weight: 0.7, direction: 'descending' },
        { name: 'team_completion_rate', weight: 0.3, direction: 'descending' }
      ],
      tiebreaker_rules: [
        { priority: 1, factor: 'team_completion_time', direction: 'ascending' },
        { priority: 2, factor: 'team_size', direction: 'descending' }
      ]
    };
  }

  private static getDefaultRewards(difficulty: ChallengeDifficulty): Omit<ChallengeReward, 'id' | 'challenge_id'>[] {
    const baseXP = {
      'beginner': 200,
      'intermediate': 400,
      'advanced': 800,
      'expert': 1200,
      'legendary': 2000
    }[difficulty];

    return [
      {
        name: "Challenge Completion XP",
        description: `XP reward for completing ${difficulty} challenge`,
        type: 'xp',
        value: baseXP,
        unlock_condition: 'completion',
        is_unique: false,
        is_transferable: false,
        rarity: 'common'
      },
      {
        name: "Winner's Bonus XP",
        description: "Extra XP for first place finish",
        type: 'xp',
        value: Math.round(baseXP * 0.5),
        unlock_condition: 'winner',
        rank_requirement: 1,
        is_unique: false,
        is_transferable: false,
        rarity: 'uncommon'
      }
    ];
  }
}

// Export predefined templates for easy access
export const CHALLENGE_TEMPLATES = {
  STRENGTH_30_DAY: ChallengeFactory.getStrengthChallengeTemplate(),
  CONSISTENCY_21_DAY: ChallengeFactory.getConsistencyChallengeTemplate(),
  VOLUME_CRUSHER: ChallengeFactory.getVolumeChallengeTemplate()
};