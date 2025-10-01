import { describe, it, expect, beforeEach, vi } from 'vitest';
import { securityMiddleware, secureFetch } from '../securityMiddleware';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SecurityMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addSecurityHeaders', () => {
    it('should add all required security headers', () => {
      const headers = securityMiddleware.addSecurityHeaders();
      
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('Strict-Transport-Security');
    });

    it('should preserve existing headers', () => {
      const existingHeaders = { 'Custom-Header': 'value' };
      const headers = securityMiddleware.addSecurityHeaders(existingHeaders);
      
      expect(headers).toHaveProperty('Custom-Header', 'value');
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
    });
  });

  describe('validateRequest', () => {
    it('should validate legitimate URLs', () => {
      const result = securityMiddleware.validateRequest('https://api.example.com/data');
      expect(result.valid).toBe(true);
    });

    it('should validate legitimate relative URLs', () => {
      const result = securityMiddleware.validateRequest('/api/data');
      expect(result.valid).toBe(true);
    });

    it('should validate relative URLs with dot notation', () => {
      const result = securityMiddleware.validateRequest('./api/data');
      expect(result.valid).toBe(true);
    });

    it('should validate parent directory relative URLs', () => {
      const result = securityMiddleware.validateRequest('../api/data');
      expect(result.valid).toBe(true);
    });

    it('should block javascript: URLs', () => {
      const result = securityMiddleware.validateRequest('javascript:alert("xss")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL protocol detected');
    });

    it('should block data: URLs', () => {
      const result = securityMiddleware.validateRequest('data:text/html,<script>alert("xss")</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL protocol detected');
    });

    it('should block vbscript: URLs', () => {
      const result = securityMiddleware.validateRequest('vbscript:msgbox("xss")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL protocol detected');
    });

    it('should block javascript: in relative URLs', () => {
      const result = securityMiddleware.validateRequest('/javascript:alert("xss")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL protocol detected');
    });

    it('should validate request size limits before URL parsing', () => {
      const largeBody = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const result = securityMiddleware.validateRequest('https://api.example.com', {
        method: 'POST',
        body: largeBody,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Request body size too large');
    });

    it('should validate request size limits with request object format', () => {
      const largeBody = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const result = securityMiddleware.validateRequest({
        url: 'https://api.example.com',
        method: 'POST',
        body: largeBody,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Request body size too large');
    });

    it('should handle malformed URLs gracefully', () => {
      const result = securityMiddleware.validateRequest('not-a-valid-url://test');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should handle empty URLs', () => {
      const result = securityMiddleware.validateRequest('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should validate both absolute and relative URLs comprehensively', () => {
      // Test absolute URLs
      expect(securityMiddleware.validateRequest('https://example.com/api').valid).toBe(true);
      expect(securityMiddleware.validateRequest('http://localhost:3000/api').valid).toBe(true);
      
      // Test relative URLs
      expect(securityMiddleware.validateRequest('/api/users').valid).toBe(true);
      expect(securityMiddleware.validateRequest('./users').valid).toBe(true);
      expect(securityMiddleware.validateRequest('../users').valid).toBe(true);
      
      // Test dangerous protocols in both formats
      expect(securityMiddleware.validateRequest('javascript:alert(1)').valid).toBe(false);
      expect(securityMiddleware.validateRequest('/javascript:alert(1)').valid).toBe(false);
    });

    it('should handle edge cases in URL validation', () => {
      // Test URLs with query parameters
      expect(securityMiddleware.validateRequest('https://api.example.com/data?param=value').valid).toBe(true);
      expect(securityMiddleware.validateRequest('/api/data?param=value').valid).toBe(true);
      
      // Test URLs with fragments
      expect(securityMiddleware.validateRequest('https://example.com/page#section').valid).toBe(true);
      expect(securityMiddleware.validateRequest('/page#section').valid).toBe(true);
      
      // Test URLs with ports
      expect(securityMiddleware.validateRequest('https://example.com:8080/api').valid).toBe(true);
      expect(securityMiddleware.validateRequest('http://localhost:3000/api').valid).toBe(true);
      
      // Test WebSocket URLs
      expect(securityMiddleware.validateRequest('ws://example.com/socket').valid).toBe(true);
      expect(securityMiddleware.validateRequest('wss://example.com/socket').valid).toBe(true);
      
      // Test FTP URLs
      expect(securityMiddleware.validateRequest('ftp://files.example.com/file.txt').valid).toBe(true);
      expect(securityMiddleware.validateRequest('ftps://files.example.com/file.txt').valid).toBe(true);
    });

    it('should handle protocol case sensitivity', () => {
      // Test case variations of dangerous protocols
      expect(securityMiddleware.validateRequest('JAVASCRIPT:alert(1)').valid).toBe(false);
      expect(securityMiddleware.validateRequest('JavaScript:alert(1)').valid).toBe(false);
      expect(securityMiddleware.validateRequest('DATA:text/html,<script>').valid).toBe(false);
      expect(securityMiddleware.validateRequest('VBScript:msgbox(1)').valid).toBe(false);
    });

    it('should validate URL encoding and special characters', () => {
      // Test URL encoded dangerous protocols
      expect(securityMiddleware.validateRequest('java%73cript:alert(1)').valid).toBe(false);
      expect(securityMiddleware.validateRequest('/java%73cript:alert(1)').valid).toBe(false);
      
      // Test URLs with special characters
      expect(securityMiddleware.validateRequest('https://example.com/path with spaces').valid).toBe(true);
      expect(securityMiddleware.validateRequest('/api/users/123').valid).toBe(true);
      expect(securityMiddleware.validateRequest('./api/users?id=123&name=test').valid).toBe(true);
    });

    it('should prevent request size validation bypass attempts', () => {
      // Test with exactly at the limit
      const exactLimitBody = 'x'.repeat(1024 * 1024); // Exactly 1MB
      expect(securityMiddleware.validateRequest('https://api.example.com', {
        body: exactLimitBody
      }).valid).toBe(true);
      
      // Test with one byte over the limit
      const overLimitBody = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
      expect(securityMiddleware.validateRequest('https://api.example.com', {
        body: overLimitBody
      }).valid).toBe(false);
    });
  });

  describe('sanitizeRequestData', () => {
    it('should remove dangerous prototype properties', () => {
      const maliciousData = {
        name: 'test',
        __proto__: { admin: true },
        constructor: { prototype: { admin: true } },
      };
      
      const sanitized = securityMiddleware.sanitizeRequestData(maliciousData);
      
      expect(sanitized).toHaveProperty('name', 'test');
      expect(sanitized).not.toHaveProperty('__proto__');
      expect(sanitized).not.toHaveProperty('constructor');
    });

    it('should sanitize nested objects', () => {
      const data = {
        user: {
          name: '<script>alert("xss")</script>',
          profile: {
            bio: 'javascript:alert("xss")',
          },
        },
      };
      
      const sanitized = securityMiddleware.sanitizeRequestData(data);
      
      expect(sanitized.user.name).not.toContain('<script>');
      expect(sanitized.user.profile.bio).not.toContain('javascript:');
    });

    it('should handle arrays correctly', () => {
      const data = {
        tags: ['<script>', 'normal tag', 'javascript:alert()'],
      };
      
      const sanitized = securityMiddleware.sanitizeRequestData(data);
      
      expect(sanitized.tags[0]).not.toContain('<script>');
      expect(sanitized.tags[1]).toBe('normal tag');
      expect(sanitized.tags[2]).not.toContain('javascript:');
    });

    it('should prevent infinite recursion', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const sanitized = securityMiddleware.sanitizeRequestData(circular);
      
      expect(sanitized).toHaveProperty('name');
      // Should not crash or hang
    });
  });

  describe('processResponse', () => {
    it('should detect missing security headers with correct warning format', () => {
      const mockResponse = new Response('test', {
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      });
      
      const result = securityMiddleware.processResponse(mockResponse);
      
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Missing X-Content-Type-Options header');
      expect(result.warnings).toContain('Missing X-Frame-Options header');
      expect(result.warnings).toContain('Missing X-XSS-Protection header');
    });

    it('should detect suspicious content types with proper warning format', () => {
      const mockResponse = new Response('test', {
        headers: new Headers({
          'Content-Type': 'application/x-msdownload',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        }),
      });
      
      const result = securityMiddleware.processResponse(mockResponse);
      
      expect(result.safe).toBe(false);
      expect(result.warnings?.some(w => w.includes('Suspicious content type detected'))).toBe(true);
    });

    it('should handle plain object responses correctly', () => {
      const mockResponse = {
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"test": "data"}'
      };
      
      const result = securityMiddleware.processResponse(mockResponse);
      
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Missing X-Content-Type-Options header');
      expect(result.warnings).toContain('Missing X-Frame-Options header');
      expect(result.warnings).toContain('Missing X-XSS-Protection header');
    });

    it('should detect dangerous content in HTML responses', () => {
      const mockResponse = {
        headers: {
          'Content-Type': 'text/html',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
        body: '<script>alert("xss")</script>'
      };
      
      const result = securityMiddleware.processResponse(mockResponse);
      
      expect(result.safe).toBe(false);
      expect(result.warnings?.some(w => w.includes('Potentially dangerous content detected'))).toBe(true);
    });

    it('should detect dangerous content in JavaScript responses', () => {
      const mockResponse = {
        headers: {
          'Content-Type': 'application/javascript',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
        body: 'javascript:alert("xss")'
      };
      
      const result = securityMiddleware.processResponse(mockResponse);
      
      expect(result.safe).toBe(false);
      expect(result.warnings?.some(w => w.includes('Potentially dangerous content detected'))).toBe(true);
    });

    it('should pass when all security headers are present', () => {
      const mockResponse = new Response('test', {
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        }),
      });
      
      const result = securityMiddleware.processResponse(mockResponse);
      
      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle case-insensitive header names', () => {
      const mockResponse = {
        headers: {
          'content-type': 'application/json',
          'x-content-type-options': 'nosniff',
          'x-frame-options': 'DENY',
          'x-xss-protection': '1; mode=block',
        }
      };
      
      const result = securityMiddleware.processResponse(mockResponse);
      
      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
  describe('Performance and Security Edge Cases', () => {
    it('should handle very long URLs efficiently', () => {
      const longPath = 'a'.repeat(2000);
      const longUrl = `https://example.com/${longPath}`;
      
      const start = performance.now();
      const result = securityMiddleware.validateRequest(longUrl);
      const end = performance.now();
      
      expect(result.valid).toBe(true);
      expect(end - start).toBeLessThan(10); // Should complete in under 10ms
    });

    it('should handle deeply nested request data sanitization', () => {
      const deepObject: any = { level: 0 };
      let current = deepObject;
      
      // Create 15 levels of nesting (beyond the 10 level limit)
      for (let i = 1; i <= 15; i++) {
        current.next = { level: i, malicious: '<script>alert("xss")</script>' };
        current = current.next;
      }
      
      const sanitized = securityMiddleware.sanitizeRequestData(deepObject);
      
      // Should stop at max depth and not crash
      expect(sanitized).toBeDefined();
      expect(typeof sanitized).toBe('object');
    });

    it('should handle concurrent validation requests', async () => {
      const urls = [
        'https://api1.example.com',
        'https://api2.example.com', 
        'https://api3.example.com',
        '/api/local1',
        '/api/local2'
      ];
      
      const promises = urls.map(url => 
        Promise.resolve(securityMiddleware.validateRequest(url))
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      expect(results.every(r => r.valid)).toBe(true);
    });
  });

  describe('Task 4 Requirements Validation', () => {
    it('should meet all task 4 requirements for URL validation logic', () => {
      // Requirement: Debug and fix URL validation logic in securityMiddleware.validateRequest()
      
      // Test absolute URLs
      expect(securityMiddleware.validateRequest('https://api.example.com/data').valid).toBe(true);
      expect(securityMiddleware.validateRequest('http://localhost:3000/api').valid).toBe(true);
      
      // Test relative URLs  
      expect(securityMiddleware.validateRequest('/api/data').valid).toBe(true);
      expect(securityMiddleware.validateRequest('./api/data').valid).toBe(true);
      expect(securityMiddleware.validateRequest('../api/data').valid).toBe(true);
      
      // Test dangerous protocols are blocked
      expect(securityMiddleware.validateRequest('javascript:alert("xss")').valid).toBe(false);
      expect(securityMiddleware.validateRequest('data:text/html,<script>').valid).toBe(false);
      expect(securityMiddleware.validateRequest('vbscript:msgbox("xss")').valid).toBe(false);
    });

    it('should meet all task 4 requirements for security header detection', () => {
      // Requirement: Implement proper security header detection with correct warning messages
      
      const responseWithoutHeaders = {
        headers: { 'Content-Type': 'application/json' }
      };
      
      const result = securityMiddleware.processResponse(responseWithoutHeaders);
      
      expect(result.safe).toBe(false);
      expect(result.warnings).toContain('Missing X-Content-Type-Options header');
      expect(result.warnings).toContain('Missing X-Frame-Options header');
      expect(result.warnings).toContain('Missing X-XSS-Protection header');
    });

    it('should meet all task 4 requirements for request size validation', () => {
      // Requirement: Add request size validation before URL parsing to prevent format errors
      
      const largeBody = 'x'.repeat(2 * 1024 * 1024); // 2MB - over the 1MB limit
      
      // Test that size validation happens BEFORE URL parsing
      const result = securityMiddleware.validateRequest('https://api.example.com', {
        method: 'POST',
        body: largeBody,
      });
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Request body size too large');
    });

    it('should meet all task 4 requirements for response processing warning format', () => {
      // Requirement: Fix response processing warning format to match test expectations
      
      const responseWithSuspiciousContent = {
        headers: {
          'Content-Type': 'text/html',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
        body: '<script>alert("xss")</script>'
      };
      
      const result = securityMiddleware.processResponse(responseWithSuspiciousContent);
      
      expect(result.safe).toBe(false);
      expect(result.warnings?.some(w => w.includes('Potentially dangerous content detected'))).toBe(true);
    });

    it('should meet all task 4 requirements for comprehensive URL testing', () => {
      // Requirement: Test with both absolute and relative URLs for comprehensive coverage
      
      const testCases = [
        // Absolute URLs - should pass
        { url: 'https://api.example.com/users', expected: true },
        { url: 'http://localhost:3000/api', expected: true },
        { url: 'ws://example.com/socket', expected: true },
        { url: 'wss://secure.example.com/socket', expected: true },
        
        // Relative URLs - should pass
        { url: '/api/users', expected: true },
        { url: './users', expected: true },
        { url: '../users', expected: true },
        { url: '/api/data?param=value', expected: true },
        
        // Dangerous URLs - should fail
        { url: 'javascript:alert("xss")', expected: false },
        { url: 'data:text/html,<script>', expected: false },
        { url: 'vbscript:msgbox("xss")', expected: false },
        { url: '/javascript:alert("xss")', expected: false },
        
        // Malformed URLs - should fail
        { url: 'not-a-valid-url://test', expected: false },
        { url: '', expected: false },
        { url: 'invalid-protocol://example.com', expected: false },
      ];
      
      testCases.forEach(({ url, expected }) => {
        const result = securityMiddleware.validateRequest(url);
        expect(result.valid).toBe(expected);
      });
    });
  });
});

describe('secureFetch', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should add security headers to requests', async () => {
    const mockResponse = new Response('{}', {
      headers: new Headers({
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      }),
    });
    
    (global.fetch as any).mockResolvedValue(mockResponse);
    
    await secureFetch('https://api.example.com/data');
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        }),
      })
    );
  });

  it('should reject requests with invalid URLs', async () => {
    await expect(
      secureFetch('javascript:alert("xss")')
    ).rejects.toThrow();
  });

  it('should sanitize request body', async () => {
    const mockResponse = new Response('{}');
    (global.fetch as any).mockResolvedValue(mockResponse);
    
    const maliciousData = {
      name: 'test',
      __proto__: { admin: true },
    };
    
    await secureFetch('https://api.example.com/data', {
      method: 'POST',
      body: JSON.stringify(maliciousData),
    });
    
    const callArgs = (global.fetch as any).mock.calls[0][1];
    const sentBody = JSON.parse(callArgs.body);
    
    expect(sentBody).not.toHaveProperty('__proto__');
    expect(sentBody).toHaveProperty('name', 'test');
  });
});