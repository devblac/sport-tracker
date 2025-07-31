-- ============================================================================
-- SPORT TRACKER PWA - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- This schema includes all tables for the fitness gamification PWA with
-- proper relationships, indexes, RLS policies, and security measures.
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    
    -- Fitness profile
    birth_date DATE,
    gender VARCHAR(20),
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    fitness_level VARCHAR(20) DEFAULT 'beginner',
    
    -- Gamification
    current_level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    current_xp INTEGER DEFAULT 0,
    
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'friends',
    workout_visibility VARCHAR(20) DEFAULT 'friends',
    stats_visibility VARCHAR(20) DEFAULT 'friends',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT valid_username CHECK (username ~ '^[a-zA-Z0-9_]{3,50}$'),
    CONSTRAINT valid_fitness_level CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    CONSTRAINT valid_visibility CHECK (profile_visibility IN ('public', 'friends', 'private')),
    CONSTRAINT valid_height CHECK (height_cm > 0 AND height_cm < 300),
    CONSTRAINT valid_weight CHECK (weight_kg > 0 AND weight_kg < 1000)
);

-- User settings
CREATE TABLE public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- App preferences
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    
    -- Notification preferences
    notifications_enabled BOOLEAN DEFAULT TRUE,
    workout_reminders BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    social_notifications BOOLEAN DEFAULT TRUE,
    friend_requests BOOLEAN DEFAULT TRUE,
    
    -- Workout preferences
    default_rest_time INTEGER DEFAULT 60,
    weight_unit VARCHAR(10) DEFAULT 'kg',
    distance_unit VARCHAR(10) DEFAULT 'km',
    
    -- Privacy preferences
    data_sharing BOOLEAN DEFAULT FALSE,
    analytics_tracking BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================================================
-- EXERCISES DATABASE
-- ============================================================================

-- Exercise categories
CREATE TABLE public.exercise_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Muscle groups
CREATE TABLE public.muscle_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    description TEXT,
    body_part VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment types
CREATE TABLE public.equipment_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises
CREATE TABLE public.exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_es VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    instructions_es TEXT,
    
    -- Media
    gif_url TEXT,
    image_urls TEXT[], -- Array of image URLs
    video_url TEXT,
    
    -- Classification
    category_id UUID REFERENCES public.exercise_categories(id),
    primary_muscle_groups UUID[] DEFAULT '{}', -- Array of muscle group IDs
    secondary_muscle_groups UUID[] DEFAULT '{}',
    equipment_id UUID REFERENCES public.equipment_types(id),
    
    -- Difficulty and metrics
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    force_type VARCHAR(20), -- push, pull, static
    mechanics VARCHAR(20), -- compound, isolation
    
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_difficulty CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    CONSTRAINT valid_force_type CHECK (force_type IN ('push', 'pull', 'static', 'other')),
    CONSTRAINT valid_mechanics CHECK (mechanics IN ('compound', 'isolation'))
);

-- ============================================================================
-- WORKOUTS SYSTEM
-- ============================================================================

-- Workout templates
CREATE TABLE public.workout_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Template data
    exercises JSONB NOT NULL, -- Array of exercise configurations
    estimated_duration INTEGER, -- in minutes
    difficulty_level INTEGER DEFAULT 1,
    
    -- Classification
    category VARCHAR(50),
    tags TEXT[],
    
    -- Ownership and sharing
    created_by UUID REFERENCES public.user_profiles(id),
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Stats
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_difficulty CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5)
);

-- Workout sessions
CREATE TABLE public.workout_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.workout_templates(id),
    
    -- Session info
    name VARCHAR(200),
    notes TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Workout data
    exercises JSONB NOT NULL, -- Array of exercises with sets
    
    -- Metrics
    total_volume_kg DECIMAL(10,2) DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    total_sets INTEGER DEFAULT 0,
    calories_burned INTEGER,
    
    -- XP and achievements
    xp_earned INTEGER DEFAULT 0,
    achievements_unlocked UUID[],
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'cancelled'))
);

-- Exercise performance tracking
CREATE TABLE public.exercise_performances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
    workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    
    -- Performance data
    sets_data JSONB NOT NULL, -- Array of set data (weight, reps, type, etc.)
    
    -- Calculated metrics
    max_weight DECIMAL(6,2),
    total_volume DECIMAL(10,2),
    total_reps INTEGER,
    one_rep_max DECIMAL(6,2),
    
    -- Personal records
    is_pr_weight BOOLEAN DEFAULT FALSE,
    is_pr_volume BOOLEAN DEFAULT FALSE,
    is_pr_reps BOOLEAN DEFAULT FALSE,
    
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_exercise_performances_user_exercise (user_id, exercise_id),
    INDEX idx_exercise_performances_date (performed_at)
);

-- ============================================================================
-- GAMIFICATION SYSTEM
-- ============================================================================

-- Achievement definitions
CREATE TABLE public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_es VARCHAR(200) NOT NULL,
    description TEXT,
    description_es TEXT,
    
    -- Achievement properties
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common',
    xp_reward INTEGER DEFAULT 0,
    
    -- Requirements
    requirements JSONB NOT NULL,
    
    -- Visual
    icon VARCHAR(100),
    color VARCHAR(7),
    badge_url TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- User achievements
CREATE TABLE public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) NOT NULL,
    
    -- Progress tracking
    progress JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Rewards
    xp_earned INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- XP transactions log
CREATE TABLE public.xp_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Transaction details
    amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL,
    source_id UUID, -- Reference to workout, achievement, etc.
    description TEXT,
    
    -- Multipliers
    base_amount INTEGER NOT NULL,
    multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_xp_transactions_user_date (user_id, created_at)
);

-- ============================================================================
-- SOCIAL FEATURES
-- ============================================================================

-- Friend relationships
CREATE TABLE public.friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_friendship_status CHECK (status IN ('pending', 'accepted', 'blocked')),
    CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
    UNIQUE(requester_id, addressee_id)
);

-- Social posts
CREATE TABLE public.social_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Post content
    type VARCHAR(50) NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}',
    
    -- Media
    image_urls TEXT[],
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    -- Visibility
    visibility VARCHAR(20) DEFAULT 'friends',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_post_type CHECK (type IN ('workout_completed', 'achievement_unlocked', 'personal_record', 'custom', 'workout_shared')),
    CONSTRAINT valid_post_visibility CHECK (visibility IN ('public', 'friends', 'private')),
    
    INDEX idx_social_posts_user_date (user_id, created_at),
    INDEX idx_social_posts_type (type)
);

-- Post likes
CREATE TABLE public.post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_id, user_id)
);

-- ============================================================================
-- ADVANCED COMMENTS SYSTEM
-- ============================================================================

-- Comments
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL,
    mentions JSONB DEFAULT '[]', -- Array of mentioned users
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    
    -- Status
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES public.user_profiles(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_content_length CHECK (char_length(content) <= 2000),
    CONSTRAINT no_self_parent CHECK (id != parent_comment_id),
    
    INDEX idx_comments_post_date (post_id, created_at),
    INDEX idx_comments_parent (parent_comment_id),
    INDEX idx_comments_user (user_id)
);

-- Comment likes
CREATE TABLE public.comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(comment_id, user_id)
);

-- ============================================================================
-- STREAKS SYSTEM
-- ============================================================================

-- User streaks
CREATE TABLE public.user_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Streak configuration
    target_days_per_week INTEGER DEFAULT 3,
    scheduled_days INTEGER[] DEFAULT '{1,3,5}', -- Days of week (0=Sunday)
    
    -- Current streak
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    
    -- Streak shields and protections
    sick_days_used INTEGER DEFAULT 0,
    vacation_days_used INTEGER DEFAULT 0,
    streak_shields INTEGER DEFAULT 0,
    
    -- Dates
    streak_start_date DATE,
    last_workout_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id),
    CONSTRAINT valid_target_days CHECK (target_days_per_week >= 1 AND target_days_per_week <= 7)
);

-- Streak history
CREATE TABLE public.streak_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL,
    streak_count INTEGER NOT NULL,
    workout_session_id UUID REFERENCES public.workout_sessions(id),
    
    -- Rewards
    xp_earned INTEGER DEFAULT 0,
    achievements_unlocked UUID[],
    
    event_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_streak_event CHECK (event_type IN ('workout_completed', 'streak_broken', 'streak_milestone', 'shield_used')),
    
    INDEX idx_streak_history_user_date (user_id, event_date)
);

