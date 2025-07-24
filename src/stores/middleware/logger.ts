import { StateCreator } from 'zustand';
import { logger as appLogger } from '@/utils/logger';

export interface LoggerConfig {
  enabled: boolean;
  collapsed: boolean;
  storeName?: string;
  filter?: (action: string) => boolean;
}

const defaultConfig: LoggerConfig = {
  enabled: process.env.NODE_ENV === 'development',
  collapsed: true,
};

export const logger = <T>(
  config: Partial<LoggerConfig> = {}
) => (
  f: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> => {
  const loggerConfig = { ...defaultConfig, ...config };

  return (set, get, api) => {
    const wrappedSet = (...args: any[]) => {
      if (!loggerConfig.enabled) {
        return set(...args);
      }

      try {
        const prevState = get();
        set(...args);
        const nextState = get();
        
        const storeName = loggerConfig.storeName || 'Store';
        const action = `${storeName} Update`;
        
        if (loggerConfig.filter && !loggerConfig.filter(action)) {
          return;
        }

        const groupName = `%c${action}`;
        const groupStyle = 'color: #3B82F6; font-weight: bold;';

        if (loggerConfig.collapsed) {
          console.groupCollapsed(groupName, groupStyle);
        } else {
          console.group(groupName, groupStyle);
        }

        console.log('%cprev state', 'color: #9E9E9E; font-weight: bold;', prevState);
        console.log('%cnext state', 'color: #10B981; font-weight: bold;', nextState);
        
        console.groupEnd();

        // Log to our app logger as well
        appLogger.debug(`${storeName} state updated`, {
          prevState: JSON.stringify(prevState),
          nextState: JSON.stringify(nextState),
        });
      } catch (error) {
        appLogger.error(`Error in ${loggerConfig.storeName || 'Store'} logger middleware`, error);
        // Still call the original set to not break the store
        set(...args);
      }
    };

    return f(wrappedSet, get, api);
  };
};