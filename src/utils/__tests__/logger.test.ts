import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { logger, LogLevel } from '../logger';

describe('logger', () => {
  // Mock console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    // Mock console methods
    console.debug = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    
    // Clear logs before each test
    logger.clearLogs();
  });

  afterEach(() => {
    // Restore console methods
    Object.assign(console, originalConsole);
  });

  describe('LogLevel enum', () => {
    it('should have correct numeric values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });
  });

  describe('debug logging', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].timestamp).toBeInstanceOf(Date);
    });

    it('should log debug messages with data', () => {
      const testData = { key: 'value', number: 42 };
      logger.debug('Debug with data', testData);
      
      const logs = logger.getLogs();
      expect(logs[0].data).toEqual(testData);
    });

    it('should call console.debug', () => {
      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('info logging', () => {
    it('should log info messages', () => {
      logger.info('Info message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Info message');
    });

    it('should call console.info', () => {
      logger.info('Info message');
      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('warn logging', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe('Warning message');
    });

    it('should call console.warn', () => {
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    it('should log error messages', () => {
      logger.error('Error message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Error message');
    });

    it('should log error messages with Error objects', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      logger.error('Error occurred', error);
      
      const logs = logger.getLogs();
      expect(logs[0].data).toEqual({
        name: 'Error',
        message: 'Test error',
      });
      expect(logs[0].stack).toBe('Error stack trace');
    });

    it('should log error messages with additional data', () => {
      const error = new Error('Test error');
      const additionalData = { userId: '123', action: 'save' };
      
      logger.error('Error occurred', error, additionalData);
      
      const logs = logger.getLogs();
      expect(logs[0].data).toEqual({
        name: 'Error',
        message: 'Test error',
        userId: '123',
        action: 'save',
      });
    });

    it('should handle non-Error objects', () => {
      const errorData = { code: 500, message: 'Server error' };
      
      logger.error('Server error occurred', errorData);
      
      const logs = logger.getLogs();
      expect(logs[0].data).toEqual({
        error: errorData,
      });
      expect(logs[0].stack).toBeUndefined();
    });

    it('should call console.error', () => {
      logger.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });

    it('should log stack trace for Error objects', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      logger.error('Error occurred', error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack:'),
        'Error stack trace'
      );
    });
  });

  describe('log filtering', () => {
    beforeEach(() => {
      // Add logs of different levels
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
    });

    it('should return all logs when no level specified', () => {
      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
    });

    it('should filter logs by minimum level', () => {
      const warnLogs = logger.getLogs(LogLevel.WARN);
      expect(warnLogs).toHaveLength(2); // WARN and ERROR
      expect(warnLogs.every(log => log.level >= LogLevel.WARN)).toBe(true);
    });

    it('should filter logs by ERROR level', () => {
      const errorLogs = logger.getLogs(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);
    });

    it('should return empty array for level higher than any log', () => {
      const logs = logger.getLogs(4 as LogLevel); // Higher than ERROR
      expect(logs).toHaveLength(0);
    });
  });

  describe('log management', () => {
    it('should clear all logs', () => {
      logger.info('Test message');
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should limit number of stored logs', () => {
      // Create a new logger instance to test maxLogs limit
      const testLogger = new (logger.constructor as any)();
      testLogger.maxLogs = 3;
      
      // Add more logs than the limit
      for (let i = 0; i < 5; i++) {
        testLogger.info(`Message ${i}`);
      }
      
      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(3);
      // Should keep the last 3 logs
      expect(logs[0].message).toBe('Message 2');
      expect(logs[1].message).toBe('Message 3');
      expect(logs[2].message).toBe('Message 4');
    });

    it('should export logs as JSON string', () => {
      logger.info('Test message', { key: 'value' });
      
      const exported = logger.exportLogs();
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test message');
      expect(parsed[0].data).toEqual({ key: 'value' });
    });
  });

  describe('log level filtering based on environment', () => {
    it('should respect minimum log level', () => {
      // Create a logger with higher minimum level
      const testLogger = new (logger.constructor as any)();
      testLogger.minLevel = LogLevel.WARN;
      
      // Clear console mocks to count calls
      vi.clearAllMocks();
      
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');
      
      // Only WARN and ERROR should be logged
      const logs = testLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[1].level).toBe(LogLevel.ERROR);
      
      // Console methods should only be called for WARN and ERROR
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('console output formatting', () => {
    it('should format log messages with timestamp and level', () => {
      logger.info('Test message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message$/),
        undefined
      );
    });

    it('should include data in console output', () => {
      const testData = { key: 'value' };
      logger.warn('Warning with data', testData);
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Warning with data'),
        testData
      );
    });
  });

  describe('edge cases', () => {
    it('should handle undefined data gracefully', () => {
      logger.info('Message with undefined data', undefined);
      
      const logs = logger.getLogs();
      expect(logs[0].data).toBeUndefined();
    });

    it('should handle null data gracefully', () => {
      logger.info('Message with null data', null);
      
      const logs = logger.getLogs();
      expect(logs[0].data).toBeNull();
    });

    it('should handle circular references in data', () => {
      const circularData: any = { key: 'value' };
      circularData.self = circularData;
      
      // Should not throw an error
      expect(() => {
        logger.info('Message with circular data', circularData);
      }).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      
      expect(() => {
        logger.info(longMessage);
      }).not.toThrow();
      
      const logs = logger.getLogs();
      expect(logs[0].message).toBe(longMessage);
    });
  });

  describe('timestamp accuracy', () => {
    it('should have accurate timestamps', () => {
      const beforeLog = new Date();
      logger.info('Timestamp test');
      const afterLog = new Date();
      
      const logs = logger.getLogs();
      const logTimestamp = logs[0].timestamp;
      
      expect(logTimestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
      expect(logTimestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
    });

    it('should have different timestamps for consecutive logs', () => {
      logger.info('First message');
      // Small delay to ensure different timestamps
      setTimeout(() => {
        logger.info('Second message');
        
        const logs = logger.getLogs();
        expect(logs[1].timestamp.getTime()).toBeGreaterThan(logs[0].timestamp.getTime());
      }, 1);
    });
  });
});