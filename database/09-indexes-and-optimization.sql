-- ============================================================================
-- PART 9: INDEXES AND OPTIMIZATION
-- ============================================================================
-- Execute this after Part 8 to create performance indexes
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON public.user_profiles(current_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username_lower ON public.user_profiles (LOWER(username));

-- Exercises indexes
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category_id);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON public.exercises(equipment_id);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON public.exercises(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON public.exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_name_es ON public.exercises(name_es);
CREATE INDEX IF NOT EXISTS idx_exercises_search ON public.exercises USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Workout sessions indexes
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_template ON public.workout_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON public.workout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed ON public.workout_sessions (user_id, completed_at) WHERE status = 'completed';

-- Exercise performances indexes
CREATE INDEX IF NOT EXISTS idx_exercise_performances_user_exercise ON public.exercise_performances(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_performances_date ON public.exercise_performances(performed_at);

-- Social features indexes
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_lookup ON public.friendships (requester_id, addressee_id, status);

-- Social posts indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_user_date ON public.social_posts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON public.social_posts(type);
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility ON public.social_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_social_posts_feed ON public.social_posts (visibility, created_at DESC) WHERE visibility IN ('public', 'friends');

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_date ON public.comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON public.comments(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_comments_thread ON public.comments (post_id, parent_comment_id, created_at) WHERE is_deleted = false;

-- XP and achievements indexes
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_date ON public.xp_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.user_achievements(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_progress ON public.user_achievements (user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_achievements_category_rarity ON public.achievements (category, rarity) WHERE is_active = true;

-- Streaks indexes
CREATE INDEX IF NOT EXISTS idx_streak_history_user_date ON public.streak_history(user_id, event_date);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON public.user_analytics(date);

-- Success message
SELECT 'Part 9 completed: Performance indexes created successfully!' as status;