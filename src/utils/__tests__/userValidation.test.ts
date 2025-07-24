import { describe, it, expect } from 'vitest';
import { validateUserLogin, validateUserRegistration } from '../userValidation';

describe('userValidation', () => {
  describe('validateUserLogin', () => {
    it('should validate correct login credentials', () => {
      const validCredentials = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      const result = validateUserLogin(validCredentials);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid email format', () => {
      const invalidCredentials = {
        email: 'invalid-email',
        password: 'ValidPass123!',
      };

      const result = validateUserLogin(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject empty password', () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: '',
      };

      const result = validateUserLogin(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
  });

  describe('validateUserRegistration', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser123',
        password: 'ValidPass123!',
        display_name: 'Test User',
        fitness_level: 'beginner' as const,
      };

      const result = validateUserRegistration(validData);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser123',
        password: 'weak',
        display_name: 'Test User',
        fitness_level: 'beginner' as const,
      };

      const result = validateUserRegistration(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Password must be at least 8 characters');
    });

    it('should reject invalid username format', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'ab', // Too short
        password: 'ValidPass123!',
        display_name: 'Test User',
        fitness_level: 'beginner' as const,
      };

      const result = validateUserRegistration(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Username must be at least 3 characters');
    });

    it('should reject username with invalid characters', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'test user!', // Contains space and special char
        password: 'ValidPass123!',
        display_name: 'Test User',
        fitness_level: 'beginner' as const,
      };

      const result = validateUserRegistration(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Username can only contain letters, numbers, underscores, and hyphens');
    });

    it('should reject empty display name', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser123',
        password: 'ValidPass123!',
        display_name: '',
        fitness_level: 'beginner' as const,
      };

      const result = validateUserRegistration(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Display name is required');
    });
  });
});