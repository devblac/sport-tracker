import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserProfile, UserSettings } from '@/schemas/user';
import { supabaseAuthService } from '@/services/supabaseAuthService';
import { syncService } from '@/services/SyncService';
import { authErrorHandler } from '@/utils/authErrorHandler';
import { authSessionManager } from '@/services/AuthSessionManager';
import type { AuthRecoveryOptions, AuthErrorContext } from '@/types/authErrors';
import { logger } from '@/utils';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  recoveryOptions: AuthRecoveryOptions | null;
  sessionState: 'valid' | 'invalid' | 'recovering' | 'guest' | 'offline';
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
  retryLastOperation: () => Promise<void>;
  forceGuestMode: () => void;
  recoverSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      recoveryOptions: null,
      sessionState: 'invalid',

      // Actions
      login: async (email, password) => {
        set((state) => ({
          ...state,
          isLoading: true,
          error: null,
          recoveryOptions: null,
        }));

        try {
          const response = await supabaseAuthService.login({ email, password });
          
          set((state) => ({
            ...state,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            sessionState: 'valid',
          }));

          // Clear any previous error tracking
          authErrorHandler.resetRetryTracking('login', email);

          // Trigger sync for registered users
          if (response.user.role !== 'guest') {
            syncService.getInstance().triggerSync().catch(error => {
              logger.warn('Post-login sync failed', error);
            });
          }

          logger.info('User logged in successfully', { userId: response.user.id });
        } catch (error) {
          const context: AuthErrorContext = {
            operation: 'login',
            email,
            timestamp: new Date(),
            userAgent: navigator.userAgent
          };

          const recoveryOptions = authErrorHandler.handleAuthError(
            error instanceof Error ? error : new Error('Login failed'),
            context,
            () => get().loginAsGuest(),
            () => get().login(email, password)
          );

          set((state) => ({
            ...state,
            error: recoveryOptions.recoveryActions.length > 0 
              ? (error as any)?.userMessage || 'Login failed'
              : error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            recoveryOptions,
            sessionState: 'invalid',
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
            error: null,
            recoveryOptions: null,
            sessionState: 'guest',
          }));

          logger.info('User logged in as guest', { userId: guestUser.id });
        } catch (error) {
          logger.error('Guest login failed', error);
          set((state) => ({
            ...state,
            error: 'Failed to create guest session',
            sessionState: 'invalid',
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
        
        // Clear session manager
        authSessionManager.clearSession();
        
        set((state) => ({
          ...state,
          user: null,
          isAuthenticated: false,
          error: null,
          recoveryOptions: null,
          sessionState: 'invalid',
        }));

        logger.info('User logged out', { userId: user?.id });
      },

      register: async (email, username, password) => {
        set((state) => ({
          ...state,
          isLoading: true,
          error: null,
          recoveryOptions: null,
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
            sessionState: 'valid',
          }));

          // Clear any previous error tracking
          authErrorHandler.resetRetryTracking('register', email);

          logger.info('User registered successfully', { userId: response.user.id });
        } catch (error) {
          const context: AuthErrorContext = {
            operation: 'register',
            email,
            timestamp: new Date(),
            userAgent: navigator.userAgent
          };

          const recoveryOptions = authErrorHandler.handleAuthError(
            error instanceof Error ? error : new Error('Registration failed'),
            context,
            () => get().loginAsGuest()
          );

          set((state) => ({
            ...state,
            error: recoveryOptions.recoveryActions.length > 0 
              ? (error as any)?.userMessage || 'Registration failed'
              : error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
            recoveryOptions,
            sessionState: 'invalid',
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
            syncService.getInstance().queueOperation('UPDATE', 'profile', profile, {
              triggerImmediateSync: false
            }).catch(error => {
              logger.warn('Profile sync queue failed', error);
            });
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
          recoveryOptions: null,
        }));
      },

      initializeAuth: async () => {
        try {
          // Initialize session manager
          authSessionManager.addListener((sessionState) => {
            set((state) => ({
              ...state,
              sessionState: sessionState.isValid 
                ? (sessionState.degradationLevel === 'guest' ? 'guest' : 'valid')
                : (sessionState.isRecovering ? 'recovering' : 'invalid')
            }));
          });

          // Initialize Supabase auth state
          await supabaseAuthService.initializeAuth();
          const storedUser = supabaseAuthService.getCurrentUser();
          const isAuthenticated = await supabaseAuthService.isAuthenticated();

          if (storedUser && isAuthenticated) {
            set((state) => ({
              ...state,
              user: storedUser,
              isAuthenticated: true,
              sessionState: storedUser.role === 'guest' ? 'guest' : 'valid',
            }));

            // Start sync for registered users
            if (storedUser.role !== 'guest') {
              syncService.getInstance().triggerSync().catch(error => {
                logger.warn('Post-initialization sync failed', error);
              });
            }

            logger.info('Auth initialized from storage', { userId: storedUser.id });
          } else {
            // Try session recovery
            const recovered = await authSessionManager.validateCurrentSession();
            
            if (!recovered) {
              set((state) => ({
                ...state,
                user: null,
                isAuthenticated: false,
                sessionState: 'invalid',
              }));

              logger.info('Auth initialized - no valid session found');
            }
          }
        } catch (error) {
          const context: AuthErrorContext = {
            operation: 'initialize',
            timestamp: new Date(),
            userAgent: navigator.userAgent
          };

          const recoveryOptions = authErrorHandler.handleAuthError(
            error instanceof Error ? error : new Error('Auth initialization failed'),
            context,
            () => get().loginAsGuest()
          );

          set((state) => ({
            ...state,
            user: null,
            isAuthenticated: false,
            error: 'Failed to initialize authentication',
            recoveryOptions,
            sessionState: 'invalid',
          }));

          logger.error('Auth initialization failed', error);
        }
      },

      retryLastOperation: async () => {
        const { recoveryOptions } = get();
        
        if (recoveryOptions?.canRetry) {
          const retryAction = recoveryOptions.recoveryActions.find(action => action.type === 'retry');
          if (retryAction) {
            try {
              await retryAction.action();
            } catch (error) {
              logger.error('Retry operation failed', error);
            }
          }
        }
      },

      forceGuestMode: () => {
        get().loginAsGuest();
      },

      recoverSession: async () => {
        set((state) => ({
          ...state,
          sessionState: 'recovering',
        }));

        try {
          const recovered = await authSessionManager.forceRecovery();
          
          if (recovered) {
            const user = supabaseAuthService.getCurrentUser();
            set((state) => ({
              ...state,
              user,
              isAuthenticated: !!user,
              sessionState: user?.role === 'guest' ? 'guest' : 'valid',
              error: null,
              recoveryOptions: null,
            }));
          } else {
            set((state) => ({
              ...state,
              sessionState: 'invalid',
            }));
          }
        } catch (error) {
          logger.error('Session recovery failed', error);
          set((state) => ({
            ...state,
            sessionState: 'invalid',
            error: 'Session recovery failed',
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
        sessionState: state.sessionState,
      }),
    }
  )
);