-- ============================================================================
-- CHALLENGES SYSTEM
-- ============================================================================

-- Challenges
CREATE TABLE public.challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Challenge details
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Challenge configuration
    type VARCHAR(50) NOT NULL,
    requirements JSONB NOT NULL,
    rewards JSONB DEFAULT '{}',
    
    -- Timing
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Participation
    max_participants INTEGER,
    participants_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'upcoming',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_challenge_type CHECK (type IN ('individual', 'group', 'community')),
    CONSTRAINT valid_challenge_status CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Challenge participants
CREATE TABLE public.challenge_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Progress tracking
    progress JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ranking
    score DECIMAL(10,2) DEFAULT 0,
    rank INTEGER,
    
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(challenge_id, user_id)
);

-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

-- Notifications
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification content
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    
    -- Delivery
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_notification_type CHECK (type IN ('workout_reminder', 'achievement_unlocked', 'friend_request', 'comment', 'like', 'mention', 'challenge_invite', 'streak_reminder'))
);

-- ============================================================================
-- ANALYTICS AND METRICS
-- ============================================================================

-- User analytics
CREATE TABLE public.user_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Date tracking
    date DATE NOT NULL,
    
    -- Workout metrics
    workouts_completed INTEGER DEFAULT 0,
    total_workout_time INTEGER DEFAULT 0, -- in seconds
    total_volume_kg DECIMAL(10,2) DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    
    -- Social metrics
    posts_created INTEGER DEFAULT 0,
    comments_made INTEGER DEFAULT 0,
    likes_given INTEGER DEFAULT 0,
    likes_received INTEGER DEFAULT 0,
    
    -- Gamification metrics
    xp_earned INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    
    -- App usage
    session_count INTEGER DEFAULT 0,
    total_session_time INTEGER DEFAULT 0, -- in seconds
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date),
    INDEX idx_user_analytics_date (date)
);

-- ============================================================================
-- ADDITIONAL TABLES FOR COMPLETE FUNCTIONALITY
-- ============================================================================

-- User authentication trigger function (creates profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    NEW.email
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default user streak
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user online status
CREATE OR REPLACE FUNCTION public.update_user_online_status(user_id UUID, is_online BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles 
  SET 
    is_online = update_user_online_status.is_online,
    last_active_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user level from XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(total_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: level = floor(sqrt(total_xp / 100))
  -- This means: Level 1 = 100 XP, Level 2 = 400 XP, Level 3 = 900 XP, etc.
  RETURN GREATEST(1, FLOOR(SQRT(total_xp / 100.0))::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get XP required for next level
CREATE OR REPLACE FUNCTION public.xp_for_level(level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- XP required for level = level^2 * 100
  RETURN (level * level * 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user XP and level
CREATE OR REPLACE FUNCTION public.add_user_xp(user_id UUID, xp_amount INTEGER, source TEXT, source_id UUID DEFAULT NULL, description TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  current_total_xp INTEGER;
  new_total_xp INTEGER;
  current_level INTEGER;
  new_level INTEGER;
  current_xp INTEGER;
  new_current_xp INTEGER;
BEGIN
  -- Get current XP and level
  SELECT total_xp, current_level, current_xp INTO current_total_xp, current_level, current_xp
  FROM public.user_profiles WHERE id = user_id;
  
  -- Calculate new values
  new_total_xp := current_total_xp + xp_amount;
  new_level := public.calculate_level_from_xp(new_total_xp);
  new_current_xp := new_total_xp - public.xp_for_level(new_level - 1);
  
  -- Update user profile
  UPDATE public.user_profiles 
  SET 
    total_xp = new_total_xp,
    current_level = new_level,
    current_xp = new_current_xp,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Log XP transaction
  INSERT INTO public.xp_transactions (user_id, amount, source, source_id, description, base_amount, multiplier)
  VALUES (user_id, xp_amount, source, source_id, description, xp_amount, 1.0);
  
  -- Check for level-up achievements
  IF new_level > current_level THEN
    -- Award level-up achievements
    INSERT INTO public.user_achievements (user_id, achievement_id, is_completed, completed_at, xp_earned)
    SELECT user_id, a.id, true, NOW(), a.xp_reward
    FROM public.achievements a
    WHERE a.key IN ('level_10', 'level_25', 'level_50', 'level_100')
      AND (a.requirements->>'level')::INTEGER = new_level
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua 
        WHERE ua.user_id = add_user_xp.user_id AND ua.achievement_id = a.id
      );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(user_id UUID, trigger_type TEXT, trigger_data JSONB DEFAULT '{}')
RETURNS VOID AS $$
DECLARE
  achievement_record RECORD;
  user_stats RECORD;
  requirement_met BOOLEAN;
BEGIN
  -- Get user statistics
  SELECT 
    COUNT(ws.id) as workouts_completed,
    COALESCE(MAX(us.current_streak), 0) as current_streak,
    COALESCE(MAX(us.longest_streak), 0) as longest_streak,
    up.current_level,
    up.total_xp,
    COUNT(DISTINCT f1.id) + COUNT(DISTINCT f2.id) as friends_count,
    COUNT(sp.id) as posts_created,
    COALESCE(SUM(pl.id), 0) as likes_received
  INTO user_stats
  FROM public.user_profiles up
  LEFT JOIN public.workout_sessions ws ON ws.user_id = up.id AND ws.status = 'completed'
  LEFT JOIN public.user_streaks us ON us.user_id = up.id
  LEFT JOIN public.friendships f1 ON f1.requester_id = up.id AND f1.status = 'accepted'
  LEFT JOIN public.friendships f2 ON f2.addressee_id = up.id AND f2.status = 'accepted'
  LEFT JOIN public.social_posts sp ON sp.user_id = up.id
  LEFT JOIN public.post_likes pl ON pl.post_id = sp.id
  WHERE up.id = check_achievements.user_id
  GROUP BY up.id, up.current_level, up.total_xp;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT a.* FROM public.achievements a
    WHERE a.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua 
        WHERE ua.user_id = check_achievements.user_id 
          AND ua.achievement_id = a.id 
          AND ua.is_completed = true
      )
  LOOP
    requirement_met := false;
    
    -- Check different types of achievements
    CASE achievement_record.category
      WHEN 'milestone' THEN
        IF achievement_record.requirements ? 'workouts_completed' THEN
          requirement_met := user_stats.workouts_completed >= (achievement_record.requirements->>'workouts_completed')::INTEGER;
        END IF;
        
      WHEN 'consistency' THEN
        IF achievement_record.requirements ? 'streak_days' THEN
          requirement_met := user_stats.current_streak >= (achievement_record.requirements->>'streak_days')::INTEGER;
        END IF;
        
      WHEN 'level' THEN
        IF achievement_record.requirements ? 'level' THEN
          requirement_met := user_stats.current_level >= (achievement_record.requirements->>'level')::INTEGER;
        END IF;
        
      WHEN 'xp' THEN
        IF achievement_record.requirements ? 'total_xp' THEN
          requirement_met := user_stats.total_xp >= (achievement_record.requirements->>'total_xp')::INTEGER;
        END IF;
        
      WHEN 'social' THEN
        IF achievement_record.requirements ? 'friends_count' THEN
          requirement_met := user_stats.friends_count >= (achievement_record.requirements->>'friends_count')::INTEGER;
        ELSIF achievement_record.requirements ? 'posts_created' THEN
          requirement_met := user_stats.posts_created >= (achievement_record.requirements->>'posts_created')::INTEGER;
        ELSIF achievement_record.requirements ? 'likes_received' THEN
          requirement_met := user_stats.likes_received >= (achievement_record.requirements->>'likes_received')::INTEGER;
        END IF;
        
      ELSE
        -- Handle other achievement types as needed
        requirement_met := false;
    END CASE;
    
    -- Award achievement if requirement is met
    IF requirement_met THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, is_completed, completed_at, xp_earned)
      VALUES (check_achievements.user_id, achievement_record.id, true, NOW(), achievement_record.xp_reward);
      
      -- Add XP reward
      PERFORM public.add_user_xp(
        check_achievements.user_id, 
        achievement_record.xp_reward, 
        'achievement', 
        achievement_record.id, 
        'Achievement unlocked: ' || achievement_record.name
      );
      
      -- Create notification
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        check_achievements.user_id,
        'achievement_unlocked',
        '¡Logro Desbloqueado!',
        'Has desbloqueado: ' || achievement_record.name_es,
        jsonb_build_object(
          'achievement_id', achievement_record.id,
          'achievement_name', achievement_record.name_es,
          'xp_reward', achievement_record.xp_reward,
          'rarity', achievement_record.rarity
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak after workout
CREATE OR REPLACE FUNCTION public.update_user_streak(user_id UUID, workout_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  streak_record RECORD;
  days_since_last INTEGER;
  is_scheduled_day BOOLEAN;
  day_of_week INTEGER;
BEGIN
  -- Get current streak info
  SELECT * INTO streak_record FROM public.user_streaks WHERE user_streaks.user_id = update_user_streak.user_id;
  
  IF NOT FOUND THEN
    -- Create streak record if it doesn't exist
    INSERT INTO public.user_streaks (user_id, last_workout_date, streak_start_date, current_streak)
    VALUES (user_id, workout_date, workout_date, 1);
    RETURN;
  END IF;
  
  -- Calculate days since last workout
  days_since_last := COALESCE(workout_date - streak_record.last_workout_date, 0);
  
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  day_of_week := EXTRACT(DOW FROM workout_date);
  
  -- Check if today is a scheduled workout day
  is_scheduled_day := day_of_week = ANY(streak_record.scheduled_days);
  
  -- Update streak based on days since last workout
  IF days_since_last = 0 THEN
    -- Same day, no change needed
    RETURN;
  ELSIF days_since_last = 1 OR (is_scheduled_day AND days_since_last <= 3) THEN
    -- Continue streak
    UPDATE public.user_streaks 
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_workout_date = workout_date,
      updated_at = NOW()
    WHERE user_streaks.user_id = update_user_streak.user_id;
  ELSE
    -- Streak broken, start new streak
    UPDATE public.user_streaks 
    SET 
      current_streak = 1,
      last_workout_date = workout_date,
      streak_start_date = workout_date,
      updated_at = NOW()
    WHERE user_streaks.user_id = update_user_streak.user_id;
  END IF;
  
  -- Log streak event
  INSERT INTO public.streak_history (user_id, event_type, streak_count, event_date)
  VALUES (user_id, 'workout_completed', 
    (SELECT current_streak FROM public.user_streaks WHERE user_streaks.user_id = update_user_streak.user_id),
    workout_date);
  
  -- Check for streak achievements
  PERFORM public.check_achievements(user_id, 'streak_updated', jsonb_build_object('streak_count', 
    (SELECT current_streak FROM public.user_streaks WHERE user_streaks.user_id = update_user_streak.user_id)));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON public.workout_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON public.workout_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update engagement counts
CREATE OR REPLACE FUNCTION update_post_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_TABLE_NAME = 'comments' THEN
            UPDATE public.social_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.social_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'comments' THEN
            UPDATE public.social_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply engagement count triggers
CREATE TRIGGER update_post_likes_count AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION update_post_engagement_counts();
CREATE TRIGGER update_post_comments_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_post_engagement_counts();

-- Function to update comment engagement counts
CREATE OR REPLACE FUNCTION update_comment_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'comment_likes' THEN
            UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        ELSIF TG_TABLE_NAME = 'comments' AND NEW.parent_comment_id IS NOT NULL THEN
            UPDATE public.comments SET replies_count = replies_count + 1 WHERE id = NEW.parent_comment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'comment_likes' THEN
            UPDATE public.comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        ELSIF TG_TABLE_NAME = 'comments' AND OLD.parent_comment_id IS NOT NULL THEN
            UPDATE public.comments SET replies_count = replies_count - 1 WHERE id = OLD.parent_comment_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply comment engagement count triggers
CREATE TRIGGER update_comment_likes_count AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION update_comment_engagement_counts();
CREATE TRIGGER update_comment_replies_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_comment_engagement_counts();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view public profiles" ON public.user_profiles FOR SELECT USING (
    profile_visibility = 'public' OR 
    id = auth.uid() OR
    (profile_visibility = 'friends' AND EXISTS (
        SELECT 1 FROM public.friendships 
        WHERE (requester_id = auth.uid() AND addressee_id = id AND status = 'accepted') OR
              (requester_id = id AND addressee_id = auth.uid() AND status = 'accepted')
    ))
);

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (id = auth.uid());

-- User settings policies
CREATE POLICY "Users can manage own settings" ON public.user_settings FOR ALL USING (user_id = auth.uid());

-- Workout sessions policies
CREATE POLICY "Users can manage own workouts" ON public.workout_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view friends' workouts" ON public.workout_sessions FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        JOIN public.friendships f ON (
            (f.requester_id = auth.uid() AND f.addressee_id = up.id) OR
            (f.requester_id = up.id AND f.addressee_id = auth.uid())
        )
        WHERE up.id = user_id AND f.status = 'accepted' AND up.workout_visibility IN ('friends', 'public')
    )
);

-- Exercise performances policies
CREATE POLICY "Users can manage own performances" ON public.exercise_performances FOR ALL USING (user_id = auth.uid());

-- Gamification policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view own XP transactions" ON public.xp_transactions FOR ALL USING (user_id = auth.uid());

-- Friendship policies
CREATE POLICY "Users can manage own friendships" ON public.friendships FOR ALL USING (
    requester_id = auth.uid() OR addressee_id = auth.uid()
);

-- Social posts policies
CREATE POLICY "Users can manage own posts" ON public.social_posts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view visible posts" ON public.social_posts FOR SELECT USING (
    visibility = 'public' OR
    user_id = auth.uid() OR
    (visibility = 'friends' AND EXISTS (
        SELECT 1 FROM public.friendships 
        WHERE (requester_id = auth.uid() AND addressee_id = user_id AND status = 'accepted') OR
              (requester_id = user_id AND addressee_id = auth.uid() AND status = 'accepted')
    ))
);

-- Post likes policies
CREATE POLICY "Users can manage own likes" ON public.post_likes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view likes on visible posts" ON public.post_likes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.social_posts sp
        WHERE sp.id = post_id AND (
            sp.visibility = 'public' OR
            sp.user_id = auth.uid() OR
            (sp.visibility = 'friends' AND EXISTS (
                SELECT 1 FROM public.friendships 
                WHERE (requester_id = auth.uid() AND addressee_id = sp.user_id AND status = 'accepted') OR
                      (requester_id = sp.user_id AND addressee_id = auth.uid() AND status = 'accepted')
            ))
        )
    )
);

