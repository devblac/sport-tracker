import { apiClient } from './ApiClient';
import { Workout, WorkoutExercise } from '@/types';
import { storage, logger } from '@/utils';

interface CreateWorkoutRequest {
  name: string;
  exercises: WorkoutExercise[];
  templateId?: string;
}

interface UpdateWorkoutRequest {
  name?: string;
  exercises?: WorkoutExercise[];
  isCompleted?: boolean;
  notes?: string;
}

class WorkoutService {
  private readonly OFFLINE_WORKOUTS_KEY = 'sport-tracker-offline-workouts';
  private readonly SYNC_QUEUE_KEY = 'sport-tracker-sync-queue';

  /**
   * Get all workouts for the current user
   */
  async getWorkouts(): Promise<Workout[]> {
    try {
      // Try to fetch from API first
      const response = await apiClient.get<Workout[]>('/workouts');
      
      // Merge with offline workouts
      const offlineWorkouts = this.getOfflineWorkouts();
      const allWorkouts = [...response.data, ...offlineWorkouts];
      
      logger.info('Workouts fetched successfully', { count: allWorkouts.length });
      return allWorkouts;
    } catch (error) {
      logger.warn('Failed to fetch workouts from API, using offline data', error);
      
      // Fallback to offline workouts only
      return this.getOfflineWorkouts();
    }
  }

