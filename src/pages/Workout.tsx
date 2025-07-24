import React from 'react';
import { Plus, Play, Clock, Dumbbell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';

export const Workout: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground text-center">
        Workouts
      </h1>
      
      {/* Create New Workout */}
      <Button 
        variant="primary" 
        size="lg" 
        fullWidth
        icon={<Plus className="w-5 h-5" />}
        className="h-14"
      >
        Create New Workout
      </Button>
      
      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <h3 className="font-semibold text-foreground">Push Day</h3>
              <p className="text-sm text-muted-foreground">Chest, Shoulders, Triceps</p>
            </div>
            <Button variant="primary" size="sm">
              <Play className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <h3 className="font-semibold text-foreground">Pull Day</h3>
              <p className="text-sm text-muted-foreground">Back, Biceps</p>
            </div>
            <Button variant="primary" size="sm">
              <Play className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <h3 className="font-semibold text-foreground">Leg Day</h3>
              <p className="text-sm text-muted-foreground">Quads, Hamstrings, Glutes</p>
            </div>
            <Button variant="primary" size="sm">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Recent Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No recent workouts</p>
            <p className="text-sm text-muted-foreground">
              Start your first workout to see it here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};