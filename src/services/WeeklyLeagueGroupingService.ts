/**
 * Weekly League Grouping Service
 * Implements intelligent automatic grouping for weekly league competitions
 */

import { dbManager } from '@/db/IndexedDBManager';
import { leagueManager } from './LeagueManager';
import { analyticsManager } from './AnalyticsManager';
import { logger } from '@/utils';
import type { UserLeagueStats, LeagueGroup, LeagueParticipant } from '@/types/league';

export interface GroupingConfig {
  groupSize: number;
  maxGroupSize: number;
  minGroupSize: number;
  friendPriorityWeight: number;
  skillBalanceWeight: number;
  activityLevelWeight: number;
}

export interface GroupingResult {
  success: boolean;
  groupsCreated: number;
  totalParticipants: number;
  averageGroupSize: number;
  friendPairsPreserved: number;
  skillVarianceReduction: number;
}

export class WeeklyLeagueGroupingService {
  private static instance: WeeklyLeagueGroupingService;
  
  private readonly defaultConfig: GroupingConfig = {
    groupSize: 20,
    maxGroupSize: 25,
    minGroupSize: 15,
    friendPriorityWeight: 0.3,
    skillBalanceWeight: 0.5,
    activityLevelWeight: 0.2
  };

  private constructor() {}

  public static getInstance(): WeeklyLeagueGroupingService {
    if (!WeeklyLeagueGroupingService.instance) {
      WeeklyLeagueGroupingService.instance = new WeeklyLeagueGroupingService();
    }
    return WeeklyLeagueGroupingService.instance;
  }

  /**
   * Execute weekly grouping for all leagues
   */
  async executeWeeklyGrouping(config: Partial<GroupingConfig> = {}): Promise<GroupingResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      await dbManager.init();
      
      logger.info('Starting weekly league grouping', { config: finalConfig });
      
      // Get all active users with league stats
      const allUsers = await dbManager.getAll<UserLeagueStats>('userLeagueStats');
      const activeUsers = await this.filterActiveUsers(allUsers);
      
      if (activeUsers.length < finalConfig.minGroupSize) {
        logger.warn('Not enough active users for grouping', { 
          activeUsers: activeUsers.length, 
          required: finalConfig.minGroupSize 
        });
        return {
          success: false,
          groupsCreated: 0,
          totalParticipants: 0,
          averageGroupSize: 0,
          friendPairsPreserved: 0,
          skillVarianceReduction: 0
        };
      }

      // Group users by league level
      const usersByLeague = this.groupUsersByLeague(activeUsers);
      
      let totalGroupsCreated = 0;
      let totalParticipants = 0;
      let totalFriendPairs = 0;
      let totalSkillVariance = 0;

      // Create groups for each league
      for (const [leagueId, users] of usersByLeague.entries()) {
        const leagueResult = await this.createGroupsForLeague(
          leagueId, 
          users, 
          finalConfig
        );
        
        totalGroupsCreated += leagueResult.groupsCreated;
        totalParticipants += leagueResult.totalParticipants;
        totalFriendPairs += leagueResult.friendPairsPreserved;
        totalSkillVariance += leagueResult.skillVarianceReduction;
      }

      const result: GroupingResult = {
        success: true,
        groupsCreated: totalGroupsCreated,
        totalParticipants,
        averageGroupSize: totalParticipants / Math.max(totalGroupsCreated, 1),
        friendPairsPreserved: totalFriendPairs,
        skillVarianceReduction: totalSkillVariance / Math.max(usersByLeague.size, 1)
      };

      // Track analytics
      analyticsManager.track('weekly_grouping_completed', {
        groups_created: result.groupsCreated,
        total_participants: result.totalParticipants,
        average_group_size: result.averageGroupSize,
        friend_pairs_preserved: result.friendPairsPreserved
      });

