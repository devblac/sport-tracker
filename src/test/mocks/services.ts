import { vi } from 'vitest';

// Mock WorkoutService
export const mockWorkoutService = {
  createWorkout: vi.fn(),
  getWorkout: vi.fn(),
  updateWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
  getUserWorkouts: vi.fn(),
  startWorkout: vi.fn(),
  completeWorkout: vi.fn(),
  pauseWorkout: vi.fn(),
  resumeWorkout: vi.fn(),
  addExerciseToWorkout: vi.fn(),
  removeExerciseFromWorkout: vi.fn(),
  logSet: vi.fn(),
  calculateWorkoutStats: vi.fn(),
  getWorkoutHistory: vi.fn(),
  syncPendingOperations: vi.fn(),
  setOfflineMode: vi.fn(),
  getPendingOperations: vi.fn(),
  addPendingOperation: vi.fn()
};

// Mock AuthService
export const mockAuthService = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  refreshToken: vi.fn(),
  isAuthenticated: vi.fn(),
  createGuestUser: vi.fn(),
  upgradeGuestAccount: vi.fn()
};

// Mock ExerciseService
export const mockExerciseService = {
  getAllExercises: vi.fn(),
  getExerciseById: vi.fn(),
  searchExercises: vi.fn(),
  getExercisesByCategory: vi.fn(),
  getExercisesByBodyPart: vi.fn(),
  getExercisesByEquipment: vi.fn(),
  createCustomExercise: vi.fn(),
  updateExercise: vi.fn(),
  deleteExercise: vi.fn(),
  getExerciseHistory: vi.fn(),
  getPersonalRecords: vi.fn()
};

// Mock GamificationService
export const mockGamificationService = {
  getUserStats: vi.fn(),
  awardXP: vi.fn(),
  checkLevelUp: vi.fn(),
  getAchievements: vi.fn(),
  unlockAchievement: vi.fn(),
  checkAchievements: vi.fn(),
  updateStreak: vi.fn(),
  getStreakData: vi.fn(),
  calculateXP: vi.fn(),
  getLeaderboard: vi.fn(),
  getUserRank: vi.fn()
};

// Mock SocialService
export const mockSocialService = {
  getFeed: vi.fn(),
  createPost: vi.fn(),
  likePost: vi.fn(),
  unlikePost: vi.fn(),
  commentOnPost: vi.fn(),
  sharePost: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  getFriends: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  rejectFriendRequest: vi.fn(),
  blockUser: vi.fn(),
  reportPost: vi.fn(),
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn()
};

