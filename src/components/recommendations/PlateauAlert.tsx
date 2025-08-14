import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, Lightbulb, X } from 'lucide-react';
import { usePlateauDetection } from '@/hooks/useRecommendations';

interface PlateauAlertProps {
  exerciseId: string;
  exerciseName: string;
  onDismiss?: () => void;
  className?: string;
}

export const PlateauAlert: React.FC<PlateauAlertProps> = ({
  exerciseId,
  exerciseName,
  onDismiss,
  className = ''
}) => {
  const { plateau, loading } = usePlateauDetection(exerciseId);
  const [isDismissed, setIsDismissed] = useState(false);

  if (loading || !plateau || !plateau.isPlateaued || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const formatDuration = (weeks: number) => {
    if (weeks === 1) return '1 week';
    if (weeks < 4) return `${weeks} weeks`;
    const months = Math.floor(weeks / 4);
    const remainingWeeks = weeks % 4;
    if (remainingWeeks === 0) return `${months} month${months > 1 ? 's' : ''}`;
    return `${months} month${months > 1 ? 's' : ''} and ${remainingWeeks} week${remainingWeeks > 1 ? 's' : ''}`;
  };

  return (
    <div className={`bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Plateau Detected
              </h3>
              <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
                <TrendingDown className="w-3 h-3" />
                <span>{formatDuration(plateau.plateauDuration)}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              You haven't improved on <strong>{exerciseName}</strong> for {formatDuration(plateau.plateauDuration)}. 
              {plateau.lastImprovement && (
                <span> Last improvement was on {plateau.lastImprovement.toLocaleDateString()}.</span>
              )}
            </p>

            {/* Suggestions */}
            {plateau.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span>Breakthrough suggestions:</span>
                </div>
                
                <ul className="space-y-1">
                  {plateau.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-2 mt-4">
              <button className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">
                Try Deload Week
              </button>
              <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Switch Exercise
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};