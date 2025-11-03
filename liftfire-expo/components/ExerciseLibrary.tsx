// Exercise Library Browser Component
// Displays searchable/filterable exercise list

import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useExercises } from '../hooks/useExercises';
import { ExerciseLibraryItem } from '../types';

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: ExerciseLibraryItem) => void;
  selectedExerciseIds?: string[];
}

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  onSelectExercise,
  selectedExerciseIds = [],
}) => {
  const {
    exercises,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    categories,
  } = useExercises();

  const renderExercise = ({ item }: { item: ExerciseLibraryItem }) => {
    const isSelected = selectedExerciseIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
        onPress={() => onSelectExercise?.(item)}
      >
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseDifficulty}>
            {'⭐'.repeat(item.difficulty)}
          </Text>
        </View>
        
        <Text style={styles.exerciseInstructions} numberOfLines={2}>
          {item.instructions}
        </Text>
        
        <View style={styles.exerciseTags}>
          <Text style={styles.tag}>{item.equipment}</Text>
          {item.muscle_groups.slice(0, 2).map((mg, idx) => (
            <Text key={idx} style={styles.tag}>{mg}</Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search exercises..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Category Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !categoryFilter && styles.filterChipActive]}
          onPress={() => setCategoryFilter(null)}
        >
          <Text style={styles.filterChipText}>All</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]}
            onPress={() => setCategoryFilter(cat)}
          >
            <Text style={styles.filterChipText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exercise List */}
      <FlatList
        data={exercises}
        renderItem={renderExercise}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No exercises found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    margin: 16,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  exerciseCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  exerciseCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f2ff',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  exerciseDifficulty: {
    fontSize: 14,
  },
  exerciseInstructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 32,
  },
});
