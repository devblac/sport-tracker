/**
 * Theme Context Provider
 * 
 * Provides theme state and functions to the entire app
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme as useThemeHook, ThemeMode, colors } from '../hooks/useTheme';

type ThemeContextType = {
  themeMode: ThemeMode;
  actualTheme: 'light' | 'dark';
  isDark: boolean;
  colors: typeof colors.light;
  changeTheme: (theme: ThemeMode) => void;
  loading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeHook();

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
