import React from 'react';
import { cn } from '@/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

const cardVariants = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700',
  outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
  glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50',
  gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-200 dark:border-primary-700',
};

const cardPadding = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  interactive = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        // Base styles
        'rounded-lg transition-all duration-200',
        // Variant styles
        cardVariants[variant],
        // Padding
        cardPadding[padding],
        // Hover effects
        hover && 'hover:shadow-xl hover:-translate-y-1',
        // Interactive styles
        interactive && 'cursor-pointer hover:shadow-lg active:scale-98 transform',
        // Custom className
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Card sub-components for better composition
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)} {...props}>
    {children}
  </div>
);