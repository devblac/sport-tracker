/**
 * Sample Challenge Data - For testing and development
 * Implements requirement 12 - Sistema de Challenges y Competencias
 */

import { Challenge, ChallengeParticipant, ChallengeLeaderboardEntry } from '@/types/challenges';

export const sampleChallenges: Challenge[] = [
  {
    id: 'challenge_1',
    name: '30-Day Consistency Challenge',
    description: 'Complete at least 20 workouts in 30 days to build a strong fitness habit.',
    type: 'group',
    category: 'consistency',
    start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
    end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // Ends in 25 days
    requirements: [
      {
        id: 'req_1',
        type: 'workout_count',
        target_value: 20,
        target_unit: 'workouts',
        timeframe: 'total',
        description: 'Complete 20 workouts in 30 days'
      }
    ],
    rewards: [
      {
        id: 'reward_1',
        type: 'xp',
        value: 500,
        description: 'Consistency Master',
        rarity: 'rare',
        unlock_condition: 'completion'
      },
      {
        id: 'reward_2',
        type: 'badge',
        value: 'consistency_champion',
        description: 'Consistency Champion Badge',
        rarity: 'epic',
        unlock_condition: 'top_3'
      }
    ],
    participants_count: 47,
    max_participants: 100,
    created_by: 'system',
    is_active: true,
    difficulty_level: 3,
    tags: ['consistency', 'habit-building', 'beginner-friendly'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'challenge_2',
    name: 'Strength Showdown',
    description: 'Push your limits! Increase your total lifting volume by 25% over 2 weeks.',
    type: 'group',
    category: 'strength',
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Starts in 2 days
    end_date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // Ends in 16 days
    requirements: [
      {
        id: 'req_2',
        type: 'total_volume',
        target_value: 25,
        target_unit: '%',
        timeframe: 'total',
        description: 'Increase total lifting volume by 25%'
      }
    ],
    rewards: [
      {
        id: 'reward_3',
        type: 'xp',
        value: 750,
        description: 'Strength Warrior',
        rarity: 'epic',
        unlock_condition: 'completion'
      },
      {
        id: 'reward_4',
        type: 'title',
        value: 'Iron Champion',
        description: 'Iron Champion Title',
        rarity: 'legendary',
        unlock_condition: 'winner'
      }
    ],
    participants_count: 23,
    max_participants: 50,
    created_by: 'trainer_alex',
    is_active: true,
    difficulty_level: 4,
    tags: ['strength', 'advanced', 'volume'],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: 'challenge_3',
    name: 'Weekend Warriors',
    description: 'Perfect for busy schedules! Complete 8 quality workouts over 4 weekends.',
    type: 'group',
    category: 'consistency',
    start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
    end_date: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000), // Ends in 26 days
    requirements: [
      {
        id: 'req_3',
        type: 'workout_count',
        target_value: 8,
        target_unit: 'workouts',
        timeframe: 'total',
        description: 'Complete 8 workouts on weekends only'
      }
    ],
    rewards: [
      {
        id: 'reward_5',
        type: 'xp',
        value: 400,
        description: 'Weekend Warrior',
        rarity: 'common',
        unlock_condition: 'completion'
      }
    ],
    participants_count: 89,
    max_participants: 150,
    created_by: 'community',
    is_active: true,
    difficulty_level: 2,
    tags: ['weekend', 'flexible', 'busy-schedule'],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'challenge_4',
    name: 'Squat Squad Challenge',
    description: 'Focus on squat mastery! Achieve a new 1RM or complete 1000 total squat reps.',
    type: 'group',
    category: 'strength',
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 1 week ago
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Ends in 2 weeks
    requirements: [
      {
        id: 'req_4',
        type: 'specific_exercise',
        target_value: 1000,
        target_unit: 'reps',
        timeframe: 'total',
        description: 'Complete 1000 squat reps total',
        exercise_id: 'squat_exercise'
      }
    ],
    rewards: [
      {
        id: 'reward_6',
        type: 'badge',
        value: 'squat_master',
        description: 'Squat Master Badge',
        rarity: 'rare',
        unlock_condition: 'completion'
      },
      {
        id: 'reward_7',
        type: 'xp',
        value: 600,
        description: 'Leg Day Legend',
        rarity: 'rare',
        unlock_condition: 'top_10'
      }
    ],
    participants_count: 34,
    max_participants: 75,
    created_by: 'trainer_sarah',
    is_active: true,
    difficulty_level: 3,
    tags: ['squats', 'legs', 'strength', 'technique'],
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 'challenge_5',
    name: 'New Year, New You',
    description: 'Start the year strong! Complete 15 workouts in January and build momentum.',
    type: 'global',
    category: 'consistency',
    start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Started 15 days ago
    end_date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // Ends in 16 days
    requirements: [
      {
        id: 'req_5',
        type: 'workout_count',
        target_value: 15,
        target_unit: 'workouts',
        timeframe: 'total',
        description: 'Complete 15 workouts in January'
      }
    ],
    rewards: [
      {
        id: 'reward_8',
        type: 'xp',
        value: 1000,
        description: 'New Year Champion',
        rarity: 'legendary',
        unlock_condition: 'completion'
      },
      {
        id: 'reward_9',
        type: 'title',
        value: 'Resolution Keeper',
        description: 'Resolution Keeper Title',
        rarity: 'epic',
        unlock_condition: 'top_10'
      }
    ],
    participants_count: 234,
    created_by: 'system',
    is_active: true,
    difficulty_level: 2,
    tags: ['new-year', 'resolution', 'motivation', 'global'],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
  }
];

