import type { ExerciseCategory, BodyPart, MuscleGroup, Equipment, ExerciseType } from '@/schemas/exercise';

/**
 * Exercise category definitions with descriptions and icons
 */
export const EXERCISE_CATEGORIES: Record<ExerciseCategory, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  strength: {
    name: 'Strength Training',
    description: 'Build muscle mass and increase strength',
    icon: '💪',
    color: 'bg-red-500',
  },
  cardio: {
    name: 'Cardiovascular',
    description: 'Improve heart health and endurance',
    icon: '❤️',
    color: 'bg-blue-500',
  },
  flexibility: {
    name: 'Flexibility',
    description: 'Improve range of motion and mobility',
    icon: '🤸',
    color: 'bg-green-500',
  },
  balance: {
    name: 'Balance',
    description: 'Enhance stability and coordination',
    icon: '⚖️',
    color: 'bg-purple-500',
  },
  plyometric: {
    name: 'Plyometric',
    description: 'Explosive power and athletic performance',
    icon: '🚀',
    color: 'bg-orange-500',
  },
  powerlifting: {
    name: 'Powerlifting',
    description: 'Maximum strength in squat, bench, deadlift',
    icon: '🏋️',
    color: 'bg-gray-700',
  },
  olympic_lifting: {
    name: 'Olympic Lifting',
    description: 'Technical lifts: snatch and clean & jerk',
    icon: '🥇',
    color: 'bg-yellow-500',
  },
  functional: {
    name: 'Functional',
    description: 'Real-world movement patterns',
    icon: '🏃',
    color: 'bg-teal-500',
  },
  rehabilitation: {
    name: 'Rehabilitation',
    description: 'Recovery and injury prevention',
    icon: '🩹',
    color: 'bg-pink-500',
  },
};

/**
 * Body part definitions with muscle groups
 */
export const BODY_PARTS: Record<BodyPart, {
  name: string;
  description: string;
  muscleGroups: MuscleGroup[];
  icon: string;
}> = {
  chest: {
    name: 'Chest',
    description: 'Pectoral muscles',
    muscleGroups: ['pectorals'],
    icon: '🫁',
  },
  back: {
    name: 'Back',
    description: 'Upper and lower back muscles',
    muscleGroups: ['latissimus_dorsi', 'rhomboids', 'trapezius', 'erector_spinae'],
    icon: '🔙',
  },
  shoulders: {
    name: 'Shoulders',
    description: 'Deltoid and rotator cuff muscles',
    muscleGroups: ['deltoids', 'rotator_cuff'],
    icon: '🤷',
  },
  arms: {
    name: 'Arms',
    description: 'Upper arm muscles',
    muscleGroups: ['biceps_brachii', 'triceps_brachii', 'brachialis'],
    icon: '💪',
  },
  biceps: {
    name: 'Biceps',
    description: 'Front upper arm muscles',
    muscleGroups: ['biceps_brachii', 'brachialis'],
    icon: '💪',
  },
  triceps: {
    name: 'Triceps',
    description: 'Back upper arm muscles',
    muscleGroups: ['triceps_brachii'],
    icon: '💪',
  },
  forearms: {
    name: 'Forearms',
    description: 'Lower arm muscles',
    muscleGroups: ['forearm_flexors', 'forearm_extensors'],
    icon: '🤜',
  },
  abs: {
    name: 'Abs',
    description: 'Abdominal muscles',
    muscleGroups: ['rectus_abdominis', 'obliques'],
    icon: '🔥',
  },
  core: {
    name: 'Core',
    description: 'All core stabilizing muscles',
    muscleGroups: ['rectus_abdominis', 'obliques', 'transverse_abdominis', 'erector_spinae', 'multifidus'],
    icon: '⚡',
  },
  legs: {
    name: 'Legs',
    description: 'All leg muscles',
    muscleGroups: ['quadriceps_femoris', 'hamstrings', 'gluteus_maximus', 'gluteus_medius', 'gastrocnemius', 'soleus'],
    icon: '🦵',
  },
  quadriceps: {
    name: 'Quadriceps',
    description: 'Front thigh muscles',
    muscleGroups: ['quadriceps_femoris'],
    icon: '🦵',
  },
  hamstrings: {
    name: 'Hamstrings',
    description: 'Back thigh muscles',
    muscleGroups: ['hamstrings'],
    icon: '🦵',
  },
  glutes: {
    name: 'Glutes',
    description: 'Buttock muscles',
    muscleGroups: ['gluteus_maximus', 'gluteus_medius'],
    icon: '🍑',
  },
  calves: {
    name: 'Calves',
    description: 'Lower leg muscles',
    muscleGroups: ['gastrocnemius', 'soleus'],
    icon: '🦵',
  },
  full_body: {
    name: 'Full Body',
    description: 'Multiple muscle groups',
    muscleGroups: ['pectorals', 'latissimus_dorsi', 'deltoids', 'quadriceps_femoris', 'gluteus_maximus'],
    icon: '🏃',
  },
};

