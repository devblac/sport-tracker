/**
 * Social Hook
 * 
 * React hook for managing social features, friends, and user interactions.
 */

import { useState, useEffect, useCallback } from 'react';
import { realSocialService } from '@/services/RealSocialService';

import type {
  UserProfile,
  GymFriend,
  FriendRequest,
  FriendSuggestion,
  UserSearchQuery,
  UserSearchResult,
  FriendshipStats,
  SocialNotification,
  PrivacySettings
} from '@/types/social';

interface UseSocialReturn {
  // User Profile
  userProfile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePrivacySettings: (privacy: Partial<PrivacySettings>) => Promise<void>;
  
  // Friends
  friends: GymFriend[];
  friendRequests: FriendRequest[];
  friendshipStats: FriendshipStats | null;
  
  // Search and Discovery
  searchUsers: (query: UserSearchQuery) => Promise<UserSearchResult>;
  friendSuggestions: FriendSuggestion[];
  refreshSuggestions: () => Promise<void>;
  
  // Friend Requests
  sendFriendRequest: (toUserId: string, message?: string) => Promise<void>;
  respondToFriendRequest: (requestId: string, response: 'accept' | 'decline') => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  
  // Friendship Management
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  
  // Notifications
  notifications: SocialNotification[];
  unreadNotifications: number;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  
  // Utilities
  getFriendship: (userId: string) => GymFriend | undefined;
  getUserProfile: (userId: string) => Promise<UserProfile | null>;
  
  // Loading States
  isLoading: boolean;
  isUpdatingProfile: boolean;
  isSendingRequest: boolean;
  isSearching: boolean;
}

