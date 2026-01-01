import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { IssueDetails } from '../IssueDetails';
import * as api from '../../../lib/api';
import { createMockVotingIssueWithCounts, createMockVoteWithApartment } from '../../../test/mocks';

// Mock the API module
vi.mock('../../../lib/api', () => ({
  getAllIssues: vi.fn(),
  getVotesByIssue: vi.fn(),
  toggleIssueActive: vi.fn(),
}));

const mockGetAllIssues = vi.mocked(api.getAllIssues);
const mockGetVotesByIssue = vi.mocked(api.getVotesByIssue);
const mockToggleIssueActive = vi.mocked(api.toggleIssueActive);

function renderIssueDetails(issueId: string = 'issue-123') {
  return render(
    <MemoryRouter initialEntries={[`/admin/issues/${issueId}`]}>
      <Routes>
        <Route path="/admin/issues/:id" element={<IssueDetails />} />
        <Route path="/admin" element={<div>Admin Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('IssueDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading state initially', () => {
      mockGetAllIssues.mockImplementation(() => new Promise(() => {}));
      mockGetVotesByIssue.mockImplementation(() => new Promise(() => {}));

      renderIssueDetails();

      expect(screen.getByText(/טוען נתונים/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error when API fails', async () => {
      mockGetAllIssues.mockRejectedValue(new Error('Network error'));
      mockGetVotesByIssue.mockResolvedValue([]);

      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText(/שגיאה בטעינת הנתונים/i)).toBeInTheDocument();
      });
    });

    it('should show not found when issue does not exist', async () => {
      mockGetAllIssues.mockResolvedValue([]);
      mockGetVotesByIssue.mockResolvedValue([]);

      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText(/ההצבעה לא נמצאה/i)).toBeInTheDocument();
      });
    });

    it('should have link back to admin dashboard on error', async () => {
      mockGetAllIssues.mockResolvedValue([]);
      mockGetVotesByIssue.mockResolvedValue([]);

      renderIssueDetails();

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /חזרה לרשימה/i });
        expect(backLink).toBeInTheDocument();
      });
    });
  });

  describe('successful render', () => {
    const mockIssue = createMockVotingIssueWithCounts({
      id: 'issue-123',
      title: 'הצבעה לדוגמה',
      description: 'תיאור ההצבעה',
      active: true,
      yesCount: 10,
      noCount: 5,
      totalCount: 15,
      createdAt: '2024-01-01T10:00:00Z',
    });

    const mockVotes = [
      createMockVoteWithApartment({
        voteId: 'vote-1',
        apartmentNumber: '42',
        ownerName: 'משפחת כהן',
        vote: 'yes',
        votedAt: '2024-01-01T12:00:00Z',
      }),
      createMockVoteWithApartment({
        voteId: 'vote-2',
        apartmentNumber: '43',
        ownerName: 'משפחת לוי',
        vote: 'no',
        votedAt: '2024-01-01T13:00:00Z',
      }),
    ];

    beforeEach(() => {
      mockGetAllIssues.mockResolvedValue([mockIssue]);
      mockGetVotesByIssue.mockResolvedValue(mockVotes);
    });

    it('should display issue title and description', async () => {
      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText('הצבעה לדוגמה')).toBeInTheDocument();
        expect(screen.getByText('תיאור ההצבעה')).toBeInTheDocument();
      });
    });

    it('should display vote statistics', async () => {
      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // yes count
        expect(screen.getByText('5')).toBeInTheDocument(); // no count
        expect(screen.getByText('15')).toBeInTheDocument(); // total count
      });
    });

    it('should display vote percentages', async () => {
      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText('67%')).toBeInTheDocument(); // yes percent
        expect(screen.getByText('33%')).toBeInTheDocument(); // no percent
      });
    });

    it('should show active badge for active issue', async () => {
      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText('פעיל')).toBeInTheDocument();
      });
    });

    it('should show close button for active issue', async () => {
      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /סגור הצבעה/i })).toBeInTheDocument();
      });
    });

    it('should display votes table with vote history', async () => {
      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText('היסטוריית הצבעות')).toBeInTheDocument();
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
        expect(screen.getByText('משפחת לוי')).toBeInTheDocument();
      });
    });

    it('should display correct vote badges', async () => {
      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getAllByText('בעד').length).toBeGreaterThan(0);
        expect(screen.getAllByText('נגד').length).toBeGreaterThan(0);
      });
    });

    it('should have link back to admin', async () => {
      renderIssueDetails();

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /חזרה לרשימה/i });
        expect(backLink).toHaveAttribute('href', '/admin');
      });
    });
  });

  describe('inactive issue', () => {
    it('should show closed badge for inactive issue', async () => {
      const inactiveIssue = createMockVotingIssueWithCounts({
        id: 'issue-123',
        active: false,
        closedAt: '2024-01-02T10:00:00Z',
      });
      mockGetAllIssues.mockResolvedValue([inactiveIssue]);
      mockGetVotesByIssue.mockResolvedValue([]);

      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText('סגור')).toBeInTheDocument();
      });
    });

    it('should show activate button for inactive issue', async () => {
      const inactiveIssue = createMockVotingIssueWithCounts({
        id: 'issue-123',
        active: false,
      });
      mockGetAllIssues.mockResolvedValue([inactiveIssue]);
      mockGetVotesByIssue.mockResolvedValue([]);

      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /הפעל הצבעה/i })).toBeInTheDocument();
      });
    });
  });

  describe('empty votes', () => {
    it('should show empty state when no votes', async () => {
      const issue = createMockVotingIssueWithCounts({
        id: 'issue-123',
        yesCount: 0,
        noCount: 0,
        totalCount: 0,
      });
      mockGetAllIssues.mockResolvedValue([issue]);
      mockGetVotesByIssue.mockResolvedValue([]);

      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByText('עדיין אין הצבעות')).toBeInTheDocument();
      });
    });
  });

  describe('toggle active status', () => {
    it('should toggle issue from active to inactive', async () => {
      const user = userEvent.setup();
      const activeIssue = createMockVotingIssueWithCounts({
        id: 'issue-123',
        active: true,
      });
      mockGetAllIssues.mockResolvedValue([activeIssue]);
      mockGetVotesByIssue.mockResolvedValue([]);
      mockToggleIssueActive.mockResolvedValue(true);

      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /סגור הצבעה/i })).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /סגור הצבעה/i });
      await user.click(closeButton);

      expect(mockToggleIssueActive).toHaveBeenCalledWith('issue-123', false);
    });

    it('should toggle issue from inactive to active', async () => {
      const user = userEvent.setup();
      const inactiveIssue = createMockVotingIssueWithCounts({
        id: 'issue-123',
        active: false,
      });
      mockGetAllIssues.mockResolvedValue([inactiveIssue]);
      mockGetVotesByIssue.mockResolvedValue([]);
      mockToggleIssueActive.mockResolvedValue(true);

      renderIssueDetails();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /הפעל הצבעה/i })).toBeInTheDocument();
      });

      const activateButton = screen.getByRole('button', { name: /הפעל הצבעה/i });
      await user.click(activateButton);

      expect(mockToggleIssueActive).toHaveBeenCalledWith('issue-123', true);
    });

    it('should reload data after toggle', async () => {
      const user = userEvent.setup();
      const activeIssue = createMockVotingIssueWithCounts({
        id: 'issue-123',
        active: true,
      });
      mockGetAllIssues.mockResolvedValue([activeIssue]);
      mockGetVotesByIssue.mockResolvedValue([]);
      mockToggleIssueActive.mockResolvedValue(true);

      renderIssueDetails();

      await waitFor(() => {
        expect(mockGetAllIssues).toHaveBeenCalledTimes(1);
      });

      const closeButton = screen.getByRole('button', { name: /סגור הצבעה/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockGetAllIssues).toHaveBeenCalledTimes(2);
      });
    });
  });
});
