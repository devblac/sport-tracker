/**
 * Authentication Error Handler Component
 * Displays authentication errors with recovery options
 */

import React from 'react';
import { AlertTriangle, Wifi, WifiOff, RefreshCw, User, Mail, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import type { AuthRecoveryAction } from '@/types/authErrors';

interface AuthErrorHandlerProps {
  className?: string;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ className = '' }) => {
  const { error, recoveryOptions, sessionState, retryLastOperation, forceGuestMode, recoverSession } = useAuthStore();

  if (!error || !recoveryOptions) {
    return null;
  }

  const getErrorIcon = () => {
    switch (sessionState) {
      case 'offline':
        return <WifiOff className="w-6 h-6 text-orange-500" />;
      case 'recovering':
        return <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'retry':
        return <RefreshCw className="w-4 h-4" />;
      case 'guest_mode':
        return <User className="w-4 h-4" />;
      case 'offline_mode':
        return <WifiOff className="w-4 h-4" />;
      case 'check_email':
        return <Mail className="w-4 h-4" />;
      case 'contact_support':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getActionVariant = (actionType: string) => {
    switch (actionType) {
      case 'retry':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'guest_mode':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'offline_mode':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const handleActionClick = async (action: AuthRecoveryAction) => {
    try {
      await action.action();
    } catch (error) {
      console.error('Recovery action failed:', error);
    }
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Authentication Error
          </h3>
          
          <p className="text-sm text-red-700 mb-3">
            {error}
          </p>

          {sessionState === 'recovering' && (
            <div className="flex items-center space-x-2 mb-3">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-blue-700">
                Attempting to recover your session...
              </span>
            </div>
          )}

          {recoveryOptions.recoveryActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-red-600 font-medium">
                What would you like to do?
              </p>
              
              <div className="flex flex-wrap gap-2">
                {recoveryOptions.recoveryActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action)}
                    className={`
                      inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${getActionVariant(action.type)}
                    `}
                    title={action.description}
                  >
                    {getActionIcon(action.type)}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional recovery options for specific session states */}
          {sessionState === 'invalid' && !recoveryOptions.canRetry && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs text-red-600 mb-2">
                Additional options:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={recoverSession}
                  className="inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Recover Session</span>
                </button>
                
                <button
                  onClick={forceGuestMode}
                  className="inline-flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  <span>Continue as Guest</span>
                </button>
              </div>
            </div>
          )}

          {/* Network status indicator */}
          <div className="mt-3 pt-3 border-t border-red-200">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600">
                {sessionState === 'offline' ? 'Offline mode active' : 'Online'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorHandler;