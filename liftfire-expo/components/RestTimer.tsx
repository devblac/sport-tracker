import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

interface RestTimerProps {
  visible: boolean;
  onClose: () => void;
  defaultDuration?: number;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  visible,
  onClose,
  defaultDuration = 90,
}) => {
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(defaultDuration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const presetDurations = [30, 60, 90, 120, 180];

  useEffect(() => {
    if (visible) {
      setTimeLeft(selectedDuration);
      setIsRunning(true);
    }
  }, [visible, selectedDuration]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          
          // Haptic feedback at 10, 5, 3, 2, 1 seconds
          if (prev <= 10 && prev > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // Strong vibration pattern
    Vibration.vibrate([0, 500, 200, 500]);
    
    // Play completion sound (optional - gracefully handle if not available)
    try {
      // Using system sound for now - can be replaced with custom sound later
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.log('Audio not available:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(selectedDuration);
    setIsRunning(false);
  };

  const handleAddTime = (seconds: number) => {
    setTimeLeft(prev => prev + seconds);
  };

  const handleSelectDuration = (duration: number) => {
    setSelectedDuration(duration);
    setTimeLeft(duration);
    setIsRunning(false);
  };

  const getProgressPercentage = (): number => {
    return (timeLeft / selectedDuration) * 100;
  };

  const getTimerColor = (): string => {
    const percentage = getProgressPercentage();
    if (percentage > 50) return '#34C759';
    if (percentage > 25) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Rest Timer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <View style={[styles.timerCircle, { borderColor: getTimerColor() }]}>
              <Text style={[styles.timerText, { color: getTimerColor() }]}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={styles.timerLabel}>
                {timeLeft === 0 ? 'Complete!' : 'remaining'}
              </Text>
            </View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={24} color="#007AFF" />
              <Text style={styles.controlButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.primaryButton]}
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isRunning ? 'pause' : 'play'}
                size={32}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleAddTime(15)}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
              <Text style={styles.controlButtonText}>+15s</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Time Adjustments */}
          <View style={styles.quickAdjust}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleAddTime(-15)}
              disabled={timeLeft < 15}
            >
              <Text style={styles.adjustButtonText}>-15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleAddTime(30)}
            >
              <Text style={styles.adjustButtonText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleAddTime(60)}
            >
              <Text style={styles.adjustButtonText}>+1m</Text>
            </TouchableOpacity>
          </View>

          {/* Preset Durations */}
          <View style={styles.presets}>
            <Text style={styles.presetsLabel}>Quick Start</Text>
            <View style={styles.presetButtons}>
              {presetDurations.map(duration => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.presetButton,
                    selectedDuration === duration && styles.presetButtonActive
                  ]}
                  onPress={() => handleSelectDuration(duration)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      selectedDuration === duration && styles.presetButtonTextActive
                    ]}
                  >
                    {duration < 60 ? `${duration}s` : `${duration / 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Done Button */}
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  controlButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '600',
  },
  quickAdjust: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  adjustButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  adjustButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  presets: {
    marginBottom: 24,
  },
  presetsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#007AFF',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
