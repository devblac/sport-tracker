import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '@/utils';

type Theme = 'light' | 'dark' | 'oled' | 'halloween' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark' | 'oled' | 'halloween';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: { value: Theme; label: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = storage.get<Theme>('theme');
    return savedTheme || 'system';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark' | 'oled' | 'halloween'>('light');

  const availableThemes = [
    { value: 'light' as Theme, label: 'Light', description: 'Clean light theme with subtle blue accents' },
    { value: 'dark' as Theme, label: 'Dark', description: 'Professional dark theme with blue accents' },
    { value: 'oled' as Theme, label: 'OLED', description: 'Pure black theme with high contrast colors' },
    { value: 'halloween' as Theme, label: 'Halloween', description: 'Spooky orange and purple theme' },
    { value: 'system' as Theme, label: 'System', description: 'Follow your device settings' },
  ];

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Get theme colors for meta tags
  const getThemeColor = (themeName: 'light' | 'dark' | 'oled' | 'halloween'): string => {
    switch (themeName) {
      case 'light':
        return '#ffffff';
      case 'dark':
        return '#111827'; // slate-900
      case 'oled':
        return '#000000';
      case 'halloween':
        return '#110c17'; // very dark purple
      default:
        return '#ffffff';
    }
  };

  // Update actual theme based on theme setting
  useEffect(() => {
    const updateActualTheme = () => {
      let newActualTheme: 'light' | 'dark' | 'oled' | 'halloween';
      
      if (theme === 'system') {
        newActualTheme = getSystemTheme();
      } else {
        newActualTheme = theme;
      }
      
      setActualTheme(newActualTheme);
      
      // Apply theme to document
      const root = document.documentElement;
      root.classList.remove('light', 'dark', 'oled', 'halloween');
      root.classList.add(newActualTheme);
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', getThemeColor(newActualTheme));
      }
    };

    updateActualTheme();

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateActualTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    storage.set('theme', newTheme);
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'oled', 'halloween', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
    availableThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};