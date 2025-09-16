/**
 * Legacy Compatibility Layer
 * 
 * Provides backward compatibility for existing services that expect the old IndexedDBManager API.
 */

import { getDatabaseService } from './DatabaseService';

// Store constants for backward compatibility
export const STORES = {
  EXERCISES: 'exercises',
  USERS: 'users',
  USER_PROFILES: 'userProfiles',
  WORKOUT_TEMPLATES: 'workoutTemplates',
  WORKOUTS: 'workouts',
  WORKOUT_EXERCISES: 'workoutExercises',
  WORKOUT_SETS: 'workoutSets',
  USER_XP: 'userXP',
  XP_TRANSACTIONS: 'xpTransactions',
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'userAchievements',
  USER_STREAKS: 'userStreaks',
  STREAK_ENTRIES: 'streakEntries',
  STREAK_REWARDS: 'streakRewards',
  FRIENDSHIPS: 'friendships',
  FRIEND_REQUESTS: 'friendRequests',
  SOCIAL_POSTS: 'socialPosts',
  POST_LIKES: 'postLikes',
  POST_COMMENTS: 'postComments',
  POST_SHARES: 'postShares',
  PRIVACY_SETTINGS: 'privacySettings',
  BLOCKED_USERS: 'blockedUsers',
  REPORTED_USERS: 'reportedUsers',
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  PERSONAL_RECORDS: 'personalRecords',
  PROGRESS_SNAPSHOTS: 'progressSnapshots',
  SYNC_QUEUE: 'syncQueue',
  SYNC_METADATA: 'syncMetadata',
  SYNC_CONFLICTS: 'syncConflicts',
  APP_SETTINGS: 'appSettings',
  CACHE: 'cache'
};

// Legacy dbManager proxy that delegates to the new database service
export const dbManager = {
  // Initialization method (for backward compatibility)
  async init(): Promise<void> {
    const service = await ensureInitialized();
    // Database is already initialized by ensureInitialized()
    return Promise.resolve();
  },

  // Basic CRUD operations
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const service = await ensureInitialized();
    return service.getManager().add(storeName, data);
  },

  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const service = await ensureInitialized();
    return service.getManager().put(storeName, data);
  },

  // Legacy update method - just delegates to put since IndexedDB doesn't distinguish
  async update<T>(storeName: string, key: IDBValidKey, data: T): Promise<void> {
    const service = await ensureInitialized();
    await service.getManager().put(storeName, data);
  },

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const service = await ensureInitialized();
    return service.getManager().get(storeName, key);
  },

  async getAll<T>(storeName: string, query?: IDBValidKey | IDBKeyRange, count?: number): Promise<T[]> {
    const service = await ensureInitialized();
    return service.getManager().getAll(storeName, query, count);
  },

  async getAllByIndex<T>(
    storeName: string, 
    indexName: string, 
    query?: IDBValidKey | IDBKeyRange, 
    count?: number
  ): Promise<T[]> {
    const service = await ensureInitialized();
    return service.getManager().getAllByIndex(storeName, indexName, query, count);
  },

  // Alias for getAllByIndex (legacy compatibility)
  async queryByIndex<T>(
    storeName: string, 
    indexName: string, 
    query?: IDBValidKey | IDBKeyRange, 
    count?: number
  ): Promise<T[]> {
    return this.getAllByIndex(storeName, indexName, query, count);
  },

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const service = await ensureInitialized();
    return service.getManager().delete(storeName, key);
  },

  async clear(storeName: string): Promise<void> {
    const service = await ensureInitialized();
    return service.getManager().clear(storeName);
  },

  async count(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    const service = await ensureInitialized();
    return service.getManager().count(storeName, query);
  },

  // Advanced operations
  async transaction<T>(
    storeNames: string[],
    mode: IDBTransactionMode,
    callback: (stores: { [key: string]: IDBObjectStore }) => Promise<T>
  ): Promise<T> {
    const service = await ensureInitialized();
    return service.getManager().transaction(storeNames, mode, callback);
  },

  async iterate<T>(
    storeName: string,
    callback: (cursor: IDBCursorWithValue, record: T) => boolean | Promise<boolean>,
    query?: IDBValidKey | IDBKeyRange,
    direction?: IDBCursorDirection
  ): Promise<void> {
    const service = await ensureInitialized();
    return service.getManager().iterate(storeName, callback, query, direction);
  },

  async bulkPut<T>(storeName: string, records: T[]): Promise<IDBValidKey[]> {
    const service = await ensureInitialized();
    return service.getManager().bulkPut(storeName, records);
  },

  async batch(operations: Array<{
    type: 'add' | 'put' | 'delete';
    storeName: string;
    data?: any;
    key?: IDBValidKey;
  }>): Promise<void> {
    const service = await ensureInitialized();
    return service.getManager().batch(operations);
  },

  // Utility methods
  isInitialized(): boolean {
    const service = getDatabaseService();
    return service.isReady();
  },

  close(): void {
    const service = getDatabaseService();
    return service.close();
  },

  getInfo(): { name: string; version: number; stores: string[] } | null {
    const service = getDatabaseService();
    if (!service.isReady()) return null;
    return service.getManager().getInfo();
  }
};

// Helper function to ensure database is initialized
async function ensureInitialized() {
  const service = getDatabaseService();
  if (!service.isReady()) {
    await service.initialize();
  }
  return service;
}