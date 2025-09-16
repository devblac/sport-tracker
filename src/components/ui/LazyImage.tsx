import React, { useState, useRef, useEffect } from 'react';
import { mediaService } from '@/services/MediaService';
import { logger } from '@/utils/logger';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  type?: 'gif' | 'image' | 'video';
  category?: 'exercise_gif' | 'muscle_diagram' | 'thumbnail' | 'instruction_image';
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  loading?: 'lazy' | 'eager';
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  type = 'image',
  category = 'thumbnail',
  placeholder,
  onLoad,
  onError,
  loading = 'lazy',
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, threshold, rootMargin]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    let isCancelled = false;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Get optimized/cached image URL
        const optimizedSrc = await mediaService.getMedia(src, type, category);
        
        if (isCancelled) return;

        // Preload the image to ensure it's ready
        const img = new Image();
        img.onload = () => {
          if (!isCancelled) {
            setImageSrc(optimizedSrc);
            setIsLoading(false);
            onLoad?.();
          }
        };
        img.onerror = () => {
          if (!isCancelled) {
            const error = new Error(`Failed to load image: ${src}`);
            setHasError(true);
            setIsLoading(false);
            onError?.(error);
            logger.warn('Image load failed', { src, alt });
          }
        };
        img.src = optimizedSrc;

      } catch (error) {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
          onError?.(error as Error);
          logger.error('Failed to get media from service', { src, error });
        }
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
    };
  }, [isInView, src, type, category, onLoad, onError, alt]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <div className={`bg-muted animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-muted-foreground text-center">
          {type === 'gif' && (
            <>
              <div className="text-2xl mb-1">🎬</div>
              <div className="text-xs">Loading animation...</div>
            </>
          )}
          {category === 'muscle_diagram' && (
            <>
              <div className="text-2xl mb-1">💪</div>
              <div className="text-xs">Loading diagram...</div>
            </>
          )}
          {(type === 'image' && category !== 'muscle_diagram') && (
            <>
              <div className="text-2xl mb-1">🖼️</div>
              <div className="text-xs">Loading image...</div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderError = () => (
    <div className={`bg-muted border-2 border-dashed border-border flex items-center justify-center ${className}`}>
      <div className="text-muted-foreground text-center">
        <div className="text-2xl mb-1">❌</div>
        <div className="text-xs">Failed to load</div>
      </div>
    </div>
  );

  if (hasError) {
    return renderError();
  }

  if (isLoading || !imageSrc) {
    return (
      <div ref={imgRef} className={className}>
        {renderPlaceholder()}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {
        setHasError(true);
        const error = new Error(`Image failed to display: ${src}`);
        onError?.(error);
      }}
    />
  );
};

// Specialized components for different media types
export const ExerciseGif: React.FC<Omit<LazyImageProps, 'type' | 'category'>> = (props) => (
  <LazyImage {...props} type="gif" category="exercise_gif" />
);

export const MuscleDiagram: React.FC<Omit<LazyImageProps, 'type' | 'category'>> = (props) => (
  <LazyImage {...props} type="image" category="muscle_diagram" />
);

export const ExerciseThumbnail: React.FC<Omit<LazyImageProps, 'type' | 'category'>> = (props) => (
  <LazyImage {...props} type="image" category="thumbnail" />
);