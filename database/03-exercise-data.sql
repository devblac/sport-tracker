-- ============================================================================
-- PART 3: EXERCISE DATA
-- ============================================================================
-- Execute this after Part 2 to populate the exercise database
-- ============================================================================

-- Insert comprehensive exercise database
DO $$
DECLARE
    strength_cat_id UUID;
    cardio_cat_id UUID;
    flexibility_cat_id UUID;
    functional_cat_id UUID;
    powerlifting_cat_id UUID;
    olympic_cat_id UUID;
    calisthenics_cat_id UUID;
    
    barbell_eq_id UUID;
    dumbbell_eq_id UUID;
    machine_eq_id UUID;
    bodyweight_eq_id UUID;
    kettlebell_eq_id UUID;
    cable_eq_id UUID;
    pullup_eq_id UUID;
    bench_eq_id UUID;
    
    chest_mg_id UUID;
    back_mg_id UUID;
    shoulders_mg_id UUID;
    biceps_mg_id UUID;
    triceps_mg_id UUID;
    core_mg_id UUID;
    quads_mg_id UUID;
    hamstrings_mg_id UUID;
    glutes_mg_id UUID;
    calves_mg_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO strength_cat_id FROM public.exercise_categories WHERE name = 'Strength Training';
    SELECT id INTO cardio_cat_id FROM public.exercise_categories WHERE name = 'Cardio';
    SELECT id INTO flexibility_cat_id FROM public.exercise_categories WHERE name = 'Flexibility';
    SELECT id INTO functional_cat_id FROM public.exercise_categories WHERE name = 'Functional';
    SELECT id INTO powerlifting_cat_id FROM public.exercise_categories WHERE name = 'Powerlifting';
    SELECT id INTO olympic_cat_id FROM public.exercise_categories WHERE name = 'Olympic Lifting';
    SELECT id INTO calisthenics_cat_id FROM public.exercise_categories WHERE name = 'Calisthenics';
    
    -- Get equipment IDs
    SELECT id INTO barbell_eq_id FROM public.equipment_types WHERE name = 'Barbell';
    SELECT id INTO dumbbell_eq_id FROM public.equipment_types WHERE name = 'Dumbbell';
    SELECT id INTO machine_eq_id FROM public.equipment_types WHERE name = 'Machine';
    SELECT id INTO bodyweight_eq_id FROM public.equipment_types WHERE name = 'Bodyweight';
    SELECT id INTO kettlebell_eq_id FROM public.equipment_types WHERE name = 'Kettlebell';
    SELECT id INTO cable_eq_id FROM public.equipment_types WHERE name = 'Cable';
    SELECT id INTO pullup_eq_id FROM public.equipment_types WHERE name = 'Pull-up Bar';
    SELECT id INTO bench_eq_id FROM public.equipment_types WHERE name = 'Bench';
    
    -- Get muscle group IDs
    SELECT id INTO chest_mg_id FROM public.muscle_groups WHERE name = 'Chest';
    SELECT id INTO back_mg_id FROM public.muscle_groups WHERE name = 'Back';
    SELECT id INTO shoulders_mg_id FROM public.muscle_groups WHERE name = 'Shoulders';
    SELECT id INTO biceps_mg_id FROM public.muscle_groups WHERE name = 'Biceps';
    SELECT id INTO triceps_mg_id FROM public.muscle_groups WHERE name = 'Triceps';
    SELECT id INTO core_mg_id FROM public.muscle_groups WHERE name = 'Core';
    SELECT id INTO quads_mg_id FROM public.muscle_groups WHERE name = 'Quadriceps';
    SELECT id INTO hamstrings_mg_id FROM public.muscle_groups WHERE name = 'Hamstrings';
    SELECT id INTO glutes_mg_id FROM public.muscle_groups WHERE name = 'Glutes';
    SELECT id INTO calves_mg_id FROM public.muscle_groups WHERE name = 'Calves';

    -- Insert comprehensive exercise database
    INSERT INTO public.exercises (name, name_es, description, instructions, instructions_es, category_id, primary_muscle_groups, secondary_muscle_groups, equipment_id, difficulty_level, force_type, mechanics, is_verified) VALUES
    
    -- CHEST EXERCISES
    ('Bench Press', 'Press de Banca', 'Classic chest building exercise', 'Lie on bench, grip bar shoulder-width apart, lower to chest, press up', 'Acuéstate en el banco, agarra la barra al ancho de hombros, baja al pecho, empuja hacia arriba', strength_cat_id, ARRAY[chest_mg_id], ARRAY[shoulders_mg_id, triceps_mg_id], barbell_eq_id, 3, 'push', 'compound', true),
    ('Incline Bench Press', 'Press Inclinado', 'Upper chest focused bench press', 'Set bench to 30-45 degrees, perform bench press motion', 'Ajusta el banco a 30-45 grados, realiza el movimiento de press de banca', strength_cat_id, ARRAY[chest_mg_id], ARRAY[shoulders_mg_id, triceps_mg_id], barbell_eq_id, 3, 'push', 'compound', true),
    ('Dumbbell Bench Press', 'Press con Mancuernas', 'Unilateral chest development', 'Use dumbbells instead of barbell for greater range of motion', 'Usa mancuernas en lugar de barra para mayor rango de movimiento', strength_cat_id, ARRAY[chest_mg_id], ARRAY[shoulders_mg_id, triceps_mg_id], dumbbell_eq_id, 2, 'push', 'compound', true),
    ('Push-ups', 'Flexiones', 'Bodyweight chest exercise', 'Start in plank position, lower chest to ground, push back up', 'Comienza en posición de plancha, baja el pecho al suelo, empuja hacia arriba', calisthenics_cat_id, ARRAY[chest_mg_id], ARRAY[shoulders_mg_id, triceps_mg_id, core_mg_id], bodyweight_eq_id, 1, 'push', 'compound', true),
    ('Dips', 'Fondos', 'Bodyweight triceps and chest exercise', 'Support body on parallel bars, lower and raise body', 'Apóyate en barras paralelas, baja y sube el cuerpo', calisthenics_cat_id, ARRAY[chest_mg_id, triceps_mg_id], ARRAY[shoulders_mg_id], bodyweight_eq_id, 3, 'push', 'compound', true),
    
    -- BACK EXERCISES
    ('Deadlift', 'Peso Muerto', 'King of all exercises', 'Stand with feet hip-width, grip bar, lift by extending hips and knees', 'Párate con pies al ancho de caderas, agarra la barra, levanta extendiendo caderas y rodillas', powerlifting_cat_id, ARRAY[back_mg_id, glutes_mg_id, hamstrings_mg_id], ARRAY[quads_mg_id, core_mg_id], barbell_eq_id, 4, 'pull', 'compound', true),
    ('Pull-ups', 'Dominadas', 'Upper body pulling exercise', 'Hang from bar, pull body up until chin over bar', 'Cuélgate de la barra, tira del cuerpo hasta que la barbilla pase la barra', calisthenics_cat_id, ARRAY[back_mg_id], ARRAY[biceps_mg_id, shoulders_mg_id], pullup_eq_id, 4, 'pull', 'compound', true),
    ('Bent-over Row', 'Remo Inclinado', 'Horizontal pulling movement', 'Bend at hips, pull bar to lower chest', 'Inclínate en las caderas, tira la barra hacia el pecho inferior', strength_cat_id, ARRAY[back_mg_id], ARRAY[biceps_mg_id, shoulders_mg_id], barbell_eq_id, 3, 'pull', 'compound', true),
    ('Lat Pulldown', 'Jalón al Pecho', 'Vertical pulling machine exercise', 'Sit at machine, pull bar down to upper chest', 'Siéntate en la máquina, tira la barra hacia el pecho superior', strength_cat_id, ARRAY[back_mg_id], ARRAY[biceps_mg_id, shoulders_mg_id], machine_eq_id, 2, 'pull', 'compound', true),
    ('T-Bar Row', 'Remo en T', 'Thick grip rowing movement', 'Straddle T-bar, pull handle to chest', 'Ponte a horcajadas sobre la barra en T, tira del mango al pecho', strength_cat_id, ARRAY[back_mg_id], ARRAY[biceps_mg_id, shoulders_mg_id], barbell_eq_id, 3, 'pull', 'compound', true),
    
    -- LEG EXERCISES
    ('Squat', 'Sentadilla', 'King of leg exercises', 'Stand with bar on shoulders, squat down and up', 'Párate con la barra en los hombros, baja en sentadilla y sube', powerlifting_cat_id, ARRAY[quads_mg_id, glutes_mg_id], ARRAY[hamstrings_mg_id, core_mg_id], barbell_eq_id, 4, 'push', 'compound', true),
    ('Front Squat', 'Sentadilla Frontal', 'Quad-focused squat variation', 'Hold bar in front rack position, perform squat', 'Sostén la barra en posición frontal, realiza la sentadilla', olympic_cat_id, ARRAY[quads_mg_id], ARRAY[glutes_mg_id, core_mg_id], barbell_eq_id, 4, 'push', 'compound', true),
    ('Romanian Deadlift', 'Peso Muerto Rumano', 'Hip hinge movement', 'Keep legs straight, hinge at hips, lower bar', 'Mantén las piernas rectas, gira en las caderas, baja la barra', strength_cat_id, ARRAY[hamstrings_mg_id, glutes_mg_id], ARRAY[back_mg_id, core_mg_id], barbell_eq_id, 3, 'pull', 'compound', true),
    ('Lunges', 'Zancadas', 'Unilateral leg exercise', 'Step forward into lunge position, return to start', 'Da un paso adelante en posición de zancada, regresa al inicio', functional_cat_id, ARRAY[quads_mg_id, glutes_mg_id], ARRAY[hamstrings_mg_id, core_mg_id], bodyweight_eq_id, 2, 'push', 'compound', true),
    ('Leg Press', 'Prensa de Piernas', 'Machine-based leg exercise', 'Sit in machine, press weight with legs', 'Siéntate en la máquina, empuja el peso con las piernas', strength_cat_id, ARRAY[quads_mg_id, glutes_mg_id], ARRAY[hamstrings_mg_id], machine_eq_id, 2, 'push', 'compound', true),
    
    -- SHOULDER EXERCISES
    ('Overhead Press', 'Press Militar', 'Vertical pressing movement', 'Press bar from shoulders to overhead', 'Empuja la barra desde los hombros hacia arriba', strength_cat_id, ARRAY[shoulders_mg_id], ARRAY[triceps_mg_id, core_mg_id], barbell_eq_id, 3, 'push', 'compound', true),
    ('Lateral Raises', 'Elevaciones Laterales', 'Side deltoid isolation', 'Raise dumbbells to sides until parallel to floor', 'Levanta las mancuernas a los lados hasta quedar paralelas al suelo', strength_cat_id, ARRAY[shoulders_mg_id], ARRAY[]::UUID[], dumbbell_eq_id, 2, 'pull', 'isolation', true),
    ('Face Pulls', 'Jalones Faciales', 'Rear deltoid and upper back', 'Pull rope to face level, separate handles', 'Tira la cuerda al nivel de la cara, separa las manijas', strength_cat_id, ARRAY[shoulders_mg_id], ARRAY[back_mg_id], cable_eq_id, 2, 'pull', 'isolation', true),
    
    -- ARM EXERCISES
    ('Bicep Curls', 'Curl de Bíceps', 'Bicep isolation exercise', 'Curl dumbbells up, squeeze biceps', 'Curva las mancuernas hacia arriba, aprieta los bíceps', strength_cat_id, ARRAY[biceps_mg_id], ARRAY[]::UUID[], dumbbell_eq_id, 1, 'pull', 'isolation', true),
    ('Tricep Dips', 'Fondos de Tríceps', 'Tricep bodyweight exercise', 'Lower and raise body using triceps', 'Baja y sube el cuerpo usando los tríceps', calisthenics_cat_id, ARRAY[triceps_mg_id], ARRAY[shoulders_mg_id], bodyweight_eq_id, 2, 'push', 'compound', true),
    ('Close-Grip Bench Press', 'Press Cerrado', 'Tricep-focused bench press', 'Bench press with narrow grip', 'Press de banca con agarre estrecho', strength_cat_id, ARRAY[triceps_mg_id], ARRAY[chest_mg_id, shoulders_mg_id], barbell_eq_id, 3, 'push', 'compound', true),
    
    -- CORE EXERCISES
    ('Plank', 'Plancha', 'Core stability exercise', 'Hold body in straight line on forearms', 'Mantén el cuerpo en línea recta sobre los antebrazos', functional_cat_id, ARRAY[core_mg_id], ARRAY[]::UUID[], bodyweight_eq_id, 1, 'static', 'isolation', true),
    ('Russian Twists', 'Giros Rusos', 'Oblique strengthening', 'Sit with knees bent, rotate torso side to side', 'Siéntate con rodillas dobladas, rota el torso de lado a lado', functional_cat_id, ARRAY[core_mg_id], ARRAY[]::UUID[], bodyweight_eq_id, 2, 'pull', 'isolation', true),
    ('Dead Bug', 'Bicho Muerto', 'Core stability and coordination', 'Lie on back, extend opposite arm and leg', 'Acuéstate boca arriba, extiende brazo y pierna opuestos', functional_cat_id, ARRAY[core_mg_id], ARRAY[]::UUID[], bodyweight_eq_id, 2, 'static', 'isolation', true),
    
    -- CARDIO EXERCISES
    ('Running', 'Correr', 'Cardiovascular endurance', 'Maintain steady pace for distance or time', 'Mantén un ritmo constante por distancia o tiempo', cardio_cat_id, ARRAY[]::UUID[], ARRAY[]::UUID[], bodyweight_eq_id, 2, 'other', 'compound', true),
    ('Burpees', 'Burpees', 'Full body cardio exercise', 'Squat, jump back to plank, push-up, jump up', 'Sentadilla, salta atrás a plancha, flexión, salta arriba', functional_cat_id, ARRAY[core_mg_id], ARRAY[chest_mg_id, shoulders_mg_id, quads_mg_id], bodyweight_eq_id, 3, 'other', 'compound', true),
    ('Mountain Climbers', 'Escaladores', 'Dynamic core cardio', 'In plank position, alternate bringing knees to chest', 'En posición de plancha, alterna llevando rodillas al pecho', cardio_cat_id, ARRAY[core_mg_id], ARRAY[shoulders_mg_id], bodyweight_eq_id, 2, 'other', 'compound', true);

END $$;

-- Success message
SELECT 'Part 3 completed: Exercise data populated successfully!' as status,
       COUNT(*) as total_exercises
FROM public.exercises;