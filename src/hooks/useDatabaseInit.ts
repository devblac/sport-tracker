import { useEffect, useState } from 'react';
import DatabaseInitService from '@/services/DatabaseInitService';
import { getDatabaseService } from '@/db/DatabaseService';
import { logger } from '@/utils';

interface DatabaseInitState {
  isInitializing: boolean;
  isInitialized: boolean;
  error: string | null;
  stats: {
    exerciseCount: number;
    version: string | null;
    sampleDataCount: number;
    isFallbackMode?: boolean;
  } | null;
}

/**
 * Hook to initialize the database on app startup
 */
export function useDatabaseInit() {
  const [state, setState] = useState<DatabaseInitState>({
    isInitializing: true,
    isInitialized: false,
    error: null,
    stats: null,
  });

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initDB = async () => {
      try {
        setState(prev => ({ ...prev, isInitializing: true, error: null }));

        // Initialize IndexedDB first
        const service = getDatabaseService();
        await service.initialize();

        // Add timeout to prevent infinite hang
        const initPromise = DatabaseInitService.initializeDatabase();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Database initialization timed out after 30 seconds'));
          }, 30000);
        });

        // Race between initialization and timeout
        await Promise.race([initPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        // Get database statistics
        const stats = await DatabaseInitService.getDatabaseStats();

        if (isMounted) {
          setState({
            isInitializing: false,
            isInitialized: true,
            error: null,
            stats: {
              exerciseCount: stats.exerciseCount,
              version: stats.version,
              sampleDataCount: stats.sampleDataCount,
              isFallbackMode: stats.isFallbackMode,
            },
          });

          logger.info('Database initialization hook completed', stats);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Database initialization failed';
          setState(prev => ({
            ...prev,
            isInitializing: false,
            error: errorMessage,
          }));

          logger.error('Database initialization hook failed', error);
        }
      }
    };

    initDB();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const retry = async () => {
    setState(prev => ({ ...prev, isInitializing: true, error: null }));
    
    try {
      // Reinitialize IndexedDB
      const service = getDatabaseService();
      await service.initialize();
      await DatabaseInitService.initializeDatabase(true); // Force reinitialize
      const stats = await DatabaseInitService.getDatabaseStats();
      
      setState({
        isInitializing: false,
        isInitialized: true,
        error: null,
        stats: {
          exerciseCount: stats.exerciseCount,
          version: stats.version,
          sampleDataCount: stats.sampleDataCount,
          isFallbackMode: stats.isFallbackMode,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database initialization failed';
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage,
      }));
    }
  };

  return {
    ...state,
    retry,
  };
}