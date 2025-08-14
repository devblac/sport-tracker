import React, { useState } from 'react';
import { 
  TrendingDown, 
  Zap, 
  RotateCcw, 
  Target, 
  Clock, 
  Dumbbell,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { usePlateauDetection } from '@/hooks/useRecommendations';

interface PlateauBreakerProps {
  exerciseId: string;
  exerciseName: string;
  onApplyStrategy?: (strategy: PlateauStrategy) => void;
  className?: string;
}

interface PlateauStrategy {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: string;
  steps: string[];
  expectedOutcome: string;
}

const PLATEAU_STRATEGIES: PlateauStrategy[] = [
  {
    id: 'deload',
    name: 'Deload Week',
    description: 'Reduce weight by 10-15% and focus on perfect form',
    icon: <RotateCcw className="w-5 h-5" />,
    difficulty: 'easy',
    duration: '1 week',
    steps: [
      'Reduce weight by 10-15% from your current working weight',
      'Focus on perfect form and controlled movements',
      'Maintain the same rep ranges',
      'Use this week for active recovery',
      'Return to previous weights next week'
    ],
    expectedOutcome: 'Allows nervous system recovery and often leads to strength gains'
  },
  {
    id: 'tempo',
    name: 'Tempo Variation',
    description: 'Add controlled tempo to increase time under tension',
    icon: <Clock className="w-5 h-5" />,
    difficulty: 'medium',
    duration: '2-3 weeks',
    steps: [
      'Use 3-1-2-1 tempo (3 sec down, 1 sec pause, 2 sec up, 1 sec pause)',
      'Reduce weight by 20-25% initially',
      'Focus on muscle control throughout the movement',
      'Gradually increase weight while maintaining tempo',
      'Return to normal tempo with improved strength'
    ],
    expectedOutcome: 'Improves muscle control and breaks through strength plateaus'
  },
  {
    id: 'volume',
    name: 'Volume Manipulation',
    description: 'Temporarily increase training volume',
    icon: <Target className="w-5 h-5" />,
    difficulty: 'medium',
    duration: '3-4 weeks',
    steps: [
      'Add 1-2 extra sets to your current routine',
      'Keep weight the same but increase total volume',
      'Focus on quality reps, not just quantity',
      'Monitor recovery carefully',
      'Return to normal volume with strength gains'
    ],
    expectedOutcome: 'Increases work capacity and can stimulate new growth'
  },
  {
    id: 'variation',
    name: 'Exercise Variation',
    description: 'Switch to a similar but different exercise',
    icon: <Dumbbell className="w-5 h-5" />,
    difficulty: 'hard',
    duration: '4-6 weeks',
    steps: [
      'Choose a similar exercise that targets the same muscles',
      'Start with conservative weight to learn the movement',
      'Progress normally with the new exercise',
      'Focus on the different muscle activation patterns',
      'Return to original exercise with improved strength'
    ],
    expectedOutcome: 'Provides new stimulus and often transfers back to original lift'
  },
  {
    id: 'intensity',
    name: 'Intensity Techniques',
    description: 'Use advanced techniques like drop sets or pause reps',
    icon: <Zap className="w-5 h-5" />,
    difficulty: 'hard',
    duration: '2-3 weeks',
    steps: [
      'Add pause reps (2-3 second pause at bottom)',
      'Try drop sets (reduce weight by 20% and continue)',
      'Use cluster sets (rest 10-15 seconds between reps)',
      'Focus on pushing past normal failure points',
      'Use sparingly to avoid overtraining'
    ],
    expectedOutcome: 'Provides intense stimulus to break through plateaus'
  }
];

export const PlateauBreaker: React.FC<PlateauBreakerProps> = ({
  exerciseId,
  exerciseName,
  onApplyStrategy,
  className = ''
}) => {
  const { plateau, loading } = usePlateauDetection(exerciseId);
  const [selectedStrategy, setSelectedStrategy] = useState<PlateauStrategy | null>(null);
  const [appliedStrategies, setAppliedStrategies] = useState<Set<string>>(new Set());

  if (loading || !plateau || !plateau.isPlateaued) {
    return null;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleApplyStrategy = (strategy: PlateauStrategy) => {
    setAppliedStrategies(prev => new Set([...prev, strategy.id]));
    onApplyStrategy?.(strategy);
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
    <div className={`bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 rounded-xl p-6 border border-orange-200 dark:border-orange-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Plateau Breaker
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {exerciseName} • Stuck for {formatDuration(plateau.plateauDuration)}
          </p>
        </div>
      </div>

      {/* Strategy Selection */}
      {!selectedStrategy ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Choose a strategy to break through your plateau:
          </p>
          
          {PLATEAU_STRATEGIES.map((strategy) => {
            const isApplied = appliedStrategies.has(strategy.id);
            
            return (
              <div
                key={strategy.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isApplied 
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                }`}
                onClick={() => !isApplied && setSelectedStrategy(strategy)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-orange-500">
                      {isApplied ? <CheckCircle className="w-5 h-5 text-green-500" /> : strategy.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {strategy.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {strategy.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(strategy.difficulty)}`}>
                      {strategy.difficulty}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {strategy.duration}
                    </span>
                    {!isApplied && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Strategy Details */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-orange-500">
                {selectedStrategy.icon}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedStrategy.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedStrategy.duration} • {selectedStrategy.difficulty} difficulty
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStrategy(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ←
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Step-by-step guide:
            </h5>
            <ol className="space-y-2">
              {selectedStrategy.steps.map((step, index) => (
                <li key={index} className="flex items-start space-x-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Expected Outcome:
            </h5>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {selectedStrategy.expectedOutcome}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleApplyStrategy(selectedStrategy)}
              className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Apply This Strategy
            </button>
            <button
              onClick={() => setSelectedStrategy(null)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};