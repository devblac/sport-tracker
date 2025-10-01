/**
 * Centralized Security Configuration
 * Contains all security-related constants and configurations
 */

export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    WINDOW_MS: 60000, // 1 minute
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  },

  // Request limits
  REQUEST_LIMITS: {
    MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
    MAX_URL_LENGTH: 2048,
    MAX_HEADER_SIZE: 8192,
  },

  // Content limits
  CONTENT_LIMITS: {
    MAX_DISPLAY_NAME_LENGTH: 50,
    MAX_BIO_LENGTH: 500,
    MAX_USER_CONTENT_LENGTH: 1000,
    MAX_SEARCH_QUERY_LENGTH: 100,
    MAX_FILENAME_LENGTH: 255,
  },

  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.stripe.com; font-src 'self' data:; media-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  },

  // Dangerous protocols to block
  DANGEROUS_PROTOCOLS: [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'ftp:',
    'about:',
    'chrome:',
    'chrome-extension:',
    'moz-extension:',
  ],

  // Allowed protocols for URLs
  ALLOWED_PROTOCOLS: [
    'http:',
    'https:',
    'mailto:',
    'tel:',
    'sms:',
  ],

  // Suspicious content types
  SUSPICIOUS_CONTENT_TYPES: [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-dosexec',
    'application/octet-stream',
  ],

  // Sensitive parameter names to redact in logs
  SENSITIVE_PARAMS: [
    'token',
    'apikey',
    'password',
    'secret',
    'key',
    'auth',
    'authorization',
    'bearer',
    'session',
    'csrf',
  ],

  // HTML entities for encoding
  HTML_ENTITIES: {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '&': '&amp;',
    '`': '&#x60;',
    '=': '&#x3D;',
  } as const,

  // Secret detection patterns
  SECRET_PATTERNS: [
    { pattern: /sk_[a-zA-Z0-9_]+/, name: 'Stripe Secret Key' },
    { pattern: /rk_[a-zA-Z0-9_]+/, name: 'Stripe Restricted Key' },
    { pattern: /service_role_[a-zA-Z0-9_]+/, name: 'Supabase Service Role Key' },
    { pattern: /-----BEGIN [A-Z ]+-----/, name: 'Private Key' },
    { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub Personal Access Token' },
    { pattern: /glpat-[a-zA-Z0-9_-]{20}/, name: 'GitLab Personal Access Token' },
    { pattern: /xox[baprs]-[a-zA-Z0-9-]+/, name: 'Slack Token' },
  ] as const,

  // Validation rules
  VALIDATION: {
    PASSWORD: {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SPECIAL_CHARS: false, // Optional for better UX
    },
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 30,
      ALLOWED_PATTERN: /^[a-zA-Z0-9_-]+$/,
    },
    EMAIL: {
      MAX_LENGTH: 254, // RFC 5321 limit
    },
  },

  // Environment-specific settings
  ENVIRONMENT: {
    DEVELOPMENT: {
      ENABLE_DEBUG_LOGS: true,
      STRICT_CSP: false,
      ALLOW_HTTP: true,
    },
    PRODUCTION: {
      ENABLE_DEBUG_LOGS: false,
      STRICT_CSP: true,
      ALLOW_HTTP: false,
      REQUIRE_HTTPS: true,
    },
  },
} as const;

// Type-safe access to security config
export type SecurityConfigType = typeof SECURITY_CONFIG;

// Helper functions for common security checks
export const isProductionMode = (): boolean => {
  return import.meta.env.MODE === 'production';
};

export const getSecurityLevel = (): 'strict' | 'normal' | 'relaxed' => {
  if (isProductionMode()) return 'strict';
  if (import.meta.env.MODE === 'test') return 'relaxed';
  return 'normal';
};

export const shouldEnableStrictCSP = (): boolean => {
  return isProductionMode() && SECURITY_CONFIG.ENVIRONMENT.PRODUCTION.STRICT_CSP;
};

export const getMaxRequestSize = (): number => {
  // Reduce size in production for better security
  return isProductionMode() 
    ? SECURITY_CONFIG.REQUEST_LIMITS.MAX_REQUEST_SIZE * 0.5
    : SECURITY_CONFIG.REQUEST_LIMITS.MAX_REQUEST_SIZE;
};

export const getRateLimitConfig = () => {
  const baseConfig = SECURITY_CONFIG.RATE_LIMIT;
  
  // Stricter limits in production
  if (isProductionMode()) {
    return {
      ...baseConfig,
      MAX_REQUESTS_PER_MINUTE: Math.floor(baseConfig.MAX_REQUESTS_PER_MINUTE * 0.8),
    };
  }
  
  return baseConfig;
};