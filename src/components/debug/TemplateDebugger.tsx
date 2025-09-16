/**
 * TemplateDebugger Component - Debug template visibility issues
 */

import React, { useState, useEffect } from 'react';
import { WorkoutService } from '@/services/WorkoutService';
import { dbManager } from '@/db/IndexedDBManager';
import { validateWorkoutTemplate } from '@/utils/workoutValidation';
import type { WorkoutTemplate } from '@/schemas/workout';

export const TemplateDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debugTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      await dbManager.init();
      
      // 1. Check if template exists in database
      const rawTemplate = await dbManager.get('workoutTemplates', templateId);
      console.log('Raw template from DB:', rawTemplate);
      
      // 2. Check validation
      let validationResult = null;
      if (rawTemplate) {
        validationResult = validateWorkoutTemplate(rawTemplate);
        console.log('Validation result:', validationResult);
      }
      
      // 3. Check if it appears in getAllTemplates
      const workoutService = WorkoutService.getInstance();
      const allTemplates = await workoutService.getAllTemplates();
      const foundInList = allTemplates.find(t => t.id === templateId);
      console.log('Found in getAllTemplates:', foundInList);
      
      // 4. Get all templates for comparison
      const allRawTemplates = await dbManager.getAll('workoutTemplates');
      console.log('All templates in DB:', allRawTemplates.length);
      
      setDebugInfo({
        templateId,
        existsInDB: !!rawTemplate,
        rawTemplate,
        validationResult,
        foundInList: !!foundInList,
        allTemplatesCount: allTemplates.length,
        allRawTemplatesCount: allRawTemplates.length,
        validationErrors: validationResult?.success ? null : validationResult?.errors
      });
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      // Clear any potential cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Force refresh templates
      window.dispatchEvent(new CustomEvent('templatesUpdated'));
      
      alert('Cache cleared and templates refreshed');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const fixTemplate = async (templateId: string) => {
    try {
      await dbManager.init();
      const rawTemplate = await dbManager.get('workoutTemplates', templateId);
      
      if (rawTemplate) {
        // Fix common issues
        const fixedTemplate = {
          ...rawTemplate,
          status: 'planned', // Ensure correct status
          is_template: true, // Ensure template flag
          created_at: rawTemplate.created_at || new Date(),
          updated_at: new Date()
        };
        
        await dbManager.put('workoutTemplates', fixedTemplate);
        window.dispatchEvent(new CustomEvent('templatesUpdated'));
        
        alert('Template fixed and refreshed');
        debugTemplate(templateId);
      }
    } catch (error) {
      console.error('Error fixing template:', error);
      alert('Error fixing template: ' + error.message);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Template Debugger</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter template ID (e.g., template-1757596912220-viy34f3mi)"
          className="w-full p-2 border rounded mr-2 mb-2"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              debugTemplate((e.target as HTMLInputElement).value);
            }
          }}
        />
        <div className="space-x-2">
          <button
            onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              if (input?.value) debugTemplate(input.value);
            }}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Debugging...' : 'Debug Template'}
          </button>
          
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Clear Cache
          </button>
          
          {debugInfo?.templateId && (
            <button
              onClick={() => fixTemplate(debugInfo.templateId)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Fix Template
            </button>
          )}
        </div>
      </div>

      {debugInfo && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
          <h3 className="font-bold mb-2">Debug Results:</h3>
          <pre className="text-sm overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          
          {debugInfo.validationErrors && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded">
              <h4 className="font-bold text-red-800 dark:text-red-200">Validation Errors:</h4>
              <ul className="list-disc list-inside text-red-700 dark:text-red-300">
                {debugInfo.validationErrors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {!debugInfo.foundInList && debugInfo.existsInDB && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded">
              <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Issue Found:</h4>
              <p className="text-yellow-700 dark:text-yellow-300">
                Template exists in database but not showing in list. This is likely a validation issue.
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded">
        <h3 className="font-bold mb-2">Common Issues & Solutions:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Status Issue:</strong> Template must have `status: 'planned'`</li>
          <li><strong>Template Flag:</strong> Must have `is_template: true`</li>
          <li><strong>Cache Issue:</strong> Try clearing cache and refreshing</li>
          <li><strong>Validation:</strong> Check if template passes validation</li>
          <li><strong>Date Fields:</strong> Ensure dates are valid Date objects</li>
        </ul>
      </div>
    </div>
  );
};