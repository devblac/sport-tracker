/**
 * Mock Service Implementations
 * Complete mock implementations for all services
 */

import { vi } from 'vitest';
import { 
  createMockUser, 
  createMockWorkout, 
  createMockExercise, 
  createMockAchievement,
  createMockSocialPost,
  createMockXPGain,
  createMockPersonalRecord,
  createMockStreak,
} from './data';

// Auth Service Mock
export const mockAuthService = {
  getCurrentUser: vi.fn().mockResolvedValue(createMockUser()),
  signIn: vi.fn().mockResolvedValue({ user: createMockUser(), error: null }),
  signUp: vi.fn().mockResolvedValue({ user: createMockUser(), error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  updateProfile: vi.fn().mockResolvedValue({ user: createMockUser(), error: null }),
  resetPassword: vi.fn().mockResolvedValue({ error: null }),
  isAuthenticated: vi.fn().mockReturnValue(true),
  getAuthToken: vi.fn().mockResolvedValue('mock-token'),
};

// Workout Service Mock
export const mockWorkoutService = {
  getWorkouts: vi.fn().mockResolvedValue([createMockWorkout()]),
  getWorkout: vi.fn().mockResolvedValue(createMockWorkout()),
  createWorkout: vi.fn().mockResolvedValue(createMockWorkout()),
  updateWorkout: vi.fn().mockResolvedValue(createMockWorkout()),
  deleteWorkout: vi.fn().mockResolvedValue(true),
  startWorkout: vi.fn().mockResolvedValue(createMockWorkout({ status: 'in_progress' })),
  completeWorkout: vi.fn().mockResolvedValue(createMockWorkout({ status: 'completed' })),
  pauseWorkout: vi.fn().mockResolvedValue(createMockWorkout({ status: 'paused' })),
  resumeWorkout: vi.fn().mockResolvedValue(createMockWorkout({ status: 'in_progress' })),
  logSet: vi.fn().mockResolvedValue(true),
  getWorkoutHistory: vi.fn().mockResolvedValue([createMockWorkout()]),
  getWorkoutTemplates: vi.fn().mockResolvedValue([createMockWorkout({ is_template: true })]),
  createTemplate: vi.fn().mockResolvedValue(createMockWorkout({ is_template: true })),
};

// Exercise Service Mock
export const mockExerciseService = {
  getExercises: vi.fn().mockResolvedValue([createMockExercise()]),
  getExercise: vi.fn().mockResolvedValue(createMockExercise()),
  searchExercises: vi.fn().mockResolvedValue([createMockExercise()]),
  getExercisesByCategory: vi.fn().mockResolvedValue([createMockExercise()]),
  getExercisesByMuscleGroup: vi.fn().mockResolvedValue([createMockExercise()]),
  getExerciseHistory: vi.fn().mockResolvedValue([]),
  getPersonalRecords: vi.fn().mockResolvedValue([createMockPersonalRecord()]),
};

// Gamification Service Mock
export const mockGamificationService = {
  getUserStats: vi.fn().mockResolvedValue({
    level: 5,
    total_xp: 1250,
    current_streak: 7,
    best_streak: 15,
  }),
  calculateXP: vi.fn().mockReturnValue(50),
  awardXP: vi.fn().mockResolvedValue(createMockXPGain()),
  checkLevelUp: vi.fn().mockReturnValue({ leveledUp: false, newLevel: 5 }),
  getAchievements: vi.fn().mockResolvedValue([createMockAchievement()]),
  checkAchievements: vi.fn().mockResolvedValue([]),
  unlockAchievement: vi.fn().mockResolvedValue(createMockAchievement({ unlocked_at: new Date().toISOString() })),
  getStreakInfo: vi.fn().mockResolvedValue(createMockStreak()),
  updateStreak: vi.fn().mockResolvedValue(createMockStreak({ current_streak: 8 })),
  calculateStreakXP: vi.fn().mockReturnValue(25),
};

// Social Service Mock
export const mockSocialService = {
  getFeed: vi.fn().mockResolvedValue([createMockSocialPost()]),
  createPost: vi.fn().mockResolvedValue(createMockSocialPost()),
  likePost: vi.fn().mockResolvedValue(true),
  unlikePost: vi.fn().mockResolvedValue(true),
  commentOnPost: vi.fn().mockResolvedValue(true),
  sharePost: vi.fn().mockResolvedValue(true),
  getFriends: vi.fn().mockResolvedValue([createMockUser()]),
  sendFriendRequest: vi.fn().mockResolvedValue(true),
  acceptFriendRequest: vi.fn().mockResolvedValue(true),
  rejectFriendRequest: vi.fn().mockResolvedValue(true),
  removeFriend: vi.fn().mockResolvedValue(true),
  blockUser: vi.fn().mockResolvedValue(true),
  unblockUser: vi.fn().mockResolvedValue(true),
  reportUser: vi.fn().mockResolvedValue(true),
};

// Database Service Mock
export const mockDatabaseService = {
  init: vi.fn().mockResolvedValue(true),
  isReady: vi.fn().mockReturnValue(true),
  query: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  update: vi.fn().mockResolvedValue(true),
  delete: vi.fn().mockResolvedValue(true),
  transaction: vi.fn().mockImplementation((callback) => callback()),
  backup: vi.fn().mockResolvedValue('backup-data'),
  restore: vi.fn().mockResolvedValue(true),
  clear: vi.fn().mockResolvedValue(true),
};

// Sync Service Mock
export const mockSyncService = {
  sync: vi.fn().mockResolvedValue({ success: true, synced: 0, failed: 0 }),
  syncWorkouts: vi.fn().mockResolvedValue(true),
  syncUserData: vi.fn().mockResolvedValue(true),
  syncAchievements: vi.fn().mockResolvedValue(true),
  queueOperation: vi.fn().mockResolvedValue(true),
  getPendingOperations: vi.fn().mockResolvedValue([]),
  clearQueue: vi.fn().mockResolvedValue(true),
  isOnline: vi.fn().mockReturnValue(true),
  getLastSync: vi.fn().mockReturnValue(new Date().toISOString()),
};

// Notification Service Mock
export const mockNotificationService = {
  requestPermission: vi.fn().mockResolvedValue('granted'),
  showNotification: vi.fn().mockResolvedValue(true),
  scheduleNotification: vi.fn().mockResolvedValue(true),
  cancelNotification: vi.fn().mockResolvedValue(true),
  getNotifications: vi.fn().mockResolvedValue([]),
  markAsRead: vi.fn().mockResolvedValue(true),
  clearAll: vi.fn().mockResolvedValue(true),
};

// Analytics Service Mock
export const mockAnalyticsService = {
  track: vi.fn(),
  identify: vi.fn(),
  page: vi.fn(),
  group: vi.fn(),
  alias: vi.fn(),
  reset: vi.fn(),
  getFeatureFlag: vi.fn().mockReturnValue(false),
  isFeatureEnabled: vi.fn().mockReturnValue(false),
};

// Cache Manager Mock
export const mockCacheManager = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(true),
  delete: vi.fn().mockResolvedValue(true),
  clear: vi.fn().mockResolvedValue(true),
  has: vi.fn().mockResolvedValue(false),
  keys: vi.fn().mockResolvedValue([]),
  size: vi.fn().mockResolvedValue(0),
  invalidate: vi.fn().mockResolvedValue(true),
};

// Performance Monitor Mock
export const mockPerformanceMonitor = {
  startTiming: vi.fn().mockReturnValue('timing-id'),
  endTiming: vi.fn().mockReturnValue(100),
  measureRender: vi.fn().mockReturnValue(16.67),
  measureMemory: vi.fn().mockReturnValue({ used: 1024, total: 2048 }),
  trackError: vi.fn(),
  trackMetric: vi.fn(),
  getMetrics: vi.fn().mockReturnValue({}),
};

// Security Service Mock
export const mockSecurityService = {
  sanitizeInput: vi.fn().mockImplementation((input) => input),
  validateInput: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  checkRateLimit: vi.fn().mockReturnValue(true),
  logSecurityEvent: vi.fn(),
  encryptData: vi.fn().mockImplementation((data) => `encrypted:${data}`),
  decryptData: vi.fn().mockImplementation((data) => data.replace('encrypted:', '')),
  generateToken: vi.fn().mockReturnValue('mock-token'),
  validateToken: vi.fn().mockReturnValue(true),
};

// Media Service Mock
export const mockMediaService = {
  uploadImage: vi.fn().mockResolvedValue({ url: 'https://example.com/image.jpg' }),
  uploadVideo: vi.fn().mockResolvedValue({ url: 'https://example.com/video.mp4' }),
  deleteMedia: vi.fn().mockResolvedValue(true),
  getMediaUrl: vi.fn().mockReturnValue('https://example.com/media.jpg'),
  optimizeImage: vi.fn().mockResolvedValue('optimized-image-data'),
  generateThumbnail: vi.fn().mockResolvedValue('thumbnail-data'),
  validateFile: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
};

// Backup Service Mock
export const mockBackupService = {
  createBackup: vi.fn().mockResolvedValue('backup-id'),
  restoreBackup: vi.fn().mockResolvedValue(true),
  listBackups: vi.fn().mockResolvedValue([]),
  deleteBackup: vi.fn().mockResolvedValue(true),
  scheduleBackup: vi.fn().mockResolvedValue(true),
  getBackupStatus: vi.fn().mockReturnValue('idle'),
  exportData: vi.fn().mockResolvedValue('exported-data'),
  importData: vi.fn().mockResolvedValue(true),
};

// Real-time Service Mock
export const mockRealTimeService = {
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn().mockResolvedValue(true),
  subscribe: vi.fn().mockReturnValue(() => {}),
  unsubscribe: vi.fn(),
  emit: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  getConnectionStatus: vi.fn().mockReturnValue('connected'),
};

// Feature Flag Service Mock
export const mockFeatureFlagService = {
  isEnabled: vi.fn().mockReturnValue(false),
  getFlag: vi.fn().mockReturnValue(null),
  getAllFlags: vi.fn().mockReturnValue({}),
  updateFlag: vi.fn().mockResolvedValue(true),
  refresh: vi.fn().mockResolvedValue(true),
};

// Export all mocks
export const mockServices = {
  auth: mockAuthService,
  workout: mockWorkoutService,
  exercise: mockExerciseService,
  gamification: mockGamificationService,
  social: mockSocialService,
  database: mockDatabaseService,
  sync: mockSyncService,
  notification: mockNotificationService,
  analytics: mockAnalyticsService,
  cache: mockCacheManager,
  performance: mockPerformanceMonitor,
  security: mockSecurityService,
  media: mockMediaService,
  backup: mockBackupService,
  realtime: mockRealTimeService,
  featureFlag: mockFeatureFlagService,
};

// Service factory for creating fresh mocks
export const createMockServices = () => ({
  auth: { ...mockAuthService },
  workout: { ...mockWorkoutService },
  exercise: { ...mockExerciseService },
  gamification: { ...mockGamificationService },
  social: { ...mockSocialService },
  database: { ...mockDatabaseService },
  sync: { ...mockSyncService },
  notification: { ...mockNotificationService },
  analytics: { ...mockAnalyticsService },
  cache: { ...mockCacheManager },
  performance: { ...mockPerformanceMonitor },
  security: { ...mockSecurityService },
  media: { ...mockMediaService },
  backup: { ...mockBackupService },
  realtime: { ...mockRealTimeService },
  featureFlag: { ...mockFeatureFlagService },
});