import React, { useState } from 'react';
import { Card, CardContent, Badge } from '@/components/ui';
import { Play, Pause, RotateCcw, AlertTriangle, Info, Target, Lightbulb } from 'lucide-react';
import type { Exercise } from '@/types';
import { 
  getDifficultyDisplay, 
  getEquipmentDisplay, 
  getBodyPartDisplay,
  getMuscleGroupDisplay,
  EXERCISE_CATEGORIES,
  EQUIPMENT_CATEGORIES 
} from '@/utils';

interface ExerciseAboutTabProps {
  exercise: Exercise;
}

export const ExerciseAboutTab: React.FC<ExerciseAboutTabProps> = ({ exercise }) => {
  const [isGifPlaying, setIsGifPlaying] = useState(true);
  const categoryInfo = EXERCISE_CATEGORIES[exercise.category] || { name: exercise.category, icon: '💪' };
  const equipmentInfo = EQUIPMENT_CATEGORIES[exercise.equipment] || { name: exercise.equipment, icon: '🏋️' };

  const toggleGif = () => {
    setIsGifPlaying(!isGifPlaying);
  };

  return (
    <div className="space-y-6">
      {/* Exercise Media */}
      {exercise.gif_url && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {exercise.gif_url ? (
                  <img
                    src={exercise.gif_url}
                    alt={`${exercise.name} demonstration`}
                    className="w-full h-full object-cover"
                    style={{ 
                      animationPlayState: isGifPlaying ? 'running' : 'paused' 
                    }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">🎬</div>
                    <p>Animation not available</p>
                  </div>
                )}
              </div>
              
              {/* GIF Controls */}
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={toggleGif}
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  {isGifPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    // Force GIF restart by changing src
                    const img = document.querySelector(`img[alt="${exercise.name} demonstration"]`) as HTMLImageElement;
                    if (img) {
                      const src = img.src;
                      img.src = '';
                      img.src = src;
                    }
                  }}
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Information */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Exercise Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryInfo.icon}</span>
                  <span className="font-medium">{categoryInfo.name}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Equipment</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{equipmentInfo.icon}</span>
                  <span className="font-medium">{getEquipmentDisplay(exercise.equipment)}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
                <Badge 
                  variant={exercise.difficulty_level <= 2 ? 'secondary' : 
                          exercise.difficulty_level <= 3 ? 'default' : 'outline'}
                  className={exercise.difficulty_level >= 4 ? 'border-orange-500 text-orange-600 dark:text-orange-400' : ''}
                >
                  {getDifficultyDisplay(exercise.difficulty_level)}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type</p>
                <Badge variant="outline" className="capitalize">
                  {exercise.type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Body Parts & Muscles */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Target Muscles</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Body Parts</p>
                <div className="flex flex-wrap gap-1">
                  {exercise.body_parts.map((bodyPart) => (
                    <Badge key={bodyPart} variant="secondary" className="text-xs">
                      {getBodyPartDisplay(bodyPart)}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Muscle Groups</p>
                <div className="flex flex-wrap gap-1">
                  {exercise.muscle_groups.map((muscle) => (
                    <Badge key={muscle} variant="outline" className="text-xs">
                      {getMuscleGroupDisplay(muscle)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Default Sets/Reps */}
          {(exercise.default_sets || exercise.default_reps) && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Recommended</p>
              <div className="flex gap-4 text-sm">
                {exercise.default_sets && (
                  <div>
                    <span className="text-muted-foreground">Sets: </span>
                    <span className="font-medium">{exercise.default_sets}</span>
                  </div>
                )}
                {exercise.default_reps && (
                  <div>
                    <span className="text-muted-foreground">Reps: </span>
                    <span className="font-medium">{exercise.default_reps}</span>
                  </div>
                )}
                {exercise.default_rest_time && (
                  <div>
                    <span className="text-muted-foreground">Rest: </span>
                    <span className="font-medium">{exercise.default_rest_time}s</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {exercise.instructions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              How to Perform
            </h3>
            
            <div className="space-y-3">
              {exercise.instructions.map((instruction) => (
                <div key={instruction.step_number} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {instruction.step_number}
                  </div>
                  <p className="text-sm text-foreground pt-0.5">{instruction.instruction}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {exercise.tips.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Tips & Form Cues
            </h3>
            
            <div className="space-y-3">
              {exercise.tips.map((tip, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs">
                    {tip.category === 'form' && '📐'}
                    {tip.category === 'breathing' && '💨'}
                    {tip.category === 'safety' && '⚠️'}
                    {tip.category === 'progression' && '📈'}
                    {tip.category === 'common_mistakes' && '❌'}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground capitalize mb-1">{tip.category.replace('_', ' ')}</p>
                    <p className="text-sm text-foreground">{tip.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variations */}
      {exercise.variations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Variations</h3>
            
            <div className="space-y-3">
              {exercise.variations.map((variation, index) => (
                <div key={index} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{variation.name}</h4>
                    <Badge 
                      variant={variation.difficulty_modifier < 0 ? 'secondary' : 
                              variation.difficulty_modifier === 0 ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {variation.difficulty_modifier < 0 ? 'Easier' : 
                       variation.difficulty_modifier === 0 ? 'Same' : 'Harder'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{variation.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Notes */}
      {(exercise.safety_notes.length > 0 || exercise.contraindications.length > 0) && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Safety Information
            </h3>
            
            {exercise.safety_notes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">Safety Notes</p>
                <ul className="space-y-1">
                  {exercise.safety_notes.map((note, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {exercise.contraindications.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Contraindications</p>
                <ul className="space-y-1">
                  {exercise.contraindications.map((contraindication, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-500 mt-1">⚠</span>
                      {contraindication}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {exercise.tags.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {exercise.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};