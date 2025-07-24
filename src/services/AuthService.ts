import type { User, UserLogin, UserRegistration } from '@/types';
import { validateUserLogin, validateUserRegistration } from '@/utils/userValidation';
import { storage, logger } from '@/utils';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'sport-tracker-access-token';
  private readonly REFRESH_TOKEN_KEY = 'sport-tracker-refresh-token';
  private readonly TOKEN_EXPIRES_KEY = 'sport-tracker-token-expires';
  private readonly USER_KEY = 'sport-tracker-user';

  /**
   * Login user with email and password
   */
  async login(credentials: UserLogin): Promise<AuthResponse> {
    // Validate credentials
    const validation = validateUserLogin(credentials);
    if (!validation.success) {
      throw new Error(validation.errors?.[0] || 'Invalid credentials');
    }

    try {
      // In a real app, this would be an API call
      // For now, we'll simulate the authentication
      await this.simulateApiDelay();

      // Mock authentication logic
      if (credentials.email === 'demo@example.com' && credentials.password === 'Demo123!') {
        const mockUser: User = {
          id: 'demo-user-1',
          email: credentials.email,
          username: 'demo_user',
          role: 'premium',
          is_active: true,
          profile: {
            display_name: 'Demo User',
            fitness_level: 'intermediate',
            goals: ['Build muscle', 'Improve strength'],
            scheduled_days: ['monday', 'wednesday', 'friday'],
          },
          settings: {
            theme: 'system',
            notifications: {
              workout_reminders: true,
              social_activity: true,
              achievements: true,
              challenges: true,
              quiet_hours: {
                enabled: false,
                start: '22:00',
                end: '08:00',
              },
            },
            privacy: {
              profile_visibility: 'public',
              workout_sharing: 'friends',
              allow_friend_requests: true,
            },
            units: 'metric',
          },
          gamification: {
            level: 5,
            total_xp: 2500,
            current_streak: 7,
            best_streak: 15,
            sick_days_used: 2,
            last_sick_day_reset: new Date(),
            achievements_unlocked: ['first_workout', 'week_streak', 'strength_milestone'],
          },
          created_at: new Date('2023-01-01'),
        };

        const tokens = this.generateMockTokens();
        const response = { user: mockUser, tokens };

        // Store tokens and user data
        this.storeAuthData(response);
        
        logger.info('User logged in successfully', { userId: mockUser.id });
        return response;
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: UserRegistration): Promise<AuthResponse> {
    // Validate user data
    const validation = validateUserRegistration(userData);
    if (!validation.success) {
      throw new Error(validation.errors?.[0] || 'Invalid user data');
    }

    try {
      // In a real app, this would be an API call
      await this.simulateApiDelay();

      // Mock user creation
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: userData.email,
        username: userData.username,
        role: 'basic',
        is_active: true,
        profile: {
          display_name: userData.display_name,
          fitness_level: userData.fitness_level || 'beginner',
          goals: [],
          scheduled_days: ['monday', 'wednesday', 'friday'],
        },
        settings: {
          theme: 'system',
          notifications: {
            workout_reminders: true,
            social_activity: true,
            achievements: true,
            challenges: true,
            quiet_hours: {
              enabled: false,
              start: '22:00',
              end: '08:00',
            },
          },
          privacy: {
            profile_visibility: 'public',
            workout_sharing: 'friends',
            allow_friend_requests: true,
          },
          units: 'metric',
        },
        gamification: {
          level: 1,
          total_xp: 0,
          current_streak: 0,
          best_streak: 0,
          sick_days_used: 0,
          last_sick_day_reset: new Date(),
          achievements_unlocked: [],
        },
        created_at: new Date(),
      };

      const tokens = this.generateMockTokens();
      const response = { user: newUser, tokens };

      // Store tokens and user data
      this.storeAuthData(response);
      
      logger.info('User registered successfully', { userId: newUser.id });
      return response;
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }

  /**
   * Create guest user (offline-first)
   */
  createGuestUser(): User {
    const guestUser: User = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      email: '',
      username: 'guest',
      role: 'guest',
      is_active: true,
      profile: {
        display_name: 'Guest User',
        fitness_level: 'beginner',
        goals: [],
        scheduled_days: ['monday', 'wednesday', 'friday'],
      },
      settings: {
        theme: 'system',
        notifications: {
          workout_reminders: false,
          social_activity: false,
          achievements: true,
          challenges: false,
          quiet_hours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        },
        privacy: {
          profile_visibility: 'private',
          workout_sharing: 'private',
          allow_friend_requests: false,
        },
        units: 'metric',
      },
      gamification: {
        level: 1,
        total_xp: 0,
        current_streak: 0,
        best_streak: 0,
        sick_days_used: 0,
        last_sick_day_reset: new Date(),
        achievements_unlocked: [],
      },
      created_at: new Date(),
    };

    // Store guest user data locally
    storage.set(this.USER_KEY, guestUser);
    
    logger.info('Guest user created', { userId: guestUser.id });
    return guestUser;
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear all stored auth data
    storage.remove(this.ACCESS_TOKEN_KEY);
    storage.remove(this.REFRESH_TOKEN_KEY);
    storage.remove(this.TOKEN_EXPIRES_KEY);
    storage.remove(this.USER_KEY);
    
    logger.info('User logged out');
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    const token = storage.get<string>(this.ACCESS_TOKEN_KEY);
    const expiresAt = storage.get<number>(this.TOKEN_EXPIRES_KEY);
    
    if (!token || !expiresAt) {
      return null;
    }
    
    // Check if token is expired
    if (Date.now() >= expiresAt) {
      logger.warn('Access token expired');
      return null;
    }
    
    return token;
  }

  /**
   * Get current user from storage
   */
  getCurrentUser(): User | null {
    return storage.get<User>(this.USER_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    // Guest users are always authenticated (offline-first)
    if (user.role === 'guest') {
      return true;
    }
    
    // For registered users, check if they have a valid token
    const token = this.getAccessToken();
    return !!token;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = storage.get<string>(this.REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      // In a real app, this would be an API call
      await this.simulateApiDelay();
      
      // Mock token refresh
      const newTokens = this.generateMockTokens();
      
      // Store new tokens
      storage.set(this.ACCESS_TOKEN_KEY, newTokens.accessToken);
      storage.set(this.REFRESH_TOKEN_KEY, newTokens.refreshToken);
      storage.set(this.TOKEN_EXPIRES_KEY, newTokens.expiresAt);
      
      logger.info('Token refreshed successfully');
      return newTokens.accessToken;
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  updateUserProfile(updates: Partial<User['profile']>): void {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No user found');
    }
    
    const updatedUser: User = {
      ...currentUser,
      profile: {
        ...currentUser.profile,
        ...updates,
      },
    };
    
    storage.set(this.USER_KEY, updatedUser);
    logger.info('User profile updated', { userId: currentUser.id, updates });
  }

  /**
   * Update user settings
   */
  updateUserSettings(updates: Partial<User['settings']>): void {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No user found');
    }
    
    const updatedUser: User = {
      ...currentUser,
      settings: {
        ...currentUser.settings,
        ...updates,
      },
    };
    
    storage.set(this.USER_KEY, updatedUser);
    logger.info('User settings updated', { userId: currentUser.id, updates });
  }

  /**
   * Private helper methods
   */
  private generateMockTokens(): AuthTokens {
    const now = Date.now();
    const expiresIn = 60 * 60 * 1000; // 1 hour
    
    return {
      accessToken: `mock-access-token-${now}`,
      refreshToken: `mock-refresh-token-${now}`,
      expiresAt: now + expiresIn,
    };
  }

  private storeAuthData(authResponse: AuthResponse): void {
    const { user, tokens } = authResponse;
    
    storage.set(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    storage.set(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    storage.set(this.TOKEN_EXPIRES_KEY, tokens.expiresAt);
    storage.set(this.USER_KEY, user);
  }

  private async simulateApiDelay(): Promise<void> {
    // Simulate network delay
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Export singleton instance
export const authService = new AuthService();