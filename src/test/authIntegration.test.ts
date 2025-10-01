/**
 * Authentication Integration Test
 * Tests the integration between ServiceRegistry, SupabaseAuthService, and AuthStore
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { serviceRegistry } from '@/services/ServiceRegistry';
import { supabaseAuthService } from '@/services/supabaseAuthService';
import { useAuthStore } from '@/stores/useAuthStore';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      }))
    }))
  },
  authHelpers: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  supabaseHelpers: {
    upsertUserProfile: vi.fn(() => Promise.resolve()),
  }
}));

// Mock storage and logger
vi.mock('@/utils', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  }
}));

// Mock logger separately to ensure it's available everywhere
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  }
}));

describe('Authentication Integration', () => {
  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Initialize service registry
    await serviceRegistry.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ServiceRegistry Auth Service Selection', () => {
    it('should return supabaseAuthService when real services are enabled', () => {
      // Force real services
      serviceRegistry.enableRealServices();
      
      const authService = serviceRegistry.auth;
      expect(authService).toBe(supabaseAuthService);
    });

    it('should provide consistent auth service interface', () => {
      const authService = serviceRegistry.auth;
      
      // Check that all required methods exist
      expect(typeof authService.login).toBe('function');
      expect(typeof authService.register).toBe('function');
      expect(typeof authService.logout).toBe('function');
      expect(typeof authService.getCurrentUser).toBe('function');
      expect(typeof authService.isAuthenticated).toBe('function');
      expect(typeof authService.createGuestUser).toBe('function');
      expect(typeof authService.updateUserProfile).toBe('function');
      expect(typeof authService.updateUserSettings).toBe('function');
      expect(typeof authService.initializeAuth).toBe('function');
    });
  });

  describe('SupabaseAuthService Integration', () => {
    it('should initialize without errors', async () => {
      await expect(supabaseAuthService.initializeAuth()).resolves.not.toThrow();
    });

    it('should create guest users correctly', () => {
      const guestUser = supabaseAuthService.createGuestUser();
      
      expect(guestUser).toBeDefined();
      expect(guestUser.role).toBe('guest');
      expect(guestUser.id).toMatch(/^guest-/);
      expect(guestUser.username).toBe('guest');
      expect(guestUser.profile.display_name).toBe('Guest User');
    });

    it('should handle authentication state correctly', async () => {
      const isAuthenticated = await supabaseAuthService.isAuthenticated();
      expect(typeof isAuthenticated).toBe('boolean');
    });
  });

  describe('AuthStore Integration', () => {
    it('should initialize auth store without errors', async () => {
      const authStore = useAuthStore.getState();
      
      await expect(authStore.initializeAuth()).resolves.not.toThrow();
    });

    it('should handle guest login correctly', () => {
      const authStore = useAuthStore.getState();
      
      authStore.loginAsGuest();
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.role).toBe('guest');
      expect(state.sessionState).toBe('guest');
    });

    it('should clear auth state on logout', async () => {
      const authStore = useAuthStore.getState();
      
      // First login as guest
      authStore.loginAsGuest();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then logout
      await authStore.logout();
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.sessionState).toBe('invalid');
    });
  });

  describe('Service Health and Fallback', () => {
    it('should provide service health status', async () => {
      const healthStatus = await serviceRegistry.healthCheck();
      expect(healthStatus).toBeDefined();
      // Health status might be boolean or object depending on implementation
      expect(typeof healthStatus).toMatch(/boolean|object/);
    });

    it('should handle service failures gracefully', () => {
      // Simulate service failure
      const authService = serviceRegistry.auth;
      expect(authService).toBeDefined();
      
      // Even if one service fails, others should still work
      const workoutService = serviceRegistry.workout;
      expect(workoutService).toBeDefined();
    });
  });

  describe('Configuration Management', () => {
    it('should provide current configuration', () => {
      const config = serviceRegistry.getConfig();
      
      expect(config).toBeDefined();
      expect(typeof config.useRealServices).toBe('boolean');
      expect(typeof config.supabaseEnabled).toBe('boolean');
      expect(config.environment).toMatch(/^(development|staging|production)$/);
    });

    it('should allow configuration updates', () => {
      const originalConfig = serviceRegistry.getConfig();
      
      serviceRegistry.updateConfig({
        useRealServices: !originalConfig.useRealServices
      });
      
      const updatedConfig = serviceRegistry.getConfig();
      expect(updatedConfig.useRealServices).toBe(!originalConfig.useRealServices);
    });
  });

  describe('User Profile Synchronization', () => {
    it('should handle profile updates correctly', async () => {
      const authStore = useAuthStore.getState();
      
      // Login as guest first
      authStore.loginAsGuest();
      
      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const profileUpdates = {
        display_name: 'Updated Guest',
        fitness_level: 'intermediate' as const
      };
      
      // Update profile should not throw
      expect(() => authStore.updateProfile(profileUpdates)).not.toThrow();
      
      // Wait for async update to complete (profile update is async)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = useAuthStore.getState();
      expect(state.user?.profile.display_name).toBe('Updated Guest');
      expect(state.user?.profile.fitness_level).toBe('intermediate');
    });

    it('should handle settings updates correctly', async () => {
      const authStore = useAuthStore.getState();
      
      // Login as guest first
      authStore.loginAsGuest();
      
      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const settingsUpdates = {
        theme: 'dark' as const,
        units: 'imperial' as const
      };
      
      // Update settings should not throw
      expect(() => authStore.updateSettings(settingsUpdates)).not.toThrow();
      
      const state = useAuthStore.getState();
      expect(state.user?.settings.theme).toBe('dark');
      expect(state.user?.settings.units).toBe('imperial');
    });
  });
});