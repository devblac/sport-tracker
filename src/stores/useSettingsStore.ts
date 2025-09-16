/**
 * Settings Store
 * 
 * Manages application settings including developer tools visibility,
 * performance monitoring, and other user preferences.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/utils/logger';

interface SettingsState {
  // Developer Tools
  showDevTools: boolean;
  showCacheMonitor: boolean;
  
  // Performance
  enablePerformanceMonitoring: boolean;
  
  // UI Preferences
  compactMode: boolean;
  
  // AI Features
  enableAIWorkoutSuggestions: boolean;
  
  // Actions
  toggleDevTools: () => void;
  toggleCacheMonitor: () => void;
  togglePerformanceMonitoring: () => void;
  toggleCompactMode: () => void;
  toggleAIWorkoutSuggestions: () => void;
  resetSettings: () => void;
}

const defaultSettings = {
  showDevTools: process.env.NODE_ENV === 'development',
  showCacheMonitor: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  compactMode: false,
  enableAIWorkoutSuggestions: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      ...defaultSettings,

      // Actions
      toggleDevTools: () => {
        set((state) => {
          const newValue = !state.showDevTools;
          logger.info('DevTools visibility toggled', { enabled: newValue });
          return { ...state, showDevTools: newValue };
        });
      },

      toggleCacheMonitor: () => {
        set((state) => {
          const newValue = !state.showCacheMonitor;
          logger.info('Cache Monitor visibility toggled', { enabled: newValue });
          return { ...state, showCacheMonitor: newValue };
        });
      },

      togglePerformanceMonitoring: () => {
        set((state) => {
          const newValue = !state.enablePerformanceMonitoring;
          logger.info('Performance monitoring toggled', { enabled: newValue });
          return { ...state, enablePerformanceMonitoring: newValue };
        });
      },

      toggleCompactMode: () => {
        set((state) => {
          const newValue = !state.compactMode;
          logger.info('Compact mode toggled', { enabled: newValue });
          return { ...state, compactMode: newValue };
        });
      },

      toggleAIWorkoutSuggestions: () => {
        set((state) => {
          const newValue = !state.enableAIWorkoutSuggestions;
          logger.info('AI Workout Suggestions toggled', { enabled: newValue });
          return { ...state, enableAIWorkoutSuggestions: newValue };
        });
      },

      resetSettings: () => {
        set(() => {
          logger.info('Settings reset to defaults');
          return { ...defaultSettings };
        });
      },
    }),
    {
      name: 'sport-tracker-settings',
      partialize: (state) => ({
        showDevTools: state.showDevTools,
        showCacheMonitor: state.showCacheMonitor,
        enablePerformanceMonitoring: state.enablePerformanceMonitoring,
        compactMode: state.compactMode,
        enableAIWorkoutSuggestions: state.enableAIWorkoutSuggestions,
      }),
    }
  )
);

export default useSettingsStore;