export function useSocial(userId: string): UseSocialReturn {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<GymFriend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendshipStats, setFriendshipStats] = useState<FriendshipStats | null>(null);
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestion[]>([]);
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const socialService = realSocialService;

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load friends and requests
        const userFriends = await socialService.getFriends(userId);
        const userRequests = await socialService.getPendingFriendRequests(userId);
        
        setFriends(userFriends);
        setFriendRequests(userRequests);
        
        // Calculate basic stats
        const stats = {
          totalFriends: userFriends.length,
          pendingRequests: userRequests.length,
          sentRequests: 0,
          mutualFriends: 0,
          onlineFriends: 0,
          recentlyActive: 0,
          connectionStrengthAverage: 0,
          topInteractionTypes: []
        };
        setFriendshipStats(stats);
        
        // Load suggestions
        const suggestions = await socialService.getFriendSuggestions(userId);
        setFriendSuggestions(suggestions.map(user => ({
          user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            avatar: user.avatar_url,
            fitnessLevel: user.fitness_level,
            // Add other required fields with defaults
            email: '',
            bio: '',
            location: '',
            joinedAt: new Date(),
            lastActiveAt: new Date(),
            isOnline: false,
            primaryGoals: [],
            favoriteExercises: [],
            workoutPreferences: [],
            privacy: {
              profileVisibility: 'public',
              workoutVisibility: 'public',
              statsVisibility: 'public',
              achievementsVisibility: 'public',
              onlineStatusVisibility: 'public',
              allowFriendRequests: true,
              allowMessages: 'friends',
              showInSearch: true,
              showLocation: true
            },
            stats: {
              totalWorkouts: 0,
              currentStreak: 0,
              longestStreak: 0,
              totalXP: 0,
              currentLevel: 1,
              achievementsCount: 0,
              joinedDaysAgo: 0,
              averageWorkoutsPerWeek: 0,
              favoriteWorkoutTime: 'morning',
              recentActivity: {
                workoutsThisMonth: 0,
                xpGainedThisMonth: 0,
                achievementsThisMonth: 0,
                streakThisMonth: 0
              }
            },
            isVerified: false,
            verificationBadges: []
          },
          reason: 'common_interests' as const,
          score: 50,
          mutualFriends: 0,
          commonInterests: [],
          similarStats: {
            levelDifference: 0,
            streakSimilarity: 0,
            goalAlignment: 0
          }
        })));
        
        // Load notifications (would come from service in real app)
        const storedNotifications = JSON.parse(
          localStorage.getItem(`social_notifications_${userId}`) || '[]'
        );
        setNotifications(storedNotifications);
        
      } catch (error) {
        console.error('Error loading social data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, socialService]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!userId) return;

    try {
      setIsUpdatingProfile(true);
      const updatedProfile = await socialService.updateUserProfile(userId, updates);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [userId, socialService]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (privacy: Partial<PrivacySettings>): Promise<void> => {
    if (!userId) return;

    try {
      setIsUpdatingProfile(true);
      await socialService.updatePrivacySettings(userId, privacy);
      
      // Refresh profile
      const updatedProfile = await socialService.getUserProfile(userId);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [userId, socialService]);

  // Search users
  const searchUsers = useCallback(async (query: UserSearchQuery): Promise<UserSearchResult> => {
    try {
      setIsSearching(true);
      const searchQuery = query.query || '';
      const results = await socialService.searchUsers(searchQuery, query.limit || 20);
      
      return {
        users: results.map(user => ({
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          avatar: user.avatar_url,
          fitnessLevel: user.fitness_level,
          // Add other required fields with defaults
          email: '',
          bio: '',
          location: '',
          joinedAt: new Date(),
          lastActiveAt: new Date(),
          isOnline: false,
          primaryGoals: [],
          favoriteExercises: [],
          workoutPreferences: [],
          privacy: {
            profileVisibility: 'public',
            workoutVisibility: 'public',
            statsVisibility: 'public',
            achievementsVisibility: 'public',
            onlineStatusVisibility: 'public',
            allowFriendRequests: true,
            allowMessages: 'friends',
            showInSearch: true,
            showLocation: true
          },
          stats: {
            totalWorkouts: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalXP: 0,
            currentLevel: 1,
            achievementsCount: 0,
            joinedDaysAgo: 0,
            averageWorkoutsPerWeek: 0,
            favoriteWorkoutTime: 'morning',
            recentActivity: {
              workoutsThisMonth: 0,
              xpGainedThisMonth: 0,
              achievementsThisMonth: 0,
              streakThisMonth: 0
            }
          },
          isVerified: false,
          verificationBadges: []
        })),
        total: results.length,
        hasMore: false,
        suggestions: []
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, [userId, socialService]);

  // Refresh friend suggestions
  const refreshSuggestions = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const suggestions = await socialService.getFriendSuggestions(userId);
      setFriendSuggestions(suggestions.map(user => ({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          avatar: user.avatar_url,
          fitnessLevel: user.fitness_level,
          // Add other required fields with defaults
          email: '',
          bio: '',
          location: '',
          joinedAt: new Date(),
          lastActiveAt: new Date(),
          isOnline: false,
          primaryGoals: [],
          favoriteExercises: [],
          workoutPreferences: [],
          privacy: {
            profileVisibility: 'public',
            workoutVisibility: 'public',
            statsVisibility: 'public',
            achievementsVisibility: 'public',
            onlineStatusVisibility: 'public',
            allowFriendRequests: true,
            allowMessages: 'friends',
            showInSearch: true,
            showLocation: true
          },
          stats: {
            totalWorkouts: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalXP: 0,
            currentLevel: 1,
            achievementsCount: 0,
            joinedDaysAgo: 0,
            averageWorkoutsPerWeek: 0,
            favoriteWorkoutTime: 'morning',
            recentActivity: {
              workoutsThisMonth: 0,
              xpGainedThisMonth: 0,
              achievementsThisMonth: 0,
              streakThisMonth: 0
            }
          },
          isVerified: false,
          verificationBadges: []
        },
        reason: 'common_interests' as const,
        score: 50,
        mutualFriends: 0,
        commonInterests: [],
        similarStats: {
          levelDifference: 0,
          streakSimilarity: 0,
          goalAlignment: 0
        }
      })));
    } catch (error) {
      console.error('Error refreshing suggestions:', error);
    }
  }, [userId, socialService]);

  // Send friend request
  const sendFriendRequest = useCallback(async (toUserId: string, message?: string): Promise<void> => {
    if (!userId) return;

    try {
      setIsSendingRequest(true);
      await socialService.sendFriendRequest(userId, toUserId);
      
      // Refresh data
      const userFriends = await socialService.getFriends(userId);
      const userRequests = await socialService.getPendingFriendRequests(userId);
      
      setFriends(userFriends);
      setFriendRequests(userRequests);
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    } finally {
      setIsSendingRequest(false);
    }
  }, [userId, socialService]);

  // Respond to friend request
  const respondToFriendRequest = useCallback(async (
    requestId: string, 
    response: 'accept' | 'decline'
  ): Promise<void> => {
    if (!userId) return;

    try {
      if (response === 'accept') {
        await socialService.acceptFriendRequest(userId, requestId);
      } else {
        await socialService.rejectFriendRequest(userId, requestId);
      }
      
      // Refresh data
      const userFriends = await socialService.getFriends(userId);
      const userRequests = await socialService.getPendingFriendRequests(userId);
      
      setFriends(userFriends);
      setFriendRequests(userRequests);
      
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  }, [userId, socialService]);

  // Cancel friend request
  const cancelFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    if (!userId) return;

    try {
      // Note: RealSocialService doesn't have cancelFriendRequest method yet
      // For now, we'll just refresh the data
      console.warn('Cancel friend request not implemented in RealSocialService');
      
      // Refresh data
      const userFriends = await socialService.getFriends(userId);
      const userRequests = await socialService.getPendingFriendRequests(userId);
      
      setFriends(userFriends);
      setFriendRequests(userRequests);
      
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      throw error;
    }
  }, [userId, socialService]);

  // Remove friend
  const removeFriend = useCallback(async (friendId: string): Promise<void> => {
    if (!userId) return;

    try {
      // Note: RealSocialService doesn't have removeFriendship method yet
      console.warn('Remove friendship not implemented in RealSocialService');
      
      // Refresh data
      const userFriends = await socialService.getFriends(userId);
      
      setFriends(userFriends);
      
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }, [userId, socialService]);

  // Block user
  const blockUser = useCallback(async (targetUserId: string): Promise<void> => {
    if (!userId) return;

    try {
      // Note: RealSocialService doesn't have blockUser method yet
      console.warn('Block user not implemented in RealSocialService');
      
      // Refresh data
      const userFriends = await socialService.getFriends(userId);
      
      setFriends(userFriends);
      
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }, [userId, socialService]);

  // Unblock user
  const unblockUser = useCallback(async (targetUserId: string): Promise<void> => {
    if (!userId) return;

    try {
      // Note: RealSocialService doesn't have unblockUser method yet
      console.warn('Unblock user not implemented in RealSocialService');
      
      // Refresh data
      const userFriends = await socialService.getFriends(userId);
      setFriends(userFriends);
      
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }, [userId, socialService]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<void> => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    
    // Persist to storage
    const updatedNotifications = notifications.map(notif => 
      notif.id === notificationId 
        ? { ...notif, isRead: true }
        : notif
    );
    localStorage.setItem(`social_notifications_${userId}`, JSON.stringify(updatedNotifications));
  }, [notifications, userId]);

  // Get friendship with specific user
  const getFriendship = useCallback((targetUserId: string): GymFriend | undefined => {
    return friends.find(f => f.friend_id === targetUserId);
  }, [friends]);

  // Get user profile by ID
  const getUserProfile = useCallback(async (targetUserId: string): Promise<UserProfile | null> => {
    // Note: RealSocialService doesn't have getUserProfile method yet
    console.warn('Get user profile not implemented in RealSocialService');
    return null;
  }, []);

  // Computed values
  const unreadNotifications = notifications.filter(notif => !notif.isRead).length;

  return {
    // User Profile
    userProfile,
    updateProfile,
    updatePrivacySettings,
    
    // Friends
    friends,
    friendRequests,
    friendshipStats,
    
    // Search and Discovery
    searchUsers,
    friendSuggestions,
    refreshSuggestions,
    
    // Friend Requests
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    
    // Friendship Management
    removeFriend,
    blockUser,
    unblockUser,
    
    // Notifications
    notifications,
    unreadNotifications,
    markNotificationAsRead,
    
    // Utilities
    getFriendship,
    getUserProfile,
    
    // Loading States
    isLoading,
    isUpdatingProfile,
    isSendingRequest,
    isSearching
  };
}

export default useSocial;