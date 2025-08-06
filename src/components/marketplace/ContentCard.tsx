// Content Card - Individual content item display
import React from 'react';
import { Star, Clock, Users, Play, CheckCircle, Crown } from 'lucide-react';
import { PremiumContent, CONTENT_CATEGORIES, DIFFICULTY_LEVELS } from '../../types/marketplace';
import { paymentService } from '../../services/paymentService';

interface ContentCardProps {
  content: PremiumContent;
  isPurchased?: boolean;
  onSelect?: () => void;
  onPurchase?: () => void;
  className?: string;
  showTrainer?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  isPurchased = false,
  onSelect,
  onPurchase,
  className = '',
  showTrainer = true
}) => {
  const category = CONTENT_CATEGORIES[content.category as keyof typeof CONTENT_CATEGORIES];
  const difficulty = DIFFICULTY_LEVELS[content.difficulty_level as keyof typeof DIFFICULTY_LEVELS];
  
  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  const handlePurchaseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPurchase) {
      onPurchase();
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
      onClick={handleCardClick}
    >
      {/* Preview Image */}
      <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
        {content.preview_image ? (
          <img
            src={content.preview_image}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-4xl" style={{ color: category?.color }}>
              {category?.icon || '💪'}
            </div>
          </div>
        )}
        
        {/* Overlay Elements */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          {content.preview_video_url && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white bg-opacity-90 rounded-full p-3">
                <Play className="w-6 h-6 text-gray-800" />
              </div>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {content.is_featured && (
            <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Featured
            </div>
          )}
          
          {isPurchased && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Owned
            </div>
          )}
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <div 
            className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: category?.color }}
          >
            {category?.name}
          </div>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4">
        {/* Title and Rating */}
        <div className="mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1">
            {content.title}
          </h3>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {content.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({content.review_count})
              </span>
            </div>
            
            <div 
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ 
                backgroundColor: `${difficulty?.color}20`,
                color: difficulty?.color 
              }}
            >
              {difficulty?.name}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {content.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          {content.duration_weeks && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {content.duration_weeks} weeks
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {content.purchase_count.toLocaleString()} students
          </div>
        </div>

        {/* Trainer Info */}
        {showTrainer && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              {content.trainer_avatar ? (
                <img
                  src={content.trainer_avatar}
                  alt={content.trainer_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs">👨‍🏫</span>
              )}
            </div>
            <span className="text-sm text-gray-600">
              by {content.trainer_name}
            </span>
          </div>
        )}

        {/* Tags */}
        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {content.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {content.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{content.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900">
            {paymentService.formatPrice(content.price, content.currency)}
          </div>
          
          {isPurchased ? (
            <button
              onClick={handleCardClick}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Access
            </button>
          ) : (
            <button
              onClick={handlePurchaseClick}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Purchase
            </button>
          )}
        </div>
      </div>
    </div>
  );
};