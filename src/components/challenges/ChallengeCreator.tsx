/**
 * ChallengeCreator Component - Create custom challenges
 * Implements requirement 12.4 - Challenge creation with friend invitations
 */

import React, { useState } from 'react';
import { 
  Challenge, 
  CreateChallengeRequest, 
  ChallengeRequirement, 
  ChallengeReward 
} from '@/types/challenges';
import { 
  CHALLENGE_CATEGORIES, 
  CHALLENGE_TYPES, 
  REQUIREMENT_TYPES, 
  REWARD_TYPES 
} from '@/types/challenges';
import { 
  Plus, 
  Minus, 
  Calendar, 
  Users, 
  Target, 
  Award,
  X,
  Check
} from 'lucide-react';

interface ChallengeCreatorProps {
  onCreateChallenge: (request: CreateChallengeRequest) => Promise<Challenge>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export const ChallengeCreator: React.FC<ChallengeCreatorProps> = ({
  onCreateChallenge,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<CreateChallengeRequest>({
    name: '',
    description: '',
    type: 'group',
    category: 'strength',
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    requirements: [],
    rewards: [],
    difficulty_level: 3,
    tags: []
  });

  const [currentRequirement, setCurrentRequirement] = useState<Partial<ChallengeRequirement>>({
    type: 'workout_count',
    target_value: 1,
    target_unit: 'workouts',
    timeframe: 'total',
    description: ''
  });

  const [currentReward, setCurrentReward] = useState<Partial<ChallengeReward>>({
    type: 'xp',
    value: 100,
    description: '',
    rarity: 'common',
    unlock_condition: 'completion'
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Challenge name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.start_date >= formData.end_date) {
      newErrors.dates = 'End date must be after start date';
    }

    if (formData.requirements.length === 0) {
      newErrors.requirements = 'At least one requirement is needed';
    }

    if (formData.rewards.length === 0) {
      newErrors.rewards = 'At least one reward is needed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onCreateChallenge(formData);
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };

  // Add requirement
  const addRequirement = () => {
    if (!currentRequirement.description?.trim()) {
      return;
    }

    const requirement: Omit<ChallengeRequirement, 'id'> = {
      type: currentRequirement.type!,
      target_value: currentRequirement.target_value!,
      target_unit: currentRequirement.target_unit!,
      timeframe: currentRequirement.timeframe!,
      description: currentRequirement.description!,
      exercise_id: currentRequirement.exercise_id
    };

    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, requirement]
    }));

    // Reset current requirement
    setCurrentRequirement({
      type: 'workout_count',
      target_value: 1,
      target_unit: 'workouts',
      timeframe: 'total',
      description: ''
    });
  };

  // Remove requirement
  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  // Add reward
  const addReward = () => {
    if (!currentReward.description?.trim()) {
      return;
    }

    const reward: Omit<ChallengeReward, 'id'> = {
      type: currentReward.type!,
      value: currentReward.value!,
      description: currentReward.description!,
      rarity: currentReward.rarity!,
      unlock_condition: currentReward.unlock_condition!
    };

    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, reward]
    }));

    // Reset current reward
    setCurrentReward({
      type: 'xp',
      value: 100,
      description: '',
      rarity: 'common',
      unlock_condition: 'completion'
    });
  };

  // Remove reward
  const removeReward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }));
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Custom Challenge
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Challenge Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter challenge name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty_level}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: parseInt(e.target.value) as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={1}>Beginner</option>
              <option value={2}>Easy</option>
              <option value={3}>Intermediate</option>
              <option value={4}>Advanced</option>
              <option value={5}>Expert</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Describe your challenge..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Type and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Challenge Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CHALLENGE_TYPES.map(type => (
                <option key={type} value={type} className="capitalize">
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CHALLENGE_CATEGORIES.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={formData.start_date.toISOString().slice(0, 16)}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: new Date(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="datetime-local"
              value={formData.end_date.toISOString().slice(0, 16)}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: new Date(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        {errors.dates && <p className="text-red-500 text-sm">{errors.dates}</p>}

        {/* Requirements Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Requirements
          </h3>
          
          {/* Add Requirement Form */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <select
                value={currentRequirement.type}
                onChange={(e) => setCurrentRequirement(prev => ({ ...prev, type: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {REQUIREMENT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={currentRequirement.target_value}
                onChange={(e) => setCurrentRequirement(prev => ({ ...prev, target_value: parseInt(e.target.value) }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Target value"
                min="1"
              />

              <select
                value={currentRequirement.timeframe}
                onChange={(e) => setCurrentRequirement(prev => ({ ...prev, timeframe: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="total">Total</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>

              <button
                type="button"
                onClick={addRequirement}
                disabled={!currentRequirement.description?.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={currentRequirement.description}
              onChange={(e) => setCurrentRequirement(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Requirement description"
            />
          </div>

          {/* Requirements List */}
          <div className="space-y-2">
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {req.description}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {req.target_value} {req.target_unit} ({req.timeframe})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.requirements && <p className="text-red-500 text-sm mt-2">{errors.requirements}</p>}
        </div>

        {/* Rewards Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Rewards
          </h3>
          
          {/* Add Reward Form */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <select
                value={currentReward.type}
                onChange={(e) => setCurrentReward(prev => ({ ...prev, type: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {REWARD_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <input
                type={currentReward.type === 'xp' ? 'number' : 'text'}
                value={currentReward.value}
                onChange={(e) => setCurrentReward(prev => ({ 
                  ...prev, 
                  value: currentReward.type === 'xp' ? parseInt(e.target.value) : e.target.value 
                }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Reward value"
              />

              <select
                value={currentReward.rarity}
                onChange={(e) => setCurrentReward(prev => ({ ...prev, rarity: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>

              <button
                type="button"
                onClick={addReward}
                disabled={!currentReward.description?.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={currentReward.description}
              onChange={(e) => setCurrentReward(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Reward description"
            />
          </div>

          {/* Rewards List */}
          <div className="space-y-2">
            {formData.rewards.map((reward, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {reward.description}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {reward.type}: {reward.value} ({reward.rarity})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeReward(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.rewards && <p className="text-red-500 text-sm mt-2">{errors.rewards}</p>}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-primary/60 hover:text-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Create Challenge</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};