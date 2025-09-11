import type { User, UserLogin, UserRegistration } from '@/schemas/user';
import { validateUserLogin } from '@/utils/userValidation';
import { storage, logger } from '@/utils';
import { supabase, authHelpers, supabaseHelpers } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

interface SupabaseAuthResponse {
  user: User;
  supabaseUser: SupabaseUser;
  tokens: AuthTokens;
}

class SupabaseAuthService {
  private readonly ACCESS_TOKEN_KEY = 'sport-tracker-access-token';
  private readonly REFRESH_TOKEN_KEY = 'sport-tracker-refresh-token';
  private readonly TOKEN_EXPIRES_KEY = 'sport-tracker-token-expires';
  private readonly USER_KEY = 'sport-tracker-user';
  private readonly SUPABASE_USER_KEY = 'sport-tracker-supabase-user';

  constructor() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed', { event, hasSession: !!session });
      
      if (event === 'SIGNED_IN' && session) {
        await this.handleAuthStateChange(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.clearLocalAuthData();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        this.updateStoredTokens(session);
      }
    });
  }

  /**
   * Login user with email and password using Supabase Auth
   */
  async login(credentials: UserLogin): Promise<AuthResponse> {
    // Validate credentials
    const validation = validateUserLogin(credentials);
    if (!validation.success) {
      throw new Error(validation.errors?.[0] || 'Invalid credentials');
    }

    try {
      // Sign in with Supabase
      const { data, error } = await authHelpers.signIn(credentials.email, credentials.password);
      
      if (error) {
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed - no user data received');
      }

      // Get or create user profile
      const userProfile = await this.getOrCreateUserProfile(data.user);
      
      // Convert to our User format
      const user = await this.convertSupabaseUserToAppUser(data.user, userProfile);
      
      // Store auth data
      const tokens = this.extractTokensFromSession(data.session);
      const response = { user, tokens };
      this.storeAuthData(response, data.user);
      
      logger.info('User logged in successfully', { userId: user.id });
      return response;
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  }

  /**
   * Register new user with Supabase Auth
   */
  async register(userData: UserRegistration): Promise<AuthResponse> {
    try {
      // Sign up with Supabase
      const { data, error } = await authHelpers.signUp(
        userData.email, 
        userData.password,
        {
          username: userData.username,
          display_name: userData.display_name,
          fitness_level: userData.fitness_level || 'beginner'
        }
      );
      
      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Registration failed - no user data received');
      }

      // Create user profile in our database
      const userProfile = await this.createUserProfile(data.user, userData);
      
      // Convert to our User format
      const user = await this.convertSupabaseUserToAppUser(data.user, userProfile);
      
      // Store auth data (session might be null if email confirmation is required)
      const tokens = data.session ? this.extractTokensFromSession(data.session) : this.generateMockTokens();
      const response = { user, tokens };
      this.storeAuthData(response, data.user);
      
      logger.info('User registered successfully', { userId: user.id });
      return response;
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }

  /**
   * Create guest user (offline-first, no Supabase integration)
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

    // Store guest user data locally only
    storage.set(this.USER_KEY, guestUser);
    
    logger.info('Guest user created', { userId: guestUser.id });
    return guestUser;
  }

  /**
   * Logout user from both Supabase and local storage
   */
  async logout(): Promise<void> {
    try {
      // Sign out from Supabase
      await authHelpers.signOut();
    } catch (error) {
      logger.error('Supabase logout failed', error);
    }
    
    // Clear local storage regardless of Supabase logout result
    this.clearLocalAuthData();
    
    logger.info('User logged out');
  }

  /**
   * Get current access token (Supabase session token)
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      logger.error('Failed to get access token', error);
      return null;
    }
  }

  /**
   * Get current user from storage or Supabase
   */
  getCurrentUser(): User | null {
    return storage.get<User>(this.USER_KEY);
  }

  /**
   * Get current Supabase user
   */
  async getCurrentSupabaseUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      logger.error('Failed to get Supabase user', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = this.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    // Guest users are always authenticated (offline-first)
    if (user.role === 'guest') {
      return true;
    }
    
    // For registered users, check Supabase session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      logger.error('Failed to check authentication', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        throw new Error('Token refresh failed');
      }
      
      // Update stored tokens
      this.updateStoredTokens(data.session);
      
      logger.info('Token refreshed successfully');
      return data.session.access_token;
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Update user profile (both local and Supabase for registered users)
   */
  async updateUserProfile(updates: Partial<User['profile']>): Promise<void> {
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
    
    // Update local storage
    storage.set(this.USER_KEY, updatedUser);
    
    // Update Supabase for registered users
    if (currentUser.role !== 'guest') {
      try {
        await supabaseHelpers.upsertUserProfile({
          id: currentUser.id,
          display_name: updatedUser.profile.display_name,
          bio: updates.bio || null,
          fitness_level: updatedUser.profile.fitness_level,
          height_cm: updatedUser.profile.height || null,
          weight_kg: updatedUser.profile.weight || null,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to update profile in Supabase', error);
        // Don't throw - keep local update even if cloud sync fails
      }
    }
    
    logger.info('User profile updated', { userId: currentUser.id, updates });
  }

  /**
   * Update user settings (local only for now)
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
   * Initialize auth state from stored data and Supabase session
   */
  async initializeAuth(): Promise<void> {
    try {
      // Check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // We have a valid Supabase session, sync with local data
        await this.handleAuthStateChange(session.user);
      } else {
        // No Supabase session, check for local user (guest or offline)
        const localUser = this.getCurrentUser();
        if (localUser && localUser.role === 'guest') {
          // Guest user is valid
          logger.info('Auth initialized with guest user', { userId: localUser.id });
        } else if (localUser) {
          // Registered user but no session - clear invalid data
          this.clearLocalAuthData();
          logger.info('Cleared invalid auth data');
        }
      }
    } catch (error) {
      logger.error('Auth initialization failed', error);
      // Clear any potentially corrupted data
      this.clearLocalAuthData();
    }
  }

  /**
   * Sync data to cloud for premium users
   */
  async syncToCloud(): Promise<boolean> {
    const user = this.getCurrentUser();
    
    if (!user || user.role === 'guest' || user.role === 'basic') {
      // Only premium users get cloud sync
      return false;
    }
    
    try {
      // TODO: Implement cloud sync for workouts, achievements, etc.
      // This will be implemented in future tasks
      logger.info('Cloud sync initiated', { userId: user.id });
      return true;
    } catch (error) {
      logger.error('Cloud sync failed', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private async handleAuthStateChange(supabaseUser: SupabaseUser): Promise<void> {
    try {
      // Get user profile from database
      const userProfile = await this.getOrCreateUserProfile(supabaseUser);
      
      // Convert to our User format
      const user = await this.convertSupabaseUserToAppUser(supabaseUser, userProfile);
      
      // Update local storage
      storage.set(this.USER_KEY, user);
      storage.set(this.SUPABASE_USER_KEY, supabaseUser);
      
      logger.info('Auth state synchronized', { userId: user.id });
    } catch (error) {
      logger.error('Failed to handle auth state change', error);
    }
  }

  private async getOrCreateUserProfile(supabaseUser: SupabaseUser): Promise<any> {
    try {
      // Try to get existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      if (data) {
        return data;
      }
      
      // Create new profile if it doesn't exist
      const newProfile = {
        id: supabaseUser.id,
        username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
        display_name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.username || 'User',
        email: supabaseUser.email || '',
        fitness_level: supabaseUser.user_metadata?.fitness_level || 'beginner',
        current_level: 1,
        total_xp: 0,
        current_xp: 0,
        profile_visibility: 'public',
        workout_visibility: 'friends',
        stats_visibility: 'friends',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        is_online: true,
      };
      
      const { data: createdProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();
      
      if (createError) {
        logger.error('Failed to create user profile', createError);
        return newProfile; // Return the profile data even if DB insert failed
      }
      
      return createdProfile;
    } catch (error) {
      logger.error('Error getting/creating user profile', error);
      // Return minimal profile data
      return {
        id: supabaseUser.id,
        username: supabaseUser.email?.split('@')[0] || 'user',
        display_name: 'User',
        email: supabaseUser.email || '',
        fitness_level: 'beginner',
        current_level: 1,
        total_xp: 0,
      };
    }
  }

  private async createUserProfile(supabaseUser: SupabaseUser, userData: UserRegistration): Promise<any> {
    const profile = {
      id: supabaseUser.id,
      username: userData.username,
      display_name: userData.display_name,
      email: userData.email,
      fitness_level: userData.fitness_level || 'beginner',
      current_level: 1,
      total_xp: 0,
      current_xp: 0,
      profile_visibility: 'public',
      workout_visibility: 'friends',
      stats_visibility: 'friends',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      is_online: true,
    };
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single();
      
      if (error) {
        logger.error('Failed to create user profile', error);
        return profile; // Return profile data even if DB insert failed
      }
      
      return data;
    } catch (error) {
      logger.error('Error creating user profile', error);
      return profile;
    }
  }

  private async convertSupabaseUserToAppUser(supabaseUser: SupabaseUser, profile: any): Promise<User> {
    // Determine user role based on subscription or metadata
    let role: User['role'] = 'basic';
    if (supabaseUser.user_metadata?.role) {
      role = supabaseUser.user_metadata.role;
    } else if (supabaseUser.app_metadata?.subscription_tier) {
      role = supabaseUser.app_metadata.subscription_tier === 'premium' ? 'premium' : 'basic';
    }
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      username: profile.username || supabaseUser.email?.split('@')[0] || 'user',
      role,
      is_active: true,
      profile: {
        display_name: profile.display_name || 'User',
        fitness_level: profile.fitness_level || 'beginner',
        goals: [], // TODO: Get from user_settings or separate table
        scheduled_days: ['monday', 'wednesday', 'friday'], // TODO: Get from user_streaks
        age: profile.age,
        weight: profile.weight_kg,
        height: profile.height_cm,
        gender: profile.gender,
        bio: profile.bio,
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
          profile_visibility: profile.profile_visibility || 'public',
          workout_sharing: profile.workout_visibility || 'friends',
          allow_friend_requests: true,
        },
        units: 'metric',
      },
      gamification: {
        level: profile.current_level || 1,
        total_xp: profile.total_xp || 0,
        current_streak: 0, // TODO: Get from user_streaks
        best_streak: 0, // TODO: Get from user_streaks
        sick_days_used: 0, // TODO: Get from user_streaks
        last_sick_day_reset: new Date(),
        achievements_unlocked: [], // TODO: Get from user_achievements
      },
      created_at: new Date(profile.created_at || supabaseUser.created_at),
    };
  }

  private extractTokensFromSession(session: any): AuthTokens {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000, // 1 hour default
    };
  }

  private updateStoredTokens(session: any): void {
    const tokens = this.extractTokensFromSession(session);
    storage.set(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    storage.set(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    storage.set(this.TOKEN_EXPIRES_KEY, tokens.expiresAt);
  }

  private storeAuthData(authResponse: AuthResponse, supabaseUser?: SupabaseUser): void {
    const { user, tokens } = authResponse;
    
    storage.set(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    storage.set(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    storage.set(this.TOKEN_EXPIRES_KEY, tokens.expiresAt);
    storage.set(this.USER_KEY, user);
    
    if (supabaseUser) {
      storage.set(this.SUPABASE_USER_KEY, supabaseUser);
    }
  }

  private clearLocalAuthData(): void {
    storage.remove(this.ACCESS_TOKEN_KEY);
    storage.remove(this.REFRESH_TOKEN_KEY);
    storage.remove(this.TOKEN_EXPIRES_KEY);
    storage.remove(this.USER_KEY);
    storage.remove(this.SUPABASE_USER_KEY);
  }

  private generateMockTokens(): AuthTokens {
    const now = Date.now();
    const expiresIn = 60 * 60 * 1000; // 1 hour
    
    return {
      accessToken: `mock-access-token-${now}`,
      refreshToken: `mock-refresh-token-${now}`,
      expiresAt: now + expiresIn,
    };
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService();