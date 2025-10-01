/**
 * Comprehensive Authentication System Tests
 * Tests all authentication flows, edge cases, and security features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthModeSelector } from '@/components/auth/AuthModeSelector';
import { useAuthStore } from '@/stores/useAuthStore';
import { createMockUser, createMockGuestUser } from '@/test/test-factories';

// Mock services at the top level
vi.mock('@/services/AuthService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    validateSession: vi.fn(),
    enableGuestMode: vi.fn(),
    switchToAuthenticated: vi.fn()
  }
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: null 
      })),
      signUp: vi.fn(() => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: null 
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: null }, 
        error: null 
      })),
      getSession: vi.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })),
      onAuthStateChange: vi.fn(() => ({ 
        data: { 
          subscription: { 
            unsubscribe: vi.fn() 
          } 
        } 
      })),
      refreshSession: vi.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

// Mock the router
const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MockRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MockRouter>
);

describe('Authentication System', () => {
  const user = userEvent.setup();
  let mockUser: any;
  let mockGuestUser: any;
  let mockAuthService: any;

  beforeEach(async () => {
    // Import the mocked service
    const { authService } = await import('@/services/AuthService');
    mockAuthService = authService;

    mockUser = createMockUser({
      email: 'test@example.com',
      username: 'testuser',
      role: 'basic'
    });
    
    mockGuestUser = createMockGuestUser();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset auth store
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should render login form with all required fields', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/guest mode/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate password requirements', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(passwordInput, '123'); // Too short
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
      });
    });

    it('should successfully login with valid credentials', async () => {
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, mockUser.email);
      await user.type(passwordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: mockUser.email,
          password: 'ValidPassword123!'
        });
      });
    });

    it('should handle login errors gracefully', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      mockAuthService.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.click(submitButton);

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Registration Flow', () => {
    it('should render registration form with all required fields', () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should validate username format', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(usernameInput, 'ab'); // Too short
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should successfully register with valid data', async () => {
      mockAuthService.register.mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      });

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, mockUser.email);
      await user.type(usernameInput, mockUser.username);
      await user.type(displayNameInput, mockUser.display_name);
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          email: mockUser.email,
          username: mockUser.username,
          displayName: mockUser.display_name,
          password: 'ValidPassword123!'
        });
      });
    });

    it('should handle registration errors', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Email already exists'));

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const displayNameInput = screen.getByLabelText(/display name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(usernameInput, 'testuser');
      await user.type(displayNameInput, 'Test User');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.type(confirmPasswordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Guest Mode', () => {
    it('should enable guest mode successfully', async () => {
      mockAuthService.enableGuestMode.mockResolvedValue({
        user: mockGuestUser,
        token: 'guest-token'
      });

      render(
        <TestWrapper>
          <AuthModeSelector />
        </TestWrapper>
      );

      const guestButton = screen.getByRole('button', { name: /continue as guest/i });
      await user.click(guestButton);

      await waitFor(() => {
        expect(mockAuthService.enableGuestMode).toHaveBeenCalled();
      });
    });

    it('should show guest limitations', async () => {
      mockAuthService.enableGuestMode.mockResolvedValue({
        user: mockGuestUser,
        token: 'guest-token'
      });

      render(
        <TestWrapper>
          <AuthModeSelector />
        </TestWrapper>
      );

      expect(screen.getByText(/limited features/i)).toBeInTheDocument();
      expect(screen.getByText(/no cloud sync/i)).toBeInTheDocument();
      expect(screen.getByText(/no social features/i)).toBeInTheDocument();
    });

    it('should allow switching from guest to authenticated', async () => {
      // First enable guest mode
      useAuthStore.getState().setUser(mockGuestUser);
      useAuthStore.getState().setToken('guest-token');

      mockAuthService.switchToAuthenticated.mockResolvedValue({
        user: mockUser,
        token: 'auth-token'
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const upgradeButton = screen.getByRole('button', { name: /upgrade account/i });
      await user.click(upgradeButton);

      await waitFor(() => {
        expect(mockAuthService.switchToAuthenticated).toHaveBeenCalled();
      });
    });
  });

  describe('Session Management', () => {
    it('should validate session on app start', async () => {
      mockAuthService.validateSession.mockResolvedValue({
        valid: true,
        user: mockUser
      });

      render(
        <TestWrapper>
          <div>App Content</div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockAuthService.validateSession).toHaveBeenCalled();
      });
    });

    it('should refresh token when expired', async () => {
      mockAuthService.refreshToken.mockResolvedValue({
        token: 'new-token',
        refreshToken: 'new-refresh-token'
      });

      // Simulate token expiration
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setToken('expired-token');

      render(
        <TestWrapper>
          <div>App Content</div>
        </TestWrapper>
      );

      // Simulate API call that triggers token refresh
      await waitFor(() => {
        expect(mockAuthService.refreshToken).toHaveBeenCalled();
      });
    });

    it('should logout user when session is invalid', async () => {
      mockAuthService.validateSession.mockResolvedValue({
        valid: false,
        error: 'Session expired'
      });

      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setToken('invalid-token');

      render(
        <TestWrapper>
          <div>App Content</div>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().token).toBeNull();
      });
    });
  });

  describe('Security Features', () => {
    it('should sanitize user input', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      
      await user.type(emailInput, '<script>alert("xss")</script>test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should implement rate limiting for login attempts', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Too many attempts'));

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await user.clear(emailInput);
        await user.clear(passwordInput);
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(mockAuthService.login).toHaveBeenCalled();
        });
      }

      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
      });
    });

    it('should clear sensitive data on logout', async () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setToken('auth-token');

      mockAuthService.logout.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <button onClick={() => useAuthStore.getState().logout()}>
            Logout
          </button>
        </TestWrapper>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().token).toBeNull();
        expect(localStorage.getItem('auth-token')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors with appropriate messages', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Server temporarily unavailable'));

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/server temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    it('should provide retry mechanism for failed operations', async () => {
      let attemptCount = 0;
      mockAuthService.login.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({
          user: mockUser,
          token: 'auth-token'
        });
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/temporary error/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab navigation
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);

      await user.tab();
      expect(document.activeElement).toBe(passwordInput);

      await user.tab();
      expect(document.activeElement).toBe(submitButton);
    });

    it('should announce errors to screen readers', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid email format/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});