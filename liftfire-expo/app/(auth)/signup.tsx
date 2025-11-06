import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Signup screen for new user registration
 * 
 * Features:
 * - Email, username, password, and display name inputs
 * - Input validation (email format, password strength, username requirements)
 * - Loading state during registration
 * - Error message display
 * - Navigation to login screen
 * - Dark mode support
 */
export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading, error, clearError } = useAuth();
  const { colors } = useTheme();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate username format (alphanumeric, underscore, 3-20 chars)
   */
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  /**
   * Validate password strength
   */
  const validatePassword = (password: string): boolean => {
    // At least 8 characters, contains uppercase, lowercase, and number
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const errors: {
      email?: string;
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      errors.username = 'Username must be 3-20 characters (letters, numbers, underscore)';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password =
        'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle signup submission
   */
  const handleSignup = async () => {
    // Clear previous errors
    clearError();
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Attempt sign up
    const result = await signUp({
      email: formData.email.trim(),
      password: formData.password,
      username: formData.username.trim(),
      displayName: formData.displayName.trim() || formData.username.trim(),
    });

    if (result.success) {
      // Navigation will be handled by auth state change
      router.replace('/(tabs)');
    }
  };

  /**
   * Navigate to login screen
   */
  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  /**
   * Update form field
   */
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Start your fitness journey today</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border, 
                    color: colors.text 
                  },
                  validationErrors.email && styles.inputError,
                ]}
                placeholder="your.email@example.com"
                placeholderTextColor={colors.textTertiary}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />
              {validationErrors.email && (
                <Text style={styles.errorText}>{validationErrors.email}</Text>
              )}
            </View>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border, 
                    color: colors.text 
                  },
                  validationErrors.username && styles.inputError,
                ]}
                placeholder="username"
                placeholderTextColor={colors.textTertiary}
                value={formData.username}
                onChangeText={(text) => updateField('username', text)}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {validationErrors.username && (
                <Text style={styles.errorText}>{validationErrors.username}</Text>
              )}
            </View>

            {/* Display Name Input (Optional) */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Display Name (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }
                ]}
                placeholder="Your Name"
                placeholderTextColor={colors.textTertiary}
                value={formData.displayName}
                onChangeText={(text) => updateField('displayName', text)}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border, 
                    color: colors.text 
                  },
                  validationErrors.password && styles.inputError,
                ]}
                placeholder="Create a strong password"
                placeholderTextColor={colors.textTertiary}
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {validationErrors.password && (
                <Text style={styles.errorText}>{validationErrors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border, 
                    color: colors.text 
                  },
                  validationErrors.confirmPassword && styles.inputError,
                ]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textTertiary}
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {validationErrors.confirmPassword && (
                <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Auth Error */}
            {error && (
              <View style={styles.authErrorContainer}>
                <Text style={styles.authErrorText}>{error}</Text>
              </View>
            )}

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLoginPress} disabled={loading}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Guest Mode Button */}
            <TouchableOpacity
              style={[styles.guestButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
              onPress={() => router.replace('/(tabs)')}
              disabled={loading}
            >
              <Text style={[styles.guestButtonText, { color: colors.primary }]}>Continue as Guest</Text>
            </TouchableOpacity>

            {/* Guest Mode Info */}
            <View style={styles.guestInfo}>
              <Text style={[styles.guestInfoText, { color: colors.textSecondary }]}>
                Try the app without an account. Your data will be stored locally on this device only.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  authErrorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  authErrorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  guestButton: {
    height: 50,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestInfo: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  guestInfoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
