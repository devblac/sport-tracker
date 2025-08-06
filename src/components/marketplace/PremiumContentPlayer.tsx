// Premium Content Player - View and interact with purchased content
import React, { useState, useEffect } from 'react';
import { Play, BookOpen, CheckCircle, Clock, Users, Star, Download, Share2, Heart } from 'lucide-react';
import { PremiumContent, PremiumWorkout, ContentSection, VideoContent } from '../../types/marketplace';
import { premiumContentService } from '../../services/premiumContentService';
import { LoadingScreen } from '../ui/LoadingScreen';

interface PremiumContentPlayerProps {
  contentId: string;
  userId: string;
  onClose?: () => void;
  className?: string;
}

export const PremiumContentPlayer: React.FC<PremiumContentPlayerProps> = ({
  contentId,
  userId,
  onClose,
  className = ''
}) => {
  const [content, setContent] = useState<PremiumContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'guides' | 'videos'>('overview');
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [isFavorite, setIsFavorite] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadContent();
  }, [contentId, userId]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const contentData = await premiumContentService.getPurchasedContentWithData(contentId, userId);
      
      if (!contentData) {
        throw new Error('Content not found or not purchased');
      }

      setContent(contentData);
      
      // Load user progress (mock data for now)
      setProgress(Math.floor(Math.random() * 100));
      setIsFavorite(Math.random() > 0.5);
      
      // Set default tab based on content type
      if (contentData.content_data?.workouts?.length) {
        setActiveTab('workouts');
      } else if (contentData.content_data?.sections?.length) {
        setActiveTab('guides');
      } else if (contentData.content_data?.videos?.length) {
        setActiveTab('videos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkoutComplete = (workoutId: string) => {
    setCompletedWorkouts(prev => new Set([...prev, workoutId]));
    // Update progress
    if (content?.content_data?.workouts) {
      const totalWorkouts = content.content_data.workouts.length;
      const completed = completedWorkouts.size + 1;
      setProgress(Math.round((completed / totalWorkouts) * 100));
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, this would update the backend
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content?.title,
        text: content?.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <LoadingScreen 
        title="Loading Content"
        subtitle="Preparing your premium content..."
        progress={60}
      />
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">🔒</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Not Available</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Content Preview */}
          <div className="lg:w-1/3">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
              {content.preview_image ? (
                <img
                  src={content.preview_image}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                  <div className="text-4xl">💪</div>
                </div>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleToggleFavorite}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isFavorite
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 inline mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Favorited' : 'Favorite'}
              </button>
              
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Info */}
          <div className="lg:w-2/3">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h1>
                <p className="text-gray-600 mb-4">{content.description}</p>
              </div>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <div className="font-semibold text-gray-900">{content.rating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="font-semibold text-gray-900">{content.purchase_count.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Students</div>
              </div>
              
              {content.duration_weeks && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="font-semibold text-gray-900">{content.duration_weeks}</div>
                  <div className="text-sm text-gray-600">Weeks</div>
                </div>
              )}
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                </div>
                <div className="font-semibold text-gray-900">{content.difficulty_level}</div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
            </div>

            {/* Trainer Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                {content.trainer_avatar ? (
                  <img
                    src={content.trainer_avatar}
                    alt={content.trainer_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg">👨‍🏫</span>
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{content.trainer_name}</div>
                <div className="text-sm text-gray-600">Certified Trainer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Tab Navigation */}
        <div className="flex border-b overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: BookOpen },
            { key: 'workouts', label: 'Workouts', icon: Play, count: content.content_data?.workouts?.length },
            { key: 'guides', label: 'Guides', icon: BookOpen, count: content.content_data?.sections?.length },
            { key: 'videos', label: 'Videos', icon: Play, count: content.content_data?.videos?.length }
          ].filter(tab => {
            if (tab.key === 'overview') return true;
            return tab.count && tab.count > 0;
          }).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count && (
                <span className="ml-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Program</h3>
                <p className="text-gray-700 leading-relaxed">{content.description}</p>
              </div>

              {/* Tags */}
              {content.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Topics Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What's Included */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">What's Included</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.content_data?.workouts && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Play className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{content.content_data.workouts.length} Workouts</div>
                        <div className="text-sm text-gray-600">Complete training sessions</div>
                      </div>
                    </div>
                  )}
                  
                  {content.content_data?.sections && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <BookOpen className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium">{content.content_data.sections.length} Guide Sections</div>
                        <div className="text-sm text-gray-600">Detailed written content</div>
                      </div>
                    </div>
                  )}
                  
                  {content.content_data?.videos && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Play className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="font-medium">{content.content_data.videos.length} Videos</div>
                        <div className="text-sm text-gray-600">Video demonstrations</div>
                      </div>
                    </div>
                  )}
                  
                  {content.content_data?.resources && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Download className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="font-medium">{content.content_data.resources.length} Resources</div>
                        <div className="text-sm text-gray-600">Additional materials</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Workouts Tab */}
          {activeTab === 'workouts' && content.content_data?.workouts && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Workout Sessions</h3>
              <div className="space-y-4">
                {content.content_data.workouts.map((workout, index) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    index={index + 1}
                    isCompleted={completedWorkouts.has(workout.id)}
                    onComplete={() => handleWorkoutComplete(workout.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Guides Tab */}
          {activeTab === 'guides' && content.content_data?.sections && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Guide Sections</h3>
              <div className="space-y-6">
                {content.content_data.sections
                  .sort((a, b) => a.order - b.order)
                  .map(section => (
                    <GuideSection key={section.id} section={section} />
                  ))}
              </div>
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && content.content_data?.videos && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Video Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.content_data.videos
                  .sort((a, b) => a.order - b.order)
                  .map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const WorkoutCard: React.FC<{
  workout: PremiumWorkout;
  index: number;
  isCompleted: boolean;
  onComplete: () => void;
}> = ({ workout, index, isCompleted, onComplete }) => (
  <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          {isCompleted ? <CheckCircle className="w-4 h-4" /> : index}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{workout.name}</h4>
          <p className="text-sm text-gray-600">{workout.description}</p>
        </div>
      </div>
      
      <div className="text-right text-sm text-gray-500">
        <div>{workout.estimated_duration} min</div>
        <div>{workout.exercises.length} exercises</div>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-1">
        {workout.equipment_needed.slice(0, 3).map(equipment => (
          <span key={equipment} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {equipment}
          </span>
        ))}
      </div>
      
      <button
        onClick={onComplete}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isCompleted
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isCompleted ? 'Completed' : 'Start Workout'}
      </button>
    </div>
  </div>
);

const GuideSection: React.FC<{ section: ContentSection }> = ({ section }) => (
  <div className="border rounded-lg p-6">
    <h4 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h4>
    <div className="prose max-w-none text-gray-700">
      {section.content.split('\n').map((paragraph, index) => (
        <p key={index} className="mb-3">{paragraph}</p>
      ))}
    </div>
    {section.images && section.images.length > 0 && (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {section.images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`${section.title} - Image ${index + 1}`}
            className="rounded-lg"
          />
        ))}
      </div>
    )}
  </div>
);

const VideoCard: React.FC<{ video: VideoContent }> = ({ video }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="aspect-video bg-gray-100 flex items-center justify-center">
      {video.thumbnail ? (
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
      ) : (
        <Play className="w-12 h-12 text-gray-400" />
      )}
    </div>
    <div className="p-4">
      <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
      <p className="text-sm text-gray-600 mb-3">{video.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
        </span>
        <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
          Watch
        </button>
      </div>
    </div>
  </div>
);