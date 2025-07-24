import React from 'react';
import { cn } from '@/utils';
import { Flame, Calendar } from 'lucide-react';

export interface StreakCounterProps {
  currentStreak: number;
  bestStreak?: number;
  scheduledDays?: string[];
  size?: 'sm' | 'md' | 'lg';
  showBest?: boolean;
  showSchedule?: boolean;
  animated?: boolean;
  className?: string;
}

const streakSizes = {
  sm: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    number: 'text-lg',
  },
  md: {
    icon: 'w-6 h-6',
    text: 'text-base',
    number: 'text-2xl',
  },
  lg: {
    icon: 'w-8 h-8',
    text: 'text-lg',
    number: 'text-3xl',
  },
};

const getStreakColor = (streak: number) => {
  if (streak >= 7) return 'text-primary'; // Blue for active streaks
  return 'text-muted-foreground'; // Gray for low/no streak
};

const getStreakMessage = (streak: number) => {
  if (streak >= 100) return '🔥 Legendary!';
  if (streak >= 50) return '🔥 On Fire!';
  if (streak >= 30) return '🔥 Unstoppable!';
  if (streak >= 14) return '💪 Strong!';
  if (streak >= 7) return '⚡ Great!';
  if (streak >= 3) return '👍 Good!';
  if (streak >= 1) return '🌱 Started!';
  return '💤 Start today!';
};

export const StreakCounter: React.FC<StreakCounterProps> = ({
  currentStreak,
  bestStreak,
  scheduledDays = [],
  size = 'md',
  showBest = true,
  showSchedule = false,
  animated = true,
  className,
}) => {
  const sizeClasses = streakSizes[size];
  const streakColor = getStreakColor(currentStreak);
  const streakMessage = getStreakMessage(currentStreak);

  return (
    <div className={cn('text-center space-y-2', className)}>
      {/* Main streak display */}
      <div className="flex items-center justify-center gap-2">
        <Flame 
          className={cn(
            sizeClasses.icon,
            streakColor,
            animated && currentStreak > 0 && 'animate-streak-fire'
          )} 
        />
        <div>
          <div className={cn(
            'font-bold',
            sizeClasses.number,
            streakColor,
            animated && currentStreak > 0 && 'animate-pulse'
          )}>
            {currentStreak}
          </div>
          <div className={cn('text-muted-foreground', sizeClasses.text)}>
            day{currentStreak !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Streak message */}
      <div className={cn('font-medium', sizeClasses.text, streakColor)}>
        {streakMessage}
      </div>

      {/* Best streak */}
      {showBest && bestStreak && bestStreak > currentStreak && (
        <div className={cn('text-muted-foreground', sizeClasses.text)}>
          Best: {bestStreak} days
        </div>
      )}

      {/* Scheduled days */}
      {showSchedule && scheduledDays.length > 0 && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>
            {scheduledDays.map(day => day.slice(0, 3)).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};