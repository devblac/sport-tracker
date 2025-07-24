import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../useAuthStore';
import { authService } from '@/services/AuthService';

// Mock the AuthService
vi.mock('@/services/AuthService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    createGuestUser: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    updateUserProfile: vi.fn(),
    updateUserSettings: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/utils', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'basic',
        profile: { display_name: 'Test User' },
      };
      const mockResponse = { user: mockUser, tokens: { accessToken: 'token' } };
      
      (authService.login as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle login error', async () => {
      (authService.login as any).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      (authService.login as any).mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!({ user: { id: 'test' }, tokens: {} });
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should successfully register user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'basic',
        profile: { display_name: 'Test User' },
      };
      const mockResponse = { user: mockUser, tokens: { accessToken: 'token' } };
      
      (authService.register as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register('test@example.com', 'testuser', 'password');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('loginAsGuest', () => {
    it('should create guest user', () => {
      const mockGuestUser = {
        id: 'guest-123',
        role: 'guest',
        profile: { display_name: 'Guest User' },
      };
      
      (authService.createGuestUser as any).mockReturnValue(mockGuestUser);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.loginAsGuest();
      });

      expect(result.current.user).toEqual(mockGuestUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user state and call authService logout', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: { id: 'user-123' } as any,
          isAuthenticated: true,
        });
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('initializeAuth', () => {
    it('should initialize with stored user if authenticated', () => {
      const mockUser = { id: 'user-123', role: 'basic' };
      (authService.getCurrentUser as any).mockReturnValue(mockUser);
      (authService.isAuthenticated as any).mockReturnValue(true);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initializeAuth();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear state if no valid session found', () => {
      (authService.getCurrentUser as any).mockReturnValue(null);
      (authService.isAuthenticated as any).mockReturnValue(false);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initializeAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
      const mockUser = {
        id: 'user-123',
        profile: { display_name: 'Old Name', fitness_level: 'beginner' },
      };
      
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ user: mockUser as any });
      });

      const updates = { display_name: 'New Name' };

      act(() => {
        result.current.updateProfile(updates);
      });

      expect(authService.updateUserProfile).toHaveBeenCalledWith(updates);
      expect(result.current.user?.profile.display_name).toBe('New Name');
    });

    it('should not update if no user', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateProfile({ display_name: 'Test' });
      });

      expect(authService.updateUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ error: 'Some error' });
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});