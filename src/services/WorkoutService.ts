import { dbManager } from '@/db/IndexedDBManager';
import type { Workout, WorkoutTemplate } from '@/schemas/workout';
import { validateWorkout, validateWorkoutTemplate, transformWorkoutData, transformTemplateData } from '@/utils/workoutValidation';
import { SAMPLE_WORKOUT_TEMPLATES } from '@/data/sampleWorkouts';
import { QueryOptimizer } from './QueryOptimizer';
import { PrefetchManager } from './PrefetchManager';
import { CacheManager } from './CacheManager';
import { leagueManager } from './LeagueManager';

export class WorkoutService {
  private static instance: WorkoutService;
  private queryOptimizer: QueryOptimizer;
  private prefetchManager: PrefetchManager;
  private cacheManager: CacheManager;

  private constructor() {
    // Use the singleton dbManager instance
    this.queryOptimizer = QueryOptimizer.getInstance();
    this.prefetchManager = PrefetchManager.getInstance();
    this.cacheManager = CacheManager.getInstance();
  }

  public static getInstance(): WorkoutService {
    if (!WorkoutService.instance) {
      WorkoutService.instance = new WorkoutService();
    }
    return WorkoutService.instance;
  }

  // Template Management with Advanced Caching
  async getAllTemplates(): Promise<WorkoutTemplate[]> {
    try {
      await dbManager.init();
      
      // Get all templates directly from database
      const allTemplates = await dbManager.getAll<WorkoutTemplate>('workoutTemplates');
      
      console.log('Raw templates from DB:', allTemplates.length);
      
      // Filter and transform templates
      const templates = allTemplates
        .filter(template => template.is_template === true) // Only actual templates
        .map(template => transformTemplateData(template))
        .filter(Boolean) as WorkoutTemplate[];

      console.log('Filtered templates:', templates.length);
      console.log('Template details:', templates.map(t => ({ id: t.id, name: t.name, user_id: t.user_id, is_template: t.is_template })));

      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  async getTemplateById(id: string): Promise<WorkoutTemplate | null> {
    try {
      await dbManager.init();
      const template = await dbManager.get<WorkoutTemplate>('workoutTemplates', id);
      if (!template) return null;
      
      const transformed = transformTemplateData(template);
      return transformed || null;
    } catch (error) {
      console.error('Error getting template by id:', error);
      return null;
    }
  }

  async getTemplatesByCategory(category: string): Promise<WorkoutTemplate[]> {
    try {
      const allTemplates = await this.getAllTemplates();
      return allTemplates.filter(template => template.category === category);
    } catch (error) {
      console.error('Error getting templates by category:', error);
      return [];
    }
  }

  async getTemplatesByDifficulty(difficulty: number): Promise<WorkoutTemplate[]> {
    try {
      const allTemplates = await this.getAllTemplates();
      return allTemplates.filter(template => template.difficulty_level === difficulty);
    } catch (error) {
      console.error('Error getting templates by difficulty:', error);
      return [];
    }
  }

  async saveTemplate(template: WorkoutTemplate): Promise<boolean> {
    try {
      await dbManager.init();
      
      console.log('Saving template:', template);
      
      // Use the template-specific validation
      const validation = validateWorkoutTemplate(template);
      if (!validation.success) {
        console.error('Template validation failed:', validation.errors);
        return false;
      }
      
      await dbManager.put('workoutTemplates', template);
      
      // Notify that templates have been updated
      if (typeof window !== 'undefined') {
        console.log('Dispatching templatesUpdated event for:', template.id);
        window.dispatchEvent(new CustomEvent('templatesUpdated', { 
          detail: { templateId: template.id } 
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      return false;
    }
  }

  // Removed duplicate deleteTemplate method - see line 491 for the main implementation

  // Create workout from template
  async createWorkoutFromTemplate(templateId: string, userId: string): Promise<Workout | null> {
    try {
      const template = await this.getTemplateById(templateId);
      if (!template) {
        console.error('Template not found:', templateId);
        return null;
      }

      // Create a new workout based on the template
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
            completed: false, // Reset completion status
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
        console.error('Generated workout validation failed:', validation.errors);
        return null;
      }

      return workout;
    } catch (error) {
      console.error('Error creating workout from template:', error);
      return null;
    }
  }

  // Update template usage statistics
  async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      const template = await this.getTemplateById(templateId);
      if (template) {
        template.times_used = (template.times_used || 0) + 1;
        template.last_used = new Date();
        await this.saveTemplate(template);
        
        // Notify that templates have been updated
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('templatesUpdated', { 
            detail: { templateId } 
          }));
        }
      }
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  }

  // Initialize with sample templates
  async initializeSampleTemplates(): Promise<void> {
    try {
      await dbManager.init();
      const existingTemplates = await this.getAllTemplates();
      
      // Only initialize if no templates exist
      if (existingTemplates.length === 0) {
        console.log('Initializing sample workout templates...');
        
        for (const template of SAMPLE_WORKOUT_TEMPLATES) {
          await this.saveTemplate(template);
        }
        
        console.log(`Initialized ${SAMPLE_WORKOUT_TEMPLATES.length} sample templates`);
      }
    } catch (error) {
      console.error('Error initializing sample templates:', error);
    }
  }

  // Workout Management
  async getAllWorkouts(): Promise<Workout[]> {
    try {
      await dbManager.init();
      const workouts = await dbManager.getAll<Workout>('workouts');
      return workouts.map(workout => transformWorkoutData(workout) as Workout).filter(Boolean);
    } catch (error) {
      console.error('Error getting workouts:', error);
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
      console.error('Error getting workout by id:', error);
      return null;
    }
  }

  async saveWorkout(workout: Workout): Promise<boolean> {
    try {
      await dbManager.init();
      const validation = validateWorkout(workout);
      if (!validation.success) {
        console.error('Workout validation failed:', validation.errors);
        return false;
      }

      await dbManager.put('workouts', workout);
      return true;
    } catch (error) {
      console.error('Error saving workout:', error);
      return false;
    }
  }

  async deleteWorkout(id: string): Promise<boolean> {
    try {
      await dbManager.init();
      await dbManager.delete('workouts', id);
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  }

  // Get workouts by user
  async getWorkoutsByUser(userId: string): Promise<Workout[]> {
    try {
      const allWorkouts = await this.getAllWorkouts();
      return allWorkouts.filter(workout => workout.user_id === userId);
    } catch (error) {
      console.error('Error getting workouts by user:', error);
      return [];
    }
  }

  // Get recent workouts
  async getRecentWorkouts(userId: string, limit: number = 10): Promise<Workout[]> {
    try {
      const userWorkouts = await this.getWorkoutsByUser(userId);
      return userWorkouts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent workouts:', error);
      return [];
    }
  }

  // Get the last workout that included a specific exercise (excluding current workout)
  async getLastWorkoutWithExercise(exerciseId: string, userId: string, excludeWorkoutId?: string): Promise<Workout | null> {
    try {
      const userWorkouts = await this.getWorkoutsByUser(userId);
      
      // Filter completed workouts that contain the exercise, excluding current workout
      const workoutsWithExercise = userWorkouts
        .filter(workout => 
          workout.status === 'completed' && 
          workout.id !== excludeWorkoutId &&
          workout.exercises.some(exercise => exercise.exercise_id === exerciseId)
        )
        .sort((a, b) => {
          // Sort by completion date, most recent first
          const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0;
          const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0;
          return bDate - aDate;
        });

      return workoutsWithExercise.length > 0 ? workoutsWithExercise[0] : null;
    } catch (error) {
      console.error('Error getting last workout with exercise:', error);
      return null;
    }
  }

  // Template Usage Tracking
  async updateTemplateUsage(templateId: string): Promise<void> {
    try {
      await dbManager.init();
      const template = await dbManager.get<WorkoutTemplate>('workoutTemplates', templateId);
      
      if (template) {
        const updatedTemplate = {
          ...template,
          last_used: new Date(),
          times_used: (template.times_used || 0) + 1
        };
        await dbManager.put('workoutTemplates', updatedTemplate);
        
        // Notify that templates have been updated
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('templatesUpdated', { 
            detail: { templateId } 
          }));
        }
      }
    } catch (error) {
      console.error('Error updating template usage:', error);
    }
  }

  async getTemplate(templateId: string): Promise<WorkoutTemplate | null> {
    return this.getTemplateById(templateId);
  }

  async updateTemplateFromWorkout(templateId: string, workout: Workout): Promise<void> {
    try {
      await dbManager.init();
      const template = await dbManager.get<WorkoutTemplate>('workoutTemplates', templateId);
      if (template) {
        const updatedTemplate = {
          ...template,
          exercises: workout.exercises.map(exercise => ({
            ...exercise,
            // Convert workout exercise back to template format
            sets: exercise.sets.map(set => ({
              id: set.id,
              set_number: set.set_number,
              type: set.type,
              weight: set.weight,
              reps: set.reps,
              planned_rest_time: set.planned_rest_time
            }))
          })),
          updated_at: new Date()
        };
        await dbManager.put('workoutTemplates', updatedTemplate);
        
        // Notify that templates have been updated
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('templatesUpdated', { 
            detail: { templateId } 
          }));
        }
      }
    } catch (error) {
      console.error('Error updating template from workout:', error);
    }
  }

  // Archive/Unarchive template functionality
  async archiveTemplate(templateId: string): Promise<boolean> {
    try {
      await dbManager.init();
      const template = await dbManager.get<WorkoutTemplate>('workoutTemplates', templateId);
      
      if (!template) {
        console.error('Template not found:', templateId);
        return false;
      }

      const updatedTemplate = {
        ...template,
        is_archived: true,
        archived_at: new Date(),
        updated_at: new Date()
      };

      await dbManager.put('workoutTemplates', updatedTemplate);
      
      // Notify that templates have been updated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('templatesUpdated', { 
          detail: { templateId } 
        }));
      }

      return true;
    } catch (error) {
      console.error('Error archiving template:', error);
      return false;
    }
  }

  async unarchiveTemplate(templateId: string): Promise<boolean> {
    try {
      await dbManager.init();
      const template = await dbManager.get<WorkoutTemplate>('workoutTemplates', templateId);
      
      if (!template) {
        console.error('Template not found:', templateId);
        return false;
      }

      const updatedTemplate = {
        ...template,
        is_archived: false,
        archived_at: undefined,
        updated_at: new Date()
      };

      await dbManager.put('workoutTemplates', updatedTemplate);
      
      // Notify that templates have been updated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('templatesUpdated', { 
          detail: { templateId } 
        }));
      }

      return true;
    } catch (error) {
      console.error('Error unarchiving template:', error);
      return false;
    }
  }

  async renameTemplate(templateId: string, newName: string): Promise<boolean> {
    try {
      await dbManager.init();
      const template = await dbManager.get<WorkoutTemplate>('workoutTemplates', templateId);
      
      if (!template) {
        console.error('Template not found:', templateId);
        return false;
      }

      const updatedTemplate = {
        ...template,
        name: newName.trim(),
        updated_at: new Date()
      };

      await dbManager.put('workoutTemplates', updatedTemplate);
      
      // Notify that templates have been updated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('templatesUpdated', { 
          detail: { templateId } 
        }));
      }

      return true;
    } catch (error) {
      console.error('Error renaming template:', error);
      return false;
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await dbManager.init();
      await dbManager.delete('workoutTemplates', templateId);
      
      // Notify that templates have been updated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('templatesUpdated', { 
          detail: { templateId } 
        }));
      }

      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  async duplicateTemplate(templateId: string, newName?: string): Promise<string | null> {
    try {
      console.log('Duplicating template:', templateId, 'with name:', newName);
      await dbManager.init();
      const template = await dbManager.get<WorkoutTemplate>('workoutTemplates', templateId);
      
      if (!template) {
        console.error('Template not found:', templateId);
        return null;
      }

      console.log('Original template found:', template.name);

      const newTemplateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duplicatedTemplate = {
        ...template,
        id: newTemplateId,
        name: newName || `${template.name} (Copy)`,
        times_used: 0,
        last_used: undefined,
        is_archived: false,
        archived_at: undefined,
        created_at: new Date(),
        updated_at: new Date()
      };

      console.log('Saving duplicated template:', duplicatedTemplate.name);
      await dbManager.put('workoutTemplates', duplicatedTemplate);
      
      // Notify that templates have been updated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('templatesUpdated', { 
          detail: { templateId: newTemplateId } 
        }));
      }

      console.log('Template duplicated successfully:', newTemplateId);
      return newTemplateId;
    } catch (error) {
      console.error('Error duplicating template:', error);
      return null;
    }
  }
}