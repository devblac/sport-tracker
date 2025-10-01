// User schemas and types
export * from './user';
export * from './exercise';
export * from './workout';

// Re-export commonly used schemas
export {
  UserSchema,
  UserRegistrationSchema,
  UserLoginSchema,
  UserProfileUpdateSchema,
  UserSettingsUpdateSchema,
  PasswordChangeSchema,
} from './user';

export {
  ExerciseSchema,
  ExerciseCreateSchema,
  ExerciseUpdateSchema,
  ExerciseFilterSchema,
} from './exercise';

export {
  WorkoutSchema,
  WorkoutCreateSchema,
  WorkoutUpdateSchema,
  SetDataSchema,
  WorkoutExerciseSchema,
  WorkoutTemplateSchema,
} from './workout';

// Re-export commonly used types
export type {
  User,
  UserRole,
  UserProfile,
  UserSettings,
  UserRegistration,
  UserLogin,
  FitnessLevel,
  Theme,
  Units,
} from './user';

export type {
  Exercise,
  ExerciseType,
  ExerciseCategory,
  BodyPart,
  MuscleGroup,
  Equipment,
  DifficultyLevel,
} from './exercise';

export type {
  Workout,
  WorkoutExercise,
  SetData,
  SetType,
  WorkoutStatus,
} from './workout';