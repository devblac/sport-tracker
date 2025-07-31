/**
 * Streak Rewards Configuration
 * 
 * Predefined milestone rewards, titles, and shields for the streak system.
 */

import type { StreakRewardConfig, StreakMilestoneReward, StreakTitle, StreakShield } from '@/types/streakRewards';

// ============================================================================
// Milestone Rewards
// ============================================================================

export const STREAK_MILESTONE_REWARDS: StreakMilestoneReward[] = [
  // Week 1 - Getting Started
  {
    streakLength: 7,
    name: "Primera Semana",
    description: "¡Completaste tu primera semana de entrenamiento!",
    icon: "🎯",
    rarity: 'common',
    celebrationLevel: 'normal',
    isRepeatable: false,
    rewards: [
      {
        id: 'week1_xp',
        name: 'XP Bonus',
        description: '+100 XP por completar tu primera semana',
        icon: '⭐',
        rarity: 'common',
        type: 'xp',
        value: 100,
        createdAt: new Date()
      },
      {
        id: 'beginner_title',
        name: 'Principiante Dedicado',
        description: 'Título por completar la primera semana',
        icon: '🌱',
        rarity: 'common',
        type: 'title',
        value: 'Principiante Dedicado',
        createdAt: new Date()
      }
    ]
  },

  // Week 2 - Building Momentum
  {
    streakLength: 14,
    name: "Dos Semanas Fuertes",
    description: "Dos semanas consecutivas de entrenamiento. ¡El hábito se está formando!",
    icon: "💪",
    rarity: 'common',
    celebrationLevel: 'normal',
    isRepeatable: false,
    rewards: [
      {
        id: 'week2_xp',
        name: 'XP Bonus',
        description: '+200 XP por mantener la consistencia',
        icon: '⭐',
        rarity: 'common',
        type: 'xp',
        value: 200,
        createdAt: new Date()
      },
      {
        id: 'basic_shield',
        name: 'Escudo Básico',
        description: 'Protección de 1 día para tu racha',
        icon: '🛡️',
        rarity: 'common',
        type: 'shield',
        value: 'basic_protection',
        createdAt: new Date()
      }
    ]
  },

  // Month 1 - Habit Formation
  {
    streakLength: 30,
    name: "Primer Mes Completo",
    description: "¡Un mes entero de dedicación! El hábito está establecido.",
    icon: "🏆",
    rarity: 'uncommon',
    celebrationLevel: 'epic',
    isRepeatable: false,
    rewards: [
      {
        id: 'month1_xp',
        name: 'XP Bonus Épico',
        description: '+500 XP por completar tu primer mes',
        icon: '🌟',
        rarity: 'uncommon',
        type: 'xp',
        value: 500,
        createdAt: new Date()
      },
      {
        id: 'consistent_title',
        name: 'Atleta Consistente',
        description: 'Título por mantener un mes de entrenamiento',
        icon: '🎖️',
        rarity: 'uncommon',
        type: 'title',
        value: 'Atleta Consistente',
        createdAt: new Date()
      },
      {
        id: 'freeze_shield',
        name: 'Escudo de Congelación',
        description: 'Congela tu racha por 2 días',
        icon: '❄️',
        rarity: 'uncommon',
        type: 'shield',
        value: 'freeze_2days',
        createdAt: new Date()
      }
    ]
  },

  // 50 Days - Serious Commitment
  {
    streakLength: 50,
    name: "Compromiso Serio",
    description: "50 días de entrenamiento. Tu dedicación es admirable.",
    icon: "🔥",
    rarity: 'rare',
    celebrationLevel: 'epic',
    isRepeatable: false,
    requirements: {
      minWorkoutsPerWeek: 3,
      maxMissedDays: 5
    },
    rewards: [
      {
        id: 'day50_xp',
        name: 'XP Bonus Raro',
        description: '+750 XP por 50 días de dedicación',
        icon: '💎',
        rarity: 'rare',
        type: 'xp',
        value: 750,
        createdAt: new Date()
      },
      {
        id: 'dedicated_title',
        name: 'Guerrero Dedicado',
        description: 'Título por 50 días de entrenamiento',
        icon: '⚔️',
        rarity: 'rare',
        type: 'title',
        value: 'Guerrero Dedicado',
        createdAt: new Date()
      }
    ]
  },

  // 100 Days - Elite Status
  {
    streakLength: 100,
    name: "Centurión del Fitness",
    description: "100 días consecutivos. Has alcanzado el estatus élite.",
    icon: "👑",
    rarity: 'epic',
    celebrationLevel: 'legendary',
    isRepeatable: false,
    requirements: {
      minWorkoutsPerWeek: 4,
      maxMissedDays: 8,
      perfectWeeksRequired: 8
    },
    rewards: [
      {
        id: 'day100_xp',
        name: 'XP Bonus Épico',
        description: '+1500 XP por alcanzar 100 días',
        icon: '🏅',
        rarity: 'epic',
        type: 'xp',
        value: 1500,
        createdAt: new Date()
      },
      {
        id: 'centurion_title',
        name: 'Centurión del Fitness',
        description: 'Título élite por 100 días consecutivos',
        icon: '👑',
        rarity: 'epic',
        type: 'title',
        value: 'Centurión del Fitness',
        createdAt: new Date()
      },
      {
        id: 'golden_shield',
        name: 'Escudo Dorado',
        description: 'Protección premium de 5 días',
        icon: '🛡️✨',
        rarity: 'epic',
        type: 'shield',
        value: 'golden_protection',
        createdAt: new Date()
      }
    ]
  },

  // 200 Days - Legendary Achievement
  {
    streakLength: 200,
    name: "Leyenda Viviente",
    description: "200 días de entrenamiento. Eres una inspiración para todos.",
    icon: "🌟",
    rarity: 'legendary',
    celebrationLevel: 'legendary',
    isRepeatable: false,
    requirements: {
      minWorkoutsPerWeek: 4,
      maxMissedDays: 10,
      perfectWeeksRequired: 20
    },
    rewards: [
      {
        id: 'day200_xp',
        name: 'XP Bonus Legendario',
        description: '+3000 XP por 200 días de excelencia',
        icon: '🌟',
        rarity: 'legendary',
        type: 'xp',
        value: 3000,
        createdAt: new Date()
      },
      {
        id: 'legend_title',
        name: 'Leyenda del Fitness',
        description: 'Título legendario por dedicación excepcional',
        icon: '🌟',
        rarity: 'legendary',
        type: 'title',
        value: 'Leyenda del Fitness',
        createdAt: new Date()
      },
      {
        id: 'diamond_shield',
        name: 'Escudo de Diamante',
        description: 'Protección suprema de 7 días',
        icon: '💎🛡️',
        rarity: 'legendary',
        type: 'shield',
        value: 'diamond_protection',
        createdAt: new Date()
      }
    ]
  },

  // 365 Days - Mythic Achievement
  {
    streakLength: 365,
    name: "Maestro del Año",
    description: "Un año completo de entrenamiento. Has alcanzado la maestría absoluta.",
    icon: "🏛️",
    rarity: 'mythic',
    celebrationLevel: 'legendary',
    isRepeatable: true,
    requirements: {
      minWorkoutsPerWeek: 5,
      maxMissedDays: 15,
      perfectWeeksRequired: 40
    },
    rewards: [
      {
        id: 'year_xp',
        name: 'XP Bonus Mítico',
        description: '+5000 XP por un año de dedicación',
        icon: '🏛️',
        rarity: 'mythic',
        type: 'xp',
        value: 5000,
        createdAt: new Date()
      },
      {
        id: 'master_title',
        name: 'Maestro del Fitness',
        description: 'Título mítico por un año de entrenamiento',
        icon: '🏛️',
        rarity: 'mythic',
        type: 'title',
        value: 'Maestro del Fitness',
        createdAt: new Date()
      },
      {
        id: 'eternal_shield',
        name: 'Escudo Eterno',
        description: 'Protección mítica de 14 días',
        icon: '🏛️🛡️',
        rarity: 'mythic',
        type: 'shield',
        value: 'eternal_protection',
        createdAt: new Date()
      }
    ]
  }
];

