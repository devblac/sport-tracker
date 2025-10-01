import i18n from '@/lib/i18n';
import { getCurrentLanguage, type SupportedLanguage } from '@/utils/languageDetection';
import type { Exercise } from '@/types/exercise';
import type { Achievement } from '@/types/gamification';

/**
 * Dynamic translation utilities for content that may not be pre-translated
 */

/**
 * Translate exercise content dynamically
 */
export function translateExerciseContent(exercise: Exercise): Exercise {
  const currentLang = getCurrentLanguage();
  
  // If already in Spanish (primary language), return as-is
  if (currentLang === 'es') {
    return exercise;
  }

  // Create a translated copy
  const translated: Exercise = { ...exercise };

  // Translate basic properties
  try {
    const nameKey = exercise.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const translatedName = i18n.t(`exercises:exerciseNames.${nameKey}`, { 
      defaultValue: exercise.name,
      lng: currentLang 
    });
    if (translatedName !== nameKey) {
      translated.name = translatedName;
    }

    // Translate category
    translated.category = i18n.t(`exercises:categories.${exercise.category}`, {
      defaultValue: exercise.category,
      lng: currentLang
    });

    // Translate body parts
    translated.body_parts = exercise.body_parts.map(part =>
      i18n.t(`exercises:bodyParts.${part}`, {
        defaultValue: part,
        lng: currentLang
      })
    );

    // Translate muscle groups
    translated.muscle_groups = exercise.muscle_groups.map(muscle =>
      i18n.t(`exercises:muscleGroups.${muscle}`, {
        defaultValue: muscle,
        lng: currentLang
      })
    );

    // Translate equipment
    translated.equipment = i18n.t(`exercises:equipment.${exercise.equipment}`, {
      defaultValue: exercise.equipment,
      lng: currentLang
    });

    // Translate tags if they exist
    if (exercise.tags) {
      translated.tags = exercise.tags.map(tag =>
        i18n.t(`exercises:tags.${tag}`, {
          defaultValue: tag,
          lng: currentLang
        })
      );
    }

    // Translate instructions if they exist
    if (exercise.instructions) {
      translated.instructions = exercise.instructions.map(instruction => ({
        ...instruction,
        instruction: translateInstructionText(instruction.instruction, currentLang)
      }));
    }

    // Translate tips if they exist
    if (exercise.tips) {
      translated.tips = exercise.tips.map(tip => ({
        ...tip,
        tip: translateTipText(tip.tip, currentLang),
        category: i18n.t(`exercises:tips.categories.${tip.category}`, {
          defaultValue: tip.category,
          lng: currentLang
        })
      }));
    }

  } catch (error) {
    console.warn('Error translating exercise content:', error);
    return exercise; // Return original if translation fails
  }

  return translated;
}

/**
 * Translate achievement content dynamically
 */
export function translateAchievementContent(achievement: Achievement): Achievement {
  const currentLang = getCurrentLanguage();
  
  // If already in Spanish (primary language), return as-is
  if (currentLang === 'es') {
    return achievement;
  }

  // Create a translated copy
  const translated: Achievement = { ...achievement };

  try {
    // Try to get pre-defined translations first
    const nameTranslation = i18n.t(`achievements:achievements.${achievement.id}.name`, {
      defaultValue: null,
      lng: currentLang
    });
    
    const descriptionTranslation = i18n.t(`achievements:achievements.${achievement.id}.description`, {
      defaultValue: null,
      lng: currentLang
    });

    if (nameTranslation) {
      translated.name = nameTranslation;
    }

    if (descriptionTranslation) {
      translated.description = descriptionTranslation;
    }

    // Translate category
    translated.category = i18n.t(`achievements:categories.${achievement.category}`, {
      defaultValue: achievement.category,
      lng: currentLang
    });

    // Translate rarity
    translated.rarity = i18n.t(`achievements:rarity.${achievement.rarity}`, {
      defaultValue: achievement.rarity,
      lng: currentLang
    }) as any;

    // Translate rewards title if it exists
    if (achievement.rewards?.title) {
      translated.rewards = {
        ...achievement.rewards,
        title: i18n.t(`achievements:titles.${achievement.rewards.title}`, {
          defaultValue: achievement.rewards.title,
          lng: currentLang
        })
      };
    }

  } catch (error) {
    console.warn('Error translating achievement content:', error);
    return achievement; // Return original if translation fails
  }

  return translated;
}

/**
 * Translate instruction text with common patterns
 */
