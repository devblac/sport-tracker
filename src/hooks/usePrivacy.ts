/**
 * Privacy Hook
 * 
 * React hook for managing privacy settings, blocking, and content visibility.
 */

import { useState, useEffect, useCallback } from 'react';
import { privacyService } from '@/services/PrivacyService';

import type {
  PrivacySettings,
  BlockedUser,
  ReportedUser,
  PrivacyCheckResult,
  ContentType,
  ReportReason
} from '@/types/privacy';

interface UsePrivacyReturn {
  // Privacy Settings
  privacySettings: PrivacySettings | null;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => Promise<void>;
  resetPrivacySettings: () => Promise<void>;
  
  // Content Visibility
  canViewContent: (
    contentOwnerId: string,
    contentType: ContentType,
    friendshipStatus?: 'friends' | 'pending' | 'none'
  ) => Promise<PrivacyCheckResult>;
  canSendFriendRequest: (receiverId: string) => Promise<PrivacyCheckResult>;
  canAppearInSearch: (userId: string) => Promise<PrivacyCheckResult>;
  
  // Blocking
  blockedUsers: BlockedUser[];
  blockUser: (blockedUserId: string, reason?: string) => Promise<void>;
  unblockUser: (blockedUserId: string) => Promise<void>;
  isUserBlocked: (userId: string) => Promise<boolean>;
  
  // Reporting
  userReports: ReportedUser[];
  reportUser: (reportedUserId: string, reason: ReportReason, description?: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Privacy Summary
  privacySummary: {
    blockedUsersCount: number;
    reportsCount: number;
  } | null;
}

export function usePrivacy(userId: string): UsePrivacyReturn {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [userReports, setUserReports] = useState<ReportedUser[]>([]);
  const [privacySummary, setPrivacySummary] = useState<{
    blockedUsersCount: number;
    reportsCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadPrivacyData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [settings, blocked, reports, summary] = await Promise.all([
          privacyService.getPrivacySettings(userId),
          privacyService.getBlockedUsers(userId),
          privacyService.getUserReports(userId),
          privacyService.getPrivacySummary(userId)
        ]);

        setPrivacySettings(settings);
        setBlockedUsers(blocked);
        setUserReports(reports);
        setPrivacySummary({
          blockedUsersCount: summary.blockedUsersCount,
          reportsCount: summary.reportsCount
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load privacy data');
        console.error('Failed to load privacy data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrivacyData();
  }, [userId]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (updates: Partial<PrivacySettings>) => {
    try {
      setError(null);
      const updatedSettings = await privacyService.updatePrivacySettings(userId, updates);
      setPrivacySettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update privacy settings');
      throw err;
    }
  }, [userId]);

  // Reset privacy settings
  const resetPrivacySettings = useCallback(async () => {
    try {
      setError(null);
      const defaultSettings = await privacyService.resetPrivacySettings(userId);
      setPrivacySettings(defaultSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset privacy settings');
      throw err;
    }
  }, [userId]);

  // Content visibility checks
  const canViewContent = useCallback(async (
    contentOwnerId: string,
    contentType: ContentType,
    friendshipStatus?: 'friends' | 'pending' | 'none'
  ): Promise<PrivacyCheckResult> => {
    try {
      return await privacyService.canViewContent(userId, contentOwnerId, contentType, friendshipStatus);
    } catch (err) {
      console.error('Failed to check content visibility:', err);
      return { canView: false, reason: 'Error checking permissions' };
    }
  }, [userId]);

  const canSendFriendRequest = useCallback(async (receiverId: string): Promise<PrivacyCheckResult> => {
    try {
      return await privacyService.canSendFriendRequest(userId, receiverId);
    } catch (err) {
      console.error('Failed to check friend request permission:', err);
      return { canView: false, reason: 'Error checking permissions' };
    }
  }, [userId]);

  const canAppearInSearch = useCallback(async (searchUserId: string): Promise<PrivacyCheckResult> => {
    try {
      return await privacyService.canAppearInSearch(userId, searchUserId);
    } catch (err) {
      console.error('Failed to check search visibility:', err);
      return { canView: false, reason: 'Error checking permissions' };
    }
  }, [userId]);

  // Blocking functions
  const blockUser = useCallback(async (blockedUserId: string, reason?: string) => {
    try {
      setError(null);
      await privacyService.blockUser(userId, blockedUserId, reason);
      
      // Refresh blocked users list
      const updatedBlocked = await privacyService.getBlockedUsers(userId);
      setBlockedUsers(updatedBlocked);
      
      // Update summary
      const summary = await privacyService.getPrivacySummary(userId);
      setPrivacySummary({
        blockedUsersCount: summary.blockedUsersCount,
        reportsCount: summary.reportsCount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
      throw err;
    }
  }, [userId]);

  const unblockUser = useCallback(async (blockedUserId: string) => {
    try {
      setError(null);
      await privacyService.unblockUser(userId, blockedUserId);
      
      // Refresh blocked users list
      const updatedBlocked = await privacyService.getBlockedUsers(userId);
      setBlockedUsers(updatedBlocked);
      
      // Update summary
      const summary = await privacyService.getPrivacySummary(userId);
      setPrivacySummary({
        blockedUsersCount: summary.blockedUsersCount,
        reportsCount: summary.reportsCount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock user');
      throw err;
    }
  }, [userId]);

  const isUserBlocked = useCallback(async (checkUserId: string): Promise<boolean> => {
    try {
      return await privacyService.isUserBlocked(userId, checkUserId);
    } catch (err) {
      console.error('Failed to check if user is blocked:', err);
      return false;
    }
  }, [userId]);

  // Reporting functions
  const reportUser = useCallback(async (
    reportedUserId: string,
    reason: ReportReason,
    description?: string
  ) => {
    try {
      setError(null);
      await privacyService.reportUser(userId, reportedUserId, reason, description);
      
      // Refresh reports list
      const updatedReports = await privacyService.getUserReports(userId);
      setUserReports(updatedReports);
      
      // Update summary
      const summary = await privacyService.getPrivacySummary(userId);
      setPrivacySummary({
        blockedUsersCount: summary.blockedUsersCount,
        reportsCount: summary.reportsCount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report user');
      throw err;
    }
  }, [userId]);

  return {
    // Privacy Settings
    privacySettings,
    updatePrivacySettings,
    resetPrivacySettings,
    
    // Content Visibility
    canViewContent,
    canSendFriendRequest,
    canAppearInSearch,
    
    // Blocking
    blockedUsers,
    blockUser,
    unblockUser,
    isUserBlocked,
    
    // Reporting
    userReports,
    reportUser,
    
    // State
    isLoading,
    error,
    
    // Privacy Summary
    privacySummary,
  };
}