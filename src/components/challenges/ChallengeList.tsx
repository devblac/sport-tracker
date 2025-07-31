// ChallengeList Component - Display and filter multiple challenges
// Implements requirement 12.2 - Challenge browsing and filtering

import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeFilters, ChallengeParticipant } from '../../types/challenges';
import { 
  CHALLENGE_CATEGORIES_INFO, 
  DIFFICULTY_INFO,
  CHALLENGE_CATEGORIES,
  CHALLENGE_TYPES 
} from '../../constants/challenges';
import ChallengeCard from './ChallengeCard';

interface ChallengeListProps {
  challenges: Challenge[];
  userParticipants?: Map<string, ChallengeParticipant>;
  onJoinChallenge?: (challengeId: string) => void;
  onViewChallenge?: (challengeId: string) => void;
  onFiltersChange?: (filters: ChallengeFilters) => void;
  isLoading?: boolean;
  className?: string;
  showFilters?: boolean;
  emptyStateMessage?: string;
}

export const ChallengeList: React.FC<ChallengeListProps> = ({
  challenges,
  userParticipants = new Map(),
  onJoinChallenge,
  onViewChallenge,
  onFiltersChange,
  isLoading = false,
  className = '',
  showFilters = true,
  emptyStateMessage = "No challenges found"
}) => {
  const [filters, setFilters] = useState<ChallengeFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'start_date' | 'participants_count' | 'difficulty_level'>('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>(challenges);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...challenges];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(challenge =>
        challenge.name.toLowerCase().includes(query) ||
        challenge.description.toLowerCase().includes(query) ||
        challenge.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(c => c.type === filters.type);
    }
    if (filters.category) {
      filtered = filtered.filter(c => c.category === filters.category);
    }
    if (filters.difficulty_level) {
      filtered = filtered.filter(c => c.difficulty_level === filters.difficulty_level);
    }
    if (filters.is_active !== undefined) {
      filtered = filtered.filter(c => c.is_active === filters.is_active);
    }
    if (filters.has_spots_available) {
      filtered = filtered.filter(c => 
        !c.max_participants || c.participants_count < c.max_participants
      );
    }
    if (filters.created_by_friends) {
      // In a real app, this would check if created_by is in user's friends list
      // For now, we'll just show all challenges
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(c =>
        filters.tags!.some(tag => c.tags.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = a.created_at.getTime();
          bValue = b.created_at.getTime();
          break;
        case 'start_date':
          aValue = a.start_date.getTime();
          bValue = b.start_date.getTime();
          break;
        case 'participants_count':
          aValue = a.participants_count;
          bValue = b.participants_count;
          break;
        case 'difficulty_level':
          aValue = a.difficulty_level;
          bValue = b.difficulty_level;
          break;
        default:
          return 0;
      }

      const order = sortOrder === 'desc' ? -1 : 1;
      return aValue < bValue ? -order : aValue > bValue ? order : 0;
    });

    setFilteredChallenges(filtered);
  }, [challenges, searchQuery, filters, sortBy, sortOrder]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof ChallengeFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSortBy('start_date');
    setSortOrder('asc');
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length +
           (searchQuery.trim() ? 1 : 0);
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showFilters && <FiltersSkeleton />}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <ChallengeSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters and Search */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                {CHALLENGE_TYPES.map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {CHALLENGE_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {CHALLENGE_CATEGORIES_INFO[category].icon} {CHALLENGE_CATEGORIES_INFO[category].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={filters.difficulty_level || ''}
                onChange={(e) => handleFilterChange('difficulty_level', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Difficulties</option>
                {[1, 2, 3, 4, 5].map(level => (
                  <option key={level} value={level}>
                    {DIFFICULTY_INFO[level as keyof typeof DIFFICULTY_INFO].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="start_date">Start Date</option>
                <option value="created_at">Created Date</option>
                <option value="participants_count">Participants</option>
                <option value="difficulty_level">Difficulty</option>
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.is_active ?? true}
                onChange={(e) => handleFilterChange('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active only</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.has_spots_available ?? false}
                onChange={(e) => handleFilterChange('has_spots_available', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Has spots available</span>
            </label>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>

          {/* Active Filters and Clear */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {searchQuery ? `Search Results (${filteredChallenges.length})` : `Challenges (${filteredChallenges.length})`}
        </h2>
        {filteredChallenges.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredChallenges.length} of {challenges.length} challenges
          </div>
        )}
      </div>

      {/* Challenge Grid */}
      {filteredChallenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              userParticipant={userParticipants.get(challenge.id)}
              onJoin={onJoinChallenge}
              onView={onViewChallenge}
            />
          ))}
        </div>
      ) : (
        <EmptyState message={emptyStateMessage} onClearFilters={getActiveFiltersCount() > 0 ? clearFilters : undefined} />
      )}
    </div>
  );
};

// Empty state component
const EmptyState: React.FC<{ message: string; onClearFilters?: () => void }> = ({ 
  message, 
  onClearFilters 
}) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🏆</div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      {message}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      {onClearFilters 
        ? "Try adjusting your filters to see more challenges."
        : "Check back later for new challenges to join!"
      }
    </p>
    {onClearFilters && (
      <button
        onClick={onClearFilters}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        Clear Filters
      </button>
    )}
  </div>
);

// Loading skeletons
const FiltersSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
);

const ChallengeSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
);

export default ChallengeList;