// ============================================================================
// Streak Titles
// ============================================================================

export const STREAK_TITLES: Omit<StreakTitle, 'id' | 'isActive' | 'unlockedAt'>[] = [
  {
    name: 'Novato Motivado',
    description: 'Para quienes están comenzando su journey',
    icon: '🌱',
    rarity: 'common',
    requirements: {
      minStreakLength: 3,
      maxStreakLength: 13
    }
  },
  {
    name: 'Atleta en Desarrollo',
    description: 'Construyendo hábitos sólidos',
    icon: '💪',
    rarity: 'common',
    requirements: {
      minStreakLength: 14,
      maxStreakLength: 29
    }
  },
  {
    name: 'Guerrero Consistente',
    description: 'La consistencia es tu fortaleza',
    icon: '⚔️',
    rarity: 'uncommon',
    requirements: {
      minStreakLength: 30,
      maxStreakLength: 59,
      consistency: 85
    }
  },
  {
    name: 'Campeón Dedicado',
    description: 'Tu dedicación es inspiradora',
    icon: '🏆',
    rarity: 'rare',
    requirements: {
      minStreakLength: 60,
      maxStreakLength: 99,
      perfectWeeks: 8,
      consistency: 90
    }
  },
  {
    name: 'Leyenda Imparable',
    description: 'Nada puede detenerte',
    icon: '🌟',
    rarity: 'epic',
    requirements: {
      minStreakLength: 100,
      maxStreakLength: 199,
      perfectWeeks: 15,
      consistency: 95
    }
  },
  {
    name: 'Maestro Supremo',
    description: 'Has alcanzado la maestría absoluta',
    icon: '🏛️',
    rarity: 'legendary',
    requirements: {
      minStreakLength: 200,
      perfectWeeks: 25,
      consistency: 98
    }
  },
  {
    name: 'Dios del Fitness',
    description: 'Tu dedicación trasciende lo humano',
    icon: '⚡',
    rarity: 'mythic',
    requirements: {
      minStreakLength: 365,
      perfectWeeks: 45,
      consistency: 99,
      specialConditions: ['no_shields_used', 'perfect_year']
    }
  }
];

