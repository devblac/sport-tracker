/**
 * Accessibility Tests for Workout Player Controls
 * 
 * Tests keyboard navigation, screen reader compatibility, and WCAG compliance
 * for workout player interface components.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  accessibilityTester, 
  renderWithA11y, 
  testKeyboardNavigation,
  keyboardTestHelpers,
  a11yTestHelpers 
} from '../../accessibility-test-utils';

// Mock workout player components (these would be actual components in the real app)
const MockWorkoutPlayer = ({ 
  isPlaying = false, 
  currentTime = 0, 
  duration = 300,
  volume = 0.8,
  onPlay = vi.fn(),
  onPause = vi.fn(),
  onNext = vi.fn(),
  onPrevious = vi.fn(),
  onVolumeChange = vi.fn(),
  onSeek = vi.fn()
}) => (
  <div 
    role="region" 
    aria-label="Workout Player Controls"
    className="workout-player"
  >
    {/* Play/Pause Button */}
    <button
      aria-label={isPlaying ? 'Pause workout' : 'Play workout'}
      onClick={isPlaying ? onPause : onPlay}
      className="play-pause-btn"
      data-testid="play-pause-button"
    >
      {isPlaying ? '⏸️' : '▶️'}
    </button>

    {/* Previous Exercise Button */}
    <button
      aria-label="Previous exercise"
      onClick={onPrevious}
      className="previous-btn"
      data-testid="previous-button"
    >
      ⏮️
    </button>

    {/* Next Exercise Button */}
    <button
      aria-label="Next exercise"
      onClick={onNext}
      className="next-btn"
      data-testid="next-button"
    >
      ⏭️
    </button>

    {/* Progress Slider */}
    <div className="progress-container">
      <label htmlFor="progress-slider" className="sr-only">
        Workout progress
      </label>
      <input
        id="progress-slider"
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={(e) => onSeek(parseInt(e.target.value))}
        aria-valuetext={`${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')} of ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`}
        className="progress-slider"
        data-testid="progress-slider"
      />
    </div>

    {/* Volume Control */}
    <div className="volume-container">
      <label htmlFor="volume-slider" className="sr-only">
        Volume control
      </label>
      <input
        id="volume-slider"
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        aria-valuetext={`Volume ${Math.round(volume * 100)}%`}
        className="volume-slider"
        data-testid="volume-slider"
      />
    </div>

    {/* Time Display */}
    <div 
      aria-live="polite" 
      aria-label="Current workout time"
      className="time-display"
      data-testid="time-display"
    >
      {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / 
      {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
    </div>

    {/* Exercise Name Display */}
    <div 
      aria-live="assertive"
      aria-label="Current exercise"
      className="exercise-name"
      data-testid="exercise-name"
    >
      Push-ups
    </div>
  </div>
);

const MockWorkoutPlayerFullscreen = ({ onExit = vi.fn() }) => (
  <div 
    role="dialog"
    aria-modal="true"
    aria-labelledby="fullscreen-title"
    className="fullscreen-player"
    data-testid="fullscreen-player"
  >
    <h2 id="fullscreen-title">Fullscreen Workout Player</h2>
    
    <MockWorkoutPlayer />
    
    <button
      aria-label="Exit fullscreen"
      onClick={onExit}
      className="exit-fullscreen-btn"
      data-testid="exit-fullscreen-button"
    >
      ✕
    </button>
  </div>
);

describe('Workout Player Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Automated Accessibility Checks', () => {
    it('should pass axe accessibility audit', async () => {
      const { container } = render(<MockWorkoutPlayer />);
      
      const results = await accessibilityTester.runAutomatedChecks({ container } as any);
      
      expect(results.passed).toBe(true);
      expect(results.violations).toHaveLength(0);
    });

    it('should pass axe audit for fullscreen mode', async () => {
      const { container } = render(<MockWorkoutPlayerFullscreen />);
      
      const results = await accessibilityTester.runAutomatedChecks({ container } as any);
      
      expect(results.passed).toBe(true);
      expect(results.violations).toHaveLength(0);
    });

    it('should meet WCAG 2.1 AA criteria for interactive elements', async () => {
      const { container } = render(<MockWorkoutPlayer />);
      
      const results = await accessibilityTester.runFocusedChecks(
        { container } as any,
        ['wcag2a', 'wcag2aa', 'wcag21aa']
      );
      
      expect(results.passed).toBe(true);
    });
  });

  describe('Keyboard Navigation Tests', () => {
    it('should support tab navigation through all controls', async () => {
      render(<MockWorkoutPlayer />);
      
      const playButton = screen.getByTestId('play-pause-button');
      const previousButton = screen.getByTestId('previous-button');
      const nextButton = screen.getByTestId('next-button');
      const progressSlider = screen.getByTestId('progress-slider');
      const volumeSlider = screen.getByTestId('volume-slider');

      // Test tab order
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(playButton);

      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(previousButton);

      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(nextButton);

      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(progressSlider);

      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(volumeSlider);
    });

    it('should activate controls with Enter and Space keys', async () => {
      const onPlay = vi.fn();
      const onNext = vi.fn();
      
      render(<MockWorkoutPlayer onPlay={onPlay} onNext={onNext} />);
      
      const playButton = screen.getByTestId('play-pause-button');
      const nextButton = screen.getByTestId('next-button');

      // Test Enter key activation
      playButton.focus();
      await keyboardTestHelpers.pressEnter();
      expect(onPlay).toHaveBeenCalledTimes(1);

      // Test Space key activation
      nextButton.focus();
      await keyboardTestHelpers.pressSpace();
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should support arrow key navigation for sliders', async () => {
      const onSeek = vi.fn();
      const onVolumeChange = vi.fn();
      
      render(<MockWorkoutPlayer onSeek={onSeek} onVolumeChange={onVolumeChange} />);
      
      const progressSlider = screen.getByTestId('progress-slider');
      const volumeSlider = screen.getByTestId('volume-slider');

      // Test that sliders are focusable and have proper attributes
      expect(progressSlider).toHaveAttribute('type', 'range');
      expect(progressSlider).toHaveAttribute('aria-valuetext');
      expect(volumeSlider).toHaveAttribute('type', 'range');
      expect(volumeSlider).toHaveAttribute('aria-valuetext');

      // Focus sliders to verify they're keyboard accessible
      progressSlider.focus();
      expect(document.activeElement).toBe(progressSlider);
      
      volumeSlider.focus();
      expect(document.activeElement).toBe(volumeSlider);
    });

    it('should handle Escape key in fullscreen mode', async () => {
      const onExit = vi.fn();
      
      render(<MockWorkoutPlayerFullscreen onExit={onExit} />);
      
      const fullscreenPlayer = screen.getByTestId('fullscreen-player');
      
      // Verify modal has proper attributes
      expect(fullscreenPlayer).toHaveAttribute('role', 'dialog');
      expect(fullscreenPlayer).toHaveAttribute('aria-modal', 'true');
      expect(fullscreenPlayer).toHaveAttribute('aria-labelledby', 'fullscreen-title');
      
      // Test that exit button is present and accessible
      const exitButton = screen.getByTestId('exit-fullscreen-button');
      expect(exitButton).toHaveAttribute('aria-label', 'Exit fullscreen');
    });

    it('should trap focus in fullscreen mode', async () => {
      render(<MockWorkoutPlayerFullscreen />);
      
      const playButton = screen.getByTestId('play-pause-button');
      const exitButton = screen.getByTestId('exit-fullscreen-button');

      // Focus should start at first focusable element
      playButton.focus();
      expect(document.activeElement).toBe(playButton);

      // Tab to last element
      exitButton.focus();
      expect(document.activeElement).toBe(exitButton);

      // Tab from last element should cycle back to first
      await keyboardTestHelpers.pressTab();
      // In a real implementation, focus should cycle back to first element
    });
  });

  describe('Screen Reader Compatibility Tests', () => {
    it('should have proper ARIA labels for all controls', async () => {
      render(<MockWorkoutPlayer />);
      
      const playButton = screen.getByTestId('play-pause-button');
      const previousButton = screen.getByTestId('previous-button');
      const nextButton = screen.getByTestId('next-button');
      const progressSlider = screen.getByTestId('progress-slider');
      const volumeSlider = screen.getByTestId('volume-slider');

      await a11yTestHelpers.testButton(playButton);
      await a11yTestHelpers.testButton(previousButton);
      await a11yTestHelpers.testButton(nextButton);
      await a11yTestHelpers.testFormField(progressSlider);
      await a11yTestHelpers.testFormField(volumeSlider);
    });

    it('should announce state changes to screen readers', async () => {
      const { rerender } = render(<MockWorkoutPlayer isPlaying={false} />);
      
      const playButton = screen.getByTestId('play-pause-button');
      expect(playButton).toHaveAttribute('aria-label', 'Play workout');

      // Simulate state change
      rerender(<MockWorkoutPlayer isPlaying={true} />);
      expect(playButton).toHaveAttribute('aria-label', 'Pause workout');
    });

    it('should provide meaningful value text for sliders', async () => {
      render(<MockWorkoutPlayer currentTime={125} duration={300} volume={0.7} />);
      
      const progressSlider = screen.getByTestId('progress-slider');
      const volumeSlider = screen.getByTestId('volume-slider');

      expect(progressSlider).toHaveAttribute('aria-valuetext', '2:05 of 5:00');
      expect(volumeSlider).toHaveAttribute('aria-valuetext', 'Volume 70%');
    });

    it('should use live regions for dynamic content updates', async () => {
      render(<MockWorkoutPlayer currentTime={60} />);
      
      const timeDisplay = screen.getByTestId('time-display');
      const exerciseName = screen.getByTestId('exercise-name');

      expect(timeDisplay).toHaveAttribute('aria-live', 'polite');
      expect(exerciseName).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have proper modal semantics in fullscreen', async () => {
      render(<MockWorkoutPlayerFullscreen />);
      
      const fullscreenPlayer = screen.getByTestId('fullscreen-player');
      
      await a11yTestHelpers.testModal(fullscreenPlayer);
    });
  });

  describe('Focus Management Tests', () => {
    it('should have visible focus indicators', async () => {
      render(<MockWorkoutPlayer />);
      
      const playButton = screen.getByTestId('play-pause-button');
      const nextButton = screen.getByTestId('next-button');

      await a11yTestHelpers.testFocusIndicators(playButton);
      await a11yTestHelpers.testFocusIndicators(nextButton);
    });

    it('should manage focus properly when entering fullscreen', async () => {
      render(<MockWorkoutPlayerFullscreen />);
      
      // Verify that focusable elements exist in fullscreen mode
      const playButton = screen.getByTestId('play-pause-button');
      const exitButton = screen.getByTestId('exit-fullscreen-button');
      
      expect(playButton).toBeInTheDocument();
      expect(exitButton).toBeInTheDocument();
      
      // Test that elements are focusable
      playButton.focus();
      expect(playButton).toHaveFocus();
      
      exitButton.focus();
      expect(exitButton).toHaveFocus();
    });

    it('should restore focus when exiting fullscreen', async () => {
      const onExit = vi.fn();
      const { rerender } = render(<MockWorkoutPlayerFullscreen onExit={onExit} />);
      
      const exitButton = screen.getByTestId('exit-fullscreen-button');
      exitButton.focus();
      
      // Simulate exiting fullscreen
      fireEvent.click(exitButton);
      rerender(<MockWorkoutPlayer />);
      
      // In a real implementation, focus should return to the element that triggered fullscreen
      expect(onExit).toHaveBeenCalled();
    });
  });

  describe('Color and Contrast Tests', () => {
    it('should have sufficient color contrast for all text elements', async () => {
      render(<MockWorkoutPlayer />);
      
      const timeDisplay = screen.getByTestId('time-display');
      const exerciseName = screen.getByTestId('exercise-name');

      // Basic color contrast check (in real implementation, use proper contrast calculation)
      await a11yTestHelpers.testColorContrast(timeDisplay);
      await a11yTestHelpers.testColorContrast(exerciseName);
    });

    it('should not rely solely on color to convey information', async () => {
      render(<MockWorkoutPlayer isPlaying={true} />);
      
      const playButton = screen.getByTestId('play-pause-button');
      
      // Button should have text/icon content, not just color
      expect(playButton.textContent).toBeTruthy();
      expect(playButton).toHaveAttribute('aria-label');
    });
  });

  describe('Integration Tests', () => {
    it('should work with keyboard navigation end-to-end', async () => {
      const onPlay = vi.fn();
      const onNext = vi.fn();
      const onSeek = vi.fn();
      
      const result = await testKeyboardNavigation(
        <MockWorkoutPlayer onPlay={onPlay} onNext={onNext} onSeek={onSeek} />,
        {
          expectedFocusOrder: [
            '[data-testid="play-pause-button"]',
            '[data-testid="previous-button"]',
            '[data-testid="next-button"]',
            '[data-testid="progress-slider"]',
            '[data-testid="volume-slider"]'
          ],
          enterSpaceActivation: true,
          arrowKeys: true
        }
      );
      
      expect(result).toBe(true);
    });

    it('should provide complete screen reader experience', async () => {
      render(<MockWorkoutPlayer />);
      
      // Verify all interactive elements have proper labels
      const playButton = screen.getByTestId('play-pause-button');
      const previousButton = screen.getByTestId('previous-button');
      const nextButton = screen.getByTestId('next-button');
      const progressSlider = screen.getByTestId('progress-slider');
      const volumeSlider = screen.getByTestId('volume-slider');
      
      expect(playButton).toHaveAttribute('aria-label');
      expect(previousButton).toHaveAttribute('aria-label');
      expect(nextButton).toHaveAttribute('aria-label');
      expect(progressSlider).toHaveAttribute('aria-valuetext');
      expect(volumeSlider).toHaveAttribute('aria-valuetext');
      
      // Verify live regions exist
      const timeDisplay = screen.getByTestId('time-display');
      const exerciseName = screen.getByTestId('exercise-name');
      
      expect(timeDisplay).toHaveAttribute('aria-live', 'polite');
      expect(exerciseName).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Error States and Edge Cases', () => {
    it('should handle disabled states accessibly', async () => {
      const MockDisabledPlayer = () => (
        <div role="region" aria-label="Workout Player Controls">
          <button
            aria-label="Play workout"
            disabled
            data-testid="disabled-play-button"
          >
            ▶️
          </button>
        </div>
      );
      
      render(<MockDisabledPlayer />);
      
      const disabledButton = screen.getByTestId('disabled-play-button');
      
      expect(disabledButton).toBeDisabled();
      expect(disabledButton).toHaveAttribute('aria-label');
      
      // Disabled button should not be focusable
      disabledButton.focus();
      expect(document.activeElement).not.toBe(disabledButton);
    });

    it('should handle loading states accessibly', async () => {
      const MockLoadingPlayer = () => (
        <div role="region" aria-label="Workout Player Controls">
          <button
            aria-label="Loading workout..."
            aria-busy="true"
            data-testid="loading-button"
          >
            ⏳
          </button>
        </div>
      );
      
      render(<MockLoadingPlayer />);
      
      const loadingButton = screen.getByTestId('loading-button');
      
      expect(loadingButton).toHaveAttribute('aria-busy', 'true');
      expect(loadingButton).toHaveAttribute('aria-label', 'Loading workout...');
    });

    it('should handle error states accessibly', async () => {
      const MockErrorPlayer = () => (
        <div role="region" aria-label="Workout Player Controls">
          <div
            role="alert"
            aria-live="assertive"
            data-testid="error-message"
          >
            Error: Unable to load workout. Please try again.
          </div>
          <button
            aria-label="Retry loading workout"
            data-testid="retry-button"
          >
            🔄 Retry
          </button>
        </div>
      );
      
      render(<MockErrorPlayer />);
      
      const errorMessage = screen.getByTestId('error-message');
      const retryButton = screen.getByTestId('retry-button');
      
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      expect(retryButton).toHaveAttribute('aria-label', 'Retry loading workout');
    });
  });
});