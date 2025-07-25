import { z } from 'zod';

// Exercise difficulty levels - stored as 1-5 but displayed as 3 levels
export const DifficultyLevelSchema = z.union([
  z.enum(['1', '2', '3', '4', '5']).transform(val => parseInt(val) as 1 | 2 | 3 | 4 | 5),
  z.number().int().min(1).max(5)
]);

// Exercise types
export const ExerciseTypeSchema = z.enum(['machine', 'dumbbell', 'barbell', 'bodyweight', 'cable', 'resistance_band', 'kettlebell']);

// Exercise categories
export const ExerciseCategorySchema = z.enum([
  'strength',
  'cardio',
  'flexibility',
  'balance',
  'plyometric',
  'powerlifting',
  'olympic_lifting',
  'functional',
  'rehabilitation'
]);

// Body parts
export const BodyPartSchema = z.enum([
  'chest',
  'back',
  'shoulders',
  'arms',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'core',
  'legs',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'full_body'
]);

// Muscle groups (more specific than body parts)
export const MuscleGroupSchema = z.enum([
  // Upper body
  'pectorals',
  'latissimus_dorsi',
  'rhomboids',
  'trapezius',
  'deltoids',
  'rotator_cuff',
  'biceps_brachii',
  'triceps_brachii',
  'brachialis',
  'forearm_flexors',
  'forearm_extensors',
  
  // Core
  'rectus_abdominis',
  'obliques',
  'transverse_abdominis',
  'erector_spinae',
  'multifidus',
  
  // Lower body
  'quadriceps_femoris',
  'hamstrings',
  'gluteus_maximus',
  'gluteus_medius',
  'hip_flexors',
  'adductors',
  'abductors',
  'gastrocnemius',
  'soleus',
  'tibialis_anterior'
]);

// Equipment types
export const EquipmentSchema = z.enum([
  'none', // bodyweight
  'barbell',
  'dumbbell',
  'kettlebell',
  'resistance_band',
  'cable_machine',
  'smith_machine',
  'leg_press',
  'lat_pulldown',
  'rowing_machine',
  'treadmill',
  'stationary_bike',
  'elliptical',
  'pull_up_bar',
  'dip_station',
  'bench',
  'incline_bench',
  'decline_bench',
  'squat_rack',
  'power_rack',
  'leg_curl_machine',
  'leg_extension_machine',
  'calf_raise_machine',
  'chest_press_machine',
  'shoulder_press_machine',
  'lat_machine',
  'cable_crossover',
  'preacher_curl_bench',
  'roman_chair',
  'stability_ball',
  'medicine_ball',
  'foam_roller',
  'yoga_mat',
  'suspension_trainer',
  'battle_ropes',
  'plyo_box',
  'agility_ladder',
  'bosu_ball'
]);

// Exercise instruction step
export const InstructionStepSchema = z.object({
  step_number: z.number().int().positive(),
  instruction: z.string().min(1, 'Instruction cannot be empty'),
  image_url: z.string().url().optional(),
});

// Exercise tips
export const ExerciseTipSchema = z.object({
  category: z.enum(['form', 'breathing', 'safety', 'progression', 'common_mistakes']),
  tip: z.string().min(1, 'Tip cannot be empty'),
});

// Exercise variations
export const ExerciseVariationSchema = z.object({
  name: z.string().min(1, 'Variation name is required'),
  description: z.string().min(1, 'Variation description is required'),
  difficulty_modifier: z.number().int().min(-2).max(2), // -2 = much easier, +2 = much harder
});

// Main exercise schema
export const ExerciseSchema = z.object({
  id: z.string().min(1, 'Exercise ID is required'),
  name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name too long'),
  type: ExerciseTypeSchema,
  category: ExerciseCategorySchema,
  body_parts: z.array(BodyPartSchema).min(1, 'At least one body part is required'),
  muscle_groups: z.array(MuscleGroupSchema).min(1, 'At least one muscle group is required'),
  equipment: EquipmentSchema,
  difficulty_level: DifficultyLevelSchema,
  
  // Instructions and media
  instructions: z.array(InstructionStepSchema).min(1, 'At least one instruction step is required'),
  tips: z.array(ExerciseTipSchema).optional().default([]),
  variations: z.array(ExerciseVariationSchema).optional().default([]),
  
  // Media URLs
  gif_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  muscle_diagram_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  
  // Metadata
  created_at: z.date(),
  updated_at: z.date().optional(),
  created_by: z.string().optional(), // User ID who created (for custom exercises)
  is_custom: z.boolean().default(false),
  is_verified: z.boolean().default(false), // For quality control
  
  // Search and filtering
  tags: z.array(z.string()).optional().default([]),
  aliases: z.array(z.string()).optional().default([]), // Alternative names
  
  // Performance tracking
  default_sets: z.number().int().positive().optional(),
  default_reps: z.number().int().positive().optional(),
  default_rest_time: z.number().int().positive().optional(), // in seconds
  
  // Safety and prerequisites
  prerequisites: z.array(z.string()).optional().default([]), // Exercise IDs that should be mastered first
  contraindications: z.array(z.string()).optional().default([]), // Health conditions to avoid
  safety_notes: z.array(z.string()).optional().default([]),
});

// Exercise filter schema (for search/filtering)
export const ExerciseFilterSchema = z.object({
  search: z.string().optional(),
  type: ExerciseTypeSchema.optional(),
  category: ExerciseCategorySchema.optional(),
  body_parts: z.array(BodyPartSchema).optional(),
  muscle_groups: z.array(MuscleGroupSchema).optional(),
  equipment: z.array(EquipmentSchema).optional(),
  difficulty_level: z.array(DifficultyLevelSchema).optional(),
  is_custom: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Exercise creation schema (for adding new exercises)
export const ExerciseCreateSchema = ExerciseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  // ID will be generated
  // Timestamps will be set automatically
});

// Exercise update schema (for editing exercises)
export const ExerciseUpdateSchema = ExerciseCreateSchema.partial().extend({
  updated_at: z.date().optional(),
});

// Type exports
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;
export type ExerciseType = z.infer<typeof ExerciseTypeSchema>;
export type ExerciseCategory = z.infer<typeof ExerciseCategorySchema>;
export type BodyPart = z.infer<typeof BodyPartSchema>;
export type MuscleGroup = z.infer<typeof MuscleGroupSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type InstructionStep = z.infer<typeof InstructionStepSchema>;
export type ExerciseTip = z.infer<typeof ExerciseTipSchema>;
export type ExerciseVariation = z.infer<typeof ExerciseVariationSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseFilter = z.infer<typeof ExerciseFilterSchema>;
export type ExerciseCreate = z.infer<typeof ExerciseCreateSchema>;
export type ExerciseUpdate = z.infer<typeof ExerciseUpdateSchema>;