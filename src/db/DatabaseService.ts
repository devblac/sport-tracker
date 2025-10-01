/**
 * Database Service
 *
 * High-level database service that provides typed operations for the fitness app.
 * Acts as a facade over IndexedDBManager with app-specific methods.
 */

import { IndexedDBManager } from './IndexedDBManager';
import { FITNESS_APP_SCHEMA } from './schema';
import { ValidationService } from './services/ValidationService';
import { DatabaseErrorHandler, EntityNotFoundError } from './errors/DatabaseErrors';
import { performanceMonitor } from './utils/PerformanceMonitor';
import type { 
  User, 
  UserProfile, 
  Exercise, 
  Workout, 
  SocialPost, 
  PostLike, 
  PostComment,
  PrivacySettings,
  BlockedUser
} from '@/types/database';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: IndexedDBManager;
  private isInitialized = false;

  private constructor() {
    this.db = new IndexedDBManager(FITNESS_APP_SCHEMA);
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize the database with performance optimizations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing database service...');

      // Check if db is properly initialized
      if (!this.db) {
        throw new Error('IndexedDBManager not properly initialized');
      }

      console.log('Calling IndexedDBManager.initialize()...');
      await this.db.initialize();

      console.log(
        'IndexedDBManager initialized, checking getDatabase method...'
      );

      // Check if getDatabase method exists
      if (typeof this.db.getDatabase !== 'function') {
        console.error(
          'getDatabase method not found on IndexedDBManager:',
          this.db
        );
        throw new Error('IndexedDBManager.getDatabase is not a function');
      }

      // Database initialization completed successfully
      console.log('Database instance available and ready for use');

      this.isInitialized = true;
      console.log(
        'Database initialized successfully with performance optimizations'
      );
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Check if database is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.db.isInitialized();
  }

  /**
   * Get the underlying IndexedDBManager (for advanced operations)
   */
  getManager(): IndexedDBManager {
    if (!this.isReady()) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ============================================================================
  // User Operations
  // ============================================================================

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate and sanitize input
      const validatedUser = ValidationService.validateUser(user);
      
      // Check for duplicate username/email
      const existingUsername = await this.db.getAllByIndex<User>('users', 'username', validatedUser.username);
      if (existingUsername.length > 0) {
        throw new Error('Username already exists');
      }
      
      const existingEmail = await this.db.getAllByIndex<User>('users', 'email', validatedUser.email);
      if (existingEmail.length > 0) {
        throw new Error('Email already exists');
      }

      const userWithTimestamps: User = {
        ...validatedUser,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await this.db.put('users', userWithTimestamps);
      performanceMonitor.recordOperation('createUser', 'users', 0, true, 1);
      return result as string;
    } catch (error) {
      performanceMonitor.recordOperation('createUser', 'users', 0, false);
      throw DatabaseErrorHandler.handleIndexedDBError(error as Error, 'create', 'users');
    }
  }

  async getUser(userId: string): Promise<User | undefined> {
    return await this.db.get('users', userId);
  }

  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const updatedUser: User = { ...user, ...updates, updatedAt: new Date() };
    await this.db.put('users', updatedUser);
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return await this.db.get('userProfiles', userId);
  }

  async updateUserProfile(userId: string, profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      // Validate UUID format
      if (!ValidationService.validateUUID(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Validate and sanitize input
      const validatedProfile = ValidationService.validateUserProfile(profile);
      
      const existingProfile = await this.getUserProfile(userId);
      const updatedProfile: UserProfile = { 
        ...validatedProfile, 
        id: userId,
        userId, 
        createdAt: existingProfile?.createdAt || new Date(),
        updatedAt: new Date() 
      };
      
      await this.db.put('userProfiles', updatedProfile);
      performanceMonitor.recordOperation('updateUserProfile', 'userProfiles', 0, true, 1);
    } catch (error) {
      performanceMonitor.recordOperation('updateUserProfile', 'userProfiles', 0, false);
      throw DatabaseErrorHandler.handleIndexedDBError(error as Error, 'update', 'userProfiles');
    }
  }

  // ============================================================================
  // Exercise Operations
  // ============================================================================

  async createExercise(exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate and sanitize input
      const validatedExercise = ValidationService.validateExercise(exercise);
      
      const exerciseWithTimestamps: Exercise = {
        ...validatedExercise,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await this.db.put('exercises', exerciseWithTimestamps);
      performanceMonitor.recordOperation('createExercise', 'exercises', 0, true, 1);
      return result as string;
    } catch (error) {
      performanceMonitor.recordOperation('createExercise', 'exercises', 0, false);
      throw DatabaseErrorHandler.handleIndexedDBError(error as Error, 'create', 'exercises');
    }
  }

  async getExercise(exerciseId: string): Promise<Exercise | undefined> {
    return await this.db.get('exercises', exerciseId);
  }

  async getAllExercises(): Promise<Exercise[]> {
    return await this.db.getAll('exercises');
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return await this.db.getAllByIndex('exercises', 'category', category);
  }

  async getExercisesByBodyPart(bodyPart: string): Promise<Exercise[]> {
    return await this.db.getAllByIndex('exercises', 'bodyPart', bodyPart);
  }

  async getExercisesByEquipment(equipment: string): Promise<Exercise[]> {
    return await this.db.getAllByIndex('exercises', 'equipment', equipment);
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    const allExercises = await this.getAllExercises();
    const lowerQuery = query.toLowerCase();

    return allExercises.filter(
      (exercise: Exercise) =>
        exercise.name.toLowerCase().includes(lowerQuery) ||
        exercise.category.toLowerCase().includes(lowerQuery) ||
        exercise.bodyPart.toLowerCase().includes(lowerQuery)
    );
  }

  // ============================================================================
  // Workout Operations
  // ============================================================================

  async createWorkout(workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const workoutWithTimestamp: Workout = {
      ...workout,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return (await this.db.put('workouts', workoutWithTimestamp)) as string;
  }

  async getWorkout(workoutId: string): Promise<Workout | undefined> {
    return await this.db.get('workouts', workoutId);
  }

  async getUserWorkouts(userId: string, limit?: number): Promise<Workout[]> {
    const workouts = await this.db.getAllByIndex<Workout>('workouts', 'userId', userId);

    // Sort by startedAt descending
    workouts.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return limit ? workouts.slice(0, limit) : workouts;
  }

  async updateWorkout(workoutId: string, updates: Partial<Omit<Workout, 'id' | 'createdAt'>>): Promise<void> {
    const workout = await this.getWorkout(workoutId);
    if (!workout) throw new Error('Workout not found');

    const updatedWorkout: Workout = { ...workout, ...updates, updatedAt: new Date() };
    await this.db.put('workouts', updatedWorkout);
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    // Delete workout and related data
    await this.db.transaction(
      ['workouts', 'workoutExercises', 'workoutSets'],
      'readwrite',
      async stores => {
        // Delete workout
        await new Promise<void>((resolve, reject) => {
          const request = stores.workouts.delete(workoutId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });

        // Delete workout exercises
        const exercisesIndex = stores.workoutExercises.index('workoutId');
        await new Promise<void>((resolve, reject) => {
          const request = exercisesIndex.openCursor(workoutId);
          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              cursor.delete();
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
        });

        // Delete workout sets would require additional logic to find sets by workout exercise IDs
      }
    );
  }

  // ============================================================================
  // Social Operations
  // ============================================================================

  async createSocialPost(post: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'sharesCount'>, currentUserId: string): Promise<string> {
    try {
      // Validate user ownership
      ValidationService.validateOwnership(post.userId, currentUserId);
      
      // Rate limiting for post creation
      ValidationService.checkRateLimit(currentUserId, 'createPost', 10, 60000); // 10 posts per minute
      
      // Validate and sanitize input
      const validatedPost = ValidationService.validateSocialPost(post);
      
      const postWithTimestamp: SocialPost = {
        ...validatedPost,
        userId: currentUserId, // Ensure userId matches current user
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      };
      
      const result = await this.db.put('socialPosts', postWithTimestamp);
      performanceMonitor.recordOperation('createSocialPost', 'socialPosts', 0, true, 1);
      return result as string;
    } catch (error) {
      performanceMonitor.recordOperation('createSocialPost', 'socialPosts', 0, false);
      throw DatabaseErrorHandler.handleIndexedDBError(error as Error, 'create', 'socialPosts');
    }
  }

  async getSocialPost(postId: string): Promise<SocialPost | undefined> {
    return await this.db.get('socialPosts', postId);
  }

  async getUserSocialPosts(userId: string, limit?: number): Promise<SocialPost[]> {
    const posts = await this.db.getAllByIndex<SocialPost>('socialPosts', 'userId', userId);

    // Sort by createdAt descending
    posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return limit ? posts.slice(0, limit) : posts;
  }

  async updateSocialPost(postId: string, updates: Partial<Omit<SocialPost, 'id' | 'createdAt'>>): Promise<void> {
    const post = await this.getSocialPost(postId);
    if (!post) throw new Error('Post not found');

    const updatedPost: SocialPost = { ...post, ...updates, updatedAt: new Date() };
    await this.db.put('socialPosts', updatedPost);
  }

  async deleteSocialPost(postId: string): Promise<void> {
    // Delete post and related engagement data
    await this.db.transaction(
      ['socialPosts', 'postLikes', 'postComments', 'postShares'],
      'readwrite',
      async stores => {
        // Delete post
        await new Promise<void>((resolve, reject) => {
          const request = stores.socialPosts.delete(postId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });

        // Delete likes
        const likesIndex = stores.postLikes.index('postId');
        await this.deleteByIndex(likesIndex, postId);

        // Delete comments
        const commentsIndex = stores.postComments.index('postId');
        await this.deleteByIndex(commentsIndex, postId);

        // Delete shares
        const sharesIndex = stores.postShares.index('postId');
        await this.deleteByIndex(sharesIndex, postId);
      }
    );
  }

  private async deleteByIndex(
    index: IDBIndex,
    key: IDBValidKey
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = index.openCursor(key);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================================================
  // Engagement Operations
  // ============================================================================

  async addPostLike(postId: string, userId: string): Promise<string> {
    const like: PostLike = {
      id: `like_${postId}_${userId}_${Date.now()}`,
      postId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return (await this.db.put('postLikes', like)) as string;
  }

  async removePostLike(postId: string, userId: string): Promise<void> {
    const likes = await this.db.getAllByIndex<PostLike>('postLikes', 'postId_userId', [
      postId,
      userId,
    ]);
    for (const like of likes) {
      await this.db.delete('postLikes', like.id);
    }
  }

  async getPostLikes(postId: string): Promise<PostLike[]> {
    return await this.db.getAllByIndex('postLikes', 'postId', postId);
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const likes = await this.db.getAllByIndex('postLikes', 'postId_userId', [
      postId,
      userId,
    ]);
    return likes.length > 0;
  }

  async addPostComment(comment: Omit<PostComment, 'id' | 'createdAt' | 'updatedAt' | 'isEdited' | 'likesCount'>): Promise<string> {
    const commentWithTimestamp: PostComment = {
      ...comment,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
      likesCount: 0,
    };
    return (await this.db.put('postComments', commentWithTimestamp)) as string;
  }

  async getPostComments(postId: string): Promise<PostComment[]> {
    const comments = await this.db.getAllByIndex<PostComment>(
      'postComments',
      'postId',
      postId
    );

    // Sort by createdAt ascending
    comments.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return comments;
  }

  async updatePostComment(
    commentId: string,
    updates: Partial<Omit<PostComment, 'id' | 'createdAt'>>
  ): Promise<void> {
    const comment = await this.db.get<PostComment>('postComments', commentId);
    if (!comment) throw new Error('Comment not found');

    const updatedComment: PostComment = {
      ...comment,
      ...updates,
      updatedAt: new Date(),
      isEdited: true,
    };
    await this.db.put('postComments', updatedComment);
  }

  async deletePostComment(commentId: string): Promise<void> {
    await this.db.delete('postComments', commentId);
  }

  // ============================================================================
  // Privacy Operations
  // ============================================================================

  async getPrivacySettings(userId: string): Promise<PrivacySettings | undefined> {
    return await this.db.get('privacySettings', userId);
  }

  async updatePrivacySettings(userId: string, settings: Omit<PrivacySettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const settingsWithTimestamp: PrivacySettings = {
      ...settings,
      id: userId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.db.put('privacySettings', settingsWithTimestamp);
  }

  async addBlockedUser(
    userId: string,
    blockedUserId: string,
    reason?: string
  ): Promise<string> {
    const block: BlockedUser = {
      id: `block_${userId}_${blockedUserId}_${Date.now()}`,
      userId,
      blockedUserId,
      reason,
      createdAt: new Date(),
      updatedAt: new Date(),
      blockedAt: new Date(),
    };
    return (await this.db.put('blockedUsers', block)) as string;
  }

  async removeBlockedUser(
    userId: string,
    blockedUserId: string
  ): Promise<void> {
    const blocks = await this.db.getAllByIndex<BlockedUser>(
      'blockedUsers',
      'userId_blockedUserId',
      [userId, blockedUserId]
    );
    for (const block of blocks) {
      await this.db.delete('blockedUsers', block.id);
    }
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    return await this.db.getAllByIndex('blockedUsers', 'userId', userId);
  }

  async isUserBlocked(
    userId: string,
    potentiallyBlockedUserId: string
  ): Promise<boolean> {
    const blocks = await this.db.getAllByIndex(
      'blockedUsers',
      'userId_blockedUserId',
      [userId, potentiallyBlockedUserId]
    );
    return blocks.length > 0;
  }

  // ============================================================================
  // Utility Operations
  // ============================================================================

  async clearAllData(): Promise<void> {
    const storeNames = FITNESS_APP_SCHEMA.stores.map(store => store.name);

    for (const storeName of storeNames) {
      await this.db.clear(storeName);
    }
  }

  async getStorageInfo(): Promise<{
    stores: Array<{ name: string; count: number }>;
    totalRecords: number;
  }> {
    const stores = [];
    let totalRecords = 0;

    for (const storeSchema of FITNESS_APP_SCHEMA.stores) {
      const count = await this.db.count(storeSchema.name);
      stores.push({ name: storeSchema.name, count });
      totalRecords += count;
    }

    return { stores, totalRecords };
  }

  /**
   * Export data for backup
   */
  async exportData(): Promise<{ [storeName: string]: any[] }> {
    const data: { [storeName: string]: any[] } = {};

    for (const storeSchema of FITNESS_APP_SCHEMA.stores) {
      data[storeSchema.name] = await this.db.getAll(storeSchema.name);
    }

    return data;
  }

  /**
   * Import data from backup
   */
  async importData(data: { [storeName: string]: any[] }): Promise<void> {
    const operations = [];

    for (const [storeName, records] of Object.entries(data)) {
      for (const record of records) {
        operations.push({
          type: 'put' as const,
          storeName,
          data: record,
        });
      }
    }

    await this.db.batch(operations);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    this.isInitialized = false;
  }
}

// Export a function to get the database service instance
// This avoids circular dependency issues during module loading
export function getDatabaseService(): DatabaseService {
  return DatabaseService.getInstance();
}

// For convenience, also export the instance (but lazily)
export const databaseService = {
  get instance() {
    return DatabaseService.getInstance();
  },
};
