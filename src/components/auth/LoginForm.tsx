import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { validateUserLogin, isValidEmail } from '@/utils';
import { useAuthStore } from '@/stores';
import { logger } from '@/utils';
import { validateFormData, secureApiCall } from '@/utils/securityMiddleware';
import { useSecurity } from '@/hooks/useSecurity';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLoginAsGuest: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onLoginAsGuest,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isLoading, error: authError, clearError } = useAuthStore();

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
        
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          delete newErrors.password;
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
    
    // Validate field on change
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || isLoading) {
      return;
    }
    
    // Clear previous errors
    setErrors({});
    clearError();
    
    // Validate all fields
    validateField('email', formData.email);
    validateField('password', formData.password);
    
    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    // Validate with Zod schema
    const validation = validateUserLogin(formData);
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
      await login(formData.email, formData.password);
      
      // Login successful - the auth store will handle state updates
      // and the parent component will handle navigation
      logger.info('Login successful, triggering success callback');
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        onSuccess?.();
        setIsSubmitting(false);
      }, 100);
      
    } catch (error) {
      // Login failed - error is already set in auth store
      logger.error('Login failed', error);
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.email && formData.password && Object.keys(errors).length === 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <p className="text-muted-foreground">Sign in to your account</p>
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
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                disabled={isLoading || isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
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
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
                disabled={isLoading || isSubmitting}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Forgot Password */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              disabled={isLoading || isSubmitting}
            >
              Forgot your password?
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 py-1 text-muted-foreground">Or</span>
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
            <span className="text-sm text-muted-foreground">Don't have an account? </span>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-sm text-primary hover:underline font-medium"
              disabled={isLoading || isSubmitting}
            >
              Sign up
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};