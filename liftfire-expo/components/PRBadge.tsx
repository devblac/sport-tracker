/**
 * Personal Record Badge Component
 * 
 * Displays a badge when a user achieves a new personal record
 * Features:
 * - Gold star icon
 * - "NEW PR!" text
 * - Improvement percentage (optional)
 * - Animated scale entrance
 * - Three sizes: small, medium, large
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PRBadgeProps {
  isNewPR: boolean;
  improvement?: number; // percentage
  size?: 'small' | 'medium' | 'large';
}

export const PRBadge: React.FC<PRBadgeProps> = ({
  isNewPR,
  improvement,
  size = 'medium',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isNewPR) {
      // Animated scale entrance with rotation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isNewPR, scaleAnim, rotateAnim]);

  if (!isNewPR) {
    return null;
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  const sizeStyles = {
    small: styles.smallContainer,
    medium: styles.mediumContainer,
    large: styles.largeContainer,
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 28,
  };

  const textStyles = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  };

  const improvementTextStyles = {
    small: styles.smallImprovement,
    medium: styles.mediumImprovement,
    large: styles.largeImprovement,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles[size],
        {
          transform: [{ scale: scaleAnim }, { rotate }],
        },
      ]}
    >
      <Ionicons name="star" size={iconSizes[size]} color="#FFD700" />
      <Text style={[styles.text, textStyles[size]]}>NEW PR!</Text>
      {improvement !== undefined && improvement > 0 && (
        <Text style={[styles.improvement, improvementTextStyles[size]]}>
          +{improvement.toFixed(1)}%
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  text: {
    fontWeight: '700',
    color: '#B8860B', // Dark goldenrod
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 16,
  },
  improvement: {
    fontWeight: '600',
    color: '#4CAF50', // Green for positive improvement
  },
  smallImprovement: {
    fontSize: 9,
  },
  mediumImprovement: {
    fontSize: 10,
  },
  largeImprovement: {
    fontSize: 14,
  },
});
