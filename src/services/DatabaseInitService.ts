import { exerciseService } from './ExerciseService';
import { WorkoutService } from './WorkoutService';
import { SAMPLE_EXERCISES } from '@/data/sampleExercises';
import { logger } from '@/utils';
import { resetDatabase, shouldResetDatabase, getDatabaseInfo } from '@/utils/databaseReset';

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
        logger.warn('IndexedDB is not supported in this browser, using fallback mode');
        this.initializeFallbackMode();
        return;
      }

      // Check if already initialized
      if (this.isInitialized() && !force) {
        logger.info('Database already initialized, skipping...');
        return;
      }

      logger.info('Initializing database with sample data...');

      // Initialize exercise service with timeout
      const initPromise = exerciseService.init();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Exercise service initialization timed out')), 10000);
      });

      await Promise.race([initPromise, timeoutPromise]);
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
      
      // Try database reset if it's a known issue
      if (error instanceof Error && shouldResetDatabase(error)) {
        logger.warn('Attempting database reset due to initialization failure');
        try {
          await resetDatabase();
          
          // Try initialization one more time after reset
          logger.info('Retrying database initialization after reset...');
          await exerciseService.init();
          
          // If successful, continue with normal initialization
          const workoutService = WorkoutService.getInstance();
          await workoutService.initializeSampleTemplates();
          
          const existingCount = await exerciseService.getExerciseCount();
          if (existingCount === 0) {
            const importedExercises = await exerciseService.bulkImportExercises(SAMPLE_EXERCISES);
            logger.info(`Successfully imported ${importedExercises.length} exercises after reset`);
          }
          
          this.markAsInitialized();
          return;
        } catch (resetError) {
          logger.error('Database reset failed', resetError);
        }
      }
      
      // Try fallback mode if IndexedDB fails
      if (error instanceof Error && (
        error.message.includes('IndexedDB') || 
        error.message.includes('timed out') ||
        error.message.includes('not supported')
      )) {
        logger.warn('Falling back to memory-only mode due to IndexedDB issues');
        this.initializeFallbackMode();
        return;
      }
      
      throw error;
    }
  }

  /**
   * Initialize fallback mode when IndexedDB is not available
   */
  private static initializeFallbackMode(): void {
    try {
      // Mark as initialized to prevent further attempts
      this.markAsInitialized();
      
      // Store fallback flag
      localStorage.setItem('sport-tracker-fallback-mode', 'true');
      
      logger.info('Fallback mode initialized - app will work with limited offline capabilities');
    } catch (error) {
      logger.error('Failed to initialize fallback mode', error);
      // Even if localStorage fails, don't throw - let the app continue
    }
  }

  /**
   * Check if app is running in fallback mode
   */
  static isFallbackMode(): boolean {
    try {
      return localStorage.getItem('sport-tracker-fallback-mode') === 'true';
    } catch (error) {
      return false;
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
    isFallbackMode?: boolean;
  }> {
    try {
      if (this.isFallbackMode()) {
        return {
          exerciseCount: 0,
          isInitialized: true,
          version: this.CURRENT_DB_VERSION,
          sampleDataCount: SAMPLE_EXERCISES.length,
          isFallbackMode: true,
        };
      }

      await exerciseService.init();
      
      return {
        exerciseCount: await exerciseService.getExerciseCount(),
        isInitialized: this.isInitialized(),
        version: localStorage.getItem(this.DB_VERSION_KEY),
        sampleDataCount: SAMPLE_EXERCISES.length,
        isFallbackMode: false,
      };
    } catch (error) {
      logger.error('Failed to get database stats', error);
      return {
        exerciseCount: 0,
        isInitialized: false,
        version: null,
        sampleDataCount: SAMPLE_EXERCISES.length,
        isFallbackMode: true,
      };
    }
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

  /**
   * Debug database state
   */
  static async debugDatabase(): Promise<void> {
    try {
      logger.info('=== Database Debug Info ===');
      
      // Check localStorage flags
      const initialized = localStorage.getItem(this.INIT_FLAG_KEY);
      const version = localStorage.getItem(this.DB_VERSION_KEY);
      const fallbackMode = localStorage.getItem('sport-tracker-fallback-mode');
      
      logger.info('LocalStorage flags:', {
        initialized,
        version,
        fallbackMode,
      });

      // Check IndexedDB info
      const dbInfo = await getDatabaseInfo();
      logger.info('IndexedDB info:', dbInfo);

      // Check exercise service state
      try {
        await exerciseService.init();
        const exerciseCount = await exerciseService.getExerciseCount();
        logger.info('Exercise service:', { exerciseCount });
      } catch (error) {
        logger.error('Exercise service error:', error);
      }

      logger.info('=== End Debug Info ===');
    } catch (error) {
      logger.error('Debug failed', error);
    }
  }

  /**
   * Force reset database (for debugging)
   */
  static async forceReset(): Promise<void> {
    logger.info('Force resetting database...');
    await resetDatabase();
    await this.initializeDatabase(true);
  }
}

// Export the class as default
export default DatabaseInitService;