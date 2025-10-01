/**
 * Data Integrity Service Tests
 * 
 * Test suite for data validation, integrity checking, and repair functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies that cause issues
vi.mock('../SupabaseService', () => ({
  supabaseService: {
    getUserProfile: vi.fn(),
    getUserWorkouts: vi.fn(),
  }
}));

vi.mock('@/db/DatabaseService', () => ({
  databaseService: {
    instance: {
      getManager: vi.fn(() => ({
        getAllByIndex: vi.fn(),
      })),
    },
  }
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}));

import { DataIntegrityService } from '../DataIntegrityService';

// Mock global objects
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
  },
  writable: true,
});

describe('DataIntegrityService', () => {
  let integrityService: DataIntegrityService;

  beforeEach(() => {
    integrityService = DataIntegrityService.getInstance();
  });

  describe('Record Validation', () => {
    it('should validate valid user profile', () => {
      const validProfile = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        displayName: 'Test User',
        email: 'test@example.com',
        bio: 'Test bio',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('user_profiles', validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid user profile', () => {
      const invalidProfile = {
        id: 'invalid-id', // Not a valid UUID
        userId: 'user-uuid-456',
        displayName: '', // Empty display name
        email: 'invalid-email', // Invalid email format
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('user_profiles', invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate valid workout session', () => {
      const validWorkout = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        name: 'Test Workout',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T11:00:00Z'),
        duration: 3600,
        totalVolume: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('workout_sessions', validWorkout);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect workout with invalid dates', () => {
      const invalidWorkout = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        name: 'Test Workout',
        startedAt: new Date('2025-01-01T10:00:00Z'), // Future date
        completedAt: new Date('2024-01-01T09:00:00Z'), // Before start
        duration: 3600,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('workout_sessions', invalidWorkout);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'startedAt')).toBe(true);
    });

    it('should validate valid social post', () => {
      const validPost = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        content: 'Great workout today!',
        type: 'workout' as const,
        visibility: 'public' as const,
        workoutId: 'workout-uuid-789',
        likesCount: 5,
        commentsCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('social_posts', validPost);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect social post with missing workout reference', () => {
      const invalidPost = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        content: 'Great workout today!',
        type: 'workout' as const,
        visibility: 'public' as const,
        // Missing workoutId for workout type
        likesCount: 5,
        commentsCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('social_posts', invalidPost);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'workoutId')).toBe(true);
    });

    it('should validate valid XP transaction', () => {
      const validTransaction = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        amount: 100,
        source: 'workout' as const,
        sourceId: 'workout-uuid-789',
        description: 'Completed workout',
        multiplier: 1.5,
        createdAt: new Date(),
      };

      const result = integrityService.validateRecord('xp_transactions', validTransaction);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect XP transaction with negative amount', () => {
      const invalidTransaction = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        amount: -50, // Negative amount
        source: 'workout' as const,
        sourceId: 'workout-uuid-789',
        description: 'Completed workout',
        multiplier: 1.5,
        createdAt: new Date(),
      };

      const result = integrityService.validateRecord('xp_transactions', invalidTransaction);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });
  });

  describe('Business Rules Validation', () => {
    it('should warn about short display names', () => {
      const profile = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        displayName: 'AB', // Very short name
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('user_profiles', profile);
      expect(result.warnings.some(w => w.field === 'displayName')).toBe(true);
    });

    it('should detect invalid characters in display name', () => {
      const profile = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        displayName: 'Test<script>alert("xss")</script>',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('user_profiles', profile);
      expect(result.errors.some(e => e.field === 'displayName')).toBe(true);
    });

    it('should warn about unusually long workouts', () => {
      const workout = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        name: 'Marathon Workout',
        startedAt: new Date('2024-01-01T08:00:00Z'),
        duration: 18000, // 5 hours
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('workout_sessions', workout);
      expect(result.warnings.some(w => w.field === 'duration')).toBe(true);
    });

    it('should detect spam patterns in social posts', () => {
      const spamPost = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        content: 'BUY NOW!!! AMAZING DISCOUNT!!! FREE PRIZE!!!',
        type: 'general' as const,
        visibility: 'public' as const,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('social_posts', spamPost);
      expect(result.warnings.some(w => w.field === 'content')).toBe(true);
    });

    it('should warn about unusually high XP amounts', () => {
      const highXPTransaction = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        amount: 15000, // Very high XP
        source: 'bonus' as const,
        description: 'Special bonus',
        multiplier: 1.0,
        createdAt: new Date(),
      };

      const result = integrityService.validateRecord('xp_transactions', highXPTransaction);
      expect(result.warnings.some(w => w.field === 'amount')).toBe(true);
    });
  });

  describe('Error Severity Classification', () => {
    it('should classify type errors as critical', () => {
      const invalidRecord = {
        id: 123, // Should be string
        userId: 'user-uuid-456',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('user_profiles', invalidRecord);
      expect(result.errors.some(e => e.severity === 'critical')).toBe(true);
    });

    it('should classify business rule violations appropriately', () => {
      const profile = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        displayName: 'Test<>User', // Invalid characters
        bio: 'A'.repeat(600), // Too long
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('user_profiles', profile);
      
      // Should have medium severity errors for business rule violations
      expect(result.errors.some(e => e.severity === 'medium')).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should detect valid image URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'https://example.com/photo.png',
        'https://example.com/avatar.gif',
        'https://example.com/pic.webp',
      ];

      // Access private method for testing
      const service = integrityService as any;
      
      validUrls.forEach(url => {
        expect(service.isValidImageUrl(url)).toBe(true);
      });
    });

    it('should detect invalid image URLs', () => {
      const invalidUrls = [
        'https://example.com/document.pdf',
        'https://example.com/video.mp4',
        'not-a-url',
        'https://example.com/page.html',
      ];

      // Access private method for testing
      const service = integrityService as any;
      
      invalidUrls.forEach(url => {
        expect(service.isValidImageUrl(url)).toBe(false);
      });
    });

    it('should detect spam patterns', () => {
      const spamTexts = [
        'AAAAAAAAAAAAAAAA', // Repeated characters
        'Buy now! Free offer! Win prize!', // Promotional keywords
        'Check out https://spam.com and https://more-spam.com', // Multiple URLs
      ];

      // Access private method for testing
      const service = integrityService as any;
      
      spamTexts.forEach(text => {
        expect(service.detectSpamPatterns(text)).toBe(true);
      });
    });

    it('should not flag normal content as spam', () => {
      const normalTexts = [
        'Great workout today!',
        'Just finished my morning run',
        'Looking forward to tomorrow\'s training session',
      ];

      // Access private method for testing
      const service = integrityService as any;
      
      normalTexts.forEach(text => {
        expect(service.detectSpamPatterns(text)).toBe(false);
      });
    });
  });

  describe('Schema Validation', () => {
    it('should handle unknown table gracefully', () => {
      const result = integrityService.validateRecord('unknown_table', {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('table');
      expect(result.errors[0].severity).toBe('critical');
    });

    it('should validate required fields', () => {
      const incompleteProfile = {
        // Missing required fields
        displayName: 'Test User',
      };

      const result = integrityService.validateRecord('user_profiles', incompleteProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate field types', () => {
      const wrongTypeProfile = {
        id: 'test-uuid-123',
        userId: 'user-uuid-456',
        displayName: 123, // Should be string
        createdAt: 'not-a-date', // Should be Date
        updatedAt: new Date(),
      };

      const result = integrityService.validateRecord('user_profiles', wrongTypeProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});