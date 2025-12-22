import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VotingScreen } from './VotingScreen';
import { votes } from '../data/mockData';
import type { Apartment, VotingIssue } from '../types';

const mockApartment: Apartment = {
  number: '1',
  pin: '12345',
  ownerName: 'משפחת כהן',
};

const mockIssue: VotingIssue = {
  id: 'test-issue-001',
  title: 'שיפוץ חדר המדרגות',
  description: 'האם לאשר שיפוץ חדר המדרגות בעלות של 50,000 ש"ח?',
  active: true,
};

describe('VotingScreen', () => {
  beforeEach(() => {
    // Clear votes array before each test
    votes.length = 0;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Voting View', () => {
    it('should render voting screen with apartment info', () => {
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      expect(screen.getByText(/שלום, דירה 1/i)).toBeInTheDocument();
      expect(screen.getByText('הצבעה')).toBeInTheDocument();
    });

    it('should display issue title and description', () => {
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      expect(screen.getByText(mockIssue.title)).toBeInTheDocument();
      expect(screen.getByText(mockIssue.description)).toBeInTheDocument();
    });

    it('should render Yes and No voting buttons', () => {
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /בעד/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /נגד/i })).toBeInTheDocument();
    });

    it('should render logout without voting button', () => {
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /יציאה ללא הצבעה/i })).toBeInTheDocument();
    });

    it('should show loading state when voting', async () => {
      const user = userEvent.setup();
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      await user.click(yesButton);

      expect(screen.getByText(/מקליט הצבעה/i)).toBeInTheDocument();
    });

    it('should disable buttons while voting is in progress', async () => {
      const user = userEvent.setup();
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

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

      const logoutButton = screen.getByRole('button', { name: /יציאה ללא הצבעה/i });
      await user.click(logoutButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Voting Yes', () => {
    it('should transition to success view after voting yes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      await user.click(yesButton);

      // Advance timers to complete the voting delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
    });

    it('should display "בעד" as voted value after voting yes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      await user.click(yesButton);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText('הצבעת:')).toBeInTheDocument();
      const votedValueElement = screen.getByText('בעד', { selector: 'p.text-2xl' });
      expect(votedValueElement).toBeInTheDocument();
    });

    it('should record vote in votes array', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      const yesButton = screen.getByRole('button', { name: /בעד/i });
      await user.click(yesButton);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(votes).toHaveLength(1);
      expect(votes[0].vote).toBe('yes');
      expect(votes[0].apartmentNumber).toBe('1');
    });
  });

  describe('Voting No', () => {
    it('should transition to success view after voting no', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      const noButton = screen.getByRole('button', { name: /נגד/i });
      await user.click(noButton);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
    });

    it('should display "נגד" as voted value after voting no', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      const noButton = screen.getByRole('button', { name: /נגד/i });
      await user.click(noButton);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText('הצבעת:')).toBeInTheDocument();
      const votedValueElement = screen.getByText('נגד', { selector: 'p.text-2xl' });
      expect(votedValueElement).toBeInTheDocument();
    });

    it('should record no vote in votes array', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      const noButton = screen.getByRole('button', { name: /נגד/i });
      await user.click(noButton);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(votes).toHaveLength(1);
      expect(votes[0].vote).toBe('no');
    });
  });

  describe('Success View', () => {
    it('should show success message with apartment number', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText(/הצבעתך נקלטה בהצלחה/i)).toBeInTheDocument();
      expect(screen.getByText(/דירה 1/i)).toBeInTheDocument();
    });

    it('should have toggle results button', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByRole('button', { name: /הצג תוצאות ביניים/i })).toBeInTheDocument();
    });

    it('should show results when toggle button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();

      const toggleButton = screen.getByRole('button', { name: /הצג תוצאות ביניים/i });
      await user.click(toggleButton);

      expect(screen.getByText(/תוצאות עד כה/i)).toBeInTheDocument();
      expect(screen.getByText(/סה"כ הצביעו/i)).toBeInTheDocument();
    });

    it('should hide results when toggle button is clicked again', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();

      // Show results
      await user.click(screen.getByRole('button', { name: /הצג תוצאות ביניים/i }));
      expect(screen.getByText(/תוצאות עד כה/i)).toBeInTheDocument();

      // Hide results
      await user.click(screen.getByRole('button', { name: /הסתר תוצאות/i }));
      expect(screen.queryByText(/תוצאות עד כה/i)).not.toBeInTheDocument();
    });

    it('should call onLogout when exit button is clicked in success view', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onLogout = vi.fn();
      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={onLogout}
        />
      );

      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();

      const exitButton = screen.getByRole('button', { name: /יציאה/i });
      await user.click(exitButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Already Voted', () => {
    it('should show success view if apartment already voted', () => {
      // Pre-populate a vote
      votes.push({
        issueId: mockIssue.id,
        apartmentNumber: mockApartment.number,
        vote: 'yes',
        timestamp: new Date(),
      });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      // Should immediately show success view, not voting view
      expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();
      expect(screen.queryByText(/מה עמדתך/i)).not.toBeInTheDocument();
    });

    it('should not show voted value if apartment already voted before session', () => {
      // Pre-populate a vote (simulating already voted before this session)
      votes.push({
        issueId: mockIssue.id,
        apartmentNumber: mockApartment.number,
        vote: 'no',
        timestamp: new Date(),
      });

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      // votedValue is only set when voting in current session
      expect(screen.queryByText('הצבעת:')).not.toBeInTheDocument();
    });
  });

  describe('Vote Results Display', () => {
    it('should display correct vote counts', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // Pre-populate some votes
      votes.push(
        { issueId: mockIssue.id, apartmentNumber: '2', vote: 'yes', timestamp: new Date() },
        { issueId: mockIssue.id, apartmentNumber: '3', vote: 'yes', timestamp: new Date() },
        { issueId: mockIssue.id, apartmentNumber: '4', vote: 'no', timestamp: new Date() },
      );

      render(
        <VotingScreen
          apartment={mockApartment}
          issue={mockIssue}
          onLogout={vi.fn()}
        />
      );

      // Vote
      await user.click(screen.getByRole('button', { name: /בעד/i }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(screen.getByText(/תודה רבה/i)).toBeInTheDocument();

      // Show results
      await user.click(screen.getByRole('button', { name: /הצג תוצאות ביניים/i }));

      // Should show 3 yes (2 pre-populated + 1 just voted), 1 no
      expect(screen.getByText('3')).toBeInTheDocument(); // yes count
      expect(screen.getByText('1')).toBeInTheDocument(); // no count
      expect(screen.getByText(/סה"כ הצביעו: 4 דירות/i)).toBeInTheDocument();
    });
  });
});
