/**
 * Supabase Integration Test Page
 * 
 * Development page to test and verify Supabase integration.
 * Shows service status, runs tests, and displays results.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabaseIntegrationTest, runQuickTest, quickHealthCheck } from '@/services/SupabaseIntegrationTest';
import { serviceRegistry } from '@/services/ServiceRegistry';

interface TestResult {
  success: boolean;
  results: Record<string, boolean>;
  errors: string[];
}

export default function SupabaseIntegrationTestPage() {
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [healthStatus, setHealthStatus] = useState<boolean | null>(null);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  useEffect(() => {
    // Load initial status
    loadServiceStatus();
    checkHealth();
  }, []);

  const loadServiceStatus = () => {
    const config = serviceRegistry.getConfig();
    const status = serviceRegistry.getServiceStatus();
    setServiceStatus({ config, status });
  };

  const checkHealth = async () => {
    try {
      const health = await quickHealthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus(false);
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await runQuickTest();
      setTestResults(results);
    } catch (error) {
      console.error('Test run failed:', error);
      setTestResults({
        success: false,
        results: {},
        errors: [`Test execution failed: ${error}`]
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testUserWorkflow = async () => {
    setIsRunning(true);
    try {
      const success = await supabaseIntegrationTest.testUserWorkflow();
      console.log('User workflow test result:', success);
    } catch (error) {
      console.error('User workflow test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleRealServices = () => {
    const currentConfig = serviceRegistry.getConfig();
    if (currentConfig.useRealServices) {
      serviceRegistry.enableMockServices();
    } else {
      serviceRegistry.enableRealServices();
    }
    loadServiceStatus();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Supabase Integration Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test and verify Supabase service integration
        </p>
      </div>

      {/* Service Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Service Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium mb-2">Health Status</h3>
            <Badge variant={healthStatus ? 'success' : 'destructive'}>
              {healthStatus === null ? 'Checking...' : healthStatus ? 'Healthy' : 'Unhealthy'}
            </Badge>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Online Status</h3>
            <Badge variant={navigator.onLine ? 'success' : 'secondary'}>
              {navigator.onLine ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>

        {serviceStatus && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Configuration</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                <pre>{JSON.stringify(serviceStatus.config, null, 2)}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Active Services</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(serviceStatus.status).map(([service, type]) => (
                  <Badge key={service} variant="outline">
                    {service}: {type as string}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button onClick={checkHealth} variant="outline" size="sm">
            Refresh Health
          </Button>
          <Button onClick={toggleRealServices} variant="outline" size="sm">
            Toggle Services
          </Button>
        </div>
      </Card>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        
        <div className="flex gap-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
          </Button>
          
          <Button 
            onClick={testUserWorkflow} 
            disabled={isRunning}
            variant="outline"
            className="flex-1"
          >
            {isRunning ? 'Testing...' : 'Test User Workflow'}
          </Button>
        </div>
      </Card>

      {/* Test Results */}
      {testResults && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="mb-4">
            <Badge variant={testResults.success ? 'success' : 'destructive'} className="text-lg">
              {testResults.success ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Individual Test Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(testResults.results).map(([test, passed]) => (
                  <div key={test} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm">{test}</span>
                    <Badge variant={passed ? 'success' : 'destructive'} size="sm">
                      {passed ? '✅' : '❌'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {testResults.errors.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 text-red-600">Errors</h3>
                <div className="space-y-2">
                  {testResults.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Development Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Development Info</h2>
        
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• This page is for development and testing purposes only</p>
          <p>• Use the service toggle to switch between real and mock services</p>
          <p>• Check the browser console for detailed logs</p>
          <p>• Health checks verify database connectivity and service availability</p>
        </div>
      </Card>
    </div>
  );
}