/**
 * Simple Template Debugging Utilities
 */

import { dbManager } from '@/db/IndexedDBManager';
import { validateWorkoutTemplate } from '@/utils/workoutValidation';
import { WorkoutService } from '@/services/WorkoutService';

// Simple debug function that can be called from console
export async function debugTemplate(templateId: string) {
  try {
    console.log('🔍 Debugging template:', templateId);
    
    await dbManager.init();
    
    // 1. Check if exists in database
    const rawTemplate = await dbManager.get('workoutTemplates', templateId);
    console.log('📁 Raw template from DB:', rawTemplate);
    
    if (!rawTemplate) {
      console.log('❌ Template not found in database');
      return;
    }
    
    // 2. Check validation
    const validation = validateWorkoutTemplate(rawTemplate);
    console.log('✅ Validation result:', validation);
    
    if (!validation.success) {
      console.log('❌ Validation errors:', validation.errors);
      return;
    }
    
    // 3. Check if appears in getAllTemplates
    const workoutService = WorkoutService.getInstance();
    const allTemplates = await workoutService.getAllTemplates();
    const foundInList = allTemplates.find(t => t.id === templateId);
    
    console.log('📋 Found in getAllTemplates:', !!foundInList);
    console.log('📊 Total templates in list:', allTemplates.length);
    
    if (!foundInList) {
      console.log('❌ Template exists in DB but not in list - this indicates a filtering issue');
      
      // Check specific requirements
      console.log('🔍 Checking specific requirements:');
      console.log('  - is_template:', rawTemplate.is_template);
      console.log('  - status:', rawTemplate.status);
      console.log('  - created_at:', rawTemplate.created_at);
      console.log('  - user_id:', rawTemplate.user_id);
    } else {
      console.log('✅ Template found successfully!');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Quick fix function
export async function quickFixTemplate(templateId: string) {
  try {
    console.log('🔧 Fixing template:', templateId);
    
    await dbManager.init();
    const rawTemplate = await dbManager.get('workoutTemplates', templateId);
    
    if (!rawTemplate) {
      console.log('❌ Template not found');
      return false;
    }
    
    // Apply fixes
    const fixedTemplate = {
      ...rawTemplate,
      status: 'planned',
      is_template: true,
      created_at: rawTemplate.created_at ? new Date(rawTemplate.created_at) : new Date(),
      updated_at: new Date(),
      exercises: Array.isArray(rawTemplate.exercises) ? rawTemplate.exercises : [],
      times_used: Number(rawTemplate.times_used) || 0
    };
    
    await dbManager.put('workoutTemplates', fixedTemplate);
    
    // Trigger refresh
    window.dispatchEvent(new CustomEvent('templatesUpdated'));
    
    console.log('✅ Template fixed!');
    return true;
    
  } catch (error) {
    console.error('❌ Fix error:', error);
    return false;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).debugTemplate = debugTemplate;
  (window as any).quickFixTemplate = quickFixTemplate;
  
  // Also add a function to debug the most recent template
  (window as any).debugLatestTemplate = async () => {
    try {
      await dbManager.init();
      const allTemplates = await dbManager.getAll('workoutTemplates');
      const userTemplates = allTemplates
        .filter(t => t.is_template && t.user_id && t.user_id !== 'system')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (userTemplates.length > 0) {
        const latest = userTemplates[0];
        console.log('🔍 Debugging latest user template:', latest.id);
        await debugTemplate(latest.id);
      } else {
        console.log('❌ No user templates found');
      }
    } catch (error) {
      console.error('Error finding latest template:', error);
    }
  };

  // Force refresh templates
  (window as any).refreshTemplates = () => {
    window.dispatchEvent(new CustomEvent('templatesUpdated'));
    console.log('🔄 Templates refreshed!');
  };
  
  console.log('🛠️ Template debugging tools loaded!');
  console.log('Usage:');
  console.log('  debugTemplate("your-template-id")');
  console.log('  quickFixTemplate("your-template-id")');
  console.log('  debugLatestTemplate() - debug your most recent template');
}