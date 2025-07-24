import React from 'react';
import { UserPlus, LogIn, User } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';

interface AuthModeSelectorProps {
  onSelectLogin: () => void;
  onSelectRegister: () => void;
  onSelectGuest: () => void;
}

export const AuthModeSelector: React.FC<AuthModeSelectorProps> = ({
  onSelectLogin,
  onSelectRegister,
  onSelectGuest,
}) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to Sport Tracker
        </h1>
        <p className="text-muted-foreground">
          Your fitness journey starts here
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="space-y-4">
        {/* Register Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelectRegister}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/10">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Create Account</h3>
                <p className="text-sm text-muted-foreground">
                  Full access to all features, cloud sync, and social features
                </p>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={onSelectRegister}>
              Get Started
            </Button>
          </CardContent>
        </Card>

        {/* Login Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelectLogin}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-secondary/10">
                <LogIn className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Sign In</h3>
                <p className="text-sm text-muted-foreground">
                  Welcome back! Access your existing account
                </p>
              </div>
            </div>
            <Button variant="secondary" className="w-full mt-4" onClick={onSelectLogin}>
              Sign In
            </Button>
          </CardContent>
        </Card>

        {/* Guest Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelectGuest}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-muted">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Try as Guest</h3>
                <p className="text-sm text-muted-foreground">
                  Explore the app with basic features (data won't be saved)
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={onSelectGuest}>
              Continue as Guest
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Preview */}
      <div className="text-center space-y-3">
        <h4 className="font-medium text-foreground">What you'll get:</h4>
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Workout tracking</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Progress analytics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Exercise database</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Social features</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Gamification</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Achievements</span>
          </div>
        </div>
      </div>
    </div>
  );
};