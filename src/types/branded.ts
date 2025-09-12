// Branded type utility
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };

// ID types
export type UserId = Brand<string, 'UserId'>;
export type WorkoutId = Brand<string, 'WorkoutId'>;
export type ExerciseId = Brand<string, 'ExerciseId'>;
export type TemplateId = Brand<string, 'TemplateId'>;
export type AchievementId = Brand<string, 'AchievementId'>;
export type ChallengeId = Brand<string, 'ChallengeId'>;

// Utility functions for creating branded types
export const createUserId = (id: string): UserId => id as UserId;
export const createWorkoutId = (id: string): WorkoutId => id as WorkoutId;
export const createExerciseId = (id: string): ExerciseId => id as ExerciseId;
export const createTemplateId = (id: string): TemplateId => id as TemplateId;
export const createAchievementId = (id: string): AchievementId => id as AchievementId;
export const createChallengeId = (id: string): ChallengeId => id as ChallengeId;

// Type guards
export const isUserId = (id: string): id is UserId => typeof id === 'string' && id.length > 0;
export const isWorkoutId = (id: string): id is WorkoutId => typeof id === 'string' && id.length > 0;
export const isExerciseId = (id: string): id is ExerciseId => typeof id === 'string' && id.length > 0;

// Validation functions
export const validateUserId = (id: unknown): UserId => {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid user ID');
  }
  return id as UserId;
};

export const validateWorkoutId = (id: unknown): WorkoutId => {
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Invalid workout ID');
  }
  return id as WorkoutId;
};

// Numeric branded types
export type Weight = Brand<number, 'Weight'>;
export type Reps = Brand<number, 'Reps'>;
export type Duration = Brand<number, 'Duration'>; // in seconds
export type XP = Brand<number, 'XP'>;
export type Level = Brand<number, 'Level'>;

export const createWeight = (weight: number): Weight => {
  if (weight < 0) throw new Error('Weight cannot be negative');
  return weight as Weight;
};

export const createReps = (reps: number): Reps => {
  if (reps < 0 || !Number.isInteger(reps)) throw new Error('Reps must be a non-negative integer');
  return reps as Reps;
};

export const createDuration = (seconds: number): Duration => {
  if (seconds < 0) throw new Error('Duration cannot be negative');
  return seconds as Duration;
};

export const createXP = (xp: number): XP => {
  if (xp < 0 || !Number.isInteger(xp)) throw new Error('XP must be a non-negative integer');
  return xp as XP;
};

export const createLevel = (level: number): Level => {
  if (level < 1 || !Number.isInteger(level)) throw new Error('Level must be a positive integer');
  return level as Level;
};

// Date branded types
export type Timestamp = Brand<Date, 'Timestamp'>;
export type ISODateString = Brand<string, 'ISODateString'>;

export const createTimestamp = (date: Date): Timestamp => date as Timestamp;
export const createISODateString = (dateString: string): ISODateString => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }
  return dateString as ISODateString;
};

// Email branded type
export type Email = Brand<string, 'Email'>;

export const createEmail = (email: string): Email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return email as Email;
};

// URL branded type
export type SafeURL = Brand<string, 'SafeURL'>;

export const createSafeURL = (url: string): SafeURL => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }
    return url as SafeURL;
  } catch {
    throw new Error('Invalid URL format');
  }
};