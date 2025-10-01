/**
 * Weekly Competition Service
 * Manages automated weekly competitions and league cycles
 */

import { dbManager } from '@/db/IndexedDBManager';
import { weeklyLeagueGroupingService } from './WeeklyLeagueGroupingService';
import { leaguePromotionRelegationService } from './LeaguePromotionRelegationService';
import { leagueRewardsService } from './LeagueRewardsService';
import { leagueManager } from './LeagueManager';
import { analyticsManager } from './AnalyticsManager';
import { logger } from '@/utils';
import type { LeagueGroup } from '@/types/league';

export interface CompetitionCycle {
  id: string;
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ending' | 'completed';
  participantsCount: number;
  groupsCount: number;
  createdAt: Date;
}

export interface CompetitionStats {
  totalParticipants: number;
  activeGroups: number;
  completedGroups: number;
  averageWeeklyPoints: number;
  topPerformers: {
    userId: string;
    username: string;
    weeklyPoints: number;
    leagueName: string;
  }[];
}

export class WeeklyCompetitionService {
  private static instance: WeeklyCompetitionService;
  private competitionTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  private constructor() {
    this.initializeCompetitionCycle();
  }

  public static getInstance(): WeeklyCompetitionService {
    if (!WeeklyCompetitionService.instance) {
      WeeklyCompetitionService.instance = new WeeklyCompetitionService();
    }
    return WeeklyCompetitionService.instance;
  }

  /**
   * Initialize the automated competition cycle
   */
  private initializeCompetitionCycle(): void {
    // Set up timer to check for competition transitions every hour
    this.competitionTimer = setInterval(() => {
      this.checkCompetitionStatus();
    }, 60 * 60 * 1000); // Check every hour

    // Initial check
    this.checkCompetitionStatus();
    
    logger.info('Weekly competition service initialized');
  }

  /**
   * Check current competition status and trigger transitions if needed
   */
  private async checkCompetitionStatus(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('Competition processing already in progress, skipping check');
      return;
    }

