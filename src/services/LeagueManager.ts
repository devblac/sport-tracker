/**
 * Duolingo-Style League System
 * Competitive fitness leagues with promotion/relegation system
 */

import { dbManager } from '@/db/IndexedDBManager';
import { analyticsManager } from './AnalyticsManager';
import { realTimeManager } from './RealTimeManager';
import { logger } from '@/utils';
import type { 
  League, 
  LeagueParticipant, 
  LeagueGroup, 
  UserLeagueStats, 
  GlobalLeaderboard 
} from '@/types/league';

export class LeagueManager {
  private static instance: LeagueManager;
  private leagues: Map<string, League> = new Map();
  private currentWeek: { week: number; year: number };

  private constructor() {
    this.currentWeek = this.getCurrentWeek();
    this.initializeLeagues();
  }

  public static getInstance(): LeagueManager {
    if (!LeagueManager.instance) {
      LeagueManager.instance = new LeagueManager();
    }
    return LeagueManager.instance;
  }

  /**
   * Initialize the 10-league system (like Duolingo)
   */
  private initializeLeagues(): void {
    const leagueData: Omit<League, 'id'>[] = [
      {
        name: 'Bronze',
        level: 1,
        icon: '🥉',
        color: '#CD7F32',
        description: 'Start your fitness journey',
        minPoints: 0,
        maxPoints: 999
      },
      {
        name: 'Silver',
        level: 2,
        icon: '🥈',
        color: '#C0C0C0',
        description: 'Building momentum',
        minPoints: 1000,
        maxPoints: 2499
      },
      {
        name: 'Gold',
        level: 3,
        icon: '🥇',
        color: '#FFD700',
        description: 'Consistent training',
        minPoints: 2500,
        maxPoints: 4999
      },
      {
        name: 'Platinum',
        level: 4,
        icon: '💎',
        color: '#E5E4E2',
        description: 'Dedicated athlete',
        minPoints: 5000,
        maxPoints: 9999
      },
      {
        name: 'Emerald',
        level: 5,
        icon: '💚',
        color: '#50C878',
        description: 'Elite performance',
        minPoints: 10000,
        maxPoints: 19999
      },
      {
        name: 'Ruby',
        level: 6,
        icon: '❤️',
        color: '#E0115F',
        description: 'Champion level',
        minPoints: 20000,
        maxPoints: 39999
      },
      {
        name: 'Sapphire',
        level: 7,
        icon: '💙',
        color: '#0F52BA',
        description: 'Master athlete',
        minPoints: 40000,
        maxPoints: 79999
      },
      {
        name: 'Diamond',
        level: 8,
        icon: '💎',
        color: '#B9F2FF',
        description: 'Legendary status',
        minPoints: 80000,
        maxPoints: 159999
      },
      {
        name: 'Obsidian',
        level: 9,
        icon: '🖤',
        color: '#3C3C3C',
        description: 'Mythical power',
        minPoints: 160000,
        maxPoints: 319999
      },
      {
        name: 'Phoenix',
        level: 10,
        icon: '🔥',
        color: '#FF4500',
        description: 'Ultimate champion',
        minPoints: 320000,
        maxPoints: Infinity
      }
    ];

    leagueData.forEach(league => {
      const id = `league_${league.level}`;
      this.leagues.set(id, { ...league, id });
    });

    logger.info('League system initialized', { leagues: this.leagues.size });
  }

  /**
   * Get user's current league group (20 players)
   */
  async getUserLeagueGroup(userId: string): Promise<LeagueGroup | null> {
    try {
      await dbManager.init();
      
      const userStats = await this.getUserStats(userId);
      if (!userStats) return null;

      const group = await dbManager.get<LeagueGroup>('leagueGroups', userStats.currentGroup);
      return group;
    } catch (error) {
      logger.error('Error getting user league group', error);
      return null;
    }
  }

  /**
   * Get global leaderboard (top 100)
   */
  async getGlobalLeaderboard(limit: number = 100): Promise<GlobalLeaderboard[]> {
    try {
      await dbManager.init();
      
      const allUsers = await dbManager.getAll<UserLeagueStats>('userLeagueStats');
      
      const globalBoard = allUsers
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit)
        .map((user, index) => ({
          userId: user.userId,
          username: `User${user.userId.slice(-4)}`, // This should come from user profile
          totalPoints: user.totalPoints,
          currentLeague: user.currentLeague,
          globalRank: index + 1,
          weeklyPoints: user.weeklyPoints
        }));

      return globalBoard;
    } catch (error) {
      logger.error('Error getting global leaderboard', error);
      return [];
    }
  }

  /**
   * Create weekly league groups with intelligent matching
   */
  async createWeeklyGroups(): Promise<void> {
    try {
      await dbManager.init();
      
      const allUsers = await dbManager.getAll<UserLeagueStats>('userLeagueStats');
      
      // Group users by league level
      const usersByLeague = new Map<string, UserLeagueStats[]>();
      
      allUsers.forEach(user => {
        const league = user.currentLeague;
        if (!usersByLeague.has(league)) {
          usersByLeague.set(league, []);
        }
        usersByLeague.get(league)!.push(user);
      });

      // Create groups for each league
      for (const [leagueId, users] of usersByLeague.entries()) {
        await this.createGroupsForLeague(leagueId, users);
      }

      logger.info('Weekly league groups created');
    } catch (error) {
      logger.error('Error creating weekly groups', error);
    }
  }

  /**
   * Create groups for a specific league with friend prioritization
   */
  private async createGroupsForLeague(leagueId: string, users: UserLeagueStats[]): Promise<void> {
    const groupSize = 20;
    const groups: UserLeagueStats[][] = [];
    const friendPairs = await this.getFriendPairs(users);
    
    // Sort users by similar skill level (total points)
    users.sort((a, b) => a.totalPoints - b.totalPoints);
    
    // Create groups with friend prioritization
    let currentGroup: UserLeagueStats[] = [];
    const usedUsers = new Set<string>();
    
    for (const user of users) {
      if (usedUsers.has(user.userId)) continue;
      
      if (currentGroup.length < groupSize) {
        currentGroup.push(user);
        usedUsers.add(user.userId);
        
        // Try to add friends to the same group
        const friends = friendPairs.get(user.userId) || [];
        for (const friend of friends) {
          if (currentGroup.length < groupSize && !usedUsers.has(friend.userId)) {
            const friendUser = users.find(u => u.userId === friend.userId);
            if (friendUser) {
              currentGroup.push(friendUser);
              usedUsers.add(friend.userId);
            }
          }
        }
      }
      
      if (currentGroup.length >= groupSize) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    }
    
    // Add remaining users to last group or create new one
    if (currentGroup.length > 0) {
      if (groups.length > 0 && groups[groups.length - 1].length < 15) {
        // Merge with last group if it's not too full
        groups[groups.length - 1].push(...currentGroup);
      } else {
        groups.push(currentGroup);
      }
    }

    // Save groups to database
    for (let i = 0; i < groups.length; i++) {
      const groupId = `${leagueId}_${this.currentWeek.year}_${this.currentWeek.week}_${i}`;
      
      const leagueGroup: LeagueGroup = {
        id: groupId,
        leagueId,
        weekNumber: this.currentWeek.week,
        year: this.currentWeek.year,
        participants: groups[i].map((user, index) => ({
          userId: user.userId,
          username: `User${user.userId.slice(-4)}`,
          currentPoints: user.totalPoints,
          weeklyPoints: 0, // Reset for new week
          position: index + 1,
          trend: 'stable',
          isFriend: false, // Will be updated based on current user
          isCurrentUser: false,
          joinedAt: Date.now()
        })),
        startDate: this.getWeekStart().getTime(),
        endDate: this.getWeekEnd().getTime(),
        status: 'active',
        promotionZone: [1, 2, 3, 4, 5],
        relegationZone: [16, 17, 18, 19, 20]
      };

      await dbManager.put('leagueGroups', leagueGroup);
      
      // Update user stats with new group
      for (const user of groups[i]) {
        user.currentGroup = groupId;
        await dbManager.put('userLeagueStats', user);
      }
    }
  }

  /**
   * Add points to user and update league position
   */
  async addPoints(userId: string, points: number, source: string): Promise<void> {
    try {
      await dbManager.init();
      
      let userStats = await this.getUserStats(userId);
      if (!userStats) {
        userStats = await this.createUserStats(userId);
      }

      // Add points
      userStats.totalPoints += points;
      userStats.weeklyPoints += points;

      // Update league if necessary
      const newLeague = this.determineLeague(userStats.totalPoints);
      if (newLeague.id !== userStats.currentLeague) {
        userStats.currentLeague = newLeague.id;
        userStats.weeksInCurrentLeague = 0;
        
        if (newLeague.level > this.leagues.get(userStats.currentLeague)?.level!) {
          userStats.promotions++;
          
          // Track promotion
          analyticsManager.track('league_promotion', {
            user_id: userId,
            from_league: userStats.currentLeague,
            to_league: newLeague.id,
            total_points: userStats.totalPoints
          });
        }
      }

      // Update position in current group
      await this.updateGroupPositions(userStats.currentGroup);

      // Save updated stats
      await dbManager.put('userLeagueStats', userStats);

      // Emit real-time update
      realTimeManager.emit('league_update', {
        userId,
        points,
        source,
        newTotal: userStats.totalPoints,
        weeklyTotal: userStats.weeklyPoints,
        league: newLeague.name
      });

      logger.debug('Points added to user', { userId, points, source, newTotal: userStats.totalPoints });
    } catch (error) {
      logger.error('Error adding points to user', error);
    }
  }

  /**
   * Process weekly league results (promotions/relegations)
   */
  async processWeeklyResults(): Promise<void> {
    try {
      await dbManager.init();
      
      const activeGroups = await dbManager.getAll<LeagueGroup>('leagueGroups');
      const currentWeekGroups = activeGroups.filter(group => 
        group.weekNumber === this.currentWeek.week && 
        group.year === this.currentWeek.year &&
        group.status === 'active'
      );

      for (const group of currentWeekGroups) {
        await this.processGroupResults(group);
      }

      // Create new groups for next week
      await this.createWeeklyGroups();

      logger.info('Weekly league results processed');
    } catch (error) {
      logger.error('Error processing weekly results', error);
    }
  }

  /**
   * Process results for a single group
   */
  private async processGroupResults(group: LeagueGroup): Promise<void> {
    // Sort participants by weekly points
    const sortedParticipants = [...group.participants].sort((a, b) => b.weeklyPoints - a.weeklyPoints);
    
    for (let i = 0; i < sortedParticipants.length; i++) {
      const participant = sortedParticipants[i];
      const userStats = await this.getUserStats(participant.userId);
      if (!userStats) continue;

      const position = i + 1;
      const currentLeague = this.leagues.get(userStats.currentLeague);
      if (!currentLeague) continue;

      // Determine promotion/relegation
      if (group.promotionZone.includes(position) && currentLeague.level < 10) {
        // Promote to next league
        const nextLeague = Array.from(this.leagues.values()).find(l => l.level === currentLeague.level + 1);
        if (nextLeague) {
          userStats.currentLeague = nextLeague.id;
          userStats.promotions++;
          userStats.weeksInCurrentLeague = 0;
          
          analyticsManager.track('league_promotion', {
            user_id: participant.userId,
            from_league: currentLeague.id,
            to_league: nextLeague.id,
            final_position: position,
            weekly_points: participant.weeklyPoints
          });
        }
      } else if (group.relegationZone.includes(position) && currentLeague.level > 1) {
        // Relegate to previous league
        const prevLeague = Array.from(this.leagues.values()).find(l => l.level === currentLeague.level - 1);
        if (prevLeague) {
          userStats.currentLeague = prevLeague.id;
          userStats.relegations++;
          userStats.weeksInCurrentLeague = 0;
          
          analyticsManager.track('league_relegation', {
            user_id: participant.userId,
            from_league: currentLeague.id,
            to_league: prevLeague.id,
            final_position: position,
            weekly_points: participant.weeklyPoints
          });
        }
      }

      // Reset weekly points
      userStats.weeklyPoints = 0;
      userStats.weeksInCurrentLeague++;

      await dbManager.put('userLeagueStats', userStats);
    }

    // Mark group as completed
    group.status = 'completed';
    await dbManager.put('leagueGroups', group);
  }

  // Helper methods

  private async getUserStats(userId: string): Promise<UserLeagueStats | null> {
    try {
      await dbManager.init();
      return await dbManager.get<UserLeagueStats>('userLeagueStats', userId);
    } catch (error) {
      return null;
    }
  }

  private async createUserStats(userId: string): Promise<UserLeagueStats> {
    const stats: UserLeagueStats = {
      userId,
      currentLeague: 'league_1', // Start in Bronze
      currentGroup: '',
      totalPoints: 0,
      weeklyPoints: 0,
      position: 0,
      promotions: 0,
      relegations: 0,
      weeksInCurrentLeague: 0,
      bestLeague: 'league_1',
      achievements: []
    };

    await dbManager.put('userLeagueStats', stats);
    return stats;
  }

  private determineLeague(totalPoints: number): League {
    for (const league of this.leagues.values()) {
      if (totalPoints >= league.minPoints && totalPoints <= league.maxPoints) {
        return league;
      }
    }
    return this.leagues.get('league_1')!; // Default to Bronze
  }

  private async getFriendPairs(users: UserLeagueStats[]): Promise<Map<string, UserLeagueStats[]>> {
    // This would integrate with the social system to get friend relationships
    // For now, return empty map
    return new Map();
  }

  private async updateGroupPositions(groupId: string): Promise<void> {
    try {
      const group = await dbManager.get<LeagueGroup>('leagueGroups', groupId);
      if (!group) return;

      // Sort by weekly points and update positions
      group.participants.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
      group.participants.forEach((participant, index) => {
        participant.position = index + 1;
      });

      await dbManager.put('leagueGroups', group);
    } catch (error) {
      logger.error('Error updating group positions', error);
    }
  }

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
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(now.setDate(diff));
  }

  private getWeekEnd(): Date {
    const weekStart = this.getWeekStart();
    return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  }

  public getAllLeagues(): League[] {
    return Array.from(this.leagues.values()).sort((a, b) => a.level - b.level);
  }
}

export const leagueManager = LeagueManager.getInstance();

// Re-export types for convenience
export type { 
  League, 
  LeagueParticipant, 
  LeagueGroup, 
  UserLeagueStats, 
  GlobalLeaderboard 
} from '@/types/league';