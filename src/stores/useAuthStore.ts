import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserProfile, UserSettings } from '@/schemas/user';
import { authService } from '@/services/AuthService';
import { logger } from '@/utils';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  register: (email: string, username: string, password: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set((state) => ({
          ...state,
          isLoading: true,
          error: null,
        }));

        try {
          const response = await authService.login({ email, password });
          
          set((state) => ({
            ...state,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          }));

          logger.info('User logged in successfully', { userId: response.user.id });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set((state) => ({
            ...state,
            error: errorMessage,
            isLoading: false,
          }));
          logger.error('Login failed', error);
        }
      },

      loginAsGuest: () => {
        try {
          const guestUser = authService.createGuestUser();
          
          set((state) => ({
            ...state,
            user: guestUser,
            isAuthenticated: true,
          }));

          logger.info('User logged in as guest', { userId: guestUser.id });
        } catch (error) {
          logger.error('Guest login failed', error);
          set((state) => ({
            ...state,
            error: 'Failed to create guest session',
          }));
        }
      },

      logout: () => {
        const { user } = get();
        
        authService.logout();
        
        set((state) => ({
          ...state,
          user: null,
          isAuthenticated: false,
        }));

        logger.info('User logged out', { userId: user?.id });
      },

      register: async (email, username, password) => {
        set((state) => ({
          ...state,
          isLoading: true,
          error: null,
        }));

        try {
          const response = await authService.register({
            email,
            username,
            password,
            display_name: username,
            fitness_level: 'beginner',
          });

          set((state) => ({
            ...state,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          }));

          logger.info('User registered successfully', { userId: response.user.id });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set((state) => ({
            ...state,
            error: errorMessage,
            isLoading: false,
          }));
          logger.error('Registration failed', error);
        }
      },

      updateProfile: (profile) => {
        const { user } = get();
        if (!user) return;

        // Update in AuthService storage
        authService.updateUserProfile(profile);

        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            ...profile,
          },
        };

        set((state) => ({
          ...state,
          user: updatedUser,
        }));

        logger.info('User profile updated', { userId: user.id, updates: profile });
      },

      updateSettings: (settings) => {
        const { user } = get();
        if (!user) return;

        // Update in AuthService storage
        authService.updateUserSettings(settings);

        const updatedUser = {
          ...user,
          settings: {
            ...user.settings,
            ...settings,
          },
        };

        set((state) => ({
          ...state,
          user: updatedUser,
        }));

        logger.info('User settings updated', { userId: user.id, updates: settings });
      },

      clearError: () => {
        set((state) => ({
          ...state,
          error: null,
        }));
      },

      initializeAuth: () => {
        try {
          const storedUser = authService.getCurrentUser();
          const isAuthenticated = authService.isAuthenticated();

          if (storedUser && isAuthenticated) {
            set((state) => ({
              ...state,
              user: storedUser,
              isAuthenticated: true,
            }));

            logger.info('Auth initialized from storage', { userId: storedUser.id });
          } else {
            // Clear any invalid stored data
            authService.logout();
            set((state) => ({
              ...state,
              user: null,
              isAuthenticated: false,
            }));

            logger.info('Auth initialized - no valid session found');
          }
        } catch (error) {
          logger.error('Auth initialization failed', error);
          set((state) => ({
            ...state,
            user: null,
            isAuthenticated: false,
            error: 'Failed to initialize authentication',
          }));
        }
      },
    }),
    {
      name: 'sport-tracker-auth-storage',
      // Don't persist auth state in Zustand since AuthService handles persistence
      partialize: () => ({}),
    }
  )
);