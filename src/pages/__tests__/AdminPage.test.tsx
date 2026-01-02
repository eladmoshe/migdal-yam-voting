import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminPage } from '../AdminPage';
import * as AuthContext from '../../context/AuthContext';
import { createMockUser } from '../../test/mocks';

// Mock the context
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock all child components to simplify testing
vi.mock('../../components/admin/AdminLogin', () => ({
  AdminLogin: () => <div data-testid="admin-login">Admin Login</div>,
}));

vi.mock('../../components/admin/AdminDashboard', () => ({
  AdminDashboard: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
}));

vi.mock('../../components/admin/IssueDetails', () => ({
  IssueDetails: () => <div data-testid="issue-details">Issue Details</div>,
}));

vi.mock('../../components/admin/CreateIssue', () => ({
  CreateIssue: () => <div data-testid="create-issue">Create Issue</div>,
}));

vi.mock('../../components/admin/CreateApartment', () => ({
  CreateApartment: () => <div data-testid="create-apartment">Create Apartment</div>,
}));

vi.mock('../../components/admin/ResetPIN', () => ({
  ResetPIN: () => <div data-testid="reset-pin">Reset PIN</div>,
}));

vi.mock('../../components/admin/AuditLog', () => ({
  AuditLogPage: () => <div data-testid="audit-log">Audit Log</div>,
}));

vi.mock('../../components/admin/ApartmentManagement', () => ({
  ApartmentManagement: () => <div data-testid="apartment-management">Apartment Management</div>,
}));

const mockUseAuth = vi.mocked(AuthContext.useAuth);

function renderAdminPage(route: string = '/admin') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        isCheckingAdmin: false,
        isAdmin: false,
      });

      renderAdminPage();

      expect(screen.getByText(/טוען/i)).toBeInTheDocument();
    });

    it('should show loading spinner when checking admin status', () => {
      mockUseAuth.mockReturnValue({
        user: createMockUser(),
        session: null,
        isLoading: false,
        isCheckingAdmin: true,
        isAdmin: false,
      });

      renderAdminPage();

      expect(screen.getByText(/טוען/i)).toBeInTheDocument();
    });
  });

  describe('not authenticated', () => {
    it('should show admin login when not logged in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        isCheckingAdmin: false,
        isAdmin: false,
      });

      renderAdminPage();

      expect(screen.getByTestId('admin-login')).toBeInTheDocument();
    });
  });

  describe('not admin', () => {
    it('should show no permission message when user is not admin', () => {
      mockUseAuth.mockReturnValue({
        user: createMockUser({ email: 'user@example.com' }),
        session: null,
        isLoading: false,
        isCheckingAdmin: false,
        isAdmin: false,
      });

      renderAdminPage();

      expect(screen.getByText(/אין הרשאה/i)).toBeInTheDocument();
      expect(screen.getByText(/למשתמש זה אין הרשאות מנהל/i)).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  describe('authenticated admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: createMockUser(),
        session: null,
        isLoading: false,
        isCheckingAdmin: false,
        isAdmin: true,
      });
    });

    it('should show admin dashboard at /admin', () => {
      renderAdminPage('/admin');

      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    it('should show create issue at /admin/issues/new', () => {
      renderAdminPage('/admin/issues/new');

      expect(screen.getByTestId('create-issue')).toBeInTheDocument();
    });

    it('should show issue details at /admin/issues/:id', () => {
      renderAdminPage('/admin/issues/some-id');

      expect(screen.getByTestId('issue-details')).toBeInTheDocument();
    });

    it('should show apartment management at /admin/apartments', () => {
      renderAdminPage('/admin/apartments');

      expect(screen.getByTestId('apartment-management')).toBeInTheDocument();
    });

    it('should show create apartment at /admin/apartments/new', () => {
      renderAdminPage('/admin/apartments/new');

      expect(screen.getByTestId('create-apartment')).toBeInTheDocument();
    });

    it('should show reset PIN at /admin/apartments/reset-pin', () => {
      renderAdminPage('/admin/apartments/reset-pin');

      expect(screen.getByTestId('reset-pin')).toBeInTheDocument();
    });

    it('should show audit log at /admin/audit', () => {
      renderAdminPage('/admin/audit');

      expect(screen.getByTestId('audit-log')).toBeInTheDocument();
    });
  });
});
