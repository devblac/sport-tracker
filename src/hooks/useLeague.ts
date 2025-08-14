import { useState, useEffect, useCallback } from 'react';
import { leagueManager } from '@/services/LeagueManager';
import type { League, LeagueGroup, UserLeagueStats, GlobalLeaderboard } from '@/types/league';
import { useAuthStore } from '@/stores';
import { analyticsManager } from '@/services/AnalyticsManager';

export interface UseLeagueResult {
  // User's league data
  userStats: UserLeagueStats | null;
  currentLeague: League | null;
  leagueGroup: LeagueGroup | null;
  
  // Global data
  globalLeaderboard: GlobalLeaderboard[];
  allLeagues: League[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  addPoints: (points: number, source: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useLeague = (): UseLeagueResult => {
  const [userStats, setUserStats] = useState<UserLeagueStats | null>(null);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [leagueGroup, setLeagueGroup] = useState<LeagueGroup | null>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboard[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();

  const loadLeagueData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Load user's league group
      const group = await leagueManager.getUserLeagueGroup(user.id);
      setLeagueGroup(group);
      
      // Load global leaderboard
      const global = await leagueManager.getGlobalLeaderboard(100);
      setGlobalLeaderboard(global);
      
      // Load all leagues
      const leagues = leagueManager.getAllLeagues();
      setAllLeagues(leagues);
      
      // Find current league
      if (group) {
        const league = leagues.find(l => l.id === group.leagueId);
        setCurrentLeague(league || null);
      }
      
      // Track league view
      analyticsManager.track('league_viewed', {
        user_id: user.id,
        current_league: currentLeague?.name,
        league_position: leagueGroup?.participants.find(p => p.userId === user.id)?.position
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load league data');
      console.error('Error loading league data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentLeague?.name, leagueGroup]);

  const addPoints = useCallback(async (points: number, source: string) => {
    if (!user) return;
    
    try {
      await leagueManager.addPoints(user.id, points, source);
      
      // Refresh data to show updated points and positions
      await loadLeagueData();
      
      // Track points addition
      analyticsManager.track('league_points_added', {
        user_id: user.id,
        points_added: points,
        source,
        current_league: currentLeague?.name
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add points');
      console.error('Error adding points:', err);
    }
  }, [user, loadLeagueData, currentLeague?.name]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await loadLeagueData();
  }, [loadLeagueData]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadLeagueData();
  }, [loadLeagueData]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const handleLeagueUpdate = (data: any) => {
      if (data.userId === user.id) {
        // Refresh data when user's league data changes
        loadLeagueData();
      }
    };

    // Listen for real-time league updates
    // This would integrate with your real-time system
    // realTimeManager.on('league_update', handleLeagueUpdate);

    // Cleanup
    return () => {
      // realTimeManager.off('league_update', handleLeagueUpdate);
    };
  }, [user, loadLeagueData]);

  return {
    userStats,
    currentLeague,
    leagueGroup,
    globalLeaderboard,
    allLeagues,
    loading,
    error,
    addPoints,
    refreshData
  };
};

/**
 * Hook for tracking workout points in leagues
 */
export const useLeaguePoints = () => {
  const { addPoints } = useLeague();
  
  const awardWorkoutPoints = useCallback(async (workoutData: {
    duration: number; // in minutes
    exercisesCompleted: number;
    setsCompleted: number;
    workoutType: string;
  }) => {
    // Calculate points based on workout metrics
    let points = 0;
    
    // Base points for completing a workout
    points += 50;
    
    // Duration bonus (1 point per minute, max 60)
    points += Math.min(workoutData.duration, 60);
    
    // Exercise variety bonus (5 points per exercise)
    points += workoutData.exercisesCompleted * 5;
    
    // Volume bonus (2 points per set)
    points += workoutData.setsCompleted * 2;
    
    // Workout type multiplier
    const typeMultipliers: Record<string, number> = {
      'strength': 1.2,
      'cardio': 1.0,
      'hiit': 1.3,
      'yoga': 0.8,
      'custom': 1.0
    };
    
    const multiplier = typeMultipliers[workoutData.workoutType] || 1.0;
    points = Math.round(points * multiplier);
    
    // Award points
    await addPoints(points, 'workout_completed');
    
    return points;
  }, [addPoints]);
  
  const awardAchievementPoints = useCallback(async (achievementType: string) => {
    const achievementPoints: Record<string, number> = {
      'first_workout': 100,
      'streak_7': 150,
      'streak_30': 500,
      'pr_set': 75,
      'workout_milestone': 200,
      'consistency_bonus': 100
    };
    
    const points = achievementPoints[achievementType] || 50;
    await addPoints(points, `achievement_${achievementType}`);
    
    return points;
  }, [addPoints]);
  
  return {
    awardWorkoutPoints,
    awardAchievementPoints
  };
};