import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { 
  changeLanguage, 
  getCurrentLanguage, 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_NAMES, 
  LANGUAGE_FLAGS,
  type SupportedLanguage 
} from '@/utils/languageDetection';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'buttons' | 'minimal';
  showFlags?: boolean;
  showLabels?: boolean;
}

export function LanguageSelector({ 
  className,
  variant = 'dropdown',
  showFlags = true,
  showLabels = true
}: LanguageSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = async (language: SupportedLanguage) => {
    await changeLanguage(language);
    setIsOpen(false);
  };

  if (variant === 'buttons') {
    return (
      <div className={cn('flex gap-1', className)}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={cn(
              'px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              currentLanguage === lang
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {showFlags && LANGUAGE_FLAGS[lang]} {showLabels && LANGUAGE_NAMES[lang]}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex gap-2', className)}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              currentLanguage === lang
                ? 'bg-primary text-primary-foreground scale-110'
                : 'text-gray-600 dark:text-gray-400 hover:scale-105'
            )}
            title={LANGUAGE_NAMES[lang]}
          >
            {LANGUAGE_FLAGS[lang]}
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
      >
        <Globe className="w-4 h-4" />
        {showFlags && LANGUAGE_FLAGS[currentLanguage]}
        {showLabels && LANGUAGE_NAMES[currentLanguage]}
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={cn(
            'absolute top-full left-0 mt-1 w-full min-w-[160px] z-20',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'rounded-md shadow-lg py-1'
          )}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm',
                  'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  'text-left'
                )}
              >
                {showFlags && (
                  <span className="text-lg">{LANGUAGE_FLAGS[lang]}</span>
                )}
                {showLabels && (
                  <span className="flex-1">{LANGUAGE_NAMES[lang]}</span>
                )}
                {currentLanguage === lang && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Hook for using language selector in other components
export function useLanguageSelector() {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  return {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    languageNames: LANGUAGE_NAMES,
    languageFlags: LANGUAGE_FLAGS,
    t,
  };
}