import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserProfile, UserSettings } from '@/schemas/user';
import { supabaseAuthService } from '@/services/supabaseAuthService';
import { syncService } from '@/services/syncService';
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
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
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
          const response = await supabaseAuthService.login({ email, password });
          
          set((state) => ({
            ...state,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          }));

          // Trigger sync for registered users
          if (response.user.role !== 'guest') {
            syncService.syncNow();
          }

          logger.info('User logged in successfully', { userId: response.user.id });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set((state) => ({
            ...state,
            error: errorMessage,
            isLoading: false,
          }));
          logger.error('Login failed', error);
          
          // Re-throw error for form handling, but ensure state is set first
          await new Promise(resolve => setTimeout(resolve, 0));
          throw error;
        }
      },

      loginAsGuest: () => {
        try {
          const guestUser = supabaseAuthService.createGuestUser();
          
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

      logout: async () => {
        const { user } = get();
        
        try {
          await supabaseAuthService.logout();
        } catch (error) {
          logger.error('Logout error', error);
        }
        
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
          const response = await supabaseAuthService.register({
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

        // Update via Supabase auth service (handles both local and cloud)
        supabaseAuthService.updateUserProfile(profile).then(() => {
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

          // Queue for sync if registered user
          if (user.role !== 'guest') {
            syncService.queueForSync('profile', 'update', profile, user.id);
          }

          logger.info('User profile updated', { userId: user.id, updates: profile });
        }).catch(error => {
          logger.error('Profile update failed', error);
          set((state) => ({
            ...state,
            error: 'Failed to update profile',
          }));
        });
      },

      updateSettings: (settings) => {
        const { user } = get();
        if (!user) return;

        // Update via Supabase auth service (local storage)
        supabaseAuthService.updateUserSettings(settings);

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

      initializeAuth: async () => {
        try {
          // Initialize Supabase auth state
          await supabaseAuthService.initializeAuth();
          const storedUser = supabaseAuthService.getCurrentUser();
          const isAuthenticated = await supabaseAuthService.isAuthenticated();

          if (storedUser && isAuthenticated) {
            set((state) => ({
              ...state,
              user: storedUser,
              isAuthenticated: true,
            }));

            // Start sync for registered users
            if (storedUser.role !== 'guest') {
              syncService.syncNow();
            }

            logger.info('Auth initialized from storage', { userId: storedUser.id });
          } else {
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
      // Persist essential auth state
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);