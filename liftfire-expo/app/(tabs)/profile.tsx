import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useGamification } from '../../hooks/useGamification';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useTheme } from '../../hooks/useTheme';
import { XPBar } from '../../components/XPBar';
import { StreakDisplay } from '../../components/StreakDisplay';
import { AchievementGrid } from '../../components/AchievementBadge';
import { StatsCard } from '../../components/StatsCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { getAllAchievements } from '../../lib/achievements';

type TabType = 'overview' | 'settings';

export default function ProfileScreen() {
  const router = useRouter();
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
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading profile..." fullScreen />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  const getUserInitial = () => {
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
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerIcon}>
            <Ionicons name="cloud-offline-outline" size={32} color="#FF9500" />
          </View>
          <View style={styles.guestBannerContent}>
            <Text style={styles.guestBannerTitle}>Using Guest Mode</Text>
            <Text style={styles.guestBannerText}>
              Your workout data is stored locally on this device. Create an account to securely save your progress to the cloud and access it from any device.
            </Text>
            <TouchableOpacity
              style={styles.guestBannerButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
              <Text style={styles.guestBannerButtonText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guestBannerButtonSecondary}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.guestBannerButtonSecondaryText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getUserInitial()}</Text>
        </View>
        <Text style={styles.username}>
          {user?.display_name || user?.username || user?.email || 'User'}
        </Text>
        {user?.display_name && (
          <Text style={styles.usernameSecondary}>@{user.username}</Text>
        )}
        <Text style={styles.levelText}>
          Level {level} • {xp} XP
        </Text>
        <Text style={styles.workoutsCount}>
          {totalWorkouts} {totalWorkouts === 1 ? 'Workout' : 'Workouts'} Completed
        </Text>
        
        {/* Edit Profile Button - Only for authenticated users */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Ionicons name="create-outline" size={16} color="#007AFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* XP and Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Level & XP</Text>
        <XPBar
          level={level}
          xp={xp}
          levelProgress={levelProgress}
          xpToNextLevel={xpToNextLevel}
        />
      </View>

      {/* Streak */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Streak</Text>
        <StreakDisplay
          currentStreak={currentStreak}
          longestStreak={longestStreak}
        />
      </View>

      {/* Progress Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Statistics</Text>
        <StatsCard
          icon="barbell-outline"
          label="Total Workouts"
          value={totalWorkouts}
          color="#007AFF"
        />
        <StatsCard
          icon="trophy-outline"
          label="Total XP"
          value={totalXP.toLocaleString()}
          color="#FF9500"
        />
        <StatsCard
          icon="time-outline"
          label="Average Duration"
          value={`${avgDuration} min`}
          color="#34C759"
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
        <Text style={styles.sectionTitle}>
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
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerIcon}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#34C759" />
          </View>
          <View style={styles.guestBannerContent}>
            <Text style={styles.guestBannerTitle}>Secure Your Data</Text>
            <Text style={styles.guestBannerText}>
              Create an account to enable cloud backup, sync across devices, and unlock social features like competing with friends.
            </Text>
            <TouchableOpacity
              style={styles.guestBannerButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
              <Text style={styles.guestBannerButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Theme Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Appearance</Text>
        <ThemeSelector />
      </View>

      {/* Notifications (Coming Soon) */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Notifications</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="notifications-outline" size={24} color="#007AFF" />
            <Text style={styles.settingsItemText}>Push Notifications</Text>
          </View>
          <View style={styles.settingsItemRight}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Privacy (Coming Soon) */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Privacy</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="shield-outline" size={24} color="#007AFF" />
            <Text style={styles.settingsItemText}>Profile Visibility</Text>
          </View>
          <View style={styles.settingsItemRight}>
            <Text style={styles.settingValue}>Public</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Data & Storage */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCardTitle}>Data & Storage</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons 
              name={isAuthenticated ? "cloud-outline" : "phone-portrait-outline"} 
              size={24} 
              color="#007AFF" 
            />
            <Text style={styles.settingsItemText}>
              {isAuthenticated ? 'Sync Status' : 'Storage Location'}
            </Text>
          </View>
          <View style={styles.settingsItemRight}>
            <Text style={styles.settingValue}>
              {isAuthenticated ? 'Active' : 'Local Only'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </View>
        </TouchableOpacity>
        {!isAuthenticated && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={16} color="#FF9500" />
            <Text style={styles.warningText}>
              Your data is only stored on this device. If you uninstall the app or clear data, your progress will be lost.
            </Text>
          </View>
        )}
      </View>

      {/* Account Actions - Only for authenticated users */}
      {isAuthenticated && (
        <View style={styles.settingsCard}>
          <Text style={styles.settingsCardTitle}>Account</Text>
          <TouchableOpacity style={styles.settingsItem} onPress={signOut}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
              <Text style={[styles.settingsItemText, { color: '#FF3B30' }]}>
                Sign Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      )}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>LiftFire MVP v1.0.0</Text>
        <Text style={styles.appInfoText}>Made with 💪 for fitness enthusiasts</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#007AFF' : '#8E8E93'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
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
  const { themeMode, changeTheme } = useTheme();

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
            themeMode === theme.value && styles.themeOptionActive,
          ]}
          onPress={() => changeTheme(theme.value)}
        >
          <View style={styles.themeOptionLeft}>
            <Ionicons
              name={theme.icon as any}
              size={24}
              color={themeMode === theme.value ? '#007AFF' : '#8E8E93'}
            />
            <View style={styles.themeOptionText}>
              <Text
                style={[
                  styles.themeOptionLabel,
                  themeMode === theme.value && styles.themeOptionLabelActive,
                ]}
              >
                {theme.label}
              </Text>
              <Text style={styles.themeOptionDescription}>{theme.description}</Text>
            </View>
          </View>
          {themeMode === theme.value && (
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  tabContent: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#007AFF',
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
    color: '#1C1C1E',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  workoutsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  usernameSecondary: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  settingsCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
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
    color: '#1C1C1E',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#8E8E93',
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
    color: '#8E8E93',
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
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
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
    color: '#1C1C1E',
    marginBottom: 2,
  },
  themeOptionLabelActive: {
    color: '#007AFF',
  },
  themeOptionDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  guestBanner: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE5B4',
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
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestBannerText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  guestBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
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
    color: '#007AFF',
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
    color: '#8E8E93',
    lineHeight: 18,
  },
});