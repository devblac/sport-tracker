import { describe, it, expect } from 'vitest';
import { 
  SUPPORTED_LANGUAGES, 
  LANGUAGE_NAMES,
  detectUserLanguage 
} from '@/utils/languageDetection';

describe('Basic I18n Configuration', () => {
  it('should have correct supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['es', 'en', 'pt']);
  });

  it('should have language names for all supported languages', () => {
    expect(LANGUAGE_NAMES.es).toBe('Español');
    expect(LANGUAGE_NAMES.en).toBe('English');
    expect(LANGUAGE_NAMES.pt).toBe('Português');
  });

  it('should detect a default language', () => {
    const detected = detectUserLanguage();
    expect(SUPPORTED_LANGUAGES).toContain(detected);
  });
});