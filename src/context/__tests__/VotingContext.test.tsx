import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { VotingProvider, useVoting } from '../VotingContext';
import * as api from '../../lib/api';
import { createMockVotingIssue, createMockApartment } from '../../test/mocks';

// Mock the API module
vi.mock('../../lib/api', () => ({
  getActiveIssue: vi.fn(),
}));

const mockGetActiveIssue = vi.mocked(api.getActiveIssue);

// Test component that uses the hook
function TestConsumer() {
  const {
    apartment,
    isLoggedIn,
    currentIssue,
    isLoadingIssue,
    issueError,
    login,
    logout,
    refreshIssue,
  } = useVoting();

  return (
    <div>
      <div data-testid="isLoggedIn">{isLoggedIn.toString()}</div>
      <div data-testid="apartment">{apartment ? apartment.number : 'null'}</div>
      <div data-testid="currentIssue">{currentIssue ? currentIssue.title : 'null'}</div>
      <div data-testid="isLoadingIssue">{isLoadingIssue.toString()}</div>
      <div data-testid="issueError">{issueError || 'null'}</div>
      <button onClick={() => login(createMockApartment())}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshIssue}>Refresh</button>
    </div>
  );
}

describe('VotingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useVoting hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useVoting must be used within a VotingProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('VotingProvider', () => {
    describe('initial state', () => {
      it('should start with no apartment logged in', async () => {
        mockGetActiveIssue.mockResolvedValue(createMockVotingIssue());

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('false');
        expect(screen.getByTestId('apartment')).toHaveTextContent('null');
      });

      it('should start in loading state', () => {
        mockGetActiveIssue.mockImplementation(() => new Promise(() => {}));

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        expect(screen.getByTestId('isLoadingIssue')).toHaveTextContent('true');
      });

      it('should load active issue on mount', async () => {
        const mockIssue = createMockVotingIssue({ title: 'הצבעה חשובה' });
        mockGetActiveIssue.mockResolvedValue(mockIssue);

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoadingIssue')).toHaveTextContent('false');
        });

        expect(screen.getByTestId('currentIssue')).toHaveTextContent('הצבעה חשובה');
        expect(screen.getByTestId('issueError')).toHaveTextContent('null');
      });
    });

    describe('when no active issue exists', () => {
      it('should show error message when no active issue', async () => {
        mockGetActiveIssue.mockResolvedValue(null);

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('issueError')).toHaveTextContent('אין הצבעה פעילה כרגע');
        });

        expect(screen.getByTestId('currentIssue')).toHaveTextContent('null');
      });
    });

    describe('when API fails', () => {
      it('should show error message on API failure', async () => {
        mockGetActiveIssue.mockRejectedValue(new Error('Network error'));

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('issueError')).toHaveTextContent('שגיאה בטעינת ההצבעה');
        });

        expect(screen.getByTestId('currentIssue')).toHaveTextContent('null');
        expect(screen.getByTestId('isLoadingIssue')).toHaveTextContent('false');
      });
    });

    describe('login functionality', () => {
      it('should set apartment on login', async () => {
        mockGetActiveIssue.mockResolvedValue(createMockVotingIssue());

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoadingIssue')).toHaveTextContent('false');
        });

        const loginButton = screen.getByRole('button', { name: 'Login' });
        await act(async () => {
          loginButton.click();
        });

        expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('true');
        expect(screen.getByTestId('apartment')).toHaveTextContent('42');
      });
    });

    describe('logout functionality', () => {
      it('should clear apartment on logout', async () => {
        mockGetActiveIssue.mockResolvedValue(createMockVotingIssue());

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoadingIssue')).toHaveTextContent('false');
        });

        // First login
        const loginButton = screen.getByRole('button', { name: 'Login' });
        await act(async () => {
          loginButton.click();
        });

        expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('true');

        // Then logout
        const logoutButton = screen.getByRole('button', { name: 'Logout' });
        await act(async () => {
          logoutButton.click();
        });

        expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('false');
        expect(screen.getByTestId('apartment')).toHaveTextContent('null');
      });
    });

    describe('refreshIssue functionality', () => {
      it('should refresh issue data', async () => {
        mockGetActiveIssue.mockResolvedValueOnce(createMockVotingIssue({ title: 'הצבעה ראשונה' }));
        mockGetActiveIssue.mockResolvedValueOnce(createMockVotingIssue({ title: 'הצבעה שנייה' }));

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('currentIssue')).toHaveTextContent('הצבעה ראשונה');
        });

        const refreshButton = screen.getByRole('button', { name: 'Refresh' });
        await act(async () => {
          refreshButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('currentIssue')).toHaveTextContent('הצבעה שנייה');
        });
      });

      it('should show loading state during refresh', async () => {
        mockGetActiveIssue.mockResolvedValueOnce(createMockVotingIssue());
        mockGetActiveIssue.mockImplementationOnce(() => new Promise(() => {}));

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('isLoadingIssue')).toHaveTextContent('false');
        });

        const refreshButton = screen.getByRole('button', { name: 'Refresh' });
        await act(async () => {
          refreshButton.click();
        });

        expect(screen.getByTestId('isLoadingIssue')).toHaveTextContent('true');
      });

      it('should clear previous error on refresh', async () => {
        mockGetActiveIssue.mockRejectedValueOnce(new Error('Network error'));
        mockGetActiveIssue.mockResolvedValueOnce(createMockVotingIssue({ title: 'הצבעה חדשה' }));

        render(
          <VotingProvider>
            <TestConsumer />
          </VotingProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('issueError')).toHaveTextContent('שגיאה בטעינת ההצבעה');
        });

        const refreshButton = screen.getByRole('button', { name: 'Refresh' });
        await act(async () => {
          refreshButton.click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('issueError')).toHaveTextContent('null');
          expect(screen.getByTestId('currentIssue')).toHaveTextContent('הצבעה חדשה');
        });
      });
    });
  });
});
