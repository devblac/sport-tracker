import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { useDatabaseInit } from './useDatabaseInit';
import { useStoreInitialization } from './useStoreInitialization';
import { useApiInterceptors } from './useApiInterceptors';
import { logger } from '@/utils';

interface AppInitializationState {
  isInitializing: boolean;
  isAuthenticated: boolean;
  showAuth: boolean;
  error: string | null;
}

export const useAppInitialization = (): AppInitializationState => {
  const [showAuth, setShowAuth] = useState(true);
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  
  // Initialize all app systems
  useStoreInitialization();
  useApiInterceptors();
  
  const { isInitializing: dbInitializing, error: dbError } = useDatabaseInit();
  
  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check authentication status
  useEffect(() => {
    if (isAuthenticated && user) {
      logger.info('User is authenticated', { userId: user.id, role: user.role });
      setShowAuth(false);
    } else {
      logger.info('User is not authenticated, showing auth page');
      setShowAuth(true);
    }
  }, [isAuthenticated, user]);

  return {
    isInitializing: dbInitializing,
    isAuthenticated,
    showAuth,
    error: dbError,
  };
};