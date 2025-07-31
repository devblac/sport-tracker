// Challenge System Constants and Configuration
// Defines predefined challenges, templates, and system constants

import { 
  Challenge, 
  ChallengeRequirement, 
  ChallengeReward,
  CreateChallengeRequest 
} from '../types/challenges';

// XP rewards for different challenge activities
export const CHALLENGE_XP_REWARDS = {
  JOIN_CHALLENGE: 50,
  COMPLETE_REQUIREMENT: 100,
  COMPLETE_CHALLENGE: 500,
  WIN_CHALLENGE: 1000,
  TOP_3_FINISH: 750,
  TOP_10_FINISH: 250,
  PARTICIPATION_BONUS: 100
} as const;

// Challenge difficulty multipliers for XP
export const DIFFICULTY_MULTIPLIERS = {
  1: 1.0,   // Beginner
  2: 1.2,   // Easy
  3: 1.5,   // Medium
  4: 2.0,   // Hard
  5: 3.0    // Expert
} as const;

// Predefined challenge templates for quick creation
export const CHALLENGE_TEMPLATES: Omit<CreateChallengeRequest, 'start_date' | 'end_date'>[] = [
  {
    name: "7-Day Consistency Challenge",
    description: "Complete at least one workout every day for 7 consecutive days. Perfect for building a habit!",
    type: "individual",
    category: "consistency",
    difficulty_level: 2,
    requirements: [
      {
        type: "workout_count",
        target_value: 7,
        target_unit: "workouts",
        timeframe: "total",
        description: "Complete 7 workouts in 7 days"
      }
    ],
    rewards: [
      {
        type: "xp",
        value: 500,
        description: "500 XP for completing the challenge",
        rarity: "common",
        unlock_condition: "completion"
      },
      {
        type: "badge",
        value: "consistency_warrior",
        description: "Consistency Warrior badge",
        rarity: "rare",
        unlock_condition: "completion"
      }
    ],
    tags: ["beginner", "consistency", "weekly", "habit-building"]
  },

  {
    name: "Strength Beast Mode",
    description: "Lift a total of 10,000kg across all your workouts this month. Show your strength!",
    type: "individual",
    category: "strength",
    difficulty_level: 4,
    requirements: [
      {
        type: "total_volume",
        target_value: 10000,
        target_unit: "kg",
        timeframe: "total",
        description: "Lift 10,000kg total volume"
      }
    ],
    rewards: [
      {
        type: "xp",
        value: 2000,
        description: "2000 XP for incredible strength",
        rarity: "epic",
        unlock_condition: "completion"
      },
      {
        type: "title",
        value: "Strength Beast",
        description: "Exclusive 'Strength Beast' title",
        rarity: "epic",
        unlock_condition: "completion"
      }
    ],
    tags: ["advanced", "strength", "monthly", "volume"]
  },

  {
    name: "Squat Master Challenge",
    description: "Perform 1000 total squat reps this week. Focus on form and consistency!",
    type: "group",
    category: "strength",
    difficulty_level: 3,
    max_participants: 50,
    requirements: [
      {
        type: "specific_exercise",
        target_value: 1000,
        target_unit: "reps",
        timeframe: "total",
        exercise_id: "squat_barbell", // This would be actual exercise ID
        description: "Complete 1000 squat reps"
      }
    ],
    rewards: [
      {
        type: "xp",
        value: 1500,
        description: "1500 XP for squat mastery",
        rarity: "rare",
        unlock_condition: "completion"
      },
      {
        type: "badge",
        value: "squat_master",
        description: "Squat Master badge",
        rarity: "rare",
        unlock_condition: "completion"
      },
      {
        type: "premium_content",
        value: "advanced_squat_guide",
        description: "Advanced Squat Technique Guide",
        rarity: "epic",
        unlock_condition: "top_10"
      }
    ],
    tags: ["intermediate", "squats", "weekly", "technique"]
  },

  {
    name: "Gym Frequency Champion",
    description: "Train at least 4 times per week for 4 consecutive weeks. Build the ultimate routine!",
    type: "individual",
    category: "consistency",
    difficulty_level: 3,
    requirements: [
      {
        type: "frequency",
        target_value: 4,
        target_unit: "sessions_per_week",
        timeframe: "weekly",
        description: "Train 4+ times per week"
      }
    ],
    rewards: [
      {
        type: "xp",
        value: 1200,
        description: "1200 XP for consistent training",
        rarity: "rare",
        unlock_condition: "completion"
      },
      {
        type: "title",
        value: "Frequency Champion",
        description: "Frequency Champion title",
        rarity: "rare",
        unlock_condition: "completion"
      }
    ],
    tags: ["intermediate", "frequency", "monthly", "routine"]
  },

  {
    name: "New Year, New Gains",
    description: "Global challenge for January! Complete 20 workouts and lift 5000kg total. Join thousands of others!",
    type: "global",
    category: "volume",
    difficulty_level: 3,
    max_participants: 10000,
    requirements: [
      {
        type: "workout_count",
        target_value: 20,
        target_unit: "workouts",
        timeframe: "total",
        description: "Complete 20 workouts"
      },
      {
        type: "total_volume",
        target_value: 5000,
        target_unit: "kg",
        timeframe: "total",
        description: "Lift 5000kg total volume"
      }
    ],
    rewards: [
      {
        type: "xp",
        value: 1000,
        description: "1000 XP for participation",
        rarity: "common",
        unlock_condition: "participation"
      },
      {
        type: "xp",
        value: 2500,
        description: "2500 XP for completion",
        rarity: "rare",
        unlock_condition: "completion"
      },
      {
        type: "badge",
        value: "new_year_warrior",
        description: "New Year Warrior 2024 badge",
        rarity: "epic",
        unlock_condition: "completion"
      },
      {
        type: "title",
        value: "Global Champion",
        description: "Global Champion title",
        rarity: "legendary",
        unlock_condition: "top_3"
      },
      {
        type: "discount",
        value: 50,
        description: "50% off Premium subscription",
        rarity: "legendary",
        unlock_condition: "winner"
      }
    ],
    tags: ["global", "new-year", "monthly", "community"]
  },

  {
    name: "Perfect Week",
    description: "Complete your scheduled workouts perfectly for one week. No missed days!",
    type: "individual",
    category: "consistency",
    difficulty_level: 2,
    requirements: [
      {
        type: "streak_days",
        target_value: 7,
        target_unit: "days",
        timeframe: "total",
        description: "Maintain 7-day perfect streak"
      }
    ],
    rewards: [
      {
        type: "xp",
        value: 750,
        description: "750 XP for perfect consistency",
        rarity: "rare",
        unlock_condition: "completion"
      },
      {
        type: "badge",
        value: "perfectionist",
        description: "Perfectionist badge",
        rarity: "rare",
        unlock_condition: "completion"
      }
    ],
    tags: ["beginner", "streak", "weekly", "perfectionist"]
  }
];

