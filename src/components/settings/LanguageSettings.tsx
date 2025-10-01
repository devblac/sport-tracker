import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { 
  getCurrentLanguage, 
  changeLanguage, 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_NAMES, 
  LANGUAGE_FLAGS,
  type SupportedLanguage 
} from '@/utils/languageDetection';
import { cn } from '@/lib/utils';

interface LanguageSettingsProps {
  className?: string;
}

export function LanguageSettings({ className }: LanguageSettingsProps) {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = async (language: SupportedLanguage) => {
    await changeLanguage(language);
    
    // Show success message
    // Note: This would be better with a toast notification
    console.log(`Language changed to ${LANGUAGE_NAMES[language]}`);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t('profile.language')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {t('profile.language')} - {t('common.select')} {t('profile.language').toLowerCase()}
        </div>
        
        {/* Language Options */}
        <div className="space-y-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                currentLanguage === lang
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <span className="text-2xl">{LANGUAGE_FLAGS[lang]}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{LANGUAGE_NAMES[lang]}</div>
                <div className="text-sm text-muted-foreground">
                  {lang === 'es' && 'Idioma principal'}
                  {lang === 'en' && 'Primary language'}
                  {lang === 'pt' && 'Idioma principal'}
                </div>
              </div>
              {currentLanguage === lang && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Language Info */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-1">
              {t('common.info')}
            </div>
            <div>
              {currentLanguage === 'es' && 'La aplicación se reiniciará automáticamente para aplicar el nuevo idioma.'}
              {currentLanguage === 'en' && 'The app will automatically restart to apply the new language.'}
              {currentLanguage === 'pt' && 'O aplicativo será reiniciado automaticamente para aplicar o novo idioma.'}
            </div>
          </div>
        </div>

        {/* Compact Language Selector Alternative */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-muted-foreground mb-2">
            {t('common.or')} {t('common.select')} {t('profile.language').toLowerCase()}:
          </div>
          <LanguageSelector 
            variant="buttons" 
            className="justify-center"
            showFlags={true}
            showLabels={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for use in navigation or settings menu
export function CompactLanguageSettings({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{t('profile.language')}</span>
      </div>
      <LanguageSelector 
        variant="minimal" 
        showFlags={true}
        showLabels={false}
      />
    </div>
  );
}