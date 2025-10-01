/**
 * Security Audit Utilities
 * Provides tools for auditing and monitoring security issues
 */

import { logger } from './logger';
import { SECURITY_CONFIG } from './securityConfig';

export interface SecurityAuditResult {
  passed: boolean;
  score: number; // 0-100
  issues: SecurityIssue[];
  recommendations: string[];
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'headers' | 'content' | 'configuration' | 'environment' | 'data';
  message: string;
  details?: string;
  fix?: string;
}

class SecurityAuditor {
  private issues: SecurityIssue[] = [];
  private score = 100;

  /**
   * Perform comprehensive security audit
   */
  async performAudit(): Promise<SecurityAuditResult> {
    this.issues = [];
    this.score = 100;

    // Audit different security aspects
    this.auditEnvironmentVariables();
    this.auditSecurityHeaders();
    this.auditContentSecurityPolicy();
    this.auditLocalStorage();
    this.auditNetworkSecurity();
    
    // Calculate final score
    const finalScore = Math.max(0, this.score);
    
    return {
      passed: finalScore >= 80 && !this.hasCriticalIssues(),
      score: finalScore,
      issues: this.issues,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Audit environment variables for security issues
   */
  private auditEnvironmentVariables(): void {
    const env = import.meta.env;
    
    // Check for exposed secrets
    for (const [key, value] of Object.entries(env)) {
      if (typeof value !== 'string') continue;
      
      // Check against secret patterns
      for (const { pattern, name } of SECURITY_CONFIG.SECRET_PATTERNS) {
        if (pattern.test(value)) {
          this.addIssue({
            severity: 'critical',
            category: 'environment',
            message: `Potential ${name} exposed in environment variable ${key}`,
            fix: 'Remove secret from environment variables and use secure storage',
          });
        }
      }
      
      // Check for non-VITE prefixed variables in production
      if (import.meta.env.MODE === 'production' && !key.startsWith('VITE_') && key !== 'MODE') {
        this.addIssue({
          severity: 'medium',
          category: 'environment',
          message: `Non-VITE prefixed environment variable ${key} may be exposed to client`,
          fix: 'Prefix client-side environment variables with VITE_',
        });
      }
    }
    
    // Check for missing required security variables
    if (!env.VITE_SUPABASE_URL) {
      this.addIssue({
        severity: 'high',
        category: 'configuration',
        message: 'Missing VITE_SUPABASE_URL environment variable',
        fix: 'Set VITE_SUPABASE_URL in your environment configuration',
      });
    }
  }

  /**
   * Audit security headers implementation
   */
  private auditSecurityHeaders(): void {
    // In a real implementation, this would check actual HTTP headers
    // For now, we'll check if security headers are configured
    
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Content-Security-Policy',
    ];
    
    const configuredHeaders = Object.keys(SECURITY_CONFIG.SECURITY_HEADERS);
    
    for (const header of requiredHeaders) {
      if (!configuredHeaders.includes(header)) {
        this.addIssue({
          severity: 'medium',
          category: 'headers',
          message: `Missing security header: ${header}`,
          fix: `Add ${header} to security headers configuration`,
        });
      }
    }
    
    // Check CSP strength
    const csp = SECURITY_CONFIG.SECURITY_HEADERS['Content-Security-Policy'];
    if (csp.includes("'unsafe-inline'")) {
      this.addIssue({
        severity: 'medium',
        category: 'headers',
        message: 'Content Security Policy allows unsafe-inline scripts/styles',
        details: 'This reduces protection against XSS attacks',
        fix: 'Remove unsafe-inline and use nonces or hashes for inline content',
      });
    }
  }

  /**
   * Audit Content Security Policy configuration
   */
  private auditContentSecurityPolicy(): void {
    const csp = SECURITY_CONFIG.SECURITY_HEADERS['Content-Security-Policy'];
    
    // Check for overly permissive directives
    if (csp.includes("'unsafe-eval'")) {
      this.addIssue({
        severity: 'high',
        category: 'headers',
        message: 'CSP allows unsafe-eval which enables code injection',
        fix: 'Remove unsafe-eval from Content-Security-Policy',
      });
    }
    
    if (csp.includes('*')) {
      this.addIssue({
        severity: 'medium',
        category: 'headers',
        message: 'CSP uses wildcard (*) which is overly permissive',
        fix: 'Specify exact domains instead of using wildcards',
      });
    }
    
    // Check for missing important directives
    const importantDirectives = ['default-src', 'script-src', 'style-src', 'img-src'];
    for (const directive of importantDirectives) {
      if (!csp.includes(directive)) {
        this.addIssue({
          severity: 'low',
          category: 'headers',
          message: `CSP missing ${directive} directive`,
          fix: `Add ${directive} directive to Content-Security-Policy`,
        });
      }
    }
  }

  /**
   * Audit local storage usage for sensitive data
   */
  private auditLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Check for sensitive data in localStorage
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          this.addIssue({
            severity: 'high',
            category: 'data',
            message: `Potentially sensitive data stored in localStorage: ${key}`,
            details: 'localStorage is not encrypted and accessible to all scripts',
            fix: 'Use secure storage methods or encrypt sensitive data',
          });
        }
        
