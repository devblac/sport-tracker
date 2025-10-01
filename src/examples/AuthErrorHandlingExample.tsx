/**
 * Authentication Error Handling Example
 * Demonstrates how to use the new auth error handling system
 */

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthErrorHandler } from '@/components/auth/AuthErrorHandler';
import { SessionStatusIndicator } from '@/components/auth/SessionStatusIndicator';

export const AuthErrorHandlingExample: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { 
    login, 
    loginAsGuest, 
    logout, 
    isLoading, 
    error, 
    user, 
    sessionState,
    retryLastOperation,
    recoverSession 
  } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by the auth store and error handler
      console.log('Login failed, but error handling is in place');
    }
  };

  const handleTestNetworkError = async () => {
    try {
      // Simulate a network error
      await login('test@example.com', 'wrong-password');
    } catch (error) {
      // This will trigger the error handling system
    }
  };

  const handleTestSessionExpired = async () => {
    try {
      // Simulate a session expired error
      await login('expired@example.com', 'password');
    } catch (error) {
      // This will trigger session recovery
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Auth Error Handling Demo
      </h2>

      {/* Session Status */}
      <div className="mb-4 flex justify-center">
        <SessionStatusIndicator />
      </div>

      {/* Current User Info */}
      {user && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            Logged in as: <strong>{user.username}</strong> ({user.role})
          </p>
          <p className="text-xs text-green-600">
            Session: {sessionState}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <AuthErrorHandler />
        </div>
      )}

      {/* Login Form */}
      {!user && (
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {!user && (
          <button
            onClick={loginAsGuest}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Continue as Guest
          </button>
        )}

        {user && (
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        )}

        {/* Recovery Actions */}
        {sessionState === 'invalid' && (
          <button
            onClick={recoverSession}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700"
          >
            Recover Session
          </button>
        )}

        {error && (
          <button
            onClick={retryLastOperation}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Retry Last Operation
          </button>
        )}
      </div>

      {/* Test Error Scenarios */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Test Error Scenarios</h3>
        <div className="space-y-2">
          <button
            onClick={handleTestNetworkError}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 text-sm"
          >
            Test Network Error
          </button>
          
          <button
            onClick={handleTestSessionExpired}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 text-sm"
          >
            Test Session Expired
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({
              isLoading,
              sessionState,
              hasUser: !!user,
              userRole: user?.role,
              hasError: !!error
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default AuthErrorHandlingExample;