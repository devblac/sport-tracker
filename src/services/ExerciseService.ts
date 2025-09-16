import { getDatabaseService } from '@/db/DatabaseService';
import type { Exercise, ExerciseFilter, BodyPart, ExerciseCategory } from '@/schemas/exercise';

export class ExerciseService {
  private static instance: ExerciseService;
  private db = getDatabaseService();
  private initialized = false;
  private sampleExercises: Exercise[] = [];
  private userPreferences: Map<string, any> = new Map();

  static getInstance(): ExerciseService {
    if (!ExerciseService.instance) {
      ExerciseService.instance = new ExerciseService();
    }
    return ExerciseService.instance;
  }

  /**
   * Initialize the service and populate with sample data
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize the database
      await this.db.initialize();
      
      // Check if we have exercises in the database
      const existingExercises = await this.db.getAllExercises();
      
      if (existingExercises.length === 0) {
        // Populate with sample exercises
        await this.populateSampleExercises();
      }
      
      this.initialized = true;
      console.log('ExerciseService initialized successfully');
    } catch (error) {
      console.error('Error initializing ExerciseService:', error);
      // Fallback to in-memory exercises
      this.initializeFallbackExercises();
      this.initialized = true;
    }
  }

  /**
   * Initialize fallback exercises in memory
   */
  private initializeFallbackExercises(): void {
    this.sampleExercises = this.createSampleExerciseData();
    console.log('Using fallback in-memory exercises');
  }

