import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminLogin } from '../AdminLogin';
import * as auth from '../../../lib/auth';

// Mock the auth module
vi.mock('../../../lib/auth', () => ({
  adminLogin: vi.fn(),
}));

const mockAdminLogin = vi.mocked(auth.adminLogin);

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the login form', () => {
      render(<AdminLogin />);

      expect(screen.getByText('ניהול מערכת')).toBeInTheDocument();
      expect(screen.getByText('מגדל ים - קלפי דיגיטלית')).toBeInTheDocument();
      expect(screen.getByLabelText(/אימייל/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/סיסמה/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /כניסה/i })).toBeInTheDocument();
    });

    it('should have a link back to voter page', () => {
      render(<AdminLogin />);

      const backLink = screen.getByRole('link', { name: /חזרה לדף ההצבעה/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('should have disabled submit button initially', () => {
      render(<AdminLogin />);

      const submitButton = screen.getByRole('button', { name: /כניסה/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('form validation', () => {
    it('should enable submit button when email and password are entered', async () => {
      const user = userEvent.setup();
      render(<AdminLogin />);

      const emailInput = screen.getByLabelText(/אימייל/i);
      const passwordInput = screen.getByLabelText(/סיסמה/i);
      const submitButton = screen.getByRole('button', { name: /כניסה/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');

      expect(submitButton).not.toBeDisabled();
    });

    it('should keep submit button disabled when only email is entered', async () => {
      const user = userEvent.setup();
      render(<AdminLogin />);

      const emailInput = screen.getByLabelText(/אימייל/i);
      const submitButton = screen.getByRole('button', { name: /כניסה/i });

      await user.type(emailInput, 'admin@example.com');

      expect(submitButton).toBeDisabled();
    });

    it('should keep submit button disabled when only password is entered', async () => {
      const user = userEvent.setup();
      render(<AdminLogin />);

      const passwordInput = screen.getByLabelText(/סיסמה/i);
      const submitButton = screen.getByRole('button', { name: /כניסה/i });

      await user.type(passwordInput, 'password123');

      expect(submitButton).toBeDisabled();
    });
  });

  describe('login functionality', () => {
    it('should call adminLogin with correct credentials', async () => {
      const user = userEvent.setup();
      mockAdminLogin.mockResolvedValue({
        user: null,
        session: null,
        error: null,
      });

      render(<AdminLogin />);

      const emailInput = screen.getByLabelText(/אימייל/i);
      const passwordInput = screen.getByLabelText(/סיסמה/i);
      const submitButton = screen.getByRole('button', { name: /כניסה/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAdminLogin).toHaveBeenCalledWith('admin@example.com', 'password123');
      });
    });

    it('should show error message on invalid credentials', async () => {
      const user = userEvent.setup();
      mockAdminLogin.mockResolvedValue({
        user: null,
        session: null,
        error: { message: 'Invalid credentials', status: 401 } as auth.AuthResult['error'],
      });

      render(<AdminLogin />);

      const emailInput = screen.getByLabelText(/אימייל/i);
      const passwordInput = screen.getByLabelText(/סיסמה/i);
      const submitButton = screen.getByRole('button', { name: /כניסה/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/אימייל או סיסמה שגויים/i)).toBeInTheDocument();
      });
    });

    it('should show error message on network failure', async () => {
      const user = userEvent.setup();
      mockAdminLogin.mockRejectedValue(new Error('Network error'));

      render(<AdminLogin />);

      const emailInput = screen.getByLabelText(/אימייל/i);
      const passwordInput = screen.getByLabelText(/סיסמה/i);
      const submitButton = screen.getByRole('button', { name: /כניסה/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/שגיאה בהתחברות/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while authenticating', async () => {
      const user = userEvent.setup();
      // Make the login hang
      mockAdminLogin.mockImplementation(
        () => new Promise(() => {})
      );

      render(<AdminLogin />);

      const emailInput = screen.getByLabelText(/אימייל/i);
      const passwordInput = screen.getByLabelText(/סיסמה/i);
      const submitButton = screen.getByRole('button', { name: /כניסה/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText(/מתחבר/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should clear error on new submission', async () => {
      const user = userEvent.setup();
      mockAdminLogin
        .mockResolvedValueOnce({
          user: null,
          session: null,
          error: { message: 'Invalid credentials' } as auth.AuthResult['error'],
        })
        .mockImplementationOnce(() => new Promise(() => {}));

      render(<AdminLogin />);

      const emailInput = screen.getByLabelText(/אימייל/i);
      const passwordInput = screen.getByLabelText(/סיסמה/i);
      const submitButton = screen.getByRole('button', { name: /כניסה/i });

      // First attempt - fail
      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/אימייל או סיסמה שגויים/i)).toBeInTheDocument();
      });

      // Second attempt - should clear error
      await user.clear(passwordInput);
      await user.type(passwordInput, 'newpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/אימייל או סיסמה שגויים/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('RTL support', () => {
    it('should render with RTL direction', () => {
      render(<AdminLogin />);

      const container = screen.getByText('ניהול מערכת').closest('div[dir="rtl"]');
      expect(container).toBeInTheDocument();
    });
  });
});
