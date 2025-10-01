import type { Workout } from '@/schemas/workout';
import { WorkoutService } from './WorkoutService';
import { workoutPlayerService } from './WorkoutPlayerService';
import { logger } from '@/utils/logger';

export interface AutoSaveState {
  workoutId: string;
  lastSaved: Date;
  isDirty: boolean;
  saveInProgress: boolean;
  retryCount: number;
  maxRetries: number;
}

export class WorkoutAutoSaveService {
  private static instance: WorkoutAutoSaveService;
  private workoutService: WorkoutService;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private saveQueue: Map<string, Workout> = new Map();
  private saveStates: Map<string, AutoSaveState> = new Map();
  private readonly SAVE_INTERVAL = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  private constructor() {
    this.workoutService = WorkoutService.getInstance();
  }

  public static getInstance(): WorkoutAutoSaveService {
    if (!WorkoutAutoSaveService.instance) {
      WorkoutAutoSaveService.instance = new WorkoutAutoSaveService();
    }
    return WorkoutAutoSaveService.instance;
  }

  public startAutoSave(workout: Workout): void {
    logger.info(`Starting enhanced auto-save for workout: ${workout.id}`);
    
    // Initialize save state
    this.saveStates.set(workout.id, {
      workoutId: workout.id,
      lastSaved: new Date(),
      isDirty: false,
      saveInProgress: false,
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    });

    // Add to save queue
    this.saveQueue.set(workout.id, workout);

    // Start workout session in player service if not already active
    if (!workoutPlayerService.isSessionActive(workout.id)) {
      workoutPlayerService.startWorkoutSession(workout).catch(error => {
        logger.error('Failed to start workout session', { error, workoutId: workout.id });
      });
    }

    // Start auto-save interval if not already running
    if (!this.autoSaveInterval) {
      this.autoSaveInterval = setInterval(() => {
        this.processSaveQueue();
      }, this.SAVE_INTERVAL);
    }

    // Save immediately
    this.saveWorkoutImmediate(workout);
  }

  public updateWorkout(workout: Workout): void {
    const saveState = this.saveStates.get(workout.id);
    if (saveState) {
      // Mark as dirty and update in queue
      saveState.isDirty = true;
      this.saveQueue.set(workout.id, workout);
      
      // Update workout session in player service
      workoutPlayerService.updateWorkoutSession(workout.id, workout).catch(error => {
        logger.error('Failed to update workout session', { error, workoutId: workout.id });
      });
      
      logger.info(`Workout ${workout.id} marked as dirty for enhanced auto-save`);
    }
  }

  public stopAutoSave(workoutId: string): void {
    logger.info(`Stopping enhanced auto-save for workout: ${workoutId}`);
    
    // Remove from queue and states
    this.saveQueue.delete(workoutId);
    this.saveStates.delete(workoutId);

    // Stop interval if no more workouts to save
    if (this.saveQueue.size === 0 && this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  public async forceSave(workoutId: string): Promise<boolean> {
    const workout = this.saveQueue.get(workoutId);
    if (!workout) {
      console.warn(`No workout found in queue for ID: ${workoutId}`);
      return false;
    }

    return this.saveWorkoutImmediate(workout);
  }

  private async processSaveQueue(): Promise<void> {
    for (const [workoutId, workout] of this.saveQueue.entries()) {
      const saveState = this.saveStates.get(workoutId);
      
      if (!saveState || !saveState.isDirty || saveState.saveInProgress) {
        continue;
      }

      await this.saveWorkoutImmediate(workout);
    }
  }

  private async saveWorkoutImmediate(workout: Workout): Promise<boolean> {
    const saveState = this.saveStates.get(workout.id);
    if (!saveState) {
      console.warn(`No save state found for workout: ${workout.id}`);
      return false;
    }

    if (saveState.saveInProgress) {
      console.log(`Save already in progress for workout: ${workout.id}`);
      return false;
    }

    saveState.saveInProgress = true;

    try {
      logger.info(`Enhanced auto-saving workout: ${workout.id}`);
      
      // Save to IndexedDB through workout service
      const success = await this.workoutService.saveWorkout(workout);
      
      if (success) {
        // Update save state
        saveState.lastSaved = new Date();
        saveState.isDirty = false;
        saveState.retryCount = 0;
        saveState.saveInProgress = false;

        // Also save to localStorage as backup
        this.saveToLocalStorage(workout);

        logger.info(`Workout ${workout.id} enhanced auto-saved successfully`);
        return true;
      } else {
        throw new Error('Failed to save workout to database');
      }
    } catch (error) {
      logger.error(`Error in enhanced auto-saving workout ${workout.id}:`, error);
      
      saveState.retryCount++;
      saveState.saveInProgress = false;

      // Retry logic
      if (saveState.retryCount < saveState.maxRetries) {
        logger.info(`Retrying enhanced save for workout ${workout.id} (attempt ${saveState.retryCount}/${saveState.maxRetries})`);
        
        setTimeout(() => {
          this.saveWorkoutImmediate(workout);
        }, this.RETRY_DELAY * saveState.retryCount);
      } else {
        logger.error(`Max retries reached for workout ${workout.id}. Saving to localStorage as fallback.`);
        this.saveToLocalStorage(workout);
      }

      return false;
    }
  }

  private saveToLocalStorage(workout: Workout): void {
    try {
      const key = `workout_backup_${workout.id}`;
      const backupData = {
        workout,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem(key, JSON.stringify(backupData));
      logger.info(`Workout ${workout.id} saved to localStorage as backup`);
    } catch (error) {
      logger.error(`Failed to save workout ${workout.id} to localStorage:`, error);
    }
  }

  public getWorkoutFromLocalStorage(workoutId: string): Workout | null {
    try {
      const key = `workout_backup_${workoutId}`;
      const backupData = localStorage.getItem(key);
      
      if (backupData) {
        const parsed = JSON.parse(backupData);
        return parsed.workout;
      }
    } catch (error) {
      logger.error(`Failed to retrieve workout ${workoutId} from localStorage:`, error);
    }
    
    return null;
  }

  public clearWorkoutBackup(workoutId: string): void {
    try {
      const key = `workout_backup_${workoutId}`;
      localStorage.removeItem(key);
      logger.info(`Cleared backup for workout ${workoutId}`);
    } catch (error) {
      logger.error(`Failed to clear backup for workout ${workoutId}:`, error);
    }
  }

  public getSaveState(workoutId: string): AutoSaveState | null {
    return this.saveStates.get(workoutId) || null;
  }

  public getAllSaveStates(): Map<string, AutoSaveState> {
    return new Map(this.saveStates);
  }

  public cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    
    this.saveQueue.clear();
    this.saveStates.clear();
    
    console.log('WorkoutAutoSaveService cleaned up');
  }
}

export const workoutAutoSaveService = WorkoutAutoSaveService.getInstance();