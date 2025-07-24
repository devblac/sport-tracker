import React from 'react';
import { cn } from '@/utils';
import { Zap } from 'lucide-react';

export interface XPBarProps {
  currentXP: number;
  levelXP: number;
  level: number;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  className?: string;
}

const barSizes = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  levelXP,
  level,
  showAnimation = true,
  size = 'md',
  showLevel = true,
  className,
}) => {
  const progress = Math.min((currentXP / levelXP) * 100, 100);
  const isLevelUp = progress >= 100;

  return (
    <div className={cn('space-y-2', className)}>
      {showLevel && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              Level {level}
            </span>
          </div>
          <span className="text-muted-foreground">
            {currentXP.toLocaleString()} / {levelXP.toLocaleString()} XP
          </span>
        </div>
      )}
      
      <div className={cn(
        'relative bg-muted rounded-full overflow-hidden',
        barSizes[size]
      )}>
        {/* Background glow effect */}
        {showAnimation && isLevelUp && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary animate-glow rounded-full" />
        )}
        
        {/* Progress bar */}
        <div
          className={cn(
            'h-full bg-gradient-to-r from-primary to-primary rounded-full transition-all duration-500 ease-out',
            showAnimation && 'animate-pulse',
            isLevelUp && showAnimation && 'animate-level-up'
          )}
          style={{ width: `${progress}%` }}
        />
        
        {/* Shine effect */}
        {showAnimation && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
        )}
      </div>
      
      {/* Level up celebration */}
      {isLevelUp && showAnimation && (
        <div className="text-center">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium animate-celebration">
            <Zap className="w-3 h-3" />
            Level Up!
          </span>
        </div>
      )}
    </div>
  );
};