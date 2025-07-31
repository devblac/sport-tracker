/**
 * ID Generation Utilities
 * Provides functions for generating unique IDs for various entities
 */

/**
 * Generates a unique ID with an optional prefix
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}${randomPart}`;
  
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generates a UUID v4 (random UUID)
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generates a short ID (8 characters)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Generates a numeric ID
 */
export function generateNumericId(): number {
  return Math.floor(Math.random() * 1000000000);
}