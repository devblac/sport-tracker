// Challenge Components Tests
// Tests for task 14.2 - Challenge UI components

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Challenge, ChallengeParticipant, ChallengeLeaderboard } from '../../../types/challenges';
import ChallengeCard from '../ChallengeCard';
import ChallengeList from '../ChallengeList';
import ChallengeLeaderboard from '../ChallengeLeaderboard';
import ChallengeJoinFlow from '../ChallengeJoinFlow';

// Mock challenge data
const mockChallenge: Challenge = {
  id: 'challenge_1',
  name: '7-Day Consistency Challenge',
  description: 'Complete at least one workout every day for 7 consecutive days',
  type: 'individual',
  category: 'consistency',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-08'),
  requirements: [
    {
      id: 'req_1',
      type: 'workout_count',
      target_value: 7,
      target_unit: 'workouts',
      timeframe: 'total',
      description: 'Complete 7 workouts in 7 days'
    }
  ],
  rewards: [
    {
      id: 'reward_1',
      type: 'xp',
      value: 500,
      description: '500 XP for completing the challenge',
      rarity: 'common',
      unlock_condition: 'completion'
    }
  ],
  participants_count: 25,
  max_participants: 100,
  created_by: 'admin',
  is_active: true,
  difficulty_level: 2,
  tags: ['beginner', 'consistency'],
  created_at: new Date('2023-12-25'),
  updated_at: new Date('2023-12-25')
};

const mockParticipant: ChallengeParticipant = {
  id: 'participant_1',
  challenge_id: 'challenge_1',
  user_id: 'user_123',
  progress: 65,
  current_value: 4,
  rank: 5,
  joined_at: new Date('2024-01-01'),
  last_activity: new Date('2024-01-04'),
  is_completed: false
};

const mockLeaderboard: ChallengeLeaderboard = {
  challenge_id: 'challenge_1',
  participants: [
    {
      user_id: 'user_1',
      username: 'TopAthlete',
      rank: 1,
      progress: 100,
      current_value: 7,
      is_completed: true,
      badge_count: 5
    },
    {
      user_id: 'user_2',
      username: 'SecondPlace',
      rank: 2,
      progress: 85,
      current_value: 6,
      is_completed: false,
      badge_count: 3
    },
    {
      user_id: 'user_123',
      username: 'CurrentUser',
      rank: 5,
      progress: 65,
      current_value: 4,
      is_completed: false,
      badge_count: 2
    }
  ],
  last_updated: new Date()
};

