/**
 * Social Hook
 * 
 * React hook for managing social features, friends, and user interactions.
 */

import { useState, useEffect, useCallback } from 'react';
import { SocialService } from '@/services/SocialService';

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

  const socialService = SocialService.getInstance();

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load user profile
        const profile = await socialService.getUserProfile(userId);
        setUserProfile(profile);
        
        // Load friends and requests
        const userFriends = socialService.getUserFriends(userId);
        const userRequests = socialService.getUserFriendRequests(userId);
        const stats = socialService.getFriendshipStats(userId);
        
        setFriends(userFriends);
        setFriendRequests(userRequests);
        setFriendshipStats(stats);
        
        // Load suggestions
        const suggestions = await socialService.generateFriendSuggestions(userId);
        setFriendSuggestions(suggestions);
        
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
      return await socialService.searchUsers(query, userId);
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
      const suggestions = await socialService.generateFriendSuggestions(userId);
      setFriendSuggestions(suggestions);
    } catch (error) {
      console.error('Error refreshing suggestions:', error);
    }
  }, [userId, socialService]);

  // Send friend request
  const sendFriendRequest = useCallback(async (toUserId: string, message?: string): Promise<void> => {
    if (!userId) return;

    try {
      setIsSendingRequest(true);
      await socialService.sendFriendRequest(userId, toUserId, message);
      
      // Refresh data
      const userFriends = socialService.getUserFriends(userId);
      const userRequests = socialService.getUserFriendRequests(userId);
      const stats = socialService.getFriendshipStats(userId);
      
      setFriends(userFriends);
      setFriendRequests(userRequests);
      setFriendshipStats(stats);
      
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
      await socialService.respondToFriendRequest(requestId, userId, response);
      
      // Refresh data
      const userFriends = socialService.getUserFriends(userId);
      const userRequests = socialService.getUserFriendRequests(userId);
      const stats = socialService.getFriendshipStats(userId);
      
      setFriends(userFriends);
      setFriendRequests(userRequests);
      setFriendshipStats(stats);
      
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  }, [userId, socialService]);

  // Cancel friend request
  const cancelFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    if (!userId) return;

    try {
      await socialService.cancelFriendRequest(requestId, userId);
      
      // Refresh data
      const userFriends = socialService.getUserFriends(userId);
      const userRequests = socialService.getUserFriendRequests(userId);
      
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
      await socialService.removeFriendship(userId, friendId);
      
      // Refresh data
      const userFriends = socialService.getUserFriends(userId);
      const stats = socialService.getFriendshipStats(userId);
      
      setFriends(userFriends);
      setFriendshipStats(stats);
      
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }, [userId, socialService]);

  // Block user
  const blockUser = useCallback(async (targetUserId: string): Promise<void> => {
    if (!userId) return;

    try {
      await socialService.blockUser(userId, targetUserId);
      
      // Refresh data
      const userFriends = socialService.getUserFriends(userId);
      const stats = socialService.getFriendshipStats(userId);
      
      setFriends(userFriends);
      setFriendshipStats(stats);
      
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }, [userId, socialService]);

  // Unblock user
  const unblockUser = useCallback(async (targetUserId: string): Promise<void> => {
    if (!userId) return;

    try {
      await socialService.unblockUser(userId, targetUserId);
      
      // Refresh data
      const userFriends = socialService.getUserFriends(userId);
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
    return socialService.getFriendship(userId, targetUserId);
  }, [userId, socialService]);

  // Get user profile by ID
  const getUserProfile = useCallback(async (targetUserId: string): Promise<UserProfile | null> => {
    return await socialService.getUserProfile(targetUserId);
  }, [socialService]);

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