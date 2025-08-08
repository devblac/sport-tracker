import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuthStore } from '@/stores';
import type { FitnessLevel, DayOfWeek } from '@/schemas/user';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingData {
  goals: string[];
  scheduledDays: DayOfWeek[];
  fitnessLevel: FitnessLevel;
  height?: number;
  weight?: number;
}

const STEPS = [
  { id: 'goals', title: 'What are your fitness goals?', description: 'Select all that apply' },
  { id: 'schedule', title: 'When do you prefer to workout?', description: 'Choose your workout days' },
  { id: 'level', title: 'What\'s your fitness level?', description: 'This helps us personalize your experience' },
  { id: 'measurements', title: 'Body measurements (optional)', description: 'Help us track your progress better' },
];

const FITNESS_GOALS = [
  'Lose weight',
  'Build muscle',
  'Improve strength',
  'Increase endurance',
  'Stay healthy',
  'Improve flexibility',
  'Train for sport',
  'Rehabilitation',
];

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const FITNESS_LEVELS: { value: FitnessLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to fitness or returning after a long break' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience with regular exercise' },
  { value: 'advanced', label: 'Advanced', description: 'Consistent training for 2+ years' },
  { value: 'expert', label: 'Expert', description: 'Competitive athlete or fitness professional' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    goals: [],
    scheduledDays: [],
    fitnessLevel: 'beginner',
  });

  const { updateProfile, user } = useAuthStore();

  const handleGoalToggle = (goal: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setData(prev => ({
      ...prev,
      scheduledDays: prev.scheduledDays.includes(day)
        ? prev.scheduledDays.filter(d => d !== day)
        : [...prev.scheduledDays, day]
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Update user profile with onboarding data
    updateProfile({
      goals: data.goals,
      scheduled_days: data.scheduledDays,
      fitness_level: data.fitnessLevel,
      height: data.height,
      weight: data.weight,
    });

    onComplete();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Goals
        return data.goals.length > 0;
      case 1: // Schedule
        return data.scheduledDays.length > 0;
      case 2: // Fitness level
        return true; // Always has a default value
      case 3: // Measurements
        return true; // Optional step
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Goals
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {FITNESS_GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => handleGoalToggle(goal)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    data.goals.includes(goal)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  {data.goals.includes(goal) && (
                    <Check className="w-4 h-4 mb-1 mx-auto" />
                  )}
                  {goal}
                </button>
              ))}
            </div>
          </div>
        );

      case 1: // Schedule
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle(day.value)}
                  className={`p-3 rounded-lg border text-left font-medium transition-colors flex items-center justify-between ${
                    data.scheduledDays.includes(day.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  <span>{day.label}</span>
                  {data.scheduledDays.includes(day.value) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Selected {data.scheduledDays.length} day{data.scheduledDays.length !== 1 ? 's' : ''} per week
            </p>
          </div>
        );

      case 2: // Fitness Level
        return (
          <div className="space-y-3">
            {FITNESS_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setData(prev => ({ ...prev, fitnessLevel: level.value }))}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  data.fitnessLevel === level.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{level.label}</h4>
                    <p className="text-sm opacity-80">{level.description}</p>
                  </div>
                  {data.fitnessLevel === level.value && (
                    <Check className="w-5 h-5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        );

      case 3: // Measurements
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              These measurements help us provide better recommendations and track your progress.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  placeholder="170"
                  value={data.height || ''}
                  onChange={(e) => setData(prev => ({ 
                    ...prev, 
                    height: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  placeholder="70"
                  value={data.weight || ''}
                  onChange={(e) => setData(prev => ({ 
                    ...prev, 
                    weight: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="w-full p-3 border border-border rounded-lg bg-background"
                />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              You can always update these later in your profile settings.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          <CardTitle className="text-xl">{STEPS[currentStep].title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {STEPS[currentStep].description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          <div className="flex justify-between space-x-3">
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              
              <Button variant="ghost" onClick={onSkip}>
                Skip
              </Button>
            </div>
            
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === STEPS.length - 1 ? (
                'Complete'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};