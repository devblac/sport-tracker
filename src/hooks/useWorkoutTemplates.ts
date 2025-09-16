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
  archiveTemplate: (id: string) => Promise<boolean>;
  unarchiveTemplate: (id: string) => Promise<boolean>;
  renameTemplate: (id: string, newName: string) => Promise<boolean>;
  duplicateTemplate: (id: string, newName?: string) => Promise<string | null>;
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

  const archiveTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await workoutService.archiveTemplate(id);
      
      if (success) {
        await refreshTemplates();
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error archiving template');
      console.error('Error archiving template:', err);
      return false;
    }
  }, [workoutService, refreshTemplates]);

  const unarchiveTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await workoutService.unarchiveTemplate(id);
      
      if (success) {
        await refreshTemplates();
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unarchiving template');
      console.error('Error unarchiving template:', err);
      return false;
    }
  }, [workoutService, refreshTemplates]);

  const renameTemplate = useCallback(async (id: string, newName: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await workoutService.renameTemplate(id, newName);
      
      if (success) {
        await refreshTemplates();
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error renaming template');
      console.error('Error renaming template:', err);
      return false;
    }
  }, [workoutService, refreshTemplates]);

  const duplicateTemplate = useCallback(async (id: string, newName?: string): Promise<string | null> => {
    try {
      setError(null);
      const newTemplateId = await workoutService.duplicateTemplate(id, newName);
      
      if (newTemplateId) {
        await refreshTemplates();
      }
      
      return newTemplateId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error duplicating template');
      console.error('Error duplicating template:', err);
      return null;
    }
  }, [workoutService, refreshTemplates]);

  // Load templates on mount
  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  // Listen for template updates from other parts of the app
  useEffect(() => {
    const handleTemplatesUpdated = () => {
      refreshTemplates();
    };

    window.addEventListener('templatesUpdated', handleTemplatesUpdated);
    
    return () => {
      window.removeEventListener('templatesUpdated', handleTemplatesUpdated);
    };
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
    archiveTemplate,
    unarchiveTemplate,
    renameTemplate,
    duplicateTemplate,
  };
};