// ============================================================================
// Streak Shields
// ============================================================================

export const STREAK_SHIELDS: Omit<StreakShield, 'id' | 'usesRemaining' | 'isActive' | 'expiresAt' | 'createdAt'>[] = [
  {
    name: 'Escudo Básico',
    description: 'Protege tu racha por 1 día',
    icon: '🛡️',
    type: 'protection',
    duration: 1,
    uses: 1,
    requirements: {
      minStreakLength: 14,
      earnedThrough: 'milestone'
    }
  },
  {
    name: 'Escudo de Congelación',
    description: 'Congela tu racha por 2 días',
    icon: '❄️',
    type: 'freeze',
    duration: 2,
    uses: 1,
    requirements: {
      minStreakLength: 30,
      earnedThrough: 'milestone'
    }
  },
  {
    name: 'Escudo de Compensación',
    description: 'Permite compensar días perdidos',
    icon: '⏰',
    type: 'compensation',
    duration: 3,
    uses: 2,
    requirements: {
      minStreakLength: 45,
      earnedThrough: 'achievement'
    }
  },
  {
    name: 'Escudo Dorado',
    description: 'Protección premium por 5 días',
    icon: '🛡️✨',
    type: 'protection',
    duration: 5,
    uses: 1,
    requirements: {
      minStreakLength: 100,
      earnedThrough: 'milestone'
    }
  },
  {
    name: 'Escudo de Gracia',
    description: 'Período de gracia extendido',
    icon: '🕊️',
    type: 'grace',
    duration: 7,
    uses: 1,
    requirements: {
      minStreakLength: 150,
      earnedThrough: 'achievement'
    }
  },
  {
    name: 'Escudo de Diamante',
    description: 'Protección suprema por 7 días',
    icon: '💎🛡️',
    type: 'protection',
    duration: 7,
    uses: 1,
    requirements: {
      minStreakLength: 200,
      earnedThrough: 'milestone'
    }
  },
  {
    name: 'Escudo Eterno',
    description: 'Protección mítica por 14 días',
    icon: '🏛️🛡️',
    type: 'protection',
    duration: 14,
    uses: 1,
    requirements: {
      minStreakLength: 365,
      earnedThrough: 'milestone'
    }
  }
];

// ============================================================================
// XP Multipliers by Streak Length
// ============================================================================

export const STREAK_XP_MULTIPLIERS: { [streakLength: number]: number } = {
  7: 1.1,    // +10% XP after 1 week
  14: 1.15,  // +15% XP after 2 weeks
  30: 1.25,  // +25% XP after 1 month
  50: 1.35,  // +35% XP after 50 days
  75: 1.5,   // +50% XP after 75 days
  100: 1.75, // +75% XP after 100 days
  150: 2.0,  // +100% XP after 150 days
  200: 2.25, // +125% XP after 200 days
  300: 2.5,  // +150% XP after 300 days
  365: 3.0   // +200% XP after 1 year
};

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_STREAK_REWARD_CONFIG: StreakRewardConfig = {
  milestones: STREAK_MILESTONE_REWARDS,
  titles: STREAK_TITLES,
  shields: STREAK_SHIELDS,
  xpMultipliers: STREAK_XP_MULTIPLIERS,
  titleRotationEnabled: true,
  shieldAutoActivation: false
};

export default {
  STREAK_MILESTONE_REWARDS,
  STREAK_TITLES,
  STREAK_SHIELDS,
  STREAK_XP_MULTIPLIERS,
  DEFAULT_STREAK_REWARD_CONFIG
};