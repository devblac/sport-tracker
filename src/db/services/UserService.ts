/**
 * User Service
 * 
 * Handles all user-related database operations.
 */

import { BaseService } from './BaseService';
import type { User, UserProfile } from '@/types/database';
import type { IndexedDBManager } from '../IndexedDBManager';

export class UserService extends BaseService<User> {
  constructor(db: IndexedDBManager) {
    super(db, 'users');
  }

  /**
   * Get user by username
   */
  async getByUsername(username: string): Promise<User | undefined> {
    const users = await this.getByIndex('username', username, 1);
    return users[0];
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | undefined> {
    const users = await this.getByIndex('email', email, 1);
    return users[0];
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.getByUsername(username);
    return user === undefined;
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    const user = await this.getByEmail(email);
    return user === undefined;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    return await this.db.get('userProfiles', userId);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const existingProfile = await this.getProfile(userId);
    
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...profile,
      id: userId,
      userId,
      updatedAt: new Date(),
      createdAt: existingProfile?.createdAt || new Date(),
    } as UserProfile;

    await this.db.put('userProfiles', updatedProfile);
  }

  /**
   * Get users by fitness level
   */
  async getByFitnessLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<UserProfile[]> {
    return await this.db.getAllByIndex('userProfiles', 'fitnessLevel', level);
  }

  /**
   * Search users by display name
   */
  async searchByDisplayName(query: string, limit = 20): Promise<UserProfile[]> {
    const allProfiles = await this.db.getAll<UserProfile>('userProfiles');
    const lowerQuery = query.toLowerCase();

    return allProfiles
      .filter(profile => 
        profile.displayName.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit);
  }

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, { lastLoginAt: new Date() });
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<void> {
    await this.update(userId, { isActive: false });
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount(userId: string): Promise<void> {
    await this.update(userId, { isActive: true });
  }
}