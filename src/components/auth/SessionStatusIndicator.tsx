/**
 * Session Status Indicator Component
 * Shows current authentication session status
 */

import React from 'react';
import { CheckCircle, AlertCircle, RefreshCw, User, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface SessionStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const SessionStatusIndicator: React.FC<SessionStatusIndicatorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { sessionState, user, isAuthenticated } = useAuthStore();

  const getStatusConfig = () => {
    switch (sessionState) {
      case 'valid':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Connected',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'Your session is active and secure'
        };
      case 'guest':
        return {
          icon: <User className="w-4 h-4" />,
          label: 'Guest Mode',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          description: 'Using app as guest (limited features)'
        };
      case 'recovering':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          label: 'Recovering',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          description: 'Attempting to restore your session'
        };
      case 'offline':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          label: 'Offline',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          description: 'Working offline with limited features'
        };
      case 'invalid':
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Disconnected',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          description: 'Session expired or invalid'
        };
    }
  };

  const config = getStatusConfig();

  if (!isAuthenticated && sessionState === 'invalid') {
    return null; // Don't show indicator when not authenticated
  }

  return (
    <div 
      className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full ${config.bgColor} ${className}`}
      title={config.description}
    >
      <span className={config.color}>
        {config.icon}
      </span>
      
      {showLabel && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
      
      {user && showLabel && (
        <span className="text-xs text-gray-500">
          ({user.role})
        </span>
      )}
    </div>
  );
};

export default SessionStatusIndicator;