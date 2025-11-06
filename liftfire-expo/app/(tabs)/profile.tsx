import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useGamification } from '../../hooks/useGamification';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useTheme } from '../../contexts/ThemeContext';
import { XPBar } from '../../components/XPBar';
import { StreakDisplay } from '../../components/StreakDisplay';
import { AchievementGrid } from '../../components/AchievementBadge';
import { StatsCard } from '../../components/StatsCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { OfflineBanner } from '../../components/OfflineBanner';
import { getAllAchievements } from '../../lib/achievements';

type TabType = 'overview' | 'settings';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, signOut, isAuthenticated } = useAuth();
  const {
    xp,
    level,
    levelProgress,
    xpToNextLevel,
    currentStreak,
    longestStreak,
    achievements,
    loading,
    error,
  } = useGamification();
  const { workouts } = useWorkouts();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Calculate statistics
  const totalWorkouts = workouts.length;
  const totalXP = xp;
  
  // Calculate average workout duration
  const avgDuration = workouts.length > 0
    ? Math.round(
        workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / workouts.length
      )
    : 0;
  
  // Calculate weekly workout count (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyWorkouts = workouts.filter(
    w => new Date(w.completed_at) >= oneWeekAgo
  ).length;
  
  // Calculate current week progress (Monday to Sunday)
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust so Monday = 0
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() - daysFromMonday);
  mondayThisWeek.setHours(0, 0, 0, 0);
  
  const currentWeekWorkouts = workouts.filter(
    w => new Date(w.completed_at) >= mondayThisWeek
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Loading profile..." fullScreen />
      </SafeAreaView>
    );
  }

  // Only show error for authenticated users
  // Guest users should see the profile with default values
  if (error && isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  const getUserInitial = () => {
    if (!isAuthenticated) return 'G'; // G for Guest
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: 'person-outline' },
    { id: 'settings' as TabType, label: 'Settings', icon: 'settings-outline' },
  ];

  // Get locked achievements
  const allAchievementDefs = getAllAchievements();
  const unlockedTypes = achievements.map(a => a.achievement_type);
  const lockedAchievements = allAchievementDefs
    .filter(def => !unlockedTypes.includes(def.type))
    .map(def => ({
      type: def.type,
      title: def.title,
      description: def.description,
      icon: def.icon,
    }));

  // Create icon map for unlocked achievements
  const iconMap: Record<string, string> = {};
  allAchievementDefs.forEach(def => {
    iconMap[def.type] = def.icon;
  });

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Guest Mode Banner */}
      {!isAuthenticated && (
        <View style={[styles.guestBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.guestBannerIcon}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.warning} />
          </View>
          <View style={styles.guestBannerContent}>
            <Text style={[styles.guestBannerTitle, { color: colors.text }]}>Using Guest Mode</Text>
            <Text style={[styles.guestBannerText, { color: colors.textSecondary }]}>
              Your workout data is stored locally on this device. Create an account to securely save your progress to the cloud and access it from any device.
            </Text>
            <TouchableOpacity
              style={[styles.guestBannerButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
              <Text style={styles.guestBannerButtonText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guestBannerButtonSecondary}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={[styles.guestBannerButtonSecondaryText, { color: colors.primary }]}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User Info Card */}
      <View style={[styles.userCard, { backgroundColor: colors.card }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{getUserInitial()}</Text>
        </View>
        <Text style={[styles.username, { color: colors.text }]}>
          {isAuthenticated 
            ? (user?.display_name || user?.username || user?.email || 'User')
            : 'Guest User'}
        </Text>
        {isAuthenticated && user?.display_name && (
          <Text style={[styles.usernameSecondary, { color: colors.textSecondary }]}>@{user.username}</Text>
        )}
        {!isAuthenticated && (
          <Text style={[styles.usernameSecondary, { color: colors.textSecondary }]}>Local workouts only</Text>
        )}
        <Text style={[styles.levelText, { color: colors.textSecondary }]}>
          Level {level} • {xp} XP
        </Text>
        <Text style={[styles.workoutsCount, { color: colors.primary }]}>
          {totalWorkouts} {totalWorkouts === 1 ? 'Workout' : 'Workouts'} Completed
        </Text>
        
        {/* Edit Profile Button - Only for authenticated users */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => router.push('/profile/edit')}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* XP and Level */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Level & XP</Text>
        <XPBar
          level={level}
          xp={xp}
          levelProgress={levelProgress}
          xpToNextLevel={xpToNextLevel}
        />
      </View>

      {/* Streak */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Workout Streak</Text>
        <StreakDisplay
          currentStreak={currentStreak}
          longestStreak={longestStreak}
        />
      </View>

      {/* Progress Statistics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Progress Statistics</Text>
        <StatsCard
          icon="barbell-outline"
          label="Total Workouts"
          value={totalWorkouts}
          color={colors.primary}
        />
        <StatsCard
          icon="trophy-outline"
          label="Total XP"
          value={totalXP.toLocaleString()}
          color={colors.warning}
        />
        <StatsCard
          icon="time-outline"
          label="Average Duration"
          value={`${avgDuration} min`}
          color={colors.success}
          subtitle={avgDuration > 0 ? 'per workout' : 'No workouts yet'}
        />
        <StatsCard
          icon="calendar-outline"
          label="This Week"
          value={`${currentWeekWorkouts} workouts`}
          color="#5856D6"
          subtitle={`${weeklyWorkouts} in last 7 days`}
        />
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Achievements ({achievements.length}/{allAchievementDefs.length})
        </Text>
        <AchievementGrid
          achievements={achievements}
          icons={iconMap}
          lockedAchievements={lockedAchievements}
        />
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Guest Mode Banner in Settings */}
      {!isAuthenticated && (
        <View style={[styles.guestBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.guestBannerIcon}>
            <Ionicons name="shield-checkmark-outline" size={32} color={colors.success} />
          </View>
          <View style={styles.guestBannerContent}>
            <Text style={[styles.guestBannerTitle, { color: colors.text }]}>Secure Your Data</Text>
            <Text style={[styles.guestBannerText, { color: colors.textSecondary }]}>
              Create an account to enable cloud backup, sync across devices, and unlock social features like competing with friends.
            </Text>
            <TouchableOpacity
              style={[styles.guestBannerButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
              <Text style={styles.guestBannerButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Theme Settings */}
      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsCardTitle, { color: colors.text }]}>Appearance</Text>
        <ThemeSelector />
      </View>

      {/* Notifications (Coming Soon) */}
      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsCardTitle, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>Push Notifications</Text>
          </View>
          <View style={styles.settingsItemRight}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Privacy (Coming Soon) */}
      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsCardTitle, { color: colors.text }]}>Privacy</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="shield-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>Profile Visibility</Text>
          </View>
          <View style={styles.settingsItemRight}>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Public</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Data & Storage */}
      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsCardTitle, { color: colors.text }]}>Data & Storage</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons 
              name={isAuthenticated ? "cloud-outline" : "phone-portrait-outline"} 
              size={24} 
              color={colors.primary} 
            />
            <Text style={[styles.settingsItemText, { color: colors.text }]}>
              {isAuthenticated ? 'Sync Status' : 'Storage Location'}
            </Text>
          </View>
          <View style={styles.settingsItemRight}>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {isAuthenticated ? 'Active' : 'Local Only'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
        {!isAuthenticated && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={16} color="#FF9500" />
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Your data is only stored on this device. If you uninstall the app or clear data, your progress will be lost.
            </Text>
          </View>
        )}
      </View>

      {/* Account Actions - Only for authenticated users */}
      {isAuthenticated && (
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.settingsCardTitle, { color: colors.text }]}>Account</Text>
          <TouchableOpacity style={styles.settingsItem} onPress={signOut}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="log-out-outline" size={24} color={colors.error} />
              <Text style={[styles.settingsItemText, { color: colors.error }]}>
                Sign Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>LiftFire MVP v1.0.0</Text>
        <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>Made with 💪 for fitness enthusiasts</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <OfflineBanner />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage your account and preferences</Text>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: colors.backgroundSecondary }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && [styles.tabActive, { backgroundColor: colors.card }],
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === tab.id && [styles.tabTextActive, { color: colors.primary }],
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </SafeAreaView>
  );
}

