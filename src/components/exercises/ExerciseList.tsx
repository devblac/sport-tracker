import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { ExerciseService } from '@/services/ExerciseService';
import { useAuthStore } from '@/stores';
import type { Exercise, BodyPart, ExerciseCategory } from '@/schemas/exercise';

interface ExerciseListProps {
  onExerciseSelect?: (exercise: Exercise) => void;
  showCreateButton?: boolean;
}

interface FilterState {
  bodyParts: BodyPart[];
  categories: string[];
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  onExerciseSelect,
  showCreateButton = true
}) => {
  const { user } = useAuthStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [archivedExercises, setArchivedExercises] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    bodyParts: [],
    categories: []
  });

  const exerciseService = ExerciseService.getInstance();

  // Body parts for filtering (matching Strong App)
  const bodyParts: Array<{ id: BodyPart; name: string }> = [
    { id: 'arms', name: 'Arms' },
    { id: 'back', name: 'Back' },
    { id: 'chest', name: 'Chest' },
    { id: 'core', name: 'Core' },
    { id: 'legs', name: 'Legs' },
    { id: 'shoulders', name: 'Shoulders' },
    { id: 'full_body', name: 'Full Body' }
  ];

  // Categories for filtering (matching Strong App)
  const categories: Array<{ id: string; name: string }> = [
    { id: 'barbell', name: 'Barbell' },
    { id: 'dumbbell', name: 'Dumbbell' },
    { id: 'machine', name: 'Machine/Other' },
    { id: 'bodyweight', name: 'Bodyweight' },
    { id: 'cable', name: 'Cable' },
    { id: 'cardio', name: 'Cardio' }
  ];

  useEffect(() => {
    const initializeAndLoad = async () => {
      // Initialize the service first
      await exerciseService.init();
      // Then load exercises
      await loadExercises();
      if (user) {
        await loadArchivedExercises();
      }
    };
    
    initializeAndLoad();
  }, [user]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const allExercises = await exerciseService.getAllExercises();
      console.log('Loaded exercises:', allExercises.length);
      setExercises(allExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
      // Set empty array on error to prevent infinite loading
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedExercises = async () => {
    if (!user) return;
    try {
      const archived = await exerciseService.getUserArchivedExercises(user.id);
      setArchivedExercises(archived);
    } catch (error) {
      console.error('Error loading archived exercises:', error);
    }
  };

  // Filter and search exercises
  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.instructions[0]?.instruction.toLowerCase().includes(query)
      );
    }

    // Apply body part filter
    if (filters.bodyParts.length > 0) {
      filtered = filtered.filter(exercise =>
        exercise.body_parts.some(bp => filters.bodyParts.includes(bp))
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(exercise =>
        filters.categories.includes(exercise.type as string)
      );
    }

    // Apply archived filter
    if (!showArchived) {
      filtered = filtered.filter(exercise => !archivedExercises.includes(exercise.id));
    }

    return filtered;
  }, [exercises, searchQuery, filters, showArchived, archivedExercises]);

  // Group exercises by first letter
  const groupedExercises = useMemo(() => {
    const groups: Record<string, Exercise[]> = {};
    
    filteredExercises.forEach(exercise => {
      const firstLetter = exercise.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(exercise);
    });

    // Sort groups alphabetically
    const sortedGroups: Array<{ letter: string; exercises: Exercise[] }> = [];
    Object.keys(groups).sort().forEach(letter => {
      sortedGroups.push({
        letter,
        exercises: groups[letter].sort((a, b) => a.name.localeCompare(b.name))
      });
    });

    return sortedGroups;
  }, [filteredExercises]);

  const handleToggleBodyPart = (bodyPart: BodyPart) => {
    setFilters(prev => ({
      ...prev,
      bodyParts: prev.bodyParts.includes(bodyPart)
        ? prev.bodyParts.filter(bp => bp !== bodyPart)
        : [...prev.bodyParts, bodyPart]
    }));
  };

  const handleToggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleToggleArchive = async (exerciseId: string) => {
    if (!user) return;
    
    const isCurrentlyArchived = archivedExercises.includes(exerciseId);
    const success = await exerciseService.toggleExerciseArchive(
      exerciseId, 
      user.id, 
      !isCurrentlyArchived
    );
    
    if (success) {
      setArchivedExercises(prev => 
        isCurrentlyArchived 
          ? prev.filter(id => id !== exerciseId)
          : [...prev, exerciseId]
      );
    }
  };

  const handleCreateExercise = async (exerciseData: { name: string; description: string }) => {
    if (!user) return;
    
    const newExercise = await exerciseService.createCustomExercise({
      name: exerciseData.name,
      description: exerciseData.description,
      difficulty_level: 2,
      category: 'strength',
      type: 'bodyweight',
      body_parts: ['full_body'],
      muscle_groups: [],
      equipment: 'none',
      instructions: [{ step_number: 1, instruction: exerciseData.description }]
    }, user.id);
    
    if (newExercise) {
      setExercises(prev => [...prev, newExercise]);
      setShowCreateModal(false);
    }
  };

  const getExerciseIcon = (exercise: Exercise) => {
    // Simple icon mapping based on equipment/type
    const iconMap: Record<string, string> = {
      barbell: '🏋️',
      dumbbell: '🏋️',
      machine: '🏗️',
      bodyweight: '🤸',
      cable: '🔗',
      cardio: '❤️'
    };
    return iconMap[exercise.type] || iconMap[exercise.equipment as string] || '💪';
  };

  const getBodyPartName = (bodyParts: BodyPart[]) => {
    if (bodyParts.length === 0) return 'Full Body';
    if (bodyParts.length === 1) {
      const bodyPartNames: Record<BodyPart, string> = {
        chest: 'Chest',
        back: 'Back',
        shoulders: 'Shoulders',
        arms: 'Arms',
        biceps: 'Biceps',
        triceps: 'Triceps',
        forearms: 'Forearms',
        abs: 'Abs',
        core: 'Core',
        legs: 'Legs',
        quadriceps: 'Quadriceps',
        hamstrings: 'Hamstrings',
        glutes: 'Glutes',
        calves: 'Calves',
        full_body: 'Full Body'
      };
      return bodyPartNames[bodyParts[0]] || 'Unknown';
    }
    return 'Multiple';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Exercises</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${
              showSearch ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2 rounded-lg transition-colors ${
              showFilter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                const dropdown = document.getElementById('exercise-options-dropdown');
                if (dropdown) {
                  dropdown.classList.toggle('hidden');
                }
              }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {/* Options Dropdown */}
            <div 
              id="exercise-options-dropdown"
              className="hidden absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-20"
            >
              <div className="py-1">
                {showCreateButton && (
                  <button
                    onClick={() => {
                      setShowCreateModal(true);
                      document.getElementById('exercise-options-dropdown')?.classList.add('hidden');
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Plus className="w-4 h-4" />
                    Create Exercise
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowArchived(!showArchived);
                    document.getElementById('exercise-options-dropdown')?.classList.add('hidden');
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                >
                  {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showArchived ? 'Hide archived' : 'Show archived'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            style={{ backgroundColor: '#1F2937' }}
            autoFocus
          />
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-medium text-foreground mb-2">Body part</h3>
            <div className="flex flex-wrap gap-2">
              {bodyParts.map(bodyPart => (
                <button
                  key={bodyPart.id}
                  onClick={() => handleToggleBodyPart(bodyPart.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.bodyParts.includes(bodyPart.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {bodyPart.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-2">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleToggleCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.categories.includes(category.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {(filters.bodyParts.length > 0 || filters.categories.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ bodyParts: [], categories: [] })}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Exercise List */}
      <div className="space-y-1 -mx-4" style={{ backgroundColor: '#1F2937' }}>
        {groupedExercises.map(group => (
          <div key={group.letter}>
            {/* Letter Header */}
            <div className="sticky top-0 backdrop-blur-sm py-3 px-4" style={{ backgroundColor: '#1F2937' }}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{group.letter}</h3>
            </div>
            
            {/* Exercises in this group */}
            {group.exercises.map(exercise => (
              <div
                key={exercise.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  archivedExercises.includes(exercise.id) ? 'opacity-60' : ''
                }`}
                onClick={() => onExerciseSelect?.(exercise)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getExerciseIcon(exercise)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{exercise.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {getBodyPartName(exercise.body_parts)}
                    </div>
                  </div>
                </div>
                
                {/* Only show three dots for custom exercises */}
                {exercise.is_custom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleArchive(exercise.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No exercises found</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          )}
        </div>
      )}

      {/* Create Exercise Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create Exercise</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              
              if (name.trim()) {
                handleCreateExercise({ name: name.trim(), description: description.trim() });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Exercise Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g., My Custom Exercise"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Describe how to perform this exercise..."
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};