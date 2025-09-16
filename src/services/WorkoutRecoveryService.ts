import type { Workout } from '@/schemas/workout';
import { WorkoutService } from './WorkoutService';
import { workoutAutoSaveService } from './WorkoutAutoSaveService';
import { notificationService } from './NotificationService';

export interface RecoveryData {
  workout: Workout;
  timestamp: Date;
  source: 'database' | 'localStorage' | 'sessionStorage';
  isValid: boolean;
}

export class WorkoutRecoveryService {
  private static instance: WorkoutRecoveryService;
  private workoutService: WorkoutService;

  private constructor() {
    this.workoutService = WorkoutService.getInstance();
  }

  public static getInstance(): WorkoutRecoveryService {
    if (!WorkoutRecoveryService.instance) {
      WorkoutRecoveryService.instance = new WorkoutRecoveryService();
    }
    return WorkoutRecoveryService.instance;
  }

  public async checkForRecoverableWorkouts(): Promise<RecoveryData[]> {
    try {
      const recoveryData: RecoveryData[] = [];

      // Check localStorage for active workout
      const activeWorkoutId = localStorage.getItem('activeWorkoutId');
      const workoutStartTime = localStorage.getItem('workoutStartTime');

      if (activeWorkoutId && workoutStartTime) {
        // Try to recover from database first
        const dbRecovery = await this.recoverFromDatabase(activeWorkoutId);
        if (dbRecovery) {
          recoveryData.push(dbRecovery);
        } else {
          // Fallback to localStorage backup
          const localRecovery = this.recoverFromLocalStorage(activeWorkoutId);
          if (localRecovery) {
            recoveryData.push(localRecovery);
          }
        }
      }

      // Check for other workout backups in localStorage
      const localBackups = this.findLocalStorageBackups();
      recoveryData.push(...localBackups);

      return recoveryData.filter(data => data.isValid);
    } catch (error) {
      console.error('Error checking for recoverable workouts:', error);
      return [];
    }
  }

  private async recoverFromDatabase(workoutId: string): Promise<RecoveryData | null> {
    try {
      const workout = await this.workoutService.getWorkoutById(workoutId);
      
      if (workout && (workout.status === 'in_progress' || workout.status === 'paused')) {
        // Handle date conversion for timestamp
        let timestamp = new Date();
        if (workout.started_at) {
          if (workout.started_at instanceof Date) {
            timestamp = workout.started_at;
          } else if (typeof workout.started_at === 'string') {
            timestamp = new Date(workout.started_at);
          }
        }
        
        return {
          workout,
          timestamp,
          source: 'database',
          isValid: this.validateWorkoutRecovery(workout)
        };
      }
    } catch (error) {
      console.error('Error recovering workout from database:', error);
    }
    
    return null;
  }

  private recoverFromLocalStorage(workoutId: string): RecoveryData | null {
    try {
      const backup = workoutAutoSaveService.getWorkoutFromLocalStorage(workoutId);
      
      if (backup) {
        // Handle date conversion for timestamp
        let timestamp = new Date();
        if (backup.started_at) {
          if (backup.started_at instanceof Date) {
            timestamp = backup.started_at;
          } else if (typeof backup.started_at === 'string') {
            timestamp = new Date(backup.started_at);
          }
        }
        
        return {
          workout: backup,
          timestamp,
          source: 'localStorage',
          isValid: this.validateWorkoutRecovery(backup)
        };
      }
    } catch (error) {
      console.error('Error recovering workout from localStorage:', error);
    }
    
    return null;
  }

