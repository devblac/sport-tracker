import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input, Button, Card, CardContent, Badge } from '@/components/ui';
import type { ExerciseFilter, ExerciseCategory, BodyPart, Equipment, DifficultyLevel } from '@/types';

// Import utilities with error handling
let EXERCISE_CATEGORIES: any = {};
let BODY_PARTS: any = {};
let EQUIPMENT_CATEGORIES: any = {};
let getDifficultyDisplay: any = (level: number) => `Level ${level}`;
let getBodyPartDisplay: any = (part: string) => part;
let getEquipmentDisplay: any = (equipment: string) => equipment;

try {
  const utils = require('@/utils');
  EXERCISE_CATEGORIES = utils.EXERCISE_CATEGORIES || {};
  BODY_PARTS = utils.BODY_PARTS || {};
  EQUIPMENT_CATEGORIES = utils.EQUIPMENT_CATEGORIES || {};
  getDifficultyDisplay = utils.getDifficultyDisplay || getDifficultyDisplay;
  getBodyPartDisplay = utils.getBodyPartDisplay || getBodyPartDisplay;
  getEquipmentDisplay = utils.getEquipmentDisplay || getEquipmentDisplay;
} catch (error) {
  console.warn('Could not load exercise utilities, using fallbacks');
}

interface ExerciseSearchProps {
  onFiltersChange: (filters: ExerciseFilter) => void;
  initialFilters?: ExerciseFilter;
  className?: string;
}

export const ExerciseSearch: React.FC<ExerciseSearchProps> = ({
  onFiltersChange,
  initialFilters = {},
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | undefined>(initialFilters.category);
  const [selectedBodyParts, setSelectedBodyParts] = useState<BodyPart[]>(initialFilters.body_parts || []);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>(initialFilters.equipment || []);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel[]>(initialFilters.difficulty_level || []);
  const [showCustomOnly, setShowCustomOnly] = useState(initialFilters.is_custom || false);

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build filters object
  const filters = useMemo((): ExerciseFilter => {
    const result: ExerciseFilter = {};
    
    if (debouncedSearchTerm.trim()) {
      result.search = debouncedSearchTerm.trim();
    }
    
    if (selectedCategory) {
      result.category = selectedCategory;
    }
    
    if (selectedBodyParts.length > 0) {
      result.body_parts = selectedBodyParts;
    }
    
    if (selectedEquipment.length > 0) {
      result.equipment = selectedEquipment;
    }
    
    if (selectedDifficulty.length > 0) {
      result.difficulty_level = selectedDifficulty;
    }
    
    if (showCustomOnly) {
      result.is_custom = true;
    }
    
    return result;
  }, [debouncedSearchTerm, selectedCategory, selectedBodyParts, selectedEquipment, selectedDifficulty, showCustomOnly]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedBodyParts.length > 0) count++;
    if (selectedEquipment.length > 0) count++;
    if (selectedDifficulty.length > 0) count++;
    if (showCustomOnly) count++;
    return count;
  }, [selectedCategory, selectedBodyParts, selectedEquipment, selectedDifficulty, showCustomOnly]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(undefined);
    setSelectedBodyParts([]);
    setSelectedEquipment([]);
    setSelectedDifficulty([]);
    setShowCustomOnly(false);
  };

  const toggleBodyPart = (bodyPart: BodyPart) => {
    setSelectedBodyParts(prev => 
      prev.includes(bodyPart) 
        ? prev.filter(bp => bp !== bodyPart)
        : [...prev, bodyPart]
    );
  };

  const toggleEquipment = (equipment: Equipment) => {
    setSelectedEquipment(prev => 
      prev.includes(equipment) 
        ? prev.filter(eq => eq !== equipment)
        : [...prev, equipment]
    );
  };

  const toggleDifficulty = (difficulty: DifficultyLevel) => {
    setSelectedDifficulty(prev => 
      prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-12"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle & Active Filters */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <Badge variant="default" className="flex items-center gap-1">
              {EXERCISE_CATEGORIES[selectedCategory]?.icon || '💪'}
              {EXERCISE_CATEGORIES[selectedCategory]?.name || selectedCategory}
              <button
                onClick={() => setSelectedCategory(undefined)}
                className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {selectedBodyParts.map(bodyPart => (
            <Badge key={bodyPart} variant="secondary" className="flex items-center gap-1">
              {getBodyPartDisplay(bodyPart)}
              <button
                onClick={() => toggleBodyPart(bodyPart)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          
          {selectedEquipment.map(equipment => (
            <Badge key={equipment} variant="outline" className="flex items-center gap-1">
              {EQUIPMENT_CATEGORIES[equipment]?.icon || '🏋️'}
              {getEquipmentDisplay(equipment)}
              <button
                onClick={() => toggleEquipment(equipment)}
                className="ml-1 hover:bg-accent rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          
          {selectedDifficulty.map(difficulty => (
            <Badge key={difficulty} variant="destructive" className="flex items-center gap-1">
              {getDifficultyDisplay(difficulty)}
              <button
                onClick={() => toggleDifficulty(difficulty)}
                className="ml-1 hover:bg-destructive-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          
          {showCustomOnly && (
            <Badge variant="default" className="flex items-center gap-1">
              Custom Only
              <button
                onClick={() => setShowCustomOnly(false)}
                className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-6">
            {/* Category Filter */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Category</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(EXERCISE_CATEGORIES).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(
                      selectedCategory === key ? undefined : key as ExerciseCategory
                    )}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedCategory === key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Body Parts Filter */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Body Parts</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(BODY_PARTS).map(([key, bodyPart]) => (
                  <button
                    key={key}
                    onClick={() => toggleBodyPart(key as BodyPart)}
                    className={`px-3 py-2 rounded-full text-sm transition-colors ${
                      selectedBodyParts.includes(key as BodyPart)
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {bodyPart.icon} {bodyPart.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Filter */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Equipment</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {Object.entries(EQUIPMENT_CATEGORIES).map(([key, equipment]) => (
                  <button
                    key={key}
                    onClick={() => toggleEquipment(key as Equipment)}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      selectedEquipment.includes(key as Equipment)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{equipment?.icon || '🏋️'}</span>
                      <span className="text-sm font-medium truncate">{equipment?.name || key}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Difficulty</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { levels: [1, 2], label: 'Beginner' },
                  { levels: [3], label: 'Intermediate' },
                  { levels: [4, 5], label: 'Advanced' }
                ].map((group) => (
                  <button
                    key={group.label}
                    onClick={() => {
                      // Toggle all levels in this group
                      const hasAny = group.levels.some(level => selectedDifficulty.includes(level as DifficultyLevel));
                      if (hasAny) {
                        // Remove all levels in this group
                        setSelectedDifficulty(prev => prev.filter(level => !group.levels.includes(level)));
                      } else {
                        // Add all levels in this group
                        setSelectedDifficulty(prev => [...prev, ...group.levels as DifficultyLevel[]]);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg border transition-colors text-sm flex-shrink-0 ${
                      group.levels.some(level => selectedDifficulty.includes(level as DifficultyLevel))
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Exercises Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCustomOnly}
                  onChange={(e) => setShowCustomOnly(e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm font-medium text-foreground">
                  Show custom exercises only
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};