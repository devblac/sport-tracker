import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cn,
  formatDate,
  formatTime,
  formatDuration,
  calculateVolume,
  calculateOneRepMax,
  calculateTotalVolume,
  calculateWorkoutXP,
  calculateLevelFromXP,
  calculateXPForNextLevel,
  capitalize,
  truncate,
  slugify,
  groupBy,
  sortBy,
  storage,
  isMobile,
  isIOS,
  isAndroid,
  isPWA,
  canInstallPWA,
  debounce,
  throttle,
  isValidEmail,
  isStrongPassword,
  handleError,
  generateId,
  randomBetween,
  shuffleArray,
} from '../index';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
const navigatorMock = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};
Object.defineProperty(window, 'navigator', {
  value: navigatorMock,
  writable: true,
});

describe('Core Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('hidden-class');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-4', 'px-6');
      expect(result).toBe('px-6'); // Should keep the last one
    });
  });

  describe('Date utilities', () => {
    const testDate = new Date('2025-01-26T15:30:45Z');

    describe('formatDate', () => {
      it('should format date object', () => {
        const result = formatDate(testDate);
        expect(result).toMatch(/26.*ene.*2025/); // Spanish locale format
      });

      it('should format date string', () => {
        const result = formatDate('2025-01-26');
        expect(result).toMatch(/26.*ene.*2025/);
      });
    });

    describe('formatTime', () => {
      it('should format time from date object', () => {
        const result = formatTime(testDate);
        expect(result).toMatch(/\d{2}:\d{2}/); // HH:MM format
      });

      it('should format time from date string', () => {
        const result = formatTime('2025-01-26T15:30:45Z');
        expect(result).toMatch(/\d{2}:\d{2}/);
      });
    });

    describe('formatDuration', () => {
      it('should format seconds only', () => {
        expect(formatDuration(45)).toBe('45s');
      });

      it('should format minutes and seconds', () => {
        expect(formatDuration(90)).toBe('1m 30s');
        expect(formatDuration(120)).toBe('2m 0s');
      });

      it('should format hours and minutes', () => {
        expect(formatDuration(3600)).toBe('1h 0m');
        expect(formatDuration(3900)).toBe('1h 5m');
      });

      it('should handle zero duration', () => {
        expect(formatDuration(0)).toBe('0s');
      });
    });
  });

  describe('Workout calculations', () => {
    describe('calculateVolume', () => {
      it('should calculate volume correctly', () => {
        expect(calculateVolume(100, 10)).toBe(1000);
        expect(calculateVolume(0, 10)).toBe(0);
        expect(calculateVolume(100, 0)).toBe(0);
      });
    });

    describe('calculateOneRepMax', () => {
      it('should return weight for 1 rep', () => {
        expect(calculateOneRepMax(100, 1)).toBe(100);
      });

      it('should calculate 1RM using Epley formula', () => {
        expect(calculateOneRepMax(100, 10)).toBe(133); // 100 * (1 + 10/30) = 133.33, rounded
      });

      it('should handle edge cases', () => {
        expect(calculateOneRepMax(0, 10)).toBe(0);
        expect(calculateOneRepMax(100, 0)).toBe(0);
      });
    });

    describe('calculateTotalVolume', () => {
      const sets = [
        { weight: 100, reps: 10, type: 'normal' },
        { weight: 50, reps: 10, type: 'warmup' }, // Should be excluded
        { weight: 105, reps: 8, type: 'normal' },
      ];

      it('should calculate total volume excluding warmup sets', () => {
        const result = calculateTotalVolume(sets);
        expect(result).toBe(1840); // (100*10) + (105*8) = 1000 + 840
      });

      it('should handle empty sets array', () => {
        expect(calculateTotalVolume([])).toBe(0);
      });

      it('should handle all warmup sets', () => {
        const warmupSets = [
          { weight: 50, reps: 10, type: 'warmup' },
          { weight: 60, reps: 8, type: 'warmup' },
        ];
        expect(calculateTotalVolume(warmupSets)).toBe(0);
      });
    });
  });

  describe('XP calculations', () => {
    describe('calculateWorkoutXP', () => {
      it('should calculate base XP correctly', () => {
        const xp = calculateWorkoutXP(3600, 2000, 5); // 1 hour, 2000kg, 5 exercises
        expect(xp).toBeGreaterThan(50); // Should be more than base XP
        expect(typeof xp).toBe('number');
      });

      it('should cap duration bonus', () => {
        const xp1 = calculateWorkoutXP(7200, 1000, 3); // 2 hours
        const xp2 = calculateWorkoutXP(10800, 1000, 3); // 3 hours
        expect(xp1).toBe(xp2); // Should be capped at 2 hours
      });

      it('should handle zero values', () => {
        const xp = calculateWorkoutXP(0, 0, 0);
        expect(xp).toBe(50); // Should return base XP
      });
    });

    describe('calculateLevelFromXP', () => {
      it('should calculate level correctly', () => {
        expect(calculateLevelFromXP(0)).toBe(1);
        expect(calculateLevelFromXP(100)).toBe(2);
        expect(calculateLevelFromXP(400)).toBe(3);
        expect(calculateLevelFromXP(900)).toBe(4);
      });
    });

    describe('calculateXPForNextLevel', () => {
      it('should calculate XP needed for next level', () => {
        expect(calculateXPForNextLevel(1)).toBe(100); // 1^2 * 100
        expect(calculateXPForNextLevel(2)).toBe(400); // 2^2 * 100
        expect(calculateXPForNextLevel(3)).toBe(900); // 3^2 * 100
      });
    });
  });

  describe('String utilities', () => {
    describe('capitalize', () => {
      it('should capitalize first letter and lowercase rest', () => {
        expect(capitalize('hello')).toBe('Hello');
        expect(capitalize('HELLO')).toBe('Hello');
        expect(capitalize('hELLO wORLD')).toBe('Hello world');
      });

      it('should handle empty string', () => {
        expect(capitalize('')).toBe('');
      });

      it('should handle single character', () => {
        expect(capitalize('a')).toBe('A');
        expect(capitalize('A')).toBe('A');
      });
    });

    describe('truncate', () => {
      it('should truncate long strings', () => {
        expect(truncate('Hello World', 5)).toBe('Hello...');
      });

      it('should not truncate short strings', () => {
        expect(truncate('Hello', 10)).toBe('Hello');
      });

      it('should handle exact length', () => {
        expect(truncate('Hello', 5)).toBe('Hello');
      });

      it('should handle empty string', () => {
        expect(truncate('', 5)).toBe('');
      });
    });

    describe('slugify', () => {
      it('should create URL-friendly slugs', () => {
        expect(slugify('Hello World')).toBe('hello-world');
        expect(slugify('Hello, World!')).toBe('hello-world');
        expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      });

      it('should handle special characters', () => {
        expect(slugify('Café & Restaurant')).toBe('caf-restaurant');
        expect(slugify('100% Pure')).toBe('100-pure');
      });

      it('should handle underscores and hyphens', () => {
        expect(slugify('hello_world-test')).toBe('hello-world-test');
      });
    });
  });

  describe('Array utilities', () => {
    const testData = [
      { name: 'John', age: 30, category: 'A' },
      { name: 'Jane', age: 25, category: 'B' },
      { name: 'Bob', age: 35, category: 'A' },
    ];

    describe('groupBy', () => {
      it('should group array by key', () => {
        const grouped = groupBy(testData, 'category');
        expect(grouped.A).toHaveLength(2);
        expect(grouped.B).toHaveLength(1);
        expect(grouped.A[0].name).toBe('John');
        expect(grouped.A[1].name).toBe('Bob');
      });

      it('should handle empty array', () => {
        const grouped = groupBy([], 'category');
        expect(grouped).toEqual({});
      });
    });

    describe('sortBy', () => {
      it('should sort ascending by default', () => {
        const sorted = sortBy(testData, 'age');
        expect(sorted[0].age).toBe(25);
        expect(sorted[1].age).toBe(30);
        expect(sorted[2].age).toBe(35);
      });

      it('should sort descending when specified', () => {
        const sorted = sortBy(testData, 'age', 'desc');
        expect(sorted[0].age).toBe(35);
        expect(sorted[1].age).toBe(30);
        expect(sorted[2].age).toBe(25);
      });

      it('should not mutate original array', () => {
        const original = [...testData];
        sortBy(testData, 'age');
        expect(testData).toEqual(original);
      });
    });
  });

  describe('Storage utilities', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockClear();
      localStorageMock.setItem.mockClear();
      localStorageMock.removeItem.mockClear();
      localStorageMock.clear.mockClear();
    });

    describe('storage.get', () => {
      it('should get and parse stored value', () => {
        localStorageMock.getItem.mockReturnValue('{"name":"test"}');
        const result = storage.get('test-key');
        expect(result).toEqual({ name: 'test' });
        expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
      });

      it('should return default value when key not found', () => {
        localStorageMock.getItem.mockReturnValue(null);
        const result = storage.get('missing-key', 'default');
        expect(result).toBe('default');
      });

      it('should handle JSON parse errors', () => {
        localStorageMock.getItem.mockReturnValue('invalid-json');
        const result = storage.get('test-key', 'default');
        expect(result).toBe('default');
      });
    });

    describe('storage.set', () => {
      it('should stringify and store value', () => {
        storage.set('test-key', { name: 'test' });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '{"name":"test"}');
      });

      it('should handle storage errors gracefully', () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error('Storage full');
        });
        expect(() => storage.set('test-key', 'value')).not.toThrow();
      });
    });

    describe('storage.remove', () => {
      it('should remove item from storage', () => {
        storage.remove('test-key');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
      });
    });

    describe('storage.clear', () => {
      it('should clear all storage', () => {
        storage.clear();
        expect(localStorageMock.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Device detection', () => {
    describe('isMobile', () => {
      it('should detect mobile devices', () => {
        Object.defineProperty(window, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
          writable: true,
        });
        expect(isMobile()).toBe(true);
      });

      it('should detect desktop devices', () => {
        Object.defineProperty(window, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          writable: true,
        });
        expect(isMobile()).toBe(false);
      });
    });

    describe('isIOS', () => {
      it('should detect iOS devices', () => {
        Object.defineProperty(window, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
          writable: true,
        });
        expect(isIOS()).toBe(true);
      });

      it('should not detect non-iOS devices', () => {
        Object.defineProperty(window, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (Android 10; Mobile; rv:81.0)' },
          writable: true,
        });
        expect(isIOS()).toBe(false);
      });
    });

    describe('isAndroid', () => {
      it('should detect Android devices', () => {
        Object.defineProperty(window, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (Android 10; Mobile; rv:81.0)' },
          writable: true,
        });
        expect(isAndroid()).toBe(true);
      });

      it('should not detect non-Android devices', () => {
        Object.defineProperty(window, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
          writable: true,
        });
        expect(isAndroid()).toBe(false);
      });
    });
  });

  describe('Function utilities', () => {
    describe('debounce', () => {
      it('should debounce function calls', async () => {
        const mockFn = vi.fn();
        const debouncedFn = debounce(mockFn, 100);

        debouncedFn('call1');
        debouncedFn('call2');
        debouncedFn('call3');

        expect(mockFn).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 150));
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('call3');
      });
    });

    describe('throttle', () => {
      it('should throttle function calls', async () => {
        const mockFn = vi.fn();
        const throttledFn = throttle(mockFn, 100);

        throttledFn('call1');
        throttledFn('call2');
        throttledFn('call3');

        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('call1');

        await new Promise(resolve => setTimeout(resolve, 150));
        throttledFn('call4');
        expect(mockFn).toHaveBeenCalledTimes(2);
        expect(mockFn).toHaveBeenCalledWith('call4');
      });
    });
  });

  describe('Validation utilities', () => {
    describe('isValidEmail', () => {
      it('should validate correct email addresses', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
        expect(isValidEmail('user+tag@example.org')).toBe(true);
      });

      it('should reject invalid email addresses', () => {
        expect(isValidEmail('invalid-email')).toBe(false);
        expect(isValidEmail('test@')).toBe(false);
        expect(isValidEmail('@example.com')).toBe(false);
        expect(isValidEmail('test..test@example.com')).toBe(false);
      });
    });

    describe('isStrongPassword', () => {
      it('should validate strong passwords', () => {
        expect(isStrongPassword('Password123')).toBe(true);
        expect(isStrongPassword('MyStr0ngP@ss')).toBe(true);
      });

      it('should reject weak passwords', () => {
        expect(isStrongPassword('password')).toBe(false); // No uppercase or number
        expect(isStrongPassword('PASSWORD')).toBe(false); // No lowercase or number
        expect(isStrongPassword('Password')).toBe(false); // No number
        expect(isStrongPassword('Pass123')).toBe(false); // Too short
      });
    });
  });

  describe('Error handling', () => {
    describe('handleError', () => {
      it('should handle Error objects', () => {
        const error = new Error('Test error');
        expect(handleError(error)).toBe('Test error');
      });

      it('should handle string errors', () => {
        expect(handleError('String error')).toBe('String error');
      });

      it('should handle unknown error types', () => {
        expect(handleError({ unknown: 'error' })).toBe('An unexpected error occurred');
        expect(handleError(null)).toBe('An unexpected error occurred');
        expect(handleError(undefined)).toBe('An unexpected error occurred');
      });
    });
  });

  describe('Random utilities', () => {
    describe('generateId', () => {
      it('should generate unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
        expect(typeof id1).toBe('string');
        expect(id1.length).toBeGreaterThan(0);
      });
    });

    describe('randomBetween', () => {
      it('should generate numbers within range', () => {
        for (let i = 0; i < 100; i++) {
          const result = randomBetween(1, 10);
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(10);
        }
      });

      it('should handle single value range', () => {
        expect(randomBetween(5, 5)).toBe(5);
      });
    });

    describe('shuffleArray', () => {
      it('should shuffle array elements', () => {
        const original = [1, 2, 3, 4, 5];
        const shuffled = shuffleArray(original);
        
        expect(shuffled).toHaveLength(original.length);
        expect(shuffled).toEqual(expect.arrayContaining(original));
        expect(shuffled).not.toBe(original); // Should not mutate original
      });

      it('should handle empty array', () => {
        expect(shuffleArray([])).toEqual([]);
      });

      it('should handle single element array', () => {
        expect(shuffleArray([1])).toEqual([1]);
      });
    });
  });
});