import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from './LoginScreen';
import { VotingProvider } from '../context/VotingContext';
import * as api from '../lib/api';

// Mock the API module
vi.mock('../lib/api', () => ({
  validateCredentials: vi.fn(),
  getActiveIssue: vi.fn(),
}));

const mockValidateCredentials = vi.mocked(api.validateCredentials);
const mockGetActiveIssue = vi.mocked(api.getActiveIssue);

function renderLoginScreen() {
  return render(
    <VotingProvider>
      <LoginScreen />
    </VotingProvider>
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getActiveIssue (called on VotingProvider mount)
    mockGetActiveIssue.mockResolvedValue({
      id: 'issue-1',
      title: 'Test Issue',
      description: 'Test description',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
    });
  });

  it('should render login form', () => {
    renderLoginScreen();

    expect(screen.getByText('מגדל ים')).toBeInTheDocument();
    expect(screen.getByText('קלפי דיגיטלית')).toBeInTheDocument();
    expect(screen.getByLabelText(/מספר דירה/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PIN digit 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /כניסה להצבעה/i })).toBeInTheDocument();
  });

  it('should have disabled submit button initially', () => {
    renderLoginScreen();

    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when apartment and 6-digit PIN are entered', async () => {
    const user = userEvent.setup();
    renderLoginScreen();

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/PIN digit 1/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '123456');

    expect(submitButton).not.toBeDisabled();
  });

  it('should keep submit button disabled with less than 6 digits PIN', async () => {
    const user = userEvent.setup();
    renderLoginScreen();

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/PIN digit 1/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '12345'); // Only 5 digits

    expect(submitButton).toBeDisabled();
  });

  it('should only allow numeric input in PIN field', async () => {
    const user = userEvent.setup();
    renderLoginScreen();

    const pinInput = screen.getByLabelText(/PIN digit 1/i) as HTMLInputElement;

    await user.type(pinInput, 'abc123def456');

    // PinInput filters non-numeric characters, so we should get digits only
    // The first input should have '1' after typing
    await waitFor(() => {
      expect(pinInput.value).toBe('1');
    });
  });

  it('should limit PIN to 6 characters', async () => {
    const user = userEvent.setup();
    renderLoginScreen();

    const pinInput = screen.getByLabelText(/PIN digit 1/i) as HTMLInputElement;

    await user.type(pinInput, '1234567890');

    // After typing, the first input should have '1', and the component limits to 6 digits total
    await waitFor(() => {
      expect(pinInput.value).toBe('1');
    });
    // Check that the 6th input exists and has a value
    const pinInput6 = screen.getByLabelText(/PIN digit 6/i) as HTMLInputElement;
    expect(pinInput6.value).toBe('6');
  });

  it('should call validateCredentials on successful login', async () => {
    const user = userEvent.setup();
    mockValidateCredentials.mockResolvedValue({
      id: 'apt-1',
      number: '1',
      ownerName: 'משפחת כהן',
    });

    renderLoginScreen();

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/PIN digit 1/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '123456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockValidateCredentials).toHaveBeenCalledWith('1', '123456');
    });
  });

  it('should show error message on invalid credentials', async () => {
    const user = userEvent.setup();
    mockValidateCredentials.mockResolvedValue(null);

    renderLoginScreen();

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/PIN digit 1/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '999999'); // Wrong PIN
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/מספר דירה או קוד PIN שגויים/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while authenticating', async () => {
    const user = userEvent.setup();
    // Make the validation hang
    mockValidateCredentials.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderLoginScreen();

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/PIN digit 1/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '123456');
    await user.click(submitButton);

    expect(screen.getByText(/מתחבר/i)).toBeInTheDocument();
  });

  it('should display help text about PIN distribution', () => {
    renderLoginScreen();

    expect(screen.getByText(/הקוד נשלח לבעלי הדירות בלבד/i)).toBeInTheDocument();
  });

  it('should show error on network failure', async () => {
    const user = userEvent.setup();
    mockValidateCredentials.mockRejectedValue(new Error('Network error'));

    renderLoginScreen();

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/PIN digit 1/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '123456');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/שגיאה בהתחברות/i)).toBeInTheDocument();
    });
  });

  it('should show hint when PIN is entered without apartment number', async () => {
    const user = userEvent.setup();
    renderLoginScreen();

    const pinInput = screen.getByLabelText('PIN digit 1');

    // Type PIN without entering apartment number
    await user.type(pinInput, '123456');

    // Should show the hint about entering apartment number first
    expect(screen.getByText(/יש להזין קודם את מספר הדירה/i)).toBeInTheDocument();
  });

  it('should hide hint when apartment number is entered after PIN', async () => {
    const user = userEvent.setup();
    renderLoginScreen();

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText('PIN digit 1');

    // Type PIN without entering apartment number
    await user.type(pinInput, '123456');

    // Hint should be visible
    expect(screen.getByText(/יש להזין קודם את מספר הדירה/i)).toBeInTheDocument();

    // Now enter apartment number
    await user.type(apartmentInput, '5');

    // Hint should disappear
    expect(screen.queryByText(/יש להזין קודם את מספר הדירה/i)).not.toBeInTheDocument();
  });

  it('should focus apartment input on page load', () => {
    renderLoginScreen();

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    expect(document.activeElement).toBe(apartmentInput);
  });
});