// Mock DatabaseService
export const mockDatabaseService = {
  // Workout operations
  workouts: {
    create: vi.fn(),
    getById: vi.fn(),
    getByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    search: vi.fn()
  },
  
  // Exercise operations
  exercises: {
    create: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    getByCategory: vi.fn(),
    getByBodyPart: vi.fn()
  },
  
  // User operations
  users: {
    create: vi.fn(),
    getById: vi.fn(),
    getByEmail: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn()
  },
  
  // Exercise history
  exerciseHistory: {
    create: vi.fn(),
    getByUserId: vi.fn(),
    getByExerciseId: vi.fn(),
    getByWorkoutId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  
  // Personal records
  personalRecords: {
    create: vi.fn(),
    getByUserId: vi.fn(),
    getByExerciseId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  
  // Social features
  socialPosts: {
    create: vi.fn(),
    getById: vi.fn(),
    getByUserId: vi.fn(),
    getFeed: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  
  // Achievements
  achievements: {
    create: vi.fn(),
    getAll: vi.fn(),
    getByUserId: vi.fn(),
    unlock: vi.fn()
  },
  
  // Streaks
  streaks: {
    create: vi.fn(),
    getByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  
  // Generic operations
  transaction: vi.fn(),
  close: vi.fn(),
  isConnected: vi.fn(),
  migrate: vi.fn(),
  backup: vi.fn(),
  restore: vi.fn()
};

// Mock NotificationService
export const mockNotificationService = {
  requestPermission: vi.fn(),
  showNotification: vi.fn(),
  scheduleNotification: vi.fn(),
  cancelNotification: vi.fn(),
  getPermissionStatus: vi.fn(),
  isSupported: vi.fn(),
  registerServiceWorker: vi.fn()
};

// Mock AnalyticsService
export const mockAnalyticsService = {
  track: vi.fn(),
  identify: vi.fn(),
  page: vi.fn(),
  group: vi.fn(),
  alias: vi.fn(),
  reset: vi.fn(),
  getSessionId: vi.fn(),
  setUserProperties: vi.fn(),
  trackEvent: vi.fn(),
  trackError: vi.fn()
};

// Mock BackupService
export const mockBackupService = {
  createBackup: vi.fn(),
  restoreBackup: vi.fn(),
  listBackups: vi.fn(),
  deleteBackup: vi.fn(),
  scheduleAutoBackup: vi.fn(),
  cancelAutoBackup: vi.fn(),
  exportData: vi.fn(),
  importData: vi.fn(),
  validateBackup: vi.fn()
};

// Service factory for easy mocking
export const createMockServices = () => ({
  workoutService: mockWorkoutService,
  authService: mockAuthService,
  exerciseService: mockExerciseService,
  gamificationService: mockGamificationService,
  socialService: mockSocialService,
  databaseService: mockDatabaseService,
  notificationService: mockNotificationService,
  analyticsService: mockAnalyticsService,
  backupService: mockBackupService
});

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(createMockServices()).forEach(service => {
    if (typeof service === 'object') {
      Object.values(service).forEach(method => {
        if (vi.isMockFunction(method)) {
          method.mockReset();
        } else if (typeof method === 'object') {
          Object.values(method).forEach(nestedMethod => {
            if (vi.isMockFunction(nestedMethod)) {
              nestedMethod.mockReset();
            }
          });
        }
      });
    }
  });
};

// Common mock implementations
export const mockImplementations = {
  // Successful responses
  success: {
    createWorkout: (data: any) => Promise.resolve({ id: 'new-workout-id', ...data }),
    login: (credentials: any) => Promise.resolve({ 
      user: { id: 'user-id', email: credentials.email },
      token: 'mock-token'
    }),
    getUserWorkouts: () => Promise.resolve([]),
    awardXP: (type: string, data: any) => ({ xp: 10, reason: 'Test XP' }),
    getAllExercises: () => Promise.resolve([])
  },
  
  // Error responses
  error: {
    networkError: () => Promise.reject(new Error('Network error')),
    validationError: () => Promise.reject(new Error('Validation failed')),
    authError: () => Promise.reject(new Error('Authentication failed')),
    notFoundError: () => Promise.reject(new Error('Resource not found'))
  },
  
  // Loading states
  loading: {
    delayed: (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms)),
    infinite: () => new Promise(() => {}) // Never resolves
  }
};

// Auto-mock setup for common scenarios
export const setupMockScenario = (scenario: 'success' | 'error' | 'loading') => {
  const services = createMockServices();
  
  switch (scenario) {
    case 'success':
      services.workoutService.createWorkout.mockImplementation(mockImplementations.success.createWorkout);
      services.authService.login.mockImplementation(mockImplementations.success.login);
      services.workoutService.getUserWorkouts.mockImplementation(mockImplementations.success.getUserWorkouts);
      services.gamificationService.awardXP.mockImplementation(mockImplementations.success.awardXP);
      services.exerciseService.getAllExercises.mockImplementation(mockImplementations.success.getAllExercises);
      break;
      
    case 'error':
      services.workoutService.createWorkout.mockImplementation(mockImplementations.error.validationError);
      services.authService.login.mockImplementation(mockImplementations.error.authError);
      services.workoutService.getUserWorkouts.mockImplementation(mockImplementations.error.networkError);
      break;
      
    case 'loading':
      services.workoutService.createWorkout.mockImplementation(() => mockImplementations.loading.delayed(2000));
      services.authService.login.mockImplementation(() => mockImplementations.loading.delayed(1500));
      services.workoutService.getUserWorkouts.mockImplementation(() => mockImplementations.loading.delayed(1000));
      break;
  }
  
  return services;
};