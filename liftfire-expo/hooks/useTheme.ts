/**
 * Theme Hook
 * 
 * Manages theme selection and persistence using AsyncStorage
 * Includes full color palette matching legacy app
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = '@liftfire_theme';

// Theme colors matching legacy app
export const colors = {
  light: {
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    card: '#FFFFFF',
    
    // Text colors
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    
    // Primary colors
    primary: '#007AFF',
    primaryForeground: '#FFFFFF',
    
    // Border and divider
    border: '#E5E5E5',
    divider: '#D1D1D6',
    
    // Status colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    
    // Tab bar
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E5E5',
    tabBarActive: '#007AFF',
    tabBarInactive: '#666666',
  },
  dark: {
    // Background colors (matching legacy app)
    background: '#0A0A0B', // hsl(20 14.2857% 4.1176%)
    backgroundSecondary: '#1A1A1D', // hsl(240 5.8824% 10%)
    card: '#1A1A1D',
    
    // Text colors
    text: '#FAFAFA', // hsl(0 0% 98.0392%)
    textSecondary: '#A5A5A8', // hsl(240 5.0279% 64.9020%)
    textTertiary: '#636366',
    
    // Primary colors
    primary: '#5E9EFF', // hsl(217.2193 91.2195% 59.8039%)
    primaryForeground: '#FAFAFA',
    
    // Border and divider
    border: '#2C2C2E',
    divider: '#38383A',
    
    // Status colors
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
    
    // Tab bar
    tabBarBackground: '#1A1A1D',
    tabBarBorder: '#2C2C2E',
    tabBarActive: '#5E9EFF',
    tabBarInactive: '#A5A5A8',
  },
};

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

  const themeColors = colors[actualTheme];

  return {
    themeMode,
    actualTheme,
    isDark: actualTheme === 'dark',
    colors: themeColors,
    changeTheme,
    loading,
  };
}
