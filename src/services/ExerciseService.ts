import type { Exercise, ExerciseFilter, ExerciseCreate, ExerciseUpdate } from '@/types';
import { dbManager, STORES } from '@/db/IndexedDBManager';
import { logger } from '@/utils/logger';
import { 
  validateExercise, 
  validateExerciseCreate, 
  validateExerciseUpdate,
  validateExerciseFilter,
  transformExerciseData,
  generateExerciseId,
  matchesSearchCriteria
} from '@/utils/exerciseValidation';

/**
 * Service for managing exercise data in IndexedDB
 */
export class ExerciseService {
  private fallbackMode = false;
  private memoryStore: Exercise[] = [];

  /**
   * Initialize the service
   */
  async init(): Promise<void> {
    try {
      await dbManager.init();
      logger.info('ExerciseService initialized');
    } catch (error) {
      logger.warn('ExerciseService falling back to memory mode', error);
      this.fallbackMode = true;
      this.initializeFallbackData();
    }
  }

  /**
   * Initialize fallback data in memory
   */
  private initializeFallbackData(): void {
    // Load basic exercises from sample data
    this.memoryStore = [];
    logger.info('ExerciseService initialized in fallback mode');
  }

  /**
   * Create a new exercise
   */
  async createExercise(exerciseData: ExerciseCreate): Promise<Exercise> {
    // Validate input data
    const validation = validateExerciseCreate(exerciseData);
    if (!validation.success) {
      throw new Error(`Invalid exercise data: ${validation.errors?.join(', ')}`);
    }

    // Generate ID and timestamps
    const id = generateExerciseId(exerciseData.name);
    const now = new Date();
    
    const exercise: Exercise = {
      ...validation.data!,
      id,
      created_at: now,
      updated_at: now,
    };

    // Validate complete exercise
    const exerciseValidation = validateExercise(exercise);
    if (!exerciseValidation.success) {
      throw new Error(`Invalid exercise: ${exerciseValidation.errors?.join(', ')}`);
    }

    // Check if exercise with same ID already exists
    const existing = await this.getExerciseById(id);
    if (existing) {
      throw new Error(`Exercise with name "${exerciseData.name}" already exists`);
    }

    // Save to database
    await dbManager.put(STORES.EXERCISES, exercise);
    
    logger.info('Exercise created', { id, name: exercise.name });
    return exercise;
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: string): Promise<Exercise | null> {
    const exercise = await dbManager.get<Exercise>(STORES.EXERCISES, id);
    return exercise ? transformExerciseData(exercise) : null;
  }

  /**
   * Update an existing exercise
   */
  async updateExercise(id: string, updates: ExerciseUpdate): Promise<Exercise> {
    // Get existing exercise
    const existing = await this.getExerciseById(id);
    if (!existing) {
      throw new Error(`Exercise with ID "${id}" not found`);
    }

    // Validate updates
    const validation = validateExerciseUpdate(updates);
    if (!validation.success) {
      throw new Error(`Invalid update data: ${validation.errors?.join(', ')}`);
    }

    // Merge updates with existing data
    const updated: Exercise = {
      ...existing,
      ...validation.data!,
      updated_at: new Date(),
    };

    // Validate complete updated exercise
    const exerciseValidation = validateExercise(updated);
    if (!exerciseValidation.success) {
      throw new Error(`Invalid updated exercise: ${exerciseValidation.errors?.join(', ')}`);
    }

    // Save to database
    await dbManager.put(STORES.EXERCISES, updated);
    
    logger.info('Exercise updated', { id, updates });
    return updated;
  }

  /**
   * Delete an exercise
   */
  async deleteExercise(id: string): Promise<void> {
    const existing = await this.getExerciseById(id);
    if (!existing) {
      throw new Error(`Exercise with ID "${id}" not found`);
    }

    await dbManager.delete(STORES.EXERCISES, id);
    logger.info('Exercise deleted', { id });
  }

  /**
   * Get all exercises
   */
  async getAllExercises(): Promise<Exercise[]> {
    const exercises = await dbManager.getAll<Exercise>(STORES.EXERCISES);
    return exercises.map(exercise => transformExerciseData(exercise)).filter(Boolean) as Exercise[];
  }

  /**
   * Search exercises with filters
   */
  async searchExercises(filters: ExerciseFilter = {}): Promise<Exercise[]> {
    // Validate filters
    const validation = validateExerciseFilter(filters);
    if (!validation.success) {
      throw new Error(`Invalid filter data: ${validation.errors?.join(', ')}`);
    }

    const validFilters = validation.data!;
    let exercises = await this.getAllExercises();

    // Apply filters
    if (validFilters.search) {
      exercises = exercises.filter(exercise => 
        matchesSearchCriteria(exercise, validFilters.search!)
      );
    }

    if (validFilters.type) {
      exercises = exercises.filter(exercise => exercise.type === validFilters.type);
    }

    if (validFilters.category) {
      exercises = exercises.filter(exercise => exercise.category === validFilters.category);
    }

    if (validFilters.body_parts && validFilters.body_parts.length > 0) {
      exercises = exercises.filter(exercise =>
        validFilters.body_parts!.some(part => exercise.body_parts.includes(part))
      );
    }

    if (validFilters.muscle_groups && validFilters.muscle_groups.length > 0) {
      exercises = exercises.filter(exercise =>
        validFilters.muscle_groups!.some(muscle => exercise.muscle_groups.includes(muscle))
      );
    }

    if (validFilters.equipment && validFilters.equipment.length > 0) {
      exercises = exercises.filter(exercise =>
        validFilters.equipment!.includes(exercise.equipment)
      );
    }

    if (validFilters.difficulty_level && validFilters.difficulty_level.length > 0) {
      exercises = exercises.filter(exercise =>
        validFilters.difficulty_level!.includes(exercise.difficulty_level)
      );
    }

    if (validFilters.is_custom !== undefined) {
      exercises = exercises.filter(exercise => exercise.is_custom === validFilters.is_custom);
    }

    if (validFilters.tags && validFilters.tags.length > 0) {
      exercises = exercises.filter(exercise =>
        validFilters.tags!.some(tag => exercise.tags.includes(tag))
      );
    }

    logger.debug('Exercise search completed', { 
      filters: validFilters, 
      resultCount: exercises.length 
    });

    return exercises;
  }