/**
 * Equipment categories with descriptions
 */
export const EQUIPMENT_CATEGORIES: Record<Equipment, {
  name: string;
  description: string;
  category: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'accessories';
  icon: string;
}> = {
  none: {
    name: 'Bodyweight',
    description: 'No equipment needed',
    category: 'bodyweight',
    icon: '🤸',
  },
  barbell: {
    name: 'Barbell',
    description: 'Long bar with weights',
    category: 'free_weights',
    icon: '🏋️',
  },
  dumbbell: {
    name: 'Dumbbell',
    description: 'Hand-held weights',
    category: 'free_weights',
    icon: '🏋️',
  },
  kettlebell: {
    name: 'Kettlebell',
    description: 'Ball-shaped weight with handle',
    category: 'free_weights',
    icon: '⚫',
  },
  resistance_band: {
    name: 'Resistance Band',
    description: 'Elastic bands for resistance',
    category: 'accessories',
    icon: '🎗️',
  },
  cable_machine: {
    name: 'Cable Machine',
    description: 'Pulley system with adjustable weight',
    category: 'machines',
    icon: '🔗',
  },
  smith_machine: {
    name: 'Smith Machine',
    description: 'Guided barbell system',
    category: 'machines',
    icon: '🏗️',
  },
  leg_press: {
    name: 'Leg Press',
    description: 'Seated leg pushing machine',
    category: 'machines',
    icon: '🦵',
  },
  lat_pulldown: {
    name: 'Lat Pulldown',
    description: 'Seated pulling machine',
    category: 'machines',
    icon: '⬇️',
  },
  rowing_machine: {
    name: 'Rowing Machine',
    description: 'Cardio rowing simulator',
    category: 'cardio',
    icon: '🚣',
  },
  treadmill: {
    name: 'Treadmill',
    description: 'Running/walking machine',
    category: 'cardio',
    icon: '🏃',
  },
  stationary_bike: {
    name: 'Stationary Bike',
    description: 'Indoor cycling machine',
    category: 'cardio',
    icon: '🚴',
  },
  elliptical: {
    name: 'Elliptical',
    description: 'Low-impact cardio machine',
    category: 'cardio',
    icon: '🏃',
  },
  pull_up_bar: {
    name: 'Pull-up Bar',
    description: 'Bar for hanging exercises',
    category: 'accessories',
    icon: '🔗',
  },
  dip_station: {
    name: 'Dip Station',
    description: 'Parallel bars for dips',
    category: 'accessories',
    icon: '🔗',
  },
  bench: {
    name: 'Bench',
    description: 'Flat exercise bench',
    category: 'accessories',
    icon: '🪑',
  },
  incline_bench: {
    name: 'Incline Bench',
    description: 'Adjustable incline bench',
    category: 'accessories',
    icon: '🪑',
  },
  decline_bench: {
    name: 'Decline Bench',
    description: 'Decline angle bench',
    category: 'accessories',
    icon: '🪑',
  },
  squat_rack: {
    name: 'Squat Rack',
    description: 'Safety rack for squats',
    category: 'accessories',
    icon: '🏗️',
  },
  power_rack: {
    name: 'Power Rack',
    description: 'Full safety cage',
    category: 'accessories',
    icon: '🏗️',
  },
  leg_curl_machine: {
    name: 'Leg Curl Machine',
    description: 'Hamstring isolation machine',
    category: 'machines',
    icon: '🦵',
  },
  leg_extension_machine: {
    name: 'Leg Extension Machine',
    description: 'Quadriceps isolation machine',
    category: 'machines',
    icon: '🦵',
  },
  calf_raise_machine: {
    name: 'Calf Raise Machine',
    description: 'Calf muscle machine',
    category: 'machines',
    icon: '🦵',
  },
  chest_press_machine: {
    name: 'Chest Press Machine',
    description: 'Seated chest pressing machine',
    category: 'machines',
    icon: '🫁',
  },
  shoulder_press_machine: {
    name: 'Shoulder Press Machine',
    description: 'Seated shoulder pressing machine',
    category: 'machines',
    icon: '🤷',
  },
  lat_machine: {
    name: 'Lat Machine',
    description: 'Lat pulldown machine',
    category: 'machines',
    icon: '⬇️',
  },
  cable_crossover: {
    name: 'Cable Crossover',
    description: 'Dual cable machine',
    category: 'machines',
    icon: '🔗',
  },
  preacher_curl_bench: {
    name: 'Preacher Curl Bench',
    description: 'Angled bench for bicep curls',
    category: 'accessories',
    icon: '🪑',
  },
  roman_chair: {
    name: 'Roman Chair',
    description: 'Back extension station',
    category: 'accessories',
    icon: '🪑',
  },
  stability_ball: {
    name: 'Stability Ball',
    description: 'Large exercise ball',
    category: 'accessories',
    icon: '⚽',
  },
  medicine_ball: {
    name: 'Medicine Ball',
    description: 'Weighted ball for throws',
    category: 'accessories',
    icon: '⚽',
  },
  foam_roller: {
    name: 'Foam Roller',
    description: 'Self-massage tool',
    category: 'accessories',
    icon: '🔄',
  },
  yoga_mat: {
    name: 'Yoga Mat',
    description: 'Exercise mat',
    category: 'accessories',
    icon: '🧘',
  },
  suspension_trainer: {
    name: 'Suspension Trainer',
    description: 'Bodyweight training straps',
    category: 'accessories',
    icon: '🎗️',
  },
  battle_ropes: {
    name: 'Battle Ropes',
    description: 'Heavy training ropes',
    category: 'accessories',
    icon: '🪢',
  },
  plyo_box: {
    name: 'Plyo Box',
    description: 'Jump training box',
    category: 'accessories',
    icon: '📦',
  },
  agility_ladder: {
    name: 'Agility Ladder',
    description: 'Speed and agility training',
    category: 'accessories',
    icon: '🪜',
  },
  bosu_ball: {
    name: 'BOSU Ball',
    description: 'Half stability ball',
    category: 'accessories',
    icon: '🌙',
  },
};

