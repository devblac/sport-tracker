/**
 * A/B Testing Dashboard Component
 * Real-time experiment monitoring and analysis
 * Built for data-driven decision making
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Play, 
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { experimentManager } from '@/services/ExperimentManager';
import type { Experiment } from '@/services/ExperimentManager';
import { useExperimentAnalysis, useExperimentStats } from '@/hooks/useExperiment';

interface ExperimentDashboardProps {
  className?: string;
}

export const ExperimentDashboard: React.FC<ExperimentDashboardProps> = ({
  className = ''
}) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExperiments = () => {
      try {
        setIsLoading(true);
        const allExperiments = experimentManager.getAllExperiments();
        setExperiments(allExperiments);
        
        if (allExperiments.length > 0 && !selectedExperiment) {
          setSelectedExperiment(allExperiments[0].id);
        }
      } catch (error) {
        console.error('Error loading experiments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiments();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadExperiments, 30000);
    return () => clearInterval(interval);
  }, [selectedExperiment]);

  const handleStartExperiment = (experimentId: string) => {
    try {
      experimentManager.startExperiment(experimentId);
      // Refresh experiments list
      const updatedExperiments = experimentManager.getAllExperiments();
      setExperiments(updatedExperiments);
    } catch (error) {
      console.error('Error starting experiment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            A/B Testing Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and analyze your experiments in real-time
          </p>
        </div>
        
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Experiments Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Experiments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {experiments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Running</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {experiments.filter(e => e.status === 'running').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {experiments.filter(e => e.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {experiments.filter(e => e.status === 'draft').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Active Experiments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {experiments.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No experiments found. Create your first experiment to get started.
                  </p>
                </div>
              ) : (
                experiments.map(experiment => (
                  <ExperimentCard
                    key={experiment.id}
                    experiment={experiment}
                    onStart={() => handleStartExperiment(experiment.id)}
                    onSelect={() => setSelectedExperiment(experiment.id)}
                    isSelected={selectedExperiment === experiment.id}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Experiment Details */}
        {selectedExperiment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Experiment Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExperimentAnalysisView experimentId={selectedExperiment} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Experiment Card Component
interface ExperimentCardProps {
  experiment: Experiment;
  onStart: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  onStart,
  onSelect,
  isSelected
}) => {
  const getStatusColor = (status: Experiment['status']) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'paused': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'draft': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {experiment.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {experiment.description}
          </p>
          
          <div className="flex items-center space-x-4 mt-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(experiment.status)}`}>
              {experiment.status.charAt(0).toUpperCase() + experiment.status.slice(1)}
            </span>
            
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {experiment.variants.length} variants
            </span>
            
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {experiment.targetAudience.percentage}% traffic
            </span>
          </div>
        </div>

        {experiment.status === 'draft' && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            size="sm"
            className="ml-4"
          >
            <Play className="w-4 h-4 mr-1" />
            Start
          </Button>
        )}
      </div>
    </div>
  );
};

// Experiment Analysis View Component
interface ExperimentAnalysisViewProps {
  experimentId: string;
}

const ExperimentAnalysisView: React.FC<ExperimentAnalysisViewProps> = ({
  experimentId
}) => {
  const { analysis, isLoading, error, refresh } = useExperimentAnalysis(experimentId);
  const { stats } = useExperimentStats(experimentId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">
          Error loading analysis: {error.message}
        </p>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalAssignments}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Results</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalResults}
            </p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis.length > 0 ? (
        <div className="space-y-4">
          {analysis.map((metricAnalysis) => (
            <div key={metricAnalysis.metricKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {metricAnalysis.metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              
              <div className="space-y-3">
                {metricAnalysis.variants.map((variant) => (
                  <div key={variant.variant} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {variant.variant}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        ({variant.sampleSize} users)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {variant.mean.toFixed(2)}
                      </div>
                      {variant.liftFromControl.relative !== 0 && (
                        <div className={`text-sm ${
                          variant.liftFromControl.relative > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {variant.liftFromControl.relative > 0 ? '+' : ''}
                          {variant.liftFromControl.relative.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Recommendation: {metricAnalysis.recommendation.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Confidence: {metricAnalysis.confidence.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No analysis data available yet. Results will appear as users interact with the experiment.
          </p>
        </div>
      )}
    </div>
  );
};