import type { PersistOptions } from 'zustand/middleware';
import { storage } from '@/utils';

export interface CustomPersistOptions<T> extends Omit<PersistOptions<T>, 'storage'> {
  name: string;
  version?: number;
  migrate?: (persistedState: unknown, version: number) => T;
}

export const createPersistenceConfig = <T>(
  options: CustomPersistOptions<T>
): PersistOptions<T> => ({
  ...options,
  storage: {
    getItem: async (name: string) => {
      try {
        const value = storage.get(name);
        return value ? JSON.stringify(value) : null;
      } catch (error) {
        console.error(`Error getting item ${name} from storage:`, error);
        return null;
      }
    },
    setItem: async (name: string, value: string) => {
      try {
        const parsedValue = JSON.parse(value);
        storage.set(name, parsedValue);
      } catch (error) {
        console.error(`Error setting item ${name} to storage:`, error);
      }
    },
    removeItem: async (name: string) => {
      try {
        storage.remove(name);
      } catch (error) {
        console.error(`Error removing item ${name} from storage:`, error);
      }
    },
  },
  version: options.version || 1,
  migrate: options.migrate,
});