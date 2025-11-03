/**
 * Streak Tracking Logic - MVP Version
 * 
 * Simple streak calculation based on workout completion dates.
 * A streak is maintained by completing at least one workout per day.
 */

// ============================================================================
// Streak Calculation Functions
// ============================================================================

/**
 * Calculate current streak from workout dates
 * 
 * A streak is maintained by completing at least one workout per day.
 * The streak breaks if a day is missed.
 * 
 * @param workoutDates - Array of workout completion dates (sorted newest first)
 * @returns Current streak in days
 */
export function calculateCurrentStreak(workoutDates: Date[]): number {
  if (!workoutDates || workoutDates.length === 0) {
    return 0;
  }

  // Normalize dates to start of day (ignore time)
  const normalizedDates = workoutDates.map(date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  // Remove duplicates (multiple workouts on same day)
  const uniqueDates = Array.from(new Set(normalizedDates)).sort((a, b) => b - a);

  // Start with today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  // Check if most recent workout was today or yesterday
  const mostRecentWorkout = uniqueDates[0];
  const daysSinceLastWorkout = Math.floor((todayTime - mostRecentWorkout) / (1000 * 60 * 60 * 24));

  // If last workout was more than 1 day ago, streak is broken
  if (daysSinceLastWorkout > 1) {
    return 0;
  }

  // Count consecutive days
  let streak = 0;
  let expectedDate = todayTime;

  for (const workoutDate of uniqueDates) {
    const daysDiff = Math.floor((expectedDate - workoutDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Workout on expected date
      streak++;
      expectedDate -= 1000 * 60 * 60 * 24; // Move to previous day
    } else if (daysDiff === 1 && streak === 0) {
      // First workout was yesterday (streak starts from yesterday)
      streak++;
      expectedDate = workoutDate - (1000 * 60 * 60 * 24);
    } else {
      // Gap in streak, stop counting
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak from workout dates
 * 
 * @param workoutDates - Array of workout completion dates
 * @returns Longest streak in days
 */
export function calculateLongestStreak(workoutDates: Date[]): number {
  if (!workoutDates || workoutDates.length === 0) {
    return 0;
  }

  // Normalize dates to start of day
  const normalizedDates = workoutDates.map(date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  // Remove duplicates and sort
  const uniqueDates = Array.from(new Set(normalizedDates)).sort((a, b) => a - b);

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const daysDiff = Math.floor((uniqueDates[i] - uniqueDates[i - 1]) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      // Gap in streak
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Check if a workout was completed today
 * 
 * @param workoutDates - Array of workout completion dates
 * @returns True if at least one workout was completed today
 */
export function hasWorkoutToday(workoutDates: Date[]): boolean {
  if (!workoutDates || workoutDates.length === 0) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  return workoutDates.some(date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === todayTime;
  });
}

/**
 * Get streak status information
 * 
 * @param workoutDates - Array of workout completion dates
 * @returns Object with current streak, longest streak, and status
 */
export function getStreakStatus(workoutDates: Date[]) {
  const currentStreak = calculateCurrentStreak(workoutDates);
  const longestStreak = calculateLongestStreak(workoutDates);
  const workedOutToday = hasWorkoutToday(workoutDates);

  // Determine if streak is at risk
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const atRisk = currentStreak > 0 && !workedOutToday;

  return {
    currentStreak,
    longestStreak,
    workedOutToday,
    atRisk,
  };
}

/**
 * Update user streak after workout completion
 * 
 * This function should be called after a workout is completed
 * to update the user's streak in the database.
 * 
 * @param workoutDates - Array of workout completion dates (including new workout)
 * @returns Updated streak values
 */
export function updateStreakAfterWorkout(workoutDates: Date[]) {
  const currentStreak = calculateCurrentStreak(workoutDates);
  const longestStreak = calculateLongestStreak(workoutDates);

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
  };
}
