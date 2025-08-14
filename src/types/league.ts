/**
 * League System Types
 * Duolingo-style competitive fitness leagues
 */

export interface League {
  id: string;
  name: string;
  level: number; // 1-10 (Bronze to Diamond)
  icon: string;
  color: string;
  description: string;
  minPoints: number;
  maxPoints: number;
}

export interface LeagueParticipant {
  userId: string;
  username: string;
  avatar?: string;
  currentPoints: number;
  weeklyPoints: number;
  position: number;
  trend: 'up' | 'down' | 'stable';
  isFriend: boolean;
  isCurrentUser: boolean;
  joinedAt: number;
}

export interface LeagueGroup {
  id: string;
  leagueId: string;
  weekNumber: number;
  year: number;
  participants: LeagueParticipant[];
  startDate: number;
  endDate: number;
  status: 'active' | 'completed' | 'pending';
  promotionZone: number[]; // Top 5 positions
  relegationZone: number[]; // Bottom 5 positions
}

export interface UserLeagueStats {
  userId: string;
  currentLeague: string;
  currentGroup: string;
  totalPoints: number;
  weeklyPoints: number;
  position: number;
  promotions: number;
  relegations: number;
  weeksInCurrentLeague: number;
  bestLeague: string;
  achievements: string[];
}

export interface GlobalLeaderboard {
  userId: string;
  username: string;
  avatar?: string;
  totalPoints: number;
  currentLeague: string;
  globalRank: number;
  countryRank?: number;
  weeklyPoints: number;
}