  /**
   * Create sample exercise data
   */
  private createSampleExerciseData(): Exercise[] {
    return [
      {
        id: 'bench-press',
        name: 'Bench Press',
        type: 'barbell',
        category: 'strength',
        body_parts: ['chest'],
        muscle_groups: ['pectorals'],
        equipment: 'barbell',
        difficulty_level: 3,
        instructions: [{ step_number: 1, instruction: 'Lie on bench, grip bar shoulder-width apart, lower to chest, press up' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: [],
        safety_notes: [],
        contraindications: [],
        prerequisites: []
      },
      {
        id: 'squat',
        name: 'Squat',
        type: 'barbell',
        category: 'strength',
        body_parts: ['legs'],
        muscle_groups: ['quadriceps_femoris'],
        equipment: 'barbell',
        difficulty_level: 4,
        instructions: [{ step_number: 1, instruction: 'Stand with bar on shoulders, squat down and up' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'deadlift',
        name: 'Deadlift',
        type: 'barbell',
        category: 'powerlifting',
        body_parts: ['back', 'legs'],
        muscle_groups: ['latissimus_dorsi'],
        equipment: 'barbell',
        difficulty_level: 4,
        instructions: [{ step_number: 1, instruction: 'Stand with feet hip-width, grip bar, lift by extending hips and knees' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'pull-ups',
        name: 'Pull-ups',
        type: 'bodyweight',
        category: 'strength',
        body_parts: ['back', 'arms'],
        muscle_groups: ['latissimus_dorsi'],
        equipment: 'pull_up_bar',
        difficulty_level: 4,
        instructions: [{ step_number: 1, instruction: 'Hang from bar, pull body up until chin over bar' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'push-ups',
        name: 'Push-ups',
        type: 'bodyweight',
        category: 'strength',
        body_parts: ['chest', 'arms'],
        muscle_groups: ['pectorals'],
        equipment: 'none',
        difficulty_level: 1,
        instructions: [{ step_number: 1, instruction: 'Start in plank position, lower chest to ground, push back up' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'overhead-press',
        name: 'Overhead Press',
        type: 'barbell',
        category: 'strength',
        body_parts: ['shoulders'],
        muscle_groups: ['deltoids'],
        equipment: 'barbell',
        difficulty_level: 3,
        instructions: [{ step_number: 1, instruction: 'Press bar from shoulders to overhead' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'bent-over-row',
        name: 'Bent-over Row',
        type: 'barbell',
        category: 'strength',
        body_parts: ['back'],
        muscle_groups: ['latissimus_dorsi'],
        equipment: 'barbell',
        difficulty_level: 3,
        instructions: [{ step_number: 1, instruction: 'Bend at hips, pull bar to lower chest' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'dips',
        name: 'Dips',
        type: 'bodyweight',
        category: 'strength',
        body_parts: ['chest', 'triceps'],
        muscle_groups: ['pectorals'],
        equipment: 'dip_station',
        difficulty_level: 3,
        instructions: [{ step_number: 1, instruction: 'Support body on parallel bars, lower and raise body' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'lunges',
        name: 'Lunges',
        type: 'bodyweight',
        category: 'functional',
        body_parts: ['legs'],
        muscle_groups: ['quadriceps_femoris'],
        equipment: 'none',
        difficulty_level: 2,
        instructions: [{ step_number: 1, instruction: 'Step forward into lunge position, return to start' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'plank',
        name: 'Plank',
        type: 'bodyweight',
        category: 'functional',
        body_parts: ['core'],
        muscle_groups: ['rectus_abdominis'],
        equipment: 'none',
        difficulty_level: 1,
        instructions: [{ step_number: 1, instruction: 'Hold body in straight line on forearms' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'bicep-curls',
        name: 'Bicep Curls',
        type: 'dumbbell',
        category: 'strength',
        body_parts: ['biceps'],
        muscle_groups: ['biceps_brachii'],
        equipment: 'dumbbell',
        difficulty_level: 1,
        instructions: [{ step_number: 1, instruction: 'Curl dumbbells up, squeeze biceps' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'lateral-raises',
        name: 'Lateral Raises',
        type: 'dumbbell',
        category: 'strength',
        body_parts: ['shoulders'],
        muscle_groups: ['deltoids'],
        equipment: 'dumbbell',
        difficulty_level: 2,
        instructions: [{ step_number: 1, instruction: 'Raise dumbbells to sides until parallel to floor' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'leg-press',
        name: 'Leg Press',
        type: 'machine',
        category: 'strength',
        body_parts: ['legs'],
        muscle_groups: ['quadriceps_femoris'],
        equipment: 'leg_press',
        difficulty_level: 2,
        instructions: [{ step_number: 1, instruction: 'Sit in machine, press weight with legs' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'lat-pulldown',
        name: 'Lat Pulldown',
        type: 'machine',
        category: 'strength',
        body_parts: ['back'],
        muscle_groups: ['latissimus_dorsi'],
        equipment: 'lat_pulldown',
        difficulty_level: 2,
        instructions: [{ step_number: 1, instruction: 'Sit at machine, pull bar down to upper chest' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'russian-twists',
        name: 'Russian Twists',
        type: 'bodyweight',
        category: 'functional',
        body_parts: ['core'],
        muscle_groups: ['obliques'],
        equipment: 'none',
        difficulty_level: 2,
        instructions: [{ step_number: 1, instruction: 'Sit with knees bent, rotate torso side to side' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'burpees',
        name: 'Burpees',
        type: 'bodyweight',
        category: 'functional',
        body_parts: ['full_body'],
        muscle_groups: ['pectorals'],
        equipment: 'none',
        difficulty_level: 3,
        instructions: [{ step_number: 1, instruction: 'Squat, jump back to plank, push-up, jump up' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'mountain-climbers',
        name: 'Mountain Climbers',
        type: 'bodyweight',
        category: 'cardio',
        body_parts: ['core'],
        muscle_groups: ['rectus_abdominis'],
        equipment: 'none',
        difficulty_level: 2,
        instructions: [{ step_number: 1, instruction: 'In plank position, alternate bringing knees to chest' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'tricep-dips',
        name: 'Tricep Dips',
        type: 'bodyweight',
        category: 'strength',
        body_parts: ['triceps'],
        muscle_groups: ['triceps_brachii'],
        equipment: 'none',
        difficulty_level: 2,
        instructions: [{ step_number: 1, instruction: 'Lower and raise body using triceps' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'romanian-deadlift',
        name: 'Romanian Deadlift',
        type: 'barbell',
        category: 'strength',
        body_parts: ['hamstrings', 'glutes'],
        muscle_groups: ['hamstrings'],
        equipment: 'barbell',
        difficulty_level: 3,
        instructions: [{ step_number: 1, instruction: 'Keep legs straight, hinge at hips, lower bar' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      },
      {
        id: 'face-pulls',
        name: 'Face Pulls',
        type: 'cable',
        category: 'strength',
        body_parts: ['shoulders', 'back'],
        muscle_groups: ['deltoids'],
        equipment: 'cable_machine',
        difficulty_level: 2,
        instructions: [{ step_number: 1, instruction: 'Pull rope to face level, separate handles' }],
        tips: [],
        variations: [],
        created_at: new Date(),
        is_custom: false,
        is_verified: true,
        tags: [],
        aliases: []
      }
    ];
  }

  /**
   * Populate database with sample exercises
   */
  private async populateSampleExercises(): Promise<void> {
    try {
      const sampleData = this.createSampleExerciseData();
      
      for (const exercise of sampleData) {
        // Convert to database format
        const dbExercise = {
          id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          bodyPart: exercise.body_parts[0] || 'full_body',
          equipment: exercise.equipment,
          difficulty: exercise.difficulty_level,
          instructions: exercise.instructions[0]?.instruction || '',
          createdAt: new Date(),
          isCustom: false
        };

        // Try to add to database
        try {
          await this.db.put('exercises', dbExercise);
        } catch (error) {
          console.warn('Could not add exercise to database:', exercise.name, error);
        }
      }

      console.log(`Populated ${sampleData.length} sample exercises`);
    } catch (error) {
      console.error('Error populating sample exercises:', error);
    }
  }

  /**
   * Get all exercises with optional filtering
   */
  async getAllExercises(filter?: ExerciseFilter): Promise<Exercise[]> {
    await this.init();
    
    try {
      // Try to get from database first
      const dbExercises = await this.db.getAllExercises();
      
      if (dbExercises.length > 0) {
        // Convert database format to Exercise format
        const exercises = dbExercises.map(this.mapDatabaseToExercise);
        return this.applyFilters(exercises, filter);
      }
    } catch (error) {
      console.warn('Could not get exercises from database, using fallback:', error);
    }

    // Fallback to in-memory exercises
    if (this.sampleExercises.length === 0) {
      this.sampleExercises = this.createSampleExerciseData();
    }
    
    return this.applyFilters(this.sampleExercises, filter);
  }

  /**
   * Apply filters to exercise list
   */
  private applyFilters(exercises: Exercise[], filter?: ExerciseFilter): Exercise[] {
    if (!filter) return exercises;

    let filtered = exercises;

    if (filter.search) {
      const query = filter.search.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.instructions[0]?.instruction.toLowerCase().includes(query)
      );
    }

    if (filter.body_parts && filter.body_parts.length > 0) {
      filtered = filtered.filter(exercise =>
        exercise.body_parts.some(bp => filter.body_parts!.includes(bp))
      );
    }

    return filtered;
  }

  /**
   * Get exercises by body part
   */
  async getExercisesByBodyPart(bodyPart: BodyPart): Promise<Exercise[]> {
    const allExercises = await this.getAllExercises();
    return allExercises.filter(exercise => 
      exercise.body_parts.includes(bodyPart)
    );
  }

  /**
   * Get exercise categories with counts
   */
  async getExerciseCategories(): Promise<Array<{ category: ExerciseCategory; name: string; count: number }>> {
    const allExercises = await this.getAllExercises();
    
    const categoryCounts: Record<string, number> = {};
    
    allExercises.forEach(exercise => {
      const type = exercise.type;
      categoryCounts[type] = (categoryCounts[type] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([type, count]) => ({
      category: type as ExerciseCategory,
      name: this.getTypeDisplayName(type),
      count
    }));
  }

  /**
   * Get body parts with exercise counts
   */
  async getBodyPartsWithCounts(): Promise<Array<{ bodyPart: BodyPart; name: string; count: number }>> {
    const allExercises = await this.getAllExercises();
    
    const bodyPartCounts: Record<BodyPart, number> = {
      chest: 0, back: 0, shoulders: 0, arms: 0, biceps: 0, triceps: 0,
      forearms: 0, abs: 0, core: 0, legs: 0, quadriceps: 0, hamstrings: 0,
      glutes: 0, calves: 0, full_body: 0
    };

    allExercises.forEach(exercise => {
      exercise.body_parts.forEach(bodyPart => {
        bodyPartCounts[bodyPart]++;
      });
    });

    return Object.entries(bodyPartCounts)
      .filter(([_, count]) => count > 0)
      .map(([bodyPart, count]) => ({
        bodyPart: bodyPart as BodyPart,
        name: this.getBodyPartDisplayName(bodyPart as BodyPart),
        count
      }));
  }

  /**
   * Create custom exercise
   */
  async createCustomExercise(exercise: Partial<Exercise>, userId: string): Promise<Exercise | null> {
    const exerciseId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newExercise: Exercise = {
      id: exerciseId,
      name: exercise.name || 'Custom Exercise',
      type: 'bodyweight',
      category: 'strength',
      body_parts: exercise.body_parts || ['full_body'],
      muscle_groups: ['pectorals'],
      equipment: 'none',
      difficulty_level: exercise.difficulty_level || 2,
      instructions: exercise.instructions || [{ step_number: 1, instruction: 'Custom exercise instructions' }],
      tips: [],
      variations: [],
      created_at: new Date(),
      created_by: userId,
      is_custom: true,
      is_verified: false,
      tags: [],
      aliases: []
    };

    // Add to in-memory list
    this.sampleExercises.push(newExercise);

    // Try to add to database
    try {
      const dbExercise = {
        id: newExercise.id,
        name: newExercise.name,
        category: newExercise.category,
        bodyPart: newExercise.body_parts[0],
        equipment: newExercise.equipment,
        difficulty: newExercise.difficulty_level,
        instructions: newExercise.instructions[0]?.instruction || '',
        createdAt: new Date(),
        isCustom: true,
        createdBy: userId
      };
      
      await this.db.put('exercises', dbExercise);
    } catch (error) {
      console.warn('Could not save custom exercise to database:', error);
    }

    return newExercise;
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(id: string): Promise<Exercise | null> {
    const allExercises = await this.getAllExercises();
    return allExercises.find(exercise => exercise.id === id) || null;
  }

  /**
   * Archive/unarchive exercise for user
   */
  async toggleExerciseArchive(exerciseId: string, userId: string, archived: boolean): Promise<boolean> {
    const key = `${userId}-${exerciseId}`;
    this.userPreferences.set(key, { archived, updatedAt: new Date() });
    return true;
  }

  /**
   * Get user's archived exercises
   */
  async getUserArchivedExercises(userId: string): Promise<string[]> {
    const archived: string[] = [];
    
    for (const [key, prefs] of this.userPreferences.entries()) {
      if (key.startsWith(userId + '-') && prefs.archived) {
        const exerciseId = key.substring(userId.length + 1);
        archived.push(exerciseId);
      }
    }
    
    return archived;
  }

  /**
   * Bulk import exercises (for backward compatibility)
   */
  async bulkImportExercises(exercises: any[]): Promise<Exercise[]> {
    await this.init();
    const imported: Exercise[] = [];
    
    for (const exerciseData of exercises) {
      try {
        const exercise = this.mapImportDataToExercise(exerciseData);
        this.sampleExercises.push(exercise);
        imported.push(exercise);
      } catch (error) {
        console.error('Error importing exercise:', exerciseData.name, error);
      }
    }

    return imported;
  }

  /**
   * Get exercise count (for backward compatibility)
   */
  async getExerciseCount(): Promise<number> {
    const exercises = await this.getAllExercises();
    return exercises.length;
  }

  /**
   * Map database row to Exercise object
   */
  private mapDatabaseToExercise(row: any): Exercise {
    return {
      id: row.id,
      name: row.name,
      type: this.inferTypeFromEquipment(row.equipment),
      category: row.category || 'strength',
      body_parts: [row.bodyPart || 'full_body'],
      muscle_groups: ['pectorals'],
      equipment: row.equipment || 'none',
      difficulty_level: row.difficulty || 2,
      instructions: [{ step_number: 1, instruction: row.instructions || 'No instructions available' }],
      tips: [],
      variations: [],
      created_at: new Date(row.createdAt || Date.now()),
      created_by: row.createdBy,
      is_custom: Boolean(row.isCustom),
      is_verified: !row.isCustom,
      tags: [],
      aliases: [],
      safety_notes: [],
      contraindications: [],
      prerequisites: []
    };
  }

  /**
   * Map import data to Exercise object
   */
  private mapImportDataToExercise(data: any): Exercise {
    return {
      id: data.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      type: data.type || 'bodyweight',
      category: data.category || 'strength',
      body_parts: data.body_parts || ['full_body'],
      muscle_groups: data.muscle_groups || ['pectorals'],
      equipment: data.equipment || 'none',
      difficulty_level: data.difficulty_level || 2,
      instructions: data.instructions || [{ step_number: 1, instruction: 'No instructions available' }],
      tips: data.tips || [],
      variations: data.variations || [],
      created_at: new Date(),
      created_by: data.created_by,
      is_custom: Boolean(data.is_custom),
      is_verified: Boolean(data.is_verified),
      tags: data.tags || [],
      aliases: data.aliases || [],
      safety_notes: data.safety_notes || [],
      contraindications: data.contraindications || [],
      prerequisites: data.prerequisites || []
    };
  }

  private getTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      barbell: 'Barbell',
      dumbbell: 'Dumbbell',
      machine: 'Machine',
      bodyweight: 'Bodyweight',
      cable: 'Cable',
      cardio: 'Cardio'
    };
    return displayNames[type] || type;
  }

  private getBodyPartDisplayName(bodyPart: BodyPart): string {
    const displayNames: Record<BodyPart, string> = {
      chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms',
      biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs',
      core: 'Core', legs: 'Legs', quadriceps: 'Quadriceps', hamstrings: 'Hamstrings',
      glutes: 'Glutes', calves: 'Calves', full_body: 'Full Body'
    };
    return displayNames[bodyPart] || bodyPart;
  }

  private inferTypeFromEquipment(equipment: string): any {
    const typeMap: Record<string, string> = {
      barbell: 'barbell',
      dumbbell: 'dumbbell',
      machine: 'machine',
      leg_press: 'machine',
      lat_pulldown: 'machine',
      cable_machine: 'cable',
      pull_up_bar: 'bodyweight',
      dip_station: 'bodyweight',
      none: 'bodyweight'
    };
    return typeMap[equipment] || 'bodyweight';
  }
}

// Export singleton instance for backward compatibility
export const exerciseService = ExerciseService.getInstance();