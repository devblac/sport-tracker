/**
 * ChallengeJoin Component
 * 
 * Handles the challenge join flow with validation and confirmation.
 * Implements task 14.2 - ChallengeJoin flow
 */

import React, { useState } from 'react';
import type { Challenge, ChallengeParticipant } from '@/types/challengeModels';
import { ChallengeValidationUtils } from '@/utils/challengeModelValidation';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Award,
  X
} from 'lucide-react';

interface ChallengeJoinProps {
  challenge: Challenge;
  existingParticipants: ChallengeParticipant[];
  currentUserId: string;
  onJoin: (challengeId: string, options?: ChallengeJoinOptions) => Promise<boolean>;
  onCancel: () => void;
  className?: string;
}

interface ChallengeJoinOptions {
  teamId?: string;
  teamName?: string;
  createTeam?: boolean;
  notifications?: boolean;
  privacy?: 'public' | 'private';
}

export const ChallengeJoin: React.FC<ChallengeJoinProps> = ({
  challenge,
  existingParticipants,
  currentUserId,
  onJoin,
  onCancel,
  className = ''
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [joinOptions, setJoinOptions] = useState<ChallengeJoinOptions>({
    notifications: true,
    privacy: 'public'
  });
  const [teamName, setTeamName] = useState('');
  const [showTeamCreation, setShowTeamCreation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate if user can join
  const validationResult = ChallengeValidationUtils.canUserJoinChallenge(
    challenge,
    currentUserId,
    existingParticipants
  );

  const isTeamChallenge = challenge.type === 'team';
  const canJoin = validationResult.isValid;

  // Get challenge requirements summary
  const getRequirementsSummary = () => {
    return challenge.requirements.map(req => ({
      name: req.name,
      description: req.description,
      isMandatory: req.is_mandatory,
      target: `${req.target_value} ${req.unit}`
    }));
  };

  // Handle join submission
  const handleJoin = async () => {
    if (!canJoin) return;

    setIsJoining(true);
    setValidationErrors([]);

    try {
      // Validate team options if needed
      if (isTeamChallenge && showTeamCreation) {
        if (!teamName.trim()) {
          setValidationErrors(['Team name is required']);
          setIsJoining(false);
          return;
        }
        joinOptions.teamName = teamName.trim();
        joinOptions.createTeam = true;
      }

      const success = await onJoin(challenge.id, joinOptions);
      
      if (!success) {
        setValidationErrors(['Failed to join challenge. Please try again.']);
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      setValidationErrors([
        error instanceof Error ? error.message : 'An unexpected error occurred'
      ]);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Join Challenge</h2>
            <p className="text-gray-600">{challenge.name}</p>
          </div>
        </div>
        
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Challenge Overview */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Challenge Overview</h3>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 mb-4">{challenge.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Duration: {challenge.duration_days} days</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{challenge.current_participants} participants</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-gray-500" />
                <span>Difficulty: {challenge.difficulty}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>
                  Ends: {new Date(challenge.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Requirements</h3>
          
          <div className="space-y-3">
            {getRequirementsSummary().map((req, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="mt-1">
                  {req.isMandatory ? (
                    <Target className="w-4 h-4 text-red-500" />
                  ) : (
                    <Award className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{req.name}</div>
                  <div className="text-sm text-gray-600">{req.description}</div>
                  <div className="text-sm text-gray-500">Target: {req.target}</div>
                  {req.isMandatory && (
                    <div className="text-xs text-red-600 mt-1">Required to complete</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Options (for team challenges) */}
        {isTeamChallenge && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Team Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="join-existing"
                  name="team-option"
                  checked={!showTeamCreation}
                  onChange={() => setShowTeamCreation(false)}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor="join-existing" className="font-medium">
                  Join existing team
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="create-team"
                  name="team-option"
                  checked={showTeamCreation}
                  onChange={() => setShowTeamCreation(true)}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor="create-team" className="font-medium">
                  Create new team
                </label>
              </div>
              
              {showTeamCreation && (
                <div className="ml-7 space-y-2">
                  <input
                    type="text"
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    Team size: {challenge.team_size} members
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Preferences</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-gray-600">
                  Receive updates about challenge progress
                </div>
              </div>
              <input
                type="checkbox"
                checked={joinOptions.notifications}
                onChange={(e) => setJoinOptions(prev => ({
                  ...prev,
                  notifications: e.target.checked
                }))}
                className="w-4 h-4 text-primary rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Public Profile</div>
                <div className="text-sm text-gray-600">
                  Show your progress on leaderboards
                </div>
              </div>
              <select
                value={joinOptions.privacy}
                onChange={(e) => setJoinOptions(prev => ({
                  ...prev,
                  privacy: e.target.value as 'public' | 'private'
                }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {!canJoin && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium text-red-800">Cannot Join Challenge</div>
                <ul className="text-sm text-red-700 mt-1 space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium text-red-800">Join Failed</div>
                <ul className="text-sm text-red-700 mt-1 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {canJoin && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium text-green-800">Ready to Join</div>
                <div className="text-sm text-green-700 mt-1">
                  You meet all requirements to participate in this challenge.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t bg-gray-50">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          Cancel
        </button>
        
        <button
          onClick={handleJoin}
          disabled={!canJoin || isJoining}
          className={`px-6 py-2 rounded-lg font-medium ${
            canJoin && !isJoining
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isJoining ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Joining...</span>
            </div>
          ) : (
            'Join Challenge'
          )}
        </button>
      </div>
    </div>
  );
};