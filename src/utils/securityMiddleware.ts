/**
 * Security Middleware
 * Provides security validation and protection for form submissions and API calls
 */

import { sanitizeUserContent, sanitizeUrl } from './xssProtection';
import { SECURITY_CONFIG } from './securityConfig';

// Security constants
const SECURITY_CONSTANTS = {
  MAX_REQUEST_BODY_SIZE: 1024 * 1024, // 1MB
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_RECURSION_DEPTH: 10,
  DANGEROUS_PROTOCOLS: ['javascript:', 'data:', 'vbscript:'],
  VALID_PROTOCOLS: ['http:', 'https:', 'ftp:', 'ftps:', 'ws:', 'wss:'],
  REQUIRED_SECURITY_HEADERS: ['X-Content-Type-Options', 'X-Frame-Options', 'X-XSS-Protection'],
  SUSPICIOUS_CONTENT_TYPES: [
    'application/x-msdownload',
    'application/octet-stream', 
    'application/x-executable',
    'text/x-shellscript'
  ],
  DANGEROUS_FILE_EXTENSIONS: ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs', '.php'],
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif', 
    'image/webp',
    'image/svg+xml'
  ]
} as const;

export interface SecurityValidationResult {
  isValid: boolean;
  sanitizedData: Record<string, unknown>;
  errors: string[];
  warnings: string[];
}

export interface RequestValidationResult {
  valid: boolean;
  error: string;
}

export interface ResponseValidationResult {
  safe: boolean;
  warnings: string[];
}

export interface SecurityMiddlewareConfig {
  maxRequestBodySize?: number;
  maxFileSize?: number;
  maxRecursionDepth?: number;
  allowedProtocols?: string[];
  dangerousProtocols?: string[];
}

/**
 * Validate and sanitize form data before submission
 */
