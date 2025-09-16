import React, { useRef, useEffect } from 'react';
import { Card, CardContent, Badge } from '@/components/ui';
import { ExerciseThumbnail } from '@/components/ui/LazyImage';
import { useExerciseListPreloader } from '@/hooks/useMediaPreloader';
import type { Exercise } from '@/schemas/exercise';

// Import utilities with error handling
let getDifficultyDisplay: any = (level: number) => `Level ${level}`;
let getEquipmentDisplay: any = (equipment: string) => equipment;
let getBodyPartDisplay: any = (part: string) => part;
let EXERCISE_CATEGORIES: any = {};
let EQUIPMENT_CATEGORIES: any = {};

try {
  const utils = require('@/utils');
  getDifficultyDisplay = utils.getDifficultyDisplay || getDifficultyDisplay;
  getEquipmentDisplay = utils.getEquipmentDisplay || getEquipmentDisplay;
  getBodyPartDisplay = utils.getBodyPartDisplay || getBodyPartDisplay;
  EXERCISE_CATEGORIES = utils.EXERCISE_CATEGORIES || {};
  EQUIPMENT_CATEGORIES = utils.EQUIPMENT_CATEGORIES || {};
} catch (error) {
  console.warn('Could not load exercise utilities, using fallbacks');
}

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: (exercise: Exercise) => void;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
  enablePreloading?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onClick,
  showDetails = true,
  compact = false,
  className = '',
  enablePreloading = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { observeElement, unobserveElement } = useExerciseListPreloader([exercise], {
    enabled: enablePreloading,
    preloadOnVisible: true,
    preloadOnMount: false
  });

  // Setup intersection observer for preloading
  useEffect(() => {
    if (cardRef.current && enablePreloading) {
      observeElement(cardRef.current, exercise.id);
      
      return () => {
        if (cardRef.current) {
          unobserveElement(cardRef.current);
        }
      };
    }
  }, [exercise.id, enablePreloading, observeElement, unobserveElement]);
  const categoryInfo = EXERCISE_CATEGORIES[exercise.category] || { 
    name: exercise.category, 
    icon: '💪' 
  };
  const equipmentInfo = EQUIPMENT_CATEGORIES[exercise.equipment] || { 
    name: exercise.equipment, 
    icon: '🏋️' 
  };

  const handleClick = () => {
    if (onClick) {
      onClick(exercise);
    }
  };

  // Compact layout for list view (like STRONG app)
  if (compact) {
    return (
      <div 
        className={`flex items-center justify-between p-3 hover:bg-accent/50 transition-colors cursor-pointer border-b border-border/50 last:border-b-0 ${className}`}
        onClick={handleClick}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {exercise.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              {categoryInfo?.icon || '💪'}
              {categoryInfo?.name || exercise.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {equipmentInfo?.icon || '🏋️'}
              {getEquipmentDisplay(exercise.equipment)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          <Badge 
            variant={exercise.difficulty_level <= 2 ? 'secondary' : 
                    exercise.difficulty_level <= 3 ? 'default' : 'outline'}
            className={`text-xs ${
              exercise.difficulty_level >= 4 ? 'border-orange-500 text-orange-600 dark:text-orange-400' : ''
            }`}
          >
            {getDifficultyDisplay(exercise.difficulty_level)}
          </Badge>
          
          {exercise.is_custom && (
            <Badge variant="outline" className="text-xs">
              Custom
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card 
      ref={cardRef}
      className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        {/* Exercise Thumbnail */}
        {(exercise.thumbnail_url || exercise.gif_url) && !compact && (
          <div className="mb-3">
            <ExerciseThumbnail
              src={exercise.thumbnail_url || exercise.gif_url || ''}
              alt={`${exercise.name} thumbnail`}
              className="w-full h-24 object-cover rounded-md"
              loading="lazy"
            />
          </div>
        )}
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base mb-1 truncate">
              {exercise.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {categoryInfo?.icon || '💪'}
                <span className="truncate">{categoryInfo?.name || exercise.category}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {equipmentInfo?.icon || '🏋️'}
                <span className="truncate">{getEquipmentDisplay(exercise.equipment)}</span>
              </span>
            </div>
          </div>
          
          {/* Difficulty Badge */}
          <Badge 
            variant={exercise.difficulty_level <= 2 ? 'secondary' : 
                    exercise.difficulty_level <= 3 ? 'default' : 'outline'}
            className={`ml-2 text-xs flex-shrink-0 ${
              exercise.difficulty_level >= 4 ? 'border-orange-500 text-orange-600 dark:text-orange-400' : ''
            }`}
          >
            {getDifficultyDisplay(exercise.difficulty_level)}
          </Badge>
        </div>

        {/* Body Parts */}
        {showDetails && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1">
              {exercise.body_parts.slice(0, 2).map((bodyPart) => (
                <Badge key={bodyPart} variant="outline" className="text-xs">
                  {getBodyPartDisplay(bodyPart)}
                </Badge>
              ))}
              {exercise.body_parts.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{exercise.body_parts.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Exercise Type & Custom Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs capitalize">
              {exercise.type.replace('_', ' ')}
            </Badge>
            {exercise.is_custom && (
              <Badge variant="outline" className="text-xs">
                Custom
              </Badge>
            )}
            {exercise.is_verified && (
              <Badge variant="default" className="text-xs">
                ✓ Verified
              </Badge>
            )}
          </div>

          {/* Default Sets/Reps */}
          {showDetails && exercise.default_sets && exercise.default_reps && (
            <div className="text-xs text-muted-foreground">
              {exercise.default_sets} × {exercise.default_reps}
            </div>
          )}
        </div>

        {/* Tags */}
        {showDetails && exercise.tags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex flex-wrap gap-1">
              {exercise.tags.slice(0, 4).map((tag) => (
                <span 
                  key={tag} 
                  className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
              {exercise.tags.length > 4 && (
                <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                  +{exercise.tags.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Media Indicators */}
        {showDetails && (
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {exercise.gif_url && (
              <span className="flex items-center gap-1">
                🎬 Animation
              </span>
            )}
            {exercise.video_url && (
              <span className="flex items-center gap-1">
                📹 Video
              </span>
            )}
            {exercise.instructions.length > 0 && (
              <span className="flex items-center gap-1">
                📋 {exercise.instructions.length} steps
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};