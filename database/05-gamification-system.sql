-- ============================================================================
-- PART 5: GAMIFICATION SYSTEM
-- ============================================================================
-- Execute this after Part 4 to create XP, levels, and achievements
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streaks system
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
    
    CONSTRAINT valid_streak_event CHECK (event_type IN ('workout_completed', 'streak_broken', 'streak_milestone', 'shield_used'))
);

-- XP and Level calculation functions
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

-- LEVEL ACHIEVEMENTS
('level_10', 'Rising Star', 'Estrella Ascendente', 'Reach level 10', 'Alcanza el nivel 10', 'level', 'common', 200, '{"level": 10}', 'star-up', '#FFD93D', true),
('level_25', 'Experienced', 'Experimentado', 'Reach level 25', 'Alcanza el nivel 25', 'level', 'rare', 500, '{"level": 25}', 'badge', '#4ECDC4', true),
('level_50', 'Expert', 'Experto', 'Reach level 50', 'Alcanza el nivel 50', 'level', 'epic', 1000, '{"level": 50}', 'expert', '#8B5CF6', true),
('level_100', 'Master', 'Maestro', 'Reach level 100', 'Alcanza el nivel 100', 'level', 'legendary', 2500, '{"level": 100}', 'master', '#FFD700', true);

-- Update user_streaks to be created automatically
UPDATE public.user_streaks SET target_days_per_week = 3 WHERE target_days_per_week IS NULL;

-- Success message
SELECT 'Part 5 completed: Gamification system created successfully!' as status,
       COUNT(*) as total_achievements
FROM public.achievements;