/**
 * Secure Storage Tests
 * 
 * Tests for token storage, validation, and cleanup
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  saveToken,
  getToken,
  deleteToken,
  clearAllTokens,
  hasToken,
  TOKEN_KEYS,
} from '../lib/secureStorage';

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

describe('Token Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves valid token successfully', async () => {
    const token = 'valid-token-123';
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    await saveToken(key, token);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(key, token);
  });

  it('throws error when saving invalid token (empty string)', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    await expect(saveToken(key, '')).rejects.toThrow('Invalid token');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('throws error when saving invalid token (null)', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    await expect(saveToken(key, null as any)).rejects.toThrow('Invalid token');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('retrieves stored token successfully', async () => {
    const token = 'stored-token-456';
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(token);

    const result = await getToken(key);

    expect(result).toBe(token);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(key);
  });

  it('returns null when token does not exist', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const result = await getToken(key);

    expect(result).toBeNull();
  });

  it('deletes token successfully', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    await deleteToken(key);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(key);
  });

  it('handles deletion errors gracefully', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(
      new Error('Deletion failed')
    );

    // Should not throw
    await expect(deleteToken(key)).resolves.not.toThrow();
  });
});

describe('Token Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates token exists and is non-empty', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid-token');

    const exists = await hasToken(key);

    expect(exists).toBe(true);
  });

  it('returns false when token is null', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const exists = await hasToken(key);

    expect(exists).toBe(false);
  });

  it('returns false when token is empty string', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('');

    const exists = await hasToken(key);

    expect(exists).toBe(false);
  });
});

describe('Clear All Tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears both access and refresh tokens', async () => {
    await clearAllTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      TOKEN_KEYS.ACCESS_TOKEN
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      TOKEN_KEYS.REFRESH_TOKEN
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
  });

  it('completes even if one deletion fails', async () => {
    (SecureStore.deleteItemAsync as jest.Mock)
      .mockRejectedValueOnce(new Error('Failed to delete access token'))
      .mockResolvedValueOnce(undefined);

    await expect(clearAllTokens()).resolves.not.toThrow();
  });
});

describe('Platform-Specific Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses SecureStore on native platforms', async () => {
    // Already mocked as iOS in Platform mock
    const token = 'native-token';
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    await saveToken(key, token);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(key, token);
  });

  it('falls back to localStorage on web', async () => {
    // Mock Platform.OS as web
    Object.defineProperty(Platform, 'OS', {
      get: () => 'web',
      configurable: true,
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    const token = 'web-token';
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    await saveToken(key, token);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(key, token);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

    // Reset Platform.OS
    Object.defineProperty(Platform, 'OS', {
      get: () => 'ios',
      configurable: true,
    });
  });
});

describe('Token Key Constants', () => {
  it('exports correct token key constants', () => {
    expect(TOKEN_KEYS.ACCESS_TOKEN).toBe('supabase.auth.token');
    expect(TOKEN_KEYS.REFRESH_TOKEN).toBe('supabase.auth.refresh-token');
  });

  it('token keys are read-only', () => {
    expect(() => {
      (TOKEN_KEYS as any).ACCESS_TOKEN = 'modified';
    }).toThrow();
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles storage errors when saving token', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;
    const token = 'valid-token';

    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
      new Error('Storage full')
    );

    await expect(saveToken(key, token)).rejects.toThrow(
      'Failed to save token securely'
    );
  });

  it('handles storage errors when retrieving token', async () => {
    const key = TOKEN_KEYS.ACCESS_TOKEN;

    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
      new Error('Storage error')
    );

    const result = await getToken(key);

    expect(result).toBeNull();
  });
});
