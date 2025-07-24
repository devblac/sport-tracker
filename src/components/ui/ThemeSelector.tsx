import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from './Button';
import { Card } from './Card';

interface ThemeSelectorProps {
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className = '' }) => {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Theme</h3>
      <div className="grid grid-cols-1 gap-2">
        {availableThemes.map((themeOption) => (
          <Button
            key={themeOption.value}
            variant={theme === themeOption.value ? 'primary' : 'secondary'}
            onClick={() => setTheme(themeOption.value)}
            className="justify-start text-left"
          >
            <div>
              <div className="font-medium">{themeOption.label}</div>
              <div className="text-sm opacity-70">{themeOption.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};

// Quick theme toggle button for navigation
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { actualTheme, toggleTheme } = useTheme();
  
  const getThemeIcon = () => {
    switch (actualTheme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'oled':
        return '⚫';
      case 'halloween':
        return '🎃';
      default:
        return '☀️';
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      className={`w-10 h-10 p-0 ${className}`}
      aria-label="Toggle theme"
    >
      <span className="text-lg">{getThemeIcon()}</span>
    </Button>
  );
};