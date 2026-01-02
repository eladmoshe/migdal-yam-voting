import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoterPage } from '../VoterPage';
import * as VotingContext from '../../context/VotingContext';
import { createMockApartment, createMockVotingIssue } from '../../test/mocks';

// Mock the context
vi.mock('../../context/VotingContext', () => ({
  useVoting: vi.fn(),
}));

// Mock the child components
vi.mock('../../components/LoginScreen', () => ({
  LoginScreen: () => <div data-testid="login-screen">Login Screen</div>,
}));

vi.mock('../../components/VotingScreen', () => ({
  VotingScreen: ({ apartment, issue }: { apartment: { number: string }; issue: { title: string } }) => (
    <div data-testid="voting-screen">
      Voting Screen - {apartment.number} - {issue.title}
    </div>
  ),
}));

const mockUseVoting = vi.mocked(VotingContext.useVoting);

describe('VoterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading spinner when loading issue', () => {
      mockUseVoting.mockReturnValue({
        apartment: null,
        isLoggedIn: false,
        currentIssue: null,
        isLoadingIssue: true,
        issueError: null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshIssue: vi.fn(),
      });

      render(<VoterPage />);

      expect(screen.getByText(/טוען/i)).toBeInTheDocument();
    });
  });

  describe('no active issue', () => {
    it('should show no active issue message when issue is null', () => {
      mockUseVoting.mockReturnValue({
        apartment: null,
        isLoggedIn: false,
        currentIssue: null,
        isLoadingIssue: false,
        issueError: null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshIssue: vi.fn(),
      });

      render(<VoterPage />);

      expect(screen.getByText(/אין הצבעה פעילה כרגע/i)).toBeInTheDocument();
      expect(screen.getByText(/מגדל ים/i)).toBeInTheDocument();
    });

    it('should show error message when there is an issue error', () => {
      mockUseVoting.mockReturnValue({
        apartment: null,
        isLoggedIn: false,
        currentIssue: null,
        isLoadingIssue: false,
        issueError: 'שגיאה בטעינת ההצבעה',
        login: vi.fn(),
        logout: vi.fn(),
        refreshIssue: vi.fn(),
      });

      render(<VoterPage />);

      expect(screen.getByText(/שגיאה בטעינת ההצבעה/i)).toBeInTheDocument();
    });
  });

  describe('not logged in', () => {
    it('should show login screen when not logged in', () => {
      mockUseVoting.mockReturnValue({
        apartment: null,
        isLoggedIn: false,
        currentIssue: createMockVotingIssue(),
        isLoadingIssue: false,
        issueError: null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshIssue: vi.fn(),
      });

      render(<VoterPage />);

      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    });
  });

  describe('logged in', () => {
    it('should show voting screen when logged in', () => {
      const mockApartment = createMockApartment({ number: '42' });
      const mockIssue = createMockVotingIssue({ title: 'הצבעה לדוגמה' });

      mockUseVoting.mockReturnValue({
        apartment: mockApartment,
        isLoggedIn: true,
        currentIssue: mockIssue,
        isLoadingIssue: false,
        issueError: null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshIssue: vi.fn(),
      });

      render(<VoterPage />);

      expect(screen.getByTestId('voting-screen')).toBeInTheDocument();
      expect(screen.getByText(/42/)).toBeInTheDocument();
      expect(screen.getByText(/הצבעה לדוגמה/)).toBeInTheDocument();
    });
  });
});
