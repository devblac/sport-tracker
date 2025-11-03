/**
 * Theme Hook
 * 
 * Manages theme selection and persistence using AsyncStorage
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = '@liftfire_theme';

/**
 * Hook for managing app theme
 * 
 * Supports light, dark, and auto (system) themes.
 * Theme preference is persisted to AsyncStorage.
 */
export function useTheme() {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [loading, setLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    if (!loading) {
      saveTheme(themeMode);
    }
  }, [themeMode, loading]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeMode(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTheme = async (theme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const changeTheme = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
  };

  // Determine actual theme to use
  const actualTheme = themeMode === 'auto' 
    ? (systemColorScheme || 'light')
    : themeMode;

  return {
    themeMode,
    actualTheme,
    changeTheme,
    loading,
  };
}
