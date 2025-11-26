/**
 * PRBadge Component Tests
 * 
 * Tests the Personal Record badge component functionality
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PRBadge } from '../components/PRBadge';

describe('PRBadge', () => {
  it('renders nothing when isNewPR is false', () => {
    const { queryByText } = render(<PRBadge isNewPR={false} />);
    expect(queryByText('NEW PR!')).toBeNull();
  });

  it('renders badge when isNewPR is true', () => {
    const { getByText } = render(<PRBadge isNewPR={true} />);
    expect(getByText('NEW PR!')).toBeTruthy();
  });

  it('displays improvement percentage when provided', () => {
    const { getByText } = render(<PRBadge isNewPR={true} improvement={15.5} />);
    expect(getByText('NEW PR!')).toBeTruthy();
    expect(getByText('+15.5%')).toBeTruthy();
  });

  it('does not display improvement when not provided', () => {
    const { queryByText, getByText } = render(<PRBadge isNewPR={true} />);
    expect(getByText('NEW PR!')).toBeTruthy();
    expect(queryByText(/\+.*%/)).toBeNull();
  });

  it('does not display improvement when improvement is 0', () => {
    const { queryByText, getByText } = render(<PRBadge isNewPR={true} improvement={0} />);
    expect(getByText('NEW PR!')).toBeTruthy();
    expect(queryByText(/\+.*%/)).toBeNull();
  });

  it('renders with small size', () => {
    const { getByText } = render(<PRBadge isNewPR={true} size="small" />);
    expect(getByText('NEW PR!')).toBeTruthy();
  });

  it('renders with medium size (default)', () => {
    const { getByText } = render(<PRBadge isNewPR={true} size="medium" />);
    expect(getByText('NEW PR!')).toBeTruthy();
  });

  it('renders with large size', () => {
    const { getByText } = render(<PRBadge isNewPR={true} size="large" />);
    expect(getByText('NEW PR!')).toBeTruthy();
  });

  it('formats improvement percentage to one decimal place', () => {
    const { getByText } = render(<PRBadge isNewPR={true} improvement={12.3456} />);
    expect(getByText('+12.3%')).toBeTruthy();
  });
});
