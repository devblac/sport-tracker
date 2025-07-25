import {
  WorkoutSchema,
  WorkoutCreateSchema,
  WorkoutUpdateSchema,
  WorkoutTemplateSchema,
  SetDataSchema,
  SetCreateSchema,
  WorkoutFilterSchema,
  type Workout,
  type WorkoutCreate,
  type WorkoutUpdate,
  type WorkoutTemplate,
  type SetData,
  type SetCreate,
  type WorkoutFilter,
} from '@/schemas/workout';
import { logger } from './logger';

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate workout data
 */
export function validateWorkout(data: unknown): ValidationResult<Workout> {
  try {
    const result = WorkoutSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Workout validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Workout validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate workout creation data
 */
export function validateWorkoutCreate(data: unknown): ValidationResult<WorkoutCreate> {
  try {
    const result = WorkoutCreateSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Workout creation validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Workout creation validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate workout template data
 */
export function validateWorkoutTemplate(data: unknown): ValidationResult<WorkoutTemplate> {
  try {
    const result = WorkoutTemplateSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Workout template validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Workout template validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate workout update data
 */
export function validateWorkoutUpdate(data: unknown): ValidationResult<WorkoutUpdate> {
  try {
    const result = WorkoutUpdateSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Workout update validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Workout update validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate set data
 */
export function validateSetData(data: unknown): ValidationResult<SetData> {
  try {
    const result = SetDataSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Set data validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Set data validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate set creation data
 */
export function validateSetCreate(data: unknown): ValidationResult<SetCreate> {
  try {
    const result = SetCreateSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Set creation validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Set creation validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate workout filter data
 */
export function validateWorkoutFilter(data: unknown): ValidationResult<WorkoutFilter> {
  try {
    const result = WorkoutFilterSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Workout filter validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Workout filter validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Transform raw workout data to ensure proper types
 */
export function transformWorkoutData(rawData: any): Workout | null {
  try {
    // Handle date strings
    const dateFields = ['scheduled_date', 'started_at', 'completed_at', 'paused_at', 'created_at', 'updated_at'];
    dateFields.forEach(field => {
      if (rawData[field] && typeof rawData[field] === 'string') {
        rawData[field] = new Date(rawData[field]);
      }
    });
    
    // Handle nested exercise dates
    if (rawData.exercises && Array.isArray(rawData.exercises)) {
      rawData.exercises.forEach((exercise: any) => {
        if (exercise.started_at && typeof exercise.started_at === 'string') {
          exercise.started_at = new Date(exercise.started_at);
        }
        if (exercise.completed_at && typeof exercise.completed_at === 'string') {
          exercise.completed_at = new Date(exercise.completed_at);
        }
        
        // Handle set dates
        if (exercise.sets && Array.isArray(exercise.sets)) {
          exercise.sets.forEach((set: any) => {
            const setDateFields = ['completed_at', 'started_at', 'ended_at'];
            setDateFields.forEach(field => {
              if (set[field] && typeof set[field] === 'string') {
                set[field] = new Date(set[field]);
              }
            });
          });
        }
      });
    }
    
    // Validate and return
    const validation = validateWorkout(rawData);
    return validation.success ? validation.data! : null;
  } catch (error) {
    logger.error('Workout data transformation failed', error);
    return null;
  }
}

/**
 * Generate workout ID
 */
export function generateWorkoutId(): string {
  return `workout-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate set ID
 */
export function generateSetId(): string {
  return `set-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate workout exercise ID
 */
export function generateWorkoutExerciseId(): string {
  return `exercise-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if workout is in progress
 */
export function isWorkoutInProgress(workout: Workout): boolean {
  return workout.status === 'in_progress' || workout.status === 'paused';
}

/**
 * Check if workout is completed
 */
export function isWorkoutCompleted(workout: Workout): boolean {
  return workout.status === 'completed';
}

/**
 * Check if set is a working set (not warmup)
 */
export function isWorkingSet(set: SetData): boolean {
  return set.type !== 'warmup';
}

/**
 * Get set type display name
 */
export function getSetTypeDisplay(setType: string): string {
  const displays: Record<string, string> = {
    normal: 'Working Set',
    warmup: 'Warm-up',
    failure: 'To Failure',
    dropset: 'Drop Set',
    restpause: 'Rest-Pause',
    cluster: 'Cluster Set',
    myorep: 'Myo-Rep',
    amrap: 'AMRAP',
    tempo: 'Tempo',
    isometric: 'Isometric',
  };
  
  return displays[setType] || setType;
}

/**
 * Get workout status display name
 */
export function getWorkoutStatusDisplay(status: string): string {
  const displays: Record<string, string> = {
    planned: 'Planned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    paused: 'Paused',
  };
  
  return displays[status] || status;
}