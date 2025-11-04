/**
 * Authentication Flow Tests
 * 
 * Tests for sign up, login, logout, and token management
 */

import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import * as SecureStorage from '../lib/secureStorage';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
    })),
  },
  setupAuthListener: jest.fn((callback) => {
    return jest.fn(); // Return unsubscribe function
  }),
}));

// Mock SecureStorage
jest.mock('../lib/secureStorage', () => ({
  clearAllTokens: jest.fn(() => Promise.resolve()),
  saveToken: jest.fn(() => Promise.resolve()),
  getToken: jest.fn(() => Promise.resolve(null)),
  deleteToken: jest.fn(() => Promise.resolve()),
}));

describe('useAuth Hook - Sign Up', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully signs up a new user with valid inputs', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User',
      xp: 0,
      level: 1,
      current_streak: 0,
      longest_streak: 0,
    };

    const mockAuthData = {
      user: { id: 'user-123', email: 'test@example.com' },
      session: { access_token: 'token-123', refresh_token: 'refresh-123' },
    };

    // Mock successful auth signup
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: mockAuthData,
      error: null,
    });

    // Mock successful profile creation
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        })),
      })),
    });

    // Mock initial session check
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signUpResult: any;
    await act(async () => {
      signUpResult = await result.current.signUp({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser',
        displayName: 'Test User',
      });
    });

    expect(signUpResult.success).toBe(true);
    expect(signUpResult.user).toEqual(mockUser);
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
    });
  });

  it('fails to sign up with invalid email format', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid email format' },
    });

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signUpResult: any;
    await act(async () => {
      signUpResult = await result.current.signUp({
        email: 'invalid-email',
        password: 'Password123!',
        username: 'testuser',
      });
    });

    expect(signUpResult.success).toBe(false);
    expect(signUpResult.error).toBe('Invalid email format');
  });

  it('fails to sign up with weak password', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Password should be at least 6 characters' },
    });

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signUpResult: any;
    await act(async () => {
      signUpResult = await result.current.signUp({
        email: 'test@example.com',
        password: '123',
        username: 'testuser',
      });
    });

    expect(signUpResult.success).toBe(false);
    expect(signUpResult.error).toContain('Password');
  });
});

describe('useAuth Hook - Sign In', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully signs in with correct credentials', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User',
      xp: 100,
      level: 2,
      current_streak: 5,
      longest_streak: 10,
    };

    const mockAuthData = {
      user: { id: 'user-123', email: 'test@example.com' },
      session: { access_token: 'token-123', refresh_token: 'refresh-123' },
    };

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: mockAuthData,
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        })),
      })),
    });

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signInResult: any;
    await act(async () => {
      signInResult = await result.current.signIn({
        email: 'test@example.com',
        password: 'Password123!',
      });
    });

    expect(signInResult.success).toBe(true);
    expect(signInResult.user).toEqual(mockUser);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
    });
  });

  it('fails to sign in with incorrect password', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signInResult: any;
    await act(async () => {
      signInResult = await result.current.signIn({
        email: 'test@example.com',
        password: 'WrongPassword',
      });
    });

    expect(signInResult.success).toBe(false);
    expect(signInResult.error).toBe('Invalid login credentials');
  });

  it('fails to sign in with non-existent email', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signInResult: any;
    await act(async () => {
      signInResult = await result.current.signIn({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });
    });

    expect(signInResult.success).toBe(false);
    expect(signInResult.error).toBe('Invalid login credentials');
  });
});

describe('useAuth Hook - Token Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('automatically refreshes expired tokens', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    };

    const initialSession = {
      access_token: 'old-token',
      refresh_token: 'refresh-token',
      user: { id: 'user-123' },
    };

    const refreshedSession = {
      access_token: 'new-token',
      refresh_token: 'refresh-token',
      user: { id: 'user-123' },
    };

    // Initial session with old token
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: initialSession },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        })),
      })),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.session?.access_token).toBe('old-token');
    });

    // Simulate token refresh via auth state change
    const authStateCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0];
    
    await act(async () => {
      await authStateCallback('TOKEN_REFRESHED', refreshedSession);
    });

    await waitFor(() => {
      expect(result.current.session?.access_token).toBe('new-token');
    });
  });
});

describe('useAuth Hook - Sign Out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully signs out and clears tokens', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    };

    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      user: { id: 'user-123' },
    };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        })),
      })),
    });

    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
    });

    let signOutResult: any;
    await act(async () => {
      signOutResult = await result.current.signOut();
    });

    expect(signOutResult.success).toBe(true);
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(SecureStorage.clearAllTokens).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('clears local state even if sign out fails', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    };

    const mockSession = {
      access_token: 'token-123',
      user: { id: 'user-123' },
    };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        })),
      })),
    });

    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: { message: 'Network error' },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    // Should clear local state even on error
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });
});

describe('useAuth Hook - Data Cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears all tokens on logout', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(SecureStorage.clearAllTokens).toHaveBeenCalled();
  });

  it('handles session persistence on app restart', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    };

    const mockSession = {
      access_token: 'persisted-token',
      refresh_token: 'refresh-token',
      user: { id: 'user-123' },
    };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
        })),
      })),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });
  });
});
