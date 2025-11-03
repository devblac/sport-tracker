// Hook for managing workout templates
// MVP: Local storage + Supabase sync

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_TEMPLATES } from '../lib/templates';
import { WorkoutTemplate } from '../types';
import { useAuth } from './useAuth';

export const useTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load templates (system + user templates)
  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start with default system templates
      let allTemplates = [...DEFAULT_TEMPLATES];

      // Load user's custom templates from Supabase
      if (user) {
        const { data, error: fetchError } = await supabase
          .from('workout_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (data) {
          allTemplates = [...allTemplates, ...data];
        }
      }

      setTemplates(allTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      // Fallback to default templates only
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  // Create new template
  const createTemplate = async (template: Omit<WorkoutTemplate, 'id' | 'created_at'>): Promise<WorkoutTemplate | null> => {
    if (!user) {
      setError('Must be logged in to create templates');
      return null;
    }

    try {
      const newTemplate = {
        ...template,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('workout_templates')
        .insert([newTemplate])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state
      setTemplates(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to create template');
      return null;
    }
  };

  // Update template
  const updateTemplate = async (id: string, updates: Partial<WorkoutTemplate>): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to update templates');
      return false;
    }

    // Prevent editing system templates
    if (id.startsWith('template-')) {
      setError('Cannot edit system templates');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('workout_templates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, ...updates } : t))
      );
      return true;
    } catch (err) {
      console.error('Error updating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to update template');
      return false;
    }
  };

  // Delete template
  const deleteTemplate = async (id: string): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to delete templates');
      return false;
    }

    // Prevent deleting system templates
    if (id.startsWith('template-')) {
      setError('Cannot delete system templates');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setTemplates(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      return false;
    }
  };

  // Duplicate template (create copy)
  const duplicateTemplate = async (templateId: string): Promise<WorkoutTemplate | null> => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      setError('Template not found');
      return null;
    }

    return createTemplate({
      ...template,
      name: `${template.name} (Copy)`,
      user_id: user?.id || '',
      is_template: true,
    });
  };

  // Load templates on mount and when user changes
  useEffect(() => {
    loadTemplates();
  }, [user?.id]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    refreshTemplates: loadTemplates,
  };
};