  private findLocalStorageBackups(): RecoveryData[] {
    const backups: RecoveryData[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('workout_backup_')) {
          const workoutId = key.replace('workout_backup_', '');
          const backupData = localStorage.getItem(key);
          
          if (backupData) {
            try {
              const parsed = JSON.parse(backupData);
              const workout = parsed.workout;
              
              if (workout && (workout.status === 'in_progress' || workout.status === 'paused')) {
                backups.push({
                  workout,
                  timestamp: new Date(parsed.timestamp),
                  source: 'localStorage',
                  isValid: this.validateWorkoutRecovery(workout)
                });
              }
            } catch (parseError) {
              console.error(`Error parsing backup data for key ${key}:`, parseError);
              // Skip this backup and continue with others
            }
          }
        }
      }
    } catch (error) {
      console.error('Error finding localStorage backups:', error);
    }
    
    return backups;
  }

  private validateWorkoutRecovery(workout: Workout): boolean {
    try {
      // Check if workout is not too old (e.g., more than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      // Handle both Date objects and string dates from localStorage
      let startedAtTime = 0;
      if (workout.started_at) {
        if (workout.started_at instanceof Date) {
          startedAtTime = workout.started_at.getTime();
        } else if (typeof workout.started_at === 'string') {
          const parsedDate = new Date(workout.started_at);
          if (!isNaN(parsedDate.getTime())) {
            startedAtTime = parsedDate.getTime();
          }
        }
      }
      
      const workoutAge = new Date().getTime() - startedAtTime;
    
    if (workoutAge > maxAge) {
      console.log(`Workout ${workout.id} is too old for recovery (${Math.round(workoutAge / (60 * 60 * 1000))} hours)`);
      return false;
    }

    // Check if workout has valid structure
    if (!workout.id || !workout.name || !Array.isArray(workout.exercises)) {
      console.log(`Workout ${workout.id} has invalid structure`);
      return false;
    }

      // Check if workout status is recoverable
      if (workout.status !== 'in_progress' && workout.status !== 'paused') {
        console.log(`Workout ${workout.id} status is not recoverable: ${workout.status}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating workout recovery:', error);
      return false;
    }
  }

  public async presentRecoveryOptions(recoveryData: RecoveryData[]): Promise<RecoveryData | null> {
    if (recoveryData.length === 0) {
      return null;
    }

    // If only one recovery option, show notification
    if (recoveryData.length === 1) {
      const data = recoveryData[0];
      await notificationService.showWorkoutRecoveryNotification(data.workout.name);
      return data;
    }

    // Multiple recovery options - would need UI component
    // For now, return the most recent one
    return recoveryData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  public async recoverWorkout(recoveryData: RecoveryData): Promise<boolean> {
    try {
      const { workout, source } = recoveryData;
      
      console.log(`Recovering workout ${workout.id} from ${source}`);

      // Ensure workout is saved to database
      if (source !== 'database') {
        await this.workoutService.saveWorkout(workout);
      }

      // Restore localStorage state
      localStorage.setItem('activeWorkoutId', workout.id);
      if (workout.started_at) {
        // Handle both Date objects and string dates
        const startTimeString = workout.started_at instanceof Date 
          ? workout.started_at.toISOString()
          : workout.started_at;
        localStorage.setItem('workoutStartTime', startTimeString);
      }

      // Clean up backup if it was from localStorage
      if (source === 'localStorage') {
        workoutAutoSaveService.clearWorkoutBackup(workout.id);
      }

      console.log(`Workout ${workout.id} recovered successfully`);
      return true;
    } catch (error) {
      console.error('Error recovering workout:', error);
      return false;
    }
  }

  public async discardRecovery(recoveryData: RecoveryData): Promise<void> {
    try {
      const { workout, source } = recoveryData;
      
      console.log(`Discarding recovery for workout ${workout.id} from ${source}`);

      // Mark workout as cancelled in database
      const cancelledWorkout = {
        ...workout,
        status: 'cancelled' as const,
        cancelled_at: new Date()
      };
      
      await this.workoutService.saveWorkout(cancelledWorkout);

      // Clean up localStorage
      localStorage.removeItem('activeWorkoutId');
      localStorage.removeItem('workoutStartTime');
      workoutAutoSaveService.clearWorkoutBackup(workout.id);

      console.log(`Recovery discarded for workout ${workout.id}`);
    } catch (error) {
      console.error('Error discarding recovery:', error);
    }
  }

  public async cleanupOldRecoveryData(): Promise<void> {
    try {
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const cutoffTime = new Date().getTime() - maxAge;

      // Clean up old localStorage backups
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('workout_backup_')) {
          const backupData = localStorage.getItem(key);
          
          if (backupData) {
            try {
              const parsed = JSON.parse(backupData);
              const timestamp = new Date(parsed.timestamp).getTime();
              
              if (timestamp < cutoffTime) {
                localStorage.removeItem(key);
                console.log(`Cleaned up old backup: ${key}`);
              }
            } catch (error) {
              // Invalid backup data, remove it
              localStorage.removeItem(key);
              console.log(`Removed invalid backup: ${key}`);
            }
          }
        }
      }

      console.log('Recovery data cleanup completed');
    } catch (error) {
      console.error('Error cleaning up recovery data:', error);
    }
  }

  public getRecoveryStats(): {
    totalBackups: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  } {
    let totalBackups = 0;
    let oldestBackup: Date | null = null;
    let newestBackup: Date | null = null;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('workout_backup_')) {
          const backupData = localStorage.getItem(key);
          
          if (backupData) {
            try {
              const parsed = JSON.parse(backupData);
              const timestamp = new Date(parsed.timestamp);
              
              totalBackups++;
              
              if (!oldestBackup || timestamp < oldestBackup) {
                oldestBackup = timestamp;
              }
              
              if (!newestBackup || timestamp > newestBackup) {
                newestBackup = timestamp;
              }
            } catch (error) {
              // Invalid backup data
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting recovery stats:', error);
    }

    return {
      totalBackups,
      oldestBackup,
      newestBackup
    };
  }
}

export const workoutRecoveryService = WorkoutRecoveryService.getInstance();