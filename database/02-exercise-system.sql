-- ============================================================================
-- PART 2: EXERCISE SYSTEM
-- ============================================================================
-- Execute this after Part 1 to create the exercise database
-- ============================================================================

-- Exercise categories
CREATE TABLE public.exercise_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Muscle groups
CREATE TABLE public.muscle_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    description TEXT,
    body_part VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment types
CREATE TABLE public.equipment_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises
CREATE TABLE public.exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_es VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    instructions_es TEXT,
    
    -- Media
    gif_url TEXT,
    image_urls TEXT[], -- Array of image URLs
    video_url TEXT,
    
    -- Classification
    category_id UUID REFERENCES public.exercise_categories(id),
    primary_muscle_groups UUID[] DEFAULT '{}', -- Array of muscle group IDs
    secondary_muscle_groups UUID[] DEFAULT '{}',
    equipment_id UUID REFERENCES public.equipment_types(id),
    
    -- Difficulty and metrics
    difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
    force_type VARCHAR(20), -- push, pull, static
    mechanics VARCHAR(20), -- compound, isolation
    
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_difficulty CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    CONSTRAINT valid_force_type CHECK (force_type IN ('push', 'pull', 'static', 'other')),
    CONSTRAINT valid_mechanics CHECK (mechanics IN ('compound', 'isolation'))
);

-- Insert exercise categories
INSERT INTO public.exercise_categories (name, name_es, description, icon, color) VALUES
('Strength Training', 'Entrenamiento de Fuerza', 'Exercises focused on building muscle strength and mass', 'dumbbell', '#FF6B6B'),
('Cardio', 'Cardio', 'Cardiovascular exercises for heart health and endurance', 'heart', '#4ECDC4'),
('Flexibility', 'Flexibilidad', 'Stretching and mobility exercises', 'stretch', '#45B7D1'),
('Functional', 'Funcional', 'Functional movement patterns for daily activities', 'activity', '#96CEB4'),
('Sports', 'Deportes', 'Sport-specific training exercises', 'trophy', '#FFEAA7'),
('Rehabilitation', 'Rehabilitación', 'Recovery and injury prevention exercises', 'shield', '#DDA0DD'),
('Powerlifting', 'Powerlifting', 'Competition powerlifting movements', 'weight', '#8B5CF6'),
('Olympic Lifting', 'Halterofilia', 'Olympic weightlifting movements', 'medal', '#F59E0B'),
('Calisthenics', 'Calistenia', 'Bodyweight strength training', 'body', '#10B981'),
('CrossFit', 'CrossFit', 'High-intensity functional fitness', 'crossfit', '#EF4444');

-- Insert muscle groups
INSERT INTO public.muscle_groups (name, name_es, description, body_part) VALUES
('Chest', 'Pecho', 'Pectoral muscles', 'upper_body'),
('Back', 'Espalda', 'Latissimus dorsi, rhomboids, trapezius', 'upper_body'),
('Shoulders', 'Hombros', 'Deltoid muscles', 'upper_body'),
('Biceps', 'Bíceps', 'Front arm muscles', 'upper_body'),
('Triceps', 'Tríceps', 'Back arm muscles', 'upper_body'),
('Forearms', 'Antebrazos', 'Lower arm muscles', 'upper_body'),
('Core', 'Core', 'Abdominal and core muscles', 'core'),
('Abs', 'Abdominales', 'Abdominal muscles', 'core'),
('Obliques', 'Oblicuos', 'Side abdominal muscles', 'core'),
('Lower Back', 'Espalda Baja', 'Lumbar region muscles', 'core'),
('Quadriceps', 'Cuádriceps', 'Front thigh muscles', 'lower_body'),
('Hamstrings', 'Isquiotibiales', 'Back thigh muscles', 'lower_body'),
('Glutes', 'Glúteos', 'Gluteal muscles', 'lower_body'),
('Calves', 'Pantorrillas', 'Lower leg muscles', 'lower_body'),
('Hip Flexors', 'Flexores de Cadera', 'Hip flexor muscles', 'lower_body'),
('Adductors', 'Aductores', 'Inner thigh muscles', 'lower_body');

-- Insert equipment types
INSERT INTO public.equipment_types (name, name_es, description, icon) VALUES
('Barbell', 'Barra', 'Olympic barbell for heavy lifting', 'barbell'),
('Dumbbell', 'Mancuernas', 'Free weights for unilateral training', 'dumbbell'),
('Machine', 'Máquina', 'Weight machines and cable systems', 'machine'),
('Bodyweight', 'Peso Corporal', 'No equipment needed', 'body'),
('Resistance Band', 'Banda Elástica', 'Elastic resistance bands', 'band'),
('Kettlebell', 'Kettlebell', 'Cast iron weights with handles', 'kettlebell'),
('Cable', 'Polea', 'Cable machine exercises', 'cable'),
('Smith Machine', 'Máquina Smith', 'Guided barbell machine', 'smith'),
('Pull-up Bar', 'Barra de Dominadas', 'Bar for pull-ups and chin-ups', 'pullup'),
('Bench', 'Banco', 'Weight bench for various exercises', 'bench'),
('Squat Rack', 'Rack de Sentadillas', 'Safety rack for squats', 'rack'),
('Medicine Ball', 'Pelota Medicinal', 'Weighted ball for functional training', 'medicine-ball'),
('Battle Ropes', 'Cuerdas de Batalla', 'Heavy ropes for cardio and strength', 'rope'),
('TRX', 'TRX', 'Suspension trainer system', 'trx'),
('Foam Roller', 'Rodillo de Espuma', 'Recovery and mobility tool', 'foam-roller');

-- Success message
SELECT 'Part 2 completed: Exercise system tables and initial data created successfully!' as status;