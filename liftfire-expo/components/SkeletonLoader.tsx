import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Skeleton loader component for loading states
 * 
 * Features:
 * - Animated shimmer effect
 * - Customizable dimensions
 * - Theme-aware colors
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton loader for workout cards
 */
export const WorkoutCardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <SkeletonLoader width="60%" height={20} />
        <SkeletonLoader width={60} height={20} />
      </View>
      <View style={styles.cardDetails}>
        <SkeletonLoader width={80} height={16} />
        <SkeletonLoader width={100} height={16} />
      </View>
    </View>
  );
};

/**
 * Skeleton loader for social feed items
 */
export const FeedItemSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.feedHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.feedInfo}>
          <SkeletonLoader width="40%" height={16} />
          <SkeletonLoader width="60%" height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton loader for list of items
 */
export const ListSkeleton: React.FC<{ count?: number; type?: 'workout' | 'feed' }> = ({
  count = 3,
  type = 'workout',
}) => {
  const SkeletonComponent = type === 'workout' ? WorkoutCardSkeleton : FeedItemSkeleton;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedInfo: {
    flex: 1,
  },
});
