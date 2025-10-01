/**
 * Input Validation and Sanitization
 * Provides comprehensive input validation and XSS protection
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Common validation patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|[';\"\\]/i,
  XSS_PATTERNS: /<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i
};

// Validation schemas
export const ValidationSchemas = {
  email: z.string().email('Invalid email format').max(254),
  username: z.string().regex(PATTERNS.USERNAME, 'Invalid username format'),
  password: z.string().min(8).max(128).refine(
    (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(val),
    'Password must contain uppercase, lowercase, number and special character'
  ),
  safeString: z.string().max(1000).refine(
    (val) => !PATTERNS.SQL_INJECTION.test(val),
    'Input contains potentially dangerous characters'
  ),
  workoutName: z.string().min(1).max(100).refine(
    (val) => PATTERNS.SAFE_STRING.test(val),
    'Workout name contains invalid characters'
  ),
  exerciseName: z.string().min(1).max(100).refine(
    (val) => PATTERNS.SAFE_STRING.test(val),
    'Exercise name contains invalid characters'
  )
};

export class InputValidator {
  /**
   * Validate and sanitize user input
   */
  static validateAndSanitize<T>(
    input: unknown,
    schema: z.ZodSchema<T>,
    options: {
      sanitizeHtml?: boolean;
      trimWhitespace?: boolean;
      maxLength?: number;
    } = {}
  ): { success: true; data: T } | { success: false; errors: string[] } {
    try {
      let processedInput = input;

      // Pre-processing
      if (typeof processedInput === 'string') {
        if (options.trimWhitespace !== false) {
          processedInput = processedInput.trim();
        }

        if (options.maxLength && processedInput.length > options.maxLength) {
          return {
            success: false,
            errors: [`Input exceeds maximum length of ${options.maxLength} characters`]
          };
        }

        if (options.sanitizeHtml !== false) {
          processedInput = this.sanitizeHtml(processedInput);
        }

        // Check for potential security threats
        const securityCheck = this.checkSecurity(processedInput);
        if (!securityCheck.safe) {
          return {
            success: false,
            errors: securityCheck.threats
          };
        }
      }

      // Validate with schema
      const result = schema.safeParse(processedInput);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          errors: result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Validation error: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Check for security threats in input
   */
  static checkSecurity(input: string): { safe: boolean; threats: string[] } {
    const threats: string[] = [];

    // Check for SQL injection patterns
    if (PATTERNS.SQL_INJECTION.test(input)) {
      threats.push('Potential SQL injection detected');
    }

    // Check for XSS patterns
    if (PATTERNS.XSS_PATTERNS.test(input)) {
      threats.push('Potential XSS attack detected');
    }

    // Check for excessive length (potential DoS)
    if (input.length > 10000) {
      threats.push('Input length exceeds security limits');
    }

    // Check for null bytes
    if (input.includes('\0')) {
      threats.push('Null byte injection detected');
    }

    // Check for path traversal
    if (input.includes('../') || input.includes('..\\')) {
      threats.push('Path traversal attempt detected');
    }

    return {
      safe: threats.length === 0,
      threats
    };
  }

  /**
   * Validate workout data
   */
  static validateWorkoutData(data: unknown): { success: boolean; data?: any; errors?: string[] } {
    const workoutSchema = z.object({
      name: ValidationSchemas.workoutName,
      exercises: z.array(z.object({
        name: ValidationSchemas.exerciseName,
        sets: z.number().min(1).max(20),
        reps: z.number().min(1).max(1000),
        weight: z.number().min(0).max(1000).optional(),
        duration: z.number().min(0).max(7200).optional() // Max 2 hours
      })).min(1).max(50),
      notes: z.string().max(500).optional()
    });

    return this.validateAndSanitize(data, workoutSchema, {
      sanitizeHtml: true,
      trimWhitespace: true
    });
  }

  /**
   * Validate user profile data
   */
  static validateUserProfile(data: unknown): { success: boolean; data?: any; errors?: string[] } {
    const profileSchema = z.object({
      username: ValidationSchemas.username,
      email: ValidationSchemas.email,
      displayName: z.string().min(1).max(50).refine(
        (val) => PATTERNS.SAFE_STRING.test(val),
        'Display name contains invalid characters'
      ),
      bio: z.string().max(500).optional(),
      goals: z.array(z.string().max(100)).max(10).optional()
    });

    return this.validateAndSanitize(data, profileSchema, {
      sanitizeHtml: true,
      trimWhitespace: true
    });
  }

  /**
   * Validate social post data
   */
  static validateSocialPost(data: unknown): { success: boolean; data?: any; errors?: string[] } {
    const postSchema = z.object({
      content: z.string().min(1).max(1000),
      workoutId: z.string().uuid('Invalid UUID format').optional(),
      tags: z.array(z.string().max(50)).max(10).optional(),
      visibility: z.enum(['public', 'friends', 'private']).default('friends')
    });

    return this.validateAndSanitize(data, postSchema, {
      sanitizeHtml: true,
      trimWhitespace: true
    });
  }

  /**
   * Rate limiting validation
   */
  static validateRateLimit(
    identifier: string,
    action: string,
    limits: { requests: number; windowMs: number }
  ): { allowed: boolean; resetTime?: number } {
    const key = `rate_limit_${identifier}_${action}`;
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(key);
      const data = stored ? JSON.parse(stored) : { count: 0, resetTime: now + limits.windowMs };

      // Reset if window expired
      if (now > data.resetTime) {
        data.count = 0;
        data.resetTime = now + limits.windowMs;
      }

      // Check if limit exceeded
      if (data.count >= limits.requests) {
        return { allowed: false, resetTime: data.resetTime };
      }

      // Increment counter
      data.count++;
      localStorage.setItem(key, JSON.stringify(data));

      return { allowed: true };
    } catch (error) {
      // If localStorage fails, allow the request but log the error
      console.warn('Rate limiting storage failed:', error);
      return { allowed: true };
    }
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = options.allowedExtensions || ['.jpg', '.jpeg', '.png', '.webp'];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`);
    }

    // Check for potential malicious files
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file name');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}