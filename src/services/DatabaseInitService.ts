import { exerciseService } from './ExerciseService';
import { WorkoutService } from './WorkoutService';
import { SAMPLE_EXERCISES } from '@/data/sampleExercises';
import { logger } from '@/utils';

/**
 * Service for initializing the database with sample data
 */
export class DatabaseInitService {
  private static readonly INIT_FLAG_KEY = 'sport-tracker-db-initialized';
  private static readonly DB_VERSION_KEY = 'sport-tracker-db-version';
  private static readonly CURRENT_DB_VERSION = '1.0.0';

  /**
   * Check if database has been initialized
   */
  static isInitialized(): boolean {
    try {
      const initialized = localStorage.getItem(this.INIT_FLAG_KEY);
      const version = localStorage.getItem(this.DB_VERSION_KEY);
      return initialized === 'true' && version === this.CURRENT_DB_VERSION;
    } catch (error) {
      logger.error('Error checking initialization status', error);
      return false;
    }
  }

  /**
   * Initialize database with sample data
   */
  static async initializeDatabase(force: boolean = false): Promise<void> {
    try {
      // Check IndexedDB support
      if (!('indexedDB' in window)) {
        throw new Error('IndexedDB is not supported in this browser');
      }

      // Check if already initialized
      if (this.isInitialized() && !force) {
        logger.info('Database already initialized, skipping...');
        return;
      }

      logger.info('Initializing database with sample data...');

      // Initialize exercise service
      await exerciseService.init();
      logger.info('Exercise service initialized');

      // Initialize workout templates
      const workoutService = WorkoutService.getInstance();
      await workoutService.initializeSampleTemplates();
      logger.info('Workout templates initialized');

      // Clear existing data if force initialization
      if (force) {
        await exerciseService.clearAllExercises();
        logger.info('Cleared existing exercise data');
      }

      // Check if exercises already exist
      const existingCount = await exerciseService.getExerciseCount();
      logger.info(`Current exercise count: ${existingCount}`);
      
      if (existingCount > 0 && !force) {
        logger.info(`Database already contains ${existingCount} exercises, skipping sample data import`);
        this.markAsInitialized();
        return;
      }

      // Import sample exercises
      logger.info(`Importing ${SAMPLE_EXERCISES.length} sample exercises...`);
      const importedExercises = await exerciseService.bulkImportExercises(SAMPLE_EXERCISES);
      
      logger.info(`Successfully imported ${importedExercises.length} exercises`);

      // Mark as initialized
      this.markAsInitialized();

      // Log summary
      const finalCount = await exerciseService.getExerciseCount();
      logger.info('Database initialization completed', {
        totalExercises: finalCount,
        sampleExercises: importedExercises.length,
        version: this.CURRENT_DB_VERSION,
      });

    } catch (error) {
      logger.error('Database initialization failed', error);
      throw error;
    }
  }

  /**
   * Mark database as initialized
   */
  private static markAsInitialized(): void {
    localStorage.setItem(this.INIT_FLAG_KEY, 'true');
    localStorage.setItem(this.DB_VERSION_KEY, this.CURRENT_DB_VERSION);
  }

  /**
   * Reset database initialization flag
   */
  static resetInitialization(): void {
    localStorage.removeItem(this.INIT_FLAG_KEY);
    localStorage.removeItem(this.DB_VERSION_KEY);
    logger.info('Database initialization flag reset');
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<{
    exerciseCount: number;
    isInitialized: boolean;
    version: string | null;
    sampleDataCount: number;
  }> {
    await exerciseService.init();
    
    return {
      exerciseCount: await exerciseService.getExerciseCount(),
      isInitialized: this.isInitialized(),
      version: localStorage.getItem(this.DB_VERSION_KEY),
      sampleDataCount: SAMPLE_EXERCISES.length,
    };
  }

  /**
   * Reinitialize database (clear and repopulate)
   */
  static async reinitializeDatabase(): Promise<void> {
    logger.info('Reinitializing database...');
    this.resetInitialization();
    await this.initializeDatabase(true);
  }

  /**
   * Add more sample exercises (for future expansion)
   */
  static async addAdditionalSampleData(exercises: any[]): Promise<void> {
    try {
      await exerciseService.init();
      const imported = await exerciseService.bulkImportExercises(exercises);
      logger.info(`Added ${imported.length} additional exercises to database`);
    } catch (error) {
      logger.error('Failed to add additional sample data', error);
      throw error;
    }
  }

  /**
   * Validate database integrity
   */
  static async validateDatabase(): Promise<{
    isValid: boolean;
    issues: string[];
    exerciseCount: number;
  }> {
    const issues: string[] = [];
    let exerciseCount = 0;

    try {
      await exerciseService.init();
      exerciseCount = await exerciseService.getExerciseCount();

      // Check if we have exercises
      if (exerciseCount === 0) {
        issues.push('No exercises found in database');
      }

      // Check if sample exercises are present
      const sampleExerciseNames = SAMPLE_EXERCISES.map(ex => ex.name);
      for (const name of sampleExerciseNames.slice(0, 5)) { // Check first 5
        const exercise = await exerciseService.searchExercises({ search: name });
        if (exercise.length === 0) {
          issues.push(`Sample exercise "${name}" not found`);
        }
      }

      // Check for duplicate exercises
      const allExercises = await exerciseService.getAllExercises();
      const names = allExercises.map(ex => ex.name);
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
      if (duplicates.length > 0) {
        issues.push(`Duplicate exercises found: ${duplicates.join(', ')}`);
      }

    } catch (error) {
      issues.push(`Database validation error: ${error}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      exerciseCount,
    };
  }

  /**
   * Export database data (for backup)
   */
  static async exportDatabase(): Promise<{
    exercises: any[];
    metadata: {
      exportDate: string;
      version: string;
      exerciseCount: number;
    };
  }> {
    await exerciseService.init();
    const exercises = await exerciseService.getAllExercises();

    return {
      exercises,
      metadata: {
        exportDate: new Date().toISOString(),
        version: this.CURRENT_DB_VERSION,
        exerciseCount: exercises.length,
      },
    };
  }

  /**
   * Import database data (from backup)
   */
  static async importDatabase(data: {
    exercises: any[];
    metadata?: any;
  }): Promise<void> {
    try {
      await exerciseService.init();
      
      // Clear existing data
      await exerciseService.clearAllExercises();
      
      // Import exercises
      const imported = await exerciseService.bulkImportExercises(data.exercises);
      
      logger.info(`Imported ${imported.length} exercises from backup`);
      
      // Mark as initialized
      this.markAsInitialized();
      
    } catch (error) {
      logger.error('Database import failed', error);
      throw error;
    }
  }
}

// Export the class as default
export default DatabaseInitService;