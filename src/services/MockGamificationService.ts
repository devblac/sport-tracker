/**
 * Mock Gamification Service
 * 
 * Temporary implementation that uses localStorage instead of IndexedDB
 * to avoid the IndexedDBManager.getInstance() error while we transition to Supabase.
 */

import { logger } from '@/utils/logger';

export class MockGamificationService {
  private static instance: MockGamificationService;

  private constructor() {
    // Simple constructor without IndexedDB dependency
  }

  public static getInstance(): MockGamificationService {
    if (!MockGamificationService.instance) {
      MockGamificationService.instance = new MockGamificationService();
    }
    return MockGamificationService.instance;
  }

  /**
   * Award XP to user (simplified localStorage version)
   */
  async awardXP(
    userId: string,
    baseAmount: number,
    options: {
      source: string;
      multiplier?: number;
      details?: Record<string, any>;
    }
  ): Promise<{ success: boolean; amount: number }> {
    try {
      const { source, multiplier = 1, details = {} } = options;
      const finalAmount = Math.round(baseAmount * multiplier);

      // Create XP transaction
      const transaction = {
        id: `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        amount: finalAmount,
        baseAmount,
        multiplier,
        source,
        details,
        timestamp: new Date().toISOString()
      };

      // Save to localStorage
      const transactions = JSON.parse(localStorage.getItem(`xp_transactions_${userId}`) || '[]');
      transactions.push(transaction);
      localStorage.setItem(`xp_transactions_${userId}`, JSON.stringify(transactions));

      // Update user total XP
      const currentXP = parseInt(localStorage.getItem(`user_xp_${userId}`) || '0');
      const newXP = currentXP + finalAmount;
      localStorage.setItem(`user_xp_${userId}`, newXP.toString());

      logger.info(`Awarded ${finalAmount} XP to user ${userId} for ${source}`);

      return {
        success: true,
        amount: finalAmount
      };
    } catch (error) {
      logger.error('Error awarding XP:', error);
      return {
        success: false,
        amount: 0
      };
    }
  }

  /**
   * Get user's total XP
   */
  async getUserXP(userId: string): Promise<number> {
    return parseInt(localStorage.getItem(`user_xp_${userId}`) || '0');
  }

  /**
   * Get user's level based on XP
   */
  async getUserLevel(userId: string): Promise<number> {
    const xp = await this.getUserXP(userId);
    // Simple level calculation: level = floor(sqrt(xp / 100))
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)));
  }
}

export default MockGamificationService;