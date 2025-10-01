import React from 'react';
import { cn } from '@/utils';

interface AvatarProps {
  className?: string;
  children: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
    >
      {children}
    </div>
  );
};

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  className
}) => {
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={cn('aspect-square h-full w-full object-cover', className)}
    />
  );
};

interface AvatarFallbackProps {
  className?: string;
  children: React.ReactNode;
}

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({
  className,
  children
}) => {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  );
};