/**
 * League Promotion/Relegation Service
 * Handles automatic promotion and relegation at the end of each week
 */

import { dbManager } from '@/db/IndexedDBManager';
import { leagueManager } from './LeagueManager';
import { analyticsManager } from './AnalyticsManager';
import { logger } from '@/utils';
import type { LeagueGroup, UserLeagueStats, League } from '@/types/league';

export interface PromotionRelegationResult {
  success: boolean;
  groupsProcessed: number;
  promotions: number;
  relegations: number;
  stayedSame: number;
  errors: string[];
}

export interface UserLeagueChange {
  userId: string;
  username: string;
  fromLeague: string;
  toLeague: string;
  finalPosition: number;
  weeklyPoints: number;
  changeType: 'promoted' | 'relegated' | 'stayed';
}

export class LeaguePromotionRelegationService {
  private static instance: LeaguePromotionRelegationService;

  private constructor() {}

  public static getInstance(): LeaguePromotionRelegationService {
    if (!LeaguePromotionRelegationService.instance) {
      LeaguePromotionRelegationService.instance = new LeaguePromotionRelegationService();
    }
    return LeaguePromotionRelegationService.instance;
  }

  /**
   * Process all weekly results and handle promotions/relegations
   */
  async processWeeklyResults(): Promise<PromotionRelegationResult> {
    try {
      await dbManager.init();
      
      logger.info('Starting weekly promotion/relegation processing');
      
      const currentWeek = this.getCurrentWeek();
      
      // Get all active groups for the current week
      const activeGroups = await this.getActiveGroupsForWeek(currentWeek);
      
      if (activeGroups.length === 0) {
        logger.warn('No active groups found for current week', currentWeek);
        return {
          success: true,
          groupsProcessed: 0,
          promotions: 0,
          relegations: 0,
          stayedSame: 0,
          errors: []
        };
      }

      let totalPromotions = 0;
      let totalRelegations = 0;
      let totalStayed = 0;
      const errors: string[] = [];
      const allChanges: UserLeagueChange[] = [];

      // Process each group
      for (const group of activeGroups) {
        try {
          const groupResult = await this.processGroupResults(group);
          totalPromotions += groupResult.promotions;
          totalRelegations += groupResult.relegations;
          totalStayed += groupResult.stayedSame;
          allChanges.push(...groupResult.changes);
        } catch (error) {
          const errorMsg = `Error processing group ${group.id}: ${error}`;
          logger.error(errorMsg, error);
          errors.push(errorMsg);
        }
      }

      // Send notifications for league changes
      await this.sendLeagueChangeNotifications(allChanges);

      // Track analytics
      analyticsManager.track('weekly_promotion_relegation_completed', {
        groups_processed: activeGroups.length,
        total_promotions: totalPromotions,
        total_relegations: totalRelegations,
        total_stayed: totalStayed,
        errors_count: errors.length
      });

      const result: PromotionRelegationResult = {
        success: errors.length === 0,
        groupsProcessed: activeGroups.length,
        promotions: totalPromotions,
        relegations: totalRelegations,
        stayedSame: totalStayed,
        errors
      };

      logger.info('Weekly promotion/relegation processing completed', result);
      return result;

    } catch (error) {
      logger.error('Error in weekly promotion/relegation processing', error);
      return {
        success: false,
        groupsProcessed: 0,
        promotions: 0,
        relegations: 0,
        stayedSame: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Process results for a single group
   */
  private async processGroupResults(group: LeagueGroup): Promise<{
    promotions: number;
    relegations: number;
    stayedSame: number;
    changes: UserLeagueChange[];
  }> {
    // Sort participants by weekly points (descending)
    const sortedParticipants = [...group.participants].sort((a, b) => b.weeklyPoints - a.weeklyPoints);
    
    let promotions = 0;
    let relegations = 0;
    let stayedSame = 0;
    const changes: UserLeagueChange[] = [];

    // Get all leagues for level calculations
    const allLeagues = leagueManager.getAllLeagues();
    const currentLeague = allLeagues.find(l => l.id === group.leagueId);
    
    if (!currentLeague) {
      throw new Error(`League not found: ${group.leagueId}`);
    }

    // Process each participant
    for (let i = 0; i < sortedParticipants.length; i++) {
      const participant = sortedParticipants[i];
      const finalPosition = i + 1;
      
      // Get user's current league stats
      const userStats = await dbManager.get<UserLeagueStats>('userLeagueStats', participant.userId);
      if (!userStats) {
        logger.warn(`User stats not found for user: ${participant.userId}`);
        continue;
      }

      let changeType: 'promoted' | 'relegated' | 'stayed' = 'stayed';
      let newLeagueId = currentLeague.id;

      // Determine if user should be promoted, relegated, or stay
      if (group.promotionZone.includes(finalPosition) && currentLeague.level < 10) {
        // Promote to next league
        const nextLeague = allLeagues.find(l => l.level === currentLeague.level + 1);
        if (nextLeague) {
          newLeagueId = nextLeague.id;
          changeType = 'promoted';
          promotions++;
          
          // Update user stats
          userStats.currentLeague = newLeagueId;
          userStats.promotions++;
          userStats.weeksInCurrentLeague = 0;
          
          // Update best league if this is higher
          const bestLeague = allLeagues.find(l => l.id === userStats.bestLeague);
          if (!bestLeague || nextLeague.level > bestLeague.level) {
            userStats.bestLeague = newLeagueId;
          }
        }
      } else if (group.relegationZone.includes(finalPosition) && currentLeague.level > 1) {
        // Relegate to previous league
        const prevLeague = allLeagues.find(l => l.level === currentLeague.level - 1);
        if (prevLeague) {
          newLeagueId = prevLeague.id;
          changeType = 'relegated';
          relegations++;
          
          // Update user stats
          userStats.currentLeague = newLeagueId;
          userStats.relegations++;
          userStats.weeksInCurrentLeague = 0;
        }
      } else {
        // Stay in current league
        stayedSame++;
        userStats.weeksInCurrentLeague++;
      }

      // Reset weekly points and update position
      userStats.weeklyPoints = 0;
      userStats.position = finalPosition;

      // Save updated user stats
      await dbManager.put('userLeagueStats', userStats);

      // Track the change
      changes.push({
        userId: participant.userId,
        username: participant.username,
        fromLeague: currentLeague.name,
        toLeague: allLeagues.find(l => l.id === newLeagueId)?.name || currentLeague.name,
        finalPosition,
        weeklyPoints: participant.weeklyPoints,
        changeType
      });

      // Track individual promotion/relegation
      if (changeType !== 'stayed') {
        analyticsManager.track(`league_${changeType}`, {
          user_id: participant.userId,
          from_league: currentLeague.id,
          to_league: newLeagueId,
          final_position: finalPosition,
          weekly_points: participant.weeklyPoints,
          weeks_in_league: userStats.weeksInCurrentLeague
        });
      }
    }

    // Mark group as completed
    group.status = 'completed';
    await dbManager.put('leagueGroups', group);

    return {
      promotions,
      relegations,
      stayedSame,
      changes
    };
  }

  /**
   * Send notifications for league changes
   */
  private async sendLeagueChangeNotifications(changes: UserLeagueChange[]): Promise<void> {
    try {
      // In a real implementation, this would integrate with the notification service
      for (const change of changes) {
        if (change.changeType === 'promoted') {
          // Send promotion notification
          logger.info(`Sending promotion notification to ${change.userId}`, {
            fromLeague: change.fromLeague,
            toLeague: change.toLeague,
            position: change.finalPosition
          });
          
          // Create notification record
          const notification = {
            id: `league_promotion_${change.userId}_${Date.now()}`,
            userId: change.userId,
            type: 'league_promotion',
            title: '🎉 League Promotion!',
            message: `Congratulations! You've been promoted from ${change.fromLeague} to ${change.toLeague} League!`,
            data: {
              fromLeague: change.fromLeague,
              toLeague: change.toLeague,
              finalPosition: change.finalPosition,
              weeklyPoints: change.weeklyPoints
            },
            isRead: false,
            createdAt: Date.now()
          };
          
          await dbManager.put('notifications', notification);
          
        } else if (change.changeType === 'relegated') {
          // Send relegation notification
          logger.info(`Sending relegation notification to ${change.userId}`, {
            fromLeague: change.fromLeague,
            toLeague: change.toLeague,
            position: change.finalPosition
          });
          
          const notification = {
            id: `league_relegation_${change.userId}_${Date.now()}`,
            userId: change.userId,
            type: 'league_relegation',
            title: '📉 League Relegation',
            message: `You've been moved from ${change.fromLeague} to ${change.toLeague} League. Keep training to climb back up!`,
            data: {
              fromLeague: change.fromLeague,
              toLeague: change.toLeague,
              finalPosition: change.finalPosition,
              weeklyPoints: change.weeklyPoints
            },
            isRead: false,
            createdAt: Date.now()
          };
          
          await dbManager.put('notifications', notification);
        }
      }
    } catch (error) {
      logger.error('Error sending league change notifications', error);
    }
  }

  /**
   * Get active groups for the current week
   */
  private async getActiveGroupsForWeek(week: { week: number; year: number }): Promise<LeagueGroup[]> {
    try {
      const allGroups = await dbManager.getAll<LeagueGroup>('leagueGroups');
      
      return allGroups.filter(group => 
        group.weekNumber === week.week &&
        group.year === week.year &&
        group.status === 'active'
      );
    } catch (error) {
      logger.error('Error getting active groups for week', error);
      return [];
    }
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
   * Manually trigger promotion/relegation for testing
   */
  async triggerManualProcessing(): Promise<PromotionRelegationResult> {
    logger.info('Manual promotion/relegation processing triggered');
    return await this.processWeeklyResults();
  }

  /**
   * Get promotion/relegation history for a user
   */
  async getUserPromotionHistory(userId: string, limit: number = 10): Promise<UserLeagueChange[]> {
    try {
      // In a real implementation, this would query a dedicated history table
      // For now, we'll return mock data
      return [];
    } catch (error) {
      logger.error('Error getting user promotion history', error);
      return [];
    }
  }

  /**
   * Preview what would happen if promotion/relegation ran now
   */
  async previewPromotionRelegation(): Promise<{
    groups: LeagueGroup[];
    predictedChanges: UserLeagueChange[];
  }> {
    try {
      const currentWeek = this.getCurrentWeek();
      const activeGroups = await this.getActiveGroupsForWeek(currentWeek);
      const predictedChanges: UserLeagueChange[] = [];

      for (const group of activeGroups) {
        const sortedParticipants = [...group.participants].sort((a, b) => b.weeklyPoints - a.weeklyPoints);
        const allLeagues = leagueManager.getAllLeagues();
        const currentLeague = allLeagues.find(l => l.id === group.leagueId);
        
        if (!currentLeague) continue;

        sortedParticipants.forEach((participant, index) => {
          const finalPosition = index + 1;
          let changeType: 'promoted' | 'relegated' | 'stayed' = 'stayed';
          let toLeague = currentLeague.name;

          if (group.promotionZone.includes(finalPosition) && currentLeague.level < 10) {
            const nextLeague = allLeagues.find(l => l.level === currentLeague.level + 1);
            if (nextLeague) {
              changeType = 'promoted';
              toLeague = nextLeague.name;
            }
          } else if (group.relegationZone.includes(finalPosition) && currentLeague.level > 1) {
            const prevLeague = allLeagues.find(l => l.level === currentLeague.level - 1);
            if (prevLeague) {
              changeType = 'relegated';
              toLeague = prevLeague.name;
            }
          }

          predictedChanges.push({
            userId: participant.userId,
            username: participant.username,
            fromLeague: currentLeague.name,
            toLeague,
            finalPosition,
            weeklyPoints: participant.weeklyPoints,
            changeType
          });
        });
      }

      return {
        groups: activeGroups,
        predictedChanges
      };
    } catch (error) {
      logger.error('Error previewing promotion/relegation', error);
      return {
        groups: [],
        predictedChanges: []
      };
    }
  }
}

export const leaguePromotionRelegationService = LeaguePromotionRelegationService.getInstance();

// Export types for convenience
export type { PromotionRelegationResult, UserLeagueChange } from './LeaguePromotionRelegationService';