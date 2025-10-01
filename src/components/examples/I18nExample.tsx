import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Globe, Dumbbell, Trophy, Users } from 'lucide-react';

/**
 * Example component demonstrating the i18n system
 */
export function I18nExample() {
  const { t, translateExercise, translateAchievement, formatNumber, formatDate } = useTranslation();

  // Example data
  const sampleExercise = {
    name: 'Push-ups',
    category: 'strength',
    bodyParts: ['chest', 'arms'],
    muscleGroups: ['pectorals', 'triceps_brachii'],
    equipment: 'none',
    difficulty: 2,
  };

  const sampleAchievement = {
    id: 'streak_7_days',
    category: 'consistency',
    rarity: 'uncommon',
  };

  const currentDate = new Date();
  const sampleNumber = 1234.56;

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('profile.language')} - Internationalization Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>{t('profile.language')}:</span>
            <LanguageSelector variant="buttons" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Navigation Demo */}
        <Card>
          <CardHeader>
            <CardTitle>{t('navigation.home')} - Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span>🏠</span>
              <span>{t('navigation.home')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>{t('navigation.progress')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span>{t('navigation.workout')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{t('navigation.social')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span>{t('navigation.profile')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Workout Demo */}
        <Card>
          <CardHeader>
            <CardTitle>{t('workout.workout')} - Workout Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>{t('workout.startWorkout')}</div>
            <div>{t('workout.completeWorkout')}</div>
            <div>{t('workout.addExercise')}</div>
            <div>{t('workout.sets')}: 3</div>
            <div>{t('workout.reps')}: 12</div>
            <div>{t('workout.weight')}: 50 {t('units.kg')}</div>
            <div>{t('workout.restTime')}: 60 {t('units.sec')}</div>
          </CardContent>
        </Card>

        {/* Exercise Demo */}
        <Card>
          <CardHeader>
            <CardTitle>{t('exercises.search')} - Exercise Translation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>{t('exercises.exerciseNames.push_ups', { defaultValue: sampleExercise.name })}:</strong>
            </div>
            <div>{t('exercises.category')}: {translateExercise.category(sampleExercise.category)}</div>
            <div>{t('exercises.equipment')}: {translateExercise.equipment(sampleExercise.equipment)}</div>
            <div>{t('exercises.difficulty')}: {translateExercise.difficulty(sampleExercise.difficulty)}</div>
            <div>
              {t('exercises.bodyParts')}: {sampleExercise.bodyParts.map(translateExercise.bodyPart).join(', ')}
            </div>
            <div>
              {t('exercises.muscleGroups')}: {sampleExercise.muscleGroups.map(translateExercise.muscleGroup).join(', ')}
            </div>
          </CardContent>
        </Card>

        {/* Achievement Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {t('gamification.achievements')} - Achievement Translation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>{t(`achievements:achievements.${sampleAchievement.id}.name`, { defaultValue: 'Week Warrior' })}:</strong>
            </div>
            <div>{t(`achievements:achievements.${sampleAchievement.id}.description`, { defaultValue: 'Maintain a 7-day workout streak' })}</div>
            <div>{t('achievements.category')}: {translateAchievement.category(sampleAchievement.category)}</div>
            <div>{t('achievements.rarity')}: {translateAchievement.rarity(sampleAchievement.rarity)}</div>
          </CardContent>
        </Card>

        {/* Common Terms Demo */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common.common')} - Common Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>{t('common.save')} / {t('common.cancel')}</div>
            <div>{t('common.yes')} / {t('common.no')}</div>
            <div>{t('common.loading')}</div>
            <div>{t('common.error')}</div>
            <div>{t('common.success')}</div>
            <div>{t('common.search')}</div>
            <div>{t('common.filter')}</div>
          </CardContent>
        </Card>

        {/* Formatting Demo */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common.info')} - Localized Formatting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>{t('common.date')}: {formatDate(currentDate)}</div>
            <div>{t('common.time')}: {currentDate.toLocaleTimeString()}</div>
            <div>Number: {formatNumber(sampleNumber)}</div>
            <div>{t('time.today')}: {t('time.now')}</div>
            <div>{t('time.yesterday')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Messages Demo */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.error')} - Error Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-red-600">{t('errors.generic')}</div>
          <div className="text-red-600">{t('errors.network')}</div>
          <div className="text-red-600">{t('errors.validation')}</div>
          <div className="text-red-600">{t('errors.offline')}</div>
        </CardContent>
      </Card>
    </div>
  );
}