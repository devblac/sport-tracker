-- Migration: Create personal_records table for tracking user PRs
-- Date: 2025-11-20
-- Description: Adds personal_records table with RLS policies for tracking user personal records

-- Create personal_records table
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  reps INTEGER NOT NULL,
  estimated_1rm DECIMAL(10,2) NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  achieved_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_pr_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_pr_achieved_at ON personal_records(achieved_at DESC);

-- Enable Row Level Security
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own PRs
CREATE POLICY "Users can view own PRs"
  ON personal_records FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own PRs
CREATE POLICY "Users can insert own PRs"
  ON personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);
