import { useState, useEffect, useCallback } from 'react';
import { WorkoutService } from '@/services/WorkoutService';
import type { WorkoutTemplate, Workout } from '@/schemas/workout';

interface UseWorkoutTemplatesReturn {
  templates: WorkoutTemplate[];
  loading: boolean;
  error: string | null;
  refreshTemplates: () => Promise<void>;
  getTemplatesByCategory: (category: string) => WorkoutTemplate[];
  getTemplatesByDifficulty: (difficulty: number) => WorkoutTemplate[];
  createWorkoutFromTemplate: (templateId: string, userId: string) => Promise<Workout | null>;
  saveTemplate: (template: WorkoutTemplate) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
}

export const useWorkoutTemplates = (): UseWorkoutTemplatesReturn => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workoutService = WorkoutService.getInstance();

  const refreshTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allTemplates = await workoutService.getAllTemplates();
      setTemplates(allTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading templates');
      console.error('Error refreshing templates:', err);
    } finally {
      setLoading(false);
    }
  }, [workoutService]);

  const getTemplatesByCategory = useCallback((category: string): WorkoutTemplate[] => {
    return templates.filter(template => template.category === category);
  }, [templates]);

  const getTemplatesByDifficulty = useCallback((difficulty: number): WorkoutTemplate[] => {
    return templates.filter(template => template.difficulty_level === difficulty);
  }, [templates]);

  const createWorkoutFromTemplate = useCallback(async (templateId: string, userId: string): Promise<Workout | null> => {
    try {
      setError(null);
      const workout = await workoutService.createWorkoutFromTemplate(templateId, userId);
      
      if (workout) {
        // Increment template usage
        await workoutService.incrementTemplateUsage(templateId);
        // Refresh templates to update usage stats
        await refreshTemplates();
      }
      
      return workout;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating workout from template');
      console.error('Error creating workout from template:', err);
      return null;
    }
  }, [workoutService, refreshTemplates]);

  const saveTemplate = useCallback(async (template: WorkoutTemplate): Promise<boolean> => {
    try {
      setError(null);
      const success = await workoutService.saveTemplate(template);
      
      if (success) {
        await refreshTemplates();
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving template');
      console.error('Error saving template:', err);
      return false;
    }
  }, [workoutService, refreshTemplates]);

  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await workoutService.deleteTemplate(id);
      
      if (success) {
        await refreshTemplates();
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting template');
      console.error('Error deleting template:', err);
      return false;
    }
  }, [workoutService, refreshTemplates]);

  // Load templates on mount
  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  return {
    templates,
    loading,
    error,
    refreshTemplates,
    getTemplatesByCategory,
    getTemplatesByDifficulty,
    createWorkoutFromTemplate,
    saveTemplate,
    deleteTemplate,
  };
};