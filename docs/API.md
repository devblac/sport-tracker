# 🔌 API Documentation

## Overview

Sport Tracker PWA uses a service-oriented architecture with a clear separation between the frontend application and backend services. The API is designed to be RESTful, type-safe, and optimized for offline-first functionality.

## 🏗️ API Architecture

### Service Layer Structure

```typescript
// Base service interface
interface BaseService<T> {
  init(): Promise<void>;
  create(data: CreateData<T>): Promise<T>;
  getById(id: string): Promise<T | null>;
  update(id: string, data: UpdateData<T>): Promise<T>;
  delete(id: string): Promise<void>;
  getAll(filter?: FilterOptions<T>): Promise<T[]>;
}
```

### Error Handling

```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
```

## 🔐 Authentication Service

### AuthService

**Location**: `src/services/AuthService.ts`

#### Methods

##### `login(credentials: LoginCredentials): Promise<AuthResult>`

Authenticate user with email/username and password.

**Parameters**:
```typescript
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Response**:
```typescript
interface AuthResult {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  isFirstLogin: boolean;
}
```

**Example**:
```typescript
const authService = AuthService.getInstance();

try {
  const result = await authService.login({
    email: 'user@example.com',
    password: 'securePassword123',
    rememberMe: true
  });
  
  console.log('Login successful:', result.user.displayName);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

##### `register(userData: RegisterData): Promise<AuthResult>`

Register a new user account.

**Parameters**:
```typescript
interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName: string;
  dateOfBirth?: Date;
  acceptTerms: boolean;
}
```

**Example**:
```typescript
const result = await authService.register({
  email: 'newuser@example.com',
  username: 'newuser123',
  password: 'SecurePass123!',
  displayName: 'New User',
  acceptTerms: true
});
```

##### `logout(): Promise<void>`

Log out the current user and clear session data.

**Example**:
```typescript
await authService.logout();
console.log('User logged out successfully');
```

##### `refreshToken(): Promise<AuthTokens>`

Refresh the authentication token.

**Response**:
```typescript
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
```

##### `getCurrentUser(): Promise<User | null>`

Get the currently authenticated user.

**Response**:
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  gamification: GamificationData;
  createdAt: Date;
  updatedAt: Date;
}
```

##### `updateProfile(updates: ProfileUpdates): Promise<User>`

Update user profile information.

**Parameters**:
```typescript
interface ProfileUpdates {
  displayName?: string;
  avatar?: string;
  dateOfBirth?: Date;
  height?: number;
  weight?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
}
```

## 🏋️ Exercise Service

### ExerciseService

**Location**: `src/services/ExerciseService.ts`

#### Methods

##### `getExercises(filter?: ExerciseFilter): Promise<Exercise[]>`

Retrieve exercises with optional filtering.

**Parameters**:
```typescript
interface ExerciseFilter {
  category?: 'strength' | 'cardio' | 'flexibility' | 'sports';
  type?: 'compound' | 'isolation' | 'cardio' | 'stretch';
  bodyParts?: string[];
  muscleGroups?: string[];
  equipment?: string;
  difficultyLevel?: number[];
  tags?: string[];
  search?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}
```

**Response**:
```typescript
interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports';
  type: 'compound' | 'isolation' | 'cardio' | 'stretch';
  bodyParts: string[];
  muscleGroups: string[];
  equipment: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  instructions: string[];
  tips?: string[];
  tags?: string[];
  aliases?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:
```typescript
const exerciseService = ExerciseService.getInstance();

// Get all chest exercises
const chestExercises = await exerciseService.getExercises({
  bodyParts: ['chest'],
  category: 'strength',
  limit: 20
});

// Search for exercises
const searchResults = await exerciseService.getExercises({
  search: 'bench press',
  isPublic: true
});
```

##### `getExerciseById(id: string): Promise<Exercise | null>`

Get a specific exercise by ID.

**Example**:
```typescript
const exercise = await exerciseService.getExerciseById('bench-press');
if (exercise) {
  console.log('Exercise found:', exercise.name);
}
```

##### `createExercise(exerciseData: ExerciseCreate): Promise<Exercise>`