      logger.info('Weekly league grouping completed', result);
      return result;

    } catch (error) {
      logger.error('Error in weekly league grouping', error);
      return {
        success: false,
        groupsCreated: 0,
        totalParticipants: 0,
        averageGroupSize: 0,
        friendPairsPreserved: 0,
        skillVarianceReduction: 0
      };
    }
  }

  /**
   * Filter users who are active enough to participate in leagues
   */
  private async filterActiveUsers(users: UserLeagueStats[]): Promise<UserLeagueStats[]> {
    const activeThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const now = Date.now();
    
    // In a real implementation, we'd check last workout date from the database
    // For now, we'll consider all users with points as active
    return users.filter(user => {
      // User must have some activity (points > 0)
      if (user.totalPoints === 0) return false;
      
      // User must not be in a current active group
      // (This would be checked against current week's groups)
      
      return true;
    });
  }

  /**
   * Group users by their current league level
   */
  private groupUsersByLeague(users: UserLeagueStats[]): Map<string, UserLeagueStats[]> {
    const usersByLeague = new Map<string, UserLeagueStats[]>();
    
    users.forEach(user => {
      const leagueId = user.currentLeague;
      if (!usersByLeague.has(leagueId)) {
        usersByLeague.set(leagueId, []);
      }
      usersByLeague.get(leagueId)!.push(user);
    });
    
    return usersByLeague;
  }

  /**
   * Create groups for a specific league using intelligent matching
   */
  private async createGroupsForLeague(
    leagueId: string, 
    users: UserLeagueStats[], 
    config: GroupingConfig
  ): Promise<GroupingResult> {
    try {
      // Get friend relationships
      const friendPairs = await this.getFriendPairs(users);
      
      // Calculate user activity levels
      const userActivities = await this.calculateUserActivities(users);
      
      // Sort users by skill level (total points) for balanced grouping
      const sortedUsers = [...users].sort((a, b) => a.totalPoints - b.totalPoints);
      
      // Create balanced groups using intelligent algorithm
      const groups = this.createBalancedGroups(
        sortedUsers,
        friendPairs,
        userActivities,
        config
      );
      
      // Save groups to database
      const currentWeek = this.getCurrentWeek();
      let groupsCreated = 0;
      let friendPairsPreserved = 0;
      
      for (let i = 0; i < groups.length; i++) {
        const groupId = `${leagueId}_${currentWeek.year}_${currentWeek.week}_${i}`;
        
        const leagueGroup: LeagueGroup = {
          id: groupId,
          leagueId,
          weekNumber: currentWeek.week,
          year: currentWeek.year,
          participants: groups[i].map((user, index) => ({
            userId: user.userId,
            username: `User${user.userId.slice(-4)}`, // This should come from user profile
            currentPoints: user.totalPoints,
            weeklyPoints: 0, // Reset for new week
            position: index + 1,
            trend: 'stable',
            isFriend: false, // Will be updated based on current user context
            isCurrentUser: false,
            joinedAt: Date.now()
          })),
          startDate: this.getWeekStart().getTime(),
          endDate: this.getWeekEnd().getTime(),
          status: 'active',
          promotionZone: [1, 2, 3, 4, 5],
          relegationZone: Array.from({ length: 5 }, (_, i) => groups[i].length - 4 + i)
        };

        await dbManager.put('leagueGroups', leagueGroup);
        
        // Update user stats with new group
        for (const user of groups[i]) {
          user.currentGroup = groupId;
          user.weeklyPoints = 0; // Reset weekly points
          await dbManager.put('userLeagueStats', user);
        }
        
        groupsCreated++;
        
        // Count preserved friend pairs in this group
        friendPairsPreserved += this.countFriendPairsInGroup(groups[i], friendPairs);
      }
      
      return {
        success: true,
        groupsCreated,
        totalParticipants: users.length,
        averageGroupSize: users.length / groupsCreated,
        friendPairsPreserved,
        skillVarianceReduction: this.calculateSkillVarianceReduction(groups)
      };
      
    } catch (error) {
      logger.error('Error creating groups for league', { leagueId, error });
      throw error;
    }
  }

  /**
   * Create balanced groups using intelligent matching algorithm
   */
  private createBalancedGroups(
    sortedUsers: UserLeagueStats[],
    friendPairs: Map<string, string[]>,
    userActivities: Map<string, number>,
    config: GroupingConfig
  ): UserLeagueStats[][] {
    const groups: UserLeagueStats[][] = [];
    const usedUsers = new Set<string>();
    
    // Snake draft algorithm for balanced skill distribution
    let currentGroup: UserLeagueStats[] = [];
    let direction = 1; // 1 for forward, -1 for backward
    
    for (const user of sortedUsers) {
      if (usedUsers.has(user.userId)) continue;
      
      // Start new group if current is full
      if (currentGroup.length >= config.groupSize) {
        groups.push([...currentGroup]);
        currentGroup = [];
        direction *= -1; // Reverse direction for snake draft
      }
      
      // Add user to current group
      currentGroup.push(user);
      usedUsers.add(user.userId);
      
      // Try to add friends to the same group
      const friends = friendPairs.get(user.userId) || [];
      for (const friendId of friends) {
        if (currentGroup.length >= config.maxGroupSize) break;
        if (usedUsers.has(friendId)) continue;
        
        const friendUser = sortedUsers.find(u => u.userId === friendId);
        if (friendUser) {
          currentGroup.push(friendUser);
          usedUsers.add(friendId);
        }
      }
    }
    
    // Add remaining users to last group or create new one
    if (currentGroup.length > 0) {
      if (groups.length > 0 && 
          groups[groups.length - 1].length + currentGroup.length <= config.maxGroupSize &&
          currentGroup.length < config.minGroupSize) {
        // Merge with last group if it makes sense
        groups[groups.length - 1].push(...currentGroup);
      } else {
        groups.push(currentGroup);
      }
    }
    
    return groups;
  }

  /**
   * Get friend relationships for users
   */
  private async getFriendPairs(users: UserLeagueStats[]): Promise<Map<string, string[]>> {
    const friendPairs = new Map<string, string[]>();
    
    try {
      // Get all friendships from database
      const friendships = await dbManager.getAll<any>('friendships');
      
      // Build friend map for users in this league
      const userIds = new Set(users.map(u => u.userId));
      
      friendships.forEach(friendship => {
        if (friendship.status === 'accepted' && 
            userIds.has(friendship.userId) && 
            userIds.has(friendship.friendId)) {
          
          if (!friendPairs.has(friendship.userId)) {
            friendPairs.set(friendship.userId, []);
          }
          friendPairs.get(friendship.userId)!.push(friendship.friendId);
          
          if (!friendPairs.has(friendship.friendId)) {
            friendPairs.set(friendship.friendId, []);
          }
          friendPairs.get(friendship.friendId)!.push(friendship.userId);
        }
      });
      
    } catch (error) {
      logger.warn('Error getting friend pairs', error);
    }
    
    return friendPairs;
  }

  /**
   * Calculate user activity levels based on recent workouts
   */
  private async calculateUserActivities(users: UserLeagueStats[]): Promise<Map<string, number>> {
    const activities = new Map<string, number>();
    
    try {
      // In a real implementation, this would query recent workouts
      // For now, we'll use total points as a proxy for activity
      users.forEach(user => {
        const activityScore = Math.min(user.totalPoints / 1000, 10); // Normalize to 0-10
        activities.set(user.userId, activityScore);
      });
      
    } catch (error) {
      logger.warn('Error calculating user activities', error);
    }
    
    return activities;
  }

  /**
   * Count friend pairs preserved in a group
   */
  private countFriendPairsInGroup(
    group: UserLeagueStats[], 
    friendPairs: Map<string, string[]>
  ): number {
    let count = 0;
    const groupUserIds = new Set(group.map(u => u.userId));
    
    group.forEach(user => {
      const friends = friendPairs.get(user.userId) || [];
      friends.forEach(friendId => {
        if (groupUserIds.has(friendId)) {
          count++;
        }
      });
    });
    
    return Math.floor(count / 2); // Divide by 2 to avoid double counting
  }

  /**
   * Calculate skill variance reduction across groups
   */
  private calculateSkillVarianceReduction(groups: UserLeagueStats[][]): number {
    if (groups.length === 0) return 0;
    
    let totalVariance = 0;
    
    groups.forEach(group => {
      const points = group.map(u => u.totalPoints);
      const mean = points.reduce((a, b) => a + b, 0) / points.length;
      const variance = points.reduce((acc, point) => acc + Math.pow(point - mean, 2), 0) / points.length;
      totalVariance += variance;
    });
    
    return totalVariance / groups.length;
  }

  /**
   * Get current week information
   */
  private getCurrentWeek(): { week: number; year: number } {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    return { week, year };
  }

  /**
   * Get week number of the year
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get start of current week (Monday)
   */
  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  /**
   * Get end of current week (Sunday)
   */
  private getWeekEnd(): Date {
    const weekStart = this.getWeekStart();
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  }
}

export const weeklyLeagueGroupingService = WeeklyLeagueGroupingService.getInstance();

// Export types for convenience
export type { GroupingConfig, GroupingResult } from './WeeklyLeagueGroupingService';