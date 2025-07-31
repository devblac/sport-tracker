/**
 * GlobalRankings Component
 * Displays global rankings for exercises with filtering and search capabilities
 */

import React, { useState, useEffect } from 'react';
import { GlobalRanking, UserDemographics } from '../../types/percentiles';
import { PercentileCalculator } from '../../services/percentileCalculator';

interface GlobalRankingsProps {
  exerciseId: string;
  exerciseName: string;
  metricType: 'max_weight' | 'max_reps' | 'max_volume' | 'best_time' | 'best_distance';
  currentUserId?: string;
  showFilters?: boolean;
  limit?: number;
  className?: string;
}

export const GlobalRankings: React.FC<GlobalRankingsProps> = ({
  exerciseId,
  exerciseName,
  metricType,
  currentUserId,
  showFilters = true,
  limit = 100,
  className = ''
}) => {
  const [rankings, setRankings] = useState<GlobalRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    gender: 'all',
    ageMin: 0,
    ageMax: 99,
    weightMin: 0,
    weightMax: 200,
    verified: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'absolute' | 'relative'>('absolute');

  useEffect(() => {
    loadGlobalRankings();
  }, [exerciseId, metricType, limit]);

  const loadGlobalRankings = async () => {
    setLoading(true);
    try {
      const result = await PercentileCalculator.getGlobalRankings(exerciseId, metricType, limit);
      setRankings(result);
    } catch (error) {
      console.error('Error loading global rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 2: return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
      case 3: return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return '♂️';
      case 'female': return '♀️';
      default: return '⚧️';
    }
  };

  const formatValue = (value: number, unit?: string) => {
    if (metricType === 'best_time') {
      // Convert seconds to mm:ss format
      const minutes = Math.floor(value / 60);
      const seconds = Math.round(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${value.toFixed(1)}${unit ? ` ${unit}` : ''}`;
  };

  const getUnit = () => {
    switch (metricType) {
      case 'max_weight': return 'kg';
      case 'max_reps': return 'reps';
      case 'max_volume': return 'kg';
      case 'best_time': return '';
      case 'best_distance': return 'm';
      default: return '';
    }
  };

  // Apply filters
  const filteredRankings = rankings?.rankings.filter(ranking => {
    // Gender filter
    if (filters.gender !== 'all' && ranking.demographics.gender !== filters.gender) {
      return false;
    }

    // Age filter
    if (ranking.demographics.age < filters.ageMin || ranking.demographics.age > filters.ageMax) {
      return false;
    }

    // Weight filter
    if (ranking.demographics.weight < filters.weightMin || ranking.demographics.weight > filters.weightMax) {
      return false;
    }

    // Verified filter
    if (filters.verified && !ranking.verified) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!ranking.username.toLowerCase().includes(searchLower) && 
          !ranking.display_name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  }) || [];

  // Sort by appropriate metric
  const sortedRankings = [...filteredRankings].sort((a, b) => {
    if (viewMode === 'relative' && a.relative_strength && b.relative_strength) {
      return b.relative_strength - a.relative_strength;
    }
    
    // For time-based metrics, lower is better
    if (metricType === 'best_time') {
      return a.value - b.value;
    }
    
    return b.value - a.value;
  });

  // Re-rank after filtering and sorting
  const rerankedResults = sortedRankings.map((ranking, index) => ({
    ...ranking,
    rank: index + 1
  }));

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!rankings) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center ${className}`}>
        <div className="text-red-500 text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error al cargar rankings
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No se pudieron cargar los rankings globales
        </p>
        <button
          onClick={loadGlobalRankings}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🏆 Rankings Globales - {exerciseName}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {rankings.total_participants.toLocaleString()} participantes
          </div>
        </div>

        {/* Controls */}
        {showFilters && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>

            {/* View Mode and Filters */}
            <div className="flex flex-wrap gap-3">
              {/* View Mode */}
              {['squat', 'bench_press', 'deadlift'].includes(exerciseId) && (
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('absolute')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'absolute'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    💪 Absoluto
                  </button>
                  <button
                    onClick={() => setViewMode('relative')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'relative'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    ⚖️ Relativo
                  </button>
                </div>
              )}

              {/* Gender Filter */}
              <select
                value={filters.gender}
                onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">👥 Todos</option>
                <option value="male">♂️ Hombres</option>
                <option value="female">♀️ Mujeres</option>
              </select>

              {/* Verified Filter */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">✅ Solo verificados</span>
              </label>
            </div>

            {/* Age and Weight Ranges */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Edad: {filters.ageMin} - {filters.ageMax}
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="18"
                    max="80"
                    value={filters.ageMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMin: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="18"
                    max="80"
                    value={filters.ageMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, ageMax: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso: {filters.weightMin} - {filters.weightMax} kg
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={filters.weightMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, weightMin: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={filters.weightMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, weightMax: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rankings List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {rerankedResults.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">🔍</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron resultados
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Intenta ajustar los filtros para ver más resultados
            </p>
          </div>
        ) : (
          rerankedResults.map((ranking) => {
            const isCurrentUser = ranking.user_id === currentUserId;
            const displayValue = viewMode === 'relative' && ranking.relative_strength 
              ? ranking.relative_strength 
              : ranking.value;
            const displayUnit = viewMode === 'relative' && ranking.relative_strength 
              ? 'x BW' 
              : getUnit();

            return (
              <div 
                key={ranking.user_id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`text-lg font-bold min-w-[3rem] text-center ${getRankColor(ranking.rank)}`}>
                    {typeof getRankIcon(ranking.rank) === 'string' && getRankIcon(ranking.rank).startsWith('#') ? (
                      <span className="text-gray-600 dark:text-gray-400">{getRankIcon(ranking.rank)}</span>
                    ) : (
                      <span className="text-2xl">{getRankIcon(ranking.rank)}</span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`font-medium truncate ${
                        isCurrentUser ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {ranking.display_name}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Tú)</span>
                        )}
                      </div>
                      {ranking.verified && (
                        <span className="text-blue-500" title="Verificado">✅</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      @{ranking.username}
                    </div>
                  </div>

                  {/* Demographics */}
                  <div className="text-center min-w-[4rem]">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {getGenderIcon(ranking.demographics.gender)} {ranking.demographics.age}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {ranking.demographics.weight.toFixed(0)}kg
                    </div>
                  </div>

                  {/* Performance Value */}
                  <div className="text-right min-w-[5rem]">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatValue(displayValue, displayUnit)}
                    </div>
                    {viewMode === 'absolute' && ranking.relative_strength && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {ranking.relative_strength.toFixed(1)}x BW
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 min-w-[4rem] text-right">
                    {ranking.recorded_at.toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Mostrando {rerankedResults.length} de {filteredRankings.length} resultados
          </span>
          <div className="flex items-center gap-4">
            <span>
              Actualizado: {rankings.last_updated.toLocaleDateString()}
            </span>
            <button
              onClick={loadGlobalRankings}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};