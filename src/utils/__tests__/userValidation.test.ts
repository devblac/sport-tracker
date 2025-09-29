import { describe, it, expect } from 'vitest';
import { 
  validateUserLogin, 
  validateUserRegistration,
  validateUser,
  validateUserProfileUpdate,
  validateUserSettingsUpdate,
  validatePasswordChange,
  validateDisplayName,
  validateBio,
  validateAge,
  validateHeight,
  validateWeight,
  isValidEmail,
  isValidUsername,
  isStrongPassword,
  getPasswordStrength,
  sanitizeUserInput,
  type ValidationResult,
  type ValidationError
} from '../userValidation';

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

    it('should provide structured validation errors', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'ab',
        password: 'weak',
        display_name: '',
        fitness_level: 'beginner' as const,
      };

      const result = validateUserRegistration(invalidData);

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.length).toBeGreaterThan(0);
      
      // Check that validation errors have proper structure
      result.validationErrors?.forEach(error => {
        expect(error).toHaveProperty('message');
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validatePasswordChange', () => {
    it('should validate correct password change data', () => {
      const validData = {
        current_password: 'OldPass123!',
        new_password: 'NewPass123!',
        confirm_password: 'NewPass123!',
      };

      const result = validatePasswordChange(validData);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        current_password: 'OldPass123!',
        new_password: 'NewPass123!',
        confirm_password: 'DifferentPass123!',
      };

      const result = validatePasswordChange(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("Passwords don't match");
    });

    it('should reject weak new password', () => {
      const invalidData = {
        current_password: 'OldPass123!',
        new_password: 'weak',
        confirm_password: 'weak',
      };

      const result = validatePasswordChange(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Password must be at least 8 characters');
    });
  });

  describe('validateDisplayName', () => {
    it('should validate correct display name', () => {
      const result = validateDisplayName('Valid Name');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Valid Name');
    });

    it('should reject empty display name', () => {
      const result = validateDisplayName('');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Display name cannot be empty');
    });

    it('should reject display name that is too long', () => {
      const longName = 'a'.repeat(51);
      const result = validateDisplayName(longName);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Display name is too long (max 50 characters)');
    });

    it('should sanitize display name', () => {
      const result = validateDisplayName('  <script>alert("xss")</script>Valid Name  ');

      expect(result.success).toBe(true);
      expect(result.data).toBe('scriptalert("xss")/scriptValid Name');
    });
  });

  describe('validateBio', () => {
    it('should validate correct bio', () => {
      const result = validateBio('This is a valid bio.');

      expect(result.success).toBe(true);
      expect(result.data).toBe('This is a valid bio.');
    });

    it('should reject bio that is too long', () => {
      const longBio = 'a'.repeat(501);
      const result = validateBio(longBio);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Bio is too long (max 500 characters)');
    });

    it('should sanitize bio', () => {
      const result = validateBio('  <script>Bio content</script>  ');

      expect(result.success).toBe(true);
      expect(result.data).toBe('scriptBio content/script');
    });
  });

  describe('validateAge', () => {
    it('should validate correct age', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      
      const result = validateAge(birthDate);

      expect(result.success).toBe(true);
      expect(result.data).toBe(25);
    });

    it('should reject age under 13', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10);
      
      const result = validateAge(birthDate);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Users must be at least 13 years old');
    });

    it('should reject unrealistic age', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 150);
      
      const result = validateAge(birthDate);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Please enter a valid birth date');
    });
  });

  describe('validateHeight', () => {
    it('should validate correct metric height', () => {
      const result = validateHeight(175, 'metric');

      expect(result.success).toBe(true);
      expect(result.data).toBe(175);
    });

    it('should validate correct imperial height', () => {
      const result = validateHeight(70, 'imperial');

      expect(result.success).toBe(true);
      expect(result.data).toBe(70);
    });

    it('should reject height too low for metric', () => {
      const result = validateHeight(50, 'metric');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Height must be between 100 and 250 cm');
    });

    it('should reject height too high for imperial', () => {
      const result = validateHeight(120, 'imperial');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Height must be between 39 and 98 inches');
    });
  });

  describe('validateWeight', () => {
    it('should validate correct metric weight', () => {
      const result = validateWeight(70, 'metric');

      expect(result.success).toBe(true);
      expect(result.data).toBe(70);
    });

    it('should validate correct imperial weight', () => {
      const result = validateWeight(150, 'imperial');

      expect(result.success).toBe(true);
      expect(result.data).toBe(150);
    });

    it('should reject weight too low for metric', () => {
      const result = validateWeight(20, 'metric');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Weight must be between 30 and 300 kg');
    });

    it('should reject weight too high for imperial', () => {
      const result = validateWeight(700, 'imperial');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toBe('Weight must be between 66 and 661 lbs');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should return true for valid username', () => {
      expect(isValidUsername('testuser123')).toBe(true);
      expect(isValidUsername('user_name')).toBe(true);
      expect(isValidUsername('user-name')).toBe(true);
    });

    it('should return false for invalid username', () => {
      expect(isValidUsername('ab')).toBe(false); // Too short
      expect(isValidUsername('a'.repeat(31))).toBe(false); // Too long
      expect(isValidUsername('user name')).toBe(false); // Contains space
      expect(isValidUsername('user@name')).toBe(false); // Contains special char
      expect(isValidUsername('')).toBe(false); // Empty
    });
  });

  describe('isStrongPassword', () => {
    it('should return true for strong password', () => {
      expect(isStrongPassword('ValidPass123')).toBe(true);
      expect(isStrongPassword('MySecure123')).toBe(true);
    });

    it('should return false for weak password', () => {
      expect(isStrongPassword('weak')).toBe(false); // Too short
      expect(isStrongPassword('weakpassword')).toBe(false); // No uppercase or numbers
      expect(isStrongPassword('WEAKPASSWORD')).toBe(false); // No lowercase or numbers
      expect(isStrongPassword('WeakPassword')).toBe(false); // No numbers
      expect(isStrongPassword('weakpass123')).toBe(false); // No uppercase
      expect(isStrongPassword('')).toBe(false); // Empty
    });
  });

  describe('getPasswordStrength', () => {
    it('should return correct strength score for strong password', () => {
      const result = getPasswordStrength('ValidPass123!');
      
      expect(result.score).toBe(4);
      expect(result.feedback).toHaveLength(0);
    });

    it('should return correct strength score for weak password', () => {
      const result = getPasswordStrength('weak');
      
      expect(result.score).toBe(1); // Only lowercase
      expect(result.feedback).toContain('Password should be at least 8 characters long');
      expect(result.feedback).toContain('Password should contain uppercase letters');
      expect(result.feedback).toContain('Password should contain numbers');
    });

    it('should provide helpful feedback for medium strength password', () => {
      const result = getPasswordStrength('ValidPass123');
      
      expect(result.score).toBe(4);
      expect(result.feedback).toContain('Consider adding special characters for extra security');
    });
  });

  describe('sanitizeUserInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeUserInput('  test  ')).toBe('test');
    });

    it('should remove HTML tags', () => {
      expect(sanitizeUserInput('<script>alert("xss")</script>test')).toBe('scriptalert("xss")/scripttest');
      expect(sanitizeUserInput('test<>content')).toBe('testcontent');
    });

    it('should limit length', () => {
      const longInput = 'a'.repeat(1500);
      const result = sanitizeUserInput(longInput);
      
      expect(result.length).toBe(1000);
    });

    it('should handle empty input', () => {
      expect(sanitizeUserInput('')).toBe('');
      expect(sanitizeUserInput('   ')).toBe('');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      const result1 = validateUserLogin(null);
      expect(result1.success).toBe(false);
      expect(result1.errors).toBeDefined();

      const result2 = validateUserLogin(undefined);
      expect(result2.success).toBe(false);
      expect(result2.errors).toBeDefined();
    });

    it('should handle non-object inputs', () => {
      const result1 = validateUserLogin('not an object');
      expect(result1.success).toBe(false);
      expect(result1.errors).toBeDefined();

      const result2 = validateUserLogin(123);
      expect(result2.success).toBe(false);
      expect(result2.errors).toBeDefined();
    });

    it('should handle malformed data structures', () => {
      const result = validateUserRegistration({
        email: null,
        username: undefined,
        password: 123,
        display_name: {},
        fitness_level: 'invalid_level',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.validationErrors).toBeDefined();
    });

    it('should provide consistent error structure across all validation functions', () => {
      const functions = [
        () => validateUserLogin({}),
        () => validateUserRegistration({}),
        () => validatePasswordChange({}),
        () => validateDisplayName(''),
        () => validateBio('a'.repeat(501)),
      ];

      functions.forEach(fn => {
        const result = fn();
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(false);
        expect(result).toHaveProperty('errors');
        expect(Array.isArray(result.errors)).toBe(true);
      });
    });
  });

  describe('Standardized Error Format Validation', () => {
    it('should provide consistent validationErrors structure for all validation functions', () => {
      const testCases = [
        () => validateDisplayName(''),
        () => validateBio('a'.repeat(501)),
        () => validateAge(new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)), // 10 years old
        () => validateHeight(50, 'metric'),
        () => validateWeight(20, 'metric'),
      ];

      testCases.forEach(testCase => {
        const result = testCase();
        expect(result.success).toBe(false);
        expect(result.validationErrors).toBeDefined();
        expect(Array.isArray(result.validationErrors)).toBe(true);
        expect(result.validationErrors!.length).toBeGreaterThan(0);
        
        result.validationErrors!.forEach(error => {
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('code');
          expect(typeof error.message).toBe('string');
          expect(typeof error.code).toBe('string');
          expect(error.message.length).toBeGreaterThan(0);
          expect(error.code.length).toBeGreaterThan(0);
        });
      });
    });

    it('should provide field information in validationErrors when available', () => {
      const result = validateDisplayName('');
      
      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors![0]).toHaveProperty('field');
      expect(result.validationErrors![0].field).toBe('display_name');
    });

    it('should maintain backward compatibility with errors array', () => {
      const result = validateUserLogin({
        email: 'invalid-email',
        password: ''
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors!.length).toBeGreaterThan(0);
      
      // Should contain simple error messages for backward compatibility
      result.errors!.forEach(error => {
        expect(typeof error).toBe('string');
        expect(error.length).toBeGreaterThan(0);
      });
    });

    it('should handle complex validation scenarios with multiple errors', () => {
      const result = validateUserRegistration({
        email: 'invalid-email',
        username: 'ab', // Too short
        password: 'weak', // Too weak
        display_name: '', // Empty
        fitness_level: 'invalid' // Invalid enum
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.validationErrors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(1);
      expect(result.validationErrors!.length).toBeGreaterThan(1);
      
      // Each validation error should have proper structure
      result.validationErrors!.forEach(error => {
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('code');
        expect(typeof error.message).toBe('string');
        expect(typeof error.code).toBe('string');
      });
    });
  });
});