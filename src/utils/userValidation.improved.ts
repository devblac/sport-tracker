// Improved userValidation.ts - Split responsibilities and reduce complexity

import { z } from 'zod';
import { logger } from '@/utils/logger';

// Types
export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  validationErrors?: ValidationError[];
}

// Error handling utilities
class ValidationErrorHandler {
  static formatZodIssue(issue: z.ZodIssue): ValidationError {
    return {
      field: issue.path.length > 0 ? issue.path.join('.') : undefined,
      message: issue.message,
      code: issue.code,
    };
  }

  static createErrorResult(error: z.ZodError): ValidationResult<never> {
    const validationErrors = error.issues.map(this.formatZodIssue);
    const errors = error.issues.map(issue => issue.message);
    
    logger.warn('Validation failed', { errors, validationErrors });
    
    return {
      success: false,
      errors,
      validationErrors,
    };
  }

  static createUnknownErrorResult(error: unknown): ValidationResult<never> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    logger.error('Unexpected validation error', { error: errorMessage });
    
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{ message: errorMessage, code: 'unknown_error' }],
    };
  }
}

// Core validation function - simplified and focused
const validateWithSchema = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ValidationErrorHandler.createErrorResult(error);
    }
    return ValidationErrorHandler.createUnknownErrorResult(error);
  }
};// Val
idation factory pattern for reusable validation logic
class ValidationFactory {
  static createFieldValidator<T>(
    fieldName: string,
    validator: (value: T) => boolean,
    errorMessage: string,
    errorCode: string
  ) {
    return (value: T): ValidationResult<T> => {
      if (!validator(value)) {
        return {
          success: false,
          errors: [errorMessage],
          validationErrors: [{
            field: fieldName,
            message: errorMessage,
            code: errorCode
          }]
        };
      }
      return { success: true, data: value };
    };
  }

  static createRangeValidator(
    fieldName: string,
    min: number,
    max: number,
    unit: string
  ) {
    return this.createFieldValidator(
      fieldName,
      (value: number) => value >= min && value <= max,
      `${fieldName} must be between ${min} and ${max} ${unit}`,
      'out_of_range'
    );
  }
}

// Password validation utilities
class PasswordValidator {
  private static readonly PATTERNS = {
    lowercase: /[a-z]/,
    uppercase: /[A-Z]/,
    digit: /\d/,
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
  };

  static getStrength(password: string): { score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    const checks = [
      { test: () => password.length >= 8, message: 'Password should be at least 8 characters long' },
      { test: () => this.PATTERNS.lowercase.test(password), message: 'Password should contain lowercase letters' },
      { test: () => this.PATTERNS.uppercase.test(password), message: 'Password should contain uppercase letters' },
      { test: () => this.PATTERNS.digit.test(password), message: 'Password should contain numbers' }
    ];

    checks.forEach(({ test, message }) => {
      if (test()) {
        score++;
      } else {
        feedback.push(message);
      }
    });

    if (this.PATTERNS.special.test(password)) {
      score = Math.min(score + 1, 4);
    } else if (score === 4) {
      feedback.push('Consider adding special characters for extra security');
    }

    return { score, feedback };
  }

  static isStrong(password: string): boolean {
    return password.length >= 8 &&
           this.PATTERNS.lowercase.test(password) &&
           this.PATTERNS.uppercase.test(password) &&
           this.PATTERNS.digit.test(password);
  }
}

// Input sanitization utilities
class InputSanitizer {
  static sanitizeText(input: string, maxLength = 1000): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, maxLength);
  }

  static validateDisplayName = ValidationFactory.createFieldValidator(
    'display_name',
    (name: string) => {
      const sanitized = this.sanitizeText(name, 50);
      return sanitized.length > 0 && sanitized.length <= 50;
    },
    'Display name must be 1-50 characters',
    'invalid_length'
  );

  static validateBio = ValidationFactory.createFieldValidator(
    'bio',
    (bio: string) => this.sanitizeText(bio, 500).length <= 500,
    'Bio is too long (max 500 characters)',
    'too_long'
  );
}