import React from 'react';
import { ArrowLeft, Share, Heart, Plus } from 'lucide-react';
import { Button, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '@/components/ui';
import { ExerciseAboutTab } from './ExerciseAboutTab';
import { ExerciseHistoryTab } from './ExerciseHistoryTab';
import { ExerciseChartsTab } from './ExerciseChartsTab';
import { ExerciseRecordsTab } from './ExerciseRecordsTab';
import type { Exercise } from '@/types';
import { getDifficultyDisplay, EXERCISE_CATEGORIES } from '@/utils';

interface ExerciseDetailProps {
  exercise: Exercise;
  onBack?: () => void;
  onAddToWorkout?: (exercise: Exercise) => void;
  onToggleFavorite?: (exercise: Exercise) => void;
  isFavorite?: boolean;
}

export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
  exercise,
  onBack,
  onAddToWorkout,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const categoryInfo = EXERCISE_CATEGORIES[exercise.category] || { name: exercise.category, icon: '💪' };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: exercise.name,
          text: `Check out this ${exercise.category} exercise: ${exercise.name}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // Could show a toast notification here
        console.log('Link copied to clipboard');
      } catch (error) {
        console.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {exercise.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {categoryInfo.icon}
                {categoryInfo.name}
              </span>
              <span className="text-muted-foreground">•</span>
              <Badge 
                variant={exercise.difficulty_level <= 2 ? 'secondary' : 
                        exercise.difficulty_level <= 3 ? 'default' : 'outline'}
                className={`text-xs ${
                  exercise.difficulty_level >= 4 ? 'border-orange-500 text-orange-600 dark:text-orange-400' : ''
                }`}
              >
                {getDifficultyDisplay(exercise.difficulty_level)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(exercise)}
              className="p-2"
            >
              <Heart 
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`} 
              />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="p-2"
          >
            <Share className="w-5 h-5" />
          </Button>
          
          {onAddToWorkout && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAddToWorkout(exercise)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Workout
            </Button>
          )}
        </div>
      </div>

      {/* Exercise Aliases */}
      {exercise.aliases.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <span>Also known as: </span>
          {exercise.aliases.join(', ')}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-4">
          <ExerciseAboutTab exercise={exercise} />
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <ExerciseHistoryTab exercise={exercise} />
        </TabsContent>
        
        <TabsContent value="charts" className="mt-4">
          <ExerciseChartsTab exercise={exercise} />
        </TabsContent>
        
        <TabsContent value="records" className="mt-4">
          <ExerciseRecordsTab exercise={exercise} />
        </TabsContent>
      </Tabs>
    </div>
  );
};