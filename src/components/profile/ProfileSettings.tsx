import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Target, 
  Activity,
  Save,
  Edit3,
  Check,
  X
} from 'lucide-react';

interface ProfileSettingsProps {
  className?: string;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  className 
}) => {
  const { user, updateUserProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user?.profile.display_name || '',
    bio: user?.profile.bio || '',
    location: user?.profile.location || '',
    age: user?.profile.age || '',
    fitness_level: user?.profile.fitness_level || 'beginner',
    fitness_goals: {
      primary_goal: user?.fitness_goals?.primary_goal || '',
      target_weight: user?.fitness_goals?.target_weight || '',
      weekly_workouts: user?.fitness_goals?.weekly_workouts || 3,
    }
  });

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('fitness_goals.')) {
      const goalField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        fitness_goals: {
          ...prev.fitness_goals,
          [goalField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Update user profile
      await updateUserProfile({
        display_name: formData.display_name,
        bio: formData.bio,
        location: formData.location,
        age: formData.age ? parseInt(formData.age) : undefined,
        fitness_level: formData.fitness_level as any,
      });

      // Note: In a real app, you'd also update fitness_goals separately
      // For now, we'll just update the local state
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      display_name: user?.profile.display_name || '',
      bio: user?.profile.bio || '',
      location: user?.profile.location || '',
      age: user?.profile.age?.toString() || '',
      fitness_level: user?.profile.fitness_level || 'beginner',
      fitness_goals: {
        primary_goal: user?.fitness_goals?.primary_goal || '',
        target_weight: user?.fitness_goals?.target_weight?.toString() || '',
        weekly_workouts: user?.fitness_goals?.weekly_workouts || 3,
      }
    });
    setIsEditing(false);
  };

  const fitnessLevels = [
    { value: 'beginner', label: 'Beginner', description: 'New to fitness' },
    { value: 'intermediate', label: 'Intermediate', description: '6+ months experience' },
    { value: 'advanced', label: 'Advanced', description: '2+ years experience' },
    { value: 'expert', label: 'Expert', description: '5+ years experience' },
  ];

  const primaryGoals = [
    'Lose Weight',
    'Build Muscle',
    'Get Stronger',
    'Improve Endurance',
    'General Fitness',
    'Athletic Performance',
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              icon={<Edit3 className="w-4 h-4" />}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                icon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                icon={isSaving ? undefined : <Check className="w-4 h-4" />}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Basic Info</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Display Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Your display name"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {user?.profile.display_name || 'Not set'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {user?.email || 'Not set'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Age
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Your age"
                  min="13"
                  max="100"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {user?.profile.age ? `${user.profile.age} years old` : 'Not set'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              {isEditing ? (
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {user?.profile.location || 'Not set'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none"
                rows={3}
                maxLength={200}
              />
            ) : (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <span className="text-foreground">
                  {user?.profile.bio || 'No bio added yet'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fitness Information */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground">Fitness Profile</h3>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fitness Level
            </label>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {fitnessLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => handleInputChange('fitness_level', level.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      formData.fitness_level === level.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm opacity-70">{level.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {fitnessLevels.find(l => l.value === user?.profile.fitness_level)?.label || 'Not set'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fitness Goals */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground">Fitness Goals</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Primary Goal
              </label>
              {isEditing ? (
                <select
                  value={formData.fitness_goals.primary_goal}
                  onChange={(e) => handleInputChange('fitness_goals.primary_goal', e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="">Select a goal</option>
                  {primaryGoals.map((goal) => (
                    <option key={goal} value={goal}>
                      {goal}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {user?.fitness_goals?.primary_goal || 'Not set'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Weekly Workout Goal
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.fitness_goals.weekly_workouts}
                  onChange={(e) => handleInputChange('fitness_goals.weekly_workouts', parseInt(e.target.value))}
                  placeholder="3"
                  min="1"
                  max="7"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {user?.fitness_goals?.weekly_workouts || 3} workouts per week
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};