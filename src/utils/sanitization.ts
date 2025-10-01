/**
 * Content Sanitization Utilities
 * Prevents XSS attacks and ensures safe user-generated content
 */

// HTML entity map for consistent encoding
const HTML_ENTITIES: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '&': '&amp;',
  '`': '&#x60;',
  '=': '&#x3D;',
} as const;

// Simple HTML sanitization - remove all HTML tags and dangerous characters
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input.replace(/[<>"'/&`=]/g, (match) => HTML_ENTITIES[match] || match);
};

// Sanitize user display names and usernames
export const sanitizeDisplayName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .replace(/[<>\"'&()\/]/g, '') // Remove dangerous characters including parentheses and slashes
    .replace(/<script.*?>.*?<\/script>/gi, '') // Remove script tags completely
    .substring(0, 50); // Limit length
};

// Sanitize user bio and comments
export const sanitizeUserContent = (content: string): string => {
  if (!content || typeof content !== 'string') return '';
  
  return content
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .substring(0, 1000); // Limit length
};

// Dangerous protocols that should be blocked
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'ftp:',
  'about:',
  'chrome:',
  'chrome-extension:',
  'moz-extension:',
] as const;

// Allowed protocols for URLs
const ALLOWED_PROTOCOLS = [
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'sms:',
] as const;

// Sanitize URLs to prevent dangerous protocols
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  
  try {
    // Try to parse as URL to validate format
    const urlObj = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed);
    
    // Check if protocol is dangerous
    if (DANGEROUS_PROTOCOLS.some(protocol => urlObj.protocol === protocol)) {
      return '';
    }
    
    // Check if protocol is allowed
    if (!ALLOWED_PROTOCOLS.some(protocol => urlObj.protocol === protocol)) {
      return '';
    }
    
    // Get the URL string and ensure trailing slash for http/https root URLs
    let result = urlObj.toString();
    if ((urlObj.protocol === 'http:' || urlObj.protocol === 'https:') && 
        urlObj.pathname === '/' && !urlObj.search && !urlObj.hash && 
        !result.endsWith('/')) {
      result += '/';
    }
    
    return result;
  } catch {
    // If URL parsing fails, try to construct a safe URL
    const lowerUrl = trimmed.toLowerCase();
    
    // Block dangerous protocols even in malformed URLs
    if (DANGEROUS_PROTOCOLS.some(protocol => lowerUrl.startsWith(protocol))) {
      return '';
    }
    
    // If it looks like a domain, add https with trailing slash
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (domainRegex.test(trimmed)) {
      return `https://${trimmed}/`;
    }
    
    return '';
  }
};

// Sanitize search queries
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>\"'&()\/]/g, '') // Remove dangerous characters including parentheses and slashes
    .replace(/<script.*?>.*?<\/script>/gi, '') // Remove script tags completely
    .substring(0, 100); // Limit length
};

// Sanitize file names for uploads
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') return '';
  
  return fileName
    .replace(/\.\.\//g, '_._') // Prevent directory traversal - replace ../ with _._
    .replace(/\.\./g, '._') // Handle remaining .. patterns
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace all non-safe chars with underscore
    .substring(0, 255); // Limit length
};