        // Check for large data that might impact performance
        const value = localStorage.getItem(key);
        if (value && value.length > 100000) { // 100KB
          this.addIssue({
            severity: 'low',
            category: 'data',
            message: `Large data stored in localStorage: ${key} (${Math.round(value.length / 1024)}KB)`,
            details: 'Large localStorage data can impact performance',
            fix: 'Consider using IndexedDB for large data or implement data cleanup',
          });
        }
      }
    } catch (error) {
      logger.warn('Could not audit localStorage', error);
    }
  }

  /**
   * Audit network security configuration
   */
  private auditNetworkSecurity(): void {
    // Check if running on HTTPS in production
    if (import.meta.env.MODE === 'production' && typeof window !== 'undefined') {
      if (window.location.protocol !== 'https:') {
        this.addIssue({
          severity: 'critical',
          category: 'configuration',
          message: 'Application not served over HTTPS in production',
          fix: 'Configure HTTPS for production deployment',
        });
      }
    }
    
    // Check for mixed content issues
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // This would need to be implemented with actual network monitoring
      // For now, we'll check configuration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        this.addIssue({
          severity: 'high',
          category: 'configuration',
          message: 'Supabase URL not using HTTPS',
          fix: 'Use HTTPS URL for Supabase connection',
        });
      }
    }
  }

  /**
   * Add a security issue and adjust score
   */
  private addIssue(issue: SecurityIssue): void {
    this.issues.push(issue);
    
    // Deduct points based on severity
    const penalties = {
      low: 2,
      medium: 5,
      high: 10,
      critical: 20,
    };
    
    this.score -= penalties[issue.severity];
  }

  /**
   * Check if there are any critical issues
   */
  private hasCriticalIssues(): boolean {
    return this.issues.some(issue => issue.severity === 'critical');
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Group issues by category
    const issuesByCategory = this.issues.reduce((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, SecurityIssue[]>);
    
    // Generate category-specific recommendations
    if (issuesByCategory.headers) {
      recommendations.push('Review and strengthen HTTP security headers');
    }
    
    if (issuesByCategory.environment) {
      recommendations.push('Audit environment variables for exposed secrets');
    }
    
    if (issuesByCategory.data) {
      recommendations.push('Implement secure data storage practices');
    }
    
    if (issuesByCategory.configuration) {
      recommendations.push('Review security configuration settings');
    }
    
    // General recommendations based on score
    if (this.score < 60) {
      recommendations.push('Consider implementing a comprehensive security review process');
      recommendations.push('Set up automated security scanning in CI/CD pipeline');
    }
    
    if (this.hasCriticalIssues()) {
      recommendations.push('Address critical security issues immediately');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const securityAuditor = new SecurityAuditor();

/**
 * Quick security check for development
 */
export const quickSecurityCheck = async (): Promise<boolean> => {
  const result = await securityAuditor.performAudit();
  
  if (!result.passed) {
    console.warn('Security audit failed:', result);
    
    // Log critical issues
    const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      console.error('Critical security issues found:', criticalIssues);
    }
  }
  
  return result.passed;
};

/**
 * Monitor security metrics
 */
export const monitorSecurityMetrics = () => {
  if (typeof window === 'undefined') return;
  
  // Monitor for potential security events
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url] = args;
    
    // Log suspicious requests
    if (typeof url === 'string') {
      for (const protocol of SECURITY_CONFIG.DANGEROUS_PROTOCOLS) {
        if (url.toLowerCase().startsWith(protocol)) {
          logger.warn('Blocked dangerous protocol request', { url });
          throw new Error('Dangerous protocol blocked');
        }
      }
    }
    
    return originalFetch(...args);
  };
  
  // Monitor localStorage usage
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    // Warn about large data
    if (value.length > 50000) { // 50KB
      logger.warn('Large data being stored in localStorage', { 
        key, 
        size: Math.round(value.length / 1024) + 'KB' 
      });
    }
    
    return originalSetItem.call(this, key, value);
  };
};