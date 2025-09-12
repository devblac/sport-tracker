import type { Exercise } from '@/schemas/exercise';
import { generatePlaceholderMediaUrls } from '@/data/sampleExerciseMedia';

/**
 * Enhance exercises with media URLs if they don't have them
 */
export const enhanceExerciseWithMedia = (exercise: Exercise): Exercise => {
  const hasMedia = exercise.gif_url || exercise.muscle_diagram_url || exercise.thumbnail_url;
  
  if (hasMedia) {
    return exercise;
  }

  // Generate placeholder media URLs
  const mediaUrls = generatePlaceholderMediaUrls(exercise.id);
  
  return {
    ...exercise,
    ...mediaUrls
  };
};

/**
 * Enhance multiple exercises with media URLs
 */
export const enhanceExercisesWithMedia = (exercises: Exercise[]): Exercise[] => {
  return exercises.map(enhanceExerciseWithMedia);
};

/**
 * Get optimized media URL based on context
 */
export const getOptimizedMediaUrl = (
  exercise: Exercise,
  context: 'thumbnail' | 'detail' | 'fullscreen',
  mediaType: 'gif' | 'image' | 'diagram'
): string | undefined => {
  switch (context) {
    case 'thumbnail':
      // For thumbnails, prefer smaller images
      return exercise.thumbnail_url || exercise.gif_url;
      
    case 'detail':
      // For detail view, prefer high quality
      if (mediaType === 'gif') {
        return exercise.gif_url;
      } else if (mediaType === 'diagram') {
        return exercise.muscle_diagram_url;
      }
      return exercise.gif_url || exercise.thumbnail_url;
      
    case 'fullscreen':
      // For fullscreen, prefer highest quality
      return exercise.video_url || exercise.gif_url;
      
    default:
      return exercise.gif_url || exercise.thumbnail_url;
  }
};

/**
 * Check if exercise has any media
 */
export const exerciseHasMedia = (exercise: Exercise): boolean => {
  return !!(
    exercise.gif_url ||
    exercise.video_url ||
    exercise.muscle_diagram_url ||
    exercise.thumbnail_url
  );
};

/**
 * Get media type priority for loading
 */
export const getMediaLoadPriority = (
  exercise: Exercise,
  userContext: 'browsing' | 'workout' | 'detail'
): Array<{ url: string; type: 'gif' | 'image' | 'video'; priority: number }> => {
  const media: Array<{ url: string; type: 'gif' | 'image' | 'video'; priority: number }> = [];

  switch (userContext) {
    case 'browsing':
      // When browsing, prioritize thumbnails
      if (exercise.thumbnail_url) {
        media.push({ url: exercise.thumbnail_url, type: 'image', priority: 1 });
      }
      if (exercise.gif_url) {
        media.push({ url: exercise.gif_url, type: 'gif', priority: 2 });
      }
      break;

    case 'workout':
      // During workout, prioritize GIFs for form reference
      if (exercise.gif_url) {
        media.push({ url: exercise.gif_url, type: 'gif', priority: 1 });
      }
      if (exercise.muscle_diagram_url) {
        media.push({ url: exercise.muscle_diagram_url, type: 'image', priority: 2 });
      }
      break;

    case 'detail':
      // In detail view, load everything with appropriate priority
      if (exercise.gif_url) {
        media.push({ url: exercise.gif_url, type: 'gif', priority: 1 });
      }
      if (exercise.muscle_diagram_url) {
        media.push({ url: exercise.muscle_diagram_url, type: 'image', priority: 2 });
      }
      if (exercise.video_url) {
        media.push({ url: exercise.video_url, type: 'video', priority: 3 });
      }
      if (exercise.thumbnail_url) {
        media.push({ url: exercise.thumbnail_url, type: 'image', priority: 4 });
      }
      break;
  }

  return media.sort((a, b) => a.priority - b.priority);
};

/**
 * Estimate media file sizes for cache management
 */
export const estimateMediaSize = (
  url: string,
  type: 'gif' | 'image' | 'video'
): number => {
  // Rough estimates in bytes
  switch (type) {
    case 'gif':
      return 2 * 1024 * 1024; // ~2MB for exercise GIFs
    case 'image':
      return 500 * 1024; // ~500KB for muscle diagrams/thumbnails
    case 'video':
      return 10 * 1024 * 1024; // ~10MB for exercise videos
    default:
      return 1024 * 1024; // ~1MB default
  }
};

/**
 * Generate srcset for responsive images
 */
export const generateImageSrcSet = (baseUrl: string): string => {
  // This would typically generate different sizes
  // For now, return the base URL
  return baseUrl;
};

/**
 * Check if media URL is valid/accessible
 */
export const validateMediaUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get fallback media URL if primary fails
 */
export const getFallbackMediaUrl = (
  exercise: Exercise,
  failedUrl: string
): string | undefined => {
  const allUrls = [
    exercise.gif_url,
    exercise.video_url,
    exercise.muscle_diagram_url,
    exercise.thumbnail_url
  ].filter(Boolean);

  // Return the first URL that's not the failed one
  return allUrls.find(url => url !== failedUrl);
};