// Challenge categories with descriptions and icons
export const CHALLENGE_CATEGORIES_INFO = {
  strength: {
    name: "Strength",
    description: "Challenges focused on lifting heavy and building raw power",
    icon: "💪",
    color: "#FF6B6B"
  },
  consistency: {
    name: "Consistency", 
    description: "Challenges about showing up regularly and building habits",
    icon: "🔥",
    color: "#4ECDC4"
  },
  volume: {
    name: "Volume",
    description: "Challenges about total work done - reps, sets, and weight moved",
    icon: "📊",
    color: "#45B7D1"
  },
  endurance: {
    name: "Endurance",
    description: "Challenges focused on stamina and long-term performance",
    icon: "⏱️",
    color: "#96CEB4"
  }
} as const;

// Challenge difficulty descriptions
export const DIFFICULTY_INFO = {
  1: {
    name: "Beginner",
    description: "Perfect for those just starting their fitness journey",
    color: "#95E1D3"
  },
  2: {
    name: "Easy",
    description: "Gentle challenges to build confidence",
    color: "#A8E6CF"
  },
  3: {
    name: "Medium", 
    description: "Balanced challenges for regular gym-goers",
    color: "#FFD93D"
  },
  4: {
    name: "Hard",
    description: "Serious challenges for dedicated athletes",
    color: "#FF8B94"
  },
  5: {
    name: "Expert",
    description: "Elite challenges for the most committed",
    color: "#FF6B6B"
  }
} as const;

// Reward rarity information
export const REWARD_RARITY_INFO = {
  common: {
    name: "Common",
    color: "#9E9E9E",
    glow: false
  },
  rare: {
    name: "Rare", 
    color: "#2196F3",
    glow: true
  },
  epic: {
    name: "Epic",
    color: "#9C27B0", 
    glow: true
  },
  legendary: {
    name: "Legendary",
    color: "#FF9800",
    glow: true
  }
} as const;

// Challenge status messages
export const CHALLENGE_STATUS_MESSAGES = {
  not_started: "Challenge hasn't started yet",
  active: "Challenge is active - join now!",
  ending_soon: "Challenge ends in less than 24 hours!",
  ended: "Challenge has ended",
  full: "Challenge is full",
  joined: "You're participating in this challenge",
  completed: "You've completed this challenge!"
} as const;

// Achievement milestones for challenges
export const CHALLENGE_MILESTONES = {
  FIRST_CHALLENGE_JOIN: {
    name: "Challenge Accepted",
    description: "Join your first challenge",
    xp: 100
  },
  FIRST_CHALLENGE_COMPLETE: {
    name: "Challenge Conqueror", 
    description: "Complete your first challenge",
    xp: 500
  },
  CHALLENGE_STREAK_3: {
    name: "Challenge Enthusiast",
    description: "Complete 3 challenges in a row",
    xp: 1000
  },
  CHALLENGE_STREAK_10: {
    name: "Challenge Master",
    description: "Complete 10 challenges in a row", 
    xp: 2500
  },
  CHALLENGE_WINNER: {
    name: "Champion",
    description: "Win your first challenge",
    xp: 1500
  },
  CHALLENGE_CREATOR: {
    name: "Challenge Creator",
    description: "Create your first custom challenge",
    xp: 750
  }
} as const;

// Default challenge durations by type
export const DEFAULT_CHALLENGE_DURATIONS = {
  individual: {
    min_days: 1,
    max_days: 90,
    recommended: 7
  },
  group: {
    min_days: 3,
    max_days: 30,
    recommended: 14
  },
  global: {
    min_days: 7,
    max_days: 365,
    recommended: 30
  }
} as const;

// Challenge notification templates
export const CHALLENGE_NOTIFICATION_TEMPLATES = {
  challenge_started: {
    title: "Challenge Started!",
    message: "Your challenge '{challengeName}' has begun. Good luck!"
  },
  progress_milestone: {
    title: "Great Progress!",
    message: "You're {progress}% through the '{challengeName}' challenge!"
  },
  rank_improved: {
    title: "Rank Up!",
    message: "You moved up to #{rank} in '{challengeName}'!"
  },
  challenge_ending: {
    title: "Challenge Ending Soon",
    message: "'{challengeName}' ends in {timeLeft}. Push for the finish!"
  },
  challenge_completed: {
    title: "Challenge Complete!",
    message: "Congratulations! You completed '{challengeName}' and earned {xp} XP!"
  }
} as const;