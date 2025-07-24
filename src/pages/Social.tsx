import React from 'react';
import { UserPlus, Heart, MessageCircle, Users, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';

export const Social: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground text-center">
        Social Feed
      </h1>
      
      {/* Add Friends */}
      <Button 
        variant="secondary" 
        size="lg" 
        fullWidth
        icon={<UserPlus className="w-5 h-5" />}
        className="h-14"
      >
        Add Gym Friends
      </Button>
      
      {/* Gym Friends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Gym Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No gym friends yet</p>
            <p className="text-sm text-muted-foreground">
              Add friends to see their workouts and achievements
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-muted-foreground" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">U</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">You</p>
                  <p className="text-sm text-muted-foreground">Just joined!</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="w-4 h-4" />
                  0
                </button>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  0
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-muted-foreground" />
            Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No active challenges</p>
            <p className="text-sm text-muted-foreground">
              Join challenges to compete with friends
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};