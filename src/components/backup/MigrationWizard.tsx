/**
 * Device Migration Wizard Component
 * Step-by-step device migration process
 * Built for seamless device transfers
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  ArrowRight, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Shield,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useMigration } from '@/hooks/useBackup';

interface MigrationWizardProps {
  className?: string;
  onComplete?: () => void;
}

type MigrationStep = 'generate' | 'display' | 'input' | 'migrate' | 'complete';

export const MigrationWizard: React.FC<MigrationWizardProps> = ({
  className = '',
  onComplete
}) => {
  const { 
    migrationToken, 
    isGeneratingToken, 
    isMigrating, 
    generateMigrationToken, 
    migrateFromToken 
  } = useMigration();

  const [currentStep, setCurrentStep] = useState<MigrationStep>('generate');
  const [inputToken, setInputToken] = useState('');
  const [tokenCopied, setTokenCopied] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  const handleGenerateToken = async () => {
    try {
      await generateMigrationToken();
      setCurrentStep('display');
    } catch (error) {
      console.error('Error generating token:', error);
    }
  };

  const handleCopyToken = async () => {
    if (migrationToken) {
      try {
        await navigator.clipboard.writeText(migrationToken);
        setTokenCopied(true);
        setTimeout(() => setTokenCopied(false), 2000);
      } catch (error) {
        console.error('Error copying token:', error);
      }
    }
  };

  const handleMigrateFromToken = async () => {
    if (!inputToken.trim()) {
      setMigrationError('Please enter a migration token');
      return;
    }

    try {
      setMigrationError(null);
      const success = await migrateFromToken(inputToken.trim());
      
      if (success) {
        setCurrentStep('complete');
        onComplete?.();
      } else {
        setMigrationError('Migration failed. Please check your token and try again.');
      }
    } catch (error) {
      setMigrationError(error instanceof Error ? error.message : 'Migration failed');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'generate':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Transfer Your Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Securely transfer all your fitness data to a new device. This will create a complete backup and generate a secure token.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Secure & Private
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your data is encrypted and the migration token expires in 24 hours for maximum security.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateToken}
              disabled={isGeneratingToken}
              size="lg"
              className="w-full"
            >
              {isGeneratingToken ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Generate Migration Token
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setCurrentStep('input')}
                variant="outline"
                className="w-full"
              >
                I have a migration token
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'display':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Migration Token Generated
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Use this token on your new device to transfer all your data
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Migration Token
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 font-mono text-sm break-all">
                  {migrationToken}
                </div>
                <Button
                  onClick={handleCopyToken}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  {tokenCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Important Notes
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                    <li>• This token expires in 24 hours</li>
                    <li>• Keep it secure and don't share with others</li>
                    <li>• Use it only on your new device</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep('generate')}
              variant="outline"
              className="w-full"
            >
              Generate New Token
            </Button>
          </div>
        );

      case 'input':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Enter Migration Token
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter the migration token from your previous device
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Migration Token
              </label>
              <textarea
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Paste your migration token here..."
                className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none"
              />
            </div>

            {migrationError && (
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {migrationError}
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={() => setCurrentStep('generate')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleMigrateFromToken}
                disabled={isMigrating || !inputToken.trim()}
                className="flex-1"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  'Start Migration'
                )}
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Migration Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All your fitness data has been successfully transferred to this device.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                Your workouts, progress, achievements, and settings are now available on this device.
              </p>
            </div>

            <Button
              onClick={() => {
                setCurrentStep('generate');
                onComplete?.();
              }}
              className="w-full"
            >
              Continue to App
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5" />
          <span>Device Migration</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderStep()}
      </CardContent>
    </Card>
  );
};