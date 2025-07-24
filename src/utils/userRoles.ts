import { UserRole } from '@/schemas/user';

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  basic: 1,
  premium: 2,
  trainer: 3,
  admin: 4,
};

// Role permissions
export interface RolePermissions {
  // Core features
  createWorkouts: boolean;
  saveWorkouts: boolean;
  exportData: boolean;
  
  // Social features
  addFriends: boolean;
  createPosts: boolean;
  joinChallenges: boolean;
  createChallenges: boolean;
  
  // Premium features
  cloudSync: boolean;
  advancedAnalytics: boolean;
  customTemplates: boolean;
  unlimitedWorkouts: boolean;
  
  // Trainer features
  createContent: boolean;
  mentorUsers: boolean;
  accessMarketplace: boolean;
  
  // Admin features
  moderateContent: boolean;
  manageUsers: boolean;
  accessAnalytics: boolean;
  systemSettings: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  guest: {
    // Core features - limited
    createWorkouts: true,
    saveWorkouts: false, // Can create but not save permanently
    exportData: false,
    
    // Social features - none
    addFriends: false,
    createPosts: false,
    joinChallenges: false,
    createChallenges: false,
    
    // Premium features - none
    cloudSync: false,
    advancedAnalytics: false,
    customTemplates: false,
    unlimitedWorkouts: false,
    
    // Trainer features - none
    createContent: false,
    mentorUsers: false,
    accessMarketplace: false,
    
    // Admin features - none
    moderateContent: false,
    manageUsers: false,
    accessAnalytics: false,
    systemSettings: false,
  },
  
  basic: {
    // Core features - basic
    createWorkouts: true,
    saveWorkouts: true,
    exportData: true,
    
    // Social features - basic
    addFriends: true,
    createPosts: true,
    joinChallenges: true,
    createChallenges: false,
    
    // Premium features - none
    cloudSync: false,
    advancedAnalytics: false,
    customTemplates: false,
    unlimitedWorkouts: false,
    
    // Trainer features - none
    createContent: false,
    mentorUsers: false,
    accessMarketplace: false,
    
    // Admin features - none
    moderateContent: false,
    manageUsers: false,
    accessAnalytics: false,
    systemSettings: false,
  },
  
  premium: {
    // Core features - full
    createWorkouts: true,
    saveWorkouts: true,
    exportData: true,
    
    // Social features - full
    addFriends: true,
    createPosts: true,
    joinChallenges: true,
    createChallenges: true,
    
    // Premium features - full
    cloudSync: true,
    advancedAnalytics: true,
    customTemplates: true,
    unlimitedWorkouts: true,
    
    // Trainer features - none
    createContent: false,
    mentorUsers: false,
    accessMarketplace: false,
    
    // Admin features - none
    moderateContent: false,
    manageUsers: false,
    accessAnalytics: false,
    systemSettings: false,
  },
  
  trainer: {
    // Core features - full
    createWorkouts: true,
    saveWorkouts: true,
    exportData: true,
    
    // Social features - full
    addFriends: true,
    createPosts: true,
    joinChallenges: true,
    createChallenges: true,
    
    // Premium features - full
    cloudSync: true,
    advancedAnalytics: true,
    customTemplates: true,
    unlimitedWorkouts: true,
    
    // Trainer features - full
    createContent: true,
    mentorUsers: true,
    accessMarketplace: true,
    
    // Admin features - none
    moderateContent: false,
    manageUsers: false,
    accessAnalytics: false,
    systemSettings: false,
  },
  
  admin: {
    // Core features - full
    createWorkouts: true,
    saveWorkouts: true,
    exportData: true,
    
    // Social features - full
    addFriends: true,
    createPosts: true,
    joinChallenges: true,
    createChallenges: true,
    
    // Premium features - full
    cloudSync: true,
    advancedAnalytics: true,
    customTemplates: true,
    unlimitedWorkouts: true,
    
    // Trainer features - full
    createContent: true,
    mentorUsers: true,
    accessMarketplace: true,
    
    // Admin features - full
    moderateContent: true,
    manageUsers: true,
    accessAnalytics: true,
    systemSettings: true,
  },
};

/**
 * Get permissions for a specific role
 */
export const getRolePermissions = (role: UserRole): RolePermissions => {
  return ROLE_PERMISSIONS[role];
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: keyof RolePermissions): boolean => {
  return ROLE_PERMISSIONS[role][permission];
};

