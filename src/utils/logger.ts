export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private minLevel: LogLevel;

  constructor() {
    this.minLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private addLog(level: LogLevel, message: string, data?: any, stack?: string) {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      stack,
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    const levelName = LogLevel[level];
    const timestamp = logEntry.timestamp.toISOString();
    const logMessage = `[${timestamp}] ${levelName}: ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, data);
        if (stack) console.error('Stack:', stack);
        break;
    }
  }

  debug(message: string, data?: any) {
    this.addLog(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.addLog(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.addLog(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any, data?: any) {
    const stack = error instanceof Error ? error.stack : undefined;
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      ...data,
    } : { error, ...data };

    this.addLog(LogLevel.ERROR, message, errorData, stack);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

// Global error handlers
if (typeof window !== 'undefined') {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      type: 'unhandledrejection',
      url: window.location.href,
    });
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    logger.error('Global error', event.error, {
      type: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href,
    });
  });
}