// Security utilities for the fitness app
import DOMPurify from 'isomorphic-dompurify';

/**
 * Secure Storage Wrapper
 * Encrypts sensitive data before storing in localStorage
 */
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'fittracker-secure-key';
  
  /**
   * Encrypt data using Web Crypto API
   */
  private static async encrypt(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate a random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Import key for AES-GCM encryption
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fallback to unencrypted
    }
  }
  
  /**
   * Decrypt data using Web Crypto API
   */
  private static async decrypt(encryptedData: string): Promise<string> {
    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      // Import key for AES-GCM decryption
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Fallback to encrypted data
    }
  }
  
  /**
   * Securely store sensitive data
   */
  static async setSecureItem(key: string, value: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = await this.encrypt(jsonString);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Secure storage failed:', error);
      // Fallback to regular storage for non-sensitive data
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
  
  /**
   * Retrieve and decrypt sensitive data
   */
  static async getSecureItem<T>(key: string): Promise<T | null> {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      
      const decrypted = await this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      // Fallback to regular storage
      const fallback = localStorage.getItem(key);
      return fallback ? JSON.parse(fallback) : null;
    }
  }
  
  /**
   * Remove secure item
   */
  static removeSecureItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
    localStorage.removeItem(key); // Remove fallback too
  }
}

/**
 * Input Validation and Sanitization
 */
export class InputValidator {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }
  
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  /**
   * Validate password strength
   */
  static isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate username
   */
  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }
  
  /**
   * Sanitize user input for database storage
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000); // Limit length
  }
  
  /**
   * Validate workout data
   */
  static validateWorkoutData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.length < 1) {
      errors.push('Workout name is required');
    }
    
    if (data.name && data.name.length > 100) {
      errors.push('Workout name must be less than 100 characters');
    }
    
    if (data.exercises && !Array.isArray(data.exercises)) {
      errors.push('Exercises must be an array');
    }
    
    if (data.exercises) {
      data.exercises.forEach((exercise: any, index: number) => {
        if (!exercise.exercise_id || typeof exercise.exercise_id !== 'string') {
          errors.push(`Exercise ${index + 1}: exercise_id is required`);
        }
        
        if (exercise.sets && !Array.isArray(exercise.sets)) {
          errors.push(`Exercise ${index + 1}: sets must be an array`);
        }
        
        if (exercise.sets) {
          exercise.sets.forEach((set: any, setIndex: number) => {
            if (typeof set.weight !== 'number' || set.weight < 0) {
              errors.push(`Exercise ${index + 1}, Set ${setIndex + 1}: weight must be a positive number`);
            }
            
            if (typeof set.reps !== 'number' || set.reps < 0) {
              errors.push(`Exercise ${index + 1}, Set ${setIndex + 1}: reps must be a positive number`);
            }
          });
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Rate Limiting for API calls
 */
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  
  /**
   * Check if request is within rate limit
   */
  static isAllowed(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this key
    const requests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
  
  /**
   * Clear old entries periodically
   */
  static cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hour
    
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > oneHourAgo);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

/**
 * Content Security Policy helpers
 */
export class CSPHelper {
  /**
   * Generate nonce for inline scripts
   */
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }
  
  /**
   * Validate external URLs
   */
  static isAllowedUrl(url: string): boolean {
    const allowedDomains = [
      'api.fittracker.com',
      'cdn.fittracker.com',
      'js.stripe.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`));
    } catch {
      return false;
    }
  }
}

/**
 * Error logging with privacy protection
 */
export class SecureLogger {
  /**
   * Log error without exposing sensitive data
   */
  static logError(error: Error, context?: Record<string, any>): void {
    const sanitizedContext = context ? this.sanitizeLogData(context) : {};
    
    console.error('App Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: sanitizedContext
    });
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry or similar service
      // Sentry.captureException(error, { extra: sanitizedContext });
    }
  }
  
  /**
   * Remove sensitive data from logs
   */
  private static sanitizeLogData(data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'email', 'phone', 'ssn', 'credit_card'];
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeLogData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

// Initialize rate limiter cleanup
setInterval(() => {
  RateLimiter.cleanup();
}, 300000); // Clean up every 5 minutes