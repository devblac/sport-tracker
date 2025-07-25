import React, { useState, useEffect, useRef } from 'react';

interface RestTimerProps {
  duration: number; // Duration in seconds
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  duration,
  onComplete,
  onSkip,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for timer completion (optional)
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    audioRef.current = { play: createBeepSound } as any;
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play completion sound
            try {
              audioRef.current?.play();
            } catch (error) {
              console.log('Could not play audio:', error);
            }
            // Auto-complete after a short delay
            setTimeout(() => {
              onComplete();
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const addTime = (seconds: number) => {
    setTimeRemaining(prev => Math.max(0, prev + seconds));
    if (!isRunning && timeRemaining + seconds > 0) {
      setIsRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((duration - timeRemaining) / duration) * 100;
  };

  const getTimerColor = () => {
    if (timeRemaining === 0) return 'text-green-600 dark:text-green-400';
    if (timeRemaining <= 10) return 'text-red-600 dark:text-red-400';
    if (timeRemaining <= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
        <div
          className="h-1 bg-blue-600 transition-all duration-1000 ease-linear"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      <div className="p-6 text-center">
        {/* Rest Timer Display */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rest Timer
          </div>
          <div className={`text-6xl font-mono font-bold ${getTimerColor()}`}>
            {formatTime(timeRemaining)}
          </div>
          {timeRemaining === 0 && (
            <div className="text-lg font-medium text-green-600 dark:text-green-400 mt-2">
              Rest Complete!
            </div>
          )}
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {/* Subtract Time */}
          <button
            onClick={() => addTime(-15)}
            className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            disabled={timeRemaining === 0}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <span className="sr-only">Subtract 15 seconds</span>
          </button>

          {/* Play/Pause */}
          <button
            onClick={toggleTimer}
            className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            disabled={timeRemaining === 0}
          >
            {isRunning ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 6h1m4 0h1" />
              </svg>
            )}
            <span className="sr-only">{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Add Time */}
          <button
            onClick={() => addTime(15)}
            className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="sr-only">Add 15 seconds</span>
          </button>
        </div>

        {/* Quick Time Adjustments */}
        <div className="flex justify-center space-x-2 mb-6">
          {[30, 60, 90, 120].map(seconds => (
            <button
              key={seconds}
              onClick={() => addTime(seconds - timeRemaining)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                Math.abs(timeRemaining - seconds) <= 5
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
          >
            Skip Rest
          </button>
          
          {timeRemaining === 0 ? (
            <button
              onClick={onComplete}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Next Set
            </button>
          )}
        </div>
      </div>
    </div>
  );
};