  /**
   * Create a new workout
   */
  async createWorkout(workoutData: CreateWorkoutRequest): Promise<Workout> {
    const newWorkout: Workout = {
      id: `workout-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      user_id: 'current-user', // This would come from auth context
      name: workoutData.name,
      exercises: workoutData.exercises,
      is_template: false,
      is_completed: false,
      template_id: workoutData.templateId,
      started_at: new Date(),
      total_volume: 0,
    };

    try {
      // Try to create on server
      const response = await apiClient.post<Workout>('/workouts', newWorkout);
      logger.info('Workout created on server', { workoutId: response.data.id });
      return response.data;
    } catch (error) {
      logger.warn('Failed to create workout on server, saving offline', error);
      
      // Save offline and queue for sync
      this.saveWorkoutOffline(newWorkout);
      this.queueForSync('create', newWorkout);
      
      return newWorkout;
    }
  }

  /**
   * Update an existing workout
   */
  async updateWorkout(workoutId: string, updates: UpdateWorkoutRequest): Promise<Workout> {
    try {
      // Try to update on server
      const response = await apiClient.patch<Workout>(`/workouts/${workoutId}`, updates);
      logger.info('Workout updated on server', { workoutId });
      return response.data;
    } catch (error) {
      logger.warn('Failed to update workout on server, saving offline', error);
      
      // Update offline and queue for sync
      const updatedWorkout = this.updateWorkoutOffline(workoutId, updates);
      if (updatedWorkout) {
        this.queueForSync('update', updatedWorkout);
        return updatedWorkout;
      }
      
      throw new Error('Workout not found');
    }
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(workoutId: string): Promise<void> {
    try {
      // Try to delete on server
      await apiClient.delete(`/workouts/${workoutId}`);
      logger.info('Workout deleted on server', { workoutId });
    } catch (error) {
      logger.warn('Failed to delete workout on server, marking for deletion', error);
      
      // Queue for deletion sync
      this.queueForSync('delete', { id: workoutId });
    }
    
    // Always remove from offline storage
    this.removeWorkoutOffline(workoutId);
  }

  /**
   * Complete a workout
   */
  async completeWorkout(workoutId: string): Promise<Workout> {
    const completionData = {
      isCompleted: true,
      completed_at: new Date(),
      // Calculate total volume and duration here
    };

    return this.updateWorkout(workoutId, completionData);
  }

  /**
   * Get workout templates
   */
  async getTemplates(): Promise<Workout[]> {
    try {
      const response = await apiClient.get<Workout[]>('/workouts/templates');
      return response.data;
    } catch (error) {
      logger.warn('Failed to fetch templates, using default ones', error);
      
      // Return default templates
      return this.getDefaultTemplates();
    }
  }

  /**
   * Sync offline workouts with server
   */
  async syncOfflineWorkouts(): Promise<void> {
    const syncQueue = this.getSyncQueue();
    
    if (syncQueue.length === 0) {
      logger.info('No workouts to sync');
      return;
    }

    logger.info('Starting workout sync', { queueLength: syncQueue.length });
    
    const successfulSyncs: string[] = [];
    
    for (const item of syncQueue) {
      try {
        switch (item.action) {
          case 'create':
            await apiClient.post('/workouts', item.data);
            break;
          case 'update':
            await apiClient.patch(`/workouts/${item.data.id}`, item.data);
            break;
          case 'delete':
            await apiClient.delete(`/workouts/${item.data.id}`);
            break;
        }
        
        successfulSyncs.push(item.id);
        logger.debug('Workout synced successfully', { action: item.action, workoutId: item.data.id });
      } catch (error) {
        logger.error('Failed to sync workout', { action: item.action, workoutId: item.data.id, error });
      }
    }

    // Remove successfully synced items from queue
    if (successfulSyncs.length > 0) {
      const remainingQueue = syncQueue.filter(item => !successfulSyncs.includes(item.id));
      storage.set(this.SYNC_QUEUE_KEY, remainingQueue);
      
      logger.info('Workout sync completed', { 
        synced: successfulSyncs.length, 
        remaining: remainingQueue.length 
      });
    }
  }

  /**
   * Private helper methods
   */
  private getOfflineWorkouts(): Workout[] {
    return storage.get<Workout[]>(this.OFFLINE_WORKOUTS_KEY) || [];
  }

  private saveWorkoutOffline(workout: Workout): void {
    const offlineWorkouts = this.getOfflineWorkouts();
    const existingIndex = offlineWorkouts.findIndex(w => w.id === workout.id);
    
    if (existingIndex >= 0) {
      offlineWorkouts[existingIndex] = workout;
    } else {
      offlineWorkouts.push(workout);
    }
    
    storage.set(this.OFFLINE_WORKOUTS_KEY, offlineWorkouts);
  }

  private updateWorkoutOffline(workoutId: string, updates: UpdateWorkoutRequest): Workout | null {
    const offlineWorkouts = this.getOfflineWorkouts();
    const workoutIndex = offlineWorkouts.findIndex(w => w.id === workoutId);
    
    if (workoutIndex >= 0) {
      offlineWorkouts[workoutIndex] = {
        ...offlineWorkouts[workoutIndex],
        ...updates,
      };
      
      storage.set(this.OFFLINE_WORKOUTS_KEY, offlineWorkouts);
      return offlineWorkouts[workoutIndex];
    }
    
    return null;
  }

  private removeWorkoutOffline(workoutId: string): void {
    const offlineWorkouts = this.getOfflineWorkouts();
    const filteredWorkouts = offlineWorkouts.filter(w => w.id !== workoutId);
    storage.set(this.OFFLINE_WORKOUTS_KEY, filteredWorkouts);
  }

  private getSyncQueue(): Array<{ id: string; action: 'create' | 'update' | 'delete'; data: any }> {
    return storage.get(this.SYNC_QUEUE_KEY) || [];
  }

  private queueForSync(action: 'create' | 'update' | 'delete', data: any): void {
    const syncQueue = this.getSyncQueue();
    const queueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
    };
    
    syncQueue.push(queueItem);
    storage.set(this.SYNC_QUEUE_KEY, syncQueue);
  }

  private getDefaultTemplates(): Workout[] {
    return [
      {
        id: 'template-push',
        user_id: 'system',
        name: 'Push Day',
        exercises: [
          {
            exercise_id: 'bench-press',
            order: 0,
            sets: [],
            rest_time: 90,
            notes: '',
          },
          {
            exercise_id: 'overhead-press',
            order: 1,
            sets: [],
            rest_time: 90,
            notes: '',
          },
          {
            exercise_id: 'tricep-pushdown',
            order: 2,
            sets: [],
            rest_time: 60,
            notes: '',
          },
        ],
        is_template: true,
        is_completed: false,
        total_volume: 0,
      },
      {
        id: 'template-pull',
        user_id: 'system',
        name: 'Pull Day',
        exercises: [
          {
            exercise_id: 'pull-up',
            order: 0,
            sets: [],
            rest_time: 90,
            notes: '',
          },
          {
            exercise_id: 'barbell-row',
            order: 1,
            sets: [],
            rest_time: 90,
            notes: '',
          },
          {
            exercise_id: 'bicep-curl',
            order: 2,
            sets: [],
            rest_time: 60,
            notes: '',
          },
        ],
        is_template: true,
        is_completed: false,
        total_volume: 0,
      },
    ];
  }
}

// Export singleton instance
export const workoutService = new WorkoutService();