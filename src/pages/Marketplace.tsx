// ============================================================================
// MARKETPLACE PAGE
// ============================================================================
// Main marketplace page for trainers and premium content
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Clock, DollarSign, Users, Award, Play, Crown, ShoppingBag } from 'lucide-react';
import useMarketplaceStore from '@/stores/useMarketplaceStore';
import type { TrainerSearchFilters, ContentSearchFilters, TrainerProfile, PremiumContent } from '@/types/marketplace';
import { useAuthStore } from '@/stores/useAuthStore';
import { PremiumAccessGate, PremiumBadge } from '@/components/marketplace/PremiumAccessGate';

const Marketplace: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'trainers' | 'content'>('trainers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const {
    trainers,
    premiumContent,
    searchTrainers,
    searchContent,
    isLoading,
    error
  } = useMarketplaceStore();

  const hasPremiumAccess = user?.role === 'premium' || user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    // Load initial data
    if (activeTab === 'trainers') {
      searchTrainers({});
    } else {
      searchContent({});
    }
  }, [activeTab, searchTrainers, searchContent]);

  const handleSearch = () => {
    if (activeTab === 'trainers') {
      const filters: TrainerSearchFilters = {
        // Add search query logic here
      };
      searchTrainers(filters);
    } else {
      const filters: ContentSearchFilters = {
        // Add search query logic here
      };
      searchContent(filters);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const TrainerCard: React.FC<{ trainer: TrainerProfile }> = ({ trainer }) => (
    <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        <img
          src={trainer.profileImage || '/default-avatar.png'}
          alt={trainer.displayName}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {trainer.displayName}
            </h3>
            <div className="flex items-center space-x-2">
              {trainer.isVerified && (
                <Award className="w-5 h-5 text-blue-500" />
              )}
              <PremiumBadge size="sm" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-muted-foreground ml-1">
                {trainer.rating} ({trainer.totalReviews} reviews)
              </span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {trainer.experience} years exp
            </span>
          </div>
          
          <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
            {trainer.bio}
          </p>
          
          <div className="flex flex-wrap gap-1 mt-3">
            {trainer.specialties.slice(0, 3).map((specialty: string) => (
              <span
                key={specialty}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full"
              >
                {specialty}
              </span>
            ))}
            {trainer.specialties.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{trainer.specialties.length - 3} more
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                {formatPrice(trainer.hourlyRate, trainer.currency)}/hr
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {trainer.totalClients} clients
              </div>
            </div>
            
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ContentCard: React.FC<{ content: PremiumContent }> = ({ content }) => (
    <div className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={content.previewImages[0] || '/default-content.png'}
          alt={content.title}
          className="w-full h-48 object-cover"
        />
        {content.type === 'video_course' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-3">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
            {content.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {content.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {content.description}
        </p>
        
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
              {content.rating} ({content.totalReviews})
            </span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
            {content.difficulty}
          </span>
          {content.duration && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4 mr-1" />
                {content.type === 'workout_plan' ? `${content.duration} weeks` : `${content.duration} min`}
              </div>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {content.tags.slice(0, 2).map((tag: string) => (
            <span
              key={tag}
              className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {formatPrice(content.price, content.currency)}
          </div>
          
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  // Check if user has access to marketplace
  if (user?.role === 'guest') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="p-4 bg-muted rounded-full w-fit mx-auto">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Marketplace Access Required
            </h2>
            <p className="text-muted-foreground">
              Create an account to access premium trainers and content in our marketplace.
            </p>
          </div>
          
          <button
            onClick={() => {
              // Navigate to auth page
              window.location.href = '/auth';
            }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Marketplace
                </h1>
                <p className="text-muted-foreground">
                  Premium trainers and exclusive content
                </p>
              </div>
            </div>
            
            {!hasPremiumAccess && (
              <div className="flex items-center space-x-3">
                <PremiumBadge size="lg" />
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 font-medium"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('trainers')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trainers'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Personal Trainers
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'content'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Premium Content
            </button>
          </div>
          
          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow-md p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Premium Access Notice */}
            {!hasPremiumAccess && (
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-500 rounded-full">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                      Unlock Premium Marketplace
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Get access to certified trainers, exclusive workout programs, and personalized coaching.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPremiumModal(true)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'trainers' ? (
                trainers.length > 0 ? (
                  trainers.map((trainer) => (
                    <PremiumAccessGate
                      key={trainer.id}
                      feature="Premium Trainers"
                      description="Connect with certified personal trainers"
                      showUpgradeModal={false}
                      onUpgrade={() => setShowPremiumModal(true)}
                    >
                      <TrainerCard trainer={trainer} />
                    </PremiumAccessGate>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No trainers found
                    </h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or filters.
                    </p>
                  </div>
                )
              ) : (
                premiumContent.length > 0 ? (
                  premiumContent.map((content) => (
                    <PremiumAccessGate
                      key={content.id}
                      feature="Premium Content"
                      description="Access exclusive workout programs and courses"
                      showUpgradeModal={false}
                      onUpgrade={() => setShowPremiumModal(true)}
                    >
                      <ContentCard content={content} />
                    </PremiumAccessGate>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No content found
                    </h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or filters.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <PremiumAccessGate
          feature="Marketplace"
          description="Access premium trainers and exclusive content"
          showUpgradeModal={true}
          onUpgrade={() => setShowPremiumModal(false)}
        >
          <div />
        </PremiumAccessGate>
      )}
    </div>
  );
};

export default Marketplace;