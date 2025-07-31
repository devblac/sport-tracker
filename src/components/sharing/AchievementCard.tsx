/**
 * Achievement Card Component
 * 
 * Epic visual card component for sharing achievement unlocks.
 */

import React from 'react';
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap,
  Calendar,
  TrendingUp
} from 'lucide-react';

import type { AchievementCardData } from '@/types/shareableContent';

interface AchievementCardProps {
  data: AchievementCardData;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  template: string;
  className?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  data,
  backgroundColor,
  textColor,
  accentColor,
  template,
  className = ''
}) => {
  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return {
          color: '#fbbf24',
          icon: Crown,
          glow: 'shadow-yellow-500/50',
          particles: '✨',
          border: 'border-yellow-400'
        };
      case 'epic':
        return {
          color: '#a855f7',
          icon: Zap,
          glow: 'shadow-purple-500/50',
          particles: '⚡',
          border: 'border-purple-400'
        };
      case 'rare':
        return {
          color: '#3b82f6',
          icon: Star,
          glow: 'shadow-blue-500/50',
          particles: '💫',
          border: 'border-blue-400'
        };
      default:
        return {
          color: '#10b981',
          icon: Trophy,
          glow: 'shadow-green-500/50',
          particles: '🌟',
          border: 'border-green-400'
        };
    }
  };

  const rarityConfig = getRarityConfig(data.rarity);
  const RarityIcon = rarityConfig.icon;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getProgressPercentage = () => {
    return Math.round((data.progress.current / data.progress.total) * 100);
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-3xl shadow-2xl ${rarityConfig.glow} ${className}`}
      style={{ 
        backgroundColor,
        color: textColor,
        minHeight: '500px',
        background: `radial-gradient(circle at top right, ${rarityConfig.color}20, ${backgroundColor})`
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        <div className="absolute top-8 left-8 text-2xl animate-bounce">
          {rarityConfig.particles}
        </div>
        <div className="absolute top-16 right-12 text-xl animate-pulse">
          {rarityConfig.particles}
        </div>
        <div className="absolute bottom-20 left-16 text-lg animate-bounce delay-300">
          {rarityConfig.particles}
        </div>
        <div className="absolute bottom-32 right-8 text-xl animate-pulse delay-500">
          {rarityConfig.particles}
        </div>
        
        {/* Geometric patterns */}
        <div 
          className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ backgroundColor: rarityConfig.color }}
        />
        <div 
          className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Content */}
      <div className="relative p-8 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div 
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-4 ${rarityConfig.border} shadow-lg`}
              style={{ backgroundColor: `${rarityConfig.color}20` }}
            >
              <RarityIcon 
                className="w-10 h-10" 
                style={{ color: rarityConfig.color }} 
              />
            </div>
          </div>
          
          <div className="mb-2">
            <span 
              className="inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider"
              style={{ 
                backgroundColor: rarityConfig.color,
                color: data.rarity === 'legendary' ? '#1f2937' : '#ffffff'
              }}
            >
              {data.rarity}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 leading-tight">
            ¡LOGRO DESBLOQUEADO!
          </h1>
        </div>

        {/* Achievement Icon and Name */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{data.achievementIcon}</div>
          <h2 className="text-3xl font-bold mb-3">{data.achievementName}</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            {data.achievementDescription}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progreso</span>
            <span className="text-sm font-bold">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${getProgressPercentage()}%`,
                backgroundColor: rarityConfig.color
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-1 text-xs opacity-75">
            <span>{data.progress.current} {data.progress.unit}</span>
            <span>{data.progress.total} {data.progress.unit}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${rarityConfig.color}20` }}>
            <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: rarityConfig.color }} />
            <div className="text-lg font-bold">{data.category}</div>
            <div className="text-sm opacity-75">Categoría</div>
          </div>

          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${accentColor}20` }}>
            <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{ color: accentColor }} />
            <div className="text-lg font-bold">{getProgressPercentage()}%</div>
            <div className="text-sm opacity-75">Completado</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm opacity-75">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(data.unlockedAt)}
            </div>
            <div className="text-sm font-medium">
              🏋️ FitnessApp
            </div>
          </div>
        </div>

        {/* Celebration overlay for legendary achievements */}
        {data.rarity === 'legendary' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 text-3xl animate-spin">⭐</div>
            <div className="absolute top-8 right-8 text-2xl animate-bounce">🎉</div>
            <div className="absolute bottom-8 left-8 text-2xl animate-pulse">👑</div>
            <div className="absolute bottom-4 right-4 text-3xl animate-spin">✨</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementCard;