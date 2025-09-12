/**
 * Template Fixer Utility - Fix common template visibility issues
 */

import { dbManager } from '@/db/IndexedDBManager';
import { validateWorkoutTemplate } from '@/utils/workoutValidation';
import type { WorkoutTemplate } from '@/schemas/workout';

export async function fixTemplate(templateId: string): Promise<boolean> {
  try {
    await dbManager.init();
    
    // Get the template from database
    const rawTemplate = await dbManager.get('workoutTemplates', templateId);
    if (!rawTemplate) {
      console.error('Template not found:', templateId);
      return false;
    }

    console.log('Original template:', rawTemplate);

    // Fix common issues
    const fixedTemplate = {
      ...rawTemplate,
      // Ensure required fields for WorkoutTemplateSchema
      status: 'planned', // Templates must have status 'planned'
      is_template: true, // Must be true
      
      // Ensure dates are Date objects
      created_at: rawTemplate.created_at ? new Date(rawTemplate.created_at) : new Date(),
      updated_at: new Date(),
      last_used: rawTemplate.last_used ? new Date(rawTemplate.last_used) : undefined,
      
      // Ensure numeric fields are numbers
      times_used: Number(rawTemplate.times_used) || 0,
      difficulty_level: rawTemplate.difficulty_level ? Number(rawTemplate.difficulty_level) : undefined,
      estimated_duration: rawTemplate.estimated_duration ? Number(rawTemplate.estimated_duration) : undefined,
      
      // Ensure arrays are arrays
      equipment_needed: Array.isArray(rawTemplate.equipment_needed) ? rawTemplate.equipment_needed : [],
      tags: Array.isArray(rawTemplate.tags) ? rawTemplate.tags : [],
      
      // Ensure exercises array exists and is valid
      exercises: Array.isArray(rawTemplate.exercises) ? rawTemplate.exercises.map((exercise: any) => ({
        ...exercise,
        sets: Array.isArray(exercise.sets) ? exercise.sets : []
      })) : []
    };

    console.log('Fixed template:', fixedTemplate);

    // Validate the fixed template
    const validation = validateWorkoutTemplate(fixedTemplate);
    if (!validation.success) {
      console.error('Template still invalid after fixing:', validation.errors);
      return false;
    }

    // Save the fixed template
    await dbManager.put('workoutTemplates', fixedTemplate);
    
    // Notify that templates have been updated
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('templatesUpdated', { 
        detail: { templateId } 
      }));
    }

    console.log('Template fixed successfully:', templateId);
    return true;

  } catch (error) {
    console.error('Error fixing template:', error);
    return false;
  }
}

export async function fixAllTemplates(): Promise<number> {
  try {
    await dbManager.init();
    
    const allTemplates = await dbManager.getAll('workoutTemplates');
    let fixedCount = 0;

    for (const template of allTemplates) {
      if (template.is_template) {
        const success = await fixTemplate(template.id);
        if (success) fixedCount++;
      }
    }

    return fixedCount;
  } catch (error) {
    console.error('Error fixing all templates:', error);
    return 0;
  }
}

// Quick fix function you can run in console
export async function quickFixTemplate(templateId: string = 'template-1757596912220-viy34f3mi') {
  console.log('Fixing template:', templateId);
  const success = await fixTemplate(templateId);
  
  if (success) {
    console.log('✅ Template fixed! Try refreshing your templates list.');
  } else {
    console.log('❌ Failed to fix template. Check console for errors.');
  }
  
  return success;
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).quickFixTemplate = quickFixTemplate;
  (window as any).fixAllTemplates = fixAllTemplates;
}