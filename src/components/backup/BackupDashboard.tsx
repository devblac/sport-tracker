/**
 * Backup & Recovery Dashboard Component
 * User-friendly interface for data backup and recovery
 * Built for data safety and peace of mind
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Download, 
  Upload, 
  Smartphone, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Zap,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { backupManager } from '@/services/BackupManager';
import type { BackupMetadata, BackupStats, DataCategory } from '@/services/BackupManager';
import { useAuthStore } from '@/stores';

interface BackupDashboardProps {
  className?: string;
}

export const BackupDashboard: React.FC<BackupDashboardProps> = ({
  className = ''
}) => {
  const { user } = useAuthStore();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [migrationToken, setMigrationToken] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<DataCategory[]>(['all']);

  const userId = user?.id || 'current_user';

  useEffect(() => {
    loadBackupData();
  }, [userId]);

  const loadBackupData = async () => {
    try {
      setIsLoading(true);
      const [userBackups, backupStats] = await Promise.all([
        backupManager.getUserBackups(userId),
        backupManager.getBackupStats(userId)
      ]);
      
      setBackups(userBackups);
      setStats(backupStats);
    } catch (error) {
      console.error('Error loading backup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      await backupManager.createBackup(userId, 'manual', selectedCategories);
      await loadBackupData();
    } catch (error) {
      console.error('Error creating backup:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await backupManager.deleteBackup(backupId, userId);
      await loadBackupData();
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  const handleGenerateMigrationToken = async () => {
    try {
      const token = await backupManager.generateMigrationToken(userId);
      setMigrationToken(token);
    } catch (error) {
      console.error('Error generating migration token:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: BackupMetadata['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'expired': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    }
  };

  const getTypeIcon = (type: BackupMetadata['type']) => {
    switch (type) {
      case 'automatic': return <Zap className="w-4 h-4" />;
      case 'manual': return <Download className="w-4 h-4" />;
      case 'migration': return <Smartphone className="w-4 h-4" />;
      case 'recovery': return <RefreshCw className="w-4 h-4" />;
      default: return <HardDrive className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span>Backup & Recovery</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Keep your fitness data safe and secure
          </p>
        </div>
        
        <Button
          onClick={loadBackupData}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Backups</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalBackups}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatFileSize(stats.totalSize)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Backup</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {stats.lastBackup ? formatDate(stats.lastBackup) : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {(stats.successRate * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Create Backup</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Select Data Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'all', label: 'All Data' },
                    { key: 'workouts', label: 'Workouts' },
                    { key: 'progress', label: 'Progress' },
                    { key: 'settings', label: 'Settings' }
                  ].map(category => (
                    <label key={category.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.key as DataCategory)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.key as DataCategory]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== category.key));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {category.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup || selectedCategories.length === 0}
                className="w-full"
              >
                {isCreatingBackup ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Device Migration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span>Device Migration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transfer your data to a new device securely
              </p>
              
              {migrationToken ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Migration Token Generated
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded border font-mono text-xs break-all">
                    {migrationToken}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Use this token on your new device within 24 hours
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateMigrationToken}
                  variant="outline"
                  className="w-full"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Generate Migration Token
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Backup History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No backups found. Create your first backup to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map(backup => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(backup.type)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(backup.status)}`}>
                        {backup.status}
                      </span>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)} Backup
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(backup.createdAt)} • {formatFileSize(backup.size)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Categories: {backup.categories.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {backup.status === 'completed' && (
                      <Button
                        onClick={() => {
                          // In a real implementation, this would open a restore dialog
                          console.log('Restore from backup:', backup.id);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleDeleteBackup(backup.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Scheduled Backup */}
      {stats?.nextScheduledBackup && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Next Automatic Backup</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(stats.nextScheduledBackup)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};