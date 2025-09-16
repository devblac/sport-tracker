import { z } from 'zod';

// Set types for different training methods
export const SetTypeSchema = z.enum([
  'normal',      // Regular working set
  'warmup',      // Warm-up set
  'failure',     // Set taken to muscle failure
  'dropset',     // Drop set (reduce weight mid-set)
  'restpause',   // Rest-pause set
  'cluster',     // Cluster set (mini-rests within set)
  'myorep',      // Myo-rep set
  'amrap',       // As Many Reps As Possible
  'tempo',       // Tempo-controlled set
  'isometric',   // Isometric hold
]);

// RPE (Rate of Perceived Exertion) scale 1-10
export const RPESchema = z.number().min(1).max(10).optional();

// Individual set data
export const SetDataSchema = z.object({
  id: z.string().min(1, 'Set ID is required'),
  set_number: z.number().int().positive('Set number must be positive'),
  type: SetTypeSchema,
  
  // Performance data
  weight: z.number().min(0, 'Weight cannot be negative'),
  reps: z.number().int().min(0, 'Reps cannot be negative'),
  distance: z.number().min(0).optional(), // For cardio exercises (meters)
  duration: z.number().min(0).optional(), // For time-based exercises (seconds)
  
  // Subjective measures
  rpe: RPESchema, // Rate of Perceived Exertion (1-10)
  
  // Set status
  completed: z.boolean().default(false),
  completed_at: z.date().optional(),
  skipped: z.boolean().default(false),
  
  // Rest and timing
  rest_time: z.number().int().min(0).optional(), // Actual rest taken (seconds)
  planned_rest_time: z.number().int().min(0).optional(), // Planned rest (seconds)
  
  // Additional data for special set types
  drop_weight: z.number().min(0).optional(), // For dropsets
  cluster_reps: z.array(z.number().int().positive()).optional(), // For cluster sets
  tempo: z.string().optional(), // Tempo notation (e.g., "3-1-2-1")
  hold_duration: z.number().min(0).optional(), // For isometric sets (seconds)
  
  // Notes and feedback
  notes: z.string().optional(),
  difficulty_rating: z.number().min(1).max(5).optional(), // User's difficulty rating
  
  // Timestamps
  started_at: z.date().optional(),
  ended_at: z.date().optional(),
});

// Exercise within a workout
export const WorkoutExerciseSchema = z.object({
  id: z.string().min(1, 'Workout exercise ID is required'),
  exercise_id: z.string().min(1, 'Exercise ID is required'),
  order: z.number().int().min(0, 'Order cannot be negative'),
  
  // Sets for this exercise
  sets: z.array(SetDataSchema).min(1, 'At least one set is required'),
  
  // Exercise-level settings
  rest_time: z.number().int().min(0).optional(), // Default rest between sets (seconds)
  notes: z.string().optional(),
  
  // Supersets and circuits
  superset_id: z.string().optional(), // Groups exercises in supersets
  circuit_id: z.string().optional(), // Groups exercises in circuits
  
  // Performance tracking
  target_sets: z.number().int().positive().optional(),
  target_reps: z.number().int().positive().optional(),
  target_weight: z.number().min(0).optional(),
  target_rpe: RPESchema,
  
  // Timestamps
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
});

// Workout status
export const WorkoutStatusSchema = z.enum([
  'planned',     // Workout is planned but not started
  'in_progress', // Workout is currently being performed
  'completed',   // Workout finished successfully
  'cancelled',   // Workout was cancelled
  'paused',      // Workout is paused (can be resumed)
]);

