import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage helpers for sensitive data (tokens only)
 * 
 * SECURITY RULES:
 * - Use ONLY for access tokens and refresh tokens
 * - NEVER store service keys or sensitive user data
 * - On web, falls back to localStorage (less secure but functional)
 * - On native, uses platform secure storage (Keychain/Keystore)
 */

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'supabase.auth.token',
  REFRESH_TOKEN: 'supabase.auth.refresh-token',
} as const;

/**
 * Validates that a token is a non-empty string
 */
const isValidToken = (token: string | null): boolean => {
  return typeof token === 'string' && token.length > 0;
};

/**
 * Save a token securely
 * @param key - Token key (use TOKEN_KEYS constants)
 * @param value - Token value to store
 * @throws Error if token is invalid or storage fails
 */
export const saveToken = async (key: string, value: string): Promise<void> => {
  if (!isValidToken(value)) {
    throw new Error('Invalid token: must be a non-empty string');
  }

  try {
    if (Platform.OS === 'web') {
      // Web fallback to localStorage
      localStorage.setItem(key, value);
    } else {
      // Native secure storage
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error('[SecureStorage] Failed to save token', { key });
    throw new Error('Failed to save token securely');
  }
};

/**
 * Retrieve a token from secure storage
 * @param key - Token key (use TOKEN_KEYS constants)
 * @returns Token value or null if not found
 */
export const getToken = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('[SecureStorage] Failed to get token', { key });
    return null;
  }
};

/**
 * Delete a token from secure storage
 * @param key - Token key (use TOKEN_KEYS constants)
 */
export const deleteToken = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('[SecureStorage] Failed to delete token', { key });
    // Don't throw - deletion failure is not critical
  }
};

/**
 * Clear all stored tokens (use on logout)
 */
export const clearAllTokens = async (): Promise<void> => {
  await Promise.all([
    deleteToken(TOKEN_KEYS.ACCESS_TOKEN),
    deleteToken(TOKEN_KEYS.REFRESH_TOKEN),
  ]);
};

/**
 * Check if a token exists in storage
 * @param key - Token key to check
 * @returns true if token exists and is valid
 */
export const hasToken = async (key: string): Promise<boolean> => {
  const token = await getToken(key);
  return isValidToken(token);
};

// Export token key constants for use in other modules
export { TOKEN_KEYS };
