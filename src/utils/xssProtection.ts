/**
 * XSS Protection Utilities
 * Comprehensive protection against Cross-Site Scripting attacks
 */

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

// Configure DOMPurify for safe HTML sanitization
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, purifyConfig);
};

/**
 * Sanitize user display content (posts, comments, bios)
 */
export const sanitizeUserContent = (content: string): string => {
  if (!content || typeof content !== 'string') return '';
  
  // First pass: Remove dangerous protocols
  let cleaned = content;
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  dangerousProtocols.forEach(protocol => {
    const regex = new RegExp(protocol, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Second pass: Remove all HTML tags for user content
  return DOMPurify.sanitize(cleaned, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
};

/**
 * Sanitize URLs to prevent javascript: and data: injection
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const cleaned = DOMPurify.sanitize(url);
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  const lowerUrl = cleaned.toLowerCase();
  
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    return '';
  }
  
  return cleaned;
};

// React component is exported from a separate file to avoid JSX parsing issues
// See: src/components/ui/SafeHtml.tsx