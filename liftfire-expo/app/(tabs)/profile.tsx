import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useGamification } from '../../hooks/useGamification';
import { useTheme } from '../../hooks/useTheme';
import { XPBar } from '../../components/XPBar';
import { StreakDisplay } from '../../components/StreakDisplay';
import { AchievementGrid } from '../../components/AchievementBadge';
import { getAllAchievements } from '../../lib/achievements';

type TabType = 'overview' | 'settings';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
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
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
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
      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getUserInitial()}</Text>
        </View>
        <Text style={styles.username}>{user?.email || 'User'}</Text>
        <Text style={styles.levelText}>
          Level {level} • {xp} XP
        </Text>
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
            <Ionicons name="cloud-outline" size={24} color="#007AFF" />
            <Text style={styles.settingsItemText}>Sync Status</Text>
          </View>
          <View style={styles.settingsItemRight}>
            <Text style={styles.settingValue}>Active</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
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
});