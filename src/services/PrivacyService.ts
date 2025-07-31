/**
 * Privacy Service
 * 
 * Service for managing user privacy settings, content visibility, and blocking/reporting.
 */

import type {
  PrivacySettings,
  BlockedUser,
  ReportedUser,
  ContentFilter,
  PrivacyCheckResult,
  VisibilityLevel,
  ContentType,
  ReportReason,
  DEFAULT_PRIVACY_SETTINGS
} from '@/types/privacy';

export class PrivacyService {
  private static instance: PrivacyService;
  private privacySettings: Map<string, PrivacySettings> = new Map();
  private blockedUsers: Map<string, BlockedUser[]> = new Map();
  private reportedUsers: ReportedUser[] = [];
  private contentFilters: Map<string, ContentFilter[]> = new Map();

  static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  // ============================================================================
  // Privacy Settings Management
  // ============================================================================

  /**
   * Get privacy settings for a user
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    let settings = this.privacySettings.get(userId);
    
    if (!settings) {
      // Create default settings for new user
      settings = {
        id: `privacy_${userId}_${Date.now()}`,
        userId,
        ...DEFAULT_PRIVACY_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      this.privacySettings.set(userId, settings);
    }
    
    return settings;
  }

  /**
   * Update privacy settings for a user
   */
  async updatePrivacySettings(
    userId: string, 
    updates: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    const currentSettings = await this.getPrivacySettings(userId);
    
    const updatedSettings: PrivacySettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.privacySettings.set(userId, updatedSettings);
    return updatedSettings;
  }

  // ============================================================================
  // Content Visibility Checks
  // ============================================================================

  /**
   * Check if a user can view specific content from another user
   */
  async canViewContent(
    viewerId: string,
    contentOwnerId: string,
    contentType: ContentType,
    friendshipStatus?: 'friends' | 'pending' | 'none'
  ): Promise<PrivacyCheckResult> {
    // User can always view their own content
    if (viewerId === contentOwnerId) {
      return { canView: true };
    }

    // Check if viewer is blocked
    const isBlocked = await this.isUserBlocked(contentOwnerId, viewerId);
    if (isBlocked) {
      return { canView: false, reason: 'User has blocked you' };
    }

    // Get content owner's privacy settings
    const privacySettings = await this.getPrivacySettings(contentOwnerId);
    
    // Get visibility level for this content type
    let visibilityLevel: VisibilityLevel;
    switch (contentType) {
      case 'profile':
        visibilityLevel = privacySettings.profileVisibility;
        break;
      case 'workouts':
        visibilityLevel = privacySettings.workoutVisibility;
        break;
      case 'achievements':
        visibilityLevel = privacySettings.achievementVisibility;
        break;
      case 'stats':
        visibilityLevel = privacySettings.statsVisibility;
        break;
      case 'activity':
        visibilityLevel = privacySettings.activityVisibility;
        break;
      default:
        visibilityLevel = 'private';
    }

    // Check visibility level
    switch (visibilityLevel) {
      case 'public':
        return { canView: true };
        
      case 'friends':
        if (friendshipStatus === 'friends') {
          return { canView: true };
        }
        return { canView: false, reason: 'Content is only visible to friends' };
        
      case 'private':
        return { canView: false, reason: 'Content is private' };
        
      default:
        return { canView: false, reason: 'Unknown visibility setting' };
    }
  }

  /**
   * Check if a user can send friend request to another user
   */
  async canSendFriendRequest(senderId: string, receiverId: string): Promise<PrivacyCheckResult> {
    // Check if sender is blocked
    const isBlocked = await this.isUserBlocked(receiverId, senderId);
    if (isBlocked) {
      return { canView: false, reason: 'You are blocked by this user' };
    }

    // Get receiver's privacy settings
    const privacySettings = await this.getPrivacySettings(receiverId);
    
    if (!privacySettings.allowFriendRequests) {
      return { canView: false, reason: 'User is not accepting friend requests' };
    }

    return { canView: true };
  }

