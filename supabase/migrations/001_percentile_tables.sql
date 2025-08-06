-- Percentile calculation tables for Supabase
-- This migration creates the backend tables for efficient percentile calculations

-- User performance data (raw workout data)
CREATE TABLE user_performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL(6,2) NOT NULL,
  reps INTEGER NOT NULL,
  estimated_one_rm DECIMAL(6,2) NOT NULL,
  body_weight DECIMAL(5,2) NOT NULL,
  workout_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User demographics (denormalized for performance)
  user_age INTEGER NOT NULL,
  user_gender TEXT NOT NULL CHECK (user_gender IN ('male', 'female', 'other')),
  user_weight DECIMAL(5,2) NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
);

-- Demographic segments for percentile calculations
CREATE TABLE percentile_segments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  age_min INTEGER NOT NULL,
  age_max INTEGER NOT NULL,
  gender TEXT NOT NULL,
  weight_min DECIMAL(5,2) NOT NULL,
  weight_max DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-calculated percentiles (updated daily)
CREATE TABLE user_percentiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  segment_id INTEGER NOT NULL REFERENCES percentile_segments(id),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('weight', 'oneRM', 'volume', 'relative_strength')),
  percentile_value DECIMAL(5,2) NOT NULL,
  rank_position INTEGER NOT NULL,
  total_users INTEGER NOT NULL,
  user_value DECIMAL(8,2) NOT NULL,
  is_personal_best BOOLEAN DEFAULT FALSE,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, exercise_id, segment_id, metric_type)
);

-- Exercise statistics (cached daily)
CREATE TABLE exercise_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL,
  segment_id INTEGER NOT NULL REFERENCES percentile_segments(id),
  metric_type TEXT NOT NULL,
  total_users INTEGER NOT NULL,
  average_value DECIMAL(8,2) NOT NULL,
  median_value DECIMAL(8,2) NOT NULL,
  top_performance DECIMAL(8,2) NOT NULL,
  percentile_95 DECIMAL(8,2) NOT NULL,
  percentile_75 DECIMAL(8,2) NOT NULL,
  percentile_50 DECIMAL(8,2) NOT NULL,
  percentile_25 DECIMAL(8,2) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(exercise_id, segment_id, metric_type)
);

-- Percentile calculation jobs (for tracking batch processing)
CREATE TABLE percentile_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('daily_full', 'incremental', 'user_specific')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  processed_users INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_performances_user_exercise ON user_performances(user_id, exercise_id);
CREATE INDEX idx_user_performances_exercise_date ON user_performances(exercise_id, workout_date DESC);
CREATE INDEX idx_user_performances_demographics ON user_performances(user_age, user_gender, user_weight);

CREATE INDEX idx_user_percentiles_user_exercise ON user_percentiles(user_id, exercise_id);
CREATE INDEX idx_user_percentiles_segment_metric ON user_percentiles(segment_id, metric_type, percentile_value DESC);
CREATE INDEX idx_user_percentiles_calculated_at ON user_percentiles(calculated_at DESC);

CREATE INDEX idx_exercise_statistics_exercise_segment ON exercise_statistics(exercise_id, segment_id);
CREATE INDEX idx_exercise_statistics_calculated_at ON exercise_statistics(calculated_at DESC);

-- Insert default demographic segments
INSERT INTO percentile_segments (name, description, age_min, age_max, gender, weight_min, weight_max) VALUES
-- Male segments
('men_18_25_light', 'Men 18-25, 60-75kg', 18, 25, 'male', 60, 75),
('men_18_25_medium', 'Men 18-25, 75-90kg', 18, 25, 'male', 75, 90),
('men_18_25_heavy', 'Men 18-25, 90-120kg', 18, 25, 'male', 90, 120),
('men_26_35_light', 'Men 26-35, 60-75kg', 26, 35, 'male', 60, 75),
('men_26_35_medium', 'Men 26-35, 75-90kg', 26, 35, 'male', 75, 90),
('men_26_35_heavy', 'Men 26-35, 90-120kg', 26, 35, 'male', 90, 120),
('men_36_50_light', 'Men 36-50, 60-75kg', 36, 50, 'male', 60, 75),
('men_36_50_medium', 'Men 36-50, 75-90kg', 36, 50, 'male', 75, 90),
('men_36_50_heavy', 'Men 36-50, 90-120kg', 36, 50, 'male', 90, 120),

-- Female segments
('women_18_25_light', 'Women 18-25, 45-60kg', 18, 25, 'female', 45, 60),
('women_18_25_medium', 'Women 18-25, 60-75kg', 18, 25, 'female', 60, 75),
('women_18_25_heavy', 'Women 18-25, 75-90kg', 18, 25, 'female', 75, 90),
('women_26_35_light', 'Women 26-35, 45-60kg', 26, 35, 'female', 45, 60),
('women_26_35_medium', 'Women 26-35, 60-75kg', 26, 35, 'female', 60, 75),
('women_26_35_heavy', 'Women 26-35, 75-90kg', 26, 35, 'female', 75, 90),
('women_36_50_light', 'Women 36-50, 45-60kg', 36, 50, 'female', 45, 60),
('women_36_50_medium', 'Women 36-50, 60-75kg', 36, 50, 'female', 60, 75),
('women_36_50_heavy', 'Women 36-50, 75-90kg', 36, 50, 'female', 75, 90),

-- General fallback segments
('all_men', 'All Men', 18, 100, 'male', 40, 200),
('all_women', 'All Women', 18, 100, 'female', 30, 150),
('all_users', 'All Users', 18, 100, 'other', 30, 200);

-- Enable Row Level Security
ALTER TABLE user_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_percentiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE percentile_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own performance data
CREATE POLICY "Users can view own performances" ON user_performances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performances" ON user_performances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can see their own percentiles
CREATE POLICY "Users can view own percentiles" ON user_percentiles
  FOR SELECT USING (auth.uid() = user_id);

-- Everyone can read exercise statistics (aggregated data)
CREATE POLICY "Anyone can view exercise statistics" ON exercise_statistics
  FOR SELECT USING (true);

-- Everyone can read segments
CREATE POLICY "Anyone can view segments" ON percentile_segments
  FOR SELECT USING (true);

-- Only service role can manage jobs
CREATE POLICY "Service role can manage jobs" ON percentile_jobs
  FOR ALL USING (auth.role() = 'service_role');