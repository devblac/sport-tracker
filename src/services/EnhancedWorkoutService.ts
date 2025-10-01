/**
 * Enhanced Workout Service
 * 
 * Production-ready workout service with Supabase integration.
 * Provides offline-first functionality with cloud sync capabilities.
 */

import { dbManager } from '@/db/IndexedDBManager';
import { supabaseService } from './SupabaseService';
import { realGamificationService } from './RealGamificationService';
import type { Workout, WorkoutTemplate } from '@/schemas/workout';
import { validateWorkout, validateWorkoutTemplate, transformWorkoutData, transformTemplateData } from '@/utils/workoutValidation';
import { SAMPLE_WORKOUT_TEMPLATES } from '@/data/sampleWorkouts';
import { QueryOptimizer } from './QueryOptimizer';
import { PrefetchManager } from './PrefetchManager';
import { CacheManager } from './CacheManager';
import { logger } from '@/utils/logger';

export class EnhancedWorkoutService {
  private static instance: EnhancedWorkoutService;
  private queryOptimizer: QueryOptimizer;
  private prefetchManager: PrefetchManager;
  private cacheManager: CacheManager;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.queryOptimizer = QueryOptimizer.getInstance();
    this.prefetchManager = PrefetchManager.getInstance();
    this.cacheManager = CacheManager.getInstance();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public static getInstance(): EnhancedWorkoutService {
    if (!EnhancedWorkoutService.instance) {
      EnhancedWorkoutService.instance = new EnhancedWorkoutService();
    }
    return EnhancedWorkoutService.instance;
  }

  // ============================================================================
  // Template Management with Cloud Sync
  // ============================================================================