-- Comments policies
CREATE POLICY "Users can manage own comments" ON public.comments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view comments on visible posts" ON public.comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.social_posts sp
        WHERE sp.id = post_id AND (
            sp.visibility = 'public' OR
            sp.user_id = auth.uid() OR
            (sp.visibility = 'friends' AND EXISTS (
                SELECT 1 FROM public.friendships 
                WHERE (requester_id = auth.uid() AND addressee_id = sp.user_id AND status = 'accepted') OR
                      (requester_id = sp.user_id AND addressee_id = auth.uid() AND status = 'accepted')
            ))
        )
    )
);

-- Comment likes policies
CREATE POLICY "Users can manage own comment likes" ON public.comment_likes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view comment likes on visible posts" ON public.comment_likes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.comments c
        JOIN public.social_posts sp ON sp.id = c.post_id
        WHERE c.id = comment_id AND (
            sp.visibility = 'public' OR
            sp.user_id = auth.uid() OR
            (sp.visibility = 'friends' AND EXISTS (
                SELECT 1 FROM public.friendships 
                WHERE (requester_id = auth.uid() AND addressee_id = sp.user_id AND status = 'accepted') OR
                      (requester_id = sp.user_id AND addressee_id = auth.uid() AND status = 'accepted')
            ))
        )
    )
);

-- Streaks policies
CREATE POLICY "Users can manage own streaks" ON public.user_streaks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view own streak history" ON public.streak_history FOR ALL USING (user_id = auth.uid());

-- Challenge policies
CREATE POLICY "Users can view active challenges" ON public.challenges FOR SELECT USING (status = 'active' OR created_by = auth.uid());
CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own challenges" ON public.challenges FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can manage own challenge participation" ON public.challenge_participants FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view challenge participants" ON public.challenge_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.challenges WHERE id = challenge_id AND status = 'active')
);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR ALL USING (user_id = auth.uid());

-- Public read access for reference tables
CREATE POLICY "Anyone can view exercise categories" ON public.exercise_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view muscle groups" ON public.muscle_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can view equipment types" ON public.equipment_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Anyone can view workout templates" ON public.workout_templates FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (is_active = true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_level ON public.user_profiles(current_level);

