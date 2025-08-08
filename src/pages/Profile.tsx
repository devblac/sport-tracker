import React, { useState } from 'react';
import { Settings, Crown, UserPlus, LogOut, User, Shield, X, Users, MessageCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { PrivacySettings } from '@/components/profile/PrivacySettings';
import { useAuthStore } from '@/stores';

export const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'privacy'>('overview');
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-secondary" />
                  <span className="text-foreground">
                    Add Gym Friends
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAddFriends(true)}
                >
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
              <Button 
                variant="secondary" 
                fullWidth
                onClick={() => setShowPremiumModal(true)}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <ProfileSettings />
      )}

      {activeTab === 'privacy' && (
        <PrivacySettings />
      )}

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
              <p className="text-muted-foreground mb-4">
                Connect with friends to share your fitness journey and stay motivated together.
              </p>
              <div className="space-y-3">
                <Button variant="outline" fullWidth>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find Friends by Username
                </Button>
                <Button variant="outline" fullWidth>
                  <Users className="w-4 h-4 mr-2" />
                  Import from Contacts
                </Button>
                <Button variant="outline" fullWidth>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share Your Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Friends Modal */}
      {showAddFriends && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Add Gym Friends</h2>
              <button
                onClick={() => setShowAddFriends(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowAddFriends(false);
                  // TODO: Implement find friends by username
                  alert('Find Friends by Username - Coming Soon!');
                }}
                className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Users className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Find Friends by Username</div>
                  <div className="text-sm text-muted-foreground">Search for friends using their username</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAddFriends(false);
                  // TODO: Implement import from contacts
                  alert('Import from Contacts - Coming Soon!');
                }}
                className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Import from Contacts</div>
                  <div className="text-sm text-muted-foreground">Find friends from your phone contacts</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAddFriends(false);
                  // TODO: Implement share profile
                  if (navigator.share) {
                    navigator.share({
                      title: 'Join me on FitTracker!',
                      text: 'Let\'s workout together and track our progress!',
                      url: window.location.origin
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.origin);
                    alert('Profile link copied to clipboard!');
                  }
                }}
                className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <UserPlus className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Share Your Profile</div>
                  <div className="text-sm text-muted-foreground">Invite friends to join you</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Upgrade to Premium
              </h2>
              <p className="text-muted-foreground mb-6">
                Unlock advanced features and take your fitness to the next level
              </p>
              
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Cloud backup & sync across devices</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Advanced analytics & insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Premium workout templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Priority customer support</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Access to marketplace content</span>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg mb-6">
                <div className="text-2xl font-bold text-foreground">$9.99/month</div>
                <div className="text-sm text-muted-foreground">or $99.99/year (save 17%)</div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowPremiumModal(false);
                    // Navigate to marketplace or payment page
                    window.location.href = '/marketplace-demo';
                  }}
                  className="flex-1"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};