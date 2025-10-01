import i18n from '@/lib/i18n';

export type SupportedLanguage = 'es' | 'en' | 'pt';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['es', 'en', 'pt'];

export const LANGUAGE_NAMES = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
} as const;

export const LANGUAGE_FLAGS = {
  es: '🇪🇸',
  en: '🇺🇸',
  pt: '🇧🇷',
} as const;

/**
 * Detect user's preferred language based on browser settings
 */
export function detectUserLanguage(): SupportedLanguage {
  // Check localStorage first
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)) {
    return savedLanguage as SupportedLanguage;
  }

  // Check navigator language
  const browserLanguage = navigator.language.toLowerCase();
  
  // Direct matches
  if (browserLanguage.startsWith('es')) return 'es';
  if (browserLanguage.startsWith('pt')) return 'pt';
  if (browserLanguage.startsWith('en')) return 'en';

  // Check for specific regions
  const languageMap: Record<string, SupportedLanguage> = {
    'es-es': 'es',
    'es-mx': 'es',
    'es-ar': 'es',
    'es-co': 'es',
    'es-cl': 'es',
    'es-pe': 'es',
    'es-ve': 'es',
    'pt-br': 'pt',
    'pt-pt': 'pt',
    'en-us': 'en',
    'en-gb': 'en',
    'en-ca': 'en',
    'en-au': 'en',
  };

  const mappedLanguage = languageMap[browserLanguage];
  if (mappedLanguage) {
    return mappedLanguage;
  }

  // Check navigator.languages array
  for (const lang of navigator.languages) {
    const normalizedLang = lang.toLowerCase();
    if (normalizedLang.startsWith('es')) return 'es';
    if (normalizedLang.startsWith('pt')) return 'pt';
    if (normalizedLang.startsWith('en')) return 'en';
  }

  // Default to Spanish (primary language)
  return 'es';
}

/**
 * Change the current language
 */
export async function changeLanguage(language: SupportedLanguage): Promise<void> {
  try {
    await i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
    
    // Update document language attribute
    document.documentElement.lang = language;
    
    // Dispatch custom event for components that need to react to language changes
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language } 
    }));
  } catch (error) {
    console.error('Failed to change language:', error);
  }
}

/**
 * Get current language
 */
export function getCurrentLanguage(): SupportedLanguage {
  const currentLang = i18n.language;
  return SUPPORTED_LANGUAGES.includes(currentLang as SupportedLanguage) 
    ? currentLang as SupportedLanguage 
    : 'es';
}

/**
 * Initialize language detection and setup
 */
export function initializeLanguage(): void {
  const detectedLanguage = detectUserLanguage();
  
  // Set initial language if not already set
  if (!i18n.language || i18n.language === 'dev') {
    changeLanguage(detectedLanguage);
  }
  
  // Set document language
  document.documentElement.lang = getCurrentLanguage();
}

/**
 * Format date according to current language
 */
export function formatDateLocalized(date: Date | string): string {
  const d = new Date(date);
  const currentLang = getCurrentLanguage();
  
  const localeMap = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-BR',
  };
  
  return d.toLocaleDateString(localeMap[currentLang], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time according to current language
 */
export function formatTimeLocalized(date: Date | string): string {
  const d = new Date(date);
  const currentLang = getCurrentLanguage();
  
  const localeMap = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-BR',
  };
  
  return d.toLocaleTimeString(localeMap[currentLang], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format numbers according to current language
 */
export function formatNumberLocalized(number: number): string {
  const currentLang = getCurrentLanguage();
  
  const localeMap = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-BR',
  };
  
  return number.toLocaleString(localeMap[currentLang]);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTimeLocalized(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  const currentLang = getCurrentLanguage();
  
  // Define time units in different languages
  const timeUnits = {
    es: {
      now: 'ahora',
      seconds: 'segundos',
      minutes: 'minutos',
      hours: 'horas',
      days: 'días',
      weeks: 'semanas',
      months: 'meses',
      years: 'años',
      ago: 'hace',
    },
    en: {
      now: 'now',
      seconds: 'seconds',
      minutes: 'minutes',
      hours: 'hours',
      days: 'days',
      weeks: 'weeks',
      months: 'months',
      years: 'years',
      ago: 'ago',
    },
    pt: {
      now: 'agora',
      seconds: 'segundos',
      minutes: 'minutos',
      hours: 'horas',
      days: 'dias',
      weeks: 'semanas',
      months: 'meses',
      years: 'anos',
      ago: 'atrás',
    },
  };
  
  const units = timeUnits[currentLang];
  
  if (diffInSeconds < 60) {
    return diffInSeconds < 5 ? units.now : `${units.ago} ${diffInSeconds} ${units.seconds}`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${units.ago} ${diffInMinutes} ${units.minutes}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${units.ago} ${diffInHours} ${units.hours}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${units.ago} ${diffInDays} ${units.days}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${units.ago} ${diffInWeeks} ${units.weeks}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${units.ago} ${diffInMonths} ${units.months}`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${units.ago} ${diffInYears} ${units.years}`;
}