// StrengthComparison Component - Advanced strength comparison charts
// Implements requirement 15.2 - Strength comparison visualization

import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { UserPercentileRanking, PercentileComparison, UserDemographics } from '../../types/percentiles';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

interface StrengthComparisonProps {
  userId: string;
  demographics: UserDemographics;
  exercises: Array<{
    exercise_id: string;
    exercise_name: string;
    user_value: number;
    unit: string;
    category: 'powerlifting' | 'bodyweight' | 'cardio';
  }>;
  showRelativeStrength?: boolean;
  className?: string;
}

interface ComparisonData {
  exercise: string;
  userValue: number;
  userPercentile: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  strengthLevel: string;
}

export const StrengthComparison: React.FC<StrengthComparisonProps> = ({
  userId,
  demographics,
  exercises,
  showRelativeStrength = true,
  className = ''
}) => {
  const [chartType, setChartType] = useState<'percentile' | 'absolute' | 'relative'>('percentile');
  const [selectedSegment, setSelectedSegment] = useState<string>('global_all');
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);

  useEffect(() => {
    processComparisonData();
  }, [exercises, selectedSegment]);

  const processComparisonData = () => {
    const data: ComparisonData[] = exercises.map(exercise => {
      // Generate mock percentile based on user value relative to typical ranges
      const basePercentiles = getBasePercentiles(exercise.exercise_id);
      const userPercentile = calculateMockPercentile(exercise.user_value, basePercentiles);
      
      // Mock percentile data - in real app would come from percentile service
      const mockPercentiles = {
        p25: basePercentiles.p25,
        p50: basePercentiles.p50,
        p75: basePercentiles.p75,
        p90: basePercentiles.p90
      };

      return {
        exercise: exercise.exercise_name,
        userValue: exercise.user_value,
        userPercentile,
        ...mockPercentiles,
        strengthLevel: getStrengthLevel(userPercentile)
      };
    });

    setComparisonData(data);
  };

  const getBasePercentiles = (exerciseId: string) => {
    const baseValues: Record<string, any> = {
      'squat': { p25: 80, p50: 100, p75: 130, p90: 160 },
      'bench_press': { p25: 60, p50: 80, p75: 100, p90: 120 },
      'deadlift': { p25: 100, p50: 130, p75: 160, p90: 200 },
      'pull_ups': { p25: 5, p50: 8, p75: 12, p90: 18 },
      'push_ups': { p25: 15, p50: 25, p75: 35, p90: 50 },
      'running_5k': { p25: 1800, p50: 1500, p75: 1200, p90: 1080 } // seconds (lower is better)
    };
    return baseValues[exerciseId] || { p25: 50, p50: 75, p75: 100, p90: 125 };
  };

  const calculateMockPercentile = (userValue: number, basePercentiles: any): number => {
    if (userValue <= basePercentiles.p25) return 25;
    if (userValue <= basePercentiles.p50) return 50;
    if (userValue <= basePercentiles.p75) return 75;
    if (userValue <= basePercentiles.p90) return 90;
    return 95;
  };

  const getStrengthLevel = (percentile: number): string => {
    if (percentile >= 90) return 'elite';
    if (percentile >= 75) return 'advanced';
    if (percentile >= 50) return 'intermediate';
    if (percentile >= 25) return 'novice';
    return 'untrained';
  };

  const getPercentileChartData = () => {
    const exercises = comparisonData.map(d => d.exercise);
    const userPercentiles = comparisonData.map(d => d.userPercentile);

    return {
      labels: exercises,
      datasets: [
        {
          label: 'Tu Percentil',
          data: userPercentiles,
          backgroundColor: userPercentiles.map(p => {
            if (p >= 90) return 'rgba(147, 51, 234, 0.8)'; // Purple
            if (p >= 75) return 'rgba(59, 130, 246, 0.8)'; // Blue
            if (p >= 50) return 'rgba(34, 197, 94, 0.8)'; // Green
            if (p >= 25) return 'rgba(251, 191, 36, 0.8)'; // Yellow
            return 'rgba(239, 68, 68, 0.8)'; // Red
          }),
          borderColor: userPercentiles.map(p => {
            if (p >= 90) return 'rgb(147, 51, 234)';
            if (p >= 75) return 'rgb(59, 130, 246)';
            if (p >= 50) return 'rgb(34, 197, 94)';
            if (p >= 25) return 'rgb(251, 191, 36)';
            return 'rgb(239, 68, 68)';
          }),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  };

  const getAbsoluteChartData = () => {
    const exercises = comparisonData.map(d => d.exercise);

    return {
      labels: exercises,
      datasets: [
        {
          label: 'P25 (25º percentil)',
          data: comparisonData.map(d => d.p25),
          backgroundColor: 'rgba(239, 68, 68, 0.3)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'P50 (Mediana)',
          data: comparisonData.map(d => d.p50),
          backgroundColor: 'rgba(251, 191, 36, 0.3)',
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'P75 (75º percentil)',
          data: comparisonData.map(d => d.p75),
          backgroundColor: 'rgba(34, 197, 94, 0.3)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'P90 (90º percentil)',
          data: comparisonData.map(d => d.p90),
          backgroundColor: 'rgba(147, 51, 234, 0.3)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Tu Rendimiento',
          data: comparisonData.map(d => d.userValue),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 3,
          pointRadius: 8,
          pointHoverRadius: 10,
          type: 'line' as const,
        }
      ]
    };
  };

  const getRelativeChartData = () => {
    // Calculate relative strength (value / bodyweight) for strength exercises
    const exercises = comparisonData.map(d => d.exercise);
    const relativeStrengths = comparisonData.map(d => {
      if (['squat', 'bench_press', 'deadlift'].some(ex => d.exercise.toLowerCase().includes(ex))) {
        return d.userValue / demographics.weight;
      }
      return d.userValue; // For bodyweight exercises, return absolute value
    });

    return {
      labels: exercises,
      datasets: [
        {
          label: 'Fuerza Relativa (kg/peso corporal)',
          data: relativeStrengths,
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: chartType === 'percentile' ? 'Comparación de Percentiles' :
              chartType === 'absolute' ? 'Comparación de Valores Absolutos' :
              'Fuerza Relativa por Ejercicio',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (chartType === 'percentile') {
              return `${label}: ${Math.round(value)}º percentil`;
            } else if (chartType === 'relative') {
              return `${label}: ${value.toFixed(2)}x peso corporal`;
            } else {
              return `${label}: ${value.toFixed(1)} kg`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: chartType === 'percentile' ? 100 : undefined,
        title: {
          display: true,
          text: chartType === 'percentile' ? 'Percentil' :
                chartType === 'relative' ? 'Múltiplo del Peso Corporal' :
                'Peso (kg)',
          font: {
            size: 14,
            weight: 'bold' as const
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          callback: function(value: any) {
            if (chartType === 'percentile') {
              return `${value}%`;
            } else if (chartType === 'relative') {
              return `${value}x`;
            } else {
              return `${value} kg`;
            }
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Ejercicios',
          font: {
            size: 14,
            weight: 'bold' as const
          }
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          },
          maxRotation: 45
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };

  const getStrengthLevelSummary = () => {
    const levelCounts = comparisonData.reduce((acc, data) => {
      acc[data.strengthLevel] = (acc[data.strengthLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantLevel = Object.entries(levelCounts).reduce((a, b) => 
      levelCounts[a[0]] > levelCounts[b[0]] ? a : b
    )[0];

    const levelInfo = {
      'untrained': { label: 'Sin Entrenar', color: 'text-gray-600', icon: '🌱' },
      'novice': { label: 'Principiante', color: 'text-blue-600', icon: '🥉' },
      'intermediate': { label: 'Intermedio', color: 'text-green-600', icon: '🥈' },
      'advanced': { label: 'Avanzado', color: 'text-purple-600', icon: '🥇' },
      'elite': { label: 'Elite', color: 'text-yellow-500', icon: '👑' }
    };

    return {
      dominantLevel,
      info: levelInfo[dominantLevel as keyof typeof levelInfo] || levelInfo.novice,
      distribution: levelCounts
    };
  };

  const strengthSummary = getStrengthLevelSummary();

  const getCurrentChartData = () => {
    switch (chartType) {
      case 'percentile':
        return getPercentileChartData();
      case 'absolute':
        return getAbsoluteChartData();
      case 'relative':
        return getRelativeChartData();
      default:
        return getPercentileChartData();
    }
  };

  if (comparisonData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center ${className}`}>
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No hay datos de comparación
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Registra entrenamientos en múltiples ejercicios para ver comparaciones detalladas
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Comparación de Fuerza</h2>
            <p className="text-blue-100">
              Análisis detallado de tu rendimiento en múltiples ejercicios
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl ${strengthSummary.info.color.replace('text-', 'text-white ')}`}>
              {strengthSummary.info.icon}
            </div>
            <div className="text-sm text-blue-100">
              Nivel dominante: {strengthSummary.info.label}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de gráfico:
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="percentile">Percentiles</option>
              <option value="absolute">Valores Absolutos</option>
              <option value="relative">Fuerza Relativa</option>
            </select>
          </div>

          {/* Segment Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Comparar con:
            </label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="global_all">Global (Todos)</option>
              <option value="age_group">Mi Grupo de Edad</option>
              <option value="weight_class">Mi Categoría de Peso</option>
              <option value="experience_level">Mi Nivel de Experiencia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-96 mb-6">
          {chartType === 'absolute' ? (
            <Line data={getCurrentChartData()} options={chartOptions} />
          ) : (
            <Bar data={getCurrentChartData()} options={chartOptions} />
          )}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Performance */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              📈 Rendimiento General
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Percentil promedio:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round(comparisonData.reduce((sum, d) => sum + d.userPercentile, 0) / comparisonData.length)}º
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mejor ejercicio:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {comparisonData.reduce((best, current) => 
                    current.userPercentile > best.userPercentile ? current : best
                  ).exercise}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Área de mejora:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {comparisonData.reduce((worst, current) => 
                    current.userPercentile < worst.userPercentile ? current : worst
                  ).exercise}
                </span>
              </div>
            </div>
          </div>

          {/* Strength Level Distribution */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              🏆 Distribución de Niveles
            </h4>
            <div className="space-y-2">
              {Object.entries(strengthSummary.distribution).map(([level, count]) => {
                const levelInfo = {
                  'untrained': { label: 'Sin Entrenar', icon: '🌱' },
                  'novice': { label: 'Principiante', icon: '🥉' },
                  'intermediate': { label: 'Intermedio', icon: '🥈' },
                  'advanced': { label: 'Avanzado', icon: '🥇' },
                  'elite': { label: 'Elite', icon: '👑' }
                }[level as keyof typeof strengthSummary.distribution] || { label: level, icon: '📊' };

                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{levelInfo.icon}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {levelInfo.label}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              💡 Recomendaciones
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {strengthSummary.dominantLevel === 'untrained' && (
                <div>• Enfócate en la técnica básica</div>
              )}
              {strengthSummary.dominantLevel === 'novice' && (
                <div>• Mantén progresión lineal</div>
              )}
              {strengthSummary.dominantLevel === 'intermediate' && (
                <div>• Considera periodización</div>
              )}
              {strengthSummary.dominantLevel === 'advanced' && (
                <div>• Especialízate en debilidades</div>
              )}
              {strengthSummary.dominantLevel === 'elite' && (
                <div>• Mantén y perfecciona</div>
              )}
              <div>• Trabaja ejercicios con menor percentil</div>
              <div>• Mantén consistencia en entrenamientos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrengthComparison;