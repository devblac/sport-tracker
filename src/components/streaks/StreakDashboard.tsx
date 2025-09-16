/**
 * Streak Dashboard Component
 * 
 * Redesigned streak dashboard with proper theming, English i18n,
 * tabbed interface, and optimized data loading.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Settings,
  Shield,
  Trophy,
  TrendingUp,
  Plus,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Info
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useStreakStore } from '@/stores/useStreakStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import StreakScheduleConfig from './StreakScheduleConfig';
import StreakSpecialDaysManager from './StreakSpecialDaysManager';
import StreakMilestoneCelebration from './StreakMilestoneCelebration';
import StreakRiskNotification from './StreakRiskNotification';
import type { StreakSchedule } from '@/types/streaks';

interface StreakDashboardProps {
  className?: string;
}

type TabType = 'overview' | 'details';

export const StreakDashboard: React.FC<StreakDashboardProps> = ({
  className = ''
}) => {
  const { user } = useAuthStore();
  const {
    schedules,
    activeSchedule,
    stats,
    notifications,
    userRewards,
    isLoading,
    error,
    initializeStreaks,
    createSchedule,
    setActiveSchedule,
    dismissNotification,
    checkForNewRewards
  } = useStreakStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [showSpecialDays, setShowSpecialDays] = useState(false);
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StreakSchedule | null>(null);

  // Initialize streaks when component mounts
  useEffect(() => {
    if (user?.id) {
      initializeStreaks(user.id);
    }
  }, [user?.id, initializeStreaks]);

  // Check for milestone celebrations
  useEffect(() => {
    if (stats && stats.currentStreak > 0) {
      // Check if we should show celebration (this would be triggered by new rewards)
      checkForNewRewards(user?.id || '');
    }
  }, [stats?.currentStreak, checkForNewRewards, user?.id]);

  const handleCreateSchedule = async (scheduleData: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return;

    await createSchedule(user.id, scheduleData);
    setShowScheduleConfig(false);
    setEditingSchedule(null);
  };

  const handleEditSchedule = (schedule: StreakSchedule) => {
    setEditingSchedule(schedule);
    setShowScheduleConfig(true);
  };

  const handleScheduleSelect = async (scheduleId: string) => {
    await setActiveSchedule(scheduleId);
  };

  const handleDismissRiskNotification = (notificationId: string) => {
    dismissNotification(notificationId);
  };

  const handleTakeAction = () => {
    // Navigate to workouts page or show workout options
    // This would be implemented based on your routing system
    console.log('Taking action for streak risk');
  };

  const getRiskNotifications = () => {
    return notifications.filter(n => n.type === 'risk' && !n.isRead);
  };

  const getStreakStatusColor = () => {
    if (!stats) return 'text-gray-500';

    switch (stats.streakRisk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getStreakStatusIcon = () => {
    if (!stats) return <Clock className="w-5 h-5" />;

    switch (stats.streakRisk) {
      case 'high': return <AlertCircle className="w-5 h-5" />;
      case 'medium': return <Clock className="w-5 h-5" />;
      case 'low': return <Target className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading streak data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Risk Notifications */}
      {getRiskNotifications().map((notification) => (
        <StreakRiskNotification
          key={notification.id}
          riskLevel={stats?.streakRisk as any || 'low'}
          stats={stats!}
          schedule={activeSchedule!}
          onDismiss={() => handleDismissRiskNotification(notification.id)}
          onTakeAction={handleTakeAction}
        />
      ))}

      {/* Main Dashboard Card */}
      <Card>
        {/* Header with Tabs */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Streak System
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {activeSchedule ? activeSchedule.name : 'Set up your first workout routine'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScheduleConfig(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              {activeSchedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpecialDays(true)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Special Days
                </Button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg mt-4">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="flex-1"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'details' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('details')}
              className="flex-1"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Details
            </Button>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent>
          {!activeSchedule ? (
            /* No Schedule State */
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Start Your First Streak!
              </h3>
              <p className="text-muted-foreground mb-6">
                Create a personalized schedule to maintain consistency in your workouts.
              </p>
              <Button onClick={() => setShowScheduleConfig(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create My Schedule
              </Button>
            </div>
          ) : (
            /* Active Schedule State */
            <div className="space-y-6">
              {activeTab === 'overview' && (
                /* Overview Tab */
                <div className="space-y-4">
                  {/* Current Streak Stats - Compact */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {stats?.currentStreak || 0}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Current Streak</div>
                        </div>
                        <div className={getStreakStatusColor()}>
                          {getStreakStatusIcon()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {stats?.longestStreak || 0}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">Best Streak</div>
                        </div>
                        <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {stats?.perfectWeeks || 0}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">Perfect Weeks</div>
                        </div>
                        <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                            {Math.round(stats?.completionRate || 0)}%
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-400">Success Rate</div>
                        </div>
                        <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('details')}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScheduleConfig(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Schedule
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                /* Details Tab */
                <div className="space-y-6">
                  {/* Detailed Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats?.currentStreak || 0}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">Current Streak</div>
                        </div>
                        <div className={getStreakStatusColor()}>
                          {getStreakStatusIcon()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats?.longestStreak || 0}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">Best Streak</div>
                        </div>
                        <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {stats?.perfectWeeks || 0}
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-400">Perfect Weeks</div>
                        </div>
                        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {Math.round(stats?.completionRate || 0)}%
                          </div>
                          <div className="text-sm text-orange-600 dark:text-orange-400">Success Rate</div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </div>

                  {/* Schedule Management */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Workout Schedules</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowScheduleConfig(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Schedule
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {schedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer',
                            schedule.id === activeSchedule?.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => handleScheduleSelect(schedule.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{schedule.icon || '💪'}</span>
                            <div>
                              <h4 className="font-medium">{schedule.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {schedule.targetDaysPerWeek} days/week • {schedule.isFlexible ? 'Flexible' : 'Strict'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSchedule(schedule);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Days Summary */}
                  {stats && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="font-semibold mb-4">Available Special Days</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {stats.compensationDaysAvailable}
                          </div>
                          <div className="text-sm text-muted-foreground">Compensation</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {stats.sickDaysAvailable}
                          </div>
                          <div className="text-sm text-muted-foreground">Sick Days</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {stats.vacationDaysAvailable}
                          </div>
                          <div className="text-sm text-muted-foreground">Vacation</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => setShowSpecialDays(true)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Manage Special Days
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showScheduleConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <StreakScheduleConfig
              schedule={editingSchedule}
              onSave={handleCreateSchedule}
              onCancel={() => {
                setShowScheduleConfig(false);
                setEditingSchedule(null);
              }}
            />
          </div>
        </div>
      )}

      {showSpecialDays && activeSchedule && stats && user?.id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <StreakSpecialDaysManager
              userId={user.id}
              stats={stats}
              activeSchedule={activeSchedule}
              onClose={() => setShowSpecialDays(false)}
            />
          </div>
        </div>
      )}

      {showMilestoneCelebration && (
        <StreakMilestoneCelebration
          milestone={{
            streakLength: stats?.currentStreak || 0,
            name: 'Milestone Reached!',
            description: 'Congratulations on your achievement!',
            icon: '🏆',
            rarity: 'epic',
            celebrationLevel: 'epic',
            isRepeatable: false,
            rewards: []
          }}
          rewards={[]}
          streakLength={stats?.currentStreak || 0}
          onClose={() => setShowMilestoneCelebration(false)}
        />
      )}
    </div>
  );
};

export default StreakDashboard;