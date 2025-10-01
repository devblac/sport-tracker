/**
 * Safe HTML Component
 * React component wrapper for safe HTML rendering with XSS protection
 */

import React from 'react';
import { sanitizeHtml, sanitizeUserContent } from '@/utils/xssProtection';

interface SafeHtmlProps {
  content: string;
  className?: string;
  allowBasicFormatting?: boolean;
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ 
  content, 
  className, 
  allowBasicFormatting = false 
}) => {
  const sanitized = allowBasicFormatting 
    ? sanitizeHtml(content)
    : sanitizeUserContent(content);
    
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};