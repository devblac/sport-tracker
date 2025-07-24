import { useEffect } from 'react';
import { useApiInterceptors } from './useApiInterceptors';
import { logger } from '@/utils';

/**
 * Hook para inicializar los stores de la aplicación
 * Se ejecuta una vez al montar la aplicación
 */
export const useStoreInitialization = () => {
  // Set up API interceptors
  useApiInterceptors();

  useEffect(() => {
    // Log store initialization
    logger.info('Stores and API interceptors initialized');
  }, []);
};