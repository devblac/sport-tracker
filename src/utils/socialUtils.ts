/**
 * Social System Utilities
 * 
 * Utility functions for friendship management, user search, and social interactions.
 */

import type {
  UserProfile,
  GymFriend,
  FriendRequest,
  FriendSuggestion,
  FriendshipStatus,
  UserSearchQuery,
  UserCompatibility,
  SocialActivity,
  PrivacySettings
} from '@/types/social';

// ============================================================================
// Friendship Status Utilities
// ============================================================================

/**
 * Get display text for friendship status
 */
export function getFriendshipStatusText(status: FriendshipStatus): string {
  switch (status) {
    case 'pending_sent':
      return 'Solicitud enviada';
    case 'pending_received':
      return 'Solicitud recibida';
    case 'accepted':
      return 'Amigos';
    case 'blocked':
      return 'Bloqueado';
    case 'blocked_by':
      return 'Te bloqueó';
    case 'declined':
      return 'Rechazada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Desconocido';
  }
}

/**
 * Get color class for friendship status
 */
export function getFriendshipStatusColor(status: FriendshipStatus): string {
  switch (status) {
    case 'accepted':
      return 'text-green-600 bg-green-100 border-green-200';
    case 'pending_sent':
    case 'pending_received':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'blocked':
    case 'blocked_by':
      return 'text-red-600 bg-red-100 border-red-200';
    case 'declined':
    case 'cancelled':
      return 'text-gray-600 bg-gray-100 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
}

/**
 * Check if users can interact based on friendship status
 */
export function canInteract(status: FriendshipStatus): boolean {
  return status === 'accepted';
}

/**
 * Check if user can send friend request
 */
export function canSendFriendRequest(status?: FriendshipStatus): boolean {
  return !status || status === 'declined' || status === 'cancelled';
}

/**
 * Get available actions for friendship status
 */
export function getAvailableActions(status: FriendshipStatus, isCurrentUser: boolean = false): string[] {
  if (isCurrentUser) return [];

  switch (status) {
    case 'pending_sent':
      return ['cancel_request'];
    case 'pending_received':
      return ['accept_request', 'decline_request'];
    case 'accepted':
      return ['remove_friend', 'block_user'];
    case 'blocked':
      return ['unblock_user'];
    case 'blocked_by':
      return [];
    case 'declined':
    case 'cancelled':
      return ['send_request'];
    default:
      return ['send_request'];
  }
}

// ============================================================================
// User Search and Filtering
// ============================================================================

/**
 * Filter users based on search query
 */
export function filterUsers(users: UserProfile[], query: UserSearchQuery): UserProfile[] {
  let filtered = [...users];

  // Text search
  if (query.query) {
    const searchTerm = query.query.toLowerCase();
    filtered = filtered.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.displayName.toLowerCase().includes(searchTerm) ||
      user.bio?.toLowerCase().includes(searchTerm)
    );
  }

  // Fitness level filter
  if (query.fitnessLevel && query.fitnessLevel.length > 0) {
    filtered = filtered.filter(user => 
      query.fitnessLevel!.includes(user.fitnessLevel)
    );
  }

  // Goals filter
  if (query.goals && query.goals.length > 0) {
    filtered = filtered.filter(user =>
      user.primaryGoals.some(goal => 
        query.goals!.includes(goal.type)
      )
    );
  }

  // Location filter
  if (query.location) {
    filtered = filtered.filter(user => 
      user.location?.toLowerCase().includes(query.location!.toLowerCase())
    );
  }

  // Level range filter
  if (query.minLevel !== undefined) {
    filtered = filtered.filter(user => user.stats.currentLevel >= query.minLevel!);
  }
  if (query.maxLevel !== undefined) {
    filtered = filtered.filter(user => user.stats.currentLevel <= query.maxLevel!);
  }

  // Streak filter
  if (query.minStreak !== undefined) {
    filtered = filtered.filter(user => user.stats.currentStreak >= query.minStreak!);
  }

  // Online status filter
  if (query.isOnline !== undefined) {
    filtered = filtered.filter(user => user.isOnline === query.isOnline);
  }

  // Avatar filter
  if (query.hasAvatar !== undefined) {
    filtered = filtered.filter(user => 
      query.hasAvatar ? !!user.avatar : !user.avatar
    );
  }

  // Verification filter
  if (query.isVerified !== undefined) {
    filtered = filtered.filter(user => user.isVerified === query.isVerified);
  }

  // Sort results
  if (query.sortBy) {
    filtered = sortUsers(filtered, query.sortBy, query.sortOrder || 'desc');
  }

  // Apply pagination
  if (query.offset) {
    filtered = filtered.slice(query.offset);
  }
  if (query.limit) {
    filtered = filtered.slice(0, query.limit);
  }

  return filtered;
}

/**
 * Sort users by specified criteria
 */
