// Trainer Profile - Detailed trainer information and content
import React, { useState, useEffect } from 'react';
import { Star, Award, Users, BookOpen, ExternalLink, Instagram, Globe, Calendar, CheckCircle } from 'lucide-react';
import { TrainerProfile as TrainerProfileType, PremiumContent } from '../../types/marketplace';
import { premiumContentService } from '../../services/premiumContentService';
import { ContentCard } from './ContentCard';
import { LoadingScreen } from '../ui/LoadingScreen';

interface TrainerProfileProps {
  trainerId: string;
  onContentSelect?: (content: PremiumContent) => void;
  onPurchase?: (contentId: string) => void;
  onFollow?: (trainerId: string) => void;
  isFollowing?: boolean;
  className?: string;
}

export const TrainerProfile: React.FC<TrainerProfileProps> = ({
  trainerId,
  onContentSelect,
  onPurchase,
  onFollow,
  isFollowing = false,
  className = ''
}) => {
  const [trainer, setTrainer] = useState<TrainerProfileType | null>(null);
  const [trainerContent, setTrainerContent] = useState<PremiumContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'content' | 'reviews'>('about');

  useEffect(() => {
    loadTrainerData();
  }, [trainerId]);

  const loadTrainerData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [trainerData, contentData] = await Promise.all([
        premiumContentService.getTrainerProfile(trainerId),
        premiumContentService.getContentByTrainer(trainerId)
      ]);

      if (!trainerData) {
        throw new Error('Trainer not found');
      }

      setTrainer(trainerData);
      setTrainerContent(contentData.filter(c => c.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trainer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    if (onFollow) {
      onFollow(trainerId);
    }
  };

  if (loading) {
    return (
      <LoadingScreen 
        title="Loading Trainer Profile"
        subtitle="Getting trainer information..."
        progress={60}
      />
    );
  }

  if (error || !trainer) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Trainer Not Found</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadTrainerData}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden mb-4">
              {trainer.avatar_url ? (
                <img
                  src={trainer.avatar_url}
                  alt={trainer.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  👨‍🏫
                </div>
              )}
            </div>
            
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Trainer Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {trainer.display_name}
              </h1>
              {trainer.is_verified && (
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </div>
              )}
              {trainer.is_featured && (
                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
                  Featured Trainer
                </div>
              )}
            </div>

            {/* Rating and Stats */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="font-semibold text-lg">{trainer.rating.toFixed(1)}</span>
                <span className="text-gray-600">({trainer.review_count} reviews)</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{trainer.follower_count.toLocaleString()} followers</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{trainer.content_count} programs</span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-gray-700 mb-4 leading-relaxed">
              {trainer.bio}
            </p>

            {/* Specializations */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {trainer.specializations.map(spec => (
                  <span
                    key={spec}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience and Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Experience
                </h3>
                <p className="text-gray-700">{trainer.experience_years} years</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Certifications
                </h3>
                <div className="space-y-1">
                  {trainer.certifications.map(cert => (
                    <div key={cert.id} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{cert.name}</span>
                      {cert.verification_status === 'verified' && (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social Links */}
            {(trainer.website_url || trainer.instagram_handle || trainer.youtube_channel) && (
              <div className="flex items-center gap-4">
                {trainer.website_url && (
                  <a
                    href={trainer.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                
                {trainer.instagram_handle && (
                  <a
                    href={`https://instagram.com/${trainer.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                )}
                
                {trainer.youtube_channel && (
                  <a
                    href={trainer.youtube_channel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    YouTube
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="flex border-b">
          {[
            { key: 'about', label: 'About', count: null },
            { key: 'content', label: 'Programs', count: trainerContent.length },
            { key: 'reviews', label: 'Reviews', count: trainer.review_count }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About {trainer.display_name}</h3>
                <p className="text-gray-700 leading-relaxed">{trainer.bio}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Professional Background</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{trainer.experience_years} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Sales:</span>
                      <span className="font-medium">{trainer.total_sales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Programs Created:</span>
                      <span className="font-medium">{trainer.content_count}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Certifications</h4>
                  <div className="space-y-2">
                    {trainer.certifications.map(cert => (
                      <div key={cert.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{cert.name}</div>
                          <div className="text-xs text-gray-600">{cert.organization}</div>
                        </div>
                        {cert.verification_status === 'verified' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Programs by {trainer.display_name}
                </h3>
                <div className="text-sm text-gray-600">
                  {trainerContent.length} programs available
                </div>
              </div>

              {trainerContent.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📚</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Programs Yet</h4>
                  <p className="text-gray-600">
                    This trainer hasn't published any programs yet. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trainerContent.map(content => (
                    <ContentCard
                      key={content.id}
                      content={content}
                      onSelect={() => onContentSelect?.(content)}
                      onPurchase={() => onPurchase?.(content.id)}
                      showTrainer={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reviews & Ratings
                </h3>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{trainer.rating.toFixed(1)}</span>
                  <span className="text-gray-600">({trainer.review_count} reviews)</span>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Rating Breakdown</h4>
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 w-12">
                          <span className="text-sm">{rating}</span>
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${Math.random() * 80 + 10}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {Math.floor(Math.random() * 50)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Student Feedback</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Clear Instructions:</span>
                        <span className="font-medium">95%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Effective Programs:</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Responsive Support:</span>
                        <span className="font-medium">88%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Would Recommend:</span>
                        <span className="font-medium">94%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-4">
                <p className="text-gray-600 text-center">
                  Review system coming soon! Students will be able to leave detailed feedback here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};