import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from '../AuthContext';
import * as auth from '../../lib/auth';
import { createMockSession, createMockUser } from '../../test/mocks';

// Mock the auth module
vi.mock('../../lib/auth', () => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  checkIsAdmin: vi.fn(),
}));

const mockGetSession = vi.mocked(auth.getSession);
const mockOnAuthStateChange = vi.mocked(auth.onAuthStateChange);
const mockCheckIsAdmin = vi.mocked(auth.checkIsAdmin);

// Test component that uses the hook
function TestConsumer() {
  const {
    user,
    session,
    isLoading,
    isAdmin,
    isCheckingAdmin,
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="session">{session ? 'active' : 'null'}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="isAdmin">{isAdmin.toString()}</div>
      <div data-testid="isCheckingAdmin">{isCheckingAdmin.toString()}</div>
    </div>
  );
}

describe('AuthContext', () => {
  let unsubscribeMock: ReturnType<typeof vi.fn>;
  let authStateCallback: ((event: string, session: Session | null) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateCallback = null;
    unsubscribeMock = vi.fn();

    // Default mock for onAuthStateChange - capture the callback
    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            id: 'test-subscription-id',
            callback: callback,
            unsubscribe: unsubscribeMock,
          },
        },
      } as ReturnType<typeof auth.onAuthStateChange>;
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    describe('initial state', () => {
      it('should start in loading state', async () => {
        mockGetSession.mockImplementation(() => new Promise(() => {}));

        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        expect(screen.getByTestId('isLoading')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      it('should load session on mount', async () => {
        const mockSession = createMockSession();
        mockGetSession.mockResolvedValue(mockSession);
        mockCheckIsAdmin.mockResolvedValue(true);

        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        });

        expect(screen.getByTestId('user')).toHaveTextContent('admin@example.com');
        expect(screen.getByTestId('session')).toHaveTextContent('active');
      });
    });

    describe('when no session exists', () => {
      it('should show no user when session is null', async () => {
        mockGetSession.mockResolvedValue(null);

        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        });

        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('session')).toHaveTextContent('null');
        expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
      });
    });

    describe('admin check', () => {
      it('should check admin status when session exists', async () => {
        const mockSession = createMockSession();
        mockGetSession.mockResolvedValue(mockSession);
        mockCheckIsAdmin.mockResolvedValue(true);

        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(mockCheckIsAdmin).toHaveBeenCalledWith('user-123');
        });

        await waitFor(() => {
          expect(screen.getByTestId('isAdmin')).toHaveTextContent('true');
          expect(screen.getByTestId('isCheckingAdmin')).toHaveTextContent('false');
        });
      });

      it('should set isAdmin to false when not admin', async () => {
        const mockSession = createMockSession();
        mockGetSession.mockResolvedValue(mockSession);
        mockCheckIsAdmin.mockResolvedValue(false);

        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
        });
      });

      it('should not check admin when no session', async () => {
        mockGetSession.mockResolvedValue(null);

        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        });

        expect(mockCheckIsAdmin).not.toHaveBeenCalled();
      });
    });

    describe('auth state changes', () => {
      it('should update on SIGNED_IN event', async () => {
        mockGetSession.mockResolvedValue(null);
        mockCheckIsAdmin.mockResolvedValue(true);

        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        });

        expect(screen.getByTestId('user')).toHaveTextContent('null');

        // Simulate sign in event
        const newSession = createMockSession({ user: createMockUser({ email: 'new@example.com' }) });
        await act(async () => {
          authStateCallback?.('SIGNED_IN', newSession);
        });

        await waitFor(() => {
          expect(screen.getByTestId('user')).toHaveTextContent('new@example.com');
        });

        expect(mockCheckIsAdmin).toHaveBeenCalled();
      });

      it('should clear admin status on SIGNED_OUT event', async () => {
        const mockSession = createMockSession();
        mockGetSession.mockResolvedValue(mockSession);
        mockCheckIsAdmin.mockResolvedValue(true);

        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isAdmin')).toHaveTextContent('true');
        });

        // Simulate sign out event
        await act(async () => {
          authStateCallback?.('SIGNED_OUT', null);
        });

        expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });

    describe('cleanup', () => {
      it('should unsubscribe from auth changes on unmount', async () => {
        mockGetSession.mockResolvedValue(null);

        const { unmount } = render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
        });

        unmount();

        expect(unsubscribeMock).toHaveBeenCalled();
      });
    });
  });
});
