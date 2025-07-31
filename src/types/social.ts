/**
 * Social System Types
 * 
 * Type definitions for gym friends, friend requests, and social interactions.
 */

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedAt: Date;
  lastActiveAt: Date;
  isOnline: boolean;
  
  // Fitness Profile
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  primaryGoals: FitnessGoal[];
  favoriteExercises: string[];
  workoutPreferences: WorkoutPreference[];
  
  // Privacy Settings
  privacy: PrivacySettings;
  
  // Statistics (public/private based on privacy)
  stats: PublicUserStats;
  
  // Verification
  isVerified: boolean;
  verificationBadges: VerificationBadge[];
}

export interface PublicUserStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  currentLevel: number;
  achievementsCount: number;
  joinedDaysAgo: number;
  averageWorkoutsPerWeek: number;
  favoriteWorkoutTime: string; // e.g., "morning", "afternoon", "evening"
  
  // Recent activity (last 30 days)
  recentActivity: {
    workoutsThisMonth: number;
    xpGainedThisMonth: number;
    achievementsThisMonth: number;
    streakThisMonth: number;
  };
}

export interface FitnessGoal {
  id: string;
  type: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'flexibility' | 'general_fitness';
  name: string;
  description?: string;
  targetDate?: Date;
  isActive: boolean;
}

export interface WorkoutPreference {
  type: 'time' | 'duration' | 'intensity' | 'style' | 'equipment';
  value: string;
  priority: number; // 1-5, higher is more important
}

export interface VerificationBadge {
  id: string;
  type: 'trainer' | 'nutritionist' | 'athlete' | 'coach' | 'gym_owner';
  name: string;
  description: string;
  icon: string;
  verifiedAt: Date;
  verifiedBy?: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  workoutVisibility: 'public' | 'friends' | 'private';
  statsVisibility: 'public' | 'friends' | 'private';
  achievementsVisibility: 'public' | 'friends' | 'private';
  onlineStatusVisibility: 'public' | 'friends' | 'private';
  allowFriendRequests: boolean;
  allowMessages: 'everyone' | 'friends' | 'none';
  showInSearch: boolean;
  showLocation: boolean;
}

// ============================================================================
// Friend System Types
// ============================================================================

export interface GymFriend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: Date;
  acceptedAt?: Date;
  
  // Friend's basic info (cached for performance)
  friend: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    isOnline: boolean;
    lastActiveAt: Date;
    currentStreak: number;
    currentLevel: number;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  
  // Friendship metadata
  connectionStrength: number; // 0-100, based on interactions
  commonInterests: string[];
  sharedWorkouts: number;
  mutualFriends: number;
  
  // Interaction history
  lastInteraction?: Date;
  totalInteractions: number;
  interactionTypes: {
    likes: number;
    comments: number;
    workoutsTogether: number;
    challenges: number;
  };
  
  // Notifications
  notifyOnWorkout: boolean;
  notifyOnAchievement: boolean;
  notifyOnStreak: boolean;
}

export type FriendshipStatus = 
  | 'pending_sent'     // User sent request, waiting for response
  | 'pending_received' // User received request, needs to respond
  | 'accepted'         // Friends
  | 'blocked'          // User blocked this person
  | 'blocked_by'       // User was blocked by this person
  | 'declined'         // Request was declined
  | 'cancelled';       // Request was cancelled

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  
  // Sender info (cached)
  fromUser: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    currentStreak: number;
    currentLevel: number;
    mutualFriends: number;
    commonInterests: string[];
  };
}

export interface FriendSuggestion {
  user: UserProfile;
  reason: SuggestionReason;
  score: number; // 0-100, higher is better match
  mutualFriends: number;
  commonInterests: string[];
  similarStats: {
    levelDifference: number;
    streakSimilarity: number;
    goalAlignment: number;
  };
}

export type SuggestionReason = 
  | 'mutual_friends'
  | 'similar_goals'
  | 'similar_level'
  | 'same_location'
  | 'workout_compatibility'
  | 'common_interests'
  | 'activity_pattern';

// ============================================================================
// Search and Discovery Types
// ============================================================================

export interface UserSearchQuery {
  query?: string; // Username, display name, or bio search
  fitnessLevel?: ('beginner' | 'intermediate' | 'advanced' | 'expert')[];
  goals?: string[];
  location?: string;
  minLevel?: number;
  maxLevel?: number;
  minStreak?: number;
  isOnline?: boolean;
  hasAvatar?: boolean;
  isVerified?: boolean;
  sortBy?: 'relevance' | 'level' | 'streak' | 'recent_activity' | 'joined_date';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UserSearchResult {
  users: UserProfile[];
  total: number;
  hasMore: boolean;
  suggestions: FriendSuggestion[];
}

export interface UserSearchFilters {
  fitnessLevels: { value: string; label: string; count: number }[];
  goals: { value: string; label: string; count: number }[];
  locations: { value: string; label: string; count: number }[];
  levelRanges: { min: number; max: number; label: string; count: number }[];
}

// ============================================================================
// Social Activity Types
// ============================================================================

export interface SocialActivity {
  id: string;
  userId: string;
  type: SocialActivityType;
  timestamp: Date;
  data: Record<string, any>;
  visibility: 'public' | 'friends' | 'private';
  
  // Engagement
  likes: number;
  comments: number;
  shares: number;
  
  // User info (cached)
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    currentLevel: number;
  };
}

export type SocialActivityType = 
  | 'workout_completed'
  | 'achievement_unlocked'
  | 'level_up'
  | 'streak_milestone'
  | 'personal_record'
  | 'goal_achieved'
  | 'challenge_completed'
  | 'friend_added'
  | 'profile_updated';

export interface SocialFeed {
  activities: SocialActivity[];
  hasMore: boolean;
  nextCursor?: string;
  filters: {
    types: SocialActivityType[];
    friends: string[];
    timeRange: 'today' | 'week' | 'month' | 'all';
  };
}

// ============================================================================
// Interaction Types
// ============================================================================

export interface SocialInteraction {
  id: string;
  userId: string;
  targetId: string; // Activity, user, or content ID
  targetType: 'activity' | 'user' | 'workout' | 'achievement';
  type: InteractionType;
  timestamp: Date;
  data?: Record<string, any>;
}

export type InteractionType = 
  | 'like'
  | 'unlike'
  | 'comment'
  | 'share'
  | 'follow'
  | 'unfollow'
  | 'block'
  | 'unblock'
  | 'report';

export interface Comment {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'activity' | 'workout' | 'achievement';
  content: string;
  timestamp: Date;
  editedAt?: Date;
  likes: number;
  replies: Comment[];
  
  // User info (cached)
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    currentLevel: number;
  };
}

// ============================================================================
// Notification Types (Social-specific)
// ============================================================================

export interface SocialNotification {
  id: string;
  userId: string;
  type: SocialNotificationType;
  fromUserId?: string;
  targetId?: string;
  targetType?: 'activity' | 'workout' | 'achievement' | 'comment';
  message: string;
  timestamp: Date;
  isRead: boolean;
  data?: Record<string, any>;
  
  // From user info (cached)
  fromUser?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
}

export type SocialNotificationType = 
  | 'friend_request_received'
  | 'friend_request_accepted'
  | 'friend_workout_completed'
  | 'friend_achievement_unlocked'
  | 'friend_level_up'
  | 'activity_liked'
  | 'activity_commented'
  | 'comment_replied'
  | 'mentioned_in_comment'
  | 'workout_shared'
  | 'challenge_invited';

// ============================================================================
// Utility Types
// ============================================================================

export interface FriendshipStats {
  totalFriends: number;
  pendingRequests: number;
  sentRequests: number;
  mutualFriends: number;
  onlineFriends: number;
  recentlyActive: number; // Active in last 7 days
  connectionStrengthAverage: number;
  topInteractionTypes: { type: string; count: number }[];
}

export interface SocialEngagementStats {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageLikesPerPost: number;
  mostLikedActivity: SocialActivity | null;
  engagementRate: number; // Percentage
  topEngagers: { userId: string; username: string; interactions: number }[];
}

export interface UserCompatibility {
  userId: string;
  compatibilityScore: number; // 0-100
  factors: {
    fitnessLevel: number;
    goals: number;
    schedule: number;
    interests: number;
    location: number;
  };
  recommendations: string[];
}

export default {
  UserProfile,
  PublicUserStats,
  FitnessGoal,
  WorkoutPreference,
  VerificationBadge,
  PrivacySettings,
  GymFriend,
  FriendshipStatus,
  FriendRequest,
  FriendSuggestion,
  SuggestionReason,
  UserSearchQuery,
  UserSearchResult,
  UserSearchFilters,
  SocialActivity,
  SocialActivityType,
  SocialFeed,
  SocialInteraction,
  InteractionType,
  Comment,
  SocialNotification,
  SocialNotificationType,
  FriendshipStats,
  SocialEngagementStats,
  UserCompatibility
};