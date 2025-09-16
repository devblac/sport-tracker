// ============================================================================
// TRAINER DASHBOARD
// ============================================================================
// Dashboard for trainers to manage their profile, content, and earnings
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Star, 
  TrendingUp, 
  Eye,
  Plus,
  Edit,
  BarChart3,
  Clock,
  MessageSquare
} from 'lucide-react';
import useMarketplaceStore from '@/stores/useMarketplaceStore';
import type { TrainerDashboardStats } from '@/types/marketplace';

const TrainerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'content' | 'earnings' | 'profile'>('overview');
  
  const {
    trainerProfile,
    trainerStats,
    userSessions,
    premiumContent,
    isLoading
  } = useMarketplaceStore();

  // Mock stats for demo
  const mockStats: TrainerDashboardStats = {
    totalEarnings: 12450.00,
    monthlyEarnings: 3200.00,
    totalClients: 45,
    activeClients: 23,
    totalSessions: 156,
    upcomingSessions: 8,
    contentSales: 89,
    averageRating: 4.8,
    totalReviews: 127,
    profileViews: 1240,
    conversionRate: 12.5
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-1 ${
              change.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earnings"
          value={formatCurrency(mockStats.totalEarnings)}
          change="+12.5%"
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Active Clients"
          value={mockStats.activeClients}
          change="+3"
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Upcoming Sessions"
          value={mockStats.upcomingSessions}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatCard
          title="Average Rating"
          value={`${mockStats.averageRating}/5`}
          icon={<Star className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Sessions
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    1-on-1 Training with John Doe
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Today at 2:00 PM • 60 min
                  </p>
                </div>
                <button className="text-blue-600 hover:text-blue-700">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Analytics
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Profile Views</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockStats.profileViews}
                </span>
                <span className="text-xs text-green-600">+18%</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Conversion Rate</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockStats.conversionRate}%
                </span>
                <span className="text-xs text-green-600">+2.1%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Content Sales</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockStats.contentSales}
                </span>
                <span className="text-xs text-green-600">+12</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Avg. Rating</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockStats.averageRating}/5
                </span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Response Time</span>
              <span className="font-medium text-gray-900 dark:text-white">
                2.3 hours
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Client Retention</span>
              <span className="font-medium text-gray-900 dark:text-white">
                87%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SessionsTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Training Sessions
          </h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Availability</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No sessions scheduled
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Set your availability to start accepting bookings from clients.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Set Availability
          </button>
        </div>
      </div>
    </div>
  );

  const ContentTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Premium Content
          </h3>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Content</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No content created yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Create workout plans, courses, or guides to sell to your clients.
          </p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Create Your First Content
          </button>
        </div>
      </div>
    </div>
  );

  const EarningsTab = () => (
    <div className="space-y-6">
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="This Month"
          value={formatCurrency(mockStats.monthlyEarnings)}
          change="+15.2%"
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Total Earnings"
          value={formatCurrency(mockStats.totalEarnings)}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Payout"
          value={formatCurrency(850.00)}
          icon={<Clock className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Sources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Sources
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">1-on-1 Sessions</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(2100.00)}
                </div>
                <div className="text-sm text-gray-500">65.6%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Premium Content</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(800.00)}
                </div>
                <div className="text-sm text-gray-500">25.0%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">Group Sessions</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(300.00)}
                </div>
                <div className="text-sm text-gray-500">9.4%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Trends
          </h3>
          <div className="space-y-3">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
              const earnings = [2800, 3100, 2900, 3400, 3200, 3200][index];
              const maxEarnings = 3400;
              const percentage = (earnings / maxEarnings) * 100;
              
              return (
                <div key={month} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-8">
                    {month}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                    {formatCurrency(earnings)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payout Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payout Information
          </h3>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Request Payout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Available Balance</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(850.00)}</p>
            <p className="text-xs text-gray-500">Ready for payout</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Pending Clearance</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(320.00)}</p>
            <p className="text-xs text-gray-500">Available in 3 days</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Platform Fee (15%)</p>
            <p className="text-2xl font-bold text-gray-600">{formatCurrency(175.50)}</p>
            <p className="text-xs text-gray-500">From current month</p>
          </div>
        </div>
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trainer Profile
          </h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {trainerProfile ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                src={trainerProfile.profileImage || '/default-avatar.png'}
                alt={trainerProfile.displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {trainerProfile.displayName}
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {trainerProfile.specialties.join(', ')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {trainerProfile.experience} years experience
                </p>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Bio</h5>
              <p className="text-gray-600 dark:text-gray-300">{trainerProfile.bio}</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Certifications</h5>
              <div className="flex flex-wrap gap-2">
                {trainerProfile.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Complete your trainer profile
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Set up your profile to start accepting clients and selling content.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'content', label: 'Content', icon: Eye },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trainer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your training business and track your performance
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'sessions' && <SessionsTab />}
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'earnings' && <EarningsTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>
    </div>
  );
};

export default TrainerDashboard;