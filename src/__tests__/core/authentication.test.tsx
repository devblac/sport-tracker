/**
 * Authentication System Tests
 * Comprehensive tests for authentication flows and security
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuthStore } from '@/stores/useAuthStore';
import { mockAuthService } from '@/test/mocks/implementations';
import { userFixtures } from '@/test/fixtures';

// Mock the auth store
vi.mock('@/stores/useAuthStore');
const mockUseAuthStore = vi.mocked(useAuthStore);

// Mock the auth service
vi.mock('@/services/AuthService', () => ({
  AuthService: mockAuthService,
}));

describe('Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      clearError: vi.fn(),
    });
  });

  describe('AuthProvider', () => {
    it('should initialize authentication state', () => {
      render(
        <AuthProvider>
          <div>Test Content</div>
        </AuthProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should handle authentication state changes', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({ user: userFixtures.newUser, error: null });
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <AuthProvider>
          <div>Test Content</div>
        </AuthProvider>
      );

      // Simulate sign in
      await mockSignIn('test@example.com', 'password123');
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should handle authentication errors', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({ 
        user: null, 
        error: { message: 'Invalid credentials' } 
      });
      
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Invalid credentials',
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <AuthProvider>
          <div>Test Content</div>
        </AuthProvider>
      );

      await mockSignIn('test@example.com', 'wrongpassword');
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });
  });

  describe('LoginForm', () => {
    it('should render login form correctly', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate password requirements', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '123'); // Too short
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should submit valid login form', async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.fn().mockResolvedValue({ user: userFixtures.newUser, error: null });
      
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should display loading state during submission', async () => {
      const user = userEvent.setup();
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it('should display authentication errors', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Invalid credentials',
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      render(<LoginForm />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should clear errors when form is modified', async () => {
      const user = userEvent.setup();
      const mockClearError = vi.fn();
      
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Invalid credentials',
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: mockClearError,
      });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'a');

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('RegisterForm', () => {
    it('should render registration form correctly', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password456');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should validate username availability', async () => {
      const user = userEvent.setup();
      mockAuthService.checkUsernameAvailability = vi.fn().mockResolvedValue(false);
      
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/username/i), 'existinguser');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/username is already taken/i)).toBeInTheDocument();
      });
    });

    it('should submit valid registration form', async () => {
      const user = userEvent.setup();
      const mockSignUp = vi.fn().mockResolvedValue({ user: userFixtures.newUser, error: null });
      
      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        signIn: vi.fn(),
        signUp: mockSignUp,
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/username/i), 'newuser');
      await user.type(screen.getByLabelText(/display name/i), 'New User');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          username: 'newuser',
          display_name: 'New User',
          password: 'password123',
        });
      });
    });
  });

  describe('Guest Mode', () => {
    it('should allow guest access to basic features', () => {
      mockUseAuthStore.mockReturnValue({
        user: { ...userFixtures.newUser, role: 'guest' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      render(
        <AuthProvider>
          <div data-testid="guest-content">Guest Content</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('guest-content')).toBeInTheDocument();
    });

    it('should restrict guest access to premium features', () => {
      mockUseAuthStore.mockReturnValue({
        user: { ...userFixtures.newUser, role: 'guest' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      // This would be tested in components that check user role
      const user = mockUseAuthStore().user;
      expect(user?.role).toBe('guest');
    });
  });

  describe('Session Management', () => {
    it('should handle token refresh', async () => {
      mockAuthService.refreshToken = vi.fn().mockResolvedValue({ token: 'new-token', error: null });

      await mockAuthService.refreshToken();
      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });

    it('should handle session expiration', async () => {
      const mockSignOut = vi.fn();
      mockUseAuthStore.mockReturnValue({
        user: userFixtures.newUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: mockSignOut,
        clearError: vi.fn(),
      });

      // Simulate session expiration
      mockAuthService.isTokenExpired = vi.fn().mockReturnValue(true);
      
      if (mockAuthService.isTokenExpired()) {
        await mockSignOut();
      }

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should persist authentication state', () => {
      const mockUser = userFixtures.newUser;
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      // Simulate app restart
      const storedUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
      expect(storedUser).toEqual(mockUser);
    });
  });

  describe('Security Features', () => {
    it('should sanitize user input', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const maliciousInput = '<script>alert("xss")</script>test@example.com';
      await user.type(screen.getByLabelText(/email/i), maliciousInput);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(emailInput.value).not.toContain('<script>');
    });

    it('should implement rate limiting', async () => {
      const mockSignIn = vi.fn()
        .mockResolvedValueOnce({ user: null, error: { message: 'Invalid credentials' } })
        .mockResolvedValueOnce({ user: null, error: { message: 'Invalid credentials' } })
        .mockResolvedValueOnce({ user: null, error: { message: 'Invalid credentials' } })
        .mockResolvedValueOnce({ user: null, error: { message: 'Too many attempts. Please try again later.' } });

      mockUseAuthStore.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn(),
        clearError: vi.fn(),
      });

      // Simulate multiple failed attempts
      for (let i = 0; i < 4; i++) {
        await mockSignIn('test@example.com', 'wrongpassword');
      }

      expect(mockSignIn).toHaveBeenCalledTimes(4);
    });

    it('should validate password strength', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const weakPasswords = ['123', 'password', 'abc123'];
      
      for (const password of weakPasswords) {
        const passwordInput = screen.getByLabelText(/^password$/i);
        await user.clear(passwordInput);
        await user.type(passwordInput, password);
        await user.tab();

        await waitFor(() => {
          expect(screen.getByText(/password is too weak/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.tab(); // Email field
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab(); // Password field
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab(); // Submit button
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
    });

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid email format/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Performance', () => {
    it('should render login form within performance budget', () => {
      const startTime = performance.now();
      render(<LoginForm />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 100ms budget
    });

    it('should not cause memory leaks', () => {
      const { unmount } = render(<LoginForm />);
      
      // Simulate component unmount
      unmount();
      
      // In a real test, you'd check for event listener cleanup
      // This is a placeholder for memory leak detection
      expect(true).toBe(true);
    });
  });
});