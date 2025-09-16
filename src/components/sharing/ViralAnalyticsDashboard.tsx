/**
 * Viral Analytics Dashboard Component
 * 
 * Displays comprehensive analytics for viral content performance.
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Share2, 
  Heart, 
  MessageCircle,
  Users,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useViralContentStore } from '@/stores/useViralContentStore';
import type { SharePlatform } from '@/types/shareableContent';

export const ViralAnalyticsDashboard: React.FC = () => {
  const { 
    getViralAnalytics, 
    getTopPerformingContent, 
    viralMilestones,
    totalViralScore,
    viralLevel 
  } = useViralContentStore();
  
  const [analytics, setAnalytics] = useState(getViralAnalytics());
  const [topContent, setTopContent] = useState(getTopPerformingContent(5));
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    setAnalytics(getViralAnalytics());
    setTopContent(getTopPerformingContent(5));
  }, [selectedTimeframe]);

  const getPlatformIcon = (platform: SharePlatform) => {
    const icons = {
      facebook: '📘',
      twitter: '🐦',
      instagram: '📷',
      whatsapp: '💬',
      telegram: '✈️',
      linkedin: '💼',
      copy_link: '🔗',
      download_image: '💾'
    };
    return icons[platform] || '📱';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getViralLevelInfo = (level: number) => {
    const levels = [
      { min: 0, max: 999, name: 'Novato', color: 'text-gray-500', bg: 'bg-gray-100' },
      { min: 1000, max: 4999, name: 'Influencer', color: 'text-blue-500', bg: 'bg-blue-100' },
      { min: 5000, max: 19999, name: 'Viral Star', color: 'text-purple-500', bg: 'bg-purple-100' },
      { min: 20000, max: 49999, name: 'Sensación', color: 'text-pink-500', bg: 'bg-pink-100' },
      { min: 50000, max: Infinity, name: 'Leyenda', color: 'text-yellow-500', bg: 'bg-yellow-100' }
    ];
    
    return levels.find(l => totalViralScore >= l.min && totalViralScore <= l.max) || levels[0];
  };

  const levelInfo = getViralLevelInfo(viralLevel);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          📊 Analytics Virales
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Analiza el rendimiento de tu contenido compartido
        </p>
      </div>

      {/* Viral Level Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Nivel Viral</h2>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-full font-bold ${levelInfo.bg} ${levelInfo.color}`}>
                {levelInfo.name}
              </span>
              <span className="text-2xl font-bold">
                {formatNumber(totalViralScore)} puntos
              </span>
            </div>
          </div>
          <div className="text-6xl">🏆</div>
        </div>
        
        {/* Progress to next level */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso al siguiente nivel</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
            <div className="bg-white h-3 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Shares
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.totalShares)}
              </p>
            </div>
            <Share2 className="w-12 h-12 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500 font-medium">+12%</span>
            <span className="text-sm text-gray-500 ml-1">vs semana anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Engagement Total
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.totalEngagement)}
              </p>
            </div>
            <Heart className="w-12 h-12 text-red-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500 font-medium">+8%</span>
            <span className="text-sm text-gray-500 ml-1">vs semana anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Coeficiente Viral
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(analytics.averageViralCoefficient * 100).toFixed(1)}%
              </p>
            </div>
            <Activity className="w-12 h-12 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500 font-medium">+5%</span>
            <span className="text-sm text-gray-500 ml-1">vs semana anterior</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Plataformas Activas
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics.topPlatforms.length}
              </p>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-500">
              {analytics.topPlatforms.slice(0, 3).map(p => getPlatformIcon(p.platform)).join(' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trends Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tendencias Recientes
            </h3>
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="all">Todo el tiempo</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {analytics.recentTrends.map((trend, index) => (
              <div key={trend.date} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(trend.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {trend.shares} shares
                    </div>
                    <div className="text-xs text-gray-500">
                      {trend.engagement} engagement
                    </div>
                  </div>
                  <div 
                    className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                  >
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, (trend.shares / Math.max(...analytics.recentTrends.map(t => t.shares))) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Rendimiento por Plataforma
          </h3>
          
          <div className="space-y-4">
            {analytics.topPlatforms.slice(0, 5).map((platform, index) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(platform.platform)}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {platform.platform}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatNumber(platform.shares)} shares
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                  >
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(platform.shares / Math.max(...analytics.topPlatforms.map(p => p.shares))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {((platform.shares / analytics.totalShares) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Contenido Más Viral
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Contenido
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Shares
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Engagement
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Coef. Viral
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Plataformas
                </th>
              </tr>
            </thead>
            <tbody>
              {topContent.map((content, index) => (
                <tr key={content.contentId} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Contenido #{content.contentId.slice(-6)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {content.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatNumber(content.totalShares)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatNumber(content.totalLikes + content.totalComments)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(content.viralCoefficient * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-1">
                      {content.platformReach.slice(0, 3).map(platform => (
                        <span key={platform} className="text-lg">
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                      {content.platformReach.length > 3 && (
                        <span className="text-sm text-gray-500">
                          +{content.platformReach.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Milestones Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Progreso de Hitos Virales
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {viralMilestones.map((milestone) => (
            <div 
              key={milestone.id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                milestone.unlocked 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{milestone.icon}</span>
                {milestone.unlocked && (
                  <Trophy className="w-5 h-5 text-green-500" />
                )}
              </div>
              
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                {milestone.name}
              </h4>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {milestone.description}
              </p>
              
              <div className="text-xs text-gray-500">
                {milestone.unlocked ? (
                  <span className="text-green-600 font-medium">✓ Completado</span>
                ) : (
                  <span>
                    Objetivo: {milestone.requirement.value} {milestone.requirement.type.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViralAnalyticsDashboard;