/**
 * Simple Authentication Test
 * Verifies basic auth functionality without complex components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';

// Mock Supabase
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
      }))
    }
  }
}));

// Test component that uses auth
const TestComponent = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (user) return <div>Authenticated: {user.email}</div>;
  return <div>Not authenticated</div>;
};

describe('Simple Auth Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AuthProvider without errors', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should show loading initially, then not authenticated
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for auth state to resolve
    await screen.findByText('Not authenticated');
    expect(screen.getByText('Not authenticated')).toBeInTheDocument();
  });

  it('should provide auth context', () => {
    const TestContextComponent = () => {
      const auth = useAuth();
      return <div>Context available: {auth ? 'yes' : 'no'}</div>;
    };

    render(
      <AuthProvider>
        <TestContextComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Context available: yes')).toBeInTheDocument();
  });
});