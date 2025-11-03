-- Workout Templates Table
-- Stores user-created workout templates

CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  notes TEXT CHECK (char_length(notes) <= 500),
  is_template BOOLEAN NOT NULL DEFAULT true,
  category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'hybrid')),
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  estimated_duration INTEGER CHECK (estimated_duration > 0 AND estimated_duration <= 600), -- minutes
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT workout_templates_exercises_check CHECK (jsonb_typeof(exercises) = 'array')
);

-- Create indexes
CREATE INDEX idx_workout_templates_user_id ON workout_templates(user_id);
CREATE INDEX idx_workout_templates_category ON workout_templates(category);
CREATE INDEX idx_workout_templates_difficulty ON workout_templates(difficulty);
CREATE INDEX idx_workout_templates_created_at ON workout_templates(created_at DESC);

-- Enable Row Level Security
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own templates
CREATE POLICY "Users can view own templates"
  ON workout_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own templates
CREATE POLICY "Users can create own templates"
  ON workout_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON workout_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON workout_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workout_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_template_updated_at();

-- Comments
COMMENT ON TABLE workout_templates IS 'User-created workout templates';
COMMENT ON COLUMN workout_templates.exercises IS 'Array of exercise objects with id, exercise_id, name, sets, reps, weight, notes';
COMMENT ON COLUMN workout_templates.estimated_duration IS 'Estimated workout duration in minutes';
