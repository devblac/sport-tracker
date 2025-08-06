-- Seed data for testing the percentile calculation system
-- This creates sample users and performance data for development

-- Insert sample performance data for testing
-- Note: In production, this data would come from actual workouts

-- Sample user performance data (simulating 50 users across different demographics)
INSERT INTO user_performances (
  user_id, 
  exercise_id, 
  exercise_name, 
  weight, 
  reps, 
  estimated_one_rm, 
  body_weight, 
  workout_date, 
  user_age, 
  user_gender, 
  user_weight, 
  experience_level
) VALUES
-- Male users, 25 years old, different weights
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 80.0, 5, 93.3, 75.0, '2025-01-15', 25, 'male', 75.0, 'intermediate'),
('11111111-1111-1111-1111-111111111112', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 90.0, 5, 105.0, 80.0, '2025-01-16', 25, 'male', 80.0, 'intermediate'),
('11111111-1111-1111-1111-111111111113', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 100.0, 5, 116.7, 85.0, '2025-01-17', 25, 'male', 85.0, 'advanced'),
('11111111-1111-1111-1111-111111111114', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 70.0, 8, 88.7, 70.0, '2025-01-18', 25, 'male', 70.0, 'beginner'),
('11111111-1111-1111-1111-111111111115', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 110.0, 3, 121.0, 90.0, '2025-01-19', 25, 'male', 90.0, 'expert'),

-- Female users, 25 years old, different weights
('22222222-2222-2222-2222-222222222221', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 45.0, 5, 52.5, 60.0, '2025-01-15', 25, 'female', 60.0, 'intermediate'),
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 50.0, 5, 58.3, 65.0, '2025-01-16', 25, 'female', 65.0, 'intermediate'),
('22222222-2222-2222-2222-222222222223', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 55.0, 5, 64.2, 70.0, '2025-01-17', 25, 'female', 70.0, 'advanced'),
('22222222-2222-2222-2222-222222222224', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 40.0, 8, 50.7, 55.0, '2025-01-18', 25, 'female', 55.0, 'beginner'),
('22222222-2222-2222-2222-222222222225', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 60.0, 3, 66.0, 75.0, '2025-01-19', 25, 'female', 75.0, 'expert'),

-- Squat data for the same users
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 100.0, 5, 116.7, 75.0, '2025-01-15', 25, 'male', 75.0, 'intermediate'),
('11111111-1111-1111-1111-111111111112', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 120.0, 5, 140.0, 80.0, '2025-01-16', 25, 'male', 80.0, 'intermediate'),
('11111111-1111-1111-1111-111111111113', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 140.0, 5, 163.3, 85.0, '2025-01-17', 25, 'male', 85.0, 'advanced'),
('11111111-1111-1111-1111-111111111114', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 80.0, 8, 101.3, 70.0, '2025-01-18', 25, 'male', 70.0, 'beginner'),
('11111111-1111-1111-1111-111111111115', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 160.0, 3, 176.0, 90.0, '2025-01-19', 25, 'male', 90.0, 'expert'),

