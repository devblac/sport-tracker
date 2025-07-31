-- ============================================================================
-- PART 6: SOCIAL SYSTEM
-- ============================================================================
-- Execute this after Part 5 to create social features and comments
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
    CONSTRAINT valid_post_visibility CHECK (visibility IN ('public', 'friends', 'private'))
);

-- Post likes
CREATE TABLE public.post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_id, user_id)
);

-- Advanced Comments System
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
    CONSTRAINT no_self_parent CHECK (id != parent_comment_id)
);

-- Comment likes
CREATE TABLE public.comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(comment_id, user_id)
);

-- Challenges system
CREATE TABLE public.challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
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

-- Notifications system
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
    
    UNIQUE(user_id, date)
);

-- Insert sample challenges
INSERT INTO public.challenges (id, created_by, title, description, type, requirements, rewards, start_date, end_date, status) VALUES
('00000000-0000-0000-0000-000000000001', NULL, 'Desafío de Año Nuevo', 'Completa 30 entrenamientos en enero', 'community', 
 '{"workouts_required": 30, "time_limit_days": 31}', 
 '{"xp_bonus": 1000, "badge": "new_year_warrior", "title": "Guerrero de Año Nuevo"}', 
 '2024-01-01 00:00:00+00', '2024-01-31 23:59:59+00', 'upcoming'),

('00000000-0000-0000-0000-000000000002', NULL, 'Desafío de Fuerza', 'Aumenta tu 1RM en cualquier ejercicio principal', 'individual', 
 '{"pr_improvement": true, "exercises": ["squat", "bench_press", "deadlift"]}', 
 '{"xp_bonus": 500, "badge": "strength_warrior"}', 
 '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 'active'),

('00000000-0000-0000-0000-000000000003', NULL, 'Desafío Social', 'Haz 10 nuevos amigos del gym', 'community', 
 '{"friends_to_add": 10}', 
 '{"xp_bonus": 750, "badge": "social_butterfly", "title": "Mariposa Social"}', 
 '2024-01-01 00:00:00+00', '2024-06-30 23:59:59+00', 'active');

-- Success message
SELECT 'Part 6 completed: Social system created successfully!' as status,
       COUNT(*) as total_challenges
FROM public.challenges;