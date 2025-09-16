/**
 * Simple Streak Schedule Configuration Component
 * 
 * A simplified, clean interface for creating workout schedules
 */

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Switch } from '@/components/ui';
import type { StreakSchedule } from '@/types/streaks';

interface StreakScheduleConfigProps {
  schedule?: StreakSchedule | null;
  onSave: (schedule: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' }
];

const QUICK_PRESETS = [
  { name: '3 days (Mon, Wed, Fri)', days: [1, 3, 5], icon: '🌱' },
  { name: '4 days (Mon-Thu)', days: [1, 2, 3, 4], icon: '💪' },
  { name: '5 days (Mon-Fri)', days: [1, 2, 3, 4, 5], icon: '🔥' },
  { name: 'Weekends only', days: [0, 6], icon: '🏖️' }
];

export const StreakScheduleConfig: React.FC<StreakScheduleConfigProps> = ({
  schedule,
  onSave,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    name: '',
    scheduledDays: [] as number[],
    targetDaysPerWeek: 3,
    isFlexible: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name,
        scheduledDays: [...schedule.scheduledDays],
        targetDaysPerWeek: schedule.targetDaysPerWeek,
        isFlexible: schedule.isFlexible
      });
    }
  }, [schedule]);

  // Handle preset selection
  const handlePresetSelect = (preset: typeof QUICK_PRESETS[0]) => {
    setFormData({
      ...formData,
      name: preset.name,
      scheduledDays: [...preset.days],
      targetDaysPerWeek: preset.days.length
    });
  };

  // Handle day toggle
  const handleDayToggle = (dayId: number) => {
    const newScheduledDays = formData.scheduledDays.includes(dayId)
      ? formData.scheduledDays.filter(d => d !== dayId)
      : [...formData.scheduledDays, dayId].sort();
    
    setFormData({
      ...formData,
      scheduledDays: newScheduledDays,
      targetDaysPerWeek: newScheduledDays.length
    });
  };

  // Handle save
  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Schedule name is required';
    }

    if (formData.scheduledDays.length === 0) {
      newErrors.scheduledDays = 'Select at least one workout day';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      await onSave({
        name: formData.name,
        description: '',
        targetDaysPerWeek: formData.targetDaysPerWeek,
        scheduledDays: formData.scheduledDays,
        isFlexible: formData.isFlexible,
        restDays: [],
        color: '#3B82F6',
        icon: '💪',
        isActive: true
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {schedule ? 'Edit Schedule' : 'Create Workout Schedule'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Schedule Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Schedule Name
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My workout schedule"
            error={errors.name}
          />
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Quick Setup
          </label>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(preset)}
                className="text-xs h-auto py-2 px-3"
              >
                <span className="mr-1">{preset.icon}</span>
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Workout Days */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Workout Days ({formData.scheduledDays.length} selected)
          </label>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <Button
                key={day.id}
                variant={formData.scheduledDays.includes(day.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDayToggle(day.id)}
                className="text-xs h-12 flex flex-col"
              >
                <div className="font-semibold">{day.short}</div>
              </Button>
            ))}
          </div>
          {errors.scheduledDays && (
            <p className="text-sm text-destructive mt-1">{errors.scheduledDays}</p>
          )}
        </div>

        {/* Flexible Schedule Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <div className="font-medium text-sm">Flexible Schedule</div>
            <div className="text-xs text-muted-foreground">
              Allow makeup workouts on other days
            </div>
          </div>
          <Switch
            checked={formData.isFlexible}
            onCheckedChange={(checked) => setFormData({ ...formData, isFlexible: checked })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {schedule ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakScheduleConfig;