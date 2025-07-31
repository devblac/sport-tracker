/**
 * Privacy System Types
 * 
 * Type definitions for privacy settings, content visibility, and user blocking.
 */

export type VisibilityLevel = 'public' | 'friends' | 'private';
export type ContentType = 'profile' | 'workouts' | 'achievements' | 'stats' | 'activity';

export interface PrivacySettings {
  id: string;
  userId: string;
  
  // Profile visibility
  profileVisibility: VisibilityLevel;
  showRealName: boolean;
  showAge: boolean;
  showLocation: boolean;
  showJoinDate: boolean;
  
  // Content visibility
  workoutVisibility: VisibilityLevel;
  achievementVisibility: VisibilityLevel;
  statsVisibility: VisibilityLevel;
  activityVisibility: VisibilityLevel;
  
  // Social settings
  allowFriendRequests: boolean;
  allowMessages: boolean;
  showInSearch: boolean;
  showOnlineStatus: boolean;
  
  // Notification preferences
  notifyOnFriendRequest: boolean;
  notifyOnComment: boolean;
  notifyOnLike: boolean;
  notifyOnMention: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockedUser {
  id: string;
  userId: string; // User who blocked
  blockedUserId: string; // User who was blocked
  reason?: string;
  createdAt: Date;
}

export interface ReportedUser {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'fake_profile'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface ContentFilter {
  userId: string;
  contentType: ContentType;
  allowedUsers: string[]; // User IDs who can see this content
  blockedUsers: string[]; // User IDs who cannot see this content
}

export interface PrivacyCheckResult {
  canView: boolean;
  reason?: string;
}

// Default privacy settings for new users
export const DEFAULT_PRIVACY_SETTINGS: Omit<PrivacySettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  profileVisibility: 'public',
  showRealName: true,
  showAge: false,
  showLocation: false,
  showJoinDate: true,
  
  workoutVisibility: 'friends',
  achievementVisibility: 'public',
  statsVisibility: 'friends',
  activityVisibility: 'friends',
  
  allowFriendRequests: true,
  allowMessages: true,
  showInSearch: true,
  showOnlineStatus: true,
  
  notifyOnFriendRequest: true,
  notifyOnComment: true,
  notifyOnLike: true,
  notifyOnMention: true,
};