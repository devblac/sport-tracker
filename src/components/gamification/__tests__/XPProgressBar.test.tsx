/**
 * XP Progress Bar Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPProgressBar, CompactXPProgressBar, DetailedXPProgressBar } from '../XPProgressBar';
import type { UserLevel } from '@/types/gamification';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}));

const mockUserLevel: UserLevel = {
  userId: 'user-1',
  level: 5,
  currentXP: 150,
  totalXP: 962,
  xpForCurrentLevel: 812,
  xpForNextLevel: 1318,
  progress: 0.3, // 150/500 = 0.3
  title: 'Dedicated',
  perks: ['Advanced analytics', 'Progress charts'],
  updatedAt: new Date()
};

describe('XPProgressBar', () => {
  it('should render with user level information', () => {
    render(<XPProgressBar userLevel={mockUserLevel} />);
    
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('Dedicated')).toBeInTheDocument();
    expect(screen.getByText('150 / 506 XP')).toBeInTheDocument(); // (1318-812) = 506
  });

  it('should show XP numbers when enabled', () => {
    render(<XPProgressBar userLevel={mockUserLevel} showXPNumbers={true} />);
    
    expect(screen.getByText('150 / 506 XP')).toBeInTheDocument();
  });

  it('should hide XP numbers when disabled', () => {
    render(<XPProgressBar userLevel={mockUserLevel} showXPNumbers={false} />);
    
    expect(screen.queryByText('150 / 506 XP')).not.toBeInTheDocument();
  });

  it('should show labels when enabled', () => {
    render(<XPProgressBar userLevel={mockUserLevel} showLabels={true} />);
    
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('Dedicated')).toBeInTheDocument();
  });

  it('should hide labels when disabled', () => {
    render(<XPProgressBar userLevel={mockUserLevel} showLabels={false} />);
    
    expect(screen.queryByText('Level 5')).not.toBeInTheDocument();
    expect(screen.queryByText('Dedicated')).not.toBeInTheDocument();
  });

  it('should display recent XP gain', () => {
    render(<XPProgressBar userLevel={mockUserLevel} recentXPGain={50} />);
    
    expect(screen.getByText('+50 XP')).toBeInTheDocument();
  });

  it('should apply different sizes correctly', () => {
    const { rerender } = render(<XPProgressBar userLevel={mockUserLevel} size="sm" />);
    
    // Check for small size classes
    expect(document.querySelector('.h-2')).toBeInTheDocument();
    
    rerender(<XPProgressBar userLevel={mockUserLevel} size="lg" />);
    
    // Check for large size classes
    expect(document.querySelector('.h-4')).toBeInTheDocument();
  });

  it('should show progress percentage for large size', () => {
    render(<XPProgressBar userLevel={mockUserLevel} size="lg" />);
    
    expect(screen.getByText('30%')).toBeInTheDocument(); // 0.3 * 100 = 30%
  });

  it('should handle 100% progress correctly', () => {
    const maxProgressLevel: UserLevel = {
      ...mockUserLevel,
      progress: 1.0
    };
    
    render(<XPProgressBar userLevel={maxProgressLevel} size="lg" />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <XPProgressBar userLevel={mockUserLevel} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('CompactXPProgressBar', () => {
  it('should render without labels and XP numbers', () => {
    render(<CompactXPProgressBar userLevel={mockUserLevel} />);
    
    expect(screen.queryByText('Level 5')).not.toBeInTheDocument();
    expect(screen.queryByText('150 / 506 XP')).not.toBeInTheDocument();
    expect(screen.queryByText('Dedicated')).not.toBeInTheDocument();
  });

  it('should show recent XP gain', () => {
    render(<CompactXPProgressBar userLevel={mockUserLevel} recentXPGain={25} />);
    
    expect(screen.getByText('+25 XP')).toBeInTheDocument();
  });

  it('should use small size', () => {
    render(<CompactXPProgressBar userLevel={mockUserLevel} />);
    
    expect(document.querySelector('.h-2')).toBeInTheDocument();
  });
});

describe('DetailedXPProgressBar', () => {
  it('should render with all information', () => {
    render(<DetailedXPProgressBar userLevel={mockUserLevel} />);
    
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('Dedicated')).toBeInTheDocument();
    expect(screen.getByText('150 / 506 XP')).toBeInTheDocument();
  });

  it('should show additional stats', () => {
    render(<DetailedXPProgressBar userLevel={mockUserLevel} />);
    
    expect(screen.getByText('Total XP:')).toBeInTheDocument();
    expect(screen.getByText('962')).toBeInTheDocument();
    expect(screen.getByText('Progress:')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('should format large XP numbers with commas', () => {
    const highXPLevel: UserLevel = {
      ...mockUserLevel,
      totalXP: 15000,
      currentXP: 2500,
      xpForCurrentLevel: 10000,
      xpForNextLevel: 15000
    };
    
    render(<DetailedXPProgressBar userLevel={highXPLevel} />);
    
    expect(screen.getByText('15,000')).toBeInTheDocument();
    expect(screen.getByText('2,500 / 5,000 XP')).toBeInTheDocument();
  });

  it('should show recent XP gain', () => {
    render(<DetailedXPProgressBar userLevel={mockUserLevel} recentXPGain={100} />);
    
    expect(screen.getByText('+100 XP')).toBeInTheDocument();
  });

  it('should use large size', () => {
    render(<DetailedXPProgressBar userLevel={mockUserLevel} />);
    
    expect(document.querySelector('.h-4')).toBeInTheDocument();
  });
});

describe('XPProgressBar Edge Cases', () => {
  it('should handle zero progress', () => {
    const zeroProgressLevel: UserLevel = {
      ...mockUserLevel,
      currentXP: 0,
      progress: 0
    };
    
    render(<XPProgressBar userLevel={zeroProgressLevel} size="lg" />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle very small progress values', () => {
    const smallProgressLevel: UserLevel = {
      ...mockUserLevel,
      progress: 0.001
    };
    
    render(<XPProgressBar userLevel={smallProgressLevel} size="lg" />);
    
    expect(screen.getByText('0%')).toBeInTheDocument(); // Rounded down
  });

  it('should handle missing title gracefully', () => {
    const noTitleLevel: UserLevel = {
      ...mockUserLevel,
      title: ''
    };
    
    render(<XPProgressBar userLevel={noTitleLevel} />);
    
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.queryByText('Dedicated')).not.toBeInTheDocument();
  });

  it('should handle zero XP values', () => {
    const zeroXPLevel: UserLevel = {
      ...mockUserLevel,
      currentXP: 0,
      totalXP: 0,
      xpForCurrentLevel: 0,
      xpForNextLevel: 100,
      progress: 0
    };
    
    render(<XPProgressBar userLevel={zeroXPLevel} />);
    
    expect(screen.getByText('0 / 100 XP')).toBeInTheDocument();
  });
});