  /**
   * Check if a user appears in search results
   */
  async canAppearInSearch(searcherId: string, userId: string): Promise<PrivacyCheckResult> {
    // Check if searcher is blocked
    const isBlocked = await this.isUserBlocked(userId, searcherId);
    if (isBlocked) {
      return { canView: false, reason: 'User has blocked you' };
    }

    // Get user's privacy settings
    const privacySettings = await this.getPrivacySettings(userId);
    
    if (!privacySettings.showInSearch) {
      return { canView: false, reason: 'User has disabled search visibility' };
    }

    return { canView: true };
  }

  // ============================================================================
  // Blocking System
  // ============================================================================

  /**
   * Block a user
   */
  async blockUser(userId: string, blockedUserId: string, reason?: string): Promise<void> {
    const blockRecord: BlockedUser = {
      id: `block_${userId}_${blockedUserId}_${Date.now()}`,
      userId,
      blockedUserId,
      reason,
      createdAt: new Date(),
    };

    const userBlocks = this.blockedUsers.get(userId) || [];
    
    // Check if already blocked
    const existingBlock = userBlocks.find(block => block.blockedUserId === blockedUserId);
    if (existingBlock) {
      throw new Error('User is already blocked');
    }

    userBlocks.push(blockRecord);
    this.blockedUsers.set(userId, userBlocks);
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const userBlocks = this.blockedUsers.get(userId) || [];
    const filteredBlocks = userBlocks.filter(block => block.blockedUserId !== blockedUserId);
    
    if (filteredBlocks.length === userBlocks.length) {
      throw new Error('User is not blocked');
    }

    this.blockedUsers.set(userId, filteredBlocks);
  }

  /**
   * Check if a user is blocked
   */
  async isUserBlocked(userId: string, potentiallyBlockedUserId: string): Promise<boolean> {
    const userBlocks = this.blockedUsers.get(userId) || [];
    return userBlocks.some(block => block.blockedUserId === potentiallyBlockedUserId);
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    return this.blockedUsers.get(userId) || [];
  }

  // ============================================================================
  // Reporting System
  // ============================================================================

  /**
   * Report a user
   */
  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: ReportReason,
    description?: string
  ): Promise<void> {
    const report: ReportedUser = {
      id: `report_${reporterId}_${reportedUserId}_${Date.now()}`,
      reporterId,
      reportedUserId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date(),
    };

    this.reportedUsers.push(report);
  }

  /**
   * Get reports made by a user
   */
  async getUserReports(userId: string): Promise<ReportedUser[]> {
    return this.reportedUsers.filter(report => report.reporterId === userId);
  }

  /**
   * Get reports against a user (admin function)
   */
  async getReportsAgainstUser(userId: string): Promise<ReportedUser[]> {
    return this.reportedUsers.filter(report => report.reportedUserId === userId);
  }

  // ============================================================================
  // Content Filtering
  // ============================================================================

  /**
   * Filter content based on privacy settings and user relationships
   */
  async filterContentForUser<T extends { userId: string }>(
    viewerId: string,
    content: T[],
    contentType: ContentType,
    getUserFriendshipStatus: (userId: string) => Promise<'friends' | 'pending' | 'none'>
  ): Promise<T[]> {
    const filteredContent: T[] = [];

    for (const item of content) {
      const friendshipStatus = await getUserFriendshipStatus(item.userId);
      const canView = await this.canViewContent(
        viewerId,
        item.userId,
        contentType,
        friendshipStatus
      );

      if (canView.canView) {
        filteredContent.push(item);
      }
    }

    return filteredContent;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get privacy summary for a user
   */
  async getPrivacySummary(userId: string): Promise<{
    settings: PrivacySettings;
    blockedUsersCount: number;
    reportsCount: number;
  }> {
    const settings = await this.getPrivacySettings(userId);
    const blockedUsers = await this.getBlockedUsers(userId);
    const reports = await this.getUserReports(userId);

    return {
      settings,
      blockedUsersCount: blockedUsers.length,
      reportsCount: reports.length,
    };
  }

  /**
   * Reset privacy settings to default
   */
  async resetPrivacySettings(userId: string): Promise<PrivacySettings> {
    const defaultSettings: PrivacySettings = {
      id: `privacy_${userId}_${Date.now()}`,
      userId,
      ...DEFAULT_PRIVACY_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.privacySettings.set(userId, defaultSettings);
    return defaultSettings;
  }
}

export const privacyService = PrivacyService.getInstance();