/**
 * Emergency Recovery Component
 * Automatic data recovery notification and actions
 * Built for seamless data recovery experience
 */

import React from 'react';
import { AlertTriangle, RefreshCw, X, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useEmergencyRecovery } from '@/hooks/useBackup';

interface EmergencyRecoveryProps {
  className?: string;
}

export const EmergencyRecovery: React.FC<EmergencyRecoveryProps> = ({
  className = ''
}) => {
  const { 
    hasEmergencyBackup, 
    performEmergencyRecovery, 
    dismissEmergencyBackup 
  } = useEmergencyRecovery();

  const [isRecovering, setIsRecovering] = React.useState(false);
  const [recoveryComplete, setRecoveryComplete] = React.useState(false);

  const handleEmergencyRecovery = async () => {
    try {
      setIsRecovering(true);
      const success = await performEmergencyRecovery();
      
      if (success) {
        setRecoveryComplete(true);
        setTimeout(() => {
          setRecoveryComplete(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Emergency recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  if (!hasEmergencyBackup) {
    return null;
  }

  if (recoveryComplete) {
    return (
      <Card className={`border-green-200 bg-green-50 dark:bg-green-900/10 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Recovery Complete!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your data has been successfully recovered from the latest backup.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-orange-200 bg-orange-50 dark:bg-orange-900/10 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
              Data Recovery Available
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
              We detected that your app was closed unexpectedly. We can restore your data from the most recent backup to ensure nothing is lost.
            </p>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleEmergencyRecovery}
                disabled={isRecovering}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Recovering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recover Data
                  </>
                )}
              </Button>
              
              <Button
                onClick={dismissEmergencyBackup}
                variant="outline"
                size="sm"
                className="text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-600 dark:hover:bg-orange-900/20"
              >
                <X className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};