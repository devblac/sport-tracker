import React from 'react';
import { Settings, Crown, UserPlus, LogOut } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { useAuthStore } from '@/stores';

export const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();

  const getUserInitial = () => {
    if (!user) return 'U';
    return user.profile.display_name.charAt(0).toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'guest': return 'Guest';
      case 'basic': return 'Basic';
      case 'premium': return 'Premium';
      case 'trainer': return 'Trainer';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'premium': return 'text-primary';
      case 'trainer': return 'text-secondary';
      case 'admin': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground text-center">
        Profile
      </h1>
      
      {/* User Info */}
      <Card>
        <CardContent className="text-center py-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground text-2xl font-bold">
              {getUserInitial()}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            {user?.profile.display_name || 'Unknown User'}
          </h2>
          <p className="text-muted-foreground mb-2">
            Level {user?.gamification.level || 1} • {user?.gamification.total_xp || 0} XP
          </p>
          <p className={`text-sm font-medium mb-4 ${getRoleColor(user?.role || 'guest')}`}>
            {getRoleDisplay(user?.role || 'guest')} Account
          </p>
          
          {user?.role === 'guest' ? (
            <Button variant="primary" fullWidth>
              Sign Up for Full Features
            </Button>
          ) : (
            <Button variant="outline" fullWidth onClick={logout} icon={<LogOut className="w-4 h-4" />}>
              Sign Out
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Theme Selector */}
      <ThemeSelector />

      {/* Quick Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-secondary" />
              <span className="text-foreground">
                Add Gym Friends
              </span>
            </div>
            <Button variant="ghost" size="sm">
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Premium Upgrade */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              Upgrade to Premium
            </h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Unlock cloud backup, advanced analytics, and exclusive content
          </p>
          <Button variant="secondary" fullWidth>
            Learn More
          </Button>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            'Privacy Settings',
            'Notifications',
            'Units & Preferences',
            'Help & Support'
          ].map((setting) => (
            <button
              key={setting}
              className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              {setting}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};