import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n from '@/lib/i18n';
import { 
  detectUserLanguage, 
  changeLanguage, 
  getCurrentLanguage,
  formatDateLocalized,
  formatTimeLocalized,
  formatNumberLocalized,
  getRelativeTimeLocalized,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES
} from '@/utils/languageDetection';
import { 
  translateExerciseContent, 
  translateAchievementContent,
  getLocalizedUIContent 
} from '@/utils/dynamicTranslations';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    language: 'es-ES',
    languages: ['es-ES', 'es', 'en-US', 'en'],
  },
  writable: true
});

describe('Internationalization System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Language Detection', () => {
    it('should detect Spanish as default language', () => {
      const detected = detectUserLanguage();
      expect(detected).toBe('es');
    });

    it('should detect English from navigator.language', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'en-US',
          languages: ['en-US', 'en'],
        },
        writable: true
      });

      const detected = detectUserLanguage();
      expect(detected).toBe('en');
    });

    it('should detect Portuguese from navigator.language', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'pt-BR',
          languages: ['pt-BR', 'pt'],
        },
        writable: true
      });

      const detected = detectUserLanguage();
      expect(detected).toBe('pt');
    });

    it('should use saved language from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('en');
      const detected = detectUserLanguage();
      expect(detected).toBe('en');
    });

    it('should fallback to Spanish for unsupported languages', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'fr-FR',
          languages: ['fr-FR', 'fr'],
        },
        writable: true
      });

      const detected = detectUserLanguage();
      expect(detected).toBe('es');
    });
  });

  describe('Language Switching', () => {
    it('should change language successfully', async () => {
      await changeLanguage('en');
      expect(getCurrentLanguage()).toBe('en');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('i18nextLng', 'en');
    });

    it('should update document language attribute', async () => {
      await changeLanguage('pt');
      expect(document.documentElement.lang).toBe('pt');
    });

    it('should dispatch language change event', async () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent');
      await changeLanguage('en');
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'languageChanged',
          detail: { language: 'en' }
        })
      );
    });
  });

  describe('Translation Functions', () => {
    beforeEach(async () => {
      await i18n.init();
    });

    it('should translate common UI elements', () => {
      const ui = getLocalizedUIContent();
      
      expect(ui.loading).toBeDefined();
      expect(ui.home).toBeDefined();
      expect(ui.workout).toBeDefined();
      expect(ui.kg).toBeDefined();
    });

    it('should translate exercise content', () => {
      const exercise = {
        id: 'test-exercise',
        name: 'Push-ups',
        category: 'strength',
        body_parts: ['chest', 'arms'],
        muscle_groups: ['pectorals', 'triceps_brachii'],
        equipment: 'none',
        difficulty_level: 2,
        tags: ['bodyweight', 'upper_body'],
        instructions: [
          { step_number: 1, instruction: 'Start in plank position' }
        ],
        tips: [
          { category: 'form', tip: 'Keep your core tight' }
        ],
        created_at: new Date(),
        updated_at: new Date()
      };

      const translated = translateExerciseContent(exercise);
      expect(translated).toBeDefined();
      expect(translated.name).toBeDefined();
      expect(translated.category).toBeDefined();
    });

    it('should translate achievement content', () => {
      const achievement = {
        id: 'streak_7_days',
        name: 'Week Warrior',
        description: 'Maintain a 7-day workout streak',
        icon: '📅',
        category: 'consistency',
        rarity: 'uncommon' as const,
        isSecret: false,
        isRepeatable: false,
        requirements: {
          type: 'streak_days' as const,
          target: 7,
          timeframe: null
        },
        rewards: {
          xp: 300,
          title: 'Consistent'
        },
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const translated = translateAchievementContent(achievement);
      expect(translated).toBeDefined();
      expect(translated.category).toBeDefined();
      expect(translated.rarity).toBeDefined();
    });
  });

  describe('Localized Formatting', () => {
    it('should format dates according to language', () => {
      const testDate = new Date('2025-01-26');
      
      // Test Spanish formatting
      const spanishDate = formatDateLocalized(testDate);
      expect(spanishDate).toMatch(/26.*ene.*2025/i);
    });

    it('should format time according to language', () => {
      const testDate = new Date('2025-01-26T14:30:00');
      const formattedTime = formatTimeLocalized(testDate);
      expect(formattedTime).toMatch(/14:30/);
    });

    it('should format numbers according to language', () => {
      const number = 1234.56;
      const formatted = formatNumberLocalized(number);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should generate relative time strings', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const relative = getRelativeTimeLocalized(oneHourAgo);
      expect(relative).toContain('1');
      expect(relative).toMatch(/hora|hour/i);
    });
  });

  describe('Supported Languages', () => {
    it('should have all required languages', () => {
      expect(SUPPORTED_LANGUAGES).toContain('es');
      expect(SUPPORTED_LANGUAGES).toContain('en');
      expect(SUPPORTED_LANGUAGES).toContain('pt');
    });

    it('should have language names for all supported languages', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(LANGUAGE_NAMES[lang]).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle translation errors gracefully', () => {
      const exercise = {
        id: 'invalid-exercise',
        name: 'Invalid Exercise',
        category: 'invalid_category',
        body_parts: ['invalid_part'],
        muscle_groups: ['invalid_muscle'],
        equipment: 'invalid_equipment',
        difficulty_level: 999,
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(() => translateExerciseContent(exercise)).not.toThrow();
    });

    it('should fallback to original content when translation fails', () => {
      const originalExercise = {
        id: 'test',
        name: 'Original Name',
        category: 'original_category',
        body_parts: ['original_part'],
        muscle_groups: ['original_muscle'],
        equipment: 'original_equipment',
        difficulty_level: 1,
        created_at: new Date(),
        updated_at: new Date()
      };

      const translated = translateExerciseContent(originalExercise);
      expect(translated.name).toBeDefined();
    });
  });
});