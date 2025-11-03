// Home Screen - Feature Demo and Testing
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useGamification } from '../../hooks/useGamification';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  status?: 'ready' | 'demo' | 'new';
  colors: any;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  onPress,
  status = 'ready',
  colors,
}) => {
  const statusColors = {
    ready: colors.success,
    demo: colors.primary,
    new: colors.warning,
  };

  const statusLabels = {
    ready: 'Ready',
    demo: 'Demo',
    new: 'New',
  };

  return (
    <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.featureHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[status] }]}>
          <Text style={styles.statusText}>{statusLabels[status]}</Text>
        </View>
      </View>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const { colors, themeMode, changeTheme, isDark } = useTheme();
  const { user } = useAuth();
  const { xp, level, currentStreak, loading: gamificationLoading } = useGamification();

  const features = [
    {
      title: 'Workout Tracking',
      description: 'Create and track your workouts with exercises, sets, reps, and weight',
      icon: 'fitness' as const,
      onPress: () => router.push('/workouts'),
      status: 'ready' as const,
    },
    {
      title: 'Workout Templates',
      description: 'Browse 4 default templates or create your own custom templates',
      icon: 'copy' as const,
      onPress: () => router.push('/templates'),
      status: 'new' as const,
    },
    {
      title: 'Exercise Library',
      description: '20 exercises with search and filter by muscle group and equipment',
      icon: 'barbell' as const,
      onPress: () => router.push('/exercises'),
      status: 'new' as const,
    },
    {
      title: 'Social Feed',
      description: 'See friend workouts, like activities, and view weekly leaderboard',
      icon: 'people' as const,
      onPress: () => router.push('/social'),
      status: 'ready' as const,
    },
    {
      title: 'Gamification',
      description: 'Earn XP, level up, track streaks, and unlock achievements',
      icon: 'trophy' as const,
      onPress: () => router.push('/profile'),
      status: 'ready' as const,
    },
    {
      title: 'Friends',
      description: 'Add friends, manage requests, and compete on leaderboards',
      icon: 'person-add' as const,
      onPress: () => router.push('/social'),
      status: 'ready' as const,
    },
  ];

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    changeTheme(themes[nextIndex]);
    
    Alert.alert(
      'Theme Changed',
      `Theme set to: ${themes[nextIndex]}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back!</Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.email?.split('@')[0] || 'Guest'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        {!gamificationLoading && (
          <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Your Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {level}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Level</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {xp}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total XP</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Explore Features
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap any card to test the feature
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} colors={colors} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/workout/new')}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Start New Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary }]}
          onPress={() => router.push('/templates')}
        >
          <Ionicons name="copy" size={24} color={colors.primary} />
          <Text style={[styles.actionButtonTextSecondary, { color: colors.primary }]}>
            Use Template
          </Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>MVP Features</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              All core features are implemented and ready to test. Dark theme matches the legacy app colors.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  themeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  featuresGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
