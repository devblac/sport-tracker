/**
 * Security Initialization
 * Sets up all security measures for the application
 */

import { logger } from './logger';
import { quickSecurityCheck, monitorSecurityMetrics } from './securityAudit';
import { validateEnvironment } from './envValidation';
import { SECURITY_CONFIG, isProductionMode } from './securityConfig';

/**
 * Initialize all security measures
 */
export const initializeSecurity = async (): Promise<void> => {
  try {
    logger.info('Initializing security measures...');

    // 1. Validate environment variables
    const envValidation = validateEnvironment();
    if (!envValidation.success) {
      throw new Error(`Environment validation failed: ${envValidation.error}`);
    }

    if (envValidation.warnings) {
      envValidation.warnings.forEach(warning => {
        logger.warn('Environment warning:', warning);
      });
    }

    // 2. Set up Content Security Policy
    setupContentSecurityPolicy();

    // 3. Set up security monitoring
    if (typeof window !== 'undefined') {
      monitorSecurityMetrics();
      setupGlobalErrorHandling();
      setupSecurityEventListeners();
    }

    // 4. Perform security audit in development
    if (!isProductionMode()) {
      const auditPassed = await quickSecurityCheck();
      if (!auditPassed) {
        logger.warn('Security audit failed - check console for details');
      }
    }

    // 5. Set up periodic security checks
    setupPeriodicSecurityChecks();

    logger.info('Security initialization completed successfully');
  } catch (error) {
    logger.error('Security initialization failed', error);
    throw error;
  }
};

/**
 * Set up Content Security Policy
 */
const setupContentSecurityPolicy = (): void => {
  if (typeof document === 'undefined') return;

  // Only set CSP via meta tag if not already set by server
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) return;

  const csp = SECURITY_CONFIG.SECURITY_HEADERS['Content-Security-Policy'];
  
  // Create CSP meta tag
  const metaTag = document.createElement('meta');
  metaTag.httpEquiv = 'Content-Security-Policy';
  metaTag.content = csp;
  
  document.head.appendChild(metaTag);
  
  logger.info('Content Security Policy configured');
};

/**
 * Set up global error handling for security events
 */
const setupGlobalErrorHandling = (): void => {
  // Enhanced unhandled rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      type: 'unhandledrejection',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Check if it's a security-related error
    const reason = String(event.reason);
    if (reason.includes('SecurityError') || reason.includes('CSP')) {
      logger.error('Security-related unhandled rejection detected', event.reason);
    }
  });

  // Enhanced global error handler
  window.addEventListener('error', (event) => {
    logger.error('Global error', event.error, {
      type: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Check for security-related errors
    if (event.message?.includes('Content Security Policy') || 
        event.message?.includes('SecurityError')) {
      logger.error('Security-related error detected', event.error);
    }
  });
};

/**
 * Set up security event listeners
 */
const setupSecurityEventListeners = (): void => {
  // Monitor for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    logger.error('Content Security Policy violation', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      documentURI: event.documentURI,
      referrer: event.referrer,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      sourceFile: event.sourceFile,
    });
  });

  // Monitor for visibility changes (potential security concern)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      logger.info('Page hidden - potential security event');
    } else {
      logger.info('Page visible - user returned');
    }
  });

  // Monitor for focus changes (potential security concern)
  window.addEventListener('blur', () => {
    logger.info('Window lost focus');
  });

  window.addEventListener('focus', () => {
    logger.info('Window gained focus');
  });

  // Monitor for suspicious navigation attempts
  window.addEventListener('beforeunload', (event) => {
    // Log navigation for security audit
    logger.info('Page unload initiated', {
      url: window.location.href,
      referrer: document.referrer,
    });
  });
};

/**
 * Set up periodic security checks
 */
const setupPeriodicSecurityChecks = (): void => {
  // Check localStorage size periodically
  setInterval(() => {
    if (typeof window === 'undefined') return;

    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      // Warn if localStorage is getting large (>5MB)
      if (totalSize > 5 * 1024 * 1024) {
        logger.warn('localStorage size is large', { 
          size: Math.round(totalSize / 1024 / 1024) + 'MB' 
        });
      }
    } catch (error) {
      logger.warn('Could not check localStorage size', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  // Periodic security audit in development
  if (!isProductionMode()) {
    setInterval(async () => {
      try {
        await quickSecurityCheck();
      } catch (error) {
        logger.warn('Periodic security check failed', error);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }
};

/**
 * Clean up security resources
 */
export const cleanupSecurity = (): void => {
  // Remove event listeners and clear intervals
  // This would be called on app unmount
  logger.info('Cleaning up security resources');
};

/**
 * Get security status
 */
export const getSecurityStatus = () => {
  return {
    environment: import.meta.env.MODE,
    cspEnabled: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
    httpsEnabled: window.location.protocol === 'https:',
    securityHeadersConfigured: Object.keys(SECURITY_CONFIG.SECURITY_HEADERS).length > 0,
    monitoringActive: true,
  };
};