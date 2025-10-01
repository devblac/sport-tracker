/**
 * Security Hook
 * Provides security utilities and validation for components
 */

import { useCallback, useMemo } from 'react';
import { sanitizeUserContent, sanitizeUrl } from '@/utils/xssProtection';
import { SECURITY_CONFIG } from '@/utils/securityConfig';

export const useSecurity = () => {
  // Rate limiting state (in a real app, this would be more sophisticated)
  const rateLimitMap = useMemo(() => new Map<string, number[]>(), []);

  /**
   * Check if user is rate limited for a specific action
   */
  const checkRateLimit = useCallback((userId: string, action: string): boolean => {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowMs = SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS;
    const maxRequests = SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE;

    // Get existing requests for this user/action
    const requests = rateLimitMap.get(key) || [];
    
    // Filter out old requests outside the window
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false; // Rate limited
    }

    // Add current request
    recentRequests.push(now);
    rateLimitMap.set(key, recentRequests);
    
    return true; // Not rate limited
  }, [rateLimitMap]);

  /**
   * Validate and sanitize user input
   */
  const validateInput = useCallback((input: string, type: 'text' | 'url' | 'email' = 'text'): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } => {
    const errors: string[] = [];
    let sanitized = input;

    // Basic validation
    if (!input || typeof input !== 'string') {
      return { isValid: false, sanitized: '', errors: ['Invalid input'] };
    }

    // Length validation
    if (input.length > SECURITY_CONFIG.CONTENT_LIMITS.MAX_USER_CONTENT_LENGTH) {
      errors.push(`Content too long (max ${SECURITY_CONFIG.CONTENT_LIMITS.MAX_USER_CONTENT_LENGTH} characters)`);
    }

    // Type-specific validation and sanitization
    switch (type) {
      case 'url':
        sanitized = sanitizeUrl(input);
        if (!sanitized && input) {
          errors.push('Invalid or dangerous URL');
        }
        break;
      case 'email':
        // Basic email validation (Zod schemas handle more comprehensive validation)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          errors.push('Invalid email format');
        }
        sanitized = sanitizeUserContent(input);
        break;
      default:
        sanitized = sanitizeUserContent(input);
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(input))) {
      errors.push('Suspicious content detected');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    };
  }, []);

  /**
   * Validate file upload
   */
  const validateFileUpload = useCallback((file: File): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File too large (max 5MB)');
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type');
    }

    // Filename validation
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs'];
    if (dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      errors.push('Dangerous file extension');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Log security event
   */
  const logSecurityEvent = useCallback((event: {
    type: 'rate_limit' | 'xss_attempt' | 'invalid_input' | 'suspicious_activity';
    userId?: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    console.warn('Security Event:', event);
    
    // In a real app, this would send to monitoring service
    if (event.severity === 'critical') {
      console.error('CRITICAL SECURITY EVENT:', event);
    }
  }, []);

  return {
    checkRateLimit,
    validateInput,
    validateFileUpload,
    logSecurityEvent,
    sanitizeUserContent,
    sanitizeUrl,
  };
};