/**
 * Exercise type definitions
 */
export const EXERCISE_TYPES: Record<ExerciseType, {
  name: string;
  description: string;
  icon: string;
}> = {
  machine: {
    name: 'Machine',
    description: 'Gym machine exercises',
    icon: '🏗️',
  },
  dumbbell: {
    name: 'Dumbbell',
    description: 'Dumbbell exercises',
    icon: '🏋️',
  },
  barbell: {
    name: 'Barbell',
    description: 'Barbell exercises',
    icon: '🏋️',
  },
  bodyweight: {
    name: 'Bodyweight',
    description: 'No equipment needed',
    icon: '🤸',
  },
  cable: {
    name: 'Cable',
    description: 'Cable machine exercises',
    icon: '🔗',
  },
  resistance_band: {
    name: 'Resistance Band',
    description: 'Band resistance exercises',
    icon: '🎗️',
  },
  kettlebell: {
    name: 'Kettlebell',
    description: 'Kettlebell exercises',
    icon: '⚫',
  },
};

/**
 * Get exercises by body part
 */
export function getBodyPartMuscles(bodyPart: BodyPart): MuscleGroup[] {
  return BODY_PARTS[bodyPart]?.muscleGroups || [];
}

/**
 * Get equipment by category
 */
export function getEquipmentByCategory(category: string): Equipment[] {
  return Object.entries(EQUIPMENT_CATEGORIES)
    .filter(([_, info]) => info.category === category)
    .map(([equipment]) => equipment as Equipment);
}

/**
 * Check if exercise is suitable for beginners
 */
export function isBeginnerFriendly(exercise: { difficulty_level: number; equipment: Equipment }): boolean {
  const beginnerEquipment: Equipment[] = ['none', 'dumbbell', 'resistance_band', 'stability_ball'];
  return exercise.difficulty_level <= 2 && beginnerEquipment.includes(exercise.equipment);
}

/**
 * Get complementary muscle groups (opposing muscles)
 */
export function getComplementaryMuscles(muscleGroup: MuscleGroup): MuscleGroup[] {
  const complementaryMap: Record<MuscleGroup, MuscleGroup[]> = {
    // Upper body pairs
    pectorals: ['latissimus_dorsi', 'rhomboids'],
    latissimus_dorsi: ['pectorals'],
    biceps_brachii: ['triceps_brachii'],
    triceps_brachii: ['biceps_brachii'],
    
    // Lower body pairs
    quadriceps_femoris: ['hamstrings'],
    hamstrings: ['quadriceps_femoris'],
    hip_flexors: ['gluteus_maximus'],
    gluteus_maximus: ['hip_flexors'],
    
    // Core
    rectus_abdominis: ['erector_spinae'],
    erector_spinae: ['rectus_abdominis'],
    
    // Default empty arrays for others
    rhomboids: [],
    trapezius: [],
    deltoids: [],
    rotator_cuff: [],
    brachialis: [],
    forearm_flexors: [],
    forearm_extensors: [],
    obliques: [],
    transverse_abdominis: [],
    multifidus: [],
    gluteus_medius: [],
    adductors: [],
    abductors: [],
    gastrocnemius: [],
    soleus: [],
    tibialis_anterior: [],
  };
  
  return complementaryMap[muscleGroup] || [];
}