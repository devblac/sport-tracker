import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { supabaseAuthService } from '@/services/supabaseAuthService';
import { syncService } from '@/services/syncService';
import { cloudBackupService } from '@/services/cloudBackupService';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/utils';

export const SupabaseTestPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Test user_profiles table specifically for auth
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
      
      if (error) {
        setConnectionStatus('error');
        logger.error('Supabase connection failed - user_profiles table may not exist', error);
        console.error('Database setup required. Please run the schema migration in Supabase dashboard.');
      } else {
        setConnectionStatus('connected');
        logger.info('Supabase connection successful - user_profiles table exists');
      }
    } catch (error) {
      setConnectionStatus('error');
      logger.error('Supabase connection test failed', error);
    }
  };

  const runAuthTests = async () => {
    const results: Record<string, any> = {};
    
    try {
      // Test 1: Check current user
      results.currentUser = await supabaseAuthService.getCurrentSupabaseUser();
      
      // Test 2: Check authentication status
      results.isAuthenticated = await supabaseAuthService.isAuthenticated();
      
      // Test 3: Get access token
      results.accessToken = await supabaseAuthService.getAccessToken();
      
      // Test 4: Test profile operations (if authenticated)
      if (user && user.role !== 'guest') {
        try {
          await supabaseAuthService.updateUserProfile({
            display_name: user.profile.display_name + ' (test)',
          });
          results.profileUpdate = 'success';
        } catch (error) {
          results.profileUpdate = error.message;
        }
      }
      
      return results;
    } catch (error) {
      results.error = error.message;
      return results;
    }
  };

  const runSyncTests = async () => {
    const results: Record<string, any> = {};
    
    try {
      // Test 1: Get sync status
      results.syncStatus = syncService.getSyncStatus();
      
      // Test 2: Queue test item for sync
      if (user && user.role !== 'guest') {
        syncService.queueForSync('profile', 'update', { test: true }, user.id);
        results.queueTest = 'success';
      }
      
      // Test 3: Try manual sync
      if (user && user.role !== 'guest') {
        const syncResult = await syncService.syncNow();
        results.manualSync = syncResult ? 'success' : 'failed';
      }
      
      return results;
    } catch (error) {
      results.error = error.message;
      return results;
    }
  };

  const runBackupTests = async () => {
    const results: Record<string, any> = {};
    
    try {
      // Test 1: Check backup eligibility
      results.isEligible = cloudBackupService.isBackupEligible();
      
      // Test 2: Get backup status
      results.backupStatus = cloudBackupService.getBackupStatus();
      
      // Test 3: Try backup (if eligible)
      if (results.isEligible) {
        try {
          const backupResult = await cloudBackupService.performBackup();
          results.backupTest = backupResult ? 'success' : 'failed';
        } catch (error) {
          results.backupTest = error.message;
        }
      }
      
      return results;
    } catch (error) {
      results.error = error.message;
      return results;
    }
  };

  const runDatabaseTests = async () => {
    const results: Record<string, any> = {};
    
    try {
      // Test 1: Read exercises
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('id, name, name_es')
        .limit(5);
      
      results.exercisesRead = exercisesError ? exercisesError.message : `${exercises?.length || 0} exercises`;
      
      // Test 2: Read user profile (if authenticated)
      if (user && user.role !== 'guest') {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        results.profileRead = profileError ? profileError.message : 'success';
      }
      
      // Test 3: Test RLS (try to read another user's data)
      if (user && user.role !== 'guest') {
        const { data: otherProfiles, error: rlsError } = await supabase
          .from('user_profiles')
          .select('*')
          .neq('id', user.id)
          .limit(1);
        
        results.rlsTest = rlsError ? 'RLS working (error expected)' : `RLS issue: got ${otherProfiles?.length} profiles`;
      }
      
      return results;
    } catch (error) {
      results.error = error.message;
      return results;
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    
    try {
      const results = {
        auth: await runAuthTests(),
        sync: await runSyncTests(),
        backup: await runBackupTests(),
        database: await runDatabaseTests(),
      };
      
      setTestResults(results);
      logger.info('Supabase tests completed', results);
    } catch (error) {
      logger.error('Test execution failed', error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'checking':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderTestResult = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="mb-2">
          <strong className="text-sm font-medium">{key}:</strong>
          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }
    
    return (
      <div key={key} className="flex justify-between items-center py-1">
        <span className="text-sm font-medium">{key}:</span>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {String(value)}
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Supabase Integration Test
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test and verify Supabase backend integration functionality
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold mb-3">Connection Status</h2>
        <div className="flex items-center justify-between">
          <span>Supabase Connection:</span>
          <span className={`font-medium ${getStatusColor(connectionStatus)}`}>
            {connectionStatus === 'checking' && 'Checking...'}
            {connectionStatus === 'connected' && '✅ Connected'}
            {connectionStatus === 'error' && '❌ Error'}
          </span>
        </div>
        <button
          onClick={checkConnection}
          className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Recheck Connection
        </button>
      </div>

      {/* User Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold mb-3">Current User</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Authenticated:</span>
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? 'Yes' : 'No'}
            </span>
          </div>
          {user && (
            <>
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="text-sm font-mono">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span>Username:</span>
                <span>{user.username}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sync Status */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Sync Status</h2>
        <SyncStatusIndicator showDetails={true} />
      </div>

      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold mb-3">Integration Tests</h2>
        <button
          onClick={runAllTests}
          disabled={isRunningTests || connectionStatus !== 'connected'}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Test Results</h2>
          <div className="space-y-4">
            {Object.entries(testResults).map(([category, results]) => (
              <div key={category} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-blue-600 capitalize mb-2">{category} Tests</h3>
                <div className="space-y-1">
                  {typeof results === 'object' && results !== null ? (
                    Object.entries(results).map(([key, value]) => renderTestResult(key, value))
                  ) : (
                    renderTestResult(category, results)
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environment Info */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="font-medium mb-2">Environment</h3>
        <div className="text-sm space-y-1">
          <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</div>
          <div>Environment: {import.meta.env.MODE}</div>
          <div>Build: {import.meta.env.DEV ? 'Development' : 'Production'}</div>
        </div>
      </div>
    </div>
  );
};