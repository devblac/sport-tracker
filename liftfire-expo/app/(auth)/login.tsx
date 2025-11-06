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
 * Login screen with email/password authentication
 * 
 * Features:
 * - Email and password input with validation
 * - Loading state during authentication
 * - Error message display
 * - Navigation to signup screen
 * - Dark mode support
 */
export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading, error, clearError } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle login submission
   */
  const handleLogin = async () => {
    // Clear previous errors
    clearError();
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Attempt sign in
    const result = await signIn({ email: email.trim(), password });

    if (result.success) {
      // Navigation will be handled by auth state change
      router.replace('/(tabs)');
    }
  };

  /**
   * Navigate to signup screen
   */
  const handleSignUpPress = () => {
    router.push('/(auth)/signup');
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
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue your fitness journey</Text>
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
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />
              {validationErrors.email && (
                <Text style={styles.errorText}>{validationErrors.email}</Text>
              )}
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
                placeholder="Enter your password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {validationErrors.password && (
                <Text style={styles.errorText}>{validationErrors.password}</Text>
              )}
            </View>

            {/* Auth Error */}
            {error && (
              <View style={styles.authErrorContainer}>
                <Text style={styles.authErrorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: colors.textSecondary }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUpPress} disabled={loading}>
                <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
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
    marginBottom: 20,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
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
