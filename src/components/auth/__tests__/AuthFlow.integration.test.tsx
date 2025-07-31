import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthContainer } from '../AuthContainer';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/services/AuthService';

// Mock the auth store
vi.mock('@/stores/useAuthStore');

// Mock the auth service
vi.mock('@/services/AuthService');

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Authentication Flow Integration Tests', () => {
  const mockAuthService = {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    fitness_level: 'intermediate' as const,
    created_at: new Date(),
  };

  const mockAuthStore = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
    setUser: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);
    vi.mocked(AuthService.getInstance).mockReturnValue(mockAuthService as any);
    mockNavigate.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderAuthContainer = () => {
    return render(
      <BrowserRouter>
        <AuthContainer />
      </BrowserRouter>
    );
  };

  describe('Login Flow', () => {
    it('should handle successful login flow', async () => {
      // Mock successful login
      mockAuthStore.login.mockResolvedValue(mockUser);
      
      renderAuthContainer();

      // Should show login form by default
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      // Submit login form
      await act(async () => {
        fireEvent.click(loginButton);
      });

      // Should call login with correct credentials
      expect(mockAuthStore.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login validation errors', async () => {
      renderAuthContainer();

      // Try to submit empty form
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(loginButton);
      });

      // Should show validation errors
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('should handle login API errors', async () => {
      // Mock login error
      mockAuthStore.login.mockRejectedValue(new Error('Invalid credentials'));
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        error: 'Invalid credentials',
      });

      renderAuthContainer();

      // Fill and submit form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(loginButton);
      });

      // Should display error message
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    it('should handle loading states during login', async () => {
      // Mock loading state
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        isLoading: true,
      });

      renderAuthContainer();

      // Should show loading indicator
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      
      // Login button should be disabled
      const loginButton = screen.getByRole('button', { name: /signing in/i });
      expect(loginButton).toBeDisabled();
    });
  });

  describe('Registration Flow', () => {
    it('should handle successful registration flow', async () => {
      mockAuthStore.register.mockResolvedValue(mockUser);

      renderAuthContainer();

      // Switch to registration form
      const signUpLink = screen.getByText(/sign up/i);
      await act(async () => {
        fireEvent.click(signUpLink);
      });

      // Should show registration form
      expect(screen.getByText(/create account/i)).toBeInTheDocument();

      // Fill in registration form
      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const fitnessLevelSelect = screen.getByLabelText(/fitness level/i);
      const registerButton = screen.getByRole('button', { name: /create account/i });

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
        fireEvent.change(usernameInput, { target: { value: 'newuser' } });
        fireEvent.change(displayNameInput, { target: { value: 'New User' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(fitnessLevelSelect, { target: { value: 'beginner' } });
      });

      // Submit registration form
      await act(async () => {
        fireEvent.click(registerButton);
      });

      // Should call register with correct data
      expect(mockAuthStore.register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        username: 'newuser',
        display_name: 'New User',
        password: 'password123',
        fitness_level: 'beginner',
      });
    });

    it('should handle registration validation errors', async () => {
      renderAuthContainer();

      // Switch to registration form
      const signUpLink = screen.getByText(/sign up/i);
      await act(async () => {
        fireEvent.click(signUpLink);
      });

      // Try to submit empty form
      const registerButton = screen.getByRole('button', { name: /create account/i });
      await act(async () => {
        fireEvent.click(registerButton);
      });

      // Should show validation errors
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('should validate password strength', async () => {
      renderAuthContainer();

      // Switch to registration form
      const signUpLink = screen.getByText(/sign up/i);
      await act(async () => {
        fireEvent.click(signUpLink);
      });

      // Enter weak password
      const passwordInput = screen.getByLabelText(/password/i);
      await act(async () => {
        fireEvent.change(passwordInput, { target: { value: '123' } });
        fireEvent.blur(passwordInput);
      });

      // Should show password strength error
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('should handle username availability check', async () => {
      renderAuthContainer();

      // Switch to registration form
      const signUpLink = screen.getByText(/sign up/i);
      await act(async () => {
        fireEvent.click(signUpLink);
      });

      // Enter username
      const usernameInput = screen.getByLabelText(/username/i);
      await act(async () => {
        fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
        fireEvent.blur(usernameInput);
      });

      // Mock username check (would normally be async)
      await waitFor(() => {
        // Should show availability indicator
        expect(screen.getByText(/checking availability/i)).toBeInTheDocument();
      });
    });
  });

  describe('Guest Mode Flow', () => {
    it('should handle guest mode selection', async () => {
      renderAuthContainer();

      // Should show guest mode option
      const guestButton = screen.getByText(/continue as guest/i);
      
      await act(async () => {
        fireEvent.click(guestButton);
      });

      // Should set guest user
      expect(mockAuthStore.setUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^guest-/),
          username: expect.stringMatching(/^Guest/),
        })
      );
    });

    it('should handle guest to registered user conversion', async () => {
      // Mock guest user state
      const guestUser = {
        id: 'guest-123',
        username: 'Guest User',
        display_name: 'Guest User',
        fitness_level: 'beginner' as const,
        is_guest: true,
        created_at: new Date(),
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        user: guestUser,
        isAuthenticated: true,
      });

      renderAuthContainer();

      // Should show upgrade prompt
      expect(screen.getByText(/upgrade to full account/i)).toBeInTheDocument();

      const upgradeButton = screen.getByText(/upgrade account/i);
      await act(async () => {
        fireEvent.click(upgradeButton);
      });

      // Should show registration form with pre-filled data
      expect(screen.getByDisplayValue('Guest User')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should handle automatic login on app start', async () => {
      // Mock stored token
      mockLocalStorage.getItem.mockReturnValue('stored-token');
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      // Mock authenticated state
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        user: mockUser,
        isAuthenticated: true,
      });

      renderAuthContainer();

      // Should show authenticated state
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('should handle token expiration', async () => {
      // Mock expired token scenario
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Token expired'));

      // Mock unauthenticated state after token expiry
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        user: null,
        isAuthenticated: false,
        error: 'Session expired. Please sign in again.',
      });

      renderAuthContainer();

      // Should show login form with session expired message
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });

    it('should handle logout flow', async () => {
      // Mock authenticated state
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        user: mockUser,
        isAuthenticated: true,
      });

      renderAuthContainer();

      // Find and click logout button
      const logoutButton = screen.getByText(/sign out/i);
      await act(async () => {
        fireEvent.click(logoutButton);
      });

      // Should call logout
      expect(mockAuthStore.logout).toHaveBeenCalled();

      // Should clear local storage
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('Form Persistence', () => {
    it('should persist form data during navigation', async () => {
      renderAuthContainer();

      // Fill in some form data
      const emailInput = screen.getByLabelText(/email/i);
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      });

      // Switch to registration and back
      const signUpLink = screen.getByText(/sign up/i);
      await act(async () => {
        fireEvent.click(signUpLink);
      });

      const signInLink = screen.getByText(/sign in/i);
      await act(async () => {
        fireEvent.click(signInLink);
      });

      // Email should be preserved
      const emailInputAfter = screen.getByLabelText(/email/i);
      expect(emailInputAfter).toHaveValue('test@example.com');
    });
  });

  describe('Accessibility', () => {
    it('should handle keyboard navigation', async () => {
      renderAuthContainer();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      // Tab through form elements
      emailInput.focus();
      fireEvent.keyDown(emailInput, { key: 'Tab' });
      expect(passwordInput).toHaveFocus();

      fireEvent.keyDown(passwordInput, { key: 'Tab' });
      expect(loginButton).toHaveFocus();
    });

    it('should announce form errors to screen readers', async () => {
      renderAuthContainer();

      // Submit empty form
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await act(async () => {
        fireEvent.click(loginButton);
      });

      // Error messages should have proper ARIA attributes
      const emailError = screen.getByText(/email is required/i);
      expect(emailError).toHaveAttribute('role', 'alert');
    });

    it('should have proper form labels and descriptions', async () => {
      renderAuthContainer();

      // All form inputs should have labels
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Form should have proper structure
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should allow error dismissal and retry', async () => {
      // Mock error state
      vi.mocked(useAuthStore).mockReturnValue({
        ...mockAuthStore,
        error: 'Network error occurred',
      });

      renderAuthContainer();

      // Should show error message
      expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();

      // Should have dismiss button
      const dismissButton = screen.getByText(/dismiss|close/i);
      await act(async () => {
        fireEvent.click(dismissButton);
      });

      // Should call clearError
      expect(mockAuthStore.clearError).toHaveBeenCalled();
    });

    it('should handle network connectivity issues', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      renderAuthContainer();

      // Try to login while offline
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(loginButton);
      });

      // Should show offline message
      expect(screen.getByText(/you appear to be offline/i)).toBeInTheDocument();
    });
  });
});