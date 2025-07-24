import React, { useState, useEffect } from 'react';
import { Bug, X, Download, Trash2 } from 'lucide-react';
import { logger, LogLevel } from '@/utils';
import { Button } from '@/components/ui';

export const DevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>(LogLevel.DEBUG);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setLogs(logger.getLogs(selectedLevel));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, selectedLevel]);

  const handleExportLogs = () => {
    const logsData = logger.exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-app-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return 'text-blue-500';
      case LogLevel.INFO:
        return 'text-green-500';
      case LogLevel.WARN:
        return 'text-yellow-500';
      case LogLevel.ERROR:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getLevelName = (level: LogLevel) => {
    return LogLevel[level];
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Toggle DevTools"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* DevTools Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-background border-t border-border w-full h-2/3 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">DevTools - Logs</h2>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Number(e.target.value) as LogLevel)}
                  className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                >
                  <option value={LogLevel.DEBUG}>DEBUG+</option>
                  <option value={LogLevel.INFO}>INFO+</option>
                  <option value={LogLevel.WARN}>WARN+</option>
                  <option value={LogLevel.ERROR}>ERROR</option>
                </select>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleExportLogs}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleClearLogs}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                  No logs available
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="border-l-2 border-border pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${getLevelColor(log.level)}`}>
                          {getLevelName(log.level)}
                        </span>
                        <span className="text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-foreground mb-1">{log.message}</div>
                      {log.data && (
                        <details className="text-muted-foreground">
                          <summary className="cursor-pointer">Data</summary>
                          <pre className="mt-1 text-xs overflow-auto">
                            {typeof log.data === 'string'
                              ? log.data
                              : JSON.stringify(log.data, null, 2)
                            }
                          </pre>
                        </details>
                      )}
                      {log.stack && (
                        <details className="text-red-400">
                          <summary className="cursor-pointer">Stack Trace</summary>
                          <pre className="mt-1 text-xs overflow-auto whitespace-pre-wrap">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};