    try {
      this.isProcessing = true;
      
      const currentCycle = await this.getCurrentCompetitionCycle();
      const now = new Date();

      if (!currentCycle) {
        // No active cycle, create one
        await this.startNewCompetitionCycle();
      } else if (currentCycle.status === 'active' && now >= currentCycle.endDate) {
        // Current cycle has ended, process results and start new one
        await this.endCompetitionCycle(currentCycle);
        await this.startNewCompetitionCycle();
      } else if (currentCycle.status === 'upcoming' && now >= currentCycle.startDate) {
        // Upcoming cycle should start
        await this.activateCompetitionCycle(currentCycle);
      }

    } catch (error) {
      logger.error('Error checking competition status', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start a new competition cycle
   */
  async startNewCompetitionCycle(): Promise<CompetitionCycle> {
    try {
      await dbManager.init();
      
      const currentWeek = this.getCurrentWeek();
      const weekStart = this.getWeekStart();
      const weekEnd = this.getWeekEnd();

      logger.info('Starting new competition cycle', {
        week: currentWeek.week,
        year: currentWeek.year,
        startDate: weekStart,
        endDate: weekEnd
      });

      // Create groups for the new week
      const groupingResult = await weeklyLeagueGroupingService.executeWeeklyGrouping();

      // Create competition cycle record
      const cycle: CompetitionCycle = {
        id: `competition_${currentWeek.year}_${currentWeek.week}`,
        weekNumber: currentWeek.week,
        year: currentWeek.year,
        startDate: weekStart,
        endDate: weekEnd,
        status: 'active',
        participantsCount: groupingResult.totalParticipants,
        groupsCount: groupingResult.groupsCreated,
        createdAt: new Date()
      };

      await dbManager.put('competitionCycles', cycle);

      // Send notifications to participants
      await this.notifyCompetitionStart(cycle);

      // Track analytics
      analyticsManager.track('competition_cycle_started', {
        cycle_id: cycle.id,
        week: cycle.weekNumber,
        year: cycle.year,
        participants: cycle.participantsCount,
        groups: cycle.groupsCount
      });

      logger.info('New competition cycle started', cycle);
      return cycle;

    } catch (error) {
      logger.error('Error starting new competition cycle', error);
      throw error;
    }
  }

  /**
   * End current competition cycle and process results
   */
  async endCompetitionCycle(cycle: CompetitionCycle): Promise<void> {
    try {
      logger.info('Ending competition cycle', { cycleId: cycle.id });

      // Update cycle status
      cycle.status = 'ending';
      await dbManager.put('competitionCycles', cycle);

      // Process promotion/relegation
      const promotionResult = await leaguePromotionRelegationService.processWeeklyResults();

      // Process rewards for all participants
      await this.processCompetitionRewards(cycle);

      // Mark cycle as completed
      cycle.status = 'completed';
      await dbManager.put('competitionCycles', cycle);

      // Send end-of-week notifications
      await this.notifyCompetitionEnd(cycle, promotionResult);

      // Track analytics
      analyticsManager.track('competition_cycle_ended', {
        cycle_id: cycle.id,
        promotions: promotionResult.promotions,
        relegations: promotionResult.relegations,
        groups_processed: promotionResult.groupsProcessed
      });

      logger.info('Competition cycle ended', {
        cycleId: cycle.id,
        promotions: promotionResult.promotions,
        relegations: promotionResult.relegations
      });

    } catch (error) {
      logger.error('Error ending competition cycle', error);
      throw error;
    }
  }

  /**
   * Activate an upcoming competition cycle
   */
  async activateCompetitionCycle(cycle: CompetitionCycle): Promise<void> {
    try {
      cycle.status = 'active';
      await dbManager.put('competitionCycles', cycle);

      await this.notifyCompetitionStart(cycle);

      logger.info('Competition cycle activated', { cycleId: cycle.id });
    } catch (error) {
      logger.error('Error activating competition cycle', error);
      throw error;
    }
  }

  /**
   * Process rewards for all competition participants
   */
  private async processCompetitionRewards(cycle: CompetitionCycle): Promise<void> {
    try {
      // Get all groups for this cycle
      const groups = await this.getGroupsForCycle(cycle);
      const allLeagues = leagueManager.getAllLeagues();

      for (const group of groups) {
        const currentLeague = allLeagues.find(l => l.id === group.leagueId);
        if (!currentLeague) continue;

        // Sort participants by weekly points
        const sortedParticipants = [...group.participants].sort((a, b) => b.weeklyPoints - a.weeklyPoints);

        for (let i = 0; i < sortedParticipants.length; i++) {
          const participant = sortedParticipants[i];
          const finalPosition = i + 1;
          
          // Determine if promoted/relegated
          const wasPromoted = group.promotionZone.includes(finalPosition) && currentLeague.level < 10;
          const wasRelegated = group.relegationZone.includes(finalPosition) && currentLeague.level > 1;

          // Process rewards
          await leagueRewardsService.processWeeklyRewards(
            participant.userId,
            finalPosition,
            wasPromoted,
            wasRelegated,
            currentLeague
          );
        }
      }

      logger.info('Competition rewards processed', {
        cycleId: cycle.id,
        groupsProcessed: groups.length
      });

    } catch (error) {
      logger.error('Error processing competition rewards', error);
    }
  }

  /**
   * Send notifications for competition start
   */
  private async notifyCompetitionStart(cycle: CompetitionCycle): Promise<void> {
    try {
      // Get all participants
      const groups = await this.getGroupsForCycle(cycle);
      const participantIds = new Set<string>();
      
      groups.forEach(group => {
        group.participants.forEach(p => participantIds.add(p.userId));
      });

      // Create notifications for all participants
      for (const userId of participantIds) {
        const notification = {
          id: `competition_start_${userId}_${cycle.id}`,
          userId,
          type: 'competition_start',
          title: '🏁 New League Week Started!',
          message: `A new league competition has begun. Compete with 19 other players for promotion!`,
          data: {
            cycleId: cycle.id,
            weekNumber: cycle.weekNumber,
            year: cycle.year,
            endDate: cycle.endDate.getTime()
          },
          isRead: false,
          createdAt: Date.now()
        };

        await dbManager.put('notifications', notification);
      }

      logger.info('Competition start notifications sent', {
        cycleId: cycle.id,
        participants: participantIds.size
      });

    } catch (error) {
      logger.error('Error sending competition start notifications', error);
    }
  }

  /**
   * Send notifications for competition end
   */
  private async notifyCompetitionEnd(cycle: CompetitionCycle, promotionResult: any): Promise<void> {
    try {
      // Get competition stats
      const stats = await this.getCompetitionStats(cycle);

      // Create summary notification for all participants
      const groups = await this.getGroupsForCycle(cycle);
      const participantIds = new Set<string>();
      
      groups.forEach(group => {
        group.participants.forEach(p => participantIds.add(p.userId));
      });

      for (const userId of participantIds) {
        const notification = {
          id: `competition_end_${userId}_${cycle.id}`,
          userId,
          type: 'competition_end',
          title: '🏆 League Week Complete!',
          message: `Week ${cycle.weekNumber} results are in! Check your position and rewards.`,
          data: {
            cycleId: cycle.id,
            weekNumber: cycle.weekNumber,
            year: cycle.year,
            totalPromotions: promotionResult.promotions,
            totalRelegations: promotionResult.relegations,
            averagePoints: stats.averageWeeklyPoints
          },
          isRead: false,
          createdAt: Date.now()
        };

        await dbManager.put('notifications', notification);
      }

      logger.info('Competition end notifications sent', {
        cycleId: cycle.id,
        participants: participantIds.size
      });

    } catch (error) {
      logger.error('Error sending competition end notifications', error);
    }
  }

  /**
   * Get current competition cycle
   */
  async getCurrentCompetitionCycle(): Promise<CompetitionCycle | null> {
    try {
      await dbManager.init();
      
      const cycles = await dbManager.getAll<CompetitionCycle>('competitionCycles');
      const activeCycles = cycles.filter(c => c.status === 'active' || c.status === 'upcoming');
      
      // Return the most recent active or upcoming cycle
      return activeCycles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null;
    } catch (error) {
      logger.error('Error getting current competition cycle', error);
      return null;
    }
  }

  /**
   * Get competition statistics
   */
  async getCompetitionStats(cycle: CompetitionCycle): Promise<CompetitionStats> {
    try {
      const groups = await this.getGroupsForCycle(cycle);
      
      let totalParticipants = 0;
      let totalWeeklyPoints = 0;
      const topPerformers: CompetitionStats['topPerformers'] = [];
      
      const allLeagues = leagueManager.getAllLeagues();

      groups.forEach(group => {
        totalParticipants += group.participants.length;
        
        group.participants.forEach(participant => {
          totalWeeklyPoints += participant.weeklyPoints;
          
          const league = allLeagues.find(l => l.id === group.leagueId);
          topPerformers.push({
            userId: participant.userId,
            username: participant.username,
            weeklyPoints: participant.weeklyPoints,
            leagueName: league?.name || 'Unknown'
          });
        });
      });

      // Sort top performers and take top 10
      topPerformers.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
      const top10 = topPerformers.slice(0, 10);

      return {
        totalParticipants,
        activeGroups: groups.filter(g => g.status === 'active').length,
        completedGroups: groups.filter(g => g.status === 'completed').length,
        averageWeeklyPoints: totalParticipants > 0 ? totalWeeklyPoints / totalParticipants : 0,
        topPerformers: top10
      };

    } catch (error) {
      logger.error('Error getting competition stats', error);
      return {
        totalParticipants: 0,
        activeGroups: 0,
        completedGroups: 0,
        averageWeeklyPoints: 0,
        topPerformers: []
      };
    }
  }

  /**
   * Get groups for a specific competition cycle
   */
  private async getGroupsForCycle(cycle: CompetitionCycle): Promise<LeagueGroup[]> {
    try {
      const allGroups = await dbManager.getAll<LeagueGroup>('leagueGroups');
      
      return allGroups.filter(group => 
        group.weekNumber === cycle.weekNumber && 
        group.year === cycle.year
      );
    } catch (error) {
      logger.error('Error getting groups for cycle', error);
      return [];
    }
  }

  /**
   * Manually trigger a new competition cycle (for testing)
   */
  async triggerNewCycle(): Promise<CompetitionCycle> {
    logger.info('Manual competition cycle trigger');
    return await this.startNewCompetitionCycle();
  }

  /**
   * Manually end current cycle (for testing)
   */
  async triggerEndCycle(): Promise<void> {
    const currentCycle = await this.getCurrentCompetitionCycle();
    if (currentCycle && currentCycle.status === 'active') {
      logger.info('Manual competition cycle end trigger');
      await this.endCompetitionCycle(currentCycle);
    }
  }

  /**
   * Get competition history
   */
  async getCompetitionHistory(limit: number = 10): Promise<CompetitionCycle[]> {
    try {
      const cycles = await dbManager.getAll<CompetitionCycle>('competitionCycles');
      return cycles
        .filter(c => c.status === 'completed')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting competition history', error);
      return [];
    }
  }

  /**
   * Cleanup old competition data
   */
  async cleanupOldCompetitions(weeksToKeep: number = 12): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (weeksToKeep * 7));

      const cycles = await dbManager.getAll<CompetitionCycle>('competitionCycles');
      const oldCycles = cycles.filter(c => c.createdAt < cutoffDate);

      for (const cycle of oldCycles) {
        await dbManager.delete('competitionCycles', cycle.id);
        
        // Also cleanup associated groups
        const groups = await this.getGroupsForCycle(cycle);
        for (const group of groups) {
          await dbManager.delete('leagueGroups', group.id);
        }
      }

      logger.info('Old competition data cleaned up', {
        cyclesRemoved: oldCycles.length,
        cutoffDate
      });

    } catch (error) {
      logger.error('Error cleaning up old competitions', error);
    }
  }

  /**
   * Destroy the service and cleanup timers
   */
  destroy(): void {
    if (this.competitionTimer) {
      clearInterval(this.competitionTimer);
      this.competitionTimer = null;
    }
    logger.info('Weekly competition service destroyed');
  }

  // Helper methods

  private getCurrentWeek(): { week: number; year: number } {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    return { week, year };
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  }

  private getWeekEnd(): Date {
    const weekStart = this.getWeekStart();
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  }
}

export const weeklyCompetitionService = WeeklyCompetitionService.getInstance();

// Export types for convenience
export type { CompetitionCycle, CompetitionStats } from './WeeklyCompetitionService';