  /**
   * Get exercises by body part
   */
  async getExercisesByBodyPart(bodyPart: string): Promise<Exercise[]> {
    return dbManager.queryByIndex<Exercise>(STORES.EXERCISES, 'body_parts', bodyPart);
  }

  /**
   * Get exercises by muscle group
   */
  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return dbManager.queryByIndex<Exercise>(STORES.EXERCISES, 'muscle_groups', muscleGroup);
  }

  /**
   * Get exercises by equipment
   */
  async getExercisesByEquipment(equipment: string): Promise<Exercise[]> {
    return dbManager.queryByIndex<Exercise>(STORES.EXERCISES, 'equipment', equipment);
  }

  /**
   * Get exercises by difficulty level
   */
  async getExercisesByDifficulty(level: number): Promise<Exercise[]> {
    return dbManager.queryByIndex<Exercise>(STORES.EXERCISES, 'difficulty_level', level);
  }

  /**
   * Get custom exercises only
   */
  async getCustomExercises(): Promise<Exercise[]> {
    return dbManager.queryByIndex<Exercise>(STORES.EXERCISES, 'is_custom', true);
  }

  /**
   * Get verified exercises only
   */
  async getVerifiedExercises(): Promise<Exercise[]> {
    const exercises = await this.getAllExercises();
    return exercises.filter(exercise => exercise.is_verified);
  }

  /**
   * Bulk import exercises
   */
  async bulkImportExercises(exercises: ExerciseCreate[]): Promise<Exercise[]> {
    const processedExercises: Exercise[] = [];
    
    for (const exerciseData of exercises) {
      try {
        // Validate each exercise
        const validation = validateExerciseCreate(exerciseData);
        if (!validation.success) {
          logger.warn('Skipping invalid exercise during bulk import', { 
            name: exerciseData.name, 
            errors: validation.errors 
          });
          continue;
        }

        // Generate ID and timestamps
        const id = generateExerciseId(exerciseData.name);
        const now = new Date();
        
        const exercise: Exercise = {
          ...validation.data!,
          id,
          created_at: now,
          updated_at: now,
        };

        processedExercises.push(exercise);
      } catch (error) {
        logger.warn('Error processing exercise during bulk import', { 
          name: exerciseData.name, 
          error 
        });
      }
    }

    // Insert to database or memory store
    if (this.fallbackMode) {
      this.memoryStore.push(...processedExercises);
    } else {
      await dbManager.bulkPut(STORES.EXERCISES, processedExercises);
    }
    
    logger.info('Bulk import completed', { 
      total: exercises.length, 
      imported: processedExercises.length,
      fallbackMode: this.fallbackMode
    });

    return processedExercises;
  }

  /**
   * Get exercise count
   */
  async getExerciseCount(): Promise<number> {
    if (this.fallbackMode) {
      return this.memoryStore.length;
    }
    return dbManager.count(STORES.EXERCISES);
  }

  /**
   * Clear all exercises
   */
  async clearAllExercises(): Promise<void> {
    await dbManager.clear(STORES.EXERCISES);
    logger.info('All exercises cleared');
  }

  /**
   * Get random exercises
   */
  async getRandomExercises(count: number = 5): Promise<Exercise[]> {
    const allExercises = await this.getAllExercises();
    const shuffled = [...allExercises].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get popular exercises (most used - placeholder for future implementation)
   */
  async getPopularExercises(limit: number = 10): Promise<Exercise[]> {
    // For now, return random exercises
    // In the future, this could be based on usage statistics
    return this.getRandomExercises(limit);
  }

  /**
   * Get recommended exercises based on user preferences (placeholder)
   */
  async getRecommendedExercises(
    userPreferences: { 
      bodyParts?: string[], 
      equipment?: string[], 
      difficulty?: number 
    } = {},
    limit: number = 10
  ): Promise<Exercise[]> {
    const filters: ExerciseFilter = {};
    
    if (userPreferences.bodyParts) {
      filters.body_parts = userPreferences.bodyParts as any;
    }
    
    if (userPreferences.equipment) {
      filters.equipment = userPreferences.equipment as any;
    }
    
    if (userPreferences.difficulty) {
      filters.difficulty_level = [userPreferences.difficulty as any];
    }

    const exercises = await this.searchExercises(filters);
    return exercises.slice(0, limit);
  }
}

// Export singleton instance
export const exerciseService = new ExerciseService();