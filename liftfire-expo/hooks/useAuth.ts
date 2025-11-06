import { useState, useEffect, useCallback } from 'react';
import { supabase, setupAuthListener } from '../lib/supabase';
import { clearAllTokens } from '../lib/secureStorage';
import type { User } from '../types';
import type { Session, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

interface SignInData {
  email: string;
  password: string;
}

/**
 * Authentication hook for managing user authentication state
 * 
 * Features:
 * - Sign up with email/password
 * - Sign in with email/password
 * - Sign out with token cleanup
 * - Automatic session persistence via SecureStore
 * - Automatic token refresh
 * - Auth state change handling
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Handle auth state changes
  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[useAuth] Failed to get session', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: error.message,
        });
        return;
      }

      if (session?.user) {
        // Fetch full user profile from database
        fetchUserProfile(session.user.id).then((profile) => {
          setAuthState({
            user: profile,
            session,
            loading: false,
            error: null,
          });
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
      }
    });

    // Set up auth state change listener
    const unsubscribe = setupAuthListener((event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => {
          setAuthState({
            user: profile,
            session,
            loading: false,
            error: null,
          });
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Fetch user profile from database
   */
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useAuth] Failed to fetch user profile', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('[useAuth] Error fetching user profile', error);
      return null;
    }
  };

  /**
   * Sign up a new user
   */
  const signUp = useCallback(async (data: SignUpData) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create user profile in database
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: data.email,
        username: data.username,
        display_name: data.displayName || data.username,
        xp: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
      });

      if (profileError) {
        console.error('[useAuth] Failed to create user profile', profileError);
        throw new Error('Failed to create user profile');
      }

      // Fetch the created profile
      const profile = await fetchUserProfile(authData.user.id);

      setAuthState({
        user: profile,
        session: authData.session,
        loading: false,
        error: null,
      });

      return { success: true, user: profile };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Sign in an existing user
   */
  const signIn = useCallback(async (data: SignInData) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (authError) {
        throw authError;
      }

      if (!authData.user || !authData.session) {
        throw new Error('Failed to sign in');
      }

      // Fetch user profile
      const profile = await fetchUserProfile(authData.user.id);

      setAuthState({
        user: profile,
        session: authData.session,
        loading: false,
        error: null,
      });

      return { success: true, user: profile };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear all tokens from secure storage
      await clearAllTokens();

      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      console.error('[useAuth] Sign out error', errorMessage);
      
      // Even if sign out fails, clear local state
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signUp,
    signIn,
    signOut,
    clearError,
    isAuthenticated: !!authState.user,
  };
};
