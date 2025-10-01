import React from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  asChild?: boolean;
}

const buttonVariants = {
  primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md active:bg-primary/80',
  secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-sm hover:shadow-md active:bg-secondary/80',
  accent: 'bg-muted hover:bg-muted/80 text-foreground shadow-sm hover:shadow-md',
  ghost: 'hover:bg-muted text-foreground',
  outline: 'border border-input text-foreground hover:bg-muted',
  destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm hover:shadow-md active:bg-destructive/80',
};

const buttonSizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 py-2',
  lg: 'h-11 px-8',
  xl: 'h-12 px-8 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  asChild = false,
  className,
  disabled,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;
  
  const buttonClasses = cn(
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
    rounded ? 'rounded-full' : 'rounded-md',
    // Width
    fullWidth && 'w-full',
    // Custom className
    className
  );

  const content = (
    <>
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" data-testid="loading-spinner" />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  if (asChild) {
    return (
      <Slot className={buttonClasses} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      ref={ref}
      {...props}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';