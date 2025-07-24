import React from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
}

const buttonVariants = {
  primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md active:bg-primary/80',
  secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-sm hover:shadow-md active:bg-secondary/80',
  accent: 'bg-muted hover:bg-muted/80 text-foreground shadow-sm hover:shadow-md',
  ghost: 'hover:bg-muted text-foreground',
  outline: 'border border-border text-foreground hover:bg-muted',
  destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm hover:shadow-md active:bg-destructive/80',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[52px]',
  xl: 'px-8 py-4 text-xl min-h-[60px]',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  className,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95 transform',
        // Mobile optimizations
        'touch-manipulation select-none',
        // Variant styles
        buttonVariants[variant],
        // Size styles
        buttonSizes[size],
        // Shape
        rounded ? 'rounded-full' : 'rounded-lg',
        // Width
        fullWidth && 'w-full',
        // Custom className
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};