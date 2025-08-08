import type { ExerciseCreate } from '@/schemas/exercise';

/**
 * Sample exercise data for initial database population
 */
export const SAMPLE_EXERCISES: ExerciseCreate[] = [
  // Chest exercises
  {
    name: 'Push-ups',
    type: 'bodyweight',
    category: 'strength',
    body_parts: ['chest', 'arms', 'shoulders'],
    muscle_groups: ['pectorals', 'triceps_brachii', 'deltoids'],
    equipment: 'none',
    difficulty_level: 2,
    instructions: [
      { step_number: 1, instruction: 'Start in a plank position with hands slightly wider than shoulders' },
      { step_number: 2, instruction: 'Lower your body until chest nearly touches the floor' },
      { step_number: 3, instruction: 'Push back up to starting position' },
      { step_number: 4, instruction: 'Keep your core tight throughout the movement' },
    ],
    tips: [
      { category: 'form', tip: 'Keep your body in a straight line from head to heels' },
      { category: 'breathing', tip: 'Inhale on the way down, exhale on the way up' },
      { category: 'progression', tip: 'Start with knee push-ups if regular push-ups are too difficult' },
    ],
    variations: [
      { name: 'Knee Push-ups', description: 'Perform push-ups from knees instead of toes', difficulty_modifier: -1 },
      { name: 'Diamond Push-ups', description: 'Form diamond shape with hands for tricep focus', difficulty_modifier: 1 },
      { name: 'Decline Push-ups', description: 'Elevate feet on bench or step', difficulty_modifier: 1 },
    ],
    default_sets: 3,
    default_reps: 12,
    default_rest_time: 60,
    tags: ['bodyweight', 'upper_body', 'beginner_friendly'],
    aliases: ['press-ups'],
  },
  
  {
    name: 'Bench Press',
    type: 'barbell',
    category: 'strength',
    body_parts: ['chest', 'arms', 'shoulders'],
    muscle_groups: ['pectorals', 'triceps_brachii', 'deltoids'],
    equipment: 'barbell',
    difficulty_level: 3,
    instructions: [
      { step_number: 1, instruction: 'Lie on bench with feet flat on floor' },
      { step_number: 2, instruction: 'Grip barbell with hands slightly wider than shoulders' },
      { step_number: 3, instruction: 'Lower bar to chest with control' },
      { step_number: 4, instruction: 'Press bar back up to starting position' },
    ],
    tips: [
      { category: 'safety', tip: 'Always use a spotter when lifting heavy weights' },
      { category: 'form', tip: 'Keep shoulder blades retracted and core tight' },
      { category: 'breathing', tip: 'Take deep breath at top, hold during descent, exhale on press' },
    ],
    variations: [
      { name: 'Incline Bench Press', description: 'Perform on inclined bench for upper chest focus', difficulty_modifier: 0 },
      { name: 'Decline Bench Press', description: 'Perform on declined bench for lower chest focus', difficulty_modifier: 0 },
      { name: 'Close-Grip Bench Press', description: 'Narrow grip for tricep emphasis', difficulty_modifier: 1 },
    ],
    default_sets: 4,
    default_reps: 8,
    default_rest_time: 120,
    tags: ['compound', 'powerlifting', 'mass_building'],
    safety_notes: ['Use spotter for heavy weights', 'Ensure proper bar path'],
  },

  // Back exercises
  {
    name: 'Pull-ups',
    type: 'bodyweight',
    category: 'strength',
    body_parts: ['back', 'arms'],
    muscle_groups: ['latissimus_dorsi', 'rhomboids', 'biceps_brachii'],
    equipment: 'pull_up_bar',
    difficulty_level: 4,
    instructions: [
      { step_number: 1, instruction: 'Hang from pull-up bar with overhand grip' },
      { step_number: 2, instruction: 'Pull your body up until chin clears the bar' },
      { step_number: 3, instruction: 'Lower yourself with control to starting position' },
    ],
    tips: [
      { category: 'form', tip: 'Avoid swinging or using momentum' },
      { category: 'progression', tip: 'Use resistance bands or assisted pull-up machine if needed' },
      { category: 'breathing', tip: 'Exhale on the way up, inhale on the way down' },
    ],
    variations: [
      { name: 'Chin-ups', description: 'Use underhand grip for more bicep involvement', difficulty_modifier: -1 },
      { name: 'Wide-Grip Pull-ups', description: 'Wider grip for lat emphasis', difficulty_modifier: 1 },
      { name: 'Weighted Pull-ups', description: 'Add weight for increased difficulty', difficulty_modifier: 2 },
    ],
    default_sets: 3,
    default_reps: 8,
    default_rest_time: 90,
    tags: ['bodyweight', 'upper_body', 'advanced'],
    prerequisites: ['assisted-pull-ups', 'lat-pulldown'],
  },

  {
    name: 'Deadlift',
    type: 'barbell',
    category: 'powerlifting',
    body_parts: ['back', 'legs', 'glutes'],
    muscle_groups: ['erector_spinae', 'gluteus_maximus', 'hamstrings', 'latissimus_dorsi'],
    equipment: 'barbell',
    difficulty_level: 4,
    instructions: [
      { step_number: 1, instruction: 'Stand with feet hip-width apart, bar over mid-foot' },
      { step_number: 2, instruction: 'Bend at hips and knees to grip the bar' },
      { step_number: 3, instruction: 'Keep chest up and back straight' },
      { step_number: 4, instruction: 'Drive through heels to lift the bar' },
      { step_number: 5, instruction: 'Stand tall, then lower bar with control' },
    ],
    tips: [
      { category: 'safety', tip: 'Keep the bar close to your body throughout the movement' },
      { category: 'form', tip: 'Maintain neutral spine - avoid rounding your back' },
      { category: 'breathing', tip: 'Take deep breath before lift, hold during movement' },
    ],
    variations: [
      { name: 'Sumo Deadlift', description: 'Wide stance with hands inside legs', difficulty_modifier: 0 },
      { name: 'Romanian Deadlift', description: 'Focus on hip hinge movement', difficulty_modifier: -1 },
      { name: 'Trap Bar Deadlift', description: 'Use trap bar for more upright position', difficulty_modifier: -1 },
    ],
    default_sets: 3,
    default_reps: 5,
    default_rest_time: 180,
    tags: ['compound', 'powerlifting', 'full_body'],
    safety_notes: ['Master form with light weight first', 'Use proper lifting belt for heavy weights'],
    contraindications: ['Lower back injury', 'Herniated disc'],
  },

  // Leg exercises
  {
    name: 'Squats',
    type: 'bodyweight',
    category: 'strength',
    body_parts: ['legs', 'glutes', 'core'],
    muscle_groups: ['quadriceps_femoris', 'gluteus_maximus', 'hamstrings'],
    equipment: 'none',
    difficulty_level: 2,
    instructions: [
      { step_number: 1, instruction: 'Stand with feet shoulder-width apart' },
      { step_number: 2, instruction: 'Lower your body by bending knees and hips' },
      { step_number: 3, instruction: 'Go down until thighs are parallel to floor' },
      { step_number: 4, instruction: 'Push through heels to return to starting position' },
    ],
    tips: [
      { category: 'form', tip: 'Keep knees in line with toes' },
      { category: 'form', tip: 'Keep chest up and core engaged' },
      { category: 'progression', tip: 'Add weight or try single-leg variations' },
    ],
    variations: [
      { name: 'Jump Squats', description: 'Add explosive jump at the top', difficulty_modifier: 1 },
      { name: 'Goblet Squats', description: 'Hold weight at chest level', difficulty_modifier: 1 },
      { name: 'Single-Leg Squats', description: 'Perform on one leg (pistol squat)', difficulty_modifier: 2 },
    ],
    default_sets: 3,
    default_reps: 15,
    default_rest_time: 60,
    tags: ['bodyweight', 'lower_body', 'functional', 'beginner_friendly'],
  },

  {
    name: 'Barbell Back Squat',
    type: 'barbell',
    category: 'powerlifting',
    body_parts: ['legs', 'glutes', 'core'],
    muscle_groups: ['quadriceps_femoris', 'gluteus_maximus', 'hamstrings', 'erector_spinae'],
    equipment: 'barbell',
    difficulty_level: 4,
    instructions: [
      { step_number: 1, instruction: 'Position barbell on upper back (trapezius)' },
      { step_number: 2, instruction: 'Step back from rack with feet shoulder-width apart' },
      { step_number: 3, instruction: 'Descend by pushing hips back and bending knees' },
      { step_number: 4, instruction: 'Go down until hip crease is below knee cap' },
      { step_number: 5, instruction: 'Drive through heels to return to starting position' },
    ],
    tips: [
      { category: 'safety', tip: 'Always use safety bars or pins in squat rack' },
      { category: 'form', tip: 'Keep knees tracking over toes' },
      { category: 'breathing', tip: 'Take breath at top, hold during descent and ascent' },
    ],
    variations: [
      { name: 'Front Squat', description: 'Hold bar in front rack position', difficulty_modifier: 1 },
      { name: 'High Bar Squat', description: 'Bar positioned higher on traps', difficulty_modifier: 0 },
      { name: 'Low Bar Squat', description: 'Bar positioned lower on rear delts', difficulty_modifier: 1 },
    ],
    default_sets: 4,
    default_reps: 6,
    default_rest_time: 180,
    tags: ['compound', 'powerlifting', 'mass_building'],
    safety_notes: ['Use squat rack with safety bars', 'Have spotter for heavy weights'],
    prerequisites: ['bodyweight-squats', 'goblet-squats'],
  },

  // Shoulder exercises
  {
    name: 'Overhead Press',
    type: 'barbell',
    category: 'strength',
    body_parts: ['shoulders', 'arms', 'core'],
    muscle_groups: ['deltoids', 'triceps_brachii', 'trapezius'],
    equipment: 'barbell',
    difficulty_level: 3,
    instructions: [
      { step_number: 1, instruction: 'Stand with feet hip-width apart, bar at shoulder level' },
      { step_number: 2, instruction: 'Grip bar with hands slightly wider than shoulders' },
      { step_number: 3, instruction: 'Press bar straight up overhead' },
      { step_number: 4, instruction: 'Lower bar back to starting position with control' },
    ],
    tips: [
      { category: 'form', tip: 'Keep core tight to protect lower back' },
      { category: 'form', tip: 'Press bar in straight line over shoulders' },
      { category: 'safety', tip: 'Start with lighter weight to master form' },
    ],
    variations: [
      { name: 'Dumbbell Shoulder Press', description: 'Use dumbbells for greater range of motion', difficulty_modifier: 0 },
      { name: 'Seated Overhead Press', description: 'Perform seated for back support', difficulty_modifier: -1 },
      { name: 'Push Press', description: 'Use leg drive to assist the press', difficulty_modifier: 1 },
    ],
    default_sets: 4,
    default_reps: 8,
    default_rest_time: 120,
    tags: ['compound', 'overhead', 'functional'],
    contraindications: ['Shoulder impingement', 'Rotator cuff injury'],
  },

  // Core exercises
  {
    name: 'Plank',
    type: 'bodyweight',
    category: 'strength',
    body_parts: ['core', 'shoulders'],
    muscle_groups: ['rectus_abdominis', 'transverse_abdominis', 'obliques', 'deltoids'],
    equipment: 'none',
    difficulty_level: 2,
    instructions: [
      { step_number: 1, instruction: 'Start in push-up position on forearms' },
      { step_number: 2, instruction: 'Keep body in straight line from head to heels' },
      { step_number: 3, instruction: 'Hold position while breathing normally' },
      { step_number: 4, instruction: 'Keep core engaged throughout' },
    ],
    tips: [
      { category: 'form', tip: 'Avoid sagging hips or raising butt too high' },
      { category: 'breathing', tip: 'Breathe normally, don\'t hold your breath' },
      { category: 'progression', tip: 'Start with shorter holds and gradually increase time' },
    ],
    variations: [
      { name: 'Side Plank', description: 'Hold plank position on your side', difficulty_modifier: 1 },
      { name: 'Plank with Leg Lift', description: 'Lift one leg while holding plank', difficulty_modifier: 1 },
      { name: 'Plank Up-Downs', description: 'Move from forearm to hand plank', difficulty_modifier: 2 },
    ],
    default_sets: 3,
    default_reps: 1, // Time-based exercise
    default_rest_time: 60,
    tags: ['bodyweight', 'core', 'isometric', 'beginner_friendly'],
  },

  // Cardio exercises
  {
    name: 'Burpees',
    type: 'bodyweight',
    category: 'cardio',
    body_parts: ['full_body'],
    muscle_groups: ['pectorals', 'deltoids', 'quadriceps_femoris', 'gluteus_maximus'],
    equipment: 'none',
    difficulty_level: 4,
    instructions: [
      { step_number: 1, instruction: 'Start standing with feet shoulder-width apart' },
      { step_number: 2, instruction: 'Drop into squat position and place hands on floor' },
      { step_number: 3, instruction: 'Jump feet back into plank position' },
      { step_number: 4, instruction: 'Do a push-up (optional)' },
      { step_number: 5, instruction: 'Jump feet back to squat position' },
      { step_number: 6, instruction: 'Jump up with arms overhead' },
    ],
    tips: [
      { category: 'form', tip: 'Land softly to protect your joints' },
      { category: 'progression', tip: 'Start without push-up or jump if needed' },
      { category: 'breathing', tip: 'Try to maintain steady breathing rhythm' },
    ],
    variations: [
      { name: 'Half Burpees', description: 'Skip the push-up and jump', difficulty_modifier: -2 },
      { name: 'Burpee Box Jumps', description: 'Jump onto box instead of vertical jump', difficulty_modifier: 1 },
      { name: 'Single-Arm Burpees', description: 'Perform push-up with one arm', difficulty_modifier: 2 },
    ],
    default_sets: 3,
    default_reps: 10,
    default_rest_time: 90,
    tags: ['bodyweight', 'cardio', 'full_body', 'hiit'],
  },

  // Arm exercises
  {
    name: 'Bicep Curls',
    type: 'dumbbell',
    category: 'strength',
    body_parts: ['biceps', 'forearms'],
    muscle_groups: ['biceps_brachii', 'brachialis', 'forearm_flexors'],
    equipment: 'dumbbell',
    difficulty_level: 2,
    instructions: [
      { step_number: 1, instruction: 'Stand with dumbbells at your sides, palms facing forward' },
      { step_number: 2, instruction: 'Keep elbows close to your torso' },
      { step_number: 3, instruction: 'Curl weights up by flexing biceps' },
      { step_number: 4, instruction: 'Lower weights slowly to starting position' },
    ],
    tips: [
      { category: 'form', tip: 'Don\'t swing the weights - use controlled movement' },
      { category: 'form', tip: 'Keep elbows stationary throughout movement' },
      { category: 'progression', tip: 'Focus on slow, controlled negatives' },
    ],
    variations: [
      { name: 'Hammer Curls', description: 'Keep palms facing each other', difficulty_modifier: 0 },
      { name: 'Concentration Curls', description: 'Perform seated with elbow braced', difficulty_modifier: 1 },
      { name: '21s', description: '7 bottom half + 7 top half + 7 full reps', difficulty_modifier: 2 },
    ],
    default_sets: 3,
    default_reps: 12,
    default_rest_time: 60,
    tags: ['isolation', 'arms', 'beginner_friendly'],
  },

  {
    name: 'Tricep Dips',
    type: 'bodyweight',
    category: 'strength',
    body_parts: ['triceps', 'shoulders', 'chest'],
    muscle_groups: ['triceps_brachii', 'deltoids', 'pectorals'],
    equipment: 'dip_station',
    difficulty_level: 3,
    instructions: [
      { step_number: 1, instruction: 'Grip parallel bars and support your body weight' },
      { step_number: 2, instruction: 'Lower your body by bending elbows' },
      { step_number: 3, instruction: 'Descend until shoulders are below elbows' },
      { step_number: 4, instruction: 'Push back up to starting position' },
    ],
    tips: [
      { category: 'form', tip: 'Keep body upright to focus on triceps' },
      { category: 'safety', tip: 'Don\'t go too low if you have shoulder issues' },
      { category: 'progression', tip: 'Use assisted dip machine if needed' },
    ],
    variations: [
      { name: 'Bench Dips', description: 'Use bench or chair for support', difficulty_modifier: -1 },
      { name: 'Weighted Dips', description: 'Add weight belt for increased difficulty', difficulty_modifier: 2 },
      { name: 'Ring Dips', description: 'Use gymnastic rings for instability', difficulty_modifier: 2 },
    ],
    default_sets: 3,
    default_reps: 10,
    default_rest_time: 90,
    tags: ['bodyweight', 'triceps', 'compound'],
    contraindications: ['Shoulder impingement', 'Wrist pain'],
  },
];

/**
 * Get sample exercises by category
 */
export function getSampleExercisesByCategory(category: string): ExerciseCreate[] {
  return SAMPLE_EXERCISES.filter(exercise => exercise.category === category);
}

/**
 * Get sample exercises by equipment
 */
export function getSampleExercisesByEquipment(equipment: string): ExerciseCreate[] {
  return SAMPLE_EXERCISES.filter(exercise => exercise.equipment === equipment);
}

/**
 * Get sample exercises by difficulty
 */
export function getSampleExercisesByDifficulty(difficulty: number): ExerciseCreate[] {
  return SAMPLE_EXERCISES.filter(exercise => exercise.difficulty_level === difficulty);
}

/**
 * Get beginner-friendly sample exercises
 */
export function getBeginnerSampleExercises(): ExerciseCreate[] {
  return SAMPLE_EXERCISES.filter(exercise => 
    exercise.difficulty_level <= 2 && 
    exercise.tags.includes('beginner_friendly')
  );
}