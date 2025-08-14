import React from 'react';
import { Trophy, Users, UserPlus, Zap, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface LeagueUnavailableProps {
  title: string;
  message: string;
  action?: string;
  currentUsers?: number;
  minimumUsers?: number;
  className?: string;
}

export const LeagueUnavailable: React.FC<LeagueUnavailableProps> = ({
  title,
  message,
  action,
  currentUsers,
  minimumUsers,
  className = ''
}) => {
  const navigate = useNavigate();

  const getIcon = () => {
    if (action === 'Login' || action === 'Sign Up') {
      return <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />;
    }
    if (action === 'Start Workout') {
      return <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />;
    }
    if (action === 'Invite Friends') {
      return <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />;
    }
    return <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />;
  };

  const handleAction = () => {
    switch (action) {
      case 'Login':
      case 'Sign Up':
        navigate('/auth');
        break;
      case 'Start Workout':
        navigate('/workout');
        break;
      case 'Invite Friends':
        // Could open a share dialog or friends invitation
        break;
      default:
        break;
    }
  };

  const getProgressBar = () => {
    if (currentUsers && minimumUsers) {
      const progress = (currentUsers / minimumUsers) * 100;
      return (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress to leagues</span>
            <span>{currentUsers}/{minimumUsers} users</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">Competitive Leagues</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {getIcon()}
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {message}
            </p>

            {getProgressBar()}

            {action && (
              <Button 
                onClick={handleAction}
                variant="outline"
                className="mt-6"
              >
                {action === 'Login' && <Lock className="w-4 h-4 mr-2" />}
                {action === 'Sign Up' && <UserPlus className="w-4 h-4 mr-2" />}
                {action === 'Start Workout' && <Zap className="w-4 h-4 mr-2" />}
                {action === 'Invite Friends' && <Users className="w-4 h-4 mr-2" />}
                {action}
              </Button>
            )}
          </div>

          {/* Feature Preview */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              🏆 Coming Soon: Competitive Leagues
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Weekly competitions with 20 players</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Promotion & relegation system</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>10 leagues from Bronze to Phoenix</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Compete with friends & similar skill</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};