  async getAllTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    try {
      await dbManager.init();
      
      // Try cloud first if online and user is authenticated
      if (this.isOnline && userId) {
        try {
          const cloudTemplates = await this.getCloudTemplates(userId);
          if (cloudTemplates.length > 0) {
            // Cache cloud templates locally
            await this.cacheTemplatesLocally(cloudTemplates);
            return cloudTemplates;
          }
        } catch (error) {
          logger.warn('Failed to fetch cloud templates, falling back to local', { error });
        }
      }
      
      // Fallback to local templates
      const localTemplates = await dbManager.getAll<WorkoutTemplate>('workoutTemplates');
      return localTemplates
        .filter(template => template.is_template === true)
        .map(template => transformTemplateData(template))
        .filter(Boolean) as WorkoutTemplate[];
    } catch (error) {
      logger.error('Error getting templates', { error });
      return [];
    }
  }

  async getTemplateById(id: string, userId?: string): Promise<WorkoutTemplate | null> {
    try {
      await dbManager.init();
      
      // Try local first for speed
      const localTemplate = await dbManager.get<WorkoutTemplate>('workoutTemplates', id);
      if (localTemplate) {
        const transformed = transformTemplateData(localTemplate);
        if (transformed) return transformed;
      }
      
      // Try cloud if online and user is authenticated
      if (this.isOnline && userId) {
        try {
          const { data, error } = await supabaseService.supabase
            .from('workout_templates')
            .select('*')
            .eq('id', id)
            .single();
          
          if (!error && data) {
            const cloudTemplate = this.convertSupabaseTemplate(data);
            // Cache locally
            await this.saveTemplate(cloudTemplate, false); // Don't sync back to cloud
            return cloudTemplate;
          }
        } catch (error) {
          logger.warn('Failed to fetch cloud template', { error, templateId: id });
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting template by id', { error, templateId: id });
      return null;
    }
  }

  async saveTemplate(template: WorkoutTemplate, syncToCloud = true): Promise<boolean> {
    try {
      await dbManager.init();
      
      // Validate template
      const validation = validateWorkoutTemplate(template);
      if (!validation.success) {
        logger.error('Template validation failed', { errors: validation.errors });
        return false;
      }
      
      // Save locally first
      await dbManager.put('workoutTemplates', template);
      
      // Sync to cloud if online and user is authenticated
      if (syncToCloud && this.isOnline && template.user_id) {
        try {
          await this.syncTemplateToCloud(template);
        } catch (error) {
          logger.warn('Failed to sync template to cloud', { error, templateId: template.id });
          // Mark for later sync
          await this.markForSync('template', template.id, 'upsert', template);
        }
      }
      
      // Notify UI
      this.notifyTemplatesUpdated(template.id);
      
      logger.info('Template saved', { templateId: template.id });
      return true;
    } catch (error) {
      logger.error('Error saving template', { error, templateId: template.id });
      return false;
    }
  }

  async deleteTemplate(templateId: string, userId?: string): Promise<boolean> {
    try {
      await dbManager.init();
      
      // Delete locally
      await dbManager.delete('workoutTemplates', templateId);
      
      // Delete from cloud if online and user is authenticated
      if (this.isOnline && userId) {
        try {
          const { error } = await supabaseService.supabase
            .from('workout_templates')
            .delete()
            .eq('id', templateId)
            .eq('created_by', userId);
          
          if (error) {
            logger.warn('Failed to delete template from cloud', { error, templateId });
          }
        } catch (error) {
          logger.warn('Failed to delete template from cloud', { error, templateId });
          // Mark for later sync
          await this.markForSync('template', templateId, 'delete');
        }
      }
      
      // Notify UI
      this.notifyTemplatesUpdated(templateId);
      
      logger.info('Template deleted', { templateId });
      return true;
    } catch (error) {
      logger.error('Error deleting template', { error, templateId });
      return false;
    }
  }

  // ============================================================================
  // Workout Management with Cloud Sync
  // ============================================================================

  async createWorkoutFromTemplate(templateId: string, userId: string): Promise<Workout | null> {
    try {
      const template = await this.getTemplateById(templateId, userId);
      if (!template) {
        logger.error('Template not found', { templateId });
        return null;
      }

      const workout: Workout = {
        id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        name: template.name,
        description: template.description,
        status: 'planned',
        exercises: template.exercises.map(exercise => ({
          ...exercise,
          id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sets: exercise.sets.map(set => ({
            ...set,
            id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            completed: false,
            started_at: undefined,
            ended_at: undefined,
            completed_at: undefined,
          }))
        })),
        template_id: template.id,
        template_name: template.name,
        is_template: false,
        auto_rest_timer: template.auto_rest_timer,
        default_rest_time: template.default_rest_time,
        is_public: false,
        created_at: new Date(),
      };

      const validation = validateWorkout(workout);
      if (!validation.success) {
        logger.error('Generated workout validation failed', { errors: validation.errors });
        return null;
      }

      // Update template usage
      await this.incrementTemplateUsage(templateId);

      logger.info('Workout created from template', { workoutId: workout.id, templateId });
      return workout;
    } catch (error) {
      logger.error('Error creating workout from template', { error, templateId });
      return null;
    }
  }

  async saveWorkout(workout: Workout, syncToCloud = true): Promise<boolean> {
    try {
      await dbManager.init();
      
      // Validate workout
      const validation = validateWorkout(workout);
      if (!validation.success) {
        logger.error('Workout validation failed', { errors: validation.errors });
        return false;
      }

      // Save locally first
      await dbManager.put('workouts', workout);
      
      // Sync to cloud if online and user is authenticated
      if (syncToCloud && this.isOnline && workout.user_id) {
        try {
          await this.syncWorkoutToCloud(workout);
        } catch (error) {
          logger.warn('Failed to sync workout to cloud', { error, workoutId: workout.id });
          // Mark for later sync
          await this.markForSync('workout', workout.id, 'upsert', workout);
        }
      }
      
      logger.info('Workout saved', { workoutId: workout.id });
      return true;
    } catch (error) {
      logger.error('Error saving workout', { error, workoutId: workout.id });
      return false;
    }
  }

  async completeWorkout(workoutId: string, userId: string): Promise<boolean> {
    try {
      const workout = await this.getWorkoutById(workoutId);
      if (!workout) {
        logger.error('Workout not found', { workoutId });
        return false;
      }

      // Update workout status
      workout.status = 'completed';
      workout.completed_at = new Date();
      
      // Calculate workout stats
      const stats = this.calculateWorkoutStats(workout);
      workout.total_volume = stats.totalVolume;
      workout.total_reps = stats.totalReps;
      workout.total_sets = stats.totalSets;
      workout.duration = stats.duration;

      // Save workout
      const saved = await this.saveWorkout(workout);
      if (!saved) return false;

      // Handle gamification
      await this.handleWorkoutCompletion(userId, workoutId, workout);

      logger.info('Workout completed', { workoutId, userId });
      return true;
    } catch (error) {
      logger.error('Error completing workout', { error, workoutId });
      return false;
    }
  }

  async getUserWorkouts(userId: string, limit = 50): Promise<Workout[]> {
    try {
      await dbManager.init();
      
      // Try cloud first if online
      if (this.isOnline) {
        try {
          const cloudWorkouts = await supabaseService.getUserWorkouts(userId, limit);
          if (cloudWorkouts.length > 0) {
            // Convert and cache locally
            const workouts = cloudWorkouts.map(this.convertSupabaseWorkout);
            await this.cacheWorkoutsLocally(workouts);
            return workouts;
          }
        } catch (error) {
          logger.warn('Failed to fetch cloud workouts, falling back to local', { error });
        }
      }
      
      // Fallback to local workouts
      const allWorkouts = await dbManager.getAll<Workout>('workouts');
      return allWorkouts
        .filter(workout => workout.user_id === userId)
        .map(workout => transformWorkoutData(workout) as Workout)
        .filter(Boolean)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting user workouts', { error, userId });
      return [];
    }
  }

  async getWorkoutById(id: string): Promise<Workout | null> {
    try {
      await dbManager.init();
      const workout = await dbManager.get<Workout>('workouts', id);
      if (!workout) return null;
      
      const transformed = transformWorkoutData(workout) as Workout;
      return transformed || null;
    } catch (error) {
      logger.error('Error getting workout by id', { error, workoutId: id });
      return null;
    }
  }

  // ============================================================================
  // Cloud Sync Methods
  // ============================================================================

  private async getCloudTemplates(userId: string): Promise<WorkoutTemplate[]> {
    const { data, error } = await supabaseService.supabase
      .from('workout_templates')
      .select('*')
      .or(`created_by.eq.${userId},is_public.eq.true`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.convertSupabaseTemplate);
  }

  private async syncTemplateToCloud(template: WorkoutTemplate): Promise<void> {
    const supabaseTemplate = this.convertToSupabaseTemplate(template);
    
    const { error } = await supabaseService.supabase
      .from('workout_templates')
      .upsert(supabaseTemplate);
    
    if (error) throw error;
  }

  private async syncWorkoutToCloud(workout: Workout): Promise<void> {
    const supabaseWorkout = this.convertToSupabaseWorkout(workout);
    
    const { error } = await supabaseService.supabase
      .from('workout_sessions')
      .upsert(supabaseWorkout);
    
    if (error) throw error;
  }

  private async handleWorkoutCompletion(userId: string, workoutId: string, workout: Workout): Promise<void> {
    try {
      // Award XP and check achievements
      await realGamificationService.handleWorkoutCompleted(userId, workoutId, {
        total_volume_kg: workout.total_volume,
        duration_seconds: workout.duration,
        total_reps: workout.total_reps,
        total_sets: workout.total_sets,
        personal_records: [] // TODO: Calculate PRs
      });
    } catch (error) {
      logger.error('Error handling workout completion gamification', { error, workoutId });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculateWorkoutStats(workout: Workout) {
    let totalVolume = 0;
    let totalReps = 0;
    let totalSets = 0;
    let duration = 0;

    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
          totalReps += set.reps;
          totalSets += 1;
        }
      });
    });

    // Calculate duration from start to completion
    if (workout.started_at && workout.completed_at) {
      duration = Math.floor((new Date(workout.completed_at).getTime() - new Date(workout.started_at).getTime()) / 1000);
    }

    return { totalVolume, totalReps, totalSets, duration };
  }

  private convertSupabaseTemplate(supabaseTemplate: any): WorkoutTemplate {
    return {
      id: supabaseTemplate.id,
      name: supabaseTemplate.name,
      description: supabaseTemplate.description,
      exercises: supabaseTemplate.exercises || [],
      estimated_duration: supabaseTemplate.estimated_duration,
      difficulty_level: supabaseTemplate.difficulty_level,
      category: supabaseTemplate.category,
      tags: supabaseTemplate.tags || [],
      user_id: supabaseTemplate.created_by,
      is_public: supabaseTemplate.is_public,
      is_featured: supabaseTemplate.is_featured,
      times_used: supabaseTemplate.usage_count,
      average_rating: supabaseTemplate.average_rating,
      created_at: new Date(supabaseTemplate.created_at),
      updated_at: new Date(supabaseTemplate.updated_at),
      is_template: true,
      auto_rest_timer: true,
      default_rest_time: 60
    };
  }

  private convertToSupabaseTemplate(template: WorkoutTemplate): any {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      exercises: template.exercises,
      estimated_duration: template.estimated_duration,
      difficulty_level: template.difficulty_level,
      category: template.category,
      tags: template.tags,
      created_by: template.user_id,
      is_public: template.is_public,
      is_featured: template.is_featured,
      usage_count: template.times_used,
      average_rating: template.average_rating,
      created_at: template.created_at?.toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private convertSupabaseWorkout(supabaseWorkout: any): Workout {
    return {
      id: supabaseWorkout.id,
      user_id: supabaseWorkout.user_id,
      template_id: supabaseWorkout.template_id,
      name: supabaseWorkout.name,
      notes: supabaseWorkout.notes,
      started_at: supabaseWorkout.started_at ? new Date(supabaseWorkout.started_at) : undefined,
      completed_at: supabaseWorkout.completed_at ? new Date(supabaseWorkout.completed_at) : undefined,
      duration: supabaseWorkout.duration_seconds,
      exercises: supabaseWorkout.exercises || [],
      total_volume: supabaseWorkout.total_volume_kg,
      total_reps: supabaseWorkout.total_reps,
      total_sets: supabaseWorkout.total_sets,
      calories_burned: supabaseWorkout.calories_burned,
      xp_earned: supabaseWorkout.xp_earned,
      achievements_unlocked: supabaseWorkout.achievements_unlocked || [],
      status: supabaseWorkout.status,
      created_at: new Date(supabaseWorkout.created_at),
      is_template: false
    };
  }

  private convertToSupabaseWorkout(workout: Workout): any {
    return {
      id: workout.id,
      user_id: workout.user_id,
      template_id: workout.template_id,
      name: workout.name,
      notes: workout.notes,
      started_at: workout.started_at?.toISOString(),
      completed_at: workout.completed_at?.toISOString(),
      duration_seconds: workout.duration,
      exercises: workout.exercises,
      total_volume_kg: workout.total_volume,
      total_reps: workout.total_reps,
      total_sets: workout.total_sets,
      calories_burned: workout.calories_burned,
      xp_earned: workout.xp_earned,
      achievements_unlocked: workout.achievements_unlocked,
      status: workout.status,
      created_at: workout.created_at?.toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private async cacheTemplatesLocally(templates: WorkoutTemplate[]): Promise<void> {
    try {
      await dbManager.init();
      for (const template of templates) {
        await dbManager.put('workoutTemplates', template);
      }
    } catch (error) {
      logger.error('Error caching templates locally', { error });
    }
  }

  private async cacheWorkoutsLocally(workouts: Workout[]): Promise<void> {
    try {
      await dbManager.init();
      for (const workout of workouts) {
        await dbManager.put('workouts', workout);
      }
    } catch (error) {
      logger.error('Error caching workouts locally', { error });
    }
  }

  private async markForSync(type: string, id: string, operation: string, data?: any): Promise<void> {
    try {
      await dbManager.init();
      const syncItem = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        entity_id: id,
        operation,
        data,
        created_at: new Date(),
        retries: 0
      };
      await dbManager.put('syncQueue', syncItem);
    } catch (error) {
      logger.error('Error marking item for sync', { error, type, id });
    }
  }

  private async syncPendingData(): Promise<void> {
    try {
      await dbManager.init();
      const pendingItems = await dbManager.getAll('syncQueue');
      
      for (const item of pendingItems) {
        try {
          if (item.type === 'template') {
            if (item.operation === 'upsert') {
              await this.syncTemplateToCloud(item.data);
            } else if (item.operation === 'delete') {
              // Handle template deletion
            }
          } else if (item.type === 'workout') {
            if (item.operation === 'upsert') {
              await this.syncWorkoutToCloud(item.data);
            }
          }
          
          // Remove from sync queue on success
          await dbManager.delete('syncQueue', item.id);
        } catch (error) {
          logger.warn('Failed to sync item', { error, item });
          // Increment retry count
          item.retries = (item.retries || 0) + 1;
          if (item.retries < 3) {
            await dbManager.put('syncQueue', item);
          } else {
            // Remove after 3 failed attempts
            await dbManager.delete('syncQueue', item.id);
          }
        }
      }
    } catch (error) {
      logger.error('Error syncing pending data', { error });
    }
  }

  private notifyTemplatesUpdated(templateId: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('templatesUpdated', { 
        detail: { templateId } 
      }));
    }
  }

  private async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      const template = await this.getTemplateById(templateId);
      if (template) {
        template.times_used = (template.times_used || 0) + 1;
        template.last_used = new Date();
        await this.saveTemplate(template);
      }
    } catch (error) {
      logger.error('Error incrementing template usage', { error, templateId });
    }
  }

  // ============================================================================
  // Legacy Methods for Compatibility
  // ============================================================================

  async initializeSampleTemplates(): Promise<void> {
    try {
      await dbManager.init();
      const existingTemplates = await this.getAllTemplates();
      
      if (existingTemplates.length === 0) {
        logger.info('Initializing sample workout templates');
        
        for (const template of SAMPLE_WORKOUT_TEMPLATES) {
          await this.saveTemplate(template, false); // Don't sync samples to cloud
        }
        
        logger.info(`Initialized ${SAMPLE_WORKOUT_TEMPLATES.length} sample templates`);
      }
    } catch (error) {
      logger.error('Error initializing sample templates', { error });
    }
  }

  // Alias methods for backward compatibility
  async getAllWorkouts(): Promise<Workout[]> {
    // This would need a userId in a real implementation
    return [];
  }

  async getWorkoutsByUser(userId: string): Promise<Workout[]> {
    return this.getUserWorkouts(userId);
  }

  async getRecentWorkouts(userId: string, limit = 10): Promise<Workout[]> {
    const workouts = await this.getUserWorkouts(userId, limit);
    return workouts.slice(0, limit);
  }

  async deleteWorkout(id: string): Promise<boolean> {
    try {
      await dbManager.init();
      await dbManager.delete('workouts', id);
      return true;
    } catch (error) {
      logger.error('Error deleting workout', { error, workoutId: id });
      return false;
    }
  }
}

// Export singleton instance
export const enhancedWorkoutService = EnhancedWorkoutService.getInstance();