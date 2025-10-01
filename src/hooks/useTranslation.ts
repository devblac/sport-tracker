import { useTranslation as useI18nTranslation } from 'react-i18next';
import { getCurrentLanguage, type SupportedLanguage } from '@/utils/languageDetection';
import type { Exercise } from '@/types/exercise';
import type { Achievement } from '@/types/gamification';

/**
 * Enhanced translation hook with fitness-specific utilities
 */
export function useTranslation(namespace?: string) {
  const { t, i18n } = useI18nTranslation(namespace);
  const currentLanguage = getCurrentLanguage();

  /**
   * Translate exercise-related content
   */
  const translateExercise = {
    category: (category: string) => t(`exercises:categories.${category}`, { defaultValue: category }),
    bodyPart: (bodyPart: string) => t(`exercises:bodyParts.${bodyPart}`, { defaultValue: bodyPart }),
    muscleGroup: (muscleGroup: string) => t(`exercises:muscleGroups.${muscleGroup}`, { defaultValue: muscleGroup }),
    equipment: (equipment: string) => t(`exercises:equipment.${equipment}`, { defaultValue: equipment }),
    exerciseType: (type: string) => t(`exercises:exerciseTypes.${type}`, { defaultValue: type }),
    difficulty: (level: number) => t(`exercises:difficulty.${level}`, { defaultValue: `Level ${level}` }),
    setType: (type: string) => t(`exercises:setTypes.${type}`, { defaultValue: type }),
    tag: (tag: string) => t(`exercises:tags.${tag}`, { defaultValue: tag }),
    
    // Translate exercise name if available
    name: (exerciseName: string) => {
      const key = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      return t(`exercises:exerciseNames.${key}`, { defaultValue: exerciseName });
    },
  };

  /**
   * Translate achievement-related content
   */
  const translateAchievement = {
    category: (category: string) => t(`achievements:categories.${category}`, { defaultValue: category }),
    rarity: (rarity: string) => t(`achievements:rarity.${rarity}`, { defaultValue: rarity }),
    title: (title: string) => t(`achievements:titles.${title}`, { defaultValue: title }),
    status: (status: string) => t(`achievements:status.${status}`, { defaultValue: status }),
    
    // Translate achievement name and description
    achievement: (achievementId: string) => ({
      name: t(`achievements:achievements.${achievementId}.name`, { defaultValue: achievementId }),
      description: t(`achievements:achievements.${achievementId}.description`, { defaultValue: '' }),
    }),
  };

  /**
   * Translate time-related content with proper pluralization
   */
  const translateTime = {
    duration: (seconds: number) => {
      if (seconds < 60) {
        return t('time.seconds', { count: seconds });
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return t('time.minutes', { count: minutes });
      } else {
        const hours = Math.floor(seconds / 3600);
        return t('time.hours', { count: hours });
      }
    },
    
    relative: (date: Date | string) => {
      const d = new Date(date);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return diffInSeconds < 5 ? t('time.now') : t('time.ago', { time: `${diffInSeconds} ${t('time.seconds')}` });
      }
      
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return t('time.ago', { time: `${diffInMinutes} ${t('time.minutes')}` });
      }
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return t('time.ago', { time: `${diffInHours} ${t('time.hours')}` });
      }
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return t('time.ago', { time: `${diffInDays} ${t('time.days')}` });
      }
      
      return d.toLocaleDateString();
    },
  };

  /**
   * Translate units with proper formatting
   */
  const translateUnits = {
    weight: (value: number, unit: 'kg' | 'lbs' = 'kg') => 
      `${value.toLocaleString()} ${t(`units.${unit}`)}`,
    
    reps: (value: number) => 
      `${value} ${t('units.reps')}`,
    
    sets: (value: number) => 
      `${value} ${t('units.sets')}`,
    
    time: (seconds: number) => {
      if (seconds < 60) {
        return `${seconds} ${t('units.sec')}`;
      } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (remainingSeconds === 0) {
          return `${minutes} ${t('units.min')}`;
        }
        return `${minutes} ${t('units.min')} ${remainingSeconds} ${t('units.sec')}`;
      }
    },
  };

  /**
   * Get localized error messages
   */
  const getErrorMessage = (errorKey: string, fallback?: string) => {
    return t(`errors.${errorKey}`, { defaultValue: fallback || t('errors.generic') });
  };

  /**
   * Format numbers according to current locale
   */
  const formatNumber = (number: number) => {
    const localeMap = {
      es: 'es-ES',
      en: 'en-US',
      pt: 'pt-BR',
    };
    return number.toLocaleString(localeMap[currentLanguage]);
  };

  /**
   * Format dates according to current locale
   */
  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const d = new Date(date);
    const localeMap = {
      es: 'es-ES',
      en: 'en-US',
      pt: 'pt-BR',
    };
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    return d.toLocaleDateString(localeMap[currentLanguage], options || defaultOptions);
  };

  return {
    t,
    i18n,
    currentLanguage,
    translateExercise,
    translateAchievement,
    translateTime,
    translateUnits,
    getErrorMessage,
    formatNumber,
    formatDate,
  };
}

/**
 * Hook specifically for exercise translations
 */
export function useExerciseTranslation() {
  const { translateExercise, t } = useTranslation();
  
  const getLocalizedExercise = (exercise: Exercise) => ({
    ...exercise,
    localizedName: translateExercise.name(exercise.name),
    localizedCategory: translateExercise.category(exercise.category),
    localizedBodyParts: exercise.body_parts.map(translateExercise.bodyPart),
    localizedMuscleGroups: exercise.muscle_groups.map(translateExercise.muscleGroup),
    localizedEquipment: translateExercise.equipment(exercise.equipment),
    localizedDifficulty: translateExercise.difficulty(exercise.difficulty_level),
    localizedTags: exercise.tags?.map(translateExercise.tag) || [],
  });

  return {
    translateExercise,
    getLocalizedExercise,
    t,
  };
}

/**
 * Hook specifically for achievement translations
 */
export function useAchievementTranslation() {
  const { translateAchievement, t } = useTranslation();
  
  const getLocalizedAchievement = (achievement: Achievement) => {
    const translated = translateAchievement.achievement(achievement.id);
    return {
      ...achievement,
      localizedName: translated.name || achievement.name,
      localizedDescription: translated.description || achievement.description,
      localizedCategory: translateAchievement.category(achievement.category),
      localizedRarity: translateAchievement.rarity(achievement.rarity),
    };
  };

  return {
    translateAchievement,
    getLocalizedAchievement,
    t,
  };
}