describe('ChallengeCard Component', () => {
  test('renders challenge information correctly', () => {
    render(<ChallengeCard challenge={mockChallenge} />);
    
    expect(screen.getByText('7-Day Consistency Challenge')).toBeInTheDocument();
    expect(screen.getByText(/Complete at least one workout/)).toBeInTheDocument();
    expect(screen.getByText('individual')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // participants count
  });

  test('shows join button for non-participating user', () => {
    const mockOnJoin = jest.fn();
    render(
      <ChallengeCard 
        challenge={mockChallenge} 
        onJoin={mockOnJoin}
      />
    );
    
    const joinButton = screen.getByText('Join Challenge');
    expect(joinButton).toBeInTheDocument();
    
    fireEvent.click(joinButton);
    expect(mockOnJoin).toHaveBeenCalledWith('challenge_1');
  });

  test('shows progress for participating user', () => {
    render(
      <ChallengeCard 
        challenge={mockChallenge} 
        userParticipant={mockParticipant}
      />
    );
    
    expect(screen.getByText('Your Progress')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Rank #5 of 25')).toBeInTheDocument();
  });

  test('displays challenge status correctly', () => {
    const activeChallenge = { ...mockChallenge, is_active: true };
    render(<ChallengeCard challenge={activeChallenge} />);
    
    // Should show active status
    expect(screen.getByText(/Challenge is active/)).toBeInTheDocument();
  });

  test('shows view details button', () => {
    const mockOnView = jest.fn();
    render(
      <ChallengeCard 
        challenge={mockChallenge} 
        onView={mockOnView}
      />
    );
    
    const viewButton = screen.getByText('View Details');
    expect(viewButton).toBeInTheDocument();
    
    fireEvent.click(viewButton);
    expect(mockOnView).toHaveBeenCalledWith('challenge_1');
  });
});

describe('ChallengeList Component', () => {
  const mockChallenges = [mockChallenge];
  const mockUserParticipants = new Map([['challenge_1', mockParticipant]]);

  test('renders list of challenges', () => {
    render(
      <ChallengeList 
        challenges={mockChallenges}
        userParticipants={mockUserParticipants}
      />
    );
    
    expect(screen.getByText('7-Day Consistency Challenge')).toBeInTheDocument();
    expect(screen.getByText('Challenges (1)')).toBeInTheDocument();
  });

  test('shows filters when enabled', () => {
    render(
      <ChallengeList 
        challenges={mockChallenges}
        showFilters={true}
      />
    );
    
    expect(screen.getByPlaceholderText('Search challenges...')).toBeInTheDocument();
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  test('filters challenges by search query', async () => {
    render(
      <ChallengeList 
        challenges={mockChallenges}
        showFilters={true}
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search challenges...');
    fireEvent.change(searchInput, { target: { value: 'consistency' } });
    
    await waitFor(() => {
      expect(screen.getByText('7-Day Consistency Challenge')).toBeInTheDocument();
    });
  });

  test('shows empty state when no challenges match filters', async () => {
    render(
      <ChallengeList 
        challenges={mockChallenges}
        showFilters={true}
        emptyStateMessage="No matching challenges"
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search challenges...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText('No matching challenges')).toBeInTheDocument();
    });
  });

  test('calls onJoinChallenge when join button is clicked', () => {
    const mockOnJoin = jest.fn();
    render(
      <ChallengeList 
        challenges={mockChallenges}
        onJoinChallenge={mockOnJoin}
      />
    );
    
    const joinButton = screen.getByText('Join Challenge');
    fireEvent.click(joinButton);
    
    expect(mockOnJoin).toHaveBeenCalledWith('challenge_1');
  });
});

describe('ChallengeLeaderboard Component', () => {
  test('renders leaderboard with participants', () => {
    render(
      <ChallengeLeaderboard 
        leaderboard={mockLeaderboard}
        challenge={mockChallenge}
        currentUserId="user_123"
      />
    );
    
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('3 participants')).toBeInTheDocument();
    expect(screen.getByText('TopAthlete')).toBeInTheDocument();
    expect(screen.getByText('SecondPlace')).toBeInTheDocument();
  });

  test('highlights current user in leaderboard', () => {
    render(
      <ChallengeLeaderboard 
        leaderboard={mockLeaderboard}
        challenge={mockChallenge}
        currentUserId="user_123"
      />
    );
    
    expect(screen.getByText('CurrentUser')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  test('shows rank icons for top 3 positions', () => {
    render(
      <ChallengeLeaderboard 
        leaderboard={mockLeaderboard}
        challenge={mockChallenge}
      />
    );
    
    // Check for medal emojis (they should be in the document)
    const leaderboardElement = screen.getByText('Leaderboard').closest('div');
    expect(leaderboardElement).toBeInTheDocument();
  });

  test('calls onUserClick when user is clicked', () => {
    const mockOnUserClick = jest.fn();
    render(
      <ChallengeLeaderboard 
        leaderboard={mockLeaderboard}
        challenge={mockChallenge}
        onUserClick={mockOnUserClick}
      />
    );
    
    const userElement = screen.getByText('TopAthlete').closest('div');
    if (userElement) {
      fireEvent.click(userElement);
      expect(mockOnUserClick).toHaveBeenCalledWith('user_1');
    }
  });

  test('shows empty state when no participants', () => {
    const emptyLeaderboard = {
      ...mockLeaderboard,
      participants: []
    };
    
    render(
      <ChallengeLeaderboard 
        leaderboard={emptyLeaderboard}
        challenge={mockChallenge}
      />
    );
    
    expect(screen.getByText('No participants yet')).toBeInTheDocument();
    expect(screen.getByText('Be the first to join this challenge!')).toBeInTheDocument();
  });
});

describe('ChallengeJoinFlow Component', () => {
  test('renders challenge overview step initially', () => {
    const mockOnJoin = jest.fn();
    const mockOnCancel = jest.fn();
    
    render(
      <ChallengeJoinFlow 
        challenge={mockChallenge}
        onJoin={mockOnJoin}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Challenge Overview')).toBeInTheDocument();
    expect(screen.getByText('7-Day Consistency Challenge')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // participants count
  });

  test('navigates through steps correctly', async () => {
    const mockOnJoin = jest.fn();
    const mockOnCancel = jest.fn();
    
    render(
      <ChallengeJoinFlow 
        challenge={mockChallenge}
        onJoin={mockOnJoin}
        onCancel={mockOnCancel}
      />
    );
    
    // Start at overview
    expect(screen.getByText('Challenge Overview')).toBeInTheDocument();
    
    // Click Next to go to requirements
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Challenge Requirements')).toBeInTheDocument();
    });
    
    // Click Next to go to rewards
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Challenge Rewards')).toBeInTheDocument();
    });
    
    // Click Next to go to confirmation
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Ready to Join?')).toBeInTheDocument();
    });
  });

  test('shows requirements step with challenge requirements', async () => {
    const mockOnJoin = jest.fn();
    const mockOnCancel = jest.fn();
    
    render(
      <ChallengeJoinFlow 
        challenge={mockChallenge}
        onJoin={mockOnJoin}
        onCancel={mockOnCancel}
      />
    );
    
    // Navigate to requirements step
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Challenge Requirements')).toBeInTheDocument();
      expect(screen.getByText('Complete 7 workouts in 7 days')).toBeInTheDocument();
    });
  });

  test('shows rewards step with challenge rewards', async () => {
    const mockOnJoin = jest.fn();
    const mockOnCancel = jest.fn();
    
    render(
      <ChallengeJoinFlow 
        challenge={mockChallenge}
        onJoin={mockOnJoin}
        onCancel={mockOnCancel}
      />
    );
    
    // Navigate to rewards step
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Challenge Rewards')).toBeInTheDocument();
      expect(screen.getByText('500 XP for completing the challenge')).toBeInTheDocument();
    });
  });

  test('calls onJoin when join button is clicked', async () => {
    const mockOnJoin = jest.fn().mockResolvedValue(undefined);
    const mockOnCancel = jest.fn();
    
    render(
      <ChallengeJoinFlow 
        challenge={mockChallenge}
        onJoin={mockOnJoin}
        onCancel={mockOnCancel}
      />
    );
    
    // Navigate to final step
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Join Challenge!')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Join Challenge!'));
    expect(mockOnJoin).toHaveBeenCalledWith('challenge_1');
  });

  test('calls onCancel when cancel button is clicked', () => {
    const mockOnJoin = jest.fn();
    const mockOnCancel = jest.fn();
    
    render(
      <ChallengeJoinFlow 
        challenge={mockChallenge}
        onJoin={mockOnJoin}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('shows loading state when joining', async () => {
    const mockOnJoin = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    const mockOnCancel = jest.fn();
    
    render(
      <ChallengeJoinFlow 
        challenge={mockChallenge}
        onJoin={mockOnJoin}
        onCancel={mockOnCancel}
      />
    );
    
    // Navigate to final step
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Join Challenge!')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Join Challenge!'));
    
    await waitFor(() => {
      expect(screen.getByText('Joining...')).toBeInTheDocument();
    });
  });
});

