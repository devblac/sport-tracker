import { useEffect, useState } from 'react';
import DatabaseInitService from '@/services/DatabaseInitService';
import { logger } from '@/utils';

interface DatabaseInitState {
  isInitializing: boolean;
  isInitialized: boolean;
  error: string | null;
  stats: {
    exerciseCount: number;
    version: string | null;
    sampleDataCount: number;
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

    const initDB = async () => {
      try {
        setState(prev => ({ ...prev, isInitializing: true, error: null }));

        // Initialize database with sample data
        await DatabaseInitService.initializeDatabase();

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
            },
          });

          logger.info('Database initialization hook completed', stats);
        }
      } catch (error) {
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
    };
  }, []);

  const retry = async () => {
    setState(prev => ({ ...prev, isInitializing: true, error: null }));
    
    try {
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