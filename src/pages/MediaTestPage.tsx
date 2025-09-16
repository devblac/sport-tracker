import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { ExerciseGifPlayer } from '@/components/exercises/ExerciseGifPlayer';
import { MuscleDiagramViewer } from '@/components/exercises/MuscleDiagramViewer';
import { ExerciseCard } from '@/components/exercises/ExerciseCard';
import { mediaService } from '@/services/MediaService';
import { mediaPreloader } from '@/services/MediaPreloader';
import { useMediaPreloader } from '@/hooks/useMediaPreloader';
import { sampleExercisesWithMedia } from '@/data/sampleExerciseMedia';
import { enhanceExercisesWithMedia } from '@/utils/exerciseMediaUtils';
import type { Exercise } from '@/schemas/exercise';
import { ArrowLeft, Download, Trash2, BarChart3 } from 'lucide-react';

export const MediaTestPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [preloaderStats, setPreloaderStats] = useState<any>(null);

  // Setup media preloader
  const { preloadExercises, preloadWorkout, getStats, clearCache } = useMediaPreloader(exercises, {
    strategy: 'smart',
    enabled: true,
    preloadOnMount: true
  });

  useEffect(() => {
    // Create sample exercises with generated IDs
    const sampleExercises: Exercise[] = sampleExercisesWithMedia.map((exercise, index) => ({
      ...exercise,
      id: `sample-${index + 1}`,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Enhance with media URLs
    const enhancedExercises = enhanceExercisesWithMedia(sampleExercises);
    setExercises(enhancedExercises);

    // Set first exercise as selected
    if (enhancedExercises.length > 0) {
      setSelectedExercise(enhancedExercises[0]);
    }
  }, []);

  useEffect(() => {
    // Update stats every 2 seconds
    const interval = setInterval(() => {
      setCacheStats(mediaService.getCacheStats());
      setPreloaderStats(getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, [getStats]);

  const handlePreloadAll = async () => {
    await preloadExercises(exercises, 'aggressive');
  };

  const handlePreloadWorkout = async () => {
    await preloadWorkout(exercises.slice(0, 3)); // First 3 exercises as "workout"
  };

  const handleClearCache = async () => {
    await mediaService.clearCache();
    clearCache();
    setCacheStats(mediaService.getCacheStats());
    setPreloaderStats(getStats());
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Media System Test</h1>
            <p className="text-muted-foreground mt-1">
              Testing exercise media loading, caching, and preloading
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handlePreloadAll} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Preload All
            </Button>
            <Button onClick={handlePreloadWorkout} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Preload Workout
            </Button>
            <Button onClick={handleClearCache} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cache Stats */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Media Cache Stats
              </h3>
              {cacheStats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Size:</span>
                    <span className="font-medium">{formatBytes(cacheStats.totalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items Cached:</span>
                    <span className="font-medium">{cacheStats.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Size:</span>
                    <span className="font-medium">{formatBytes(cacheStats.maxSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hit Rate:</span>
                    <span className="font-medium">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(cacheStats.totalSize / cacheStats.maxSize) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preloader Stats */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Preloader Stats
              </h3>
              {preloaderStats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Queue Size:</span>
                    <span className="font-medium">{preloaderStats.queueSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Jobs:</span>
                    <span className="font-medium">{preloaderStats.activeJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium text-green-600">{preloaderStats.completedJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="font-medium text-red-600">{preloaderStats.failedJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="font-medium">{(preloaderStats.successRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercise List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Sample Exercises</h2>
            <div className="space-y-3">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onClick={setSelectedExercise}
                  compact={true}
                  enablePreloading={true}
                  className={selectedExercise?.id === exercise.id ? 'ring-2 ring-primary' : ''}
                />
              ))}
            </div>
          </div>

          {/* Exercise Detail */}
          <div className="lg:col-span-2 space-y-6">
            {selectedExercise ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedExercise.name}
                  </h2>
                </div>

                {/* Media Components */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* GIF Player */}
                  {selectedExercise.gif_url && (
                    <ExerciseGifPlayer 
                      exercise={selectedExercise}
                      autoPlay={true}
                      showControls={true}
                      showFullscreenButton={true}
                    />
                  )}

                  {/* Muscle Diagram */}
                  {selectedExercise.muscle_diagram_url && (
                    <MuscleDiagramViewer 
                      exercise={selectedExercise}
                      showControls={true}
                      interactive={true}
                    />
                  )}
                </div>

                {/* Exercise Info */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Exercise Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 font-medium capitalize">{selectedExercise.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <span className="ml-2 font-medium capitalize">{selectedExercise.category}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Equipment:</span>
                        <span className="ml-2 font-medium capitalize">{selectedExercise.equipment}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Difficulty:</span>
                        <span className="ml-2 font-medium">{selectedExercise.difficulty_level}/5</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <span className="text-muted-foreground">Body Parts:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedExercise.body_parts.map((part) => (
                          <span 
                            key={part}
                            className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground capitalize"
                          >
                            {part.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="text-muted-foreground">Media URLs:</span>
                      <div className="mt-2 space-y-1 text-xs">
                        {selectedExercise.gif_url && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓ GIF:</span>
                            <span className="font-mono text-muted-foreground truncate">
                              {selectedExercise.gif_url}
                            </span>
                          </div>
                        )}
                        {selectedExercise.muscle_diagram_url && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓ Diagram:</span>
                            <span className="font-mono text-muted-foreground truncate">
                              {selectedExercise.muscle_diagram_url}
                            </span>
                          </div>
                        )}
                        {selectedExercise.thumbnail_url && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">✓ Thumbnail:</span>
                            <span className="font-mono text-muted-foreground truncate">
                              {selectedExercise.thumbnail_url}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Select an exercise to view its media</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};