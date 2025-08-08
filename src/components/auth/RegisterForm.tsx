import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { 
  validateUserRegistration, 
  isValidEmail, 
  isValidUsername, 
  getPasswordStrength,
  isUsernameAvailable,
  isEmailAvailable,
} from '@/utils';
import { useAuthStore } from '@/stores';
import type { FitnessLevel } from '@/schemas/user';
import { logger } from '@/utils';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onLoginAsGuest: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onLoginAsGuest,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    fitnessLevel: 'beginner' as FitnessLevel,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityChecks, setAvailabilityChecks] = useState({
    email: { checking: false, available: null as boolean | null },
    username: { checking: false, available: null as boolean | null },
  });
  
  const { register, isLoading, error: authError, clearError } = useAuthStore();

  // Debounced availability checks
  useEffect(() => {
    const checkEmailAvailability = async () => {
      if (!formData.email || !isValidEmail(formData.email) || errors.email) return;
      
      setAvailabilityChecks(prev => ({
        ...prev,
        email: { checking: true, available: null }
      }));
      
      try {
        const available = await isEmailAvailable(formData.email);
        setAvailabilityChecks(prev => ({
          ...prev,
          email: { checking: false, available }
        }));
        
        if (!available) {
          setErrors(prev => ({ ...prev, email: 'This email is already taken' }));
        }
      } catch (error) {
        setAvailabilityChecks(prev => ({
          ...prev,
          email: { checking: false, available: null }
        }));
      }
    };

    const timeoutId = setTimeout(checkEmailAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email, errors.email]);

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (!formData.username || !isValidUsername(formData.username) || errors.username) return;
      
      setAvailabilityChecks(prev => ({
        ...prev,
        username: { checking: true, available: null }
      }));
      
      try {
        const available = await isUsernameAvailable(formData.username);
        setAvailabilityChecks(prev => ({
          ...prev,
          username: { checking: false, available }
        }));
        
        if (!available) {
          setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
        }
      } catch (error) {
        setAvailabilityChecks(prev => ({
          ...prev,
          username: { checking: false, available: null }
        }));
      }
    };

    const timeoutId = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, errors.username]);

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!isValidEmail(value)) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'username':
        if (!value) {
          newErrors.username = 'Username is required';
        } else if (!isValidUsername(value)) {
          newErrors.username = 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens';
        } else {
          delete newErrors.username;
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          const strength = getPasswordStrength(value);
          if (strength.score < 3) {
            newErrors.password = strength.feedback[0] || 'Password is too weak';
          } else {
            delete newErrors.password;
          }
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'displayName':
        if (!value) {
          newErrors.displayName = 'Display name is required';
        } else if (value.length > 50) {
          newErrors.displayName = 'Display name is too long (max 50 characters)';
        } else {
          delete newErrors.displayName;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
    
    // Reset availability checks when field changes
    if (field === 'email') {
      setAvailabilityChecks(prev => ({
        ...prev,
        email: { checking: false, available: null }
      }));
    } else if (field === 'username') {
      setAvailabilityChecks(prev => ({
        ...prev,
        username: { checking: false, available: null }
      }));
    }
    
    // Validate field on change
    validateField(field, value);
    
    // Also validate confirm password if password changes
    if (field === 'password' && formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      if (field !== 'fitnessLevel') {
        validateField(field, formData[field as keyof typeof formData] as string);
      }
    });
    
    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    // Check availability
    if (availabilityChecks.email.available === false || availabilityChecks.username.available === false) {
      return;
    }
    
    // Validate with Zod schema
    const registrationData = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
      display_name: formData.displayName,
      fitness_level: formData.fitnessLevel,
    };
    
    const validation = validateUserRegistration(registrationData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.errors?.forEach(error => {
        const [field, message] = error.split(': ');
        fieldErrors[field] = message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register(formData.email, formData.username, formData.password);
      logger.info('User registered successfully', { email: formData.email, username: formData.username });
      onSuccess?.();
    } catch (error) {
      logger.error('Registration failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isFormValid = 
    formData.email && 
    formData.username && 
    formData.password && 
    formData.confirmPassword && 
    formData.displayName &&
    Object.keys(errors).length === 0 &&
    availabilityChecks.email.available !== false &&
    availabilityChecks.username.available !== false;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <p className="text-muted-foreground">Join the fitness community</p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 pr-10 ${errors.email ? 'border-destructive' : ''}`}
                disabled={isLoading || isSubmitting}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {availabilityChecks.email.checking && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {availabilityChecks.email.available === true && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {availabilityChecks.email.available === false && (
                  <X className="w-4 h-4 text-destructive" />
                )}
              </div>
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`pl-10 pr-10 ${errors.username ? 'border-destructive' : ''}`}
                disabled={isLoading || isSubmitting}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {availabilityChecks.username.checking && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {availabilityChecks.username.available === true && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {availabilityChecks.username.available === false && (
                  <X className="w-4 h-4 text-destructive" />
                )}
              </div>
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username}</p>
            )}
          </div>

          {/* Display Name Field */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="How should we call you?"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className={errors.displayName ? 'border-destructive' : ''}
              disabled={isLoading || isSubmitting}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading || isSubmitting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.score
                          ? level <= 2
                            ? 'bg-red-500'
                            : level === 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength: {
                    passwordStrength.score <= 2 ? 'Weak' :
                    passwordStrength.score === 3 ? 'Good' : 'Strong'
                  }
                </p>
              </div>
            )}
            
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading || isSubmitting}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Fitness Level Field */}
          <div className="space-y-2">
            <label htmlFor="fitnessLevel" className="text-sm font-medium">
              Fitness Level
            </label>
            <select
              id="fitnessLevel"
              value={formData.fitnessLevel}
              onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              disabled={isLoading || isSubmitting}
            >
              <option value="beginner">Beginner - New to fitness</option>
              <option value="intermediate">Intermediate - Some experience</option>
              <option value="advanced">Advanced - Regular training</option>
              <option value="expert">Expert - Competitive level</option>
            </select>
          </div>

          {/* Auth Error */}
          {authError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{authError}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid || isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="space-y-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={onLoginAsGuest}
            disabled={isLoading || isSubmitting}
          >
            Continue as Guest
          </Button>
          
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-primary hover:underline font-medium"
              disabled={isLoading || isSubmitting}
            >
              Sign in
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};