// Theme Selector Component
function ThemeSelector() {
  const { themeMode, changeTheme, colors } = useTheme();

  const themes = [
    { value: 'light' as const, label: 'Light', description: 'Classic light theme', icon: 'sunny-outline' },
    { value: 'dark' as const, label: 'Dark', description: 'Easy on the eyes', icon: 'moon-outline' },
    { value: 'auto' as const, label: 'Auto', description: 'Matches system settings', icon: 'phone-portrait-outline' },
  ];

  return (
    <View style={styles.themeSelector}>
      {themes.map((theme) => (
        <TouchableOpacity
          key={theme.value}
          style={[
            styles.themeOption,
            { backgroundColor: colors.backgroundSecondary },
            themeMode === theme.value && [styles.themeOptionActive, { backgroundColor: colors.primary + '20', borderColor: colors.primary }],
          ]}
          onPress={() => changeTheme(theme.value)}
        >
          <View style={styles.themeOptionLeft}>
            <Ionicons
              name={theme.icon as any}
              size={24}
              color={themeMode === theme.value ? colors.primary : colors.textSecondary}
            />
            <View style={styles.themeOptionText}>
              <Text
                style={[
                  styles.themeOptionLabel,
                  { color: colors.text },
                  themeMode === theme.value && [styles.themeOptionLabelActive, { color: colors.primary }],
                ]}
              >
                {theme.label}
              </Text>
              <Text style={[styles.themeOptionDescription, { color: colors.textSecondary }]}>{theme.description}</Text>
            </View>
          </View>
          {themeMode === theme.value && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
  },
  tabContent: {
    flex: 1,
  },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 14,
  },
  workoutsCount: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  usernameSecondary: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  settingsCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemText: {
    fontSize: 16,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF3E0',
    borderRadius: 4,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
  },
  themeSelector: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  themeOptionLabelActive: {
  },
  themeOptionDescription: {
    fontSize: 13,
  },
  guestBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guestBannerIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  guestBannerContent: {
    alignItems: 'center',
  },
  guestBannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestBannerText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  guestBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    width: '100%',
    marginBottom: 8,
  },
  guestBannerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  guestBannerButtonSecondary: {
    paddingVertical: 8,
  },
  guestBannerButtonSecondaryText: {
    fontSize: 14,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});