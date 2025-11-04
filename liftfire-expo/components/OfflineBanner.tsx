import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStatusIndicator } from '../hooks/useOfflineSync';

export const OfflineBanner: React.FC = () => {
  const { isOnline, hasPending, statusText } = useSyncStatusIndicator();

  if (isOnline && !hasPending) {
    return null;
  }

  return (
    <View style={[styles.banner, !isOnline && styles.offlineBanner]}>
      <Ionicons 
        name={!isOnline ? 'cloud-offline' : 'sync'} 
        size={16} 
        color="#FFFFFF" 
      />
      <Text style={styles.text}>
        {!isOnline ? 'You are offline' : statusText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineBanner: {
    backgroundColor: '#FF3B30',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
