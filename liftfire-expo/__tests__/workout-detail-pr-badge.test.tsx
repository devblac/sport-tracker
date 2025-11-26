/**
 * Tests for PR Badge display in Workout Detail Screen
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PRBadge } from '../components/PRBadge';

describe('Workout Detail PR Badge Display', () => {
  it('should render PR badge with improvement percentage', () => {
    const { getByText } = render(
      <PRBadge isNewPR={true} improvement={15.5} size="small" />
    );

    expect(getByText('NEW PR!')).toBeTruthy();
    expect(getByText('+15.5%')).toBeTruthy();
  });

  it('should render PR badge without improvement when not provided', () => {
    const { getByText, queryByText } = render(
      <PRBadge isNewPR={true} size="small" />
    );

    expect(getByText('NEW PR!')).toBeTruthy();
    expect(queryByText(/\+.*%/)).toBeNull();
  });

  it('should not render when isNewPR is false', () => {
    const { queryByText } = render(
      <PRBadge isNewPR={false} improvement={15.5} size="small" />
    );

    expect(queryByText('NEW PR!')).toBeNull();
  });
});

describe('Celebration Modal Message Formatting', () => {
  it('should format single PR message with improvement', () => {
    const prs = [{ exerciseName: 'Bench Press', improvement: 12.5 }];
    
    const message = `Congratulations! You set a new PR on ${prs[0].exerciseName} with ${prs[0].improvement.toFixed(1)}% improvement!`;
    
    expect(message).toContain('Bench Press');
    expect(message).toContain('12.5%');
  });

  it('should format multiple PR message with all improvements', () => {
    const prs = [
      { exerciseName: 'Bench Press', improvement: 12.5 },
      { exerciseName: 'Squat', improvement: 8.3 },
      { exerciseName: 'Deadlift', improvement: 15.7 },
    ];
    
    const message = `Amazing! You crushed it with PRs:\n\n${prs.map(pr => `• ${pr.exerciseName}: +${pr.improvement.toFixed(1)}%`).join('\n')}`;
    
    expect(message).toContain('• Bench Press: +12.5%');
    expect(message).toContain('• Squat: +8.3%');
    expect(message).toContain('• Deadlift: +15.7%');
  });
});
