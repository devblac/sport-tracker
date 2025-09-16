/**
 * ChallengeInviteModal Component - Invite gym friends to challenges
 * Implements requirement 12.4 - Sistema de invitaciones entre gym friends
 */

import React, { useState, useEffect } from 'react';
import { Challenge } from '@/types/challenges';
import { 
  X, 
  Search, 
  UserPlus, 
  Check, 
  Send,
  Users,
  Mail
} from 'lucide-react';

interface GymFriend {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_online: boolean;
  last_workout?: Date;
  mutual_friends?: number;
}

interface ChallengeInviteModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
  onSendInvites: (friendIds: string[]) => Promise<void>;
  gymFriends: GymFriend[];
  isLoading?: boolean;
}

export const ChallengeInviteModal: React.FC<ChallengeInviteModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onSendInvites,
  gymFriends,
  isLoading = false
}) => {
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState<GymFriend[]>(gymFriends);
  const [isSending, setIsSending] = useState(false);

  // Filter friends based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(gymFriends);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFriends(
        gymFriends.filter(friend =>
          friend.username.toLowerCase().includes(query) ||
          friend.display_name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, gymFriends]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedFriends(new Set());
      setSearchQuery('');
    }
  }, [isOpen]);

  // Toggle friend selection
  const toggleFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  // Select all filtered friends
  const selectAll = () => {
    const allIds = new Set(filteredFriends.map(f => f.id));
    setSelectedFriends(allIds);
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedFriends(new Set());
  };

  // Send invitations
  const handleSendInvites = async () => {
    if (selectedFriends.size === 0) return;

    setIsSending(true);
    try {
      await onSendInvites(Array.from(selectedFriends));
      onClose();
    } catch (error) {
      console.error('Failed to send invites:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Invite Friends to Challenge
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {challenge.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAll}
                disabled={filteredFriends.length === 0}
                className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select All ({filteredFriends.length})
              </button>
              <button
                onClick={clearAll}
                disabled={selectedFriends.size === 0}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedFriends.size} selected
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <FriendSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No friends found' : 'No gym friends yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Add some gym friends to invite them to challenges!'
                }
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {filteredFriends.map((friend) => (
                <FriendItem
                  key={friend.id}
                  friend={friend}
                  isSelected={selectedFriends.has(friend.id)}
                  onToggle={() => toggleFriend(friend.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedFriends.size > 0 && (
                <span>
                  Inviting {selectedFriends.size} friend{selectedFriends.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvites}
                disabled={selectedFriends.size === 0 || isSending}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Invites ({selectedFriends.size})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual friend item component
interface FriendItemProps {
  friend: GymFriend;
  isSelected: boolean;
  onToggle: () => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, isSelected, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          {friend.avatar_url ? (
            <img
              src={friend.avatar_url}
              alt={friend.display_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
          )}
          
          {friend.is_online && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
          )}
        </div>

        <div>
          <div className="font-semibold text-gray-900 dark:text-white">
            {friend.display_name}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            @{friend.username}
          </div>
          
          {friend.last_workout && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Last workout: {new Date(friend.last_workout).toLocaleDateString()}
            </div>
          )}
          
          {friend.mutual_friends && friend.mutual_friends > 0 && (
            <div className="text-xs text-primary">
              {friend.mutual_friends} mutual friend{friend.mutual_friends !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {friend.is_online && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Online
          </span>
        )}
        
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-gray-300 dark:border-gray-600'
        }`}>
          {isSelected && <Check className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
const FriendSkeleton: React.FC = () => (
  <div className="flex items-center space-x-3 p-4">
    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-1/3" />
      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-1/4" />
    </div>
    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
  </div>
);