import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { PerformanceDashboard } from '@/components/dev/PerformanceDashboard';
import { 
  validateUserRegistration, 
  validateUserLogin, 
  isValidEmail, 
  isValidUsername, 
  getPasswordStrength,
  validateDisplayName,
  validateBio,
  getRolePermissions,
  getRoleInfo,
  hasPermission,
  canUpgradeTo,
} from '@/utils';
import type { UserRole } from '@/schemas/user';

export const DevTest: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'validation' | 'performance'>('validation');
  const [testData, setTestData] = useState({
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPass123',
    displayName: 'Test User',
    bio: 'This is a test bio',
  });

  const [validationResults, setValidationResults] = useState<any>({});
  const [selectedRole, setSelectedRole] = useState<UserRole>('guest');

  const runValidationTests = () => {
    const results: any = {};

    // Test user registration validation
    const registrationData = {
      email: testData.email,
      username: testData.username,
      password: testData.password,
      display_name: testData.displayName,
      fitness_level: 'beginner' as const,
    };
    results.registration = validateUserRegistration(registrationData);

    // Test user login validation
    const loginData = {
      email: testData.email,
      password: testData.password,
    };
    results.login = validateUserLogin(loginData);

    // Test individual validations
    results.email = { valid: isValidEmail(testData.email) };
    results.username = { valid: isValidUsername(testData.username) };
    results.password = getPasswordStrength(testData.password);
    results.displayName = validateDisplayName(testData.displayName);
    results.bio = validateBio(testData.bio);

    setValidationResults(results);
  };

  const rolePermissions = getRolePermissions(selectedRole);
  const roleInfo = getRoleInfo(selectedRole);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          🧪 Validation & Role System Test
        </h1>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/test-data'}
        >
          📊 Test Data Generator
        </Button>
      </div>

      {/* Test Data Input */}
      <Card>
        <CardHeader>
          <CardTitle>Test Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              value={testData.email}
              onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input
              value={testData.username}
              onChange={(e) => setTestData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={testData.password}
              onChange={(e) => setTestData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <Input
              value={testData.displayName}
              onChange={(e) => setTestData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Enter display name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <Input
              value={testData.bio}
              onChange={(e) => setTestData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Enter bio"
            />
          </div>
          
          <Button onClick={runValidationTests} className="w-full">
            Run Validation Tests
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {Object.keys(validationResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-sm">
              {Object.entries(validationResults).map(([key, result]: [string, any]) => (
                <div key={key} className="border-l-2 border-border pl-3">
                  <div className="font-semibold text-primary">{key}:</div>
                  <pre className="text-xs mt-1 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role System Test */}
      <Card>
        <CardHeader>
          <CardTitle>Role System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full p-2 border border-border rounded bg-background text-foreground"
            >
              <option value="guest">Guest</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role Info */}
            <div>
              <h3 className="font-semibold mb-2">Role Info</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {roleInfo.icon} {roleInfo.name}</div>
                <div><strong>Description:</strong> {roleInfo.description}</div>
                <div><strong>Color:</strong> <span className={`text-${roleInfo.color}-500`}>{roleInfo.color}</span></div>
                <div>
                  <strong>Features:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {roleInfo.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h3 className="font-semibold mb-2">Permissions</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(rolePermissions).map(([permission, allowed]) => (
                  <div key={permission} className="flex justify-between">
                    <span>{permission}:</span>
                    <span className={allowed ? 'text-green-500' : 'text-red-500'}>
                      {allowed ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upgrade Options */}
          <div>
            <h3 className="font-semibold mb-2">Available Upgrades</h3>
            <div className="flex gap-2 flex-wrap">
              {(['guest', 'basic', 'premium', 'trainer', 'admin'] as UserRole[]).map(role => {
                const canUpgrade = canUpgradeTo(selectedRole, role);
                return (
                  <span
                    key={role}
                    className={`px-2 py-1 rounded text-xs ${
                      canUpgrade 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {role} {canUpgrade ? '✅' : '❌'}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Permission Tests */}
          <div>
            <h3 className="font-semibold mb-2">Permission Tests</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                'saveWorkouts',
                'cloudSync', 
                'addFriends',
                'createChallenges',
                'mentorUsers',
                'manageUsers'
              ].map(permission => (
                <div key={permission} className="flex justify-between">
                  <span>{permission}:</span>
                  <span className={hasPermission(selectedRole, permission as any) ? 'text-green-500' : 'text-red-500'}>
                    {hasPermission(selectedRole, permission as any) ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};