function translateInstructionText(instruction: string, language: SupportedLanguage): string {
  // Common instruction patterns that can be translated
  const patterns = {
    en: {
      'Start in': 'Start in',
      'Lower your': 'Lower your',
      'Push back': 'Push back',
      'Keep your': 'Keep your',
      'Hold for': 'Hold for',
      'Return to': 'Return to',
      'Repeat': 'Repeat',
    },
    pt: {
      'Start in': 'Comece em',
      'Lower your': 'Abaixe seu',
      'Push back': 'Empurre de volta',
      'Keep your': 'Mantenha seu',
      'Hold for': 'Segure por',
      'Return to': 'Retorne para',
      'Repeat': 'Repita',
    }
  };

  if (language === 'es') return instruction;

  let translated = instruction;
  const languagePatterns = patterns[language];
  
  if (languagePatterns) {
    Object.entries(languagePatterns).forEach(([english, translation]) => {
      translated = translated.replace(new RegExp(english, 'gi'), translation);
    });
  }

  return translated;
}

/**
 * Translate tip text with common patterns
 */
function translateTipText(tip: string, language: SupportedLanguage): string {
  // Common tip patterns
  const patterns = {
    en: {
      'Keep': 'Keep',
      'Make sure': 'Make sure',
      'Avoid': 'Avoid',
      'Focus on': 'Focus on',
      'Remember to': 'Remember to',
    },
    pt: {
      'Keep': 'Mantenha',
      'Make sure': 'Certifique-se',
      'Avoid': 'Evite',
      'Focus on': 'Foque em',
      'Remember to': 'Lembre-se de',
    }
  };

  if (language === 'es') return tip;

  let translated = tip;
  const languagePatterns = patterns[language];
  
  if (languagePatterns) {
    Object.entries(languagePatterns).forEach(([english, translation]) => {
      translated = translated.replace(new RegExp(english, 'gi'), translation);
    });
  }

  return translated;
}

/**
 * Batch translate exercises
 */
export function translateExercises(exercises: Exercise[]): Exercise[] {
  return exercises.map(translateExerciseContent);
}

/**
 * Batch translate achievements
 */
export function translateAchievements(achievements: Achievement[]): Achievement[] {
  return achievements.map(translateAchievementContent);
}

/**
 * Get localized content for UI elements
 */
export function getLocalizedUIContent() {
  const currentLang = getCurrentLanguage();
  
  return {
    // Common UI elements
    loading: i18n.t('common.loading', { lng: currentLang }),
    error: i18n.t('common.error', { lng: currentLang }),
    success: i18n.t('common.success', { lng: currentLang }),
    save: i18n.t('common.save', { lng: currentLang }),
    cancel: i18n.t('common.cancel', { lng: currentLang }),
    
    // Navigation
    home: i18n.t('navigation.home', { lng: currentLang }),
    progress: i18n.t('navigation.progress', { lng: currentLang }),
    workout: i18n.t('navigation.workout', { lng: currentLang }),
    social: i18n.t('navigation.social', { lng: currentLang }),
    profile: i18n.t('navigation.profile', { lng: currentLang }),
    
    // Workout related
    startWorkout: i18n.t('workout.startWorkout', { lng: currentLang }),
    completeWorkout: i18n.t('workout.completeWorkout', { lng: currentLang }),
    addExercise: i18n.t('workout.addExercise', { lng: currentLang }),
    
    // Units
    kg: i18n.t('units.kg', { lng: currentLang }),
    reps: i18n.t('units.reps', { lng: currentLang }),
    sets: i18n.t('units.sets', { lng: currentLang }),
  };
}

/**
 * Format workout data with localized content
 */
export function formatWorkoutForDisplay(workout: any) {
  const ui = getLocalizedUIContent();
  
  return {
    ...workout,
    formattedDuration: workout.duration ? formatDuration(workout.duration) : '',
    formattedVolume: `${workout.totalVolume?.toLocaleString() || 0} ${ui.kg}`,
    exerciseCount: `${workout.exercises?.length || 0} ${workout.exercises?.length === 1 ? 'exercise' : 'exercises'}`,
  };
}

/**
 * Format duration in localized format
 */
function formatDuration(seconds: number): string {
  const currentLang = getCurrentLanguage();
  
  if (seconds < 60) {
    return i18n.t('time.seconds', { count: seconds, lng: currentLang });
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return i18n.t('time.minutes', { count: minutes, lng: currentLang });
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes === 0) {
      return i18n.t('time.hours', { count: hours, lng: currentLang });
    }
    return `${hours}h ${minutes}m`;
  }
}