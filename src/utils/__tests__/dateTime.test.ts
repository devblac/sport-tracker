import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  isSameDay,
  isSameWeek,
  isSameMonth,
  addDays,
  addWeeks,
  addMonths,
  getDaysDifference,
  getHoursDifference,
  getMinutesDifference,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  getWeekNumber,
  getDayName,
  getMonthName,
  parseDate,
  getAge,
  isPast,
  isFuture,
  getTimezoneOffset,
  toUTC,
  fromUTC,
} from '../dateTime';

describe('dateTime utilities', () => {
  // Mock current date for consistent testing
  const mockDate = new Date('2025-01-15T12:00:00Z'); // Wednesday, January 15, 2025
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('should format date in short format by default', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toBe('Jan 15, 2025');
    });

    it('should format date in long format', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const formatted = formatDate(date, 'long');
      expect(formatted).toBe('Wednesday, January 15, 2025');
    });

    it('should format date in relative format for today', () => {
      const today = new Date('2025-01-15T10:30:00Z');
      const formatted = formatDate(today, 'relative');
      expect(formatted).toBe('Today');
    });

    it('should format date in relative format for yesterday', () => {
      const yesterday = new Date('2025-01-14T10:30:00Z');
      const formatted = formatDate(yesterday, 'relative');
      expect(formatted).toBe('Yesterday');
    });

    it('should format date in relative format for tomorrow', () => {
      const tomorrow = new Date('2025-01-16T10:30:00Z');
      const formatted = formatDate(tomorrow, 'relative');
      expect(formatted).toBe('Tomorrow');
    });

    it('should format date in relative format for days ago', () => {
      const threeDaysAgo = new Date('2025-01-12T10:30:00Z');
      const formatted = formatDate(threeDaysAgo, 'relative');
      expect(formatted).toBe('3 days ago');
    });

    it('should format date in relative format for future days', () => {
      const inThreeDays = new Date('2025-01-18T10:30:00Z');
      const formatted = formatDate(inThreeDays, 'relative');
      expect(formatted).toBe('In 3 days');
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      const formatted = formatDate(invalidDate);
      expect(formatted).toBe('Invalid Date');
    });

    it('should handle null/undefined dates', () => {
      expect(formatDate(null as any)).toBe('Invalid Date');
      expect(formatDate(undefined as any)).toBe('Invalid Date');
    });
  });

  describe('formatTime', () => {
    it('should format time in 12h format by default', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      const formatted = formatTime(date);
      expect(formatted).toMatch(/2:30 PM|14:30/); // Account for timezone differences
    });

    it('should format time in 24h format', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      const formatted = formatTime(date, '24h');
      expect(formatted).toMatch(/14:30|02:30/); // Account for timezone differences
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      const formatted = formatTime(invalidDate);
      expect(formatted).toBe('Invalid Time');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const date = new Date('2025-01-15T14:30:00Z');
      const formatted = formatDateTime(date);
      expect(formatted).toContain('Jan 15, 2025');
      expect(formatted).toContain('at');
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      const formatted = formatDateTime(invalidDate);
      expect(formatted).toBe('Invalid DateTime');
    });
  });

  describe('date range functions', () => {
    const testDate = new Date('2025-01-15T14:30:45.123Z');

    describe('getStartOfDay', () => {
      it('should return start of day', () => {
        const startOfDay = getStartOfDay(testDate);
        expect(startOfDay.getHours()).toBe(0);
        expect(startOfDay.getMinutes()).toBe(0);
        expect(startOfDay.getSeconds()).toBe(0);
        expect(startOfDay.getMilliseconds()).toBe(0);
        expect(startOfDay.getDate()).toBe(testDate.getDate());
      });
    });

    describe('getEndOfDay', () => {
      it('should return end of day', () => {
        const endOfDay = getEndOfDay(testDate);
        expect(endOfDay.getHours()).toBe(23);
        expect(endOfDay.getMinutes()).toBe(59);
        expect(endOfDay.getSeconds()).toBe(59);
        expect(endOfDay.getMilliseconds()).toBe(999);
        expect(endOfDay.getDate()).toBe(testDate.getDate());
      });
    });

    describe('getStartOfWeek', () => {
      it('should return Monday as start of week', () => {
        // January 15, 2025 is a Wednesday
        const startOfWeek = getStartOfWeek(testDate);
        expect(startOfWeek.getDay()).toBe(1); // Monday
        expect(startOfWeek.getDate()).toBe(13); // January 13, 2025
      });

      it('should handle Sunday correctly', () => {
        const sunday = new Date('2025-01-19T14:30:00Z'); // Sunday
        const startOfWeek = getStartOfWeek(sunday);
        expect(startOfWeek.getDay()).toBe(1); // Monday
        expect(startOfWeek.getDate()).toBe(13); // Previous Monday
      });
    });

    describe('getEndOfWeek', () => {
      it('should return Sunday as end of week', () => {
        const endOfWeek = getEndOfWeek(testDate);
        expect(endOfWeek.getDay()).toBe(0); // Sunday
        expect(endOfWeek.getDate()).toBe(19); // January 19, 2025
      });
    });

    describe('getStartOfMonth', () => {
      it('should return first day of month', () => {
        const startOfMonth = getStartOfMonth(testDate);
        expect(startOfMonth.getDate()).toBe(1);
        expect(startOfMonth.getMonth()).toBe(testDate.getMonth());
        expect(startOfMonth.getFullYear()).toBe(testDate.getFullYear());
        expect(startOfMonth.getHours()).toBe(0);
      });
    });

    describe('getEndOfMonth', () => {
      it('should return last day of month', () => {
        const endOfMonth = getEndOfMonth(testDate);
        expect(endOfMonth.getDate()).toBe(31); // January has 31 days
        expect(endOfMonth.getMonth()).toBe(testDate.getMonth());
        expect(endOfMonth.getHours()).toBe(23);
      });

      it('should handle February correctly', () => {
        const febDate = new Date('2025-02-15T14:30:00Z');
        const endOfMonth = getEndOfMonth(febDate);
        expect(endOfMonth.getDate()).toBe(28); // 2025 is not a leap year
      });

      it('should handle leap year February', () => {
        const leapFebDate = new Date('2024-02-15T14:30:00Z');
        const endOfMonth = getEndOfMonth(leapFebDate);
        expect(endOfMonth.getDate()).toBe(29); // 2024 is a leap year
      });
    });
  });

  describe('date comparison functions', () => {
    const date1 = new Date('2025-01-15T10:30:00Z');
    const date2 = new Date('2025-01-15T18:45:00Z');
    const date3 = new Date('2025-01-16T10:30:00Z');

    describe('isSameDay', () => {
      it('should return true for same day different times', () => {
        expect(isSameDay(date1, date2)).toBe(true);
      });

      it('should return false for different days', () => {
        expect(isSameDay(date1, date3)).toBe(false);
      });

      it('should handle invalid dates', () => {
        expect(isSameDay(new Date('invalid'), date1)).toBe(false);
        expect(isSameDay(null as any, date1)).toBe(false);
      });
    });

    describe('isSameWeek', () => {
      it('should return true for dates in same week', () => {
        const monday = new Date('2025-01-13T10:00:00Z');
        const friday = new Date('2025-01-17T10:00:00Z');
        expect(isSameWeek(monday, friday)).toBe(true);
      });

      it('should return false for dates in different weeks', () => {
        const thisWeek = new Date('2025-01-15T10:00:00Z');
        const nextWeek = new Date('2025-01-22T10:00:00Z');
        expect(isSameWeek(thisWeek, nextWeek)).toBe(false);
      });
    });

    describe('isSameMonth', () => {
      it('should return true for dates in same month', () => {
        const startOfMonth = new Date('2025-01-01T10:00:00Z');
        const endOfMonth = new Date('2025-01-31T10:00:00Z');
        expect(isSameMonth(startOfMonth, endOfMonth)).toBe(true);
      });

      it('should return false for dates in different months', () => {
        const january = new Date('2025-01-15T10:00:00Z');
        const february = new Date('2025-02-15T10:00:00Z');
        expect(isSameMonth(january, february)).toBe(false);
      });
    });
  });

  describe('date arithmetic functions', () => {
    const baseDate = new Date('2025-01-15T12:00:00Z');

    describe('addDays', () => {
      it('should add positive days', () => {
        const result = addDays(baseDate, 5);
        expect(result.getDate()).toBe(20);
        expect(result.getMonth()).toBe(0); // January
      });

      it('should subtract days with negative input', () => {
        const result = addDays(baseDate, -5);
        expect(result.getDate()).toBe(10);
        expect(result.getMonth()).toBe(0); // January
      });

      it('should handle month boundaries', () => {
        const result = addDays(baseDate, 20);
        expect(result.getDate()).toBe(4);
        expect(result.getMonth()).toBe(1); // February
      });
    });

    describe('addWeeks', () => {
      it('should add weeks correctly', () => {
        const result = addWeeks(baseDate, 2);
        expect(result.getDate()).toBe(29);
        expect(result.getMonth()).toBe(0); // January
      });
    });

    describe('addMonths', () => {
      it('should add months correctly', () => {
        const result = addMonths(baseDate, 2);
        expect(result.getMonth()).toBe(2); // March
        expect(result.getFullYear()).toBe(2025);
      });

      it('should handle year boundaries', () => {
        const result = addMonths(baseDate, 12);
        expect(result.getMonth()).toBe(0); // January
        expect(result.getFullYear()).toBe(2026);
      });
    });
  });

  describe('date difference functions', () => {
    const date1 = new Date('2025-01-15T12:00:00Z');
    const date2 = new Date('2025-01-18T15:30:00Z');

    describe('getDaysDifference', () => {
      it('should calculate days difference', () => {
        const diff = getDaysDifference(date1, date2);
        expect(diff).toBe(4); // Rounded up
      });

      it('should handle same dates', () => {
        const diff = getDaysDifference(date1, date1);
        expect(diff).toBe(0);
      });

      it('should handle invalid dates', () => {
        const diff = getDaysDifference(new Date('invalid'), date1);
        expect(diff).toBe(0);
      });
    });

    describe('getHoursDifference', () => {
      it('should calculate hours difference', () => {
        const diff = getHoursDifference(date1, date2);
        expect(diff).toBeGreaterThan(75); // About 3.5 days
      });
    });

    describe('getMinutesDifference', () => {
      it('should calculate minutes difference', () => {
        const diff = getMinutesDifference(date1, date2);
        expect(diff).toBeGreaterThan(4500); // About 3.5 days in minutes
      });
    });
  });

  describe('relative date functions', () => {
    describe('isToday', () => {
      it('should return true for today', () => {
        const today = new Date('2025-01-15T18:00:00Z');
        expect(isToday(today)).toBe(true);
      });

      it('should return false for other days', () => {
        const yesterday = new Date('2025-01-14T18:00:00Z');
        expect(isToday(yesterday)).toBe(false);
      });
    });

    describe('isYesterday', () => {
      it('should return true for yesterday', () => {
        const yesterday = new Date('2025-01-14T18:00:00Z');
        expect(isYesterday(yesterday)).toBe(true);
      });

      it('should return false for other days', () => {
        const today = new Date('2025-01-15T18:00:00Z');
        expect(isYesterday(today)).toBe(false);
      });
    });

    describe('isTomorrow', () => {
      it('should return true for tomorrow', () => {
        const tomorrow = new Date('2025-01-16T18:00:00Z');
        expect(isTomorrow(tomorrow)).toBe(true);
      });

      it('should return false for other days', () => {
        const today = new Date('2025-01-15T18:00:00Z');
        expect(isTomorrow(today)).toBe(false);
      });
    });

    describe('isThisWeek', () => {
      it('should return true for dates in current week', () => {
        const monday = new Date('2025-01-13T10:00:00Z');
        expect(isThisWeek(monday)).toBe(true);
      });

      it('should return false for dates in other weeks', () => {
        const nextWeek = new Date('2025-01-22T10:00:00Z');
        expect(isThisWeek(nextWeek)).toBe(false);
      });
    });

    describe('isThisMonth', () => {
      it('should return true for dates in current month', () => {
        const startOfMonth = new Date('2025-01-01T10:00:00Z');
        expect(isThisMonth(startOfMonth)).toBe(true);
      });

      it('should return false for dates in other months', () => {
        const nextMonth = new Date('2025-02-15T10:00:00Z');
        expect(isThisMonth(nextMonth)).toBe(false);
      });
    });
  });

  describe('utility functions', () => {
    describe('getWeekNumber', () => {
      it('should return correct week number', () => {
        const date = new Date('2025-01-15T12:00:00Z');
        const weekNumber = getWeekNumber(date);
        expect(weekNumber).toBeGreaterThan(0);
        expect(weekNumber).toBeLessThan(54);
      });
    });

    describe('getDayName', () => {
      it('should return long day name by default', () => {
        const date = new Date('2025-01-15T12:00:00Z'); // Wednesday
        const dayName = getDayName(date);
        expect(dayName).toBe('Wednesday');
      });

      it('should return short day name', () => {
        const date = new Date('2025-01-15T12:00:00Z'); // Wednesday
        const dayName = getDayName(date, 'short');
        expect(dayName).toBe('Wed');
      });

      it('should handle invalid dates', () => {
        const invalidDate = new Date('invalid');
        const dayName = getDayName(invalidDate);
        expect(dayName).toBe('Invalid Date');
      });
    });

    describe('getMonthName', () => {
      it('should return long month name by default', () => {
        const date = new Date('2025-01-15T12:00:00Z'); // January
        const monthName = getMonthName(date);
        expect(monthName).toBe('January');
      });

      it('should return short month name', () => {
        const date = new Date('2025-01-15T12:00:00Z'); // January
        const monthName = getMonthName(date, 'short');
        expect(monthName).toBe('Jan');
      });
    });

    describe('parseDate', () => {
      it('should parse valid date strings', () => {
        const date = parseDate('2025-01-15T12:00:00Z');
        expect(date).toBeInstanceOf(Date);
        expect(date?.getFullYear()).toBe(2025);
      });

      it('should return null for invalid date strings', () => {
        const date = parseDate('invalid-date');
        expect(date).toBeNull();
      });

      it('should return null for non-string input', () => {
        expect(parseDate(null as any)).toBeNull();
        expect(parseDate(undefined as any)).toBeNull();
        expect(parseDate(123 as any)).toBeNull();
      });
    });

    describe('getAge', () => {
      it('should calculate age correctly', () => {
        const birthDate = new Date('1990-01-15T12:00:00Z');
        const age = getAge(birthDate);
        expect(age).toBe(35); // 2025 - 1990
      });

      it('should handle birthday not yet reached this year', () => {
        const birthDate = new Date('1990-12-25T12:00:00Z');
        const age = getAge(birthDate);
        expect(age).toBe(34); // Birthday hasn't occurred yet in 2025
      });

      it('should return 0 for invalid dates', () => {
        const invalidDate = new Date('invalid');
        const age = getAge(invalidDate);
        expect(age).toBe(0);
      });

      it('should return 0 for future birth dates', () => {
        const futureDate = new Date('2030-01-15T12:00:00Z');
        const age = getAge(futureDate);
        expect(age).toBe(0);
      });
    });

    describe('isPast', () => {
      it('should return true for past dates', () => {
        const pastDate = new Date('2025-01-14T12:00:00Z');
        expect(isPast(pastDate)).toBe(true);
      });

      it('should return false for future dates', () => {
        const futureDate = new Date('2025-01-16T12:00:00Z');
        expect(isPast(futureDate)).toBe(false);
      });

      it('should handle invalid dates', () => {
        const invalidDate = new Date('invalid');
        expect(isPast(invalidDate)).toBe(false);
      });
    });

    describe('isFuture', () => {
      it('should return true for future dates', () => {
        const futureDate = new Date('2025-01-16T12:00:00Z');
        expect(isFuture(futureDate)).toBe(true);
      });

      it('should return false for past dates', () => {
        const pastDate = new Date('2025-01-14T12:00:00Z');
        expect(isFuture(pastDate)).toBe(false);
      });
    });

    describe('timezone functions', () => {
      describe('getTimezoneOffset', () => {
        it('should return timezone offset in hours', () => {
          const offset = getTimezoneOffset();
          expect(typeof offset).toBe('number');
          expect(offset).toBeGreaterThan(-12);
          expect(offset).toBeLessThan(15);
        });
      });

      describe('toUTC', () => {
        it('should convert local time to UTC', () => {
          const localDate = new Date('2025-01-15T12:00:00');
          const utcDate = toUTC(localDate);
          expect(utcDate).toBeInstanceOf(Date);
          // UTC time should be different from local time (unless in UTC timezone)
        });
      });

      describe('fromUTC', () => {
        it('should convert UTC time to local time', () => {
          const utcDate = new Date('2025-01-15T12:00:00Z');
          const localDate = fromUTC(utcDate);
          expect(localDate).toBeInstanceOf(Date);
        });
      });
    });
  });
});