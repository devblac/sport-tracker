/**
 * Social Service
 * 
 * Manages gym friends, friend requests, user search, and social interactions.
 */

import { 
  filterUsers, 
  sortUsers, 
  calculateCompatibility,
  isProfileVisible,
  areStatsVisible,
  canSendFriendRequestToUser,
  calculateActivityScore
} from '@/utils/socialUtils';

import type {
  UserProfile,
  GymFriend,
  FriendRequest,
  FriendSuggestion,
  FriendshipStatus,
  UserSearchQuery,
  UserSearchResult,
  UserCompatibility,
  SocialActivity,
  SocialNotification,
  FriendshipStats,
  PrivacySettings
} from '@/types/social';

export class SocialService {
  private static instance: SocialService;
  private users: Map<string, UserProfile> = new Map();
  private friendships: Map<string, GymFriend[]> = new Map();
  private friendRequests: Map<string, FriendRequest[]> = new Map();
  private activities: Map<string, SocialActivity[]> = new Map();
  private notifications: Map<string, SocialNotification[]> = new Map();

  private constructor() {
    this.initializeTestData();
  }

  public static getInstance(): SocialService {
    if (!SocialService.instance) {
      SocialService.instance = new SocialService();
    }
    return SocialService.instance;
  }

  // ============================================================================
  // User Profile Management
  // ============================================================================

