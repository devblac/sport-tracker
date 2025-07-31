-- ============================================================================
-- TEST DATA: SOCIAL POSTS FOR COMMENTS TESTING
-- ============================================================================
-- Run this after the main database setup to create test posts for comments
-- ============================================================================

-- Note: For testing purposes, we'll create posts using existing authenticated user IDs
-- You'll need to replace these UUIDs with actual user IDs from your auth.users table
-- To get your user ID, you can run: SELECT id FROM auth.users LIMIT 3;

-- First, let's check if we have any existing users to use for test posts
DO $$
DECLARE
    user_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found in auth.users. Please sign up through your app first to create test users.';
        RAISE NOTICE 'Then replace the user_id values in this script with real user IDs.';
    ELSE
        -- Get the first user ID for reference
        SELECT id INTO first_user_id FROM auth.users LIMIT 1;
        RAISE NOTICE 'Found % users. First user ID: %', user_count, first_user_id;
        RAISE NOTICE 'You can use this ID in the INSERT statements below.';
    END IF;
END $$;

-- INSTRUCTIONS: Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
-- To get your user ID, run: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Insert test social posts (these will be the posts we comment on)
-- NOTE: Replace 'YOUR_USER_ID_HERE' with a real user ID before running!
INSERT INTO public.social_posts (id, user_id, type, content, data, visibility, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'YOUR_USER_ID_HERE', 'personal_record', 
 'Nuevo PR en Deadlift! 💪 Acabo de lograr un nuevo récord personal en peso muerto: 180kg! Después de meses de entrenamiento constante, finalmente pude superar mi marca anterior. ¡La consistencia realmente paga!',
 '{"exercise": "deadlift", "weight": 180, "previous_pr": 170, "improvement": 10}',
 'public', NOW() - INTERVAL '2 hours'),

('22222222-2222-2222-2222-222222222222', 'YOUR_USER_ID_HERE', 'workout_completed',
 'Rutina de Piernas Intensa 🔥 Hoy fue día de piernas y no pude caminar después del gym 😅. Sentadillas, peso muerto rumano, extensiones y curl de piernas. ¿Cuál es su ejercicio favorito para piernas?',
 '{"workout_type": "legs", "exercises": ["squat", "romanian_deadlift", "leg_extension", "leg_curl"], "duration": 75}',
 'public', NOW() - INTERVAL '4 hours'),

('33333333-3333-3333-3333-333333333333', 'YOUR_USER_ID_HERE', 'custom',
 'Consejos para Principiantes: Para todos los que están empezando en el gym: la forma es más importante que el peso. Mejor hacer menos peso con buena técnica que mucho peso con mala forma. ¡Su cuerpo se los agradecerá!',
 '{"post_type": "advice", "target_audience": "beginners"}',
 'public', NOW() - INTERVAL '6 hours')

ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- Success message
SELECT 'Test social posts created successfully!' as status,
       COUNT(*) as total_posts
FROM public.social_posts
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');