// Main workout schema
export const WorkoutSchema = z.object({
  id: z.string().min(1, 'Workout ID is required'),
  user_id: z.string().min(1, 'User ID is required'),
  
  // Basic info
  name: z.string().min(1, 'Workout name is required').max(100, 'Workout name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  
  // Template info
  is_template: z.boolean().default(false),
  template_id: z.string().optional(), // If created from template
  template_name: z.string().optional(), // Original template name
  
  // Status and timing
  status: WorkoutStatusSchema,
  scheduled_date: z.date().optional(),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  paused_at: z.date().optional(),
  
  // Exercises in this workout
  exercises: z.array(WorkoutExerciseSchema),
  
  // Workout-level metrics (calculated)
  total_duration: z.number().int().min(0).optional(), // Total workout time (seconds)
  total_volume: z.number().min(0).optional(), // Total volume (weight × reps)
  total_sets: z.number().int().min(0).optional(), // Total number of sets
  total_reps: z.number().int().min(0).optional(), // Total number of reps
  
  // Workout settings
  auto_rest_timer: z.boolean().default(true),
  default_rest_time: z.number().int().min(0).default(90), // Default rest (seconds)
  
  // User feedback
  difficulty_rating: z.number().min(1).max(5).optional(), // Overall workout difficulty
  energy_level: z.number().min(1).max(5).optional(), // Energy level during workout
  mood_rating: z.number().min(1).max(5).optional(), // Mood after workout
  notes: z.string().optional(),
  
  // Location and environment
  location: z.string().optional(), // Gym name or location
  weather: z.string().optional(), // For outdoor workouts
  
  // Social features
  is_public: z.boolean().default(false),
  shared_with: z.array(z.string()).optional(), // User IDs
  
  // Timestamps
  created_at: z.date(),
  updated_at: z.date().optional(),
});

// Workout template schema (extends workout but with different requirements)
export const WorkoutTemplateSchema = WorkoutSchema.extend({
  is_template: z.literal(true),
  status: z.literal('planned'), // Templates are always in planned state
  
  // Template-specific fields
  category: z.string().optional(), // e.g., "Push", "Pull", "Legs", "Full Body"
  difficulty_level: z.number().int().min(1).max(5).optional(),
  estimated_duration: z.number().int().min(0).optional(), // Estimated time (minutes)
  equipment_needed: z.array(z.string()).optional(),
  
  // Usage tracking
  times_used: z.number().int().min(0).default(0),
  last_used: z.date().optional(),
  
  // Template metadata
  created_by: z.string().optional(), // User ID of creator
  is_public_template: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  
  // Archive functionality
  is_archived: z.boolean().default(false),
  archived_at: z.date().optional(),
});

// Workout creation schema (for new workouts)
export const WorkoutCreateSchema = WorkoutSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  total_duration: true,
  total_volume: true,
  total_sets: true,
  total_reps: true,
}).extend({
  // These will be generated/calculated
});

// Workout update schema (for editing workouts)
export const WorkoutUpdateSchema = WorkoutCreateSchema.partial().extend({
  updated_at: z.date().optional(),
});

// Set creation schema (for adding sets during workout)
export const SetCreateSchema = SetDataSchema.omit({
  id: true,
  completed_at: true,
  started_at: true,
  ended_at: true,
}).extend({
  // These will be generated
});

// Workout filter schema (for searching/filtering workouts)
export const WorkoutFilterSchema = z.object({
  user_id: z.string().optional(),
  status: WorkoutStatusSchema.optional(),
  is_template: z.boolean().optional(),
  template_id: z.string().optional(),
  date_from: z.date().optional(),
  date_to: z.date().optional(),
  exercise_ids: z.array(z.string()).optional(),
  location: z.string().optional(),
  difficulty_rating: z.array(z.number().min(1).max(5)).optional(),
  tags: z.array(z.string()).optional(),
});

// Type exports
export type SetType = z.infer<typeof SetTypeSchema>;
export type SetData = z.infer<typeof SetDataSchema>;
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;
export type WorkoutStatus = z.infer<typeof WorkoutStatusSchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
export type WorkoutTemplate = z.infer<typeof WorkoutTemplateSchema>;
export type WorkoutCreate = z.infer<typeof WorkoutCreateSchema>;
export type WorkoutUpdate = z.infer<typeof WorkoutUpdateSchema>;
export type SetCreate = z.infer<typeof SetCreateSchema>;
export type WorkoutFilter = z.infer<typeof WorkoutFilterSchema>;