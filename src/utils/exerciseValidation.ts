import {
  ExerciseSchema,
  ExerciseCreateSchema,
  ExerciseUpdateSchema,
  ExerciseFilterSchema,
  type Exercise,
  type ExerciseCreate,
  type ExerciseUpdate,
  type ExerciseFilter,
} from '@/schemas/exercise';
import { logger } from './logger';

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate exercise data
 */
export function validateExercise(data: unknown): ValidationResult<Exercise> {
  try {
    const result = ExerciseSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Exercise validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Exercise validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate exercise creation data
 */
export function validateExerciseCreate(data: unknown): ValidationResult<ExerciseCreate> {
  try {
    const result = ExerciseCreateSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Exercise creation validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Exercise creation validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate exercise update data
 */
export function validateExerciseUpdate(data: unknown): ValidationResult<ExerciseUpdate> {
  try {
    const result = ExerciseUpdateSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Exercise update validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Exercise update validation error', error);
    return {
      success: false,
      errors: ['Validation failed due to unexpected error'],
    };
  }
}

/**
 * Validate exercise filter data
 */
export function validateExerciseFilter(data: unknown): ValidationResult<ExerciseFilter> {
  try {
    // Pre-process the data to handle number/string conversion for difficulty levels
    if (data && typeof data === 'object' && 'difficulty_level' in data) {
      const processedData = { ...data };
      if (Array.isArray((processedData as any).difficulty_level)) {
        (processedData as any).difficulty_level = (processedData as any).difficulty_level.map((level: any) => 
          typeof level === 'number' ? level : parseInt(level)
        );
      }
      data = processedData;
    }

    const result = ExerciseFilterSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Exercise filter validation failed', { errors, data });
      
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    logger.error('Exercise filter validation error', { error, data });
    return {
      success: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Transform raw exercise data to ensure proper types
 */
export function transformExerciseData(rawData: any): Exercise | null {
  try {
    // Handle date strings
    if (rawData.created_at && typeof rawData.created_at === 'string') {
      rawData.created_at = new Date(rawData.created_at);
    }
    if (rawData.updated_at && typeof rawData.updated_at === 'string') {
      rawData.updated_at = new Date(rawData.updated_at);
    }
    
    // Ensure arrays are properly formatted
    if (rawData.body_parts && !Array.isArray(rawData.body_parts)) {
      rawData.body_parts = [rawData.body_parts];
    }
    if (rawData.muscle_groups && !Array.isArray(rawData.muscle_groups)) {
      rawData.muscle_groups = [rawData.muscle_groups];
    }
    if (rawData.tags && !Array.isArray(rawData.tags)) {
      rawData.tags = rawData.tags ? [rawData.tags] : [];
    }
    if (rawData.aliases && !Array.isArray(rawData.aliases)) {
      rawData.aliases = rawData.aliases ? [rawData.aliases] : [];
    }
    
    // Validate and return
    const validation = validateExercise(rawData);
    return validation.success ? validation.data! : null;
  } catch (error) {
    logger.error('Exercise data transformation failed', error);
    return null;
  }
}

/**
 * Generate exercise ID from name
 */
export function generateExerciseId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if exercise matches search criteria
 */
export function matchesSearchCriteria(exercise: Exercise, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  const term = searchTerm.toLowerCase();
  
  return (
    exercise.name.toLowerCase().includes(term) ||
    exercise.aliases.some(alias => alias.toLowerCase().includes(term)) ||
    exercise.tags.some(tag => tag.toLowerCase().includes(term)) ||
    exercise.body_parts.some(part => part.toLowerCase().includes(term)) ||
    exercise.muscle_groups.some(muscle => muscle.toLowerCase().includes(term)) ||
    exercise.category.toLowerCase().includes(term) ||
    exercise.type.toLowerCase().includes(term)
  );
}

/**
 * Get difficulty level display text
 */
export function getDifficultyDisplay(level: number): string {
  // Map 5-level system to 3-level system for display
  if (level <= 2) return 'Beginner';    // Levels 1-2: New to exercise, needs guidance
  if (level <= 3) return 'Intermediate'; // Level 3: Some experience, good form  
  return 'Advanced';                     // Levels 4-5: Experienced, complex movements
}

/**
 * Get equipment display name
 */
export function getEquipmentDisplay(equipment: string): string {
  return equipment
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get body part display name
 */
export function getBodyPartDisplay(bodyPart: string): string {
  return bodyPart
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get muscle group display name
 */
export function getMuscleGroupDisplay(muscleGroup: string): string {
  return muscleGroup
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}