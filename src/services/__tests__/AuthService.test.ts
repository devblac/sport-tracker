import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../AuthService';
import { storage } from '@/utils';

// Mock the storage utility
vi.mock('@/utils', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid demo credentials', async () => {
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo123!',
      };

      const result = await authService.login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(credentials.email);
      expect(result.user.role).toBe('premium');
      expect(result.user.is_active).toBe(true);
    });

    it('should throw error with invalid credentials', async () => {
      const credentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
    });

    it('should validate email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'Demo123!',
      };

      await expect(authService.login(credentials)).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!',
        display_name: 'Test User',
        fitness_level: 'beginner' as const,
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.user.role).toBe('basic');
      expect(result.user.is_active).toBe(true);
      expect(result.user.profile.display_name).toBe(userData.display_name);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: '',
        username: 'test',
        password: 'weak',
        display_name: '',
      };

      await expect(authService.register(invalidData as any)).rejects.toThrow();
    });
  });

  describe('createGuestUser', () => {
    it('should create a guest user with correct properties', () => {
      const guestUser = authService.createGuestUser();

      expect(guestUser.role).toBe('guest');
      expect(guestUser.username).toBe('guest');
      expect(guestUser.email).toBe('');
      expect(guestUser.is_active).toBe(true);
      expect(guestUser.profile.display_name).toBe('Guest User');
      expect(guestUser.settings.privacy.profile_visibility).toBe('private');
      expect(guestUser.id).toMatch(/^guest-/);
    });

    it('should store guest user in localStorage', () => {
      authService.createGuestUser();
      expect(storage.set).toHaveBeenCalledWith('sport-tracker-user', expect.any(Object));
    });
  });

  describe('getCurrentUser', () => {
    it('should return stored user', () => {
      const mockUser = { id: 'test-user', role: 'basic' };
      (storage.get as any).mockReturnValue(mockUser);

      const result = authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(storage.get).toHaveBeenCalledWith('sport-tracker-user');
    });

    it('should return null if no user stored', () => {
      (storage.get as any).mockReturnValue(null);

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for guest users', () => {
      const guestUser = { role: 'guest', id: 'guest-123' };
      (storage.get as any).mockReturnValue(guestUser);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return true for registered users with valid token', () => {
      const registeredUser = { role: 'basic', id: 'user-123' };
      (storage.get as any).mockImplementation((key) => {
        if (key === 'sport-tracker-user') return registeredUser;
        if (key === 'sport-tracker-access-token') return 'valid-token';
        if (key === 'sport-tracker-token-expires') return Date.now() + 3600000; // 1 hour from now
        return null;
      });

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false for registered users with expired token', () => {
      const registeredUser = { role: 'basic', id: 'user-123' };
      (storage.get as any).mockImplementation((key) => {
        if (key === 'sport-tracker-user') return registeredUser;
        if (key === 'sport-tracker-access-token') return 'expired-token';
        if (key === 'sport-tracker-token-expires') return Date.now() - 3600000; // 1 hour ago
        return null;
      });

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear all stored auth data', () => {
      authService.logout();

      expect(storage.remove).toHaveBeenCalledWith('sport-tracker-access-token');
      expect(storage.remove).toHaveBeenCalledWith('sport-tracker-refresh-token');
      expect(storage.remove).toHaveBeenCalledWith('sport-tracker-token-expires');
      expect(storage.remove).toHaveBeenCalledWith('sport-tracker-user');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile and store updated user', () => {
      const currentUser = {
        id: 'user-123',
        profile: { display_name: 'Old Name', fitness_level: 'beginner' },
      };
      (storage.get as any).mockReturnValue(currentUser);

      const updates = { display_name: 'New Name' };
      authService.updateUserProfile(updates);

      expect(storage.set).toHaveBeenCalledWith('sport-tracker-user', expect.objectContaining({
        profile: expect.objectContaining({
          display_name: 'New Name',
          fitness_level: 'beginner', // Should preserve existing values
        }),
      }));
    });

    it('should throw error if no user found', () => {
      (storage.get as any).mockReturnValue(null);

      expect(() => {
        authService.updateUserProfile({ display_name: 'Test' });
      }).toThrow('No user found');
    });
  });
});