Create a new exercise.

**Parameters**:
```typescript
interface ExerciseCreate {
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports';
  type: 'compound' | 'isolation' | 'cardio' | 'stretch';
  bodyParts: string[];
  muscleGroups: string[];
  equipment: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  instructions: string[];
  tips?: string[];
  tags?: string[];
  aliases?: string[];
  isPublic: boolean;
}
```

**Example**:
```typescript
const newExercise = await exerciseService.createExercise({
  name: 'Custom Push-up Variation',
  category: 'strength',
  type: 'compound',
  bodyParts: ['chest', 'shoulders', 'triceps'],
  muscleGroups: ['pectorals', 'deltoids', 'triceps'],
  equipment: 'bodyweight',
  difficultyLevel: 3,
  instructions: [
    'Start in plank position',
    'Lower body to ground',
    'Push back up to starting position'
  ],
  isPublic: false
});
```

##### `updateExercise(id: string, updates: ExerciseUpdate): Promise<Exercise>`

Update an existing exercise.

**Parameters**:
```typescript
interface ExerciseUpdate {
  name?: string;
  instructions?: string[];
  tips?: string[];
  tags?: string[];
  difficultyLevel?: 1 | 2 | 3 | 4 | 5;
  isPublic?: boolean;
}
```

##### `deleteExercise(id: string): Promise<void>`

Delete an exercise.

**Example**:
```typescript
await exerciseService.deleteExercise('custom-exercise-id');
```

##### `bulkImportExercises(exercises: ExerciseCreate[]): Promise<Exercise[]>`

Import multiple exercises at once.

**Example**:
```typescript
const importedExercises = await exerciseService.bulkImportExercises([
  { /* exercise 1 data */ },
  { /* exercise 2 data */ },
  // ... more exercises
]);

console.log(`Imported ${importedExercises.length} exercises`);
```

## 💪 Workout Service

### WorkoutService

**Location**: `src/services/WorkoutService.ts`

#### Methods

##### `createWorkout(workoutData: WorkoutCreate): Promise<Workout>`

Create a new workout.

**Parameters**:
```typescript
interface WorkoutCreate {
  name: string;
  description?: string;
  scheduledDate?: Date;
  exercises: WorkoutExerciseCreate[];
  notes?: string;
}

interface WorkoutExerciseCreate {
  exerciseId: string;
  sets: SetCreate[];
  restTime?: number;
  notes?: string;
}

interface SetCreate {
  type: 'working' | 'warmup' | 'dropset' | 'failure';
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number;
  targetDistance?: number;
}
```

**Response**:
```typescript
interface Workout {
  id: string;
  name: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalDuration?: number;
  exercises: WorkoutExercise[];
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:
```typescript
const workoutService = WorkoutService.getInstance();

const newWorkout = await workoutService.createWorkout({
  name: 'Push Day Workout',
  description: 'Chest, shoulders, and triceps focus',
  scheduledDate: new Date('2025-01-28'),
  exercises: [
    {
      exerciseId: 'bench-press',
      sets: [
        { type: 'warmup', targetReps: 10, targetWeight: 60 },
        { type: 'working', targetReps: 8, targetWeight: 80 },
        { type: 'working', targetReps: 8, targetWeight: 80 },
        { type: 'working', targetReps: 6, targetWeight: 85 }
      ],
      restTime: 180
    }
  ]
});
```

##### `getWorkouts(filter?: WorkoutFilter): Promise<Workout[]>`

Retrieve workouts with optional filtering.

**Parameters**:
```typescript
interface WorkoutFilter {
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}
```

**Example**:
```typescript
// Get completed workouts from last month
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

