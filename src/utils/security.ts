// Enhanced security utilities for input sanitization and validation

import DOMPurify from 'dompurify';
import { z } from 'zod';

// Security configuration
const SECURITY_CONFIG = {
  maxInputLength: 1000,
  maxDisplayNameLength: 50,
  maxBioLength: 500,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  rateLimitWindow: 60 * 1000, // 1 minute
  maxRequestsPerWindow: 10
} as const;

// Rate limiting utility
class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.rateLimitWindow;
    
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= SECURITY_CONFIG.maxRequestsPerWindow) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Input sanitization utilities
export class InputSanitizer {
  private static rateLimiter = new RateLimiter();

  // Enhanced HTML sanitization
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  // SQL injection prevention
  static sanitizeForDatabase(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    return input
      .replace(/['"\\;]/g, '') // Remove dangerous characters
      .trim()
      .substring(0, SECURITY_CONFIG.maxInputLength);
  }

  // XSS prevention for user-generated content
  static sanitizeUserContent(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    return this.sanitizeHtml(input)
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, SECURITY_CONFIG.maxInputLength);
  }

  // File upload validation
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!SECURITY_CONFIG.allowedImageTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    if (file.size > SECURITY_CONFIG.maxImageSize) {
      return { valid: false, error: 'File too large' };
    }

    return { valid: true };
  }

  // Rate limiting check
  static checkRateLimit(identifier: string): boolean {
    return this.rateLimiter.isAllowed(identifier);
  }
}

// Secure validation schemas with sanitization
export const secureUserSchemas = {
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(SECURITY_CONFIG.maxDisplayNameLength, 'Display name too long')
    .transform(InputSanitizer.sanitizeUserContent)
    .refine(val => val.length > 0, 'Display name cannot be empty after sanitization'),

  bio: z.string()
    .max(SECURITY_CONFIG.maxBioLength, 'Bio too long')
    .transform(InputSanitizer.sanitizeUserContent),

  email: z.string()
    .email('Invalid email format')
    .transform(val => val.toLowerCase().trim())
    .refine(val => !val.includes('+'), 'Email aliases not allowed'), // Prevent email alias abuse

  username: z.string()
    .min(3, 'Username too short')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid username characters')
    .transform(val => val.toLowerCase())
    .refine(val => !['admin', 'root', 'system'].includes(val), 'Reserved username'),

  password: z.string()
    .min(8, 'Password too short')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and numbers')
    .refine(val => !val.includes(' '), 'Password cannot contain spaces')
    .refine(val => !/(.)\1{2,}/.test(val), 'Password cannot have repeated characters')
};

// Content Security Policy helpers
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // Minimize unsafe-inline in production
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https://api.supabase.co"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"]
} as const;

// Security headers for production
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
} as const;

// Audit logging for security events
export class SecurityAuditLogger {
  static logFailedValidation(field: string, value: unknown, error: string): void {
    console.warn('Security validation failed', {
      field,
      error,
      timestamp: new Date().toISOString(),
      valueType: typeof value,
      // Don't log actual values for security
    });
  }

  static logRateLimitExceeded(identifier: string): void {
    console.warn('Rate limit exceeded', {
      identifier: identifier.substring(0, 10) + '...', // Partial identifier for privacy
      timestamp: new Date().toISOString()
    });
  }

  static logSuspiciousActivity(activity: string, context: Record<string, unknown>): void {
    console.error('Suspicious activity detected', {
      activity,
      context,
      timestamp: new Date().toISOString()
    });
  }
}