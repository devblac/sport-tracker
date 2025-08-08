import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { Button } from '@/components/ui';
import { ChevronUp, ChevronDown, Grid, List as ListIcon } from 'lucide-react';
import type { Exercise } from '@/schemas/exercise';

// Lazy load react-window to handle potential import issues
let FixedSizeList: any = null;
try {
  const reactWindow = require('react-window');
  FixedSizeList = reactWindow.FixedSizeList;
} catch (error) {
  console.warn('react-window not available, using fallback rendering');
}

interface ExerciseListProps {
  exercises: Exercise[];
  onExerciseClick?: (exercise: Exercise) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
  itemHeight?: number;
  showViewToggle?: boolean;
}

type SortOption = 'name' | 'difficulty' | 'category' | 'created_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  onExerciseClick,
  loading = false,
  error = null,
  className = '',
  itemHeight = 200,
  showViewToggle = true,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [listHeight, setListHeight] = useState(600);

  // Update list height based on window size
  useEffect(() => {
    const updateHeight = () => {
      const windowHeight = window.innerHeight;
      const headerHeight = 200; // Approximate header + search height
      const footerHeight = 100; // Approximate footer height
      const availableHeight = windowHeight - headerHeight - footerHeight;
      setListHeight(Math.max(400, availableHeight));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Sort exercises
  const sortedExercises = useMemo(() => {
    const sorted = [...exercises].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'difficulty':
          aValue = a.difficulty_level;
          bValue = b.difficulty_level;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'created_at':
          aValue = a.created_at.getTime();
          bValue = b.created_at.getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [exercises, sortBy, sortDirection]);

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return null;
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4" /> :
      <ChevronDown className="w-4 h-4" />;
  };

  // Virtualized list item renderer
  const ListItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const exercise = sortedExercises[index];

    return (
      <div style={style} className="px-2 py-1">
        <ExerciseCard
          exercise={exercise}
          onClick={onExerciseClick}
          showDetails={viewMode === 'list'}
          className="h-full"
        />
      </div>
    );
  }, [sortedExercises, onExerciseClick, viewMode]);

  // Fallback list view without virtualization
  const SimpleListView = () => (
    <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-lg p-2">
      {sortedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onClick={onExerciseClick}
          showDetails={true}
        />
      ))}
    </div>
  );

  // Grid view renderer (compact cards for better density)
  const GridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {sortedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onClick={onExerciseClick}
          showDetails={false}
          compact={false}
        />
      ))}
    </div>
  );

  // Compact list view (like STRONG app)
  const CompactListView = () => (
    <div className="border border-border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm">
      {sortedExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onClick={onExerciseClick}
          compact={true}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading exercises...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-12">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Exercises</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-12">
          <div className="text-muted-foreground text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Exercises Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters to find exercises.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('name')}
            className="flex items-center gap-1"
          >
            Name
            {getSortIcon('name')}
          </Button>
          <Button
            variant={sortBy === 'difficulty' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('difficulty')}
            className="flex items-center gap-1"
          >
            Difficulty
            {getSortIcon('difficulty')}
          </Button>
          <Button
            variant={sortBy === 'category' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('category')}
            className="flex items-center gap-1"
          >
            Category
            {getSortIcon('category')}
          </Button>
        </div>

        {/* View Toggle & Results Count */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {sortedExercises.length} exercise{sortedExercises.length !== 1 ? 's' : ''}
          </span>

          {showViewToggle && (
            <div className="flex items-center border border-border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none border-r"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Exercise List/Grid */}
      {viewMode === 'grid' ? (
        <GridView />
      ) : (
        <CompactListView />
      )}
    </div>
  );
};