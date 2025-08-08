import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  Lock, 
  Globe,
  UserCheck,
  Save
} from 'lucide-react';

interface PrivacySettingsProps {
  className?: string;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ 
  className 
}) => {
  const { user, updateUserSettings } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    profile_visibility: user?.settings?.privacy?.profile_visibility || 'friends',
    workout_sharing: user?.settings?.privacy?.workout_sharing || 'friends',
    show_personal_records: user?.settings?.privacy?.show_personal_records ?? true,
    show_workout_history: user?.settings?.privacy?.show_workout_history ?? true,
    allow_friend_requests: user?.settings?.privacy?.allow_friend_requests ?? true,
    show_online_status: user?.settings?.privacy?.show_online_status ?? true,
    data_collection: user?.settings?.privacy?.data_collection ?? true,
  });

  const handleToggle = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleVisibilityChange = (setting: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { updateSettings } = useAuthStore.getState();
      updateSettings({
        privacy: settings
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Visible to everyone' },
    { value: 'friends', label: 'Friends Only', icon: Users, description: 'Only your gym friends' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can see' },
  ];

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: () => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled 
          ? 'bg-primary' 
          : 'bg-secondary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const VisibilitySelector: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: typeof visibilityOptions;
  }> = ({ value, onChange, options }) => (
    <div className="flex gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
              value === option.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:bg-secondary/50'
            }`}
          >
            <Icon className="w-4 h-4 mx-auto mb-1" />
            <div className="text-sm font-medium">{option.label}</div>
            <div className="text-xs opacity-70">{option.description}</div>
          </button>
        );
      })}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy Settings
          </CardTitle>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Profile Visibility
            </h3>
            <p className="text-sm text-muted-foreground">
              Control who can see your profile information
            </p>
          </div>
          <VisibilitySelector
            value={settings.profile_visibility}
            onChange={(value) => handleVisibilityChange('profile_visibility', value)}
            options={visibilityOptions}
          />
        </div>

        {/* Workout Sharing */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Workout Sharing
            </h3>
            <p className="text-sm text-muted-foreground">
              Control who can see your workout activities
            </p>
          </div>
          <VisibilitySelector
            value={settings.workout_sharing}
            onChange={(value) => handleVisibilityChange('workout_sharing', value)}
            options={visibilityOptions}
          />
        </div>

        {/* Detailed Privacy Controls */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Detailed Controls
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">Show Personal Records</div>
                  <div className="text-sm text-muted-foreground">
                    Allow others to see your PRs and achievements
                  </div>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.show_personal_records}
                onChange={() => handleToggle('show_personal_records')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">Show Workout History</div>
                  <div className="text-sm text-muted-foreground">
                    Display your past workouts to others
                  </div>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.show_workout_history}
                onChange={() => handleToggle('show_workout_history')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">Allow Friend Requests</div>
                  <div className="text-sm text-muted-foreground">
                    Let other users send you friend requests
                  </div>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.allow_friend_requests}
                onChange={() => handleToggle('allow_friend_requests')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <div>
                  <div className="font-medium text-foreground">Show Online Status</div>
                  <div className="text-sm text-muted-foreground">
                    Display when you're active in the app
                  </div>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.show_online_status}
                onChange={() => handleToggle('show_online_status')}
              />
            </div>
          </div>
        </div>

        {/* Data & Analytics */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Data & Analytics
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-foreground">Anonymous Data Collection</div>
                <div className="text-sm text-muted-foreground">
                  Help improve the app by sharing anonymous usage data
                </div>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.data_collection}
              onChange={() => handleToggle('data_collection')}
            />
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-secondary/30 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-foreground mb-1">Your Privacy Matters</div>
              <div className="text-muted-foreground">
                We respect your privacy and give you full control over your data. 
                These settings help you customize your experience while keeping your information secure.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};