import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen', () => {
  it('should render login form', () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    expect(screen.getByText('מגדל ים')).toBeInTheDocument();
    expect(screen.getByText('קלפי דיגיטלית')).toBeInTheDocument();
    expect(screen.getByLabelText(/מספר דירה/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/קוד PIN/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /כניסה להצבעה/i })).toBeInTheDocument();
  });

  it('should have disabled submit button initially', () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when apartment and 5-digit PIN are entered', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/קוד PIN/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '12345');

    expect(submitButton).not.toBeDisabled();
  });

  it('should keep submit button disabled with less than 5 digits PIN', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/קוד PIN/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '1234'); // Only 4 digits

    expect(submitButton).toBeDisabled();
  });

  it('should only allow numeric input in PIN field', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    const pinInput = screen.getByLabelText(/קוד PIN/i) as HTMLInputElement;

    await user.type(pinInput, 'abc123def45');

    expect(pinInput.value).toBe('12345');
  });

  it('should limit PIN to 5 characters', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    const pinInput = screen.getByLabelText(/קוד PIN/i) as HTMLInputElement;

    await user.type(pinInput, '1234567890');

    expect(pinInput.value).toBe('12345');
  });

  it('should call onLogin with apartment data on successful login', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/קוד PIN/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '12345');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith({
        number: '1',
        pin: '12345',
        ownerName: 'משפחת כהן',
      });
    });
  });

  it('should show error message on invalid credentials', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/קוד PIN/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '99999'); // Wrong PIN
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/מספר דירה או קוד PIN שגויים/i)).toBeInTheDocument();
    });
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('should show loading state while authenticating', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    const apartmentInput = screen.getByLabelText(/מספר דירה/i);
    const pinInput = screen.getByLabelText(/קוד PIN/i);
    const submitButton = screen.getByRole('button', { name: /כניסה להצבעה/i });

    await user.type(apartmentInput, '1');
    await user.type(pinInput, '12345');
    await user.click(submitButton);

    expect(screen.getByText(/מתחבר/i)).toBeInTheDocument();
  });

  it('should display help text about PIN distribution', () => {
    render(<LoginScreen onLogin={vi.fn()} />);

    expect(screen.getByText(/הקוד נשלח לבעלי הדירות בלבד/i)).toBeInTheDocument();
  });
});
