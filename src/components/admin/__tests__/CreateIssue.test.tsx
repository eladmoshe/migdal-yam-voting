import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CreateIssue } from '../CreateIssue';
import * as api from '../../../lib/api';

// Mock the API module
vi.mock('../../../lib/api', () => ({
  createIssue: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCreateIssue = vi.mocked(api.createIssue);

function renderCreateIssue() {
  return render(
    <BrowserRouter>
      <CreateIssue />
    </BrowserRouter>
  );
}

describe('CreateIssue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the form', () => {
      renderCreateIssue();

      expect(screen.getByText('יצירת הצבעה חדשה')).toBeInTheDocument();
      expect(screen.getByLabelText(/כותרת ההצבעה/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/תיאור מפורט/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/הפעל את ההצבעה מיד/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /צור הצבעה/i })).toBeInTheDocument();
    });

    it('should have a link back to admin dashboard', () => {
      renderCreateIssue();

      const backLink = screen.getByRole('link', { name: /חזרה לרשימה/i });
      expect(backLink).toHaveAttribute('href', '/admin');
    });

    it('should have a cancel link', () => {
      renderCreateIssue();

      const cancelLink = screen.getByRole('link', { name: /ביטול/i });
      expect(cancelLink).toHaveAttribute('href', '/admin');
    });

    it('should have disabled submit button initially', () => {
      renderCreateIssue();

      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });
      expect(submitButton).toBeDisabled();
    });

    it('should have unchecked "set active" checkbox by default', () => {
      renderCreateIssue();

      const checkbox = screen.getByLabelText(/הפעל את ההצבעה מיד/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('form validation', () => {
    it('should enable submit button when title and description are entered', async () => {
      const user = userEvent.setup();
      renderCreateIssue();

      const titleInput = screen.getByLabelText(/כותרת ההצבעה/i);
      const descInput = screen.getByLabelText(/תיאור מפורט/i);
      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });

      await user.type(titleInput, 'הצבעה לדוגמה');
      await user.type(descInput, 'תיאור ההצבעה');

      expect(submitButton).not.toBeDisabled();
    });

    it('should keep submit button disabled when only title is entered', async () => {
      const user = userEvent.setup();
      renderCreateIssue();

      const titleInput = screen.getByLabelText(/כותרת ההצבעה/i);
      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });

      await user.type(titleInput, 'הצבעה לדוגמה');

      expect(submitButton).toBeDisabled();
    });

    it('should keep submit button disabled when only description is entered', async () => {
      const user = userEvent.setup();
      renderCreateIssue();

      const descInput = screen.getByLabelText(/תיאור מפורט/i);
      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });

      await user.type(descInput, 'תיאור ההצבעה');

      expect(submitButton).toBeDisabled();
    });
  });

  describe('issue creation', () => {
    it('should create issue and navigate on success', async () => {
      const user = userEvent.setup();
      mockCreateIssue.mockResolvedValue('new-issue-123');

      renderCreateIssue();

      const titleInput = screen.getByLabelText(/כותרת ההצבעה/i);
      const descInput = screen.getByLabelText(/תיאור מפורט/i);
      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });

      await user.type(titleInput, 'הצבעה חדשה');
      await user.type(descInput, 'תיאור ההצבעה');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateIssue).toHaveBeenCalledWith('הצבעה חדשה', 'תיאור ההצבעה', false);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/issues/new-issue-123');
      });
    });

    it('should pass setActive=true when checkbox is checked', async () => {
      const user = userEvent.setup();
      mockCreateIssue.mockResolvedValue('new-issue-123');

      renderCreateIssue();

      const titleInput = screen.getByLabelText(/כותרת ההצבעה/i);
      const descInput = screen.getByLabelText(/תיאור מפורט/i);
      const setActiveCheckbox = screen.getByLabelText(/הפעל את ההצבעה מיד/i);
      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });

      await user.type(titleInput, 'הצבעה חדשה');
      await user.type(descInput, 'תיאור ההצבעה');
      await user.click(setActiveCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateIssue).toHaveBeenCalledWith('הצבעה חדשה', 'תיאור ההצבעה', true);
      });
    });

    it('should show error when API returns null', async () => {
      const user = userEvent.setup();
      mockCreateIssue.mockResolvedValue(null);

      renderCreateIssue();

      const titleInput = screen.getByLabelText(/כותרת ההצבעה/i);
      const descInput = screen.getByLabelText(/תיאור מפורט/i);
      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });

      await user.type(titleInput, 'הצבעה חדשה');
      await user.type(descInput, 'תיאור ההצבעה');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/שגיאה ביצירת ההצבעה/i)).toBeInTheDocument();
      });
    });

    it('should show error on network failure', async () => {
      const user = userEvent.setup();
      mockCreateIssue.mockRejectedValue(new Error('Network error'));

      renderCreateIssue();

      const titleInput = screen.getByLabelText(/כותרת ההצבעה/i);
      const descInput = screen.getByLabelText(/תיאור מפורט/i);
      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });

      await user.type(titleInput, 'הצבעה חדשה');
      await user.type(descInput, 'תיאור ההצבעה');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/שגיאה ביצירת ההצבעה/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while creating', async () => {
      const user = userEvent.setup();
      mockCreateIssue.mockImplementation(() => new Promise(() => {}));

      renderCreateIssue();

      const titleInput = screen.getByLabelText(/כותרת ההצבעה/i);
      const descInput = screen.getByLabelText(/תיאור מפורט/i);
      const submitButton = screen.getByRole('button', { name: /צור הצבעה/i });

      await user.type(titleInput, 'הצבעה חדשה');
      await user.type(descInput, 'תיאור ההצבעה');
      await user.click(submitButton);

      expect(screen.getByText(/יוצר/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('RTL support', () => {
    it('should render with RTL direction', () => {
      renderCreateIssue();

      const container = screen.getByText('יצירת הצבעה חדשה').closest('div[dir="rtl"]');
      expect(container).toBeInTheDocument();
    });
  });
});
