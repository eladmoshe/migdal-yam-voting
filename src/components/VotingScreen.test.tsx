import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VotingScreen } from './VotingScreen';
import * as api from '../lib/api';
import type { Apartment, VotingIssue } from '../types';

// Mock the API module
vi.mock('../lib/api', () => ({
  castVote: vi.fn(),
  hasApartmentVoted: vi.fn(),
  getVoteResults: vi.fn(),
}));

const mockCastVote = vi.mocked(api.castVote);
const mockHasApartmentVoted = vi.mocked(api.hasApartmentVoted);
const mockGetVoteResults = vi.mocked(api.getVoteResults);

const mockApartment: Apartment = {
  id: 'apt-1',
  number: '1',
  ownerName: 'משפחת כהן',
};

const mockIssue: VotingIssue = {
  id: 'test-issue-001',
  title: 'שיפוץ חדר המדרגות',
  description: 'האם לאשר שיפוץ חדר המדרגות בעלות של 50,000 ש"ח?',
  active: true,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('VotingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    mockHasApartmentVoted.mockResolvedValue(false);
    mockCastVote.mockResolvedValue(true);
    mockGetVoteResults.mockResolvedValue({ yes: 0, no: 0, total: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Loading State', () => {
    it('should show loading state while checking vote status', () => {
      // Make hasApartmentVoted hang
      mockHasApartmentVoted.mockImplementation(() => new Promise(() => {}));

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      expect(screen.getByText(/בודק סטטוס הצבעה/i)).toBeInTheDocument();
    });
  });

  describe('Voting View', () => {
    it('should render voting screen with apartment info after loading', async () => {
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/שלום, דירה 1/i)).toBeInTheDocument();
      });
      expect(screen.getByText('הצבעה')).toBeInTheDocument();
    });

    it('should display issue title and description', async () => {
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(mockIssue.title)).toBeInTheDocument();
      });
      expect(screen.getByText(mockIssue.description)).toBeInTheDocument();
    });

    it('should render Yes and No voting buttons', async () => {
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /נגד/i })).toBeInTheDocument();
    });

    it('should render logout without voting button', async () => {
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /יציאה ללא הצבעה/i })).toBeInTheDocument();
      });
    });

    it('should show loading state when voting', async () => {
      const user = userEvent.setup();
      // Make castVote hang
      mockCastVote.mockImplementation(() => new Promise(() => {}));

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      await user.click(yesButton);

      expect(screen.getByText(/מקליט הצבעה/i)).toBeInTheDocument();
    });

    it('should disable buttons while voting is in progress', async () => {
      const user = userEvent.setup();
      mockCastVote.mockImplementation(() => new Promise(() => {}));

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      const noButton = screen.getByRole('button', { name: /נגד/i });

      await user.click(yesButton);

      expect(yesButton).toBeDisabled();
      expect(noButton).toBeDisabled();
    });

    it('should call onLogout when logout button is clicked', async () => {
      const user = userEvent.setup();
      const onLogout = vi.fn();
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={onLogout}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /יציאה ללא הצבעה/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /יציאה ללא הצבעה/i });
      await user.click(logoutButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Voting Yes', () => {
    it('should transition to success view after voting yes', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      await user.click(yesButton);

      await waitFor(() => {
        expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      });
    });

    it('should call castVote API with correct parameters', async () => {
      const user = userEvent.setup();

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      await user.click(yesButton);

      await waitFor(() => {
        expect(mockCastVote).toHaveBeenCalledWith('apt-1', 'test-issue-001', 'yes');
      });
    });

    it('should display "בעד" as voted value after voting yes', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      await user.click(yesButton);

      await waitFor(() => {
        expect(screen.getByText('הצבעת:')).toBeInTheDocument();
      });
      // The voted value is displayed in a div with text-xl class
      expect(screen.getByText('בעד')).toBeInTheDocument();
    });
  });

  describe('Voting No', () => {
    it('should transition to success view after voting no', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 0, no: 1, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /נגד/i })).toBeInTheDocument();
      });

      const noButton = screen.getByRole('button', { name: /נגד/i });
      await user.click(noButton);

      await waitFor(() => {
        expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      });
    });

    it('should call castVote API with correct parameters', async () => {
      const user = userEvent.setup();

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /נגד/i })).toBeInTheDocument();
      });

      const noButton = screen.getByRole('button', { name: /נגד/i });
      await user.click(noButton);

      await waitFor(() => {
        expect(mockCastVote).toHaveBeenCalledWith('apt-1', 'test-issue-001', 'no');
      });
    });

    it('should display "נגד" as voted value after voting no', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 0, no: 1, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /נגד/i })).toBeInTheDocument();
      });

      const noButton = screen.getByRole('button', { name: /נגד/i });
      await user.click(noButton);

      await waitFor(() => {
        expect(screen.getByText('הצבעת:')).toBeInTheDocument();
      });
      // The voted value is displayed in a div with text-xl class
      expect(screen.getByText('נגד')).toBeInTheDocument();
    });
  });

  describe('Success View', () => {
    it('should show success message with apartment number', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await waitFor(() => {
        expect(screen.getByText(/הצבעתך נקלטה בהצלחה/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/דירה 1/i)).toBeInTheDocument();
    });

    it('should have toggle results button', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /הצג תוצאות ביניים/i })).toBeInTheDocument();
      });
    });

    it('should show results when toggle button is clicked', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await waitFor(() => {
        expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', { name: /הצג תוצאות ביניים/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/תוצאות עד כה/i)).toBeInTheDocument();
      });
    });

    it('should hide results when toggle button is clicked again', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await waitFor(() => {
        expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      });

      // Show results
      await user.click(screen.getByRole('button', { name: /הצג תוצאות ביניים/i }));
      await waitFor(() => {
        expect(screen.getByText(/תוצאות עד כה/i)).toBeInTheDocument();
      });

      // Hide results
      await user.click(screen.getByRole('button', { name: /הסתר תוצאות/i }));
      await waitFor(() => {
        expect(screen.queryByText(/תוצאות עד כה/i)).not.toBeInTheDocument();
      });
    });

    it('should call onLogout when exit button is clicked in success view', async () => {
      const user = userEvent.setup();
      const onLogout = vi.fn();
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={onLogout}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await waitFor(() => {
        expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      });

      const exitButton = screen.getByRole('button', { name: /^יציאה$/i });
      await user.click(exitButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Already Voted', () => {
    it('should show success view if apartment already voted', async () => {
      mockHasApartmentVoted.mockResolvedValue(true);
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      // Should show success view, not voting view
      await waitFor(() => {
        expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/מה עמדתך/i)).not.toBeInTheDocument();
    });

    it('should not show voted value if apartment already voted before session', async () => {
      mockHasApartmentVoted.mockResolvedValue(true);
      mockGetVoteResults.mockResolvedValue({ yes: 1, no: 0, total: 1 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      });

      // votedValue is only set when voting in current session
      expect(screen.queryByText('הצבעת:')).not.toBeInTheDocument();
    });
  });

  describe('Vote Results Display', () => {
    it('should display correct vote counts', async () => {
      const user = userEvent.setup();
      mockGetVoteResults.mockResolvedValue({ yes: 3, no: 1, total: 4 });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      });

      // Vote
      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await waitFor(() => {
        expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      });

      // Show results
      await user.click(screen.getByRole('button', { name: /הצג תוצאות ביניים/i }));

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // yes count
        expect(screen.getByText('1')).toBeInTheDocument(); // no count
      });
    });
  });
});
