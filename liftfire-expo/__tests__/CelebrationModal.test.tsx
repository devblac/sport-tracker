import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CelebrationModal } from '../components/CelebrationModal';

describe('CelebrationModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(
      <CelebrationModal
        visible={true}
        type="pr"
        title="New Personal Record!"
        message="You crushed it!"
        icon="trophy"
        onClose={mockOnClose}
      />
    );

    expect(getByText('New Personal Record!')).toBeTruthy();
    expect(getByText('You crushed it!')).toBeTruthy();
    expect(getByText('Awesome!')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <CelebrationModal
        visible={false}
        type="pr"
        title="New Personal Record!"
        message="You crushed it!"
        icon="trophy"
        onClose={mockOnClose}
      />
    );

    expect(queryByText('New Personal Record!')).toBeNull();
  });

  it('displays XP bonus when provided', () => {
    const { getByText } = render(
      <CelebrationModal
        visible={true}
        type="pr"
        title="New Personal Record!"
        message="You crushed it!"
        icon="trophy"
        xpBonus={50}
        onClose={mockOnClose}
      />
    );

    expect(getByText('+50 XP Bonus!')).toBeTruthy();
  });

  it('does not display XP bonus when not provided', () => {
    const { queryByText } = render(
      <CelebrationModal
        visible={true}
        type="achievement"
        title="Achievement Unlocked!"
        message="First workout completed!"
        icon="medal"
        onClose={mockOnClose}
      />
    );

    expect(queryByText(/XP Bonus/)).toBeNull();
  });

  it('calls onClose when Awesome button is pressed', () => {
    const { getByText } = render(
      <CelebrationModal
        visible={true}
        type="level-up"
        title="Level Up!"
        message="You reached level 5!"
        icon="trending-up"
        onClose={mockOnClose}
      />
    );

    const closeButton = getByText('Awesome!');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders different celebration types correctly', () => {
    const types: Array<{
      type: 'pr' | 'level-up' | 'achievement' | 'streak' | 'plan-complete';
      title: string;
    }> = [
      { type: 'pr', title: 'New PR!' },
      { type: 'level-up', title: 'Level Up!' },
      { type: 'achievement', title: 'Achievement!' },
      { type: 'streak', title: 'Streak!' },
      { type: 'plan-complete', title: 'Plan Complete!' },
    ];

    types.forEach(({ type, title }) => {
      const { getByText } = render(
        <CelebrationModal
          visible={true}
          type={type}
          title={title}
          message="Great job!"
          icon="trophy"
          onClose={mockOnClose}
        />
      );

      expect(getByText(title)).toBeTruthy();
    });
  });
});
