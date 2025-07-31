/**
 * Database Hook
 * 
 * React hook for database initialization and management.
 */

import { useState, useEffect } from 'react';
import { getDatabaseService } from '@/db/DatabaseService';

interface UseDatabaseReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  storageInfo: {
    stores: Array<{ name: string; count: number }>;
    totalRecords: number;
  } | null;
  
  // Operations
  clearAllData: () => Promise<void>;
  exportData: () => Promise<{ [storeName: string]: any[] }>;
  importData: (data: { [storeName: string]: any[] }) => Promise<void>;
  refreshStorageInfo: () => Promise<void>;
}

export function useDatabase(): UseDatabaseReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{
    stores: Array<{ name: string; count: number }>;
    totalRecords: number;
  } | null>(null);

  // Initialize database on mount
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        const service = getDatabaseService();
        await service.initialize();
        setIsInitialized(true);

        // Load initial storage info
        const info = await service.getStorageInfo();
        setStorageInfo(info);

        console.log('Database initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize database';
        setError(errorMessage);
        console.error('Database initialization failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDatabase();
  }, []);

  // Clear all data
  const clearAllData = async () => {
    try {
      setError(null);
      const service = getDatabaseService();
      await service.clearAllData();
      
      // Refresh storage info
      const info = await service.getStorageInfo();
      setStorageInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      throw err;
    }
  };

  // Export data
  const exportData = async () => {
    try {
      setError(null);
      const service = getDatabaseService();
      return await service.exportData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      throw err;
    }
  };

  // Import data
  const importData = async (data: { [storeName: string]: any[] }) => {
    try {
      setError(null);
      const service = getDatabaseService();
      await service.importData(data);
      
      // Refresh storage info
      const info = await service.getStorageInfo();
      setStorageInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
      setError(errorMessage);
      throw err;
    }
  };

  // Refresh storage info
  const refreshStorageInfo = async () => {
    try {
      setError(null);
      const service = getDatabaseService();
      const info = await service.getStorageInfo();
      setStorageInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh storage info';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    isInitialized,
    isInitializing,
    error,
    storageInfo,
    
    // Operations
    clearAllData,
    exportData,
    importData,
    refreshStorageInfo
  };
}