import React from 'react';
import { cn } from '@/utils';
import { Loader2, Dumbbell } from 'lucide-react';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'fitness';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const loadingSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const LoadingSpinner: React.FC<{ size: string; className?: string }> = ({ size, className }) => (
  <Loader2 className={cn(size, 'animate-spin', className)} />
);

const LoadingDots: React.FC<{ size: string; className?: string }> = ({ size, className }) => (
  <div className={cn('flex space-x-1', className)}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={cn(
          'rounded-full bg-current animate-pulse',
          size === 'w-4 h-4' ? 'w-1 h-1' : 
          size === 'w-6 h-6' ? 'w-1.5 h-1.5' :
          size === 'w-8 h-8' ? 'w-2 h-2' : 'w-3 h-3'
        )}
        style={{
          animationDelay: `${i * 0.2}s`,
          animationDuration: '1s',
        }}
      />
    ))}
  </div>
);

const LoadingPulse: React.FC<{ size: string; className?: string }> = ({ size, className }) => (
  <div
    className={cn(
      'rounded-full bg-current animate-pulse',
      size,
      className
    )}
  />
);

const LoadingFitness: React.FC<{ size: string; className?: string }> = ({ size, className }) => (
  <Dumbbell className={cn(size, 'animate-bounce text-primary-500', className)} />
);

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
}) => {
  const sizeClass = loadingSizes[size];

  const renderLoadingIcon = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots size={sizeClass} className="text-primary-500" />;
      case 'pulse':
        return <LoadingPulse size={sizeClass} className="text-primary-500" />;
      case 'fitness':
        return <LoadingFitness size={sizeClass} />;
      default:
        return <LoadingSpinner size={sizeClass} className="text-primary-500" />;
    }
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      {renderLoadingIcon()}
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton loading component for content placeholders
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = false,
  lines = 1,
  className,
  ...props
}) => {
  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-gray-200 dark:bg-gray-700 animate-pulse',
              rounded ? 'rounded-full' : 'rounded',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{
              width: i === lines - 1 ? '75%' : width,
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700 animate-pulse',
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      style={{ width, height: height || '1rem' }}
      {...props}
    />
  );
};