('22222222-2222-2222-2222-222222222221', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 60.0, 5, 70.0, 60.0, '2025-01-15', 25, 'female', 60.0, 'intermediate'),
('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 70.0, 5, 81.7, 65.0, '2025-01-16', 25, 'female', 65.0, 'intermediate'),
('22222222-2222-2222-2222-222222222223', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 80.0, 5, 93.3, 70.0, '2025-01-17', 25, 'female', 70.0, 'advanced'),
('22222222-2222-2222-2222-222222222224', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 50.0, 8, 63.3, 55.0, '2025-01-18', 25, 'female', 55.0, 'beginner'),
('22222222-2222-2222-2222-222222222225', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Squat', 90.0, 3, 99.0, 75.0, '2025-01-19', 25, 'female', 75.0, 'expert'),

-- Deadlift data
('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 120.0, 5, 140.0, 75.0, '2025-01-15', 25, 'male', 75.0, 'intermediate'),
('11111111-1111-1111-1111-111111111112', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 140.0, 5, 163.3, 80.0, '2025-01-16', 25, 'male', 80.0, 'intermediate'),
('11111111-1111-1111-1111-111111111113', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 160.0, 5, 186.7, 85.0, '2025-01-17', 25, 'male', 85.0, 'advanced'),
('11111111-1111-1111-1111-111111111114', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 100.0, 8, 126.7, 70.0, '2025-01-18', 25, 'male', 70.0, 'beginner'),
('11111111-1111-1111-1111-111111111115', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 180.0, 3, 198.0, 90.0, '2025-01-19', 25, 'male', 90.0, 'expert'),

('22222222-2222-2222-2222-222222222221', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 70.0, 5, 81.7, 60.0, '2025-01-15', 25, 'female', 60.0, 'intermediate'),
('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 80.0, 5, 93.3, 65.0, '2025-01-16', 25, 'female', 65.0, 'intermediate'),
('22222222-2222-2222-2222-222222222223', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 90.0, 5, 105.0, 70.0, '2025-01-17', 25, 'female', 70.0, 'advanced'),
('22222222-2222-2222-2222-222222222224', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 60.0, 8, 76.0, 55.0, '2025-01-18', 25, 'female', 55.0, 'beginner'),
('22222222-2222-2222-2222-222222222225', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deadlift', 100.0, 3, 110.0, 75.0, '2025-01-19', 25, 'female', 75.0, 'expert'),

-- Overhead Press data
('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 50.0, 5, 58.3, 75.0, '2025-01-15', 25, 'male', 75.0, 'intermediate'),
('11111111-1111-1111-1111-111111111112', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 60.0, 5, 70.0, 80.0, '2025-01-16', 25, 'male', 80.0, 'intermediate'),
('11111111-1111-1111-1111-111111111113', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 70.0, 5, 81.7, 85.0, '2025-01-17', 25, 'male', 85.0, 'advanced'),
('11111111-1111-1111-1111-111111111114', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 40.0, 8, 50.7, 70.0, '2025-01-18', 25, 'male', 70.0, 'beginner'),
('11111111-1111-1111-1111-111111111115', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 80.0, 3, 88.0, 90.0, '2025-01-19', 25, 'male', 90.0, 'expert'),

('22222222-2222-2222-2222-222222222221', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 25.0, 5, 29.2, 60.0, '2025-01-15', 25, 'female', 60.0, 'intermediate'),
('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 30.0, 5, 35.0, 65.0, '2025-01-16', 25, 'female', 65.0, 'intermediate'),
('22222222-2222-2222-2222-222222222223', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 35.0, 5, 40.8, 70.0, '2025-01-17', 25, 'female', 70.0, 'advanced'),
('22222222-2222-2222-2222-222222222224', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 20.0, 8, 25.3, 55.0, '2025-01-18', 25, 'female', 55.0, 'beginner'),
('22222222-2222-2222-2222-222222222225', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Overhead Press', 40.0, 3, 44.0, 75.0, '2025-01-19', 25, 'female', 75.0, 'expert');

-- Add some older users (30-35 age range) for demographic diversity
INSERT INTO user_performances (
  user_id, 
  exercise_id, 
  exercise_name, 
  weight, 
  reps, 
  estimated_one_rm, 
  body_weight, 
  workout_date, 
  user_age, 
  user_gender, 
  user_weight, 
  experience_level
) VALUES
-- Male users, 30-35 years old
('33333333-3333-3333-3333-333333333331', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 85.0, 5, 99.2, 80.0, '2025-01-20', 32, 'male', 80.0, 'advanced'),
('33333333-3333-3333-3333-333333333332', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 95.0, 5, 110.8, 85.0, '2025-01-21', 33, 'male', 85.0, 'expert'),
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 75.0, 6, 90.0, 75.0, '2025-01-22', 30, 'male', 75.0, 'intermediate'),

-- Female users, 30-35 years old
('44444444-4444-4444-4444-444444444441', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 48.0, 5, 56.0, 62.0, '2025-01-20', 32, 'female', 62.0, 'advanced'),
('44444444-4444-4444-4444-444444444442', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 52.0, 5, 60.7, 67.0, '2025-01-21', 33, 'female', 67.0, 'expert'),
('44444444-4444-4444-4444-444444444443', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bench Press', 42.0, 6, 50.4, 58.0, '2025-01-22', 30, 'female', 58.0, 'intermediate');

-- Create a test job record
INSERT INTO percentile_jobs (job_type, status, started_at, completed_at, processed_users, total_users)
VALUES ('daily_full', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 40, 40);

-- Note: The actual percentile calculations will be done by the Edge Function
-- This seed data provides a foundation for testing the system