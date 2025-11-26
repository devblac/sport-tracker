/**
 * CelebrationModal Example Usage
 * 
 * This file demonstrates how to use the CelebrationModal component
 * for different celebration types.
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { CelebrationModal } from './CelebrationModal';

export const CelebrationModalExample: React.FC = () => {
  const [prVisible, setPrVisible] = useState(false);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [achievementVisible, setAchievementVisible] = useState(false);
  const [streakVisible, setStreakVisible] = useState(false);
  const [planCompleteVisible, setPlanCompleteVisible] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Celebration Modal Examples</Text>

        {/* PR Celebration */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FFD700' }]}
          onPress={() => setPrVisible(true)}
        >
          <Text style={styles.buttonText}>Show PR Celebration</Text>
        </TouchableOpacity>

        <CelebrationModal
          visible={prVisible}
          type="pr"
          title="New Personal Record!"
          message="You just set a new PR on Bench Press with 225 lbs!"
          icon="trophy"
          xpBonus={50}
          onClose={() => setPrVisible(false)}
        />

        {/* Level Up Celebration */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#9013FE' }]}
          onPress={() => setLevelUpVisible(true)}
        >
          <Text style={styles.buttonText}>Show Level Up</Text>
        </TouchableOpacity>

        <CelebrationModal
          visible={levelUpVisible}
          type="level-up"
          title="Level Up!"
          message="Congratulations! You've reached Level 10!"
          icon="trending-up"
          xpBonus={100}
          onClose={() => setLevelUpVisible(false)}
        />

        {/* Achievement Celebration */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FFA500' }]}
          onPress={() => setAchievementVisible(true)}
        >
          <Text style={styles.buttonText}>Show Achievement</Text>
        </TouchableOpacity>

        <CelebrationModal
          visible={achievementVisible}
          type="achievement"
          title="Achievement Unlocked!"
          message="First Workout - You completed your first workout!"
          icon="medal"
          onClose={() => setAchievementVisible(false)}
        />

        {/* Streak Celebration */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF6B35' }]}
          onPress={() => setStreakVisible(true)}
        >
          <Text style={styles.buttonText}>Show Streak Milestone</Text>
        </TouchableOpacity>

        <CelebrationModal
          visible={streakVisible}
          type="streak"
          title="7 Day Streak!"
          message="Amazing! You've worked out 7 days in a row!"
          icon="flame"
          xpBonus={75}
          onClose={() => setStreakVisible(false)}
        />

        {/* Plan Complete Celebration */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#7ED321' }]}
          onPress={() => setPlanCompleteVisible(true)}
        >
          <Text style={styles.buttonText}>Show Plan Complete</Text>
        </TouchableOpacity>

        <CelebrationModal
          visible={planCompleteVisible}
          type="plan-complete"
          title="Plan Completed!"
          message="You finished the Beginner Full Body program!"
          icon="checkmark-circle"
          xpBonus={200}
          onClose={() => setPlanCompleteVisible(false)}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
