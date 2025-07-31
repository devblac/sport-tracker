/**
 * Streak Visualization Test Page
 * 
 * Test page for all streak visualization components including
 * StreakDisplay, StreakCelebration, and StreakRiskNotification.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Flame, 
  Trophy, 
  AlertTriangle,
  Play,
  Settings,
  Eye,
  Bell,
  Target,
  BarChart3
} from 'lucide-react';
import { StreakDisplay } from '@/components/streaks/StreakDisplay';
import { StreakCelebration, MiniStreakCelebration } from '@/components/streaks/StreakCelebration';
import { 
  StreakRiskNotification, 
  StreakReminderNotification, 
  StreakRecoveryNotification,
  StreakNotificationManager
} from '@/components/streaks/StreakRiskNotification';
import type { 
  StreakSchedule, 
  StreakPeriod, 
  StreakStats, 
  StreakDay 
} from '@/types/streaks';

const StreakVisualizationTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'display' | 'celebrations' | 'notifications' | 'manager'>('display');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMiniCelebration, setShowMiniCelebration] = useState(false);
  const [showRiskNotification, setShowRiskNotification] = useState(false);
  const [showReminderNotification, setShowReminderNotification] = useState(false);
  const [showRecoveryNotification, setShowRecoveryNotification] = useState(false);
  const [celebrationDays, setCelebrationDays] = useState(7);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');

  // Sample data
  const sampleSchedule: StreakSchedule = {
    id: 'schedule-1',
    userId: 'user-123',
    name: 'Morning Routine',
    description: 'Daily morning workouts',
    targetDaysPerWeek: 5,
    scheduledDays: [1, 2, 3, 4, 5], // Monday to Friday
    isFlexible: true,
    restDays: [0, 6], // Sunday and Saturday
    isActive: true,
    color: '#3B82F6',
    icon: '🌅',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const generateSampleDays = (): StreakDay[] => {
    const days: StreakDay[] = [];
    const today = new Date();
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      let status: StreakDay['status'] = 'planned';
      
      if (i > 0) { // Past days
        if (sampleSchedule.scheduledDays.includes(dayOfWeek)) {
          // 80% completion rate
          if (Math.random() < 0.8) {
            status = Math.random() < 0.9 ? 'completed' : 'compensated';
          } else {
            status = Math.random() < 0.3 ? 'sick' : 'missed';
          }
        } else if (sampleSchedule.restDays.includes(dayOfWeek)) {
          status = 'rest';
        }
      }
      
      days.push({
        date: dateStr,
        status,
        workoutId: status === 'completed' ? `workout-${i}` : undefined,
        notes: status === 'sick' ? 'Feeling unwell' : status === 'vacation' ? 'Family trip' : undefined
      });
    }
    
    return days;
  };

  const samplePeriod: StreakPeriod = {
    id: 'period-1',
    userId: 'user-123',
    scheduleId: 'schedule-1',
    startDate: '2024-01-01',
    days: generateSampleDays(),
    currentLength: 12,
    maxLength: 18,
    compensationDaysUsed: 2,
    sickDaysUsed: 1,
    vacationDaysUsed: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const sampleStats: StreakStats = {
    currentStreak: 12,
    longestStreak: 18,
    totalWorkouts: 45,
    totalDays: 60,
    completionRate: 85.5,
    compensationDaysAvailable: 2,
    sickDaysAvailable: 6,
    vacationDaysAvailable: 14,
    streakRisk: riskLevel,
    nextScheduledWorkout: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    missedDaysThisWeek: riskLevel === 'high' ? 1 : riskLevel === 'medium' ? 2 : 0,
    perfectWeeks: 8,
    averageWorkoutsPerWeek: 4.2,
    consistencyScore: 82
  };

  const tabs = [
    { id: 'display', label: 'Streak Display', icon: <Calendar className="w-4 h-4" /> },
    { id: 'celebrations', label: 'Celebrations', icon: <Trophy className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'manager', label: 'Manager', icon: <Settings className="w-4 h-4" /> }
  ];

  const handleMarkSickDay = async (date: string, notes?: string) => {
    console.log('Mark sick day:', date, notes);
    return true;
  };

  const handleMarkVacationDay = async (date: string, notes?: string) => {
    console.log('Mark vacation day:', date, notes);
    return true;
  };

  const handleCompensateDay = async (missedDate: string, compensationDate: string, workoutId: string) => {
    console.log('Compensate day:', missedDate, compensationDate, workoutId);
    return true;
  };

  const handleRecordWorkout = async (date: string) => {
    console.log('Record workout:', date);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Streak Visualization Components
              </h1>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Interactive streak visualization testing
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'display' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Streak Display Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Interactive calendar view with streak tracking, day management, and statistics.
              </p>
              
              <StreakDisplay
                schedule={sampleSchedule}
                period={samplePeriod}
                stats={sampleStats}
                onMarkSickDay={handleMarkSickDay}
                onMarkVacationDay={handleMarkVacationDay}
                onCompensateDay={handleCompensateDay}
                onRecordWorkout={handleRecordWorkout}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Features Demonstrated
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Calendar Features</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Interactive calendar with month navigation</li>
                    <li>• Color-coded day status indicators</li>
                    <li>• Today highlighting with ring indicator</li>
                    <li>• Workout count badges for multiple workouts</li>
                    <li>• Scheduled vs non-scheduled day differentiation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Interactive Actions</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Click any day to open detail modal</li>
                    <li>• Mark sick days with notes</li>
                    <li>• Mark vacation days for planned breaks</li>
                    <li>• Record workouts for past/present days</li>
                    <li>• Compensation options for missed days</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Statistics Display</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Current and longest streak counters</li>
                    <li>• Completion rate percentage</li>
                    <li>• Perfect weeks tracking</li>
                    <li>• Average workouts per week</li>
                    <li>• Monthly summary statistics</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Visual Elements</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Status legend for easy reference</li>
                    <li>• Hover effects and animations</li>
                    <li>• Responsive grid layout</li>
                    <li>• Dark mode support</li>
                    <li>• Accessibility-friendly design</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'celebrations' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Streak Celebrations
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Epic celebrations for streak milestones with different effects based on achievement level.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Celebration Days:
                  </label>
                  <select
                    value={celebrationDays}
                    onChange={(e) => setCelebrationDays(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={3}>3 Days (Common)</option>
                    <option value={7}>7 Days (Uncommon)</option>
                    <option value={14}>14 Days (Rare)</option>
                    <option value={30}>30 Days (Epic)</option>
                    <option value={50}>50 Days (Legendary)</option>
                    <option value={100}>100 Days (Legendary)</option>
                    <option value={365}>365 Days (Mythic)</option>
                  </select>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowCelebration(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Full Celebration</span>
                  </button>
                  
                  <button
                    onClick={() => setShowMiniCelebration(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Mini Celebration</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Celebration Features */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Celebration Features by Milestone
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { days: 3, rarity: 'Common', effects: ['Flame particles', 'Basic animation'] },
                  { days: 7, rarity: 'Uncommon', effects: ['Green particles', 'Bounce animation'] },
                  { days: 14, rarity: 'Rare', effects: ['Blue particles', 'Spring animation', 'Glow effect'] },
                  { days: 30, rarity: 'Epic', effects: ['Purple particles', 'Fireworks', 'Screen effects'] },
                  { days: 50, rarity: 'Legendary', effects: ['Golden particles', 'Multiple fireworks', 'Epic glow'] },
                  { days: 100, rarity: 'Legendary', effects: ['Crown animation', 'Royal effects', 'Epic rewards'] },
                  { days: 365, rarity: 'Mythic', effects: ['Rainbow particles', 'Massive fireworks', 'Immortal status'] }
                ].map((milestone, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {milestone.days} Days ({milestone.rarity})
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {milestone.effects.map((effect, i) => (
                        <li key={i}>• {effect}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Streak Notifications
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Smart notifications for streak risks, reminders, and recovery guidance.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Risk Level:
                  </label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowRiskNotification(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Risk Notification</span>
                  </button>
                  
                  <button
                    onClick={() => setShowReminderNotification(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Reminder</span>
                  </button>
                  
                  <button
                    onClick={() => setShowRecoveryNotification(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  >
                    <Target className="w-4 h-4" />
                    <span>Recovery</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Types */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notification Types
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Risk Notifications
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Low: Below weekly target</li>
                    <li>• Medium: Multiple missed days</li>
                    <li>• High: Streak about to break</li>
                    <li>• Actionable suggestions</li>
                    <li>• Quick action buttons</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Reminders
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Scheduled workout alerts</li>
                    <li>• Time-based reminders</li>
                    <li>• Snooze functionality</li>
                    <li>• Quick start options</li>
                    <li>• Customizable timing</li>
                  </ul>
                </div>
                
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Recovery
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Streak ended support</li>
                    <li>• Motivational messaging</li>
                    <li>• New streak initiation</li>
                    <li>• Progress acknowledgment</li>
                    <li>• Encouragement focus</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manager' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Notification Manager
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Centralized notification management with automatic risk detection and smart alerts.
              </p>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Current Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Current Streak</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-500">{sampleStats.currentStreak}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Risk Level</span>
                    </div>
                    <div className={`text-2xl font-bold capitalize ${
                      sampleStats.streakRisk === 'high' ? 'text-red-500' :
                      sampleStats.streakRisk === 'medium' ? 'text-orange-500' :
                      sampleStats.streakRisk === 'low' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {sampleStats.streakRisk}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Completion</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-500">
                      {sampleStats.completionRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Manager Demo */}
            <div className="relative">
              <StreakNotificationManager
                stats={sampleStats}
                schedule={sampleSchedule}
                onMarkSickDay={() => console.log('Mark sick day')}
                onMarkVacationDay={() => console.log('Mark vacation day')}
                onScheduleWorkout={() => console.log('Schedule workout')}
                onAdjustSchedule={() => console.log('Adjust schedule')}
              />
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Manager Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Automatic Detection</h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Real-time risk assessment</li>
                      <li>• Smart notification timing</li>
                      <li>• Context-aware messaging</li>
                      <li>• Priority-based display</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Actions</h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Quick action buttons</li>
                      <li>• Dismissible notifications</li>
                      <li>• Expandable details</li>
                      <li>• Integrated workflows</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Celebration Overlays */}
      {showCelebration && (
        <StreakCelebration
          streakDays={celebrationDays}
          scheduleName={sampleSchedule.name}
          onComplete={() => setShowCelebration(false)}
        />
      )}

      {showMiniCelebration && (
        <MiniStreakCelebration
          streakDays={celebrationDays}
          scheduleName={sampleSchedule.name}
          onComplete={() => setShowMiniCelebration(false)}
        />
      )}

      {/* Notification Overlays */}
      {showRiskNotification && (
        <StreakRiskNotification
          stats={{ ...sampleStats, streakRisk: riskLevel }}
          schedule={sampleSchedule}
          onDismiss={() => setShowRiskNotification(false)}
          onMarkSickDay={() => console.log('Mark sick day')}
          onMarkVacationDay={() => console.log('Mark vacation day')}
          onScheduleWorkout={() => console.log('Schedule workout')}
          onAdjustSchedule={() => console.log('Adjust schedule')}
        />
      )}

      {showReminderNotification && (
        <StreakReminderNotification
          schedule={sampleSchedule}
          nextWorkout={new Date(Date.now() + 2 * 60 * 60 * 1000)} // 2 hours from now
          onDismiss={() => setShowReminderNotification(false)}
          onScheduleWorkout={() => console.log('Schedule workout')}
          onSnooze={(minutes) => console.log('Snooze for', minutes, 'minutes')}
        />
      )}

      {showRecoveryNotification && (
        <StreakRecoveryNotification
          previousStreak={25}
          onDismiss={() => setShowRecoveryNotification(false)}
          onStartNewStreak={() => console.log('Start new streak')}
        />
      )}
    </div>
  );
};

export default StreakVisualizationTestPage;