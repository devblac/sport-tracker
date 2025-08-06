// Marketplace Demo Component - Test the premium content system
import React, { useState, useEffect } from 'react';
import { premiumContentService } from '../../services/premiumContentService';
import { paymentService } from '../../services/paymentService';
import { contentUploadService } from '../../services/contentUploadService';
import { contentModerationService } from '../../services/contentModerationService';
import { PremiumContent, TrainerProfile } from '../../types/marketplace';

export const MarketplaceDemo: React.FC = () => {
  const [content, setContent] = useState<PremiumContent[]>([]);
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [selectedContent, setSelectedContent] = useState<PremiumContent | null>(null);
  const [purchasedContent, setPurchasedContent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'trainers' | 'upload' | 'test'>('browse');

  // Mock user ID for testing
  const mockUserId = 'test_user_123';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contentData, trainerData, purchased] = await Promise.all([
        premiumContentService.getPremiumContentCatalog(),
        premiumContentService.getTrainerProfiles(),
        premiumContentService.getUserPurchasedContent(mockUserId)
      ]);
      
      console.log('Loaded content:', contentData);
      console.log('Loaded trainers:', trainerData);
      console.log('Purchased content:', purchased);
      
      setContent(contentData);
      setTrainers(trainerData);
      setPurchasedContent(purchased.map(p => p.content_id));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (contentId: string) => {
    try {
      const validation = await paymentService.validatePayment(contentId, mockUserId);
      if (!validation.valid) {
        alert(`Cannot purchase: ${validation.error}`);
        return;
      }

      const pricing = await paymentService.getContentPricing(contentId, mockUserId);
      const formattedPrice = paymentService.formatPrice(pricing.finalPrice, pricing.currency);
      
      if (confirm(`Purchase this content for ${formattedPrice}?`)) {
        // Simulate successful payment
        const contentItem = content.find(c => c.id === contentId);
        if (contentItem) {
          await premiumContentService.recordPurchase({
            content_id: contentId,
            user_id: mockUserId,
            purchase_date: new Date(),
            price_paid: contentItem.price,
            currency: contentItem.currency,
            payment_method: 'stripe',
            transaction_id: `test_${Date.now()}`,
            last_accessed: new Date()
          });
          
          setPurchasedContent(prev => [...prev, contentId]);
          alert('Purchase successful! Content unlocked.');
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const testContentValidation = async () => {
    const testContent = {
      title: 'Test Workout Program',
      description: 'This is a test description for validation. It needs to be at least 50 characters long to pass validation.',
      type: 'program' as const,
      category: 'strength' as const,
      price: 2999,
      tags: ['strength', 'beginner', 'test']
    };

    const result = await contentModerationService.validatePremiumContent(testContent);
    alert(`Validation Result:\nApproved: ${result.approved}\nScore: ${result.score}\nIssues: ${result.issues.join(', ') || 'None'}\nWarnings: ${result.warnings.join(', ') || 'None'}`);
  };

  const testTrainerValidation = async () => {
    const testTrainer = {
      display_name: 'Test Trainer',
      bio: 'This is a test trainer bio that should be long enough to pass validation requirements.',
      experience_years: 5,
      certifications: [
        {
          id: 'cert_1',
          name: 'NASM-CPT',
          organization: 'NASM',
          issued_date: new Date(),
          verification_status: 'verified' as const
        }
      ],
      specializations: ['Strength Training', 'Weight Loss']
    };

    const result = await contentModerationService.validateTrainerProfile(testTrainer);
    alert(`Trainer Validation:\nApproved: ${result.approved}\nScore: ${result.score}\nIssues: ${result.issues.join(', ') || 'None'}`);
  };

  const startContentUpload = async () => {
    try {
      const contentId = await contentUploadService.startContentCreation('trainer_1');
      
      // Update basic info
      await contentUploadService.updateBasicInfo(contentId, {
        title: 'Demo Workout Program',
        description: 'This is a demo workout program created through the upload system. It demonstrates the content creation workflow.',
        type: 'program',
        category: 'strength',
        difficulty_level: 'intermediate',
        duration_weeks: 8,
        price: 3999,
        currency: 'USD',
        tags: ['demo', 'strength', 'program']
      });

      // Add content data
      await contentUploadService.uploadContentData(contentId, {
        workouts: [
          {
            id: 'demo_workout_1',
            name: 'Upper Body Strength',
            description: 'Focus on building upper body strength',
            exercises: [
              {
                exercise_id: 'bench_press',
                exercise_name: 'Bench Press',
                sets: 4,
                reps: '6-8',
                weight_guidance: '80% 1RM',
                rest_time: 180,
                notes: 'Focus on form'
              },
              {
                exercise_id: 'pull_ups',
                exercise_name: 'Pull-ups',
                sets: 3,
                reps: '8-12',
                weight_guidance: 'Bodyweight',
                rest_time: 120
              }
            ],
            estimated_duration: 60,
            difficulty: 'intermediate',
            equipment_needed: ['barbell', 'pull-up bar']
          }
        ]
      });

      // Submit for review
      const progress = await contentUploadService.submitForReview(contentId);
      alert(`Content uploaded! Progress: ${progress.progress}%\nStatus: ${progress.step}`);
      
      // Reload data after a delay to see the new content
      setTimeout(loadData, 6000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading marketplace data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🏪 Marketplace Demo</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        {[
          { key: 'browse', label: '🛍️ Browse Content' },
          { key: 'trainers', label: '👨‍🏫 Trainers' },
          { key: 'upload', label: '📤 Upload Content' },
          { key: 'test', label: '🧪 Test Functions' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browse Content Tab */}
      {activeTab === 'browse' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Premium Content ({content.length})</h2>
          
          {content.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Available</h3>
              <p className="text-gray-600 mb-4">
                The marketplace is empty. Try the "Start Demo Upload Process" in the Upload tab to add sample content.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map(item => (
              <div key={item.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {item.category}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm">{item.rating.toFixed(1)} ({item.review_count})</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.purchase_count} purchases
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg">
                    {paymentService.formatPrice(item.price, item.currency)}
                  </span>
                  <span className="text-sm text-gray-500">by {item.trainer_name}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                {purchasedContent.includes(item.id) ? (
                  <button
                    onClick={() => setSelectedContent(item)}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                  >
                    ✅ Owned - View Content
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item.id)}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                  >
                    💳 Purchase
                  </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trainers Tab */}
      {activeTab === 'trainers' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Featured Trainers ({trainers.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainers.map(trainer => (
              <div key={trainer.id} className="border rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    👨‍🏫
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{trainer.display_name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm">{trainer.rating.toFixed(1)} ({trainer.review_count} reviews)</span>
                      {trainer.is_verified && <span className="text-blue-500">✓</span>}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{trainer.bio}</p>
                
                <div className="mb-3">
                  <div className="text-sm text-gray-500 mb-1">Specializations:</div>
                  <div className="flex flex-wrap gap-1">
                    {trainer.specializations.map(spec => (
                      <span key={spec} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Experience:</span>
                    <div className="font-medium">{trainer.experience_years} years</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Content:</span>
                    <div className="font-medium">{trainer.content_count} programs</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Sales:</span>
                    <div className="font-medium">{trainer.total_sales.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Followers:</span>
                    <div className="font-medium">{trainer.follower_count.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Content Tab */}
      {activeTab === 'upload' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Content Upload Demo</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="mb-4">This demonstrates the content upload workflow for trainers.</p>
            <button
              onClick={startContentUpload}
              className="bg-green-500 text-white py-2 px-6 rounded hover:bg-green-600 transition-colors"
            >
              🚀 Start Demo Upload Process
            </button>
            <p className="text-sm text-gray-600 mt-2">
              This will create a demo workout program and simulate the upload process.
              Check the console for detailed logs.
            </p>
          </div>
        </div>
      )}

      {/* Test Functions Tab */}
      {activeTab === 'test' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Test Functions</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Content Validation</h3>
              <button
                onClick={testContentValidation}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Test Content Validation
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Trainer Validation</h3>
              <button
                onClick={testTrainerValidation}
                className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
              >
                Test Trainer Validation
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Payment System</h3>
              <p className="text-sm text-gray-600 mb-2">
                Payment testing is integrated into the Browse Content tab. Try purchasing content to test the payment flow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content Detail Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedContent.title}</h2>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">{selectedContent.description}</p>
              
              {selectedContent.content_data?.workouts && (
                <div>
                  <h3 className="font-semibold mb-2">Workouts Included:</h3>
                  {selectedContent.content_data.workouts.map(workout => (
                    <div key={workout.id} className="border rounded p-3 mb-2">
                      <h4 className="font-medium">{workout.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{workout.description}</p>
                      <div className="text-sm">
                        <span className="font-medium">Exercises:</span> {workout.exercises.length} |{' '}
                        <span className="font-medium">Duration:</span> {workout.estimated_duration} min |{' '}
                        <span className="font-medium">Difficulty:</span> {workout.difficulty}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};