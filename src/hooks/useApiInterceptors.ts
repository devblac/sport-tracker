import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { authService } from '@/services/AuthService';
import { logger } from '@/utils';

/**
 * Hook to set up API interceptors for authentication and error handling
 */
export const useApiInterceptors = () => {
  const { logout, user } = useAuthStore();

  useEffect(() => {
    // Set up global error handler for API responses
    const handleApiError = (error: any) => {
      if (error?.status === 401) {
        logger.warn('Unauthorized API response, logging out user');
        logout();
      } else if (error?.status === 403) {
        logger.warn('Forbidden API response', { userId: user?.id });
        // Could show a toast or redirect to upgrade page
      } else if (error?.status >= 500) {
        logger.error('Server error', error);
        // Could show a global error message
      }
    };

    // Set up periodic token refresh for authenticated users
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (user && user.role !== 'guest') {
      // Refresh token every 50 minutes (tokens expire in 1 hour)
      refreshInterval = setInterval(async () => {
        try {
          await authService.refreshToken();
          logger.debug('Token refreshed automatically');
        } catch (error) {
          logger.error('Automatic token refresh failed', error);
          // Don't logout automatically, let the next API call handle it
        }
      }, 50 * 60 * 1000); // 50 minutes
    }

    // Set up online/offline detection for API calls
    const handleOnline = () => {
      logger.info('Connection restored, API calls will resume');
    };

    const handleOffline = () => {
      logger.info('Connection lost, API calls will be queued');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, logout]);

  // Return utility functions that components can use
  return {
    /**
     * Check if user has valid authentication for API calls
     */
    isApiAuthenticated: () => {
      return authService.isAuthenticated();
    },

    /**
     * Get current access token for manual API calls
     */
    getAccessToken: () => {
      return authService.getAccessToken();
    },

    /**
     * Manually refresh token if needed
     */
    refreshToken: async () => {
      try {
        return await authService.refreshToken();
      } catch (error) {
        logger.error('Manual token refresh failed', error);
        throw error;
      }
    },
  };
};