export function sortUsers(
  users: UserProfile[], 
  sortBy: string, 
  order: 'asc' | 'desc' = 'desc'
): UserProfile[] {
  const sorted = [...users].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'level':
        comparison = a.stats.currentLevel - b.stats.currentLevel;
        break;
      case 'streak':
        comparison = a.stats.currentStreak - b.stats.currentStreak;
        break;
      case 'recent_activity':
        comparison = new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime();
        break;
      case 'joined_date':
        comparison = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        break;
      case 'relevance':
      default:
        // For relevance, we'd need additional context like search query
        comparison = a.stats.totalXP - b.stats.totalXP;
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// ============================================================================
// User Compatibility and Suggestions
// ============================================================================

/**
 * Calculate compatibility score between two users
 */
export function calculateCompatibility(user1: UserProfile, user2: UserProfile): UserCompatibility {
  const factors = {
    fitnessLevel: calculateFitnessLevelCompatibility(user1.fitnessLevel, user2.fitnessLevel),
    goals: calculateGoalsCompatibility(user1.primaryGoals, user2.primaryGoals),
    schedule: calculateScheduleCompatibility(user1.workoutPreferences, user2.workoutPreferences),
    interests: calculateInterestsCompatibility(user1.favoriteExercises, user2.favoriteExercises),
    location: calculateLocationCompatibility(user1.location, user2.location)
  };

  // Weighted average
  const weights = {
    fitnessLevel: 0.2,
    goals: 0.3,
    schedule: 0.2,
    interests: 0.2,
    location: 0.1
  };

  const compatibilityScore = Math.round(
    factors.fitnessLevel * weights.fitnessLevel +
    factors.goals * weights.goals +
    factors.schedule * weights.schedule +
    factors.interests * weights.interests +
    factors.location * weights.location
  );

  const recommendations = generateCompatibilityRecommendations(factors);

  return {
    userId: user2.id,
    compatibilityScore,
    factors,
    recommendations
  };
}

/**
 * Calculate fitness level compatibility (0-100)
 */
function calculateFitnessLevelCompatibility(level1: string, level2: string): number {
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const index1 = levels.indexOf(level1);
  const index2 = levels.indexOf(level2);
  
  const difference = Math.abs(index1 - index2);
  
  // Perfect match = 100, adjacent levels = 75, etc.
  switch (difference) {
    case 0: return 100;
    case 1: return 75;
    case 2: return 50;
    case 3: return 25;
    default: return 0;
  }
}

/**
 * Calculate goals compatibility (0-100)
 */
function calculateGoalsCompatibility(goals1: any[], goals2: any[]): number {
  if (goals1.length === 0 || goals2.length === 0) return 50;

  const types1 = goals1.map(g => g.type);
  const types2 = goals2.map(g => g.type);
  
  const commonGoals = types1.filter(type => types2.includes(type));
  const totalUniqueGoals = new Set([...types1, ...types2]).size;
  
  return Math.round((commonGoals.length / totalUniqueGoals) * 100);
}

/**
 * Calculate schedule compatibility (0-100)
 */
function calculateScheduleCompatibility(prefs1: any[], prefs2: any[]): number {
  if (prefs1.length === 0 || prefs2.length === 0) return 50;

  const timePrefs1 = prefs1.filter(p => p.type === 'time').map(p => p.value);
  const timePrefs2 = prefs2.filter(p => p.type === 'time').map(p => p.value);
  
  if (timePrefs1.length === 0 || timePrefs2.length === 0) return 50;
  
  const commonTimes = timePrefs1.filter(time => timePrefs2.includes(time));
  return Math.round((commonTimes.length / Math.max(timePrefs1.length, timePrefs2.length)) * 100);
}

/**
 * Calculate interests compatibility (0-100)
 */
function calculateInterestsCompatibility(interests1: string[], interests2: string[]): number {
  if (interests1.length === 0 || interests2.length === 0) return 50;

  const commonInterests = interests1.filter(interest => interests2.includes(interest));
  const totalUniqueInterests = new Set([...interests1, ...interests2]).size;
  
  return Math.round((commonInterests.length / totalUniqueInterests) * 100);
}

/**
 * Calculate location compatibility (0-100)
 */
function calculateLocationCompatibility(location1?: string, location2?: string): number {
  if (!location1 || !location2) return 50;
  
  // Simple string comparison - in real app would use geolocation
  if (location1.toLowerCase() === location2.toLowerCase()) return 100;
  
  // Check if they share city/state/country
  const parts1 = location1.toLowerCase().split(',').map(s => s.trim());
  const parts2 = location2.toLowerCase().split(',').map(s => s.trim());
  
  const commonParts = parts1.filter(part => parts2.includes(part));
  
  if (commonParts.length > 0) {
    return Math.round((commonParts.length / Math.max(parts1.length, parts2.length)) * 100);
  }
  
  return 25; // Different locations but same general area
}

/**
 * Generate compatibility recommendations
 */
function generateCompatibilityRecommendations(factors: any): string[] {
  const recommendations: string[] = [];

  if (factors.fitnessLevel >= 75) {
    recommendations.push('Niveles de fitness similares - pueden entrenar juntos');
  } else if (factors.fitnessLevel < 50) {
    recommendations.push('Diferentes niveles - uno puede mentorear al otro');
  }

  if (factors.goals >= 75) {
    recommendations.push('Objetivos compatibles - pueden motivarse mutuamente');
  }

  if (factors.schedule >= 75) {
    recommendations.push('Horarios similares - perfectos para entrenar juntos');
  }

  if (factors.interests >= 75) {
    recommendations.push('Intereses comunes - pueden compartir rutinas');
  }

  if (factors.location >= 75) {
    recommendations.push('Misma ubicación - pueden entrenar en el mismo gym');
  }

  if (recommendations.length === 0) {
    recommendations.push('Pueden aprender mucho el uno del otro');
  }

  return recommendations;
}

// ============================================================================
// Privacy and Visibility Utilities
// ============================================================================

/**
 * Check if user profile is visible to viewer
 */
export function isProfileVisible(
  userProfile: UserProfile,
  viewerProfile: UserProfile | null,
  friendship?: GymFriend
): boolean {
  if (!viewerProfile) {
    return userProfile.privacy.profileVisibility === 'public';
  }

  if (userProfile.id === viewerProfile.id) {
    return true; // Own profile
  }

  switch (userProfile.privacy.profileVisibility) {
    case 'public':
      return true;
    case 'friends':
      return friendship?.status === 'accepted';
    case 'private':
      return false;
    default:
      return false;
  }
}

/**
 * Check if user stats are visible to viewer
 */
export function areStatsVisible(
  userProfile: UserProfile,
  viewerProfile: UserProfile | null,
  friendship?: GymFriend
): boolean {
  if (!viewerProfile) {
    return userProfile.privacy.statsVisibility === 'public';
  }

  if (userProfile.id === viewerProfile.id) {
    return true; // Own stats
  }

  switch (userProfile.privacy.statsVisibility) {
    case 'public':
      return true;
    case 'friends':
      return friendship?.status === 'accepted';
    case 'private':
      return false;
    default:
      return false;
  }
}

/**
 * Check if user can send friend request
 */
export function canSendFriendRequestToUser(
  targetProfile: UserProfile,
  senderProfile: UserProfile,
  existingFriendship?: GymFriend
): boolean {
  // Can't send to self
  if (targetProfile.id === senderProfile.id) return false;

  // Check if target allows friend requests
  if (!targetProfile.privacy.allowFriendRequests) return false;

  // Check existing friendship status
  if (existingFriendship) {
    return canSendFriendRequest(existingFriendship.status);
  }

  return true;
}

// ============================================================================
// Activity and Engagement Utilities
// ============================================================================

/**
 * Calculate user activity score (0-100)
 */
export function calculateActivityScore(user: UserProfile): number {
  const now = new Date();
  const daysSinceLastActive = Math.floor(
    (now.getTime() - new Date(user.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Recent activity gets higher score
  if (daysSinceLastActive === 0) return 100;
  if (daysSinceLastActive <= 1) return 90;
  if (daysSinceLastActive <= 3) return 75;
  if (daysSinceLastActive <= 7) return 60;
  if (daysSinceLastActive <= 14) return 40;
  if (daysSinceLastActive <= 30) return 20;
  
  return 10; // Inactive for over a month
}

/**
 * Format time since last active
 */
export function formatLastActive(lastActiveAt: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - lastActiveAt.getTime()) / (1000 * 60));

  if (diffInMinutes < 5) return 'Activo ahora';
  if (diffInMinutes < 60) return `Activo hace ${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Activo hace ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Activo hace ${diffInDays}d`;
  
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `Activo hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  }
  
  const months = Math.floor(diffInDays / 30);
  return `Activo hace ${months} mes${months > 1 ? 'es' : ''}`;
}

/**
 * Get fitness level display info
 */
export function getFitnessLevelInfo(level: string): { label: string; color: string; icon: string } {
  switch (level) {
    case 'beginner':
      return { label: 'Principiante', color: 'text-green-600 bg-green-100', icon: '🌱' };
    case 'intermediate':
      return { label: 'Intermedio', color: 'text-blue-600 bg-blue-100', icon: '💪' };
    case 'advanced':
      return { label: 'Avanzado', color: 'text-purple-600 bg-purple-100', icon: '🔥' };
    case 'expert':
      return { label: 'Experto', color: 'text-red-600 bg-red-100', icon: '⚡' };
    default:
      return { label: 'Desconocido', color: 'text-gray-600 bg-gray-100', icon: '❓' };
  }
}

export default {
  getFriendshipStatusText,
  getFriendshipStatusColor,
  canInteract,
  canSendFriendRequest,
  getAvailableActions,
  filterUsers,
  sortUsers,
  calculateCompatibility,
  isProfileVisible,
  areStatsVisible,
  canSendFriendRequestToUser,
  calculateActivityScore,
  formatLastActive,
  getFitnessLevelInfo
};