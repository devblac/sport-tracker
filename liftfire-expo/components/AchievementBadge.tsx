/**
 * Achievement Badge Component
 * 
 * Displays an achievement with icon, title, and unlock status
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Achievement } from '../types';

interface AchievementBadgeProps {
  achievement: Achievement;
  icon?: string;
  locked?: boolean;
}

export function AchievementBadge({ achievement, icon = '🏆', locked = false }: AchievementBadgeProps) {
  return (
    <View style={[styles.container, locked && styles.lockedContainer]}>
      <View style={[styles.iconContainer, locked && styles.lockedIconContainer]}>
        <Text style={styles.icon}>{locked ? '🔒' : icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, locked && styles.lockedText]}>
          {achievement.title}
        </Text>
        {achievement.description && (
          <Text style={[styles.description, locked && styles.lockedText]}>
            {achievement.description}
          </Text>
        )}
        {!locked && achievement.unlocked_at && (
          <Text style={styles.unlockedDate}>
            Unlocked {formatDate(achievement.unlocked_at)}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Achievement Grid Component
 * 
 * Displays multiple achievements in a grid layout
 */
interface AchievementGridProps {
  achievements: Achievement[];
  icons?: Record<string, string>;
  lockedAchievements?: Array<{ type: string; title: string; description: string; icon: string }>;
}

export function AchievementGrid({ achievements, icons = {}, lockedAchievements = [] }: AchievementGridProps) {
  return (
    <View style={styles.grid}>
      {/* Unlocked achievements */}
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          icon={icons[achievement.achievement_type] || '🏆'}
          locked={false}
        />
      ))}

      {/* Locked achievements */}
      {lockedAchievements.map((achievement) => (
        <AchievementBadge
          key={achievement.type}
          achievement={{
            id: achievement.type,
            user_id: '',
            achievement_type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            unlocked_at: '',
          }}
          icon={achievement.icon}
          locked={true}
        />
      ))}
    </View>
  );
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedContainer: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    opacity: 0.6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lockedIconContainer: {
    backgroundColor: '#e0e0e0',
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lockedText: {
    color: '#999',
  },
  unlockedDate: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  grid: {
    padding: 8,
  },
});
