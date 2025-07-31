-- ============================================================================
-- PART 7: FUNCTIONS AND TRIGGERS
-- ============================================================================
-- Execute this after Part 6 to create automated functions and triggers
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

-- Success message
SELECT 'Part 7 completed: Functions and triggers created successfully!' as status;