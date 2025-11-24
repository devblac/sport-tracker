import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { PersonalRecord } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PRBadge } from '../../components/PRBadge';

type FilterType = 'all' | '7days' | '30days' | '90days' | 'year';

export default function PersonalRecordsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<FilterType>('all');

  // Load PRs on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPRs();
    } else {
      setLoading(false);
      setError('Please sign in to view personal records');
    }
  }, [isAuthenticated, user]);

  const loadPRs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPRs(data || []);
    } catch (err) {
      console.error('[PersonalRecords] Failed to load PRs:', err);
      setError('Failed to load personal records');
    } finally {
      setLoading(false);
    }
  };

  // Filter PRs by time period
  const getFilteredByTime = (records: PersonalRecord[]): PersonalRecord[] => {
    if (timeFilter === 'all') return records;

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeFilter) {
      case '7days':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return records.filter(pr => new Date(pr.achieved_at) >= cutoffDate);
  };

  // Filter PRs by search query
  const getFilteredBySearch = (records: PersonalRecord[]): PersonalRecord[] => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();
    return records.filter(pr =>
      pr.exercise_name.toLowerCase().includes(query)
    );
  };

  // Group PRs by exercise (showing only the best for each)
  const groupedPRs = useMemo(() => {
    const timeFiltered = getFilteredByTime(prs);
    const searchFiltered = getFilteredBySearch(timeFiltered);

    // Group by exercise_id and keep only the best (highest 1RM)
    const grouped = new Map<string, PersonalRecord>();

    searchFiltered.forEach(pr => {
      const existing = grouped.get(pr.exercise_id);
      if (!existing || pr.estimated_1rm > existing.estimated_1rm) {
        grouped.set(pr.exercise_id, pr);
      }
    });

    // Convert to array and sort by 1RM descending
    return Array.from(grouped.values()).sort(
      (a, b) => b.estimated_1rm - a.estimated_1rm
    );
  }, [prs, searchQuery, timeFilter]);

  // Calculate total PRs
  const totalPRs = prs.length;
  const uniqueExercises = new Set(prs.map(pr => pr.exercise_id)).size;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner message="Loading personal records..." fullScreen />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorMessage
          message={error}
          onRetry={loadPRs}
          fullScreen
        />
      </SafeAreaView>
    );
  }

  const timeFilters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' },
    { value: 'year', label: '1 Year' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Personal Records</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {totalPRs} total PRs • {uniqueExercises} exercises
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Time Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {timeFilters.map(filter => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              { backgroundColor: colors.card, borderColor: colors.border },
              timeFilter === filter.value && [
                styles.filterChipActive,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ],
            ]}
            onPress={() => setTimeFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: colors.text },
                timeFilter === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* PR List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {groupedPRs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery ? 'No PRs Found' : 'No Personal Records Yet'}
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Complete workouts with weights to set your first PR!'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/workout/new')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Start Workout</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          groupedPRs.map((pr, index) => (
            <PRCard
              key={pr.id}
              pr={pr}
              rank={index + 1}
              colors={colors}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// PR Card Component
interface PRCardProps {
  pr: PersonalRecord;
  rank: number;
  colors: any;
}

function PRCard({ pr, rank, colors }: PRCardProps) {
  const formattedDate = new Date(pr.achieved_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={[styles.prCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Rank Badge */}
      <View style={styles.prCardHeader}>
        <View style={[styles.rankBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.rankText, { color: colors.primary }]}>#{rank}</Text>
        </View>
        <PRBadge isNewPR={false} size="small" />
      </View>

      {/* Exercise Name */}
      <Text style={[styles.exerciseName, { color: colors.text }]}>{pr.exercise_name}</Text>

      {/* PR Details */}
      <View style={styles.prDetails}>
        <View style={styles.prDetailItem}>
          <Text style={[styles.prDetailLabel, { color: colors.textSecondary }]}>Weight</Text>
          <Text style={[styles.prDetailValue, { color: colors.text }]}>
            {pr.weight} {pr.weight === 1 ? 'lb' : 'lbs'}
          </Text>
        </View>

        <View style={styles.prDetailItem}>
          <Text style={[styles.prDetailLabel, { color: colors.textSecondary }]}>Reps</Text>
          <Text style={[styles.prDetailValue, { color: colors.text }]}>{pr.reps}</Text>
        </View>

        <View style={styles.prDetailItem}>
          <Text style={[styles.prDetailLabel, { color: colors.textSecondary }]}>Est. 1RM</Text>
          <Text style={[styles.prDetailValue, { color: colors.primary }]}>
            {pr.estimated_1rm.toFixed(1)} lbs
          </Text>
        </View>
      </View>

      {/* Date */}
      <View style={styles.prFooter}>
        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.prDate, { color: colors.textSecondary }]}>{formattedDate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipActive: {
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  prCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  prCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  prDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  prDetailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  prDetailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  prFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prDate: {
    fontSize: 12,
  },
});