const recentWorkouts = await workoutService.getWorkouts({
  status: 'completed',
  dateFrom: lastMonth,
  limit: 10
});
```

##### `startWorkout(workoutId: string): Promise<Workout>`

Start a planned workout.

**Example**:
```typescript
const startedWorkout = await workoutService.startWorkout('workout-123');
console.log('Workout started at:', startedWorkout.startedAt);
```

##### `completeWorkout(workoutId: string, completionData?: WorkoutCompletion): Promise<Workout>`

Complete an in-progress workout.

**Parameters**:
```typescript
interface WorkoutCompletion {
  notes?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  perceivedExertion?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
}
```

**Example**:
```typescript
const completedWorkout = await workoutService.completeWorkout('workout-123', {
  notes: 'Great workout! Felt strong today.',
  rating: 5,
  perceivedExertion: 7
});
```

##### `updateSet(workoutId: string, exerciseIndex: number, setIndex: number, setData: SetUpdate): Promise<Workout>`

Update a specific set in a workout.

**Parameters**:
```typescript
interface SetUpdate {
  actualReps?: number;
  actualWeight?: number;
  actualDuration?: number;
  actualDistance?: number;
  completedAt?: Date;
  notes?: string;
}
```

**Example**:
```typescript
const updatedWorkout = await workoutService.updateSet(
  'workout-123',
  0, // First exercise
  1, // Second set
  {
    actualReps: 8,
    actualWeight: 80,
    completedAt: new Date()
  }
);
```

## 📊 Analytics Service

### AnalyticsService

**Location**: `src/services/AnalyticsService.ts`

#### Methods

##### `getWorkoutStats(period?: TimePeriod): Promise<WorkoutStats>`

Get workout statistics for a time period.

**Parameters**:
```typescript
type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';
```

**Response**:
```typescript
interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  totalVolume: number;
  averageDuration: number;
  averageVolume: number;
  workoutFrequency: number;
  mostFrequentExercises: ExerciseFrequency[];
  progressTrend: 'improving' | 'stable' | 'declining';
}
```

**Example**:
```typescript
const analyticsService = AnalyticsService.getInstance();

const monthlyStats = await analyticsService.getWorkoutStats('month');
console.log(`Completed ${monthlyStats.totalWorkouts} workouts this month`);
```

##### `getPersonalRecords(exerciseId?: string): Promise<PersonalRecord[]>`

Get personal records, optionally filtered by exercise.

**Response**:
```typescript
interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'max_1rm' | 'best_time';
  value: number;
  unit: string;
  achievedAt: Date;
  workoutId: string;
  previousRecord?: number;
  improvement?: number;
}
```

**Example**:
```typescript
// Get all personal records
const allPRs = await analyticsService.getPersonalRecords();

// Get PRs for specific exercise
const benchPRs = await analyticsService.getPersonalRecords('bench-press');
```

##### `getProgressData(exerciseId: string, metric: ProgressMetric): Promise<ProgressData[]>`

Get progress data for an exercise over time.

**Parameters**:
```typescript
type ProgressMetric = 'weight' | 'reps' | 'volume' | '1rm' | 'duration';
```

**Response**:
```typescript
interface ProgressData {
  date: Date;
  value: number;
  workoutId: string;
  setIndex: number;
}
```

**Example**:
```typescript
const progressData = await analyticsService.getProgressData(
  'bench-press',
  'weight'
);

// Use for charting progress over time
const chartData = progressData.map(point => ({
  x: point.date,
  y: point.value
}));
```

## 🎮 Gamification Service

### GamificationService

**Location**: `src/services/GamificationService.ts`

#### Methods

##### `awardXP(amount: number, source: XPSource): Promise<XPAward>`

Award XP to the user.

**Parameters**:
```typescript
type XPSource = 'workout_completion' | 'personal_record' | 'streak' | 'achievement' | 'bonus';

interface XPAward {
  amount: number;
  source: XPSource;
  newTotal: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    unlockedFeatures: string[];
  };
}
```

**Example**:
```typescript
const gamificationService = GamificationService.getInstance();

const xpAward = await gamificationService.awardXP(150, 'workout_completion');
if (xpAward.levelUp) {
  console.log(`Level up! Now level ${xpAward.levelUp.newLevel}`);
}
```

##### `checkAchievements(trigger: AchievementTrigger): Promise<Achievement[]>`

Check for newly unlocked achievements.

**Parameters**:
```typescript
interface AchievementTrigger {
  type: 'workout_completed' | 'pr_achieved' | 'streak_milestone' | 'volume_milestone';
  data: any;
}
```

**Response**:
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'workout' | 'strength' | 'consistency' | 'milestone' | 'social';
  reward: {
    xp: number;
    badge?: string;
    title?: string;
  };
  unlockedAt: Date;
}
```