/**
 * Check if a role has higher or equal hierarchy than another role
 */
export const hasRoleHierarchy = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * Get the role hierarchy level
 */
export const getRoleLevel = (role: UserRole): number => {
  return ROLE_HIERARCHY[role];
};

/**
 * Check if user can upgrade to a specific role
 */
export const canUpgradeTo = (currentRole: UserRole, targetRole: UserRole): boolean => {
  // Can't downgrade
  if (ROLE_HIERARCHY[targetRole] <= ROLE_HIERARCHY[currentRole]) {
    return false;
  }
  
  // Special rules
  switch (targetRole) {
    case 'admin':
      return false; // Admins are assigned, not upgraded to
    case 'trainer':
      return currentRole === 'premium'; // Only premium users can become trainers
    case 'premium':
      return currentRole === 'basic'; // Only basic users can upgrade to premium
    case 'basic':
      return currentRole === 'guest'; // Only guests can upgrade to basic
    default:
      return false;
  }
};

/**
 * Get available upgrade options for a role
 */
export const getUpgradeOptions = (currentRole: UserRole): UserRole[] => {
  const options: UserRole[] = [];
  const allRoles: UserRole[] = ['guest', 'basic', 'premium', 'trainer', 'admin'];
  
  for (const role of allRoles) {
    if (canUpgradeTo(currentRole, role)) {
      options.push(role);
    }
  }
  
  return options;
};

/**
 * Get role display information
 */
export interface RoleInfo {
  name: string;
  description: string;
  color: string;
  icon: string;
  features: string[];
}

export const getRoleInfo = (role: UserRole): RoleInfo => {
  const roleInfoMap: Record<UserRole, RoleInfo> = {
    guest: {
      name: 'Guest',
      description: 'Try out the app with basic workout tracking',
      color: 'gray',
      icon: '👤',
      features: [
        'Create workouts',
        'Track exercises',
        'View progress',
      ],
    },
    basic: {
      name: 'Basic',
      description: 'Full access to core fitness tracking features',
      color: 'blue',
      icon: '💪',
      features: [
        'Save workouts permanently',
        'Add gym friends',
        'Join challenges',
        'Export data',
        'Social features',
      ],
    },
    premium: {
      name: 'Premium',
      description: 'Advanced features and analytics for serious fitness enthusiasts',
      color: 'gold',
      icon: '⭐',
      features: [
        'Cloud sync across devices',
        'Advanced analytics',
        'Custom workout templates',
        'Unlimited workouts',
        'Create challenges',
        'Priority support',
      ],
    },
    trainer: {
      name: 'Trainer',
      description: 'Professional tools for fitness trainers and coaches',
      color: 'purple',
      icon: '🏋️',
      features: [
        'All Premium features',
        'Create training content',
        'Mentor other users',
        'Access marketplace',
        'Professional analytics',
        'Client management',
      ],
    },
    admin: {
      name: 'Admin',
      description: 'Full system access for platform management',
      color: 'red',
      icon: '👑',
      features: [
        'All features',
        'User management',
        'Content moderation',
        'System analytics',
        'Platform settings',
        'Support tools',
      ],
    },
  };
  
  return roleInfoMap[role];
};

/**
 * Check if a feature is available for a role
 */
export const isFeatureAvailable = (role: UserRole, feature: string): boolean => {
  const permissions = getRolePermissions(role);
  
  // Map feature names to permissions
  const featureMap: Record<string, keyof RolePermissions> = {
    'save-workouts': 'saveWorkouts',
    'cloud-sync': 'cloudSync',
    'add-friends': 'addFriends',
    'create-posts': 'createPosts',
    'join-challenges': 'joinChallenges',
    'create-challenges': 'createChallenges',
    'advanced-analytics': 'advancedAnalytics',
    'custom-templates': 'customTemplates',
    'unlimited-workouts': 'unlimitedWorkouts',
    'create-content': 'createContent',
    'mentor-users': 'mentorUsers',
    'access-marketplace': 'accessMarketplace',
    'moderate-content': 'moderateContent',
    'manage-users': 'manageUsers',
    'system-settings': 'systemSettings',
  };
  
  const permission = featureMap[feature];
  return permission ? permissions[permission] : false;
};