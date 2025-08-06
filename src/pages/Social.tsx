import React, { useState } from 'react';
import { UserPlus, Heart, MessageCircle, Users, Zap, Search, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';

export const Social: React.FC = () => {
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddFriend = (username: string) => {
    // TODO: Implement actual friend request functionality
    console.log('Sending friend request to:', username);
    alert(`Friend request sent to ${username}!`);
  };

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
        onClick={() => setShowAddFriends(true)}
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

      {/* Add Friends Modal */}
      {showAddFriends && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Add Gym Friends</h2>
              <button
                onClick={() => setShowAddFriends(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Sample Users */}
              <div className="space-y-3">
                {[
                  { username: 'fitness_mike', name: 'Mike Johnson', mutual: 2 },
                  { username: 'sarah_lifts', name: 'Sarah Wilson', mutual: 5 },
                  { username: 'gym_buddy_alex', name: 'Alex Chen', mutual: 1 },
                  { username: 'strong_emma', name: 'Emma Davis', mutual: 3 }
                ].filter(user => 
                  !searchQuery || 
                  user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(user => (
                  <div key={user.username} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-bold">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.mutual} mutual friends</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddFriend(user.username)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>

              {searchQuery && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    Can't find your friend? Share your username: <strong>@your_username</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};