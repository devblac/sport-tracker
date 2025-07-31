-- ============================================================================
-- PART 8: SECURITY POLICIES (RLS)
-- ============================================================================
-- Execute this after Part 7 to enable Row Level Security
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

-- Success message
SELECT 'Part 8 completed: Security policies (RLS) enabled successfully!' as status;