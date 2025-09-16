import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui';
import { MuscleDiagram } from '@/components/ui/LazyImage';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import type { Exercise, MuscleGroup } from '@/schemas/exercise';
import { getMuscleGroupDisplay } from '@/utils';

interface MuscleDiagramViewerProps {
  exercise: Exercise;
  showControls?: boolean;
  interactive?: boolean;
  className?: string;
}

interface MuscleHighlight {
  muscle: MuscleGroup;
  intensity: 'primary' | 'secondary';
  color: string;
}

export const MuscleDiagramViewer: React.FC<MuscleDiagramViewerProps> = ({
  exercise,
  showControls = true,
  interactive = true,
  className = '',
}) => {
  const [zoom, setZoom] = useState(1);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [showMuscleInfo, setShowMuscleInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate muscle highlights based on exercise
  const muscleHighlights: MuscleHighlight[] = exercise.muscle_groups.map((muscle, index) => ({
    muscle,
    intensity: index < 2 ? 'primary' : 'secondary', // First 2 are primary
    color: index < 2 ? '#ef4444' : '#f97316', // Red for primary, orange for secondary
  }));

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setSelectedMuscle(null);
  };

  const handleMuscleClick = (muscle: MuscleGroup) => {
    if (!interactive) return;
    
    setSelectedMuscle(selectedMuscle === muscle ? null : muscle);
    setShowMuscleInfo(true);
  };

  // Generate SVG overlay for muscle highlighting
  const renderMuscleOverlay = () => {
    if (!exercise.muscle_diagram_url || !interactive) return null;

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 600"
        style={{ zIndex: 10 }}
      >
        {/* This would typically be generated based on actual muscle coordinates */}
        {/* For demo purposes, showing conceptual muscle regions */}
        {muscleHighlights.map((highlight, index) => (
          <g key={highlight.muscle}>
            {/* Chest muscles */}
            {highlight.muscle.includes('pectorals') && (
              <ellipse
                cx="200"
                cy="180"
                rx="60"
                ry="40"
                fill={highlight.color}
                fillOpacity="0.3"
                stroke={highlight.color}
                strokeWidth="2"
                className="cursor-pointer hover:fill-opacity-50 transition-all"
                onClick={() => handleMuscleClick(highlight.muscle)}
              />
            )}
            
            {/* Shoulder muscles */}
            {highlight.muscle.includes('deltoids') && (
              <>
                <circle
                  cx="140"
                  cy="160"
                  r="25"
                  fill={highlight.color}
                  fillOpacity="0.3"
                  stroke={highlight.color}
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-opacity-50 transition-all"
                  onClick={() => handleMuscleClick(highlight.muscle)}
                />
                <circle
                  cx="260"
                  cy="160"
                  r="25"
                  fill={highlight.color}
                  fillOpacity="0.3"
                  stroke={highlight.color}
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-opacity-50 transition-all"
                  onClick={() => handleMuscleClick(highlight.muscle)}
                />
              </>
            )}
            
            {/* Biceps */}
            {highlight.muscle.includes('biceps') && (
              <>
                <ellipse
                  cx="120"
                  cy="220"
                  rx="15"
                  ry="30"
                  fill={highlight.color}
                  fillOpacity="0.3"
                  stroke={highlight.color}
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-opacity-50 transition-all"
                  onClick={() => handleMuscleClick(highlight.muscle)}
                />
                <ellipse
                  cx="280"
                  cy="220"
                  rx="15"
                  ry="30"
                  fill={highlight.color}
                  fillOpacity="0.3"
                  stroke={highlight.color}
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-opacity-50 transition-all"
                  onClick={() => handleMuscleClick(highlight.muscle)}
                />
              </>
            )}
            
            {/* Quadriceps */}
            {highlight.muscle.includes('quadriceps') && (
              <>
                <ellipse
                  cx="170"
                  cy="400"
                  rx="20"
                  ry="60"
                  fill={highlight.color}
                  fillOpacity="0.3"
                  stroke={highlight.color}
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-opacity-50 transition-all"
                  onClick={() => handleMuscleClick(highlight.muscle)}
                />
                <ellipse
                  cx="230"
                  cy="400"
                  rx="20"
                  ry="60"
                  fill={highlight.color}
                  fillOpacity="0.3"
                  stroke={highlight.color}
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-opacity-50 transition-all"
                  onClick={() => handleMuscleClick(highlight.muscle)}
                />
              </>
            )}
          </g>
        ))}
      </svg>
    );
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Muscle Activation</h3>
            {showControls && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-1 rounded hover:bg-accent transition-colors"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 rounded hover:bg-accent transition-colors"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1 rounded hover:bg-accent transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Diagram Container */}
          <div 
            ref={containerRef}
            className="relative bg-muted rounded-lg overflow-hidden"
            style={{ aspectRatio: '2/3', maxHeight: '400px' }}
          >
            <div
              className="relative w-full h-full transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              {exercise.muscle_diagram_url ? (
                <>
                  <MuscleDiagram
                    src={exercise.muscle_diagram_url}
                    alt={`${exercise.name} muscle diagram`}
                    className="w-full h-full object-contain"
                  />
                  {renderMuscleOverlay()}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💪</div>
                    <p className="text-sm">Muscle diagram not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Muscle Legend */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Target Muscles</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {muscleHighlights.map((highlight) => (
                <div
                  key={highlight.muscle}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    selectedMuscle === highlight.muscle
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/80'
                  } ${interactive ? 'cursor-pointer' : ''}`}
                  onClick={() => interactive && handleMuscleClick(highlight.muscle)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: highlight.color }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {getMuscleGroupDisplay(highlight.muscle)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        highlight.intensity === 'primary'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                      }`}
                    >
                      {highlight.intensity === 'primary' ? 'Primary' : 'Secondary'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Muscle Info */}
          {selectedMuscle && showMuscleInfo && (
            <div className="p-3 bg-accent/50 rounded-lg border border-border">
              <h4 className="font-medium text-foreground mb-2">
                {getMuscleGroupDisplay(selectedMuscle)}
              </h4>
              <p className="text-sm text-muted-foreground">
                This muscle group is actively engaged during the {exercise.name} exercise.
                {muscleHighlights.find(h => h.muscle === selectedMuscle)?.intensity === 'primary'
                  ? ' It\'s one of the primary movers for this movement.'
                  : ' It provides secondary support and stabilization.'
                }
              </p>
            </div>
          )}

          {/* Exercise-specific muscle tips */}
          {exercise.tips.some(tip => tip.category === 'form') && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                💡 Muscle Activation Tips
              </h4>
              <div className="space-y-1">
                {exercise.tips
                  .filter(tip => tip.category === 'form')
                  .slice(0, 2)
                  .map((tip, index) => (
                    <p key={index} className="text-sm text-blue-800 dark:text-blue-200">
                      • {tip.tip}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};