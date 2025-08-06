// Content Marketplace - Main marketplace browsing component
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Star, Clock, Users, Tag } from 'lucide-react';
import { PremiumContent, CONTENT_CATEGORIES, DIFFICULTY_LEVELS } from '../../types/marketplace';
import { premiumContentService } from '../../services/premiumContentService';
import { paymentService } from '../../services/paymentService';
import { ContentCard } from './ContentCard';
import { ContentFilters } from './ContentFilters';
import { LoadingScreen } from '../ui/LoadingScreen';

interface ContentMarketplaceProps {
  onContentSelect?: (content: PremiumContent) => void;
  onPurchase?: (contentId: string) => void;
  userId?: string;
  className?: string;
}

interface FilterState {
  category: string;
  difficulty: string;
  priceRange: [number, number];
  rating: number;
  searchQuery: string;
  sortBy: 'popularity' | 'rating' | 'price_low' | 'price_high' | 'newest';
}

export const ContentMarketplace: React.FC<ContentMarketplaceProps> = ({
  onContentSelect,
  onPurchase,
  userId = 'guest',
  className = ''
}) => {
  const [content, setContent] = useState<PremiumContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasedContent, setPurchasedContent] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    difficulty: 'all',
    priceRange: [0, 50000], // $0 - $500
    rating: 0,
    searchQuery: '',
    sortBy: 'popularity'
  });

  // Load content and user purchases
  useEffect(() => {
    loadMarketplaceData();
  }, [userId]);

  const loadMarketplaceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [contentData, userPurchases] = await Promise.all([
        premiumContentService.getPremiumContentCatalog(),
        userId !== 'guest' ? premiumContentService.getUserPurchasedContent(userId) : Promise.resolve([])
      ]);
      
      setContent(contentData.filter(c => c.is_active));
      setPurchasedContent(new Set(userPurchases.map(p => p.content_id)));
    } catch (err) {
      setError('Failed to load marketplace content');
      console.error('Marketplace loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort content
  const filteredContent = useMemo(() => {
    let filtered = content.filter(item => {
      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      
      // Difficulty filter
      if (filters.difficulty !== 'all' && item.difficulty_level !== filters.difficulty) {
        return false;
      }
      
      // Price range filter
      if (item.price < filters.priceRange[0] || item.price > filters.priceRange[1]) {
        return false;
      }
      
      // Rating filter
      if (item.rating < filters.rating) {
        return false;
      }
      
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDescription = item.description.toLowerCase().includes(query);
        const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(query));
        const matchesTrainer = item.trainer_name.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesDescription && !matchesTags && !matchesTrainer) {
          return false;
        }
      }
      
      return true;
    });

    // Sort content
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'popularity':
          return b.purchase_count - a.purchase_count;
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [content, filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePurchase = async (contentId: string) => {
    if (onPurchase) {
      onPurchase(contentId);
    } else {
      // Default purchase handling
      try {
        const validation = await paymentService.validatePayment(contentId, userId);
        if (!validation.valid) {
          alert(`Cannot purchase: ${validation.error}`);
          return;
        }

        const pricing = await paymentService.getContentPricing(contentId, userId);
        const formattedPrice = paymentService.formatPrice(pricing.finalPrice, pricing.currency);
        
        if (confirm(`Purchase this content for ${formattedPrice}?`)) {
          // In a real app, this would integrate with the payment flow
          console.log('Initiating purchase for content:', contentId);
        }
      } catch (error) {
        console.error('Purchase error:', error);
        alert('Purchase failed. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <LoadingScreen 
        title="Loading Marketplace"
        subtitle="Finding the best content for you..."
        progress={75}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Marketplace</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadMarketplaceData}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Premium Content Marketplace</h1>
        <p className="text-gray-600">
          Discover expert-created workout programs, guides, and training content
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search programs, trainers, or topics..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange({ category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(CONTENT_CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <ContentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            className="mt-4 pt-4 border-t border-gray-200"
          />
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-gray-600">
          {filteredContent.length} {filteredContent.length === 1 ? 'program' : 'programs'} found
          {filters.searchQuery && (
            <span> for "{filters.searchQuery}"</span>
          )}
        </div>
        
        {/* Featured Badge */}
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-gray-600">
            {content.filter(c => c.is_featured).length} featured programs
          </span>
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search terms
          </p>
          <button
            onClick={() => setFilters({
              category: 'all',
              difficulty: 'all',
              priceRange: [0, 50000],
              rating: 0,
              searchQuery: '',
              sortBy: 'popularity'
            })}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map(item => (
            <ContentCard
              key={item.id}
              content={item}
              isPurchased={purchasedContent.has(item.id)}
              onSelect={() => onContentSelect?.(item)}
              onPurchase={() => handlePurchase(item.id)}
              className="h-full"
            />
          ))}
        </div>
      )}

      {/* Load More Button (for pagination in the future) */}
      {filteredContent.length > 0 && filteredContent.length % 12 === 0 && (
        <div className="text-center mt-8">
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Load More Content
          </button>
        </div>
      )}
    </div>
  );
};