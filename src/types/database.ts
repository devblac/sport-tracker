/**
 * Supabase Database Types
 * 
 * Auto-generated types for the Supabase database schema.
 * These types ensure type safety when working with the database.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          key: string
          name: string
          name_es: string
          description: string | null
          description_es: string | null
          category: string
          rarity: string
          xp_reward: number
          requirements: Json
          icon: string | null
          color: string | null
          badge_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          name_es: string
          description?: string | null
          description_es?: string | null
          category: string
          rarity?: string
          xp_reward?: number
          requirements: Json
          icon?: string | null
          color?: string | null
          badge_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          key?: string
          name?: string
          name_es?: string
          description?: string | null
          description_es?: string | null
          category?: string
          rarity?: string
          xp_reward?: number
          requirements?: Json
          icon?: string | null
          color?: string | null
          badge_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      challenge_participants: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          progress: Json
          is_completed: boolean
          completed_at: string | null
          score: number
          rank: number | null
          joined_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          progress?: Json
          is_completed?: boolean
          completed_at?: string | null
          score?: number
          rank?: number | null
          joined_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          progress?: Json
          is_completed?: boolean
          completed_at?: string | null
          score?: number
          rank?: number | null
          joined_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          created_by: string
          title: string
          description: string | null
          type: string
          requirements: Json
          rewards: Json
          start_date: string
          end_date: string
          max_participants: number | null
          participants_count: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          title: string
          description?: string | null
          type: string
          requirements: Json
          rewards?: Json
          start_date: string
          end_date: string
          max_participants?: number | null
          participants_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          title?: string
          description?: string | null
          type?: string
          requirements?: Json
          rewards?: Json
          start_date?: string
          end_date?: string
          max_participants?: number | null
          participants_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          mentions: Json
          likes_count: number
          replies_count: number
          is_edited: boolean
          is_pinned: boolean
          is_deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          mentions?: Json
          likes_count?: number
          replies_count?: number
          is_edited?: boolean
          is_pinned?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          mentions?: Json
          likes_count?: number
          replies_count?: number
          is_edited?: boolean
          is_pinned?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      equipment_types: {
        Row: {
          id: string
          name: string
          name_es: string
          description: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_es: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_es?: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      exercise_categories: {
        Row: {
          id: string
          name: string
          name_es: string
          description: string | null
          icon: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_es: string
          description?: string | null
          icon?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_es?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          created_at?: string
        }
      }
      exercise_performances: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          workout_session_id: string | null
          sets_data: Json
          max_weight: number | null
          total_volume: number | null
          total_reps: number | null
          one_rep_max: number | null
          is_pr_weight: boolean
          is_pr_volume: boolean
          is_pr_reps: boolean
          performed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          workout_session_id?: string | null
          sets_data: Json
          max_weight?: number | null
          total_volume?: number | null
          total_reps?: number | null
          one_rep_max?: number | null
          is_pr_weight?: boolean
          is_pr_volume?: boolean
          is_pr_reps?: boolean
          performed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          workout_session_id?: string | null
          sets_data?: Json
          max_weight?: number | null
          total_volume?: number | null
          total_reps?: number | null
          one_rep_max?: number | null
          is_pr_weight?: boolean
          is_pr_volume?: boolean
          is_pr_reps?: boolean
          performed_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          name_es: string
          description: string | null
          instructions: string | null
          instructions_es: string | null
          gif_url: string | null
          image_urls: string[] | null
          video_url: string | null
          category_id: string | null
          primary_muscle_groups: string[]
          secondary_muscle_groups: string[]
          equipment_id: string | null
          difficulty_level: number
          force_type: string | null
          mechanics: string | null
          is_verified: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_es: string
          description?: string | null
          instructions?: string | null
          instructions_es?: string | null
          gif_url?: string | null
          image_urls?: string[] | null
          video_url?: string | null
          category_id?: string | null
          primary_muscle_groups?: string[]
          secondary_muscle_groups?: string[]
          equipment_id?: string | null
          difficulty_level?: number
          force_type?: string | null
          mechanics?: string | null
          is_verified?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_es?: string
          description?: string | null
          instructions?: string | null
          instructions_es?: string | null
          gif_url?: string | null
          image_urls?: string[] | null
          video_url?: string | null
          category_id?: string | null
          primary_muscle_groups?: string[]
          secondary_muscle_groups?: string[]
          equipment_id?: string | null
          difficulty_level?: number
          force_type?: string | null
          mechanics?: string | null
          is_verified?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          addressee_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      muscle_groups: {
        Row: {
          id: string
          name: string
          name_es: string
          description: string | null
          body_part: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_es: string
          description?: string | null
          body_part?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_es?: string
          description?: string | null
          body_part?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          data: Json
          is_read: boolean
          is_sent: boolean
          sent_at: string | null
          read_at: string | null
          scheduled_for: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          data?: Json
          is_read?: boolean
          is_sent?: boolean
          sent_at?: string | null
          read_at?: string | null
          scheduled_for?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          data?: Json
          is_read?: boolean
          is_sent?: boolean
          sent_at?: string | null
          read_at?: string | null
          scheduled_for?: string | null
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      social_posts: {
        Row: {
          id: string
          user_id: string
          type: string
          content: string | null
          data: Json
          image_urls: string[] | null
          likes_count: number
          comments_count: number
          shares_count: number
          visibility: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          content?: string | null
          data?: Json
          image_urls?: string[] | null
          likes_count?: number
          comments_count?: number
          shares_count?: number
          visibility?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          content?: string | null
          data?: Json
          image_urls?: string[] | null
          likes_count?: number
          comments_count?: number
          shares_count?: number
          visibility?: string
          created_at?: string
          updated_at?: string
        }
      }
      streak_history: {
        Row: {
          id: string
          user_id: string
          event_type: string
          streak_count: number
          workout_session_id: string | null
          xp_earned: number
          achievements_unlocked: string[]
          event_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          streak_count: number
          workout_session_id?: string | null
          xp_earned?: number
          achievements_unlocked?: string[]
          event_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          streak_count?: number
          workout_session_id?: string | null
          xp_earned?: number
          achievements_unlocked?: string[]
          event_date?: string
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          progress: Json
          is_completed: boolean
          completed_at: string | null
          xp_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          progress?: Json
          is_completed?: boolean
          completed_at?: string | null
          xp_earned?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          progress?: Json
          is_completed?: boolean
          completed_at?: string | null
          xp_earned?: number
          created_at?: string
        }
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          date: string
          workouts_completed: number
          total_workout_time: number
          total_volume_kg: number
          total_reps: number
          posts_created: number
          comments_made: number
          likes_given: number
          likes_received: number
          xp_earned: number
          achievements_unlocked: number
          session_count: number
          total_session_time: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          workouts_completed?: number
          total_workout_time?: number
          total_volume_kg?: number
          total_reps?: number
          posts_created?: number
          comments_made?: number
          likes_given?: number
          likes_received?: number
          xp_earned?: number
          achievements_unlocked?: number
          session_count?: number
          total_session_time?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          workouts_completed?: number
          total_workout_time?: number
          total_volume_kg?: number
          total_reps?: number
          posts_created?: number
          comments_made?: number
          likes_given?: number
          likes_received?: number
          xp_earned?: number
          achievements_unlocked?: number
          session_count?: number
          total_session_time?: number
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          email: string
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          gender: string | null
          height_cm: number | null
          weight_kg: number | null
          fitness_level: string
          current_level: number
          total_xp: number
          current_xp: number
          profile_visibility: string
          workout_visibility: string
          stats_visibility: string
          created_at: string
          updated_at: string
          last_active_at: string
          is_online: boolean
        }
        Insert: {
          id: string
          username: string
          display_name: string
          email: string
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          gender?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          fitness_level?: string
          current_level?: number
          total_xp?: number
          current_xp?: number
          profile_visibility?: string
          workout_visibility?: string
          stats_visibility?: string
          created_at?: string
          updated_at?: string
          last_active_at?: string
          is_online?: boolean
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          email?: string
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          gender?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          fitness_level?: string
          current_level?: number
          total_xp?: number
          current_xp?: number
          profile_visibility?: string
          workout_visibility?: string
          stats_visibility?: string
          created_at?: string
          updated_at?: string
          last_active_at?: string
          is_online?: boolean
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          language: string
          timezone: string
          notifications_enabled: boolean
          workout_reminders: boolean
          achievement_notifications: boolean
          social_notifications: boolean
          friend_requests: boolean
          default_rest_time: number
          weight_unit: string
          distance_unit: string
          data_sharing: boolean
          analytics_tracking: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          language?: string
          timezone?: string
          notifications_enabled?: boolean
          workout_reminders?: boolean
          achievement_notifications?: boolean
          social_notifications?: boolean
          friend_requests?: boolean
          default_rest_time?: number
          weight_unit?: string
          distance_unit?: string
          data_sharing?: boolean
          analytics_tracking?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          language?: string
          timezone?: string
          notifications_enabled?: boolean
          workout_reminders?: boolean
          achievement_notifications?: boolean
          social_notifications?: boolean
          friend_requests?: boolean
          default_rest_time?: number
          weight_unit?: string
          distance_unit?: string
          data_sharing?: boolean
          analytics_tracking?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          target_days_per_week: number
          scheduled_days: number[]
          current_streak: number
          longest_streak: number
          sick_days_used: number
          vacation_days_used: number
          streak_shields: number
          streak_start_date: string | null
          last_workout_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_days_per_week?: number
          scheduled_days?: number[]
          current_streak?: number
          longest_streak?: number
          sick_days_used?: number
          vacation_days_used?: number
          streak_shields?: number
          streak_start_date?: string | null
          last_workout_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_days_per_week?: number
          scheduled_days?: number[]
          current_streak?: number
          longest_streak?: number
          sick_days_used?: number
          vacation_days_used?: number
          streak_shields?: number
          streak_start_date?: string | null
          last_workout_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          name: string | null
          notes: string | null
          started_at: string
          completed_at: string | null
          duration_seconds: number | null
          exercises: Json
          total_volume_kg: number
          total_reps: number
          total_sets: number
          calories_burned: number | null
          xp_earned: number
          achievements_unlocked: string[]
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id?: string | null
          name?: string | null
          notes?: string | null
          started_at: string
          completed_at?: string | null
          duration_seconds?: number | null
          exercises: Json
          total_volume_kg?: number
          total_reps?: number
          total_sets?: number
          calories_burned?: number | null
          xp_earned?: number
          achievements_unlocked?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string | null
          name?: string | null
          notes?: string | null
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          exercises?: Json
          total_volume_kg?: number
          total_reps?: number
          total_sets?: number
          calories_burned?: number | null
          xp_earned?: number
          achievements_unlocked?: string[]
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      workout_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          exercises: Json
          estimated_duration: number | null
          difficulty_level: number
          category: string | null
          tags: string[] | null
          created_by: string | null
          is_public: boolean
          is_featured: boolean
          usage_count: number
          average_rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          exercises: Json
          estimated_duration?: number | null
          difficulty_level?: number
          category?: string | null
          tags?: string[] | null
          created_by?: string | null
          is_public?: boolean
          is_featured?: boolean
          usage_count?: number
          average_rating?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          exercises?: Json
          estimated_duration?: number | null
          difficulty_level?: number
          category?: string | null
          tags?: string[] | null
          created_by?: string | null
          is_public?: boolean
          is_featured?: boolean
          usage_count?: number
          average_rating?: number
          created_at?: string
          updated_at?: string
        }
      }
      xp_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          source: string
          source_id: string | null
          description: string | null
          base_amount: number
          multiplier: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          source: string
          source_id?: string | null
          description?: string | null
          base_amount: number
          multiplier?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          source?: string
          source_id?: string | null
          description?: string | null
          base_amount?: number
          multiplier?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}