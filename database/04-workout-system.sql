-- ============================================================================
-- PART 4: WORKOUT SYSTEM
-- ============================================================================
-- Execute this after Part 3 to create workout and performance tracking
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
    created_by UUID REFERENCES public.user_profiles(id) NULL,
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
    
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default workout templates
DO $$
DECLARE
    strength_cat_id UUID;
BEGIN
    SELECT id INTO strength_cat_id FROM public.exercise_categories WHERE name = 'Strength Training';
    
    INSERT INTO public.workout_templates (name, description, exercises, estimated_duration, difficulty_level, category, tags, created_by, is_public, is_featured) VALUES
    
    ('Push Day (Beginner)', 'Beginner-friendly push workout focusing on chest, shoulders, and triceps', 
     '[
       {"exercise_name": "Bench Press", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Focus on form over weight"},
       {"exercise_name": "Overhead Press", "sets": 3, "reps": "8-10", "rest_seconds": 90, "notes": "Keep core tight"},
       {"exercise_name": "Push-ups", "sets": 3, "reps": "max", "rest_seconds": 60, "notes": "Modify on knees if needed"},
       {"exercise_name": "Lateral Raises", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Light weight, controlled movement"},
       {"exercise_name": "Tricep Dips", "sets": 3, "reps": "8-12", "rest_seconds": 60, "notes": "Use assistance if needed"}
     ]', 45, 1, 'push', ARRAY['beginner', 'push', 'upper-body'], NULL, true, true),
    
    ('Pull Day (Beginner)', 'Beginner-friendly pull workout focusing on back and biceps',
     '[
       {"exercise_name": "Lat Pulldown", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Pull to upper chest"},
       {"exercise_name": "Bent-over Row", "sets": 3, "reps": "8-10", "rest_seconds": 90, "notes": "Keep back straight"},
       {"exercise_name": "Pull-ups", "sets": 3, "reps": "max", "rest_seconds": 120, "notes": "Use assistance if needed"},
       {"exercise_name": "Bicep Curls", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Control the negative"},
       {"exercise_name": "Face Pulls", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Focus on rear delts"}
     ]', 45, 1, 'pull', ARRAY['beginner', 'pull', 'upper-body'], NULL, true, true),
    
    ('Leg Day (Beginner)', 'Beginner-friendly leg workout focusing on quads, glutes, and hamstrings',
     '[
       {"exercise_name": "Squat", "sets": 3, "reps": "8-10", "rest_seconds": 150, "notes": "Focus on depth and form"},
       {"exercise_name": "Romanian Deadlift", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Feel the stretch in hamstrings"},
       {"exercise_name": "Lunges", "sets": 3, "reps": "10 each leg", "rest_seconds": 90, "notes": "Alternate legs or do all one side first"},
       {"exercise_name": "Leg Press", "sets": 3, "reps": "12-15", "rest_seconds": 90, "notes": "Full range of motion"},
       {"exercise_name": "Plank", "sets": 3, "reps": "30-60 seconds", "rest_seconds": 60, "notes": "Keep body straight"}
     ]', 50, 1, 'legs', ARRAY['beginner', 'legs', 'lower-body'], NULL, true, true),
    
    ('Full Body (Beginner)', 'Complete full body workout for beginners',
     '[
       {"exercise_name": "Squat", "sets": 2, "reps": "8-10", "rest_seconds": 120, "notes": "Bodyweight or light weight"},
       {"exercise_name": "Push-ups", "sets": 2, "reps": "max", "rest_seconds": 90, "notes": "Modify as needed"},
       {"exercise_name": "Bent-over Row", "sets": 2, "reps": "8-10", "rest_seconds": 90, "notes": "Light weight, focus on form"},
       {"exercise_name": "Overhead Press", "sets": 2, "reps": "8-10", "rest_seconds": 90, "notes": "Start light"},
       {"exercise_name": "Plank", "sets": 2, "reps": "30 seconds", "rest_seconds": 60, "notes": "Build up time gradually"},
       {"exercise_name": "Lunges", "sets": 2, "reps": "8 each leg", "rest_seconds": 60, "notes": "Focus on balance"}
     ]', 35, 1, 'full-body', ARRAY['beginner', 'full-body', 'starter'], NULL, true, true),
    
    ('Upper/Lower Split (Intermediate)', 'Intermediate upper body focused workout',
     '[
       {"exercise_name": "Bench Press", "sets": 4, "reps": "6-8", "rest_seconds": 180, "notes": "Progressive overload"},
       {"exercise_name": "Pull-ups", "sets": 4, "reps": "6-10", "rest_seconds": 150, "notes": "Add weight if possible"},
       {"exercise_name": "Overhead Press", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Strict form"},
       {"exercise_name": "Bent-over Row", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Squeeze shoulder blades"},
       {"exercise_name": "Dips", "sets": 3, "reps": "8-12", "rest_seconds": 90, "notes": "Add weight if needed"},
       {"exercise_name": "Bicep Curls", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Various grips"}
     ]', 60, 3, 'upper-body', ARRAY['intermediate', 'upper-body', 'strength'], NULL, true, true),
    
    ('Powerlifting Focus', 'Advanced powerlifting-focused workout',
     '[
       {"exercise_name": "Squat", "sets": 5, "reps": "3-5", "rest_seconds": 300, "notes": "Heavy weight, perfect form"},
       {"exercise_name": "Bench Press", "sets": 5, "reps": "3-5", "rest_seconds": 300, "notes": "Competition commands"},
       {"exercise_name": "Deadlift", "sets": 3, "reps": "1-3", "rest_seconds": 300, "notes": "Work up to heavy single"},
       {"exercise_name": "Close-Grip Bench Press", "sets": 3, "reps": "6-8", "rest_seconds": 180, "notes": "Tricep strength"},
       {"exercise_name": "Front Squat", "sets": 3, "reps": "5-8", "rest_seconds": 180, "notes": "Quad development"}
     ]', 90, 5, 'powerlifting', ARRAY['advanced', 'powerlifting', 'strength'], NULL, true, true),
    
    ('HIIT Cardio Blast', 'High-intensity interval training workout',
     '[
       {"exercise_name": "Burpees", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "All out effort"},
       {"exercise_name": "Mountain Climbers", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "Fast pace"},
       {"exercise_name": "Push-ups", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "Explosive movement"},
       {"exercise_name": "Russian Twists", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "Core engagement"},
       {"exercise_name": "Plank", "sets": 4, "reps": "30 seconds", "rest_seconds": 30, "notes": "Hold strong"}
     ]', 25, 3, 'cardio', ARRAY['intermediate', 'hiit', 'cardio', 'fat-loss'], NULL, true, true);

END $$;

-- Success message
SELECT 'Part 4 completed: Workout system created successfully!' as status,
       COUNT(*) as total_templates
FROM public.workout_templates;