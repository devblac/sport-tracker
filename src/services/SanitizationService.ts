import DOMPurify from 'isomorphic-dompurify';
import { logger } from '@/utils';

interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  maxLength?: number;
  stripHtml?: boolean;
}

class SanitizationService {
  private readonly defaultOptions: SanitizationOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
    maxLength: 1000,
    stripHtml: false,
  };

  /**
   * Sanitize HTML content for safe display
   */
  sanitizeHtml(content: string, options: SanitizationOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Configure DOMPurify
      const config: any = {
        ALLOWED_TAGS: opts.allowedTags,
        ALLOWED_ATTR: Object.keys(opts.allowedAttributes || {}),
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
      };

      let sanitized = DOMPurify.sanitize(content, config);
      
      // Strip all HTML if requested
      if (opts.stripHtml) {
        sanitized = this.stripHtmlTags(sanitized);
      }
      
      // Enforce length limit
      if (opts.maxLength && sanitized.length > opts.maxLength) {
        sanitized = sanitized.substring(0, opts.maxLength) + '...';
      }
      
      return sanitized;
    } catch (error) {
      logger.error('HTML sanitization failed', error);
      return this.stripHtmlTags(content).substring(0, opts.maxLength || 1000);
    }
  }

  /**
   * Sanitize plain text input
   */
  sanitizeText(text: string, maxLength: number = 1000): string {
    if (!text || typeof text !== 'string') return '';
    
    // Remove control characters and normalize whitespace
    let sanitized = text
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Enforce length limit
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  /**
   * Sanitize workout/exercise names and descriptions
   */
  sanitizeWorkoutData(data: {
    name?: string;
    description?: string;
    notes?: string;
  }): typeof data {
    return {
      ...data,
      name: data.name ? this.sanitizeText(data.name, 100) : data.name,
      description: data.description ? this.sanitizeHtml(data.description, {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        maxLength: 2000,
      }) : data.description,
      notes: data.notes ? this.sanitizeText(data.notes, 500) : data.notes,
    };
  }

  /**
   * Sanitize social post content
   */
  sanitizeSocialPost(content: string): string {
    return this.sanitizeHtml(content, {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
      maxLength: 500,
      stripHtml: false,
    });
  }

  /**
   * Validate and sanitize file names
   */
  sanitizeFileName(fileName: string): string {
    if (!fileName) return '';
    
    // Remove path traversal attempts and dangerous characters
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove dangerous chars
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .substring(0, 255); // Limit length
  }

  /**
   * Strip all HTML tags from content
   */
  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Validate URL for safety
   */
  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow http/https protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Sanitize URL for safe usage
   */
  sanitizeUrl(url: string): string | null {
    if (!this.isValidUrl(url)) return null;
    
    try {
      const parsed = new URL(url);
      // Remove potentially dangerous parameters
      parsed.searchParams.delete('javascript');
      parsed.searchParams.delete('data');
      parsed.searchParams.delete('vbscript');
      
      return parsed.toString();
    } catch {
      return null;
    }
  }
}

export const sanitizationService = new SanitizationService();