-- Exercises indexes
CREATE INDEX idx_exercises_category ON public.exercises(category_id);
CREATE INDEX idx_exercises_equipment ON public.exercises(equipment_id);
CREATE INDEX idx_exercises_difficulty ON public.exercises(difficulty_level);
CREATE INDEX idx_exercises_name ON public.exercises(name);
CREATE INDEX idx_exercises_name_es ON public.exercises(name_es);

-- Workout sessions indexes
CREATE INDEX idx_workout_sessions_user_date ON public.workout_sessions(user_id, started_at);
CREATE INDEX idx_workout_sessions_template ON public.workout_sessions(template_id);
CREATE INDEX idx_workout_sessions_status ON public.workout_sessions(status);

-- Social features indexes
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);

-- Performance indexes
CREATE INDEX idx_social_posts_visibility ON public.social_posts(visibility);
CREATE INDEX idx_comments_deleted ON public.comments(is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_user_achievements_completed ON public.user_achievements(is_completed);

-- ============================================================================
-- COMPREHENSIVE INITIAL DATA
-- ============================================================================

-- Insert exercise categories
INSERT INTO public.exercise_categories (name, name_es, description, icon, color) VALUES
('Strength Training', 'Entrenamiento de Fuerza', 'Exercises focused on building muscle strength and mass', 'dumbbell', '#FF6B6B'),
('Cardio', 'Cardio', 'Cardiovascular exercises for heart health and endurance', 'heart', '#4ECDC4'),
('Flexibility', 'Flexibilidad', 'Stretching and mobility exercises', 'stretch', '#45B7D1'),
('Functional', 'Funcional', 'Functional movement patterns for daily activities', 'activity', '#96CEB4'),
('Sports', 'Deportes', 'Sport-specific training exercises', 'trophy', '#FFEAA7'),
('Rehabilitation', 'Rehabilitación', 'Recovery and injury prevention exercises', 'shield', '#DDA0DD'),
('Powerlifting', 'Powerlifting', 'Competition powerlifting movements', 'weight', '#8B5CF6'),
('Olympic Lifting', 'Halterofilia', 'Olympic weightlifting movements', 'medal', '#F59E0B'),
('Calisthenics', 'Calistenia', 'Bodyweight strength training', 'body', '#10B981'),
('CrossFit', 'CrossFit', 'High-intensity functional fitness', 'crossfit', '#EF4444');

-- Insert muscle groups
INSERT INTO public.muscle_groups (name, name_es, description, body_part) VALUES
('Chest', 'Pecho', 'Pectoral muscles', 'upper_body'),
('Back', 'Espalda', 'Latissimus dorsi, rhomboids, trapezius', 'upper_body'),
('Shoulders', 'Hombros', 'Deltoid muscles', 'upper_body'),
('Biceps', 'Bíceps', 'Front arm muscles', 'upper_body'),
('Triceps', 'Tríceps', 'Back arm muscles', 'upper_body'),
('Forearms', 'Antebrazos', 'Lower arm muscles', 'upper_body'),
('Core', 'Core', 'Abdominal and core muscles', 'core'),
('Abs', 'Abdominales', 'Abdominal muscles', 'core'),
('Obliques', 'Oblicuos', 'Side abdominal muscles', 'core'),
('Lower Back', 'Espalda Baja', 'Lumbar region muscles', 'core'),
('Quadriceps', 'Cuádriceps', 'Front thigh muscles', 'lower_body'),
('Hamstrings', 'Isquiotibiales', 'Back thigh muscles', 'lower_body'),
('Glutes', 'Glúteos', 'Gluteal muscles', 'lower_body'),
('Calves', 'Pantorrillas', 'Lower leg muscles', 'lower_body'),
('Hip Flexors', 'Flexores de Cadera', 'Hip flexor muscles', 'lower_body'),
('Adductors', 'Aductores', 'Inner thigh muscles', 'lower_body');

-- Insert equipment types
INSERT INTO public.equipment_types (name, name_es, description, icon) VALUES
('Barbell', 'Barra', 'Olympic barbell for heavy lifting', 'barbell'),
('Dumbbell', 'Mancuernas', 'Free weights for unilateral training', 'dumbbell'),
('Machine', 'Máquina', 'Weight machines and cable systems', 'machine'),
('Bodyweight', 'Peso Corporal', 'No equipment needed', 'body'),
('Resistance Band', 'Banda Elástica', 'Elastic resistance bands', 'band'),
('Kettlebell', 'Kettlebell', 'Cast iron weights with handles', 'kettlebell'),
('Cable', 'Polea', 'Cable machine exercises', 'cable'),
('Smith Machine', 'Máquina Smith', 'Guided barbell machine', 'smith'),
('Pull-up Bar', 'Barra de Dominadas', 'Bar for pull-ups and chin-ups', 'pullup'),
('Bench', 'Banco', 'Weight bench for various exercises', 'bench'),
('Squat Rack', 'Rack de Sentadillas', 'Safety rack for squats', 'rack'),
('Medicine Ball', 'Pelota Medicinal', 'Weighted ball for functional training', 'medicine-ball'),
('Battle Ropes', 'Cuerdas de Batalla', 'Heavy ropes for cardio and strength', 'rope'),
('TRX', 'TRX', 'Suspension trainer system', 'trx'),
('Foam Roller', 'Rodillo de Espuma', 'Recovery and mobility tool', 'foam-roller');

-- Get category and equipment IDs for exercises
DO $$
DECLARE
    strength_cat_id UUID;
    cardio_cat_id UUID;
    flexibility_cat_id UUID;
    functional_cat_id UUID;
    powerlifting_cat_id UUID;
    olympic_cat_id UUID;
    calisthenics_cat_id UUID;
    
    barbell_eq_id UUID;
    dumbbell_eq_id UUID;
    machine_eq_id UUID;
    bodyweight_eq_id UUID;
    kettlebell_eq_id UUID;
    cable_eq_id UUID;
    pullup_eq_id UUID;
    bench_eq_id UUID;
    
    chest_mg_id UUID;
    back_mg_id UUID;
    shoulders_mg_id UUID;
    biceps_mg_id UUID;
    triceps_mg_id UUID;
    core_mg_id UUID;
    quads_mg_id UUID;
    hamstrings_mg_id UUID;
    glutes_mg_id UUID;
    calves_mg_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO strength_cat_id FROM public.exercise_categories WHERE name = 'Strength Training';
    SELECT id INTO cardio_cat_id FROM public.exercise_categories WHERE name = 'Cardio';
    SELECT id INTO flexibility_cat_id FROM public.exercise_categories WHERE name = 'Flexibility';
    SELECT id INTO functional_cat_id FROM public.exercise_categories WHERE name = 'Functional';
    SELECT id INTO powerlifting_cat_id FROM public.exercise_categories WHERE name = 'Powerlifting';
    SELECT id INTO olympic_cat_id FROM public.exercise_categories WHERE name = 'Olympic Lifting';
    SELECT id INTO calisthenics_cat_id FROM public.exercise_categories WHERE name = 'Calisthenics';
    
    -- Get equipment IDs
    SELECT id INTO barbell_eq_id FROM public.equipment_types WHERE name = 'Barbell';
    SELECT id INTO dumbbell_eq_id FROM public.equipment_types WHERE name = 'Dumbbell';
    SELECT id INTO machine_eq_id FROM public.equipment_types WHERE name = 'Machine';
    SELECT id INTO bodyweight_eq_id FROM public.equipment_types WHERE name = 'Bodyweight';
    SELECT id INTO kettlebell_eq_id FROM public.equipment_types WHERE name = 'Kettlebell';
    SELECT id INTO cable_eq_id FROM public.equipment_types WHERE name = 'Cable';
    SELECT id INTO pullup_eq_id FROM public.equipment_types WHERE name = 'Pull-up Bar';
    SELECT id INTO bench_eq_id FROM public.equipment_types WHERE name = 'Bench';
    
    -- Get muscle group IDs
    SELECT id INTO chest_mg_id FROM public.muscle_groups WHERE name = 'Chest';
    SELECT id INTO back_mg_id FROM public.muscle_groups WHERE name = 'Back';
    SELECT id INTO shoulders_mg_id FROM public.muscle_groups WHERE name = 'Shoulders';
    SELECT id INTO biceps_mg_id FROM public.muscle_groups WHERE name = 'Biceps';
    SELECT id INTO triceps_mg_id FROM public.muscle_groups WHERE name = 'Triceps';
    SELECT id INTO core_mg_id FROM public.muscle_groups WHERE name = 'Core';
    SELECT id INTO quads_mg_id FROM public.muscle_groups WHERE name = 'Quadriceps';
    SELECT id INTO hamstrings_mg_id FROM public.muscle_groups WHERE name = 'Hamstrings';
    SELECT id INTO glutes_mg_id FROM public.muscle_groups WHERE name = 'Glutes';
    SELECT id INTO calves_mg_id FROM public.muscle_groups WHERE name = 'Calves';

    -- Insert comprehensive exercise database
    INSERT INTO public.exercises (name, name_es, description, instructions, instructions_es, category_id, primary_muscle_groups, secondary_muscle_groups, equipment_id, difficulty_level, force_type, mechanics, is_verified) VALUES
    
    -- CHEST EXERCISES
    ('Bench Press', 'Press de Banca', 'Classic chest building exercise', 'Lie on bench, grip bar shoulder-width apart, lower to chest, press up', 'Acuéstate en el banco, agarra la barra al ancho de hombros, baja al pecho, empuja hacia arriba', strength_cat_id, ARRAY[chest_mg_id], ARRAY[shoulders_mg_id, triceps_mg_id], barbell_eq_id, 3, 'push', 'compound', true),
    ('Incline Bench Press', 'Press Inclinado', 'Upper chest focused bench press', 'Set bench to 30-45 degrees, perform bench press motion', 'Ajusta el banco a 30-45 grados, realiza el movimiento de press de banca', strength_cat_id, ARRAY[chest_mg_id], ARRAY[shoulders_mg_id, triceps_mg_id], barbell_eq_id, 3, 'push', 'compound', true),
    ('Dumbbell Bench Press', 'Press con Mancuernas', 'Unilateral chest development', 'Use dumbbells instead of barbell for greater range of motion', 'Usa mancuernas en lugar de barra para mayor rango de movimiento', strength_cat_id, ARRAY[chest_mg_id], ARRAY[shoulders_mg_id, triceps_mg_id], dumbbell_eq_id, 2, 'push', 'compound', true),
    ('Push-ups', 'Flexiones', 'Bodyweight chest exercise', 'Start in plank position, lower chest to ground, push back up', 'Comienza en posición de plancha, baja el pecho al suelo, empuja hacia arriba', calisthenics_cat_id, ARRAY[chest_mg_id], ARRAY[shoulders_mg_id, triceps_mg_id, core_mg_id], bodyweight_eq_id, 1, 'push', 'compound', true),
    ('Dips', 'Fondos', 'Bodyweight triceps and chest exercise', 'Support body on parallel bars, lower and raise body', 'Apóyate en barras paralelas, baja y sube el cuerpo', calisthenics_cat_id, ARRAY[chest_mg_id, triceps_mg_id], ARRAY[shoulders_mg_id], bodyweight_eq_id, 3, 'push', 'compound', true),
    
    -- BACK EXERCISES
    ('Deadlift', 'Peso Muerto', 'King of all exercises', 'Stand with feet hip-width, grip bar, lift by extending hips and knees', 'Párate con pies al ancho de caderas, agarra la barra, levanta extendiendo caderas y rodillas', powerlifting_cat_id, ARRAY[back_mg_id, glutes_mg_id, hamstrings_mg_id], ARRAY[quads_mg_id, core_mg_id], barbell_eq_id, 4, 'pull', 'compound', true),
    ('Pull-ups', 'Dominadas', 'Upper body pulling exercise', 'Hang from bar, pull body up until chin over bar', 'Cuélgate de la barra, tira del cuerpo hasta que la barbilla pase la barra', calisthenics_cat_id, ARRAY[back_mg_id], ARRAY[biceps_mg_id, shoulders_mg_id], pullup_eq_id, 4, 'pull', 'compound', true),
    ('Bent-over Row', 'Remo Inclinado', 'Horizontal pulling movement', 'Bend at hips, pull bar to lower chest', 'Inclínate en las caderas, tira la barra hacia el pecho inferior', strength_cat_id, ARRAY[back_mg_id], ARRAY[biceps_mg_id, shoulders_mg_id], barbell_eq_id, 3, 'pull', 'compound', true),
    ('Lat Pulldown', 'Jalón al Pecho', 'Vertical pulling machine exercise', 'Sit at machine, pull bar down to upper chest', 'Siéntate en la máquina, tira la barra hacia el pecho superior', strength_cat_id, ARRAY[back_mg_id], ARRAY[biceps_mg_id, shoulders_mg_id], machine_eq_id, 2, 'pull', 'compound', true),
    ('T-Bar Row', 'Remo en T', 'Thick grip rowing movement', 'Straddle T-bar, pull handle to chest', 'Ponte a horcajadas sobre la barra en T, tira del mango al pecho', strength_cat_id, ARRAY[back_mg_id], ARRAY[biceps_mg_id, shoulders_mg_id], barbell_eq_id, 3, 'pull', 'compound', true),
    
    -- LEG EXERCISES
    ('Squat', 'Sentadilla', 'King of leg exercises', 'Stand with bar on shoulders, squat down and up', 'Párate con la barra en los hombros, baja en sentadilla y sube', powerlifting_cat_id, ARRAY[quads_mg_id, glutes_mg_id], ARRAY[hamstrings_mg_id, core_mg_id], barbell_eq_id, 4, 'push', 'compound', true),
    ('Front Squat', 'Sentadilla Frontal', 'Quad-focused squat variation', 'Hold bar in front rack position, perform squat', 'Sostén la barra en posición frontal, realiza la sentadilla', olympic_cat_id, ARRAY[quads_mg_id], ARRAY[glutes_mg_id, core_mg_id], barbell_eq_id, 4, 'push', 'compound', true),
    ('Romanian Deadlift', 'Peso Muerto Rumano', 'Hip hinge movement', 'Keep legs straight, hinge at hips, lower bar', 'Mantén las piernas rectas, gira en las caderas, baja la barra', strength_cat_id, ARRAY[hamstrings_mg_id, glutes_mg_id], ARRAY[back_mg_id, core_mg_id], barbell_eq_id, 3, 'pull', 'compound', true),
    ('Lunges', 'Zancadas', 'Unilateral leg exercise', 'Step forward into lunge position, return to start', 'Da un paso adelante en posición de zancada, regresa al inicio', functional_cat_id, ARRAY[quads_mg_id, glutes_mg_id], ARRAY[hamstrings_mg_id, core_mg_id], bodyweight_eq_id, 2, 'push', 'compound', true),
    ('Leg Press', 'Prensa de Piernas', 'Machine-based leg exercise', 'Sit in machine, press weight with legs', 'Siéntate en la máquina, empuja el peso con las piernas', strength_cat_id, ARRAY[quads_mg_id, glutes_mg_id], ARRAY[hamstrings_mg_id], machine_eq_id, 2, 'push', 'compound', true),
    
    -- SHOULDER EXERCISES
    ('Overhead Press', 'Press Militar', 'Vertical pressing movement', 'Press bar from shoulders to overhead', 'Empuja la barra desde los hombros hacia arriba', strength_cat_id, ARRAY[shoulders_mg_id], ARRAY[triceps_mg_id, core_mg_id], barbell_eq_id, 3, 'push', 'compound', true),
    ('Lateral Raises', 'Elevaciones Laterales', 'Side deltoid isolation', 'Raise dumbbells to sides until parallel to floor', 'Levanta las mancuernas a los lados hasta quedar paralelas al suelo', strength_cat_id, ARRAY[shoulders_mg_id], ARRAY[], dumbbell_eq_id, 2, 'pull', 'isolation', true),
    ('Face Pulls', 'Jalones Faciales', 'Rear deltoid and upper back', 'Pull rope to face level, separate handles', 'Tira la cuerda al nivel de la cara, separa las manijas', strength_cat_id, ARRAY[shoulders_mg_id], ARRAY[back_mg_id], cable_eq_id, 2, 'pull', 'isolation', true),
    
    -- ARM EXERCISES
    ('Bicep Curls', 'Curl de Bíceps', 'Bicep isolation exercise', 'Curl dumbbells up, squeeze biceps', 'Curva las mancuernas hacia arriba, aprieta los bíceps', strength_cat_id, ARRAY[biceps_mg_id], ARRAY[], dumbbell_eq_id, 1, 'pull', 'isolation', true),
    ('Tricep Dips', 'Fondos de Tríceps', 'Tricep bodyweight exercise', 'Lower and raise body using triceps', 'Baja y sube el cuerpo usando los tríceps', calisthenics_cat_id, ARRAY[triceps_mg_id], ARRAY[shoulders_mg_id], bodyweight_eq_id, 2, 'push', 'compound', true),
    ('Close-Grip Bench Press', 'Press Cerrado', 'Tricep-focused bench press', 'Bench press with narrow grip', 'Press de banca con agarre estrecho', strength_cat_id, ARRAY[triceps_mg_id], ARRAY[chest_mg_id, shoulders_mg_id], barbell_eq_id, 3, 'push', 'compound', true),
    
    -- CORE EXERCISES
    ('Plank', 'Plancha', 'Core stability exercise', 'Hold body in straight line on forearms', 'Mantén el cuerpo en línea recta sobre los antebrazos', functional_cat_id, ARRAY[core_mg_id], ARRAY[], bodyweight_eq_id, 1, 'static', 'isolation', true),
    ('Russian Twists', 'Giros Rusos', 'Oblique strengthening', 'Sit with knees bent, rotate torso side to side', 'Siéntate con rodillas dobladas, rota el torso de lado a lado', functional_cat_id, ARRAY[core_mg_id], ARRAY[], bodyweight_eq_id, 2, 'pull', 'isolation', true),
    ('Dead Bug', 'Bicho Muerto', 'Core stability and coordination', 'Lie on back, extend opposite arm and leg', 'Acuéstate boca arriba, extiende brazo y pierna opuestos', functional_cat_id, ARRAY[core_mg_id], ARRAY[], bodyweight_eq_id, 2, 'static', 'isolation', true),
    
    -- CARDIO EXERCISES
    ('Running', 'Correr', 'Cardiovascular endurance', 'Maintain steady pace for distance or time', 'Mantén un ritmo constante por distancia o tiempo', cardio_cat_id, ARRAY[], ARRAY[], bodyweight_eq_id, 2, 'other', 'compound', true),
    ('Burpees', 'Burpees', 'Full body cardio exercise', 'Squat, jump back to plank, push-up, jump up', 'Sentadilla, salta atrás a plancha, flexión, salta arriba', functional_cat_id, ARRAY[core_mg_id], ARRAY[chest_mg_id, shoulders_mg_id, quads_mg_id], bodyweight_eq_id, 3, 'other', 'compound', true),
    ('Mountain Climbers', 'Escaladores', 'Dynamic core cardio', 'In plank position, alternate bringing knees to chest', 'En posición de plancha, alterna llevando rodillas al pecho', cardio_cat_id, ARRAY[core_mg_id], ARRAY[shoulders_mg_id], bodyweight_eq_id, 2, 'other', 'compound', true);

END $$;

-- Insert comprehensive achievements system
INSERT INTO public.achievements (key, name, name_es, description, description_es, category, rarity, xp_reward, requirements, icon, color, is_active) VALUES

-- MILESTONE ACHIEVEMENTS
('first_workout', 'First Steps', 'Primeros Pasos', 'Complete your first workout', 'Completa tu primer entrenamiento', 'milestone', 'common', 100, '{"workouts_completed": 1}', 'star', '#FFD93D', true),
('workouts_10', 'Getting Started', 'Comenzando', 'Complete 10 workouts', 'Completa 10 entrenamientos', 'milestone', 'common', 250, '{"workouts_completed": 10}', 'trophy', '#4ECDC4', true),
('workouts_50', 'Dedicated', 'Dedicado', 'Complete 50 workouts', 'Completa 50 entrenamientos', 'milestone', 'rare', 500, '{"workouts_completed": 50}', 'medal', '#FF6B6B', true),
('workouts_100', 'Centurion', 'Centurión', 'Complete 100 workouts', 'Completa 100 entrenamientos', 'milestone', 'epic', 1000, '{"workouts_completed": 100}', 'crown', '#8B5CF6', true),
('workouts_365', 'Year Warrior', 'Guerrero del Año', 'Complete 365 workouts', 'Completa 365 entrenamientos', 'milestone', 'legendary', 2500, '{"workouts_completed": 365}', 'diamond', '#F59E0B', true),

-- CONSISTENCY ACHIEVEMENTS
('streak_3', 'Getting Consistent', 'Siendo Consistente', 'Maintain a 3-day workout streak', 'Mantén una racha de 3 días de entrenamiento', 'consistency', 'common', 150, '{"streak_days": 3}', 'fire', '#FF6B6B', true),
('streak_7', 'Week Warrior', 'Guerrero Semanal', 'Maintain a 7-day workout streak', 'Mantén una racha de 7 días de entrenamiento', 'consistency', 'rare', 350, '{"streak_days": 7}', 'flame', '#FF4500', true),
('streak_30', 'Monthly Master', 'Maestro Mensual', 'Maintain a 30-day workout streak', 'Mantén una racha de 30 días de entrenamiento', 'consistency', 'epic', 750, '{"streak_days": 30}', 'calendar', '#32CD32', true),
('streak_100', 'Streak Legend', 'Leyenda de Racha', 'Maintain a 100-day workout streak', 'Mantén una racha de 100 días de entrenamiento', 'consistency', 'legendary', 2000, '{"streak_days": 100}', 'infinity', '#FFD700', true),

-- STRENGTH ACHIEVEMENTS
('bench_bodyweight', 'Bodyweight Bench', 'Press Corporal', 'Bench press your bodyweight', 'Haz press de banca con tu peso corporal', 'strength', 'rare', 500, '{"exercise": "bench_press", "weight_ratio": 1.0}', 'muscle', '#FF6B6B', true),
('squat_bodyweight', 'Bodyweight Squat', 'Sentadilla Corporal', 'Squat your bodyweight', 'Haz sentadilla con tu peso corporal', 'strength', 'rare', 500, '{"exercise": "squat", "weight_ratio": 1.0}', 'legs', '#4ECDC4', true),
('deadlift_bodyweight', 'Bodyweight Deadlift', 'Peso Muerto Corporal', 'Deadlift your bodyweight', 'Haz peso muerto con tu peso corporal', 'strength', 'rare', 500, '{"exercise": "deadlift", "weight_ratio": 1.0}', 'barbell', '#8B5CF6', true),
('bench_1_5x', '1.5x Bench Press', 'Press 1.5x', 'Bench press 1.5x your bodyweight', 'Haz press de banca con 1.5x tu peso corporal', 'strength', 'epic', 1000, '{"exercise": "bench_press", "weight_ratio": 1.5}', 'strong', '#FF4500', true),
('squat_2x', 'Double Bodyweight Squat', 'Sentadilla Doble', 'Squat 2x your bodyweight', 'Haz sentadilla con 2x tu peso corporal', 'strength', 'epic', 1200, '{"exercise": "squat", "weight_ratio": 2.0}', 'power', '#32CD32', true),
('deadlift_2_5x', '2.5x Deadlift', 'Peso Muerto 2.5x', 'Deadlift 2.5x your bodyweight', 'Haz peso muerto con 2.5x tu peso corporal', 'strength', 'legendary', 2000, '{"exercise": "deadlift", "weight_ratio": 2.5}', 'titan', '#FFD700', true),

-- VOLUME ACHIEVEMENTS
('volume_1000kg', '1 Ton Moved', '1 Tonelada Movida', 'Move 1000kg in a single workout', 'Mueve 1000kg en un solo entrenamiento', 'volume', 'rare', 400, '{"workout_volume": 1000}', 'weight', '#666666', true),
('volume_5000kg', '5 Tons Moved', '5 Toneladas Movidas', 'Move 5000kg in a single workout', 'Mueve 5000kg en un solo entrenamiento', 'volume', 'epic', 800, '{"workout_volume": 5000}', 'heavy', '#444444', true),
('volume_total_100000kg', '100 Ton Lifetime', '100 Toneladas Totales', 'Move 100,000kg total lifetime volume', 'Mueve 100,000kg de volumen total de por vida', 'volume', 'legendary', 1500, '{"total_volume": 100000}', 'mountain', '#2F4F4F', true),

-- SOCIAL ACHIEVEMENTS
('first_friend', 'Social Butterfly', 'Mariposa Social', 'Add your first gym friend', 'Agrega tu primer amigo del gym', 'social', 'common', 100, '{"friends_count": 1}', 'users', '#FF69B4', true),
('friends_10', 'Popular', 'Popular', 'Have 10 gym friends', 'Ten 10 amigos del gym', 'social', 'rare', 300, '{"friends_count": 10}', 'heart', '#FF1493', true),
('first_post', 'Content Creator', 'Creador de Contenido', 'Share your first workout post', 'Comparte tu primera publicación de entrenamiento', 'social', 'common', 150, '{"posts_created": 1}', 'camera', '#1DA1F2', true),
('posts_50', 'Influencer', 'Influencer', 'Create 50 workout posts', 'Crea 50 publicaciones de entrenamiento', 'social', 'epic', 750, '{"posts_created": 50}', 'megaphone', '#E1306C', true),
('likes_100', 'Well Liked', 'Bien Querido', 'Receive 100 likes on your posts', 'Recibe 100 likes en tus publicaciones', 'social', 'rare', 400, '{"likes_received": 100}', 'thumbs-up', '#FF6B6B', true),

-- SPECIAL ACHIEVEMENTS
('early_bird', 'Early Bird', 'Madrugador', 'Complete 10 workouts before 7 AM', 'Completa 10 entrenamientos antes de las 7 AM', 'special', 'rare', 500, '{"early_workouts": 10}', 'sunrise', '#FFA500', true),
('night_owl', 'Night Owl', 'Búho Nocturno', 'Complete 10 workouts after 9 PM', 'Completa 10 entrenamientos después de las 9 PM', 'special', 'rare', 500, '{"late_workouts": 10}', 'moon', '#4169E1', true),
('weekend_warrior', 'Weekend Warrior', 'Guerrero de Fin de Semana', 'Complete 20 weekend workouts', 'Completa 20 entrenamientos de fin de semana', 'special', 'rare', 400, '{"weekend_workouts": 20}', 'weekend', '#32CD32', true),
('perfect_week', 'Perfect Week', 'Semana Perfecta', 'Complete all scheduled workouts in a week', 'Completa todos los entrenamientos programados en una semana', 'special', 'epic', 600, '{"perfect_weeks": 1}', 'check-circle', '#00FF00', true),
('comeback_kid', 'Comeback Kid', 'El Regreso', 'Return to working out after 30+ days break', 'Regresa a entrenar después de más de 30 días de descanso', 'special', 'rare', 350, '{"comeback": true}', 'return', '#FF8C00', true),

-- EXERCISE-SPECIFIC ACHIEVEMENTS
('pullup_master', 'Pull-up Master', 'Maestro de Dominadas', 'Complete 20 pull-ups in a single set', 'Completa 20 dominadas en una sola serie', 'strength', 'epic', 800, '{"exercise": "pullups", "reps": 20}', 'pullup', '#4ECDC4', true),
('pushup_century', 'Push-up Century', 'Siglo de Flexiones', 'Complete 100 push-ups in a single workout', 'Completa 100 flexiones en un solo entrenamiento', 'endurance', 'epic', 700, '{"exercise": "pushups", "workout_reps": 100}', 'pushup', '#FF6B6B', true),
('plank_master', 'Plank Master', 'Maestro de Plancha', 'Hold a plank for 5 minutes', 'Mantén una plancha por 5 minutos', 'endurance', 'epic', 600, '{"exercise": "plank", "duration": 300}', 'timer', '#8B5CF6', true),

-- GAMIFICATION ACHIEVEMENTS
('level_10', 'Rising Star', 'Estrella Ascendente', 'Reach level 10', 'Alcanza el nivel 10', 'level', 'common', 200, '{"level": 10}', 'star-up', '#FFD93D', true),
('level_25', 'Experienced', 'Experimentado', 'Reach level 25', 'Alcanza el nivel 25', 'level', 'rare', 500, '{"level": 25}', 'badge', '#4ECDC4', true),
('level_50', 'Expert', 'Experto', 'Reach level 50', 'Alcanza el nivel 50', 'level', 'epic', 1000, '{"level": 50}', 'expert', '#8B5CF6', true),
('level_100', 'Master', 'Maestro', 'Reach level 100', 'Alcanza el nivel 100', 'level', 'legendary', 2500, '{"level": 100}', 'master', '#FFD700', true),
('xp_10000', 'XP Collector', 'Coleccionista de XP', 'Earn 10,000 total XP', 'Gana 10,000 XP en total', 'xp', 'rare', 300, '{"total_xp": 10000}', 'gem', '#9932CC', true),
('xp_50000', 'XP Hoarder', 'Acumulador de XP', 'Earn 50,000 total XP', 'Gana 50,000 XP en total', 'xp', 'epic', 750, '{"total_xp": 50000}', 'treasure', '#FF4500', true);

-- Insert default workout templates
DO $$
DECLARE
    strength_cat_id UUID;
    beginner_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- System user for default templates
BEGIN
    SELECT id INTO strength_cat_id FROM public.exercise_categories WHERE name = 'Strength Training';
    
    INSERT INTO public.workout_templates (name, description, exercises, estimated_duration, difficulty_level, category, tags, created_by, is_public, is_featured) VALUES
    
    ('Push Day (Beginner)', 'Beginner-friendly push workout focusing on chest, shoulders, and triceps', 
     '[
       {"exercise_id": "bench_press", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Focus on form over weight"},
       {"exercise_id": "overhead_press", "sets": 3, "reps": "8-10", "rest_seconds": 90, "notes": "Keep core tight"},
       {"exercise_id": "pushups", "sets": 3, "reps": "max", "rest_seconds": 60, "notes": "Modify on knees if needed"},
       {"exercise_id": "lateral_raises", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Light weight, controlled movement"},
       {"exercise_id": "tricep_dips", "sets": 3, "reps": "8-12", "rest_seconds": 60, "notes": "Use assistance if needed"}
     ]', 45, 1, 'push', ARRAY['beginner', 'push', 'upper-body'], beginner_user_id, true, true),
    
    ('Pull Day (Beginner)', 'Beginner-friendly pull workout focusing on back and biceps',
     '[
       {"exercise_id": "lat_pulldown", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Pull to upper chest"},
       {"exercise_id": "bent_over_row", "sets": 3, "reps": "8-10", "rest_seconds": 90, "notes": "Keep back straight"},
       {"exercise_id": "pullups", "sets": 3, "reps": "max", "rest_seconds": 120, "notes": "Use assistance if needed"},
       {"exercise_id": "bicep_curls", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Control the negative"},
       {"exercise_id": "face_pulls", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Focus on rear delts"}
     ]', 45, 1, 'pull', ARRAY['beginner', 'pull', 'upper-body'], beginner_user_id, true, true),
    
    ('Leg Day (Beginner)', 'Beginner-friendly leg workout focusing on quads, glutes, and hamstrings',
     '[
       {"exercise_id": "squat", "sets": 3, "reps": "8-10", "rest_seconds": 150, "notes": "Focus on depth and form"},
       {"exercise_id": "romanian_deadlift", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Feel the stretch in hamstrings"},
       {"exercise_id": "lunges", "sets": 3, "reps": "10 each leg", "rest_seconds": 90, "notes": "Alternate legs or do all one side first"},
       {"exercise_id": "leg_press", "sets": 3, "reps": "12-15", "rest_seconds": 90, "notes": "Full range of motion"},
       {"exercise_id": "plank", "sets": 3, "reps": "30-60 seconds", "rest_seconds": 60, "notes": "Keep body straight"}
     ]', 50, 1, 'legs', ARRAY['beginner', 'legs', 'lower-body'], beginner_user_id, true, true),
    
    ('Full Body (Beginner)', 'Complete full body workout for beginners',
     '[
       {"exercise_id": "squat", "sets": 2, "reps": "8-10", "rest_seconds": 120, "notes": "Bodyweight or light weight"},
       {"exercise_id": "pushups", "sets": 2, "reps": "max", "rest_seconds": 90, "notes": "Modify as needed"},
       {"exercise_id": "bent_over_row", "sets": 2, "reps": "8-10", "rest_seconds": 90, "notes": "Light weight, focus on form"},
       {"exercise_id": "overhead_press", "sets": 2, "reps": "8-10", "rest_seconds": 90, "notes": "Start light"},
       {"exercise_id": "plank", "sets": 2, "reps": "30 seconds", "rest_seconds": 60, "notes": "Build up time gradually"},
       {"exercise_id": "lunges", "sets": 2, "reps": "8 each leg", "rest_seconds": 60, "notes": "Focus on balance"}
     ]', 35, 1, 'full-body', ARRAY['beginner', 'full-body', 'starter'], beginner_user_id, true, true),
    
    ('Upper/Lower Split (Intermediate)', 'Intermediate upper body focused workout',
     '[
       {"exercise_id": "bench_press", "sets": 4, "reps": "6-8", "rest_seconds": 180, "notes": "Progressive overload"},
       {"exercise_id": "pullups", "sets": 4, "reps": "6-10", "rest_seconds": 150, "notes": "Add weight if possible"},
       {"exercise_id": "overhead_press", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Strict form"},
       {"exercise_id": "bent_over_row", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Squeeze shoulder blades"},
       {"exercise_id": "dips", "sets": 3, "reps": "8-12", "rest_seconds": 90, "notes": "Add weight if needed"},
       {"exercise_id": "bicep_curls", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Various grips"}
     ]', 60, 3, 'upper-body', ARRAY['intermediate', 'upper-body', 'strength'], beginner_user_id, true, true),
    
    ('Powerlifting Focus', 'Advanced powerlifting-focused workout',
     '[
       {"exercise_id": "squat", "sets": 5, "reps": "3-5", "rest_seconds": 300, "notes": "Heavy weight, perfect form"},
       {"exercise_id": "bench_press", "sets": 5, "reps": "3-5", "rest_seconds": 300, "notes": "Competition commands"},
       {"exercise_id": "deadlift", "sets": 3, "reps": "1-3", "rest_seconds": 300, "notes": "Work up to heavy single"},
       {"exercise_id": "close_grip_bench", "sets": 3, "reps": "6-8", "rest_seconds": 180, "notes": "Tricep strength"},
       {"exercise_id": "front_squat", "sets": 3, "reps": "5-8", "rest_seconds": 180, "notes": "Quad development"}
     ]', 90, 5, 'powerlifting', ARRAY['advanced', 'powerlifting', 'strength'], beginner_user_id, true, true),
    
    ('HIIT Cardio Blast', 'High-intensity interval training workout',
     '[
       {"exercise_id": "burpees", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "All out effort"},
       {"exercise_id": "mountain_climbers", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "Fast pace"},
       {"exercise_id": "pushups", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "Explosive movement"},
       {"exercise_id": "russian_twists", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "Core engagement"},
       {"exercise_id": "plank", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "Hold strong"}
     ]', 25, 3, 'cardio', ARRAY['intermediate', 'hiit', 'cardio', 'fat-loss'], beginner_user_id, true, true);

END $$;

-- ============================================================================
-- ADDITIONAL SYSTEM DATA
-- ============================================================================

-- Insert notification templates for different events
INSERT INTO public.notifications (id, user_id, type, title, message, data, is_read, created_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'workout_reminder', 'Recordatorio de Entrenamiento', 'Es hora de tu entrenamiento programado', '{}', true, NOW()),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'achievement_unlocked', '¡Logro Desbloqueado!', 'Has desbloqueado un nuevo logro', '{}', true, NOW()),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'friend_request', 'Solicitud de Amistad', 'Tienes una nueva solicitud de amistad', '{}', true, NOW()),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'streak_reminder', 'Mantén tu Racha', 'No olvides entrenar hoy para mantener tu racha', '{}', true, NOW());

-- Create system challenges
INSERT INTO public.challenges (id, created_by, title, description, type, requirements, rewards, start_date, end_date, status) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Desafío de Año Nuevo', 'Completa 30 entrenamientos en enero', 'community', 
 '{"workouts_required": 30, "time_limit_days": 31}', 
 '{"xp_bonus": 1000, "badge": "new_year_warrior", "title": "Guerrero de Año Nuevo"}', 
 '2024-01-01 00:00:00+00', '2024-01-31 23:59:59+00', 'upcoming'),

('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Desafío de Fuerza', 'Aumenta tu 1RM en cualquier ejercicio principal', 'individual', 
 '{"pr_improvement": true, "exercises": ["squat", "bench_press", "deadlift"]}', 
 '{"xp_bonus": 500, "badge": "strength_warrior"}', 
 '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 'active'),

('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Desafío Social', 'Haz 10 nuevos amigos del gym', 'community', 
 '{"friends_to_add": 10}', 
 '{"xp_bonus": 750, "badge": "social_butterfly", "title": "Mariposa Social"}', 
 '2024-01-01 00:00:00+00', '2024-06-30 23:59:59+00', 'active');

-- ============================================================================
-- SAMPLE DATA FOR TESTING (Optional - Remove in production)
-- ============================================================================

-- Note: This section creates sample data for testing purposes
-- Remove or comment out this section before deploying to production

-- Create a test user profile (this would normally be created by the auth trigger)
-- INSERT INTO public.user_profiles (id, username, display_name, email, bio, current_level, total_xp, current_xp) VALUES
-- ('11111111-1111-1111-1111-111111111111', 'testuser', 'Test User', 'test@example.com', 'This is a test user for development', 5, 2500, 100);

-- Create sample workout session
-- INSERT INTO public.workout_sessions (id, user_id, name, started_at, completed_at, duration_seconds, exercises, total_volume_kg, total_reps, total_sets, status, xp_earned) VALUES
-- ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Test Push Workout', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 3600, 
--  '[{"exercise_id": "bench_press", "sets": [{"weight": 80, "reps": 8}, {"weight": 80, "reps": 8}, {"weight": 80, "reps": 7}]}]', 
--  1920, 23, 3, 'completed', 150);

-- Create sample social post
-- INSERT INTO public.social_posts (id, user_id, type, content, data, visibility) VALUES
-- ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'workout_completed', 
--  '¡Acabo de completar un gran entrenamiento de pecho! 💪', 
--  '{"workout_id": "22222222-2222-2222-2222-222222222222", "exercises_completed": 5, "total_volume": 1920}', 
--  'friends');

-- ============================================================================
-- FINAL SETUP AND VERIFICATION
-- ============================================================================

-- Create indexes for better performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_user_profiles_username_lower ON public.user_profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_exercises_search ON public.exercises USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed ON public.workout_sessions (user_id, completed_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_achievements_category_rarity ON public.achievements (category, rarity) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_achievements_progress ON public.user_achievements (user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_social_posts_feed ON public.social_posts (visibility, created_at DESC) WHERE visibility IN ('public', 'friends');
CREATE INDEX IF NOT EXISTS idx_comments_thread ON public.comments (post_id, parent_comment_id, created_at) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_friendships_lookup ON public.friendships (requester_id, addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id, is_read, created_at DESC) WHERE is_read = false;

-- Verify all tables were created successfully
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'user_profiles', 'user_settings', 'exercise_categories', 'muscle_groups', 
        'equipment_types', 'exercises', 'workout_templates', 'workout_sessions', 
        'exercise_performances', 'achievements', 'user_achievements', 'xp_transactions',
        'friendships', 'social_posts', 'post_likes', 'comments', 'comment_likes',
        'user_streaks', 'streak_history', 'challenges', 'challenge_participants',
        'notifications', 'user_analytics'
    ];
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
BEGIN
    -- Check if all expected tables exist
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    -- Report results
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = ANY(expected_tables);
    
    RAISE NOTICE 'Database setup verification:';
    RAISE NOTICE '- Expected tables: %', array_length(expected_tables, 1);
    RAISE NOTICE '- Created tables: %', table_count;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '- Missing tables: %', missing_tables;
        RAISE EXCEPTION 'Database setup incomplete. Missing tables detected.';
    ELSE
        RAISE NOTICE '- Status: ✅ All tables created successfully!';
        RAISE NOTICE '- Database is ready for the Sport Tracker PWA';
    END IF;
END $$;

-- Final success message
SELECT 
    'Sport Tracker PWA Database Setup Complete! 🎉' as message,
    COUNT(DISTINCT table_name) as total_tables,
    (SELECT COUNT(*) FROM public.exercise_categories) as categories,
    (SELECT COUNT(*) FROM public.muscle_groups) as muscle_groups,
    (SELECT COUNT(*) FROM public.equipment_types) as equipment_types,
    (SELECT COUNT(*) FROM public.exercises) as exercises,
    (SELECT COUNT(*) FROM public.achievements) as achievements,
    (SELECT COUNT(*) FROM public.workout_templates) as templates
FROM information_schema.tables 
WHERE table_schema = 'public';

COMMIT;