describe('Challenge Components Integration', () => {
  test('components work together in a typical user flow', async () => {
    const mockOnJoin = jest.fn().mockResolvedValue(undefined);
    const mockOnView = jest.fn();
    
    // Render challenge list
    const { rerender } = render(
      <ChallengeList 
        challenges={[mockChallenge]}
        onJoinChallenge={mockOnJoin}
        onViewChallenge={mockOnView}
      />
    );
    
    // User sees challenge in list
    expect(screen.getByText('7-Day Consistency Challenge')).toBeInTheDocument();
    
    // User clicks join
    fireEvent.click(screen.getByText('Join Challenge'));
    expect(mockOnJoin).toHaveBeenCalledWith('challenge_1');
    
    // After joining, user should see their participation
    const userParticipants = new Map([['challenge_1', mockParticipant]]);
    rerender(
      <ChallengeList 
        challenges={[mockChallenge]}
        userParticipants={userParticipants}
        onJoinChallenge={mockOnJoin}
        onViewChallenge={mockOnView}
      />
    );
    
    // Should now show progress instead of join button
    expect(screen.getByText('Your Progress')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  test('challenge card updates correctly after user joins', () => {
    const { rerender } = render(
      <ChallengeCard challenge={mockChallenge} />
    );
    
    // Initially shows join button
    expect(screen.getByText('Join Challenge')).toBeInTheDocument();
    
    // After joining, shows progress
    rerender(
      <ChallengeCard 
        challenge={mockChallenge} 
        userParticipant={mockParticipant}
      />
    );
    
    expect(screen.getByText('Your Progress')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.queryByText('Join Challenge')).not.toBeInTheDocument();
  });
});