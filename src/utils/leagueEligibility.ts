/**
 * League Eligibility Checker
 * Determines if leagues should be shown to users
 */

import type { User } from '@/schemas/user';

export interface LeagueEligibilityResult {
  isEligible: boolean;
  reason?: string;
  minimumUsers?: number;
  currentUsers?: number;
}

/**
 * Check if user is eligible for league system
 */
export const checkLeagueEligibility = (
  user: User | null,
  totalRegisteredUsers: number = 0
): LeagueEligibilityResult => {
  // Must be logged in
  if (!user) {
    return {
      isEligible: false,
      reason: 'User must be logged in'
    };
  }

  // Must be registered user (not guest)
  if (user.role === 'guest') {
    return {
      isEligible: false,
      reason: 'Leagues are only available for registered users'
    };
  }

  // Must have enough users for meaningful competition
  const minimumUsersForLeagues = 50; // Need at least 50 users to form proper leagues
  
  if (totalRegisteredUsers < minimumUsersForLeagues) {
    return {
      isEligible: false,
      reason: 'Not enough users yet for league competition',
      minimumUsers: minimumUsersForLeagues,
      currentUsers: totalRegisteredUsers
    };
  }

  // All checks passed
  return {
    isEligible: true
  };
};

/**
 * Get user-friendly message for league unavailability
 */
export const getLeagueUnavailableMessage = (result: LeagueEligibilityResult): {
  title: string;
  message: string;
  action?: string;
} => {
  if (result.reason === 'User must be logged in') {
    return {
      title: 'Login Required',
      message: 'Please log in to access competitive leagues',
      action: 'Login'
    };
  }

  if (result.reason === 'Leagues are only available for registered users') {
    return {
      title: 'Registration Required',
      message: 'Competitive leagues are available for registered users. Create a free account to join the competition!',
      action: 'Sign Up'
    };
  }

  if (result.reason === 'Not enough users yet for league competition') {
    const remaining = (result.minimumUsers || 50) - (result.currentUsers || 0);
    return {
      title: 'Coming Soon!',
      message: `Leagues will be available when we reach ${result.minimumUsers} users. Only ${remaining} more to go!`,
      action: 'Invite Friends'
    };
  }

  return {
    title: 'Leagues Unavailable',
    message: 'Competitive leagues are temporarily unavailable'
  };
};

/**
 * Check if user has completed enough workouts to join leagues
 */
export const checkWorkoutRequirement = (userWorkoutCount: number): boolean => {
  const minimumWorkouts = 3; // Need at least 3 workouts to join leagues
  return userWorkoutCount >= minimumWorkouts;
};

/**
 * Get comprehensive league access status
 */
export const getLeagueAccessStatus = (
  user: User | null,
  totalRegisteredUsers: number,
  userWorkoutCount: number
): {
  canAccess: boolean;
  eligibilityResult: LeagueEligibilityResult;
  hasWorkoutRequirement: boolean;
  message?: {
    title: string;
    message: string;
    action?: string;
  };
} => {
  const eligibilityResult = checkLeagueEligibility(user, totalRegisteredUsers);
  const hasWorkoutRequirement = checkWorkoutRequirement(userWorkoutCount);

  if (!eligibilityResult.isEligible) {
    return {
      canAccess: false,
      eligibilityResult,
      hasWorkoutRequirement,
      message: getLeagueUnavailableMessage(eligibilityResult)
    };
  }

  if (!hasWorkoutRequirement) {
    return {
      canAccess: false,
      eligibilityResult,
      hasWorkoutRequirement,
      message: {
        title: 'Complete Your First Workouts',
        message: `Complete ${3 - userWorkoutCount} more workout${3 - userWorkoutCount === 1 ? '' : 's'} to unlock competitive leagues!`,
        action: 'Start Workout'
      }
    };
  }

  return {
    canAccess: true,
    eligibilityResult,
    hasWorkoutRequirement
  };
};