/**
 * XSS Protection Tests
 * Tests for Cross-Site Scripting prevention utilities
 */

import { describe, it, expect } from 'vitest';
import { sanitizeUserContent, sanitizeUrl, sanitizeHtml } from '@/utils/xssProtection';

describe('XSS Protection', () => {
  describe('sanitizeUserContent', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello World';
      const result = sanitizeUserContent(malicious);
      expect(result).toBe('Hello World');
      expect(result).not.toContain('<script>');
    });

    it('should remove javascript: protocols', () => {
      const malicious = 'javascript:alert("xss")';
      const result = sanitizeUserContent(malicious);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const malicious = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = sanitizeUserContent(malicious);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should preserve safe text content', () => {
      const safe = 'Hello World! This is safe content.';
      const result = sanitizeUserContent(safe);
      expect(result).toBe(safe);
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeUserContent('')).toBe('');
      expect(sanitizeUserContent(null as any)).toBe('');
      expect(sanitizeUserContent(undefined as any)).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow safe URLs', () => {
      const safeUrl = 'https://example.com/path';
      const result = sanitizeUrl(safeUrl);
      expect(result).toBe(safeUrl);
    });

    it('should block javascript: URLs', () => {
      const malicious = 'javascript:alert("xss")';
      const result = sanitizeUrl(malicious);
      expect(result).toBe('');
    });

    it('should block data: URLs', () => {
      const malicious = 'data:text/html,<script>alert("xss")</script>';
      const result = sanitizeUrl(malicious);
      expect(result).toBe('');
    });

    it('should block vbscript: URLs', () => {
      const malicious = 'vbscript:msgbox("xss")';
      const result = sanitizeUrl(malicious);
      expect(result).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const safeHtml = '<p>Hello <strong>World</strong>!</p>';
      const result = sanitizeHtml(safeHtml);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
    });

    it('should remove dangerous HTML tags', () => {
      const dangerous = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(dangerous);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should remove dangerous attributes', () => {
      const dangerous = '<p onclick="alert(\'xss\')">Click me</p>';
      const result = sanitizeHtml(dangerous);
      expect(result).not.toContain('onclick');
      expect(result).toContain('<p>Click me</p>');
    });
  });
});