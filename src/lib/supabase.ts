/**
 * Supabase Client Configuration
 * 
 * Configured client for connecting to the Supabase database with proper types and security.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration
const supabaseUrl = 'https://kaifdxfseeusxsgmqftr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaWZkeGZzZWV1c3hzZ21xZnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDAxNDUsImV4cCI6MjA2OTM3NjE0NX0.X0S9uLjv3dbYyp2szQoNFc92dRyMLrlstqsr21vBK7g';

// Create Supabase client with proper configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'sport-tracker-pwa'
    }
  }
});

// Helper functions for common operations
export const supabaseHelpers = {
  /**
   * Get current user profile
   */
  async getCurrentUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  },

  /**
   * Get user's friends
   */
  async getUserFriends(userId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    // Transform the data to get the friend (not the current user)
    return data.map(friendship => {
      const friend = friendship.requester_id === userId 
        ? friendship.addressee 
        : friendship.requester;
      return {
        ...friendship,
        friend
      };
    });
  },

  /**
   * Create or update user profile
   */
  async upsertUserProfile(profile: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }

    return data;
  },

  /**
   * Subscribe to real-time changes
   */
  subscribeToTable(table: string, callback: (payload: any) => void, filter?: string) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter 
        }, 
        callback
      )
      .subscribe();

    return channel;
  },

  /**
   * Unsubscribe from real-time changes
   */
  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  }
};

// Auth helpers
export const authHelpers = {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, userData?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    return data;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
};

// Storage helpers
export const storageHelpers = {
  /**
   * Upload file to storage
   */
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};

// Export types for use in components
export type { Database } from '@/types/database';