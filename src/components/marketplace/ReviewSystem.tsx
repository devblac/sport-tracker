// ============================================================================
// REVIEW SYSTEM
// ============================================================================
// Comprehensive review and rating system for trainers and content
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, User, Calendar, CheckCircle } from 'lucide-react';
import useMarketplaceStore from '@/stores/useMarketplaceStore';
import type { TrainerReview } from '@/types/marketplace';

interface ReviewSystemProps {
  itemId: string;
  itemType: 'trainer' | 'content';
  canReview?: boolean;
  showWriteReview?: boolean;
  className?: string;
}

interface ReviewFormData {
  rating: number;
  review: string;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({
  itemId,
  itemType,
  canReview = false,
  showWriteReview = false,
  className = ''
}) => {
  const [reviews, setReviews] = useState<TrainerReview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    review: '',
    pros: [''],
    cons: [''],
    wouldRecommend: true
  });

  const { leaveReview } = useMarketplaceStore();

  useEffect(() => {
    loadReviews();
  }, [itemId, itemType]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // Mock reviews for demo - in real app would fetch from API
      const mockReviews: TrainerReview[] = [
        {
          id: 'review_1',
          trainerId: itemType === 'trainer' ? itemId : 'trainer_1',
          userId: 'user_1',
          type: itemType === 'trainer' ? 'session' : 'content',
          itemId,
          rating: 5,
          review: 'Excellent program! Really helped me build strength and confidence in the gym. The progression was perfect and the instructions were clear.',
          pros: ['Clear instructions', 'Great progression', 'Excellent support'],
          cons: ['Could use more video content'],
          wouldRecommend: true,
          isVerified: true,
          createdAt: new Date('2024-01-15'),
          trainerResponse: {
            message: 'Thank you for the feedback! I\'m glad the program worked well for you.',
            respondedAt: new Date('2024-01-16')
          }
        },
        {
          id: 'review_2',
          trainerId: itemType === 'trainer' ? itemId : 'trainer_1',
          userId: 'user_2',
          type: itemType === 'trainer' ? 'session' : 'content',
          itemId,
          rating: 4,
          review: 'Good program overall. Saw decent results but felt it could be more challenging towards the end.',
          pros: ['Good structure', 'Reasonable price'],
          cons: ['Could be more challenging', 'Limited exercise variety'],
          wouldRecommend: true,
          isVerified: true,
          createdAt: new Date('2024-01-10')
        },
        {
          id: 'review_3',
          trainerId: itemType === 'trainer' ? itemId : 'trainer_1',
          userId: 'user_3',
          type: itemType === 'trainer' ? 'session' : 'content',
          itemId,
          rating: 5,
          review: 'Amazing experience! The trainer was knowledgeable, patient, and really helped me improve my form.',
          pros: ['Expert knowledge', 'Patient teaching', 'Great form corrections'],
          cons: [],
          wouldRecommend: true,
          isVerified: true,
          createdAt: new Date('2024-01-05')
        }
      ];
      
      setReviews(mockReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  const handleSubmitReview = async () => {
    if (formData.rating === 0 || !formData.review.trim()) {
      alert('Please provide a rating and review');
      return;
    }

    setSubmitting(true);
    try {
      await leaveReview({
        trainerId: itemType === 'trainer' ? itemId : 'trainer_1',
        userId: 'current_user',
        type: itemType === 'trainer' ? 'session' : 'content',
        itemId,
        rating: formData.rating,
        review: formData.review,
        pros: formData.pros.filter(p => p.trim()),
        cons: formData.cons.filter(c => c.trim()),
        wouldRecommend: formData.wouldRecommend,
        isVerified: true
      });

      // Reset form and reload reviews
      setFormData({
        rating: 0,
        review: '',
        pros: [''],
        cons: [''],
        wouldRecommend: true
      });
      setShowForm(false);
      await loadReviews();
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addProCon = (type: 'pros' | 'cons') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const updateProCon = (type: 'pros' | 'cons', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  const removeProCon = (type: 'pros' | 'cons', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg'; interactive?: boolean; onChange?: (rating: number) => void }> = ({ 
    rating, 
    size = 'md', 
    interactive = false, 
    onChange 
  }) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={`${sizeClasses[size]} ${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            }`}
          >
            <Star
              className={`w-full h-full ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const ReviewCard: React.FC<{ review: TrainerReview }> = ({ review }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">
                User {review.userId.slice(-4)}
              </span>
              {review.isVerified && (
                <CheckCircle className="w-4 h-4 text-green-500" title="Verified Purchase" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <StarRating rating={review.rating} size="sm" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {review.rating}/5
          </span>
        </div>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {review.review}
      </p>

      {/* Pros and Cons */}
      {(review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {review.pros && review.pros.length > 0 && (
            <div>
              <h5 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                <ThumbsUp className="w-4 h-4 mr-1" />
                Pros
              </h5>
              <ul className="space-y-1">
                {review.pros.map((pro, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                    <span className="text-green-500 mr-2">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {review.cons && review.cons.length > 0 && (
            <div>
              <h5 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center">
                <ThumbsDown className="w-4 h-4 mr-1" />
                Cons
              </h5>
              <ul className="space-y-1">
                {review.cons.map((con, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                    <span className="text-red-500 mr-2">-</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {review.wouldRecommend ? (
            <>
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Recommends this {itemType}
              </span>
            </>
          ) : (
            <>
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">
                Doesn't recommend this {itemType}
              </span>
            </>
          )}
        </div>
        
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* Trainer Response */}
      {review.trainerResponse && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-blue-900 dark:text-blue-300">Trainer Response</span>
            <span className="text-sm text-blue-700 dark:text-blue-400">
              {new Date(review.trainerResponse.respondedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-blue-800 dark:text-blue-200">
            {review.trainerResponse.message}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={Math.round(averageRating)} size="lg" />
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">
                  {rating}★
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        {canReview && showWriteReview && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowForm(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </button>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Write Your Review
          </h3>

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Overall Rating *
              </label>
              <StarRating
                rating={formData.rating}
                size="lg"
                interactive
                onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
              />
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Review *
              </label>
              <textarea
                value={formData.review}
                onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
                placeholder="Share your experience..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Pros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What did you like?
              </label>
              {formData.pros.map((pro, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={pro}
                    onChange={(e) => updateProCon('pros', index, e.target.value)}
                    placeholder="Something positive..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.pros.length > 1 && (
                    <button
                      onClick={() => removeProCon('pros', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addProCon('pros')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add another positive
              </button>
            </div>

            {/* Cons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What could be improved?
              </label>
              {formData.cons.map((con, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={con}
                    onChange={(e) => updateProCon('cons', index, e.target.value)}
                    placeholder="Something to improve..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.cons.length > 1 && (
                    <button
                      onClick={() => removeProCon('cons', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addProCon('cons')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add another improvement
              </button>
            </div>

            {/* Recommendation */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.wouldRecommend}
                  onChange={(e) => setFormData(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I would recommend this {itemType} to others
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting || formData.rating === 0 || !formData.review.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {/* Sort Controls */}
        {reviews.length > 0 && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reviews ({reviews.length})
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        )}

        {/* Reviews */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Be the first to share your experience!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSystem;