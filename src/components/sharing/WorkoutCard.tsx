/**
 * Workout Card Component
 * 
 * Visual card component for sharing workout achievements.
 */

import React from 'react';
import { 
  Clock, 
  Dumbbell, 
  TrendingUp, 
  Trophy,
  Calendar,
  Target
} from 'lucide-react';

import type { WorkoutCardData } from '@/types/shareableContent';

interface WorkoutCardProps {
  data: WorkoutCardData;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  template: string;
  className?: string;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  data,
  backgroundColor,
  textColor,
  accentColor,
  template,
  className = ''
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl shadow-2xl ${className}`}
      style={{ 
        backgroundColor,
        color: textColor,
        minHeight: '400px',
        background: template.includes('gradient') 
          ? `linear-gradient(135deg, ${backgroundColor}, ${accentColor})`
          : backgroundColor
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 text-6xl">💪</div>
        <div className="absolute bottom-4 left-4 text-4xl">🏋️</div>
      </div>

      {/* Content */}
      <div className="relative p-8 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏋️‍♂️</div>
          <h1 className="text-3xl font-bold mb-2">{data.workoutName}</h1>
          <p className="text-lg opacity-90">{data.workoutType}</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${accentColor}20` }}>
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: accentColor }} />
            <div className="text-2xl font-bold">{formatDuration(data.duration)}</div>
            <div className="text-sm opacity-75">Duración</div>
          </div>

          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${accentColor}20` }}>
            <Dumbbell className="w-8 h-8 mx-auto mb-2" style={{ color: accentColor }} />
            <div className="text-2xl font-bold">{data.exerciseCount}</div>
            <div className="text-sm opacity-75">Ejercicios</div>
          </div>

          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${accentColor}20` }}>
            <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: accentColor }} />
            <div className="text-2xl font-bold">{data.totalVolume.toLocaleString()}</div>
            <div className="text-sm opacity-75">kg Total</div>
          </div>

          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: `${accentColor}20` }}>
            <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: accentColor }} />
            <div className="text-2xl font-bold">{data.personalRecords.length}</div>
            <div className="text-sm opacity-75">PRs</div>
          </div>
        </div>

        {/* Personal Records */}
        {data.personalRecords.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Trophy className="w-5 h-5 mr-2" style={{ color: accentColor }} />
              Récords Personales
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.personalRecords.map((record, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: `${accentColor}30`,
                    color: textColor
                  }}
                >
                  {record}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top Exercises */}
        {data.topExercises.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" style={{ color: accentColor }} />
              Ejercicios Principales
            </h3>
            <div className="space-y-2">
              {data.topExercises.slice(0, 3).map((exercise, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-sm opacity-75">
                    {exercise.sets}×{exercise.reps} @ {exercise.weight}kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm opacity-75">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(data.date)}
            </div>
            <div className="text-sm font-medium">
              🏋️ FitnessApp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCard;