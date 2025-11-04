import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Lazy load wrapper for screens with loading fallback
 * Usage: const LazyScreen = lazyLoadScreen(() => import('./screens/MyScreen'));
 */
export const lazyLoadScreen = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

/**
 * Loading fallback component for lazy loaded screens
 */
export const LazyLoadFallback: React.FC = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
});