**Example**:
```typescript
const newAchievements = await gamificationService.checkAchievements({
  type: 'workout_completed',
  data: { workoutId: 'workout-123', totalWorkouts: 10 }
});

newAchievements.forEach(achievement => {
  console.log(`Achievement unlocked: ${achievement.name}`);
});
```

##### `getUserLevel(): Promise<UserLevel>`

Get the user's current level information.

**Response**:
```typescript
interface UserLevel {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  progress: number; // 0-1
  title: string;
  perks: string[];
}
```

**Example**:
```typescript
const userLevel = await gamificationService.getUserLevel();
console.log(`Level ${userLevel.level} - ${userLevel.title}`);
console.log(`Progress: ${Math.round(userLevel.progress * 100)}%`);
```

## 🔄 Sync Service

### SyncService

**Location**: `src/services/SyncService.ts`

#### Methods

##### `queueOperation(operation: SyncOperation): Promise<string>`

Queue an operation for synchronization.

**Parameters**:
```typescript
interface SyncOperation {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'workout' | 'exercise' | 'user' | 'template';
  entityId: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  maxRetries?: number;
}
```

**Example**:
```typescript
const syncService = SyncService.getInstance();

const operationId = await syncService.queueOperation({
  type: 'CREATE',
  entity: 'workout',
  entityId: 'workout-123',
  data: workoutData,
  priority: 'high',
  maxRetries: 3
});
```

##### `getSyncStatus(): Promise<SyncStatus>`

Get the current synchronization status.

**Response**:
```typescript
interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueSize: number;
  lastSyncAt?: Date;
  pendingOperations: number;
  failedOperations: number;
  conflicts: number;
}
```

**Example**:
```typescript
const syncStatus = await syncService.getSyncStatus();
if (syncStatus.conflicts > 0) {
  console.log(`${syncStatus.conflicts} conflicts need resolution`);
}
```

##### `forcSync(): Promise<SyncResult>`

Force immediate synchronization.

**Response**:
```typescript
interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  conflicts: number;
  duration: number;
}
```

**Example**:
```typescript
const result = await syncService.forceSync();
console.log(`Sync completed: ${result.processed} operations processed`);
```

## 🔧 Utility Services

### DatabaseInitService

**Location**: `src/services/DatabaseInitService.ts`

#### Methods

##### `initializeDatabase(force?: boolean): Promise<void>`

Initialize the database with sample data.

**Example**:
```typescript
const DatabaseInitService = (await import('@/services/DatabaseInitService')).default;

// Initialize database
await DatabaseInitService.initializeDatabase();

// Force reinitialization
await DatabaseInitService.initializeDatabase(true);
```

##### `getDatabaseStats(): Promise<DatabaseStats>`

Get database statistics and health information.

**Response**:
```typescript
interface DatabaseStats {
  exerciseCount: number;
  isInitialized: boolean;
  version: string | null;
  sampleDataCount: number;
  isFallbackMode?: boolean;
}
```

##### `exportDatabase(): Promise<DatabaseExport>`

Export all user data for backup.

**Response**:
```typescript
interface DatabaseExport {
  version: string;
  exportedAt: Date;
  data: {
    exercises: Exercise[];
    workouts: Workout[];
    templates: WorkoutTemplate[];
    userData: UserData;
  };
}
```

##### `importDatabase(data: DatabaseExport): Promise<void>`

Import data from a backup.

**Example**:
```typescript
// Export data
const backup = await DatabaseInitService.exportDatabase();

// Import data (e.g., on new device)
await DatabaseInitService.importDatabase(backup);
```

## 🚨 Error Handling

### Error Types

```typescript
// Base error class
class ServiceError extends Error {
  code: string;
  details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Specific error types
class ValidationError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

class NetworkError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
  }
}

class DatabaseError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
  }
}
```

### Error Handling Patterns