export const sampleParticipants: Map<string, ChallengeParticipant> = new Map([
  ['challenge_1', {
    id: 'participant_1',
    challenge_id: 'challenge_1',
    user_id: 'current_user',
    progress: 65,
    current_value: 13,
    rank: 8,
    joined_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    is_completed: false
  }],
  ['challenge_3', {
    id: 'participant_3',
    challenge_id: 'challenge_3',
    user_id: 'current_user',
    progress: 37.5,
    current_value: 3,
    rank: 23,
    joined_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    last_activity: new Date(Date.now() - 4 * 60 * 60 * 1000),
    is_completed: false
  }],
  ['challenge_5', {
    id: 'participant_5',
    challenge_id: 'challenge_5',
    user_id: 'current_user',
    progress: 80,
    current_value: 12,
    rank: 45,
    joined_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    last_activity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    is_completed: false
  }]
]);

export const sampleLeaderboardEntries: ChallengeLeaderboardEntry[] = [
  {
    participant_id: 'participant_leader_1',
    user_id: 'user_alex',
    username: 'fitnessfan',
    display_name: 'Alex Johnson',
    avatar_url: undefined,
    rank: 1,
    score: 950,
    progress: 95,
    is_completed: false,
    last_activity: new Date(Date.now() - 30 * 60 * 1000),
    is_friend: true,
    is_following: false
  },
  {
    participant_id: 'participant_leader_2',
    user_id: 'user_maria',
    username: 'stronglifter',
    display_name: 'Maria Garcia',
    avatar_url: undefined,
    rank: 2,
    score: 920,
    progress: 92,
    is_completed: false,
    last_activity: new Date(Date.now() - 1 * 60 * 60 * 1000),
    is_friend: true,
    is_following: true
  },
  {
    participant_id: 'participant_leader_3',
    user_id: 'user_david',
    username: 'cardioking',
    display_name: 'David Chen',
    avatar_url: undefined,
    rank: 3,
    score: 890,
    progress: 89,
    is_completed: false,
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    is_friend: false,
    is_following: false
  },
  {
    participant_id: 'participant_leader_4',
    user_id: 'user_sarah',
    username: 'yogamaster',
    display_name: 'Sarah Wilson',
    avatar_url: undefined,
    rank: 4,
    score: 875,
    progress: 87.5,
    is_completed: false,
    last_activity: new Date(Date.now() - 3 * 60 * 60 * 1000),
    is_friend: false,
    is_following: true
  },
  {
    participant_id: 'participant_leader_5',
    user_id: 'user_mike',
    username: 'ironmike',
    display_name: 'Mike Thompson',
    avatar_url: undefined,
    rank: 5,
    score: 860,
    progress: 86,
    is_completed: false,
    last_activity: new Date(Date.now() - 4 * 60 * 60 * 1000),
    is_friend: true,
    is_following: false
  },
  {
    participant_id: 'participant_leader_6',
    user_id: 'user_lisa',
    username: 'runnerlife',
    display_name: 'Lisa Park',
    avatar_url: undefined,
    rank: 6,
    score: 845,
    progress: 84.5,
    is_completed: false,
    last_activity: new Date(Date.now() - 5 * 60 * 60 * 1000),
    is_friend: false,
    is_following: false
  },
  {
    participant_id: 'participant_leader_7',
    user_id: 'user_james',
    username: 'beastmode',
    display_name: 'James Rodriguez',
    avatar_url: undefined,
    rank: 7,
    score: 830,
    progress: 83,
    is_completed: false,
    last_activity: new Date(Date.now() - 6 * 60 * 60 * 1000),
    is_friend: true,
    is_following: true
  },
  {
    participant_id: 'participant_1',
    user_id: 'current_user',
    username: 'you',
    display_name: 'You',
    avatar_url: undefined,
    rank: 8,
    score: 815,
    progress: 65,
    is_completed: false,
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    is_friend: false,
    is_following: false
  },
  {
    participant_id: 'participant_leader_9',
    user_id: 'user_emma',
    username: 'crossfitqueen',
    display_name: 'Emma Davis',
    avatar_url: undefined,
    rank: 9,
    score: 800,
    progress: 80,
    is_completed: false,
    last_activity: new Date(Date.now() - 7 * 60 * 60 * 1000),
    is_friend: false,
    is_following: false
  },
  {
    participant_id: 'participant_leader_10',
    user_id: 'user_tom',
    username: 'powerlifter',
    display_name: 'Tom Anderson',
    avatar_url: undefined,
    rank: 10,
    score: 785,
    progress: 78.5,
    is_completed: false,
    last_activity: new Date(Date.now() - 8 * 60 * 60 * 1000),
    is_friend: true,
    is_following: false
  }
];