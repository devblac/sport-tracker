// Hook for exercise library
// MVP: Static exercise library with search/filter

import { useState, useEffect, useMemo } from 'react';
import { DEFAULT_EXERCISES, searchExercises, getExercisesByCategory, getExercisesByMuscleGroup, getExercisesByEquipment } from '../lib/exercises';
import { ExerciseLibraryItem } from '../types';

export const useExercises = () => {
  const [exercises] = useState<ExerciseLibraryItem[]>(DEFAULT_EXERCISES);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  // Filtered exercises based on search and filters
  const filteredExercises = useMemo(() => {
    let result = exercises;

    // Apply search
    if (searchQuery.trim()) {
      result = searchExercises(searchQuery);
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter(ex => ex.category === categoryFilter);
    }

    // Apply muscle group filter
    if (muscleGroupFilter) {
      result = result.filter(ex => ex.muscle_groups.includes(muscleGroupFilter));
    }

    // Apply equipment filter
    if (equipmentFilter) {
      result = result.filter(ex => ex.equipment === equipmentFilter);
    }

    return result;
  }, [searchQuery, categoryFilter, muscleGroupFilter, equipmentFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(exercises.map(ex => ex.category)));
  }, [exercises]);

  // Get unique muscle groups
  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exercises.forEach(ex => {
      ex.muscle_groups.forEach(mg => groups.add(mg));
    });
    return Array.from(groups).sort();
  }, [exercises]);

  // Get unique equipment types
  const equipmentTypes = useMemo(() => {
    return Array.from(new Set(exercises.map(ex => ex.equipment)));
  }, [exercises]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter(null);
    setMuscleGroupFilter(null);
    setEquipmentFilter(null);
  };

  return {
    exercises: filteredExercises,
    allExercises: exercises,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    muscleGroupFilter,
    setMuscleGroupFilter,
    equipmentFilter,
    setEquipmentFilter,
    categories,
    muscleGroups,
    equipmentTypes,
    clearFilters,
  };
};
