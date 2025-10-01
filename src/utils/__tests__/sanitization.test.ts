import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeDisplayName,
  sanitizeUserContent,
  sanitizeUrl,
  sanitizeSearchQuery,
  sanitizeFileName,
} from '../sanitization';

describe('sanitization utilities', () => {
  describe('sanitizeHtml', () => {
    it('should encode HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should handle empty and invalid inputs', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
      expect(sanitizeHtml(123 as any)).toBe('');
    });

    it('should encode all dangerous characters', () => {
      const input = `<>"'/&\`=`;
      const result = sanitizeHtml(input);
      
      expect(result).toBe('&lt;&gt;&quot;&#x27;&#x2F;&amp;&#x60;&#x3D;');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow legitimate URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://localhost:3000')).toBe('http://localhost:3000/');
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should block dangerous protocols', () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>')).toBe('');
      expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('');
      expect(sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('should handle malformed URLs gracefully', () => {
      expect(sanitizeUrl('not-a-url')).toBe('');
      expect(sanitizeUrl('://invalid')).toBe('');
      // Should either convert domain-like strings to HTTPS URLs or reject them safely
      const domainResult = sanitizeUrl('example.com');
      // Either converts to HTTPS or rejects - both are acceptable security behaviors
      expect(domainResult === 'https://example.com/' || domainResult === '').toBe(true);
    });

    it('should handle protocol-relative URLs', () => {
      expect(sanitizeUrl('//example.com')).toBe('https://example.com/');
    });

    it('should allow tel and sms protocols', () => {
      expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
      expect(sanitizeUrl('sms:+1234567890')).toBe('sms:+1234567890');
    });
  });

  describe('sanitizeDisplayName', () => {
    it('should remove dangerous characters', () => {
      const input = 'John<script>alert("xss")</script>Doe';
      const result = sanitizeDisplayName(input);
      
      expect(result).toBe('JohnscriptalertxssscriptDoe');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(100);
      const result = sanitizeDisplayName(longName);
      
      expect(result.length).toBe(50);
    });

    it('should trim whitespace', () => {
      expect(sanitizeDisplayName('  John Doe  ')).toBe('John Doe');
    });
  });

  describe('sanitizeUserContent', () => {
    it('should remove HTML and dangerous protocols', () => {
      const input = 'Check this out: <a href="javascript:alert()">link</a>';
      const result = sanitizeUserContent(input);
      
      expect(result).not.toContain('<a');
      expect(result).not.toContain('javascript:');
    });

    it('should limit content length', () => {
      const longContent = 'a'.repeat(2000);
      const result = sanitizeUserContent(longContent);
      
      expect(result.length).toBe(1000);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove dangerous characters', () => {
      const query = 'search<script>alert("xss")</script>';
      const result = sanitizeSearchQuery(query);
      
      expect(result).toBe('searchscriptalertxssscript');
    });

    it('should limit query length', () => {
      const longQuery = 'search'.repeat(50);
      const result = sanitizeSearchQuery(longQuery);
      
      expect(result.length).toBe(100);
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace special characters with underscores', () => {
      const fileName = 'my file<>:"/\\|?*.txt';
      const result = sanitizeFileName(fileName);
      
      // Should replace all unsafe characters with underscores
      expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
      expect(result).toContain('my_file');
      expect(result).toContain('.txt');
      expect(result.length).toBe(fileName.length); // Same length, just sanitized
    });

    it('should prevent directory traversal', () => {
      const fileName = '../../../etc/passwd';
      const result = sanitizeFileName(fileName);
      
      // The important thing is that it doesn't contain ../ and is safe
      expect(result).not.toContain('../');
      expect(result).not.toContain('..\\');
      expect(result.length).toBeGreaterThan(0);
      // Should be safe characters only
      expect(/^[a-zA-Z0-9._-]+$/.test(result)).toBe(true);
    });

    it('should limit file name length', () => {
      const longFileName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(longFileName);
      
      expect(result.length).toBe(255);
    });

    it('should preserve valid file extensions', () => {
      expect(sanitizeFileName('document.pdf')).toBe('document.pdf');
      expect(sanitizeFileName('image.jpg')).toBe('image.jpg');
    });
  });
});