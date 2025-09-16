import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui';
import { ExerciseGif } from '@/components/ui/LazyImage';
import { Play, Pause, RotateCcw, Maximize2, Volume2, VolumeX, Settings } from 'lucide-react';
import type { Exercise } from '@/schemas/exercise';

interface ExerciseGifPlayerProps {
  exercise: Exercise;
  autoPlay?: boolean;
  showControls?: boolean;
  showFullscreenButton?: boolean;
  className?: string;
}

export const ExerciseGifPlayer: React.FC<ExerciseGifPlayerProps> = ({
  exercise,
  autoPlay = true,
  showControls = true,
  showFullscreenButton = true,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasSound, setHasSound] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gifRef = useRef<HTMLImageElement>(null);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isFullscreen) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'KeyR':
          e.preventDefault();
          restartGif();
          break;
        case 'Escape':
          exitFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, isPlaying]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    
    // Control GIF animation via CSS
    if (gifRef.current) {
      gifRef.current.style.animationPlayState = isPlaying ? 'paused' : 'running';
    }
  };

  const restartGif = () => {
    if (gifRef.current && exercise.gif_url) {
      // Force GIF restart by changing src
      const originalSrc = gifRef.current.src;
      gifRef.current.src = '';
      setTimeout(() => {
        if (gifRef.current) {
          gifRef.current.src = originalSrc;
        }
      }, 10);
    }
  };

  const enterFullscreen = async () => {
    if (containerRef.current && containerRef.current.requestFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (error) {
        console.warn('Failed to enter fullscreen:', error);
      }
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn('Failed to exit fullscreen:', error);
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSettings(false);
    
    // Apply speed via CSS animation-duration (approximate)
    if (gifRef.current) {
      const baseDuration = 2; // Assume 2s base duration
      gifRef.current.style.animationDuration = `${baseDuration / speed}s`;
    }
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  if (!exercise.gif_url) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm">Exercise animation not available</p>
              <p className="text-xs mt-1">Check back later for updates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Exercise Demonstration</h3>
            {showSettings && (
              <div className="relative">
                <div className="absolute right-0 top-8 bg-popover border border-border rounded-lg shadow-lg p-2 z-20 min-w-[120px]">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Playback Speed</div>
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-accent transition-colors ${
                        playbackSpeed === speed ? 'bg-accent text-accent-foreground' : ''
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GIF Container */}
          <div 
            ref={containerRef}
            className={`relative bg-muted rounded-lg overflow-hidden group ${
              isFullscreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : 'aspect-video'
            }`}
          >
            <ExerciseGif
              ref={gifRef}
              src={exercise.gif_url}
              alt={`${exercise.name} demonstration`}
              className={`${
                isFullscreen 
                  ? 'max-w-full max-h-full object-contain' 
                  : 'w-full h-full object-cover'
              }`}
              style={{ 
                animationPlayState: isPlaying ? 'running' : 'paused',
                animationDuration: `${2 / playbackSpeed}s`,
                filter: loadError ? 'grayscale(1)' : 'none'
              }}
              onError={() => setLoadError(true)}
              onLoad={() => setLoadError(false)}
            />

            {/* Controls Overlay */}
            {showControls && (
              <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors ${
                isFullscreen ? 'bg-black/20' : ''
              }`}>
                <div className={`absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity ${
                  isFullscreen ? 'opacity-100' : ''
                }`}>
                  {/* Left Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlayback}
                      className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={restartGif}
                      className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      title="Restart"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {hasSound && (
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Center Info */}
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {playbackSpeed}x speed
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    {showFullscreenButton && (
                      <button
                        onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                        className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Center Play Button (when paused) */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={togglePlayback}
                      className="bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <Play className="w-8 h-8" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-sm">Failed to load animation</p>
                  <button
                    onClick={() => {
                      setLoadError(false);
                      restartGif();
                    }}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Exercise Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>🎬 Exercise Animation</span>
              {exercise.video_url && (
                <span>📹 Video Available</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isFullscreen && (
                <span className="text-xs bg-accent px-2 py-1 rounded">
                  Press ESC to exit fullscreen
                </span>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              💡 Viewing Tips
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>• Watch the full movement pattern before starting</p>
              <p>• Pay attention to starting and ending positions</p>
              <p>• Use slow motion (0.5x) to study form details</p>
              {isFullscreen && <p>• Use spacebar to pause/play, R to restart</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};