/**
 * Database Service
 * 
 * High-level database service that provides typed operations for the fitness app.
 * Acts as a facade over IndexedDBManager with app-specific methods.
 */

import { IndexedDBManager } from './IndexedDBManager';
import { FITNESS_APP_SCHEMA } from './schema';

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
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.db.initialize();
      this.isInitialized = true;
      console.log('Database initialized successfully');
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

  async createUser(user: any): Promise<string> {
    return await this.db.put('users', user) as string;
  }

  async getUser(userId: string): Promise<any> {
    return await this.db.get('users', userId);
  }

  async updateUser(userId: string, updates: Partial<any>): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    await this.db.put('users', updatedUser);
  }

  async getUserProfile(userId: string): Promise<any> {
    return await this.db.get('userProfiles', userId);
  }

  async updateUserProfile(userId: string, profile: any): Promise<void> {
    const updatedProfile = { ...profile, userId, updatedAt: new Date() };
    await this.db.put('userProfiles', updatedProfile);
  }

  // ============================================================================
  // Exercise Operations
  // ============================================================================

  async createExercise(exercise: any): Promise<string> {
    return await this.db.put('exercises', exercise) as string;
  }

  async getExercise(exerciseId: string): Promise<any> {
    return await this.db.get('exercises', exerciseId);
  }

  async getAllExercises(): Promise<any[]> {
    return await this.db.getAll('exercises');
  }

  async getExercisesByCategory(category: string): Promise<any[]> {
    return await this.db.getAllByIndex('exercises', 'category', category);
  }

  async getExercisesByBodyPart(bodyPart: string): Promise<any[]> {
    return await this.db.getAllByIndex('exercises', 'bodyPart', bodyPart);
  }

  async getExercisesByEquipment(equipment: string): Promise<any[]> {
    return await this.db.getAllByIndex('exercises', 'equipment', equipment);
  }

  async searchExercises(query: string): Promise<any[]> {
    const allExercises = await this.getAllExercises();
    const lowerQuery = query.toLowerCase();
    
    return allExercises.filter(exercise => 
      exercise.name.toLowerCase().includes(lowerQuery) ||
      exercise.category.toLowerCase().includes(lowerQuery) ||
      exercise.bodyPart.toLowerCase().includes(lowerQuery)
    );
  }

  // ============================================================================
  // Workout Operations
  // ============================================================================

  async createWorkout(workout: any): Promise<string> {
    const workoutWithTimestamp = {
      ...workout,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.db.put('workouts', workoutWithTimestamp) as string;
  }

  async getWorkout(workoutId: string): Promise<any> {
    return await this.db.get('workouts', workoutId);
  }

  async getUserWorkouts(userId: string, limit?: number): Promise<any[]> {
    const workouts = await this.db.getAllByIndex('workouts', 'userId', userId);
    
    // Sort by startedAt descending
    workouts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    
    return limit ? workouts.slice(0, limit) : workouts;
  }

  async updateWorkout(workoutId: string, updates: Partial<any>): Promise<void> {
    const workout = await this.getWorkout(workoutId);
    if (!workout) throw new Error('Workout not found');
    
    const updatedWorkout = { ...workout, ...updates, updatedAt: new Date() };
    await this.db.put('workouts', updatedWorkout);
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    // Delete workout and related data
    await this.db.transaction(['workouts', 'workoutExercises', 'workoutSets'], 'readwrite', async (stores) => {
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
    });
  }

  // ============================================================================
  // Social Operations
  // ============================================================================

  async createSocialPost(post: any): Promise<string> {
    const postWithTimestamp = {
      ...post,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.db.put('socialPosts', postWithTimestamp) as string;
  }

  async getSocialPost(postId: string): Promise<any> {
    return await this.db.get('socialPosts', postId);
  }

  async getUserSocialPosts(userId: string, limit?: number): Promise<any[]> {
    const posts = await this.db.getAllByIndex('socialPosts', 'userId', userId);
    
    // Sort by createdAt descending
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? posts.slice(0, limit) : posts;
  }

  async updateSocialPost(postId: string, updates: Partial<any>): Promise<void> {
    const post = await this.getSocialPost(postId);
    if (!post) throw new Error('Post not found');
    
    const updatedPost = { ...post, ...updates, updatedAt: new Date() };
    await this.db.put('socialPosts', updatedPost);
  }

  async deleteSocialPost(postId: string): Promise<void> {
    // Delete post and related engagement data
    await this.db.transaction(['socialPosts', 'postLikes', 'postComments', 'postShares'], 'readwrite', async (stores) => {
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
    });
  }

  private async deleteByIndex(index: IDBIndex, key: IDBValidKey): Promise<void> {
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
    const like = {
      id: `like_${postId}_${userId}_${Date.now()}`,
      postId,
      userId,
      createdAt: new Date()
    };
    return await this.db.put('postLikes', like) as string;
  }

  async removePostLike(postId: string, userId: string): Promise<void> {
    const likes = await this.db.getAllByIndex('postLikes', 'postId_userId', [postId, userId]);
    for (const like of likes) {
      await this.db.delete('postLikes', like.id);
    }
  }

  async getPostLikes(postId: string): Promise<any[]> {
    return await this.db.getAllByIndex('postLikes', 'postId', postId);
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const likes = await this.db.getAllByIndex('postLikes', 'postId_userId', [postId, userId]);
    return likes.length > 0;
  }

  async addPostComment(comment: any): Promise<string> {
    const commentWithTimestamp = {
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.db.put('postComments', commentWithTimestamp) as string;
  }

  async getPostComments(postId: string): Promise<any[]> {
    const comments = await this.db.getAllByIndex('postComments', 'postId', postId);
    
    // Sort by createdAt ascending
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return comments;
  }

  async updatePostComment(commentId: string, updates: Partial<any>): Promise<void> {
    const comment = await this.db.get('postComments', commentId);
    if (!comment) throw new Error('Comment not found');
    
    const updatedComment = { ...comment, ...updates, updatedAt: new Date(), isEdited: true };
    await this.db.put('postComments', updatedComment);
  }

  async deletePostComment(commentId: string): Promise<void> {
    await this.db.delete('postComments', commentId);
  }

  // ============================================================================
  // Privacy Operations
  // ============================================================================

  async getPrivacySettings(userId: string): Promise<any> {
    return await this.db.get('privacySettings', userId);
  }

  async updatePrivacySettings(userId: string, settings: any): Promise<void> {
    const settingsWithTimestamp = {
      ...settings,
      userId,
      updatedAt: new Date()
    };
    await this.db.put('privacySettings', settingsWithTimestamp);
  }

  async addBlockedUser(userId: string, blockedUserId: string, reason?: string): Promise<string> {
    const block = {
      id: `block_${userId}_${blockedUserId}_${Date.now()}`,
      userId,
      blockedUserId,
      reason,
      createdAt: new Date()
    };
    return await this.db.put('blockedUsers', block) as string;
  }

  async removeBlockedUser(userId: string, blockedUserId: string): Promise<void> {
    const blocks = await this.db.getAllByIndex('blockedUsers', 'userId_blockedUserId', [userId, blockedUserId]);
    for (const block of blocks) {
      await this.db.delete('blockedUsers', block.id);
    }
  }

  async getBlockedUsers(userId: string): Promise<any[]> {
    return await this.db.getAllByIndex('blockedUsers', 'userId', userId);
  }

  async isUserBlocked(userId: string, potentiallyBlockedUserId: string): Promise<boolean> {
    const blocks = await this.db.getAllByIndex('blockedUsers', 'userId_blockedUserId', [userId, potentiallyBlockedUserId]);
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
          data: record
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
  }
};