export const validateFormData = (
  data: Record<string, unknown>,
  rules: Record<string, {
    required?: boolean;
    type?: 'text' | 'email' | 'url' | 'number';
    maxLength?: number;
    minLength?: number;
    sanitize?: boolean;
  }>
): SecurityValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sanitizedData: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(data)) {
    const rule = rules[field];
    if (!rule) {
      // Field not in rules, skip validation but warn
      warnings.push(`Unexpected field: ${field}`);
      continue;
    }

    // Required field validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation for empty optional fields
    if (!value && !rule.required) {
      sanitizedData[field] = value;
      continue;
    }

    // Type-specific validation and sanitization
    switch (rule.type) {
      case 'email':
        if (typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field} must be a valid email`);
            continue;
          }
          sanitizedData[field] = rule.sanitize !== false ? sanitizeUserContent(value) : value;
        }
        break;

      case 'url':
        if (typeof value === 'string') {
          const sanitizedUrl = sanitizeUrl(value);
          if (!sanitizedUrl && value) {
            errors.push(`${field} must be a valid URL`);
            continue;
          }
          sanitizedData[field] = sanitizedUrl;
        }
        break;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
          continue;
        }
        sanitizedData[field] = num;
        break;

      case 'text':
      default:
        if (typeof value === 'string') {
          // Length validation
          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${field} must be less than ${rule.maxLength} characters`);
            continue;
          }
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${field} must be at least ${rule.minLength} characters`);
            continue;
          }

          // Sanitization
          sanitizedData[field] = rule.sanitize !== false ? sanitizeUserContent(value) : value;
        } else {
          sanitizedData[field] = value;
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedData,
    errors,
    warnings
  };
};

/**
 * Rate limiting for form submissions
 */
const rateLimitMap = new Map<string, number[]>();

export const checkRateLimit = (userId: string, action: string): boolean => {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const windowMs = SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS;
  const maxRequests = SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE;

  // Get existing requests
  const requests = rateLimitMap.get(key) || [];
  
  // Filter out old requests
  const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  // Check limit
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limited
  }

  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(key, recentRequests);
  
  return true; // Not rate limited
};

/**
 * Security wrapper for API calls
 */
export const secureApiCall = async <T>(
  apiCall: () => Promise<T>,
  options: {
    userId?: string;
    action?: string;
    validateResponse?: boolean;
  } = {}
): Promise<T> => {
  const { userId, action, validateResponse = true } = options;

  // Rate limiting
  if (userId && action && !checkRateLimit(userId, action)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  try {
    const result = await apiCall();

    // Basic response validation
    if (validateResponse && result && typeof result === 'object') {
      // Check for potential XSS in response
      const jsonString = JSON.stringify(result);
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i,
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(jsonString))) {
        console.warn('Suspicious content detected in API response');
        // In production, you might want to sanitize or reject the response
      }
    }

    return result;
  } catch (error) {
    // Log security-related errors
    if (error instanceof Error) {
      const securityKeywords = ['xss', 'injection', 'script', 'unauthorized'];
      if (securityKeywords.some(keyword => error.message.toLowerCase().includes(keyword))) {
        console.error('Security-related API error:', error);
      }
    }
    throw error;
  }
};

/**
 * Validate file uploads for security
 */
export const validateFileUpload = (file: File): SecurityValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // File size validation
  if (file.size > SECURITY_CONSTANTS.MAX_FILE_SIZE) {
    errors.push(`File too large (max ${SECURITY_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB)`);
  }

  // File type validation
  if (!SECURITY_CONSTANTS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push('Invalid file type. Only images are allowed.');
  }

  // Filename validation
  const fileName = file.name.toLowerCase();
  
  if (SECURITY_CONSTANTS.DANGEROUS_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
    errors.push('Dangerous file extension detected');
  }

  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    errors.push('Invalid filename - path traversal detected');
  }

  // Check for null bytes (security vulnerability)
  if (file.name.includes('\0')) {
    errors.push('Invalid filename - null byte detected');
  }

  // Warn about potentially suspicious files
  if (fileName.startsWith('.') && fileName !== '.gitkeep') {
    warnings.push('Hidden file detected');
  }

  return {
    isValid: errors.length === 0,
    sanitizedData: {
      name: sanitizeUserContent(file.name),
      type: file.type,
      size: file.size
    },
    errors,
    warnings
  };
};

/**
 * Security middleware object with methods expected by tests
 */
export const securityMiddleware = {
  addSecurityHeaders: (existingHeaders: Record<string, string> = {}) => {
    return {
      ...existingHeaders,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
  },

  validateRequest: (urlOrRequest: string | { url: string; method?: string; body?: string; headers?: Record<string, string> }, options?: { method?: string; body?: string; headers?: Record<string, string> }) => {
    const errors: string[] = [];
    
    // Extract URL and body from input parameters
    const { url, body } = typeof urlOrRequest === 'string' 
      ? { url: urlOrRequest, body: options?.body }
      : { url: urlOrRequest.url, body: urlOrRequest.body };
    
    // Early validation: body size check (before URL parsing to prevent format errors)
    if (body && body.length > SECURITY_CONSTANTS.MAX_REQUEST_BODY_SIZE) {
      return {
        valid: false,
        error: 'Request body size too large'
      };
    }
    
    // Early validation: empty URL check
    if (!url || url.trim() === '') {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
    
    // Dangerous protocol patterns (check in both absolute and relative URLs)
    // Also check URL-decoded version to prevent encoding bypasses
    const decodedUrl = decodeURIComponent(url).toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    if (SECURITY_CONSTANTS.DANGEROUS_PROTOCOLS.some(protocol => 
      lowerUrl.includes(protocol) || decodedUrl.includes(protocol)
    )) {
      return {
        valid: false,
        error: 'Invalid URL protocol detected'
      };
    }
    
    // URL validation based on type
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      // Relative URL - already validated for dangerous protocols above
      return { valid: true, error: '' };
    }
    
    // Absolute URL validation
    try {
      const parsedUrl = new URL(url);
      
      // Validate allowed protocols
      if (!SECURITY_CONSTANTS.VALID_PROTOCOLS.includes(parsedUrl.protocol)) {
        return {
          valid: false,
          error: 'Invalid URL format'
        };
      }
      
      return { valid: true, error: '' };
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
  },

  sanitizeRequestData: (data: any, maxDepth = SECURITY_CONSTANTS.MAX_RECURSION_DEPTH): any => {
    if (maxDepth <= 0) {
      return '[Max depth reached]';
    }

    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return sanitizeUserContent(data);
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => securityMiddleware.sanitizeRequestData(item, maxDepth - 1));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Skip dangerous prototype properties
        if (['__proto__', 'constructor', 'prototype'].includes(key)) {
          continue;
        }
        
        sanitized[key] = securityMiddleware.sanitizeRequestData(value, maxDepth - 1);
      }
      
      return sanitized;
    }

    return data;
  },

  processResponse: (response: Response | { headers: Record<string, string>; body?: string }) => {
    const warnings: string[] = [];

    let headers: Record<string, string>;
    let body: string | undefined;

    // Handle both Response object and plain object
    if (response instanceof Response) {
      headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      // For Response objects, we can't easily get the body synchronously
      body = undefined;
    } else {
      headers = response.headers;
      body = response.body;
    }

    // Check for missing security headers (case-insensitive)
    for (const header of SECURITY_CONSTANTS.REQUIRED_SECURITY_HEADERS) {
      const headerFound = Object.keys(headers).some(key => 
        key.toLowerCase() === header.toLowerCase()
      );
      if (!headerFound) {
        warnings.push(`Missing ${header} header`);
      }
    }

    // Check for suspicious content types
    const contentType = headers['Content-Type'] || headers['content-type'];
    if (contentType) {
      // Check for suspicious content types
      if (SECURITY_CONSTANTS.SUSPICIOUS_CONTENT_TYPES.some(type => contentType.includes(type))) {
        warnings.push('Suspicious content type detected');
      }
      
      // Check for dangerous content in HTML/JS responses
      if (['text/html', 'application/javascript'].some(type => contentType.includes(type))) {
        if (body && /<script|javascript:|on\w+\s*=/i.test(body)) {
          warnings.push('Potentially dangerous content detected');
        }
      }
    }

    return {
      safe: warnings.length === 0,
      warnings
    };
  }
};

/**
 * Secure fetch wrapper
 */
export const secureFetch = async (url: string, options: RequestInit = {}) => {
  // Validate request - only pass relevant properties to avoid type conflicts
  const requestData = {
    url,
    method: options.method,
    body: typeof options.body === 'string' ? options.body : undefined,
    headers: options.headers as Record<string, string> | undefined
  };
  
  const validation = securityMiddleware.validateRequest(requestData);
  if (!validation.valid) {
    throw new Error(`Security validation failed: ${validation.error}`);
  }

  // Add security headers
  const secureHeaders = securityMiddleware.addSecurityHeaders(options.headers as Record<string, string>);
  
  // Sanitize request body if present
  let sanitizedBody = options.body;
  if (options.body && typeof options.body === 'string') {
    try {
      const parsed = JSON.parse(options.body);
      const sanitized = securityMiddleware.sanitizeRequestData(parsed);
      sanitizedBody = JSON.stringify(sanitized);
    } catch {
      // Not JSON, sanitize as string
      sanitizedBody = sanitizeUserContent(options.body);
    }
  }

  return fetch(url, {
    ...options,
    headers: secureHeaders,
    body: sanitizedBody
  });
};