```typescript
// Service method with error handling
async function createWorkout(data: WorkoutCreate): Promise<Workout> {
  try {
    // Validate input
    const validation = validateWorkoutCreate(data);
    if (!validation.success) {
      throw new ValidationError('Invalid workout data', validation.errors);
    }

    // Process operation
    const workout = await this.processWorkoutCreation(validation.data);
    
    return workout;
  } catch (error) {
    // Log error
    logger.error('Failed to create workout', error);
    
    // Re-throw with context
    if (error instanceof ServiceError) {
      throw error;
    }
    
    throw new ServiceError('Unexpected error creating workout', 'UNKNOWN_ERROR', error);
  }
}

// Usage with error handling
try {
  const workout = await workoutService.createWorkout(workoutData);
  console.log('Workout created successfully');
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.error('Validation failed:', error.details);
  } else if (error instanceof NetworkError) {
    // Handle network errors
    console.error('Network error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error.message);
  }
}
```

## 📝 Type Definitions

### Core Types

All API methods use strongly typed interfaces. Key type definitions are located in:

- `src/types/auth.ts` - Authentication types
- `src/types/exercise.ts` - Exercise-related types
- `src/types/workout.ts` - Workout-related types
- `src/types/user.ts` - User and profile types
- `src/types/gamification.ts` - Gamification types
- `src/types/sync.ts` - Synchronization types

### Generic Types

```typescript
// Generic filter type
interface FilterOptions<T> {
  where?: Partial<T>;
  orderBy?: keyof T;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Generic response wrapper
interface ServiceResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  metadata?: {
    total?: number;
    page?: number;
    hasMore?: boolean;
  };
}

// Generic create/update types
type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateData<T> = Partial<CreateData<T>>;
```

## 🧪 Testing APIs

### Service Testing

All services include comprehensive test suites:

```typescript
// Example service test
describe('WorkoutService', () => {
  let workoutService: WorkoutService;
  
  beforeEach(async () => {
    workoutService = WorkoutService.getInstance();
    await workoutService.init();
  });
  
  it('should create workout successfully', async () => {
    const workoutData: WorkoutCreate = {
      name: 'Test Workout',
      exercises: [/* exercise data */]
    };
    
    const workout = await workoutService.createWorkout(workoutData);
    
    expect(workout.id).toBeDefined();
    expect(workout.name).toBe('Test Workout');
    expect(workout.status).toBe('planned');
  });
  
  it('should handle validation errors', async () => {
    const invalidData = { name: '' }; // Invalid data
    
    await expect(workoutService.createWorkout(invalidData))
      .rejects.toThrow(ValidationError);
  });
});
```

### API Mocking

For testing components that use services:

```typescript
// Mock service for testing
const mockWorkoutService = {
  createWorkout: vi.fn(),
  getWorkouts: vi.fn(),
  updateWorkout: vi.fn(),
  deleteWorkout: vi.fn()
};

// Use in component tests
vi.mocked(WorkoutService.getInstance).mockReturnValue(mockWorkoutService);
```

## 📚 Additional Resources

### Service Documentation

- [AuthService](../src/services/AuthService.ts) - User authentication and management
- [ExerciseService](../src/services/ExerciseService.ts) - Exercise database operations
- [WorkoutService](../src/services/WorkoutService.ts) - Workout CRUD and management
- [AnalyticsService](../src/services/AnalyticsService.ts) - Progress tracking and statistics
- [GamificationService](../src/services/GamificationService.ts) - XP, levels, and achievements
- [SyncService](../src/services/SyncService.ts) - Data synchronization

### Type Definitions

- [Exercise Types](../src/types/exercise.ts)
- [Workout Types](../src/types/workout.ts)
- [User Types](../src/types/user.ts)
- [Auth Types](../src/types/auth.ts)
- [Gamification Types](../src/types/gamification.ts)
- [Sync Types](../src/types/sync.ts)

### Utilities

- [Database Manager](../src/db/IndexedDBManager.ts)
- [Sync Manager](../src/utils/syncManager.ts)
- [Logger](../src/utils/logger.ts)
- [Validation](../src/utils/validation.ts)

---

*This API documentation is automatically generated from TypeScript interfaces and is kept in sync with the codebase. Last updated: January 2025*