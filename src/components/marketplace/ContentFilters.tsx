// Content Filters - Advanced filtering component
import React from 'react';
import { Star, DollarSign } from 'lucide-react';
import { CONTENT_CATEGORIES, DIFFICULTY_LEVELS } from '../../types/marketplace';

interface FilterState {
  category: string;
  difficulty: string;
  priceRange: [number, number];
  rating: number;
  searchQuery: string;
  sortBy: 'popularity' | 'rating' | 'price_low' | 'price_high' | 'newest';
}

interface ContentFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  className?: string;
}

export const ContentFilters: React.FC<ContentFiltersProps> = ({
  filters,
  onFilterChange,
  className = ''
}) => {
  const handlePriceRangeChange = (index: number, value: string) => {
    const newRange = [...filters.priceRange] as [number, number];
    newRange[index] = parseInt(value) * 100; // Convert to cents
    onFilterChange({ priceRange: newRange });
  };

  const resetFilters = () => {
    onFilterChange({
      category: 'all',
      difficulty: 'all',
      priceRange: [0, 50000],
      rating: 0
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value="all"
                checked={filters.category === 'all'}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="mr-2"
              />
              <span className="text-sm">All Categories</span>
            </label>
            {Object.entries(CONTENT_CATEGORIES).map(([key, category]) => (
              <label key={key} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  value={key}
                  checked={filters.category === key}
                  onChange={(e) => onFilterChange({ category: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="difficulty"
                value="all"
                checked={filters.difficulty === 'all'}
                onChange={(e) => onFilterChange({ difficulty: e.target.value })}
                className="mr-2"
              />
              <span className="text-sm">All Levels</span>
            </label>
            {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
              <label key={key} className="flex items-center">
                <input
                  type="radio"
                  name="difficulty"
                  value={key}
                  checked={filters.difficulty === key}
                  onChange={(e) => onFilterChange({ difficulty: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: level.color }}
                  />
                  {level.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Price Range
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="500"
                value={Math.floor(filters.priceRange[0] / 100)}
                onChange={(e) => handlePriceRangeChange(0, e.target.value)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Min"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min="0"
                max="500"
                value={Math.floor(filters.priceRange[1] / 100)}
                onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Max"
              />
            </div>
            
            {/* Price Range Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="500"
                value={Math.floor(filters.priceRange[1] / 100)}
                onChange={(e) => handlePriceRangeChange(1, e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>$500+</span>
              </div>
            </div>

            {/* Quick Price Filters */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Free', range: [0, 0] },
                { label: 'Under $20', range: [0, 2000] },
                { label: '$20-$50', range: [2000, 5000] },
                { label: '$50+', range: [5000, 50000] }
              ].map(({ label, range }) => (
                <button
                  key={label}
                  onClick={() => onFilterChange({ priceRange: range as [number, number] })}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    filters.priceRange[0] === range[0] && filters.priceRange[1] === range[1]
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Star className="w-4 h-4 inline mr-1" />
            Minimum Rating
          </label>
          <div className="space-y-2">
            {[0, 3, 4, 4.5].map(rating => (
              <label key={rating} className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={filters.rating === rating}
                  onChange={(e) => onFilterChange({ rating: parseFloat(e.target.value) })}
                  className="mr-2"
                />
                <div className="flex items-center gap-1">
                  {rating === 0 ? (
                    <span className="text-sm">Any Rating</span>
                  ) : (
                    <>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm">& up</span>
                    </>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Active filters: {[
            filters.category !== 'all' && 'Category',
            filters.difficulty !== 'all' && 'Difficulty',
            (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) && 'Price',
            filters.rating > 0 && 'Rating'
          ].filter(Boolean).join(', ') || 'None'}
        </div>
        
        <button
          onClick={resetFilters}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};