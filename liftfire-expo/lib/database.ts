import * as SQLite from 'expo-sqlite';
import { Workout, Exercise } from '../types';

// Database configuration
const DATABASE_NAME = 'liftfire.db';
const DATABASE_VERSION = 1;

// Initialize SQLite database
let db: SQLite.SQLiteDatabase | null = null;

export const initializeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) {
    return db;
  }

  try {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await runMigrations(db);
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Database migration logic
const runMigrations = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Create version table if it doesn't exist
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS database_version (
        version INTEGER PRIMARY KEY
      );
    `);

    // Get current version
    const result = await database.getFirstAsync<{ version: number }>('SELECT version FROM database_version LIMIT 1');
    const currentVersion = result?.version || 0;

    // Run migrations if needed
    if (currentVersion < DATABASE_VERSION) {
      await runMigrationV1(database);
      
      // Update version
      await database.runAsync('DELETE FROM database_version');
      await database.runAsync('INSERT INTO database_version (version) VALUES (?)', [DATABASE_VERSION]);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Migration V1: Create initial tables
const runMigrationV1 = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  await database.execAsync(`
    -- Workouts table for offline storage
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      duration_minutes INTEGER,
      xp_earned INTEGER DEFAULT 0,
      completed_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Exercises table for offline storage
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
    );

    -- Social feed cache (read-only, no offline modifications)
    CREATE TABLE IF NOT EXISTS social_feed (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      workout_name TEXT NOT NULL,
      duration_minutes INTEGER,
      xp_earned INTEGER DEFAULT 0,
      completed_at TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      liked_by_me INTEGER DEFAULT 0,
      cached_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Sync queue for offline operations
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending'
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts (user_id);
    CREATE INDEX IF NOT EXISTS idx_workouts_synced ON workouts (synced);
    CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises (workout_id);
    CREATE INDEX IF NOT EXISTS idx_social_feed_cached_at ON social_feed (cached_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status);
  `);
};

// Data whitelisting functions to ensure only safe data is persisted
export const whitelistWorkoutData = (workout: Partial<Workout>): Partial<Workout> => {
  const allowedFields: (keyof Workout)[] = [
    'id', 'user_id', 'name', 'notes', 'duration_minutes', 
    'xp_earned', 'completed_at', 'created_at', 'synced'
  ];

  const whitelisted: Partial<Workout> = {};
  
  allowedFields.forEach(field => {
    if (workout[field] !== undefined) {
      (whitelisted as any)[field] = workout[field];
    }
  });

  // Sanitize text fields
  if (whitelisted.name) {
    whitelisted.name = sanitizeText(whitelisted.name);
  }
  if (whitelisted.notes) {
    whitelisted.notes = sanitizeText(whitelisted.notes);
  }

  return whitelisted;
};

export const whitelistExerciseData = (exercise: Partial<Exercise>): Partial<Exercise> => {
  const allowedFields: (keyof Exercise)[] = [
    'id', 'workout_id', 'name', 'sets', 'reps', 'weight', 'notes', 'created_at'
  ];

  const whitelisted: Partial<Exercise> = {};
  
  allowedFields.forEach(field => {
    if (exercise[field] !== undefined) {
      (whitelisted as any)[field] = exercise[field];
    }
  });

  // Sanitize text fields
  if (whitelisted.name) {
    whitelisted.name = sanitizeText(whitelisted.name);
  }
  if (whitelisted.notes) {
    whitelisted.notes = sanitizeText(whitelisted.notes);
  }

  // Validate numeric fields
  if (whitelisted.sets !== undefined) {
    whitelisted.sets = Math.max(0, Math.floor(Number(whitelisted.sets) || 0));
  }
  if (whitelisted.reps !== undefined) {
    whitelisted.reps = Math.max(0, Math.floor(Number(whitelisted.reps) || 0));
  }
  if (whitelisted.weight !== undefined) {
    whitelisted.weight = Math.max(0, Number(whitelisted.weight) || 0);
  }

  return whitelisted;
};

// Sanitize text input to prevent XSS and ensure data integrity
const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    .slice(0, 500) // Limit length
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\0/g, ''); // Remove null bytes
};

// Database operation helpers
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};

// Clear all local data (for logout or reset)
export const clearLocalData = async (): Promise<void> => {
  const database = await getDatabase();
  
  await database.execAsync(`
    DELETE FROM workouts;
    DELETE FROM exercises;
    DELETE FROM social_feed;
    DELETE FROM sync_queue;
  `);
};

// Workout CRUD operations for local storage
export const getLocalWorkouts = async (userId: string): Promise<Workout[]> => {
  const database = await getDatabase();
  
  const workouts = await database.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE user_id = ? ORDER BY completed_at DESC',
    [userId]
  );

  // Fetch exercises for each workout
  const workoutsWithExercises = await Promise.all(
    workouts.map(async (workout) => {
      const exercises = await database.getAllAsync<Exercise>(
        'SELECT * FROM exercises WHERE workout_id = ? ORDER BY created_at ASC',
        [workout.id]
      );
      
      return {
        ...workout,
        synced: Boolean(workout.synced),
        exercises: exercises || [],
      };
    })
  );

  return workoutsWithExercises;
};

export const saveLocalWorkout = async (workout: Workout): Promise<void> => {
  const database = await getDatabase();
  const whitelistedWorkout = whitelistWorkoutData(workout);

  try {
    // Start transaction
    await database.execAsync('BEGIN TRANSACTION');

    // Insert or replace workout
    await database.runAsync(
      `INSERT OR REPLACE INTO workouts 
       (id, user_id, name, notes, duration_minutes, xp_earned, completed_at, created_at, synced, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        whitelistedWorkout.id!,
        whitelistedWorkout.user_id!,
        whitelistedWorkout.name!,
        whitelistedWorkout.notes || null,
        whitelistedWorkout.duration_minutes || null,
        whitelistedWorkout.xp_earned || 0,
        whitelistedWorkout.completed_at!,
        whitelistedWorkout.created_at!,
        whitelistedWorkout.synced ? 1 : 0,
      ]
    );

    // Delete existing exercises for this workout
    await database.runAsync('DELETE FROM exercises WHERE workout_id = ?', [workout.id]);

    // Insert exercises if any
    if (workout.exercises && workout.exercises.length > 0) {
      for (const exercise of workout.exercises) {
        const whitelistedExercise = whitelistExerciseData(exercise);
        
        await database.runAsync(
          `INSERT INTO exercises 
           (id, workout_id, name, sets, reps, weight, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            whitelistedExercise.id!,
            whitelistedExercise.workout_id!,
            whitelistedExercise.name!,
            whitelistedExercise.sets!,
            whitelistedExercise.reps!,
            whitelistedExercise.weight || null,
            whitelistedExercise.notes || null,
            whitelistedExercise.created_at!,
          ]
        );
      }
    }

    // Commit transaction
    await database.execAsync('COMMIT');
  } catch (error) {
    // Rollback on error
    await database.execAsync('ROLLBACK');
    throw error;
  }
};

export const deleteLocalWorkout = async (workoutId: string): Promise<void> => {
  const database = await getDatabase();
  
  try {
    await database.execAsync('BEGIN TRANSACTION');
    
    // Delete exercises first (foreign key constraint)
    await database.runAsync('DELETE FROM exercises WHERE workout_id = ?', [workoutId]);
    
    // Delete workout
    await database.runAsync('DELETE FROM workouts WHERE id = ?', [workoutId]);
    
    await database.execAsync('COMMIT');
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
};

// Get database statistics for debugging
export const getDatabaseStats = async () => {
  const database = await getDatabase();
  
  const workoutCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM workouts');
  const exerciseCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
  const queueCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"');
  
  return {
    workouts: workoutCount?.count || 0,
    exercises: exerciseCount?.count || 0,
    pendingSync: queueCount?.count || 0
  };
};