  /**
   * Get user profile by ID
   */
  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.users.get(userId) || null;
  }

  /**
   * Update user profile
   */
  public async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const currentProfile = this.users.get(userId);
    if (!currentProfile) {
      throw new Error('User not found');
    }

    const updatedProfile = { ...currentProfile, ...updates };
    this.users.set(userId, updatedProfile);
    
    // Persist to storage
    this.saveUserProfile(updatedProfile);
    
    return updatedProfile;
  }

  /**
   * Update user privacy settings
   */
  public async updatePrivacySettings(userId: string, privacy: Partial<PrivacySettings>): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    user.privacy = { ...user.privacy, ...privacy };
    this.users.set(userId, user);
    this.saveUserProfile(user);
  }

  // ============================================================================
  // User Search and Discovery
  // ============================================================================

  /**
   * Search users with filters and pagination
   */
  public async searchUsers(
    query: UserSearchQuery,
    viewerId?: string
  ): Promise<UserSearchResult> {
    const allUsers = Array.from(this.users.values());
    const viewer = viewerId ? this.users.get(viewerId) : null;

    // Filter out users based on privacy settings
    const visibleUsers = allUsers.filter(user => {
      if (user.id === viewerId) return false; // Don't include self
      if (!user.privacy.showInSearch && viewerId !== user.id) return false;
      
      const friendship = this.getFriendship(viewerId || '', user.id);
      return isProfileVisible(user, viewer, friendship);
    });

    // Apply search filters
    const filteredUsers = filterUsers(visibleUsers, query);
    
    // Generate suggestions for the viewer
    const suggestions = viewerId ? await this.generateFriendSuggestions(viewerId) : [];

    return {
      users: filteredUsers,
      total: filteredUsers.length,
      hasMore: false, // Would implement pagination in real app
      suggestions: suggestions.slice(0, 5) // Top 5 suggestions
    };
  }

  /**
   * Generate friend suggestions for user
   */
  public async generateFriendSuggestions(userId: string): Promise<FriendSuggestion[]> {
    const user = this.users.get(userId);
    if (!user) return [];

    const allUsers = Array.from(this.users.values());
    const userFriends = this.getUserFriends(userId);
    const friendIds = new Set(userFriends.map(f => f.friendId));

    // Filter potential friends
    const candidates = allUsers.filter(candidate => {
      if (candidate.id === userId) return false;
      if (friendIds.has(candidate.id)) return false;
      if (!candidate.privacy.showInSearch) return false;
      
      const friendship = this.getFriendship(userId, candidate.id);
      return isProfileVisible(candidate, user, friendship);
    });

    // Calculate compatibility and generate suggestions
    const suggestions: FriendSuggestion[] = [];

    for (const candidate of candidates) {
      const compatibility = calculateCompatibility(user, candidate);
      const mutualFriends = this.getMutualFriendsCount(userId, candidate.id);
      const commonInterests = this.getCommonInterests(user, candidate);
      
      // Determine suggestion reason
      let reason: FriendSuggestion['reason'] = 'common_interests';
      let score = compatibility.compatibilityScore;

      if (mutualFriends > 0) {
        reason = 'mutual_friends';
        score += mutualFriends * 10; // Boost score for mutual friends
      } else if (compatibility.factors.goals > 80) {
        reason = 'similar_goals';
      } else if (compatibility.factors.fitnessLevel > 80) {
        reason = 'similar_level';
      } else if (compatibility.factors.location > 80) {
        reason = 'same_location';
      }

      suggestions.push({
        user: candidate,
        reason,
        score: Math.min(100, score),
        mutualFriends,
        commonInterests,
        similarStats: {
          levelDifference: Math.abs(user.stats.currentLevel - candidate.stats.currentLevel),
          streakSimilarity: Math.min(user.stats.currentStreak, candidate.stats.currentStreak) / 
                           Math.max(user.stats.currentStreak, candidate.stats.currentStreak) * 100,
          goalAlignment: compatibility.factors.goals
        }
      });
    }

    // Sort by score and return top suggestions
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  // ============================================================================
  // Friend Request Management
  // ============================================================================

  /**
   * Send friend request
   */
  public async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
    message?: string
  ): Promise<FriendRequest> {
    const fromUser = this.users.get(fromUserId);
    const toUser = this.users.get(toUserId);

    if (!fromUser || !toUser) {
      throw new Error('User not found');
    }

    // Check if request can be sent
    const existingFriendship = this.getFriendship(fromUserId, toUserId);
    if (!canSendFriendRequestToUser(toUser, fromUser, existingFriendship)) {
      throw new Error('Cannot send friend request to this user');
    }

    // Create friend request
    const request: FriendRequest = {
      id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId,
      toUserId,
      status: 'pending',
      message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      fromUser: {
        id: fromUser.id,
        username: fromUser.username,
        displayName: fromUser.displayName,
        avatar: fromUser.avatar,
        fitnessLevel: fromUser.fitnessLevel,
        currentStreak: fromUser.stats.currentStreak,
        currentLevel: fromUser.stats.currentLevel,
        mutualFriends: this.getMutualFriendsCount(fromUserId, toUserId),
        commonInterests: this.getCommonInterests(fromUser, toUser)
      }
    };

    // Store request
    const toUserRequests = this.friendRequests.get(toUserId) || [];
    toUserRequests.push(request);
    this.friendRequests.set(toUserId, toUserRequests);

    // Update friendship status
    this.updateFriendshipStatus(fromUserId, toUserId, 'pending_sent');
    this.updateFriendshipStatus(toUserId, fromUserId, 'pending_received');

    // Create notification
    await this.createSocialNotification(toUserId, {
      type: 'friend_request_received',
      fromUserId,
      message: `${fromUser.displayName} te envió una solicitud de amistad`,
      data: { requestId: request.id, message }
    });

    // Persist
    this.saveFriendRequests(toUserId);
    
    return request;
  }

  /**
   * Respond to friend request
   */
  public async respondToFriendRequest(
    requestId: string,
    userId: string,
    response: 'accept' | 'decline'
  ): Promise<void> {
    const userRequests = this.friendRequests.get(userId) || [];
    const request = userRequests.find(r => r.id === requestId);

    if (!request || request.status !== 'pending') {
      throw new Error('Friend request not found or already responded');
    }

    request.status = response === 'accept' ? 'accepted' : 'declined';
    request.respondedAt = new Date();

    if (response === 'accept') {
      // Create friendship
      await this.createFriendship(request.fromUserId, userId);
      
      // Create notification for requester
      const accepter = this.users.get(userId);
      if (accepter) {
        await this.createSocialNotification(request.fromUserId, {
          type: 'friend_request_accepted',
          fromUserId: userId,
          message: `${accepter.displayName} aceptó tu solicitud de amistad`
        });
      }
    } else {
      // Update friendship status to declined
      this.updateFriendshipStatus(request.fromUserId, userId, 'declined');
      this.updateFriendshipStatus(userId, request.fromUserId, 'declined');
    }

    this.saveFriendRequests(userId);
  }

  /**
   * Cancel friend request
   */
  public async cancelFriendRequest(requestId: string, userId: string): Promise<void> {
    // Find and cancel the request
    for (const [targetUserId, requests] of this.friendRequests.entries()) {
      const request = requests.find(r => r.id === requestId && r.fromUserId === userId);
      if (request) {
        request.status = 'cancelled';
        
        // Update friendship status
        this.updateFriendshipStatus(userId, targetUserId, 'cancelled');
        this.updateFriendshipStatus(targetUserId, userId, 'cancelled');
        
        this.saveFriendRequests(targetUserId);
        break;
      }
    }
  }

  // ============================================================================
  // Friendship Management
  // ============================================================================

  /**
   * Create friendship between two users
   */
  private async createFriendship(userId1: string, userId2: string): Promise<void> {
    const user1 = this.users.get(userId1);
    const user2 = this.users.get(userId2);

    if (!user1 || !user2) throw new Error('User not found');

    const now = new Date();

    // Create friendship for user1
    const friendship1: GymFriend = {
      id: `friendship_${userId1}_${userId2}`,
      userId: userId1,
      friendId: userId2,
      status: 'accepted',
      createdAt: now,
      acceptedAt: now,
      friend: {
        id: user2.id,
        username: user2.username,
        displayName: user2.displayName,
        avatar: user2.avatar,
        isOnline: user2.isOnline,
        lastActiveAt: user2.lastActiveAt,
        currentStreak: user2.stats.currentStreak,
        currentLevel: user2.stats.currentLevel,
        fitnessLevel: user2.fitnessLevel
      },
      connectionStrength: 50, // Starting value
      commonInterests: this.getCommonInterests(user1, user2),
      sharedWorkouts: 0,
      mutualFriends: this.getMutualFriendsCount(userId1, userId2),
      totalInteractions: 0,
      interactionTypes: {
        likes: 0,
        comments: 0,
        workoutsTogether: 0,
        challenges: 0
      },
      notifyOnWorkout: true,
      notifyOnAchievement: true,
      notifyOnStreak: true
    };

    // Create friendship for user2 (mirror)
    const friendship2: GymFriend = {
      ...friendship1,
      id: `friendship_${userId2}_${userId1}`,
      userId: userId2,
      friendId: userId1,
      friend: {
        id: user1.id,
        username: user1.username,
        displayName: user1.displayName,
        avatar: user1.avatar,
        isOnline: user1.isOnline,
        lastActiveAt: user1.lastActiveAt,
        currentStreak: user1.stats.currentStreak,
        currentLevel: user1.stats.currentLevel,
        fitnessLevel: user1.fitnessLevel
      }
    };

    // Store friendships
    const user1Friends = this.friendships.get(userId1) || [];
    const user2Friends = this.friendships.get(userId2) || [];

    user1Friends.push(friendship1);
    user2Friends.push(friendship2);

    this.friendships.set(userId1, user1Friends);
    this.friendships.set(userId2, user2Friends);

    // Persist
    this.saveFriendships(userId1);
    this.saveFriendships(userId2);
  }

  /**
   * Remove friendship
   */
  public async removeFriendship(userId: string, friendId: string): Promise<void> {
    // Remove from both users' friend lists
    const userFriends = this.friendships.get(userId) || [];
    const friendFriends = this.friendships.get(friendId) || [];

    this.friendships.set(userId, userFriends.filter(f => f.friendId !== friendId));
    this.friendships.set(friendId, friendFriends.filter(f => f.friendId !== userId));

    // Persist
    this.saveFriendships(userId);
    this.saveFriendships(friendId);
  }

  /**
   * Block user
   */
  public async blockUser(userId: string, targetUserId: string): Promise<void> {
    // Remove existing friendship if any
    await this.removeFriendship(userId, targetUserId);

    // Update friendship status
    this.updateFriendshipStatus(userId, targetUserId, 'blocked');
    this.updateFriendshipStatus(targetUserId, userId, 'blocked_by');
  }

  /**
   * Unblock user
   */
  public async unblockUser(userId: string, targetUserId: string): Promise<void> {
    // Reset friendship status
    this.removeFriendshipStatus(userId, targetUserId);
    this.removeFriendshipStatus(targetUserId, userId);
  }

  // ============================================================================
  // Data Retrieval Methods
  // ============================================================================

  /**
   * Get user's friends
   */
  public getUserFriends(userId: string): GymFriend[] {
    return this.friendships.get(userId) || [];
  }

  /**
   * Get user's friend requests
   */
  public getUserFriendRequests(userId: string): FriendRequest[] {
    return this.friendRequests.get(userId) || [];
  }

  /**
   * Get friendship between two users
   */
  public getFriendship(userId: string, friendId: string): GymFriend | undefined {
    const friends = this.friendships.get(userId) || [];
    return friends.find(f => f.friendId === friendId);
  }

  /**
   * Get friendship statistics for user
   */
  public getFriendshipStats(userId: string): FriendshipStats {
    const friends = this.getUserFriends(userId);
    const requests = this.getUserFriendRequests(userId);

    const acceptedFriends = friends.filter(f => f.status === 'accepted');
    const onlineFriends = acceptedFriends.filter(f => f.friend.isOnline);
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentlyActive = acceptedFriends.filter(f => 
      new Date(f.friend.lastActiveAt) > sevenDaysAgo
    );

    return {
      totalFriends: acceptedFriends.length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      sentRequests: 0, // Would need to track sent requests separately
      mutualFriends: 0, // Would calculate based on friend networks
      onlineFriends: onlineFriends.length,
      recentlyActive: recentlyActive.length,
      connectionStrengthAverage: acceptedFriends.length > 0 
        ? acceptedFriends.reduce((sum, f) => sum + f.connectionStrength, 0) / acceptedFriends.length
        : 0,
      topInteractionTypes: [
        { type: 'likes', count: acceptedFriends.reduce((sum, f) => sum + f.interactionTypes.likes, 0) },
        { type: 'comments', count: acceptedFriends.reduce((sum, f) => sum + f.interactionTypes.comments, 0) },
        { type: 'workouts', count: acceptedFriends.reduce((sum, f) => sum + f.interactionTypes.workoutsTogether, 0) }
      ]
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private updateFriendshipStatus(userId: string, friendId: string, status: FriendshipStatus): void {
    const friends = this.friendships.get(userId) || [];
    let friendship = friends.find(f => f.friendId === friendId);

    if (friendship) {
      friendship.status = status;
    } else {
      // Create minimal friendship record for status tracking
      const friend = this.users.get(friendId);
      if (friend) {
        friendship = {
          id: `temp_${userId}_${friendId}`,
          userId,
          friendId,
          status,
          createdAt: new Date(),
          friend: {
            id: friend.id,
            username: friend.username,
            displayName: friend.displayName,
            avatar: friend.avatar,
            isOnline: friend.isOnline,
            lastActiveAt: friend.lastActiveAt,
            currentStreak: friend.stats.currentStreak,
            currentLevel: friend.stats.currentLevel,
            fitnessLevel: friend.fitnessLevel
          },
          connectionStrength: 0,
          commonInterests: [],
          sharedWorkouts: 0,
          mutualFriends: 0,
          totalInteractions: 0,
          interactionTypes: { likes: 0, comments: 0, workoutsTogether: 0, challenges: 0 },
          notifyOnWorkout: false,
          notifyOnAchievement: false,
          notifyOnStreak: false
        };
        friends.push(friendship);
      }
    }

    this.friendships.set(userId, friends);
  }

  private removeFriendshipStatus(userId: string, friendId: string): void {
    const friends = this.friendships.get(userId) || [];
    this.friendships.set(userId, friends.filter(f => f.friendId !== friendId));
  }

  private getMutualFriendsCount(userId1: string, userId2: string): number {
    const user1Friends = new Set(this.getUserFriends(userId1).map(f => f.friendId));
    const user2Friends = new Set(this.getUserFriends(userId2).map(f => f.friendId));
    
    return Array.from(user1Friends).filter(id => user2Friends.has(id)).length;
  }

  private getCommonInterests(user1: UserProfile, user2: UserProfile): string[] {
    return user1.favoriteExercises.filter(exercise => 
      user2.favoriteExercises.includes(exercise)
    );
  }

  private async createSocialNotification(
    userId: string,
    notification: Omit<SocialNotification, 'id' | 'userId' | 'timestamp' | 'isRead' | 'fromUser'>
  ): Promise<void> {
    const fromUser = notification.fromUserId ? this.users.get(notification.fromUserId) : undefined;
    
    const fullNotification: SocialNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: new Date(),
      isRead: false,
      fromUser: fromUser ? {
        id: fromUser.id,
        username: fromUser.username,
        displayName: fromUser.displayName,
        avatar: fromUser.avatar
      } : undefined,
      ...notification
    };

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.unshift(fullNotification);
    this.notifications.set(userId, userNotifications);

    // Keep only last 100 notifications
    if (userNotifications.length > 100) {
      userNotifications.splice(100);
    }

    this.saveNotifications(userId);
  }

  // ============================================================================
  // Persistence Methods
  // ============================================================================

  private saveUserProfile(user: UserProfile): void {
    localStorage.setItem(`user_profile_${user.id}`, JSON.stringify(user));
  }

  private saveFriendships(userId: string): void {
    const friendships = this.friendships.get(userId) || [];
    localStorage.setItem(`friendships_${userId}`, JSON.stringify(friendships));
  }

  private saveFriendRequests(userId: string): void {
    const requests = this.friendRequests.get(userId) || [];
    localStorage.setItem(`friend_requests_${userId}`, JSON.stringify(requests));
  }

  private saveNotifications(userId: string): void {
    const notifications = this.notifications.get(userId) || [];
    localStorage.setItem(`social_notifications_${userId}`, JSON.stringify(notifications));
  }

  // ============================================================================
  // Test Data Initialization
  // ============================================================================

  private initializeTestData(): void {
    // Create test users
    const testUsers: UserProfile[] = [
      {
        id: 'user1',
        username: 'fitness_mike',
        displayName: 'Mike Rodriguez',
        email: 'mike@example.com',
        avatar: '/avatars/mike.jpg',
        bio: 'Passionate about strength training and helping others reach their goals.',
        location: 'Madrid, España',
        joinedAt: new Date('2023-01-15'),
        lastActiveAt: new Date(),
        isOnline: true,
        fitnessLevel: 'advanced',
        primaryGoals: [
          { id: 'g1', type: 'strength', name: 'Increase Strength', isActive: true },
          { id: 'g2', type: 'muscle_gain', name: 'Build Muscle', isActive: true }
        ],
        favoriteExercises: ['bench_press', 'squat', 'deadlift'],
        workoutPreferences: [
          { type: 'time', value: 'morning', priority: 5 },
          { type: 'duration', value: '60-90min', priority: 4 }
        ],
        privacy: {
          profileVisibility: 'public',
          workoutVisibility: 'public',
          statsVisibility: 'public',
          achievementsVisibility: 'public',
          onlineStatusVisibility: 'friends',
          allowFriendRequests: true,
          allowMessages: 'friends',
          showInSearch: true,
          showLocation: true
        },
        stats: {
          totalWorkouts: 245,
          currentStreak: 15,
          longestStreak: 42,
          totalXP: 12500,
          currentLevel: 8,
          achievementsCount: 23,
          joinedDaysAgo: 365,
          averageWorkoutsPerWeek: 4.2,
          favoriteWorkoutTime: 'morning',
          recentActivity: {
            workoutsThisMonth: 18,
            xpGainedThisMonth: 1200,
            achievementsThisMonth: 3,
            streakThisMonth: 15
          }
        },
        isVerified: false,
        verificationBadges: []
      },
      {
        id: 'user2',
        username: 'yoga_sarah',
        displayName: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        bio: 'Yoga instructor and wellness coach. Finding balance in movement.',
        location: 'Barcelona, España',
        joinedAt: new Date('2023-03-20'),
        lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isOnline: false,
        fitnessLevel: 'intermediate',
        primaryGoals: [
          { id: 'g3', type: 'flexibility', name: 'Improve Flexibility', isActive: true },
          { id: 'g4', type: 'general_fitness', name: 'Overall Wellness', isActive: true }
        ],
        favoriteExercises: ['yoga_flow', 'meditation', 'pilates'],
        workoutPreferences: [
          { type: 'time', value: 'evening', priority: 5 },
          { type: 'duration', value: '45-60min', priority: 4 }
        ],
        privacy: {
          profileVisibility: 'public',
          workoutVisibility: 'friends',
          statsVisibility: 'friends',
          achievementsVisibility: 'public',
          onlineStatusVisibility: 'friends',
          allowFriendRequests: true,
          allowMessages: 'friends',
          showInSearch: true,
          showLocation: false
        },
        stats: {
          totalWorkouts: 156,
          currentStreak: 8,
          longestStreak: 28,
          totalXP: 7800,
          currentLevel: 5,
          achievementsCount: 15,
          joinedDaysAgo: 280,
          averageWorkoutsPerWeek: 3.5,
          favoriteWorkoutTime: 'evening',
          recentActivity: {
            workoutsThisMonth: 14,
            xpGainedThisMonth: 850,
            achievementsThisMonth: 2,
            streakThisMonth: 8
          }
        },
        isVerified: true,
        verificationBadges: [
          {
            id: 'v1',
            type: 'trainer',
            name: 'Certified Yoga Instructor',
            description: 'RYT-200 Certified',
            icon: '🧘‍♀️',
            verifiedAt: new Date('2023-04-01'),
            verifiedBy: 'Yoga Alliance'
          }
        ]
      }
    ];

    // Store test users
    testUsers.forEach(user => {
      this.users.set(user.id, user);
      this.saveUserProfile(user);
    });
  }
}

export default SocialService;