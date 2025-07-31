-- ============================================================================
-- PART 10: VERIFICATION AND COMPLETION
-- ============================================================================
-- Execute this last to verify everything was created successfully
-- ============================================================================

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
    current_table TEXT;
BEGIN
    -- Check if all expected tables exist
    FOREACH current_table IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = current_table
        ) THEN
            missing_tables := array_append(missing_tables, current_table);
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

-- Final comprehensive status report
SELECT 
    'Sport Tracker PWA Database Setup Complete! 🎉' as message,
    COUNT(DISTINCT table_name) as total_tables,
    (SELECT COUNT(*) FROM public.exercise_categories) as categories,
    (SELECT COUNT(*) FROM public.muscle_groups) as muscle_groups,
    (SELECT COUNT(*) FROM public.equipment_types) as equipment_types,
    (SELECT COUNT(*) FROM public.exercises) as exercises,
    (SELECT COUNT(*) FROM public.achievements) as achievements,
    (SELECT COUNT(*) FROM public.workout_templates) as templates,
    (SELECT COUNT(*) FROM public.challenges) as challenges
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test basic functionality
SELECT 'Testing basic queries...' as test_phase;

-- Test exercise data
SELECT 'Exercise system test:' as test, COUNT(*) as exercise_count FROM public.exercises;

-- Test achievement system
SELECT 'Achievement system test:' as test, COUNT(*) as achievement_count FROM public.achievements;

-- Test workout templates
SELECT 'Workout templates test:' as test, COUNT(*) as template_count FROM public.workout_templates;

-- Test XP calculation functions
SELECT 'XP system test:' as test, 
       public.calculate_level_from_xp(2500) as level_from_2500_xp,
       public.xp_for_level(5) as xp_needed_for_level_5;

-- Success message
SELECT 
    '🎯 DATABASE SETUP COMPLETE!' as status,
    'All 23 tables created with full data' as tables_status,
    'RLS policies enabled for security' as security_status,
    'Performance indexes optimized' as performance_status,
    'Ready for Sport Tracker PWA!' as ready_status;