/**
 * Celebration Modal Component
 * 
 * Displays celebration animations for various achievements:
 * - Personal Records (PR)
 * - Level Up
 * - Achievement Unlocks
 * - Streak Milestones
 * - Plan Completion
 * 
 * Features:
 * - Confetti animation
 * - Large icon (80x80)
 * - Title and message
 * - XP bonus display (optional)
 * - "Awesome!" button to close
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CelebrationType = 'pr' | 'level-up' | 'achievement' | 'streak' | 'plan-complete';

interface CelebrationModalProps {
  visible: boolean;
  type: CelebrationType;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  xpBonus?: number;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  type,
  title,
  message,
  icon,
  xpBonus,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 50 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate modal entrance
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Animate glow effect for level-up
      if (type === 'level-up') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ).start();
      }

      // Animate confetti
      confettiAnims.forEach((anim, index) => {
        const delay = Math.random() * 500;
        const xTarget = (Math.random() - 0.5) * SCREEN_WIDTH;
        const yTarget = Math.random() * 600 + 200;
        const rotateTarget = Math.random() * 720;

        Animated.parallel([
          Animated.timing(anim.x, {
            toValue: xTarget,
            duration: 3000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: yTarget,
            duration: 3000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: rotateTarget,
            duration: 3000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 3000,
            delay,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
      confettiAnims.forEach(anim => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });
    }
  }, [visible, type]);

  const getColorForType = (): string => {
    const colors: Record<CelebrationType, string> = {
      pr: '#FFD700',
      'level-up': '#9013FE',
      achievement: '#FFA500',
      streak: '#FF6B35',
      'plan-complete': '#7ED321',
    };
    return colors[type];
  };

  const getConfettiColors = (): string[] => {
    return ['#FFD700', '#FFA500', '#FF6B35', '#7ED321', '#9013FE'];
  };

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti particles */}
        {confettiAnims.map((anim, index) => {
          const color = getConfettiColors()[index % getConfettiColors().length];
          const rotate = anim.rotate.interpolate({
            inputRange: [0, 720],
            outputRange: ['0deg', '720deg'],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  backgroundColor: color,
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    { rotate },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            />
          );
        })}

        {/* Modal content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow effect for level-up */}
          {type === 'level-up' && (
            <Animated.View
              style={[
                styles.glow,
                {
                  backgroundColor: getColorForType(),
                  transform: [{ scale: glowScale }],
                  opacity: glowOpacity,
                },
              ]}
            />
          )}

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getColorForType()}20` },
            ]}
          >
            <Ionicons name={icon} size={80} color={getColorForType()} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* XP Bonus */}
          {xpBonus !== undefined && xpBonus > 0 && (
            <View style={styles.xpBonusContainer}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.xpBonusText}>+{xpBonus} XP Bonus!</Text>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    top: -20,
    left: SCREEN_WIDTH / 2,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6D6D70',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  xpBonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 8,
  },
  xpBonusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B8860B',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
