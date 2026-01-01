import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboard } from '../AdminDashboard';
import * as api from '../../../lib/api';
import * as auth from '../../../lib/auth';
import { AuthProvider } from '../../../context/AuthContext';
import { createMockSession, createMockVotingIssueWithCounts } from '../../../test/mocks';

// Mock the API and auth modules
vi.mock('../../../lib/api', () => ({
  getAllIssues: vi.fn(),
  toggleIssueActive: vi.fn(),
}));

vi.mock('../../../lib/auth', () => ({
  adminLogout: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  checkIsAdmin: vi.fn(),
}));

const mockGetAllIssues = vi.mocked(api.getAllIssues);
const mockToggleIssueActive = vi.mocked(api.toggleIssueActive);
const mockAdminLogout = vi.mocked(auth.adminLogout);
const mockGetSession = vi.mocked(auth.getSession);
const mockOnAuthStateChange = vi.mocked(auth.onAuthStateChange);
const mockCheckIsAdmin = vi.mocked(auth.checkIsAdmin);

function renderAdminDashboard() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth mocks
    const mockSession = createMockSession();
    mockGetSession.mockResolvedValue(mockSession);
    mockCheckIsAdmin.mockResolvedValue(true);
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockAdminLogout.mockResolvedValue({ error: null });
  });

  describe('rendering', () => {
    it('should render dashboard header', async () => {
      mockGetAllIssues.mockResolvedValue([]);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('ניהול הצבעות')).toBeInTheDocument();
      });
    });

    it('should show user email in header', async () => {
      mockGetAllIssues.mockResolvedValue([]);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });
    });

    it('should have link to audit log', async () => {
      mockGetAllIssues.mockResolvedValue([]);

      renderAdminDashboard();

      await waitFor(() => {
        const auditLink = screen.getByRole('link', { name: /יומן מעקב/i });
        expect(auditLink).toHaveAttribute('href', '/admin/audit');
      });
    });

    it('should have link to apartments management', async () => {
      mockGetAllIssues.mockResolvedValue([]);

      renderAdminDashboard();

      await waitFor(() => {
        const apartmentsLink = screen.getByRole('link', { name: /ניהול דירות/i });
        expect(apartmentsLink).toHaveAttribute('href', '/admin/apartments');
      });
    });

    it('should have link to create new issue', async () => {
      mockGetAllIssues.mockResolvedValue([]);

      renderAdminDashboard();

      await waitFor(() => {
        const newIssueLink = screen.getByRole('link', { name: /הצבעה חדשה/i });
        expect(newIssueLink).toHaveAttribute('href', '/admin/issues/new');
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state initially', async () => {
      mockGetAllIssues.mockImplementation(() => new Promise(() => {}));

      renderAdminDashboard();

      expect(screen.getByText(/טוען נתונים/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message on API failure', async () => {
      mockGetAllIssues.mockRejectedValue(new Error('Network error'));

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText(/שגיאה בטעינת הנתונים/i)).toBeInTheDocument();
      });
    });
  });

  describe('active issue card', () => {
    it('should show active issue when exists', async () => {
      const activeIssue = createMockVotingIssueWithCounts({
        id: 'issue-1',
        title: 'שיפוץ חדר מדרגות',
        description: 'תיאור ההצבעה',
        active: true,
        yesCount: 10,
        noCount: 5,
        totalCount: 15,
      });
      mockGetAllIssues.mockResolvedValue([activeIssue]);

      renderAdminDashboard();

      await waitFor(() => {
        // Issue title and description appear in both active card and table
        expect(screen.getAllByText('שיפוץ חדר מדרגות').length).toBeGreaterThan(0);
        expect(screen.getAllByText('תיאור ההצבעה').length).toBeGreaterThan(0);
      });

      // Check vote counts exist (may appear multiple times in active card and table)
      expect(screen.getAllByText('10').length).toBeGreaterThan(0);
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
      expect(screen.getAllByText('15').length).toBeGreaterThan(0);
    });

    it('should show no active issue message when none exists', async () => {
      const inactiveIssue = createMockVotingIssueWithCounts({ active: false });
      mockGetAllIssues.mockResolvedValue([inactiveIssue]);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('אין הצבעה פעילה כרגע')).toBeInTheDocument();
      });
    });

    it('should have link to active issue details', async () => {
      const activeIssue = createMockVotingIssueWithCounts({
        id: 'issue-123',
        active: true,
      });
      mockGetAllIssues.mockResolvedValue([activeIssue]);

      renderAdminDashboard();

      await waitFor(() => {
        const viewLink = screen.getByRole('link', { name: /צפייה בפרטים/i });
        expect(viewLink).toHaveAttribute('href', '/admin/issues/issue-123');
      });
    });
  });

  describe('issues table', () => {
    it('should show all issues in table', async () => {
      const issues = [
        createMockVotingIssueWithCounts({
          id: 'issue-1',
          title: 'הצבעה ראשונה',
          active: true,
          yesCount: 10,
          noCount: 5,
          totalCount: 15,
        }),
        createMockVotingIssueWithCounts({
          id: 'issue-2',
          title: 'הצבעה שנייה',
          active: false,
          yesCount: 8,
          noCount: 12,
          totalCount: 20,
        }),
      ];
      mockGetAllIssues.mockResolvedValue(issues);

      renderAdminDashboard();

      await waitFor(() => {
        // Issue titles may appear twice (in active card header and in table)
        expect(screen.getAllByText('הצבעה ראשונה').length).toBeGreaterThan(0);
        expect(screen.getByText('הצבעה שנייה')).toBeInTheDocument();
      });
    });

    it('should show empty state when no issues', async () => {
      mockGetAllIssues.mockResolvedValue([]);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('אין הצבעות במערכת')).toBeInTheDocument();
      });
    });

    it('should show active badge for active issues', async () => {
      const issues = [
        createMockVotingIssueWithCounts({ active: true }),
      ];
      mockGetAllIssues.mockResolvedValue(issues);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('פעיל')).toBeInTheDocument();
      });
    });

    it('should show closed badge for inactive issues', async () => {
      const issues = [
        createMockVotingIssueWithCounts({ active: false }),
      ];
      mockGetAllIssues.mockResolvedValue(issues);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('סגור')).toBeInTheDocument();
      });
    });
  });

  describe('toggle issue active', () => {
    it('should toggle issue from active to inactive', async () => {
      const user = userEvent.setup();
      const issues = [
        createMockVotingIssueWithCounts({
          id: 'issue-1',
          title: 'הצבעה ראשונה',
          active: true,
        }),
      ];
      mockGetAllIssues.mockResolvedValue(issues);
      mockToggleIssueActive.mockResolvedValue(true);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getAllByText('הצבעה ראשונה').length).toBeGreaterThan(0);
      });

      // Find the close button in the table - may return multiple, use first
      const closeButtons = screen.getAllByRole('button', { name: 'סגור' });
      await user.click(closeButtons[0]);

      expect(mockToggleIssueActive).toHaveBeenCalledWith('issue-1', false);
    });

    it('should toggle issue from inactive to active', async () => {
      const user = userEvent.setup();
      const issues = [
        createMockVotingIssueWithCounts({
          id: 'issue-1',
          title: 'הצבעה ראשונה',
          active: false,
        }),
      ];
      mockGetAllIssues.mockResolvedValue(issues);
      mockToggleIssueActive.mockResolvedValue(true);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('הצבעה ראשונה')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      const activateButton = within(table).getByRole('button', { name: 'הפעל' });
      await user.click(activateButton);

      expect(mockToggleIssueActive).toHaveBeenCalledWith('issue-1', true);
    });

    it('should reload issues after toggle', async () => {
      const user = userEvent.setup();
      const issues = [
        createMockVotingIssueWithCounts({
          id: 'issue-1',
          active: true,
        }),
      ];
      mockGetAllIssues.mockResolvedValue(issues);
      mockToggleIssueActive.mockResolvedValue(true);

      renderAdminDashboard();

      await waitFor(() => {
        expect(mockGetAllIssues).toHaveBeenCalledTimes(1);
      });

      // Find the close button - may return multiple, use first
      const closeButtons = screen.getAllByRole('button', { name: 'סגור' });
      await user.click(closeButtons[0]);

      await waitFor(() => {
        expect(mockGetAllIssues).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('logout', () => {
    it('should call logout on button click', async () => {
      const user = userEvent.setup();
      mockGetAllIssues.mockResolvedValue([]);

      renderAdminDashboard();

      await waitFor(() => {
        expect(screen.getByText('ניהול הצבעות')).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /התנתק/i });
      await user.click(logoutButton);

      expect(mockAdminLogout).toHaveBeenCalled();
    });
  });

  describe('RTL support', () => {
    it('should render with RTL direction', async () => {
      mockGetAllIssues.mockResolvedValue([]);

      renderAdminDashboard();

      await waitFor(() => {
        const container = screen.getByText('ניהול הצבעות').closest('div[dir="rtl"]');
        expect(container).toBeInTheDocument();
      });
    });
  });
});
