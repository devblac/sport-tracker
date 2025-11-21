import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RestTimer } from '../components/RestTimer';

// Mock expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
  },
}));

describe('RestTimer', () => {
  it('renders when visible', () => {
    const { getByText } = render(
      <RestTimer visible={true} onClose={jest.fn()} defaultDuration={90} />
    );
    
    expect(getByText('Rest Timer')).toBeTruthy();
    expect(getByText('1:30')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <RestTimer visible={false} onClose={jest.fn()} defaultDuration={90} />
    );
    
    expect(queryByText('Rest Timer')).toBeNull();
  });

  it('calls onClose when Done button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <RestTimer visible={true} onClose={onClose} defaultDuration={90} />
    );
    
    const doneButton = getByText('Done');
    fireEvent.press(doneButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('formats time correctly', () => {
    const { getByText } = render(
      <RestTimer visible={true} onClose={jest.fn()} defaultDuration={125} />
    );
    
    expect(getByText('2:05')).toBeTruthy();
  });

  it('shows preset duration buttons', () => {
    const { getByText } = render(
      <RestTimer visible={true} onClose={jest.fn()} defaultDuration={90} />
    );
    
    expect(getByText('30s')).toBeTruthy();
    expect(getByText('1m')).toBeTruthy();
    expect(getByText('2m')).toBeTruthy();
    expect(getByText('3m')).toBeTruthy();
  });
});
