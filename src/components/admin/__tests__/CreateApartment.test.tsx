import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CreateApartment } from '../CreateApartment';
import * as api from '../../../lib/api';

// Mock the API module
vi.mock('../../../lib/api', () => ({
  createApartment: vi.fn(),
}));

const mockCreateApartment = vi.mocked(api.createApartment);

function renderCreateApartment() {
  return render(
    <BrowserRouter>
      <CreateApartment />
    </BrowserRouter>
  );
}

describe('CreateApartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the form', () => {
      renderCreateApartment();

      expect(screen.getByText(/יצירת דירה חדשה/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/מספר דירה/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/שם בעל הדירה/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /צור דירה/i })).toBeInTheDocument();
    });

    it('should have a link back to apartment management', () => {
      renderCreateApartment();

      const backLink = screen.getByRole('link', { name: /חזרה/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/admin/apartments');
    });

    it('should have disabled submit button initially', () => {
      renderCreateApartment();

      const submitButton = screen.getByRole('button', { name: /צור דירה/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('form validation', () => {
    it('should enable submit button when both fields are filled', async () => {
      const user = userEvent.setup();
      renderCreateApartment();

      const apartmentInput = screen.getByLabelText(/מספר דירה/i);
      const ownerInput = screen.getByLabelText(/שם בעל הדירה/i);
      const submitButton = screen.getByRole('button', { name: /צור דירה/i });

      await user.type(apartmentInput, '42');
      await user.type(ownerInput, 'משה לוי');

      expect(submitButton).not.toBeDisabled();
    });

    it('should keep submit button disabled when apartment number is empty', async () => {
      const user = userEvent.setup();
      renderCreateApartment();

      const ownerInput = screen.getByLabelText(/שם בעל הדירה/i);
      const submitButton = screen.getByRole('button', { name: /צור דירה/i });

      await user.type(ownerInput, 'משה לוי');

      expect(submitButton).toBeDisabled();
    });

    it('should keep submit button disabled when owner name is empty', async () => {
      const user = userEvent.setup();
      renderCreateApartment();

      const apartmentInput = screen.getByLabelText(/מספר דירה/i);
      const submitButton = screen.getByRole('button', { name: /צור דירה/i });

      await user.type(apartmentInput, '42');

      expect(submitButton).toBeDisabled();
    });
  });

  describe('apartment creation', () => {
    it('should create apartment and show PIN modal on success', async () => {
      const user = userEvent.setup();
      mockCreateApartment.mockResolvedValue({
        success: true,
        data: {
          apartmentId: 'apt-123',
          apartmentNumber: '42',
          ownerName: 'משה לוי',
          phoneNumber1: null,
          ownerName1: null,
          phoneNumber2: null,
          ownerName2: null,
          pin: '123456',
        },
      });

      renderCreateApartment();

      const apartmentInput = screen.getByLabelText(/מספר דירה/i);
      const ownerInput = screen.getByLabelText(/שם בעל הדירה/i);
      const submitButton = screen.getByRole('button', { name: /צור דירה/i });

      await user.type(apartmentInput, '42');
      await user.type(ownerInput, 'משה לוי');
      await user.click(submitButton);

      await waitFor(() => {
        // createApartment is called with 6 parameters: number, name, and 4 optional phone/name fields
        expect(mockCreateApartment).toHaveBeenCalledWith(
          '42',
          'משה לוי',
          undefined,
          undefined,
          undefined,
          undefined
        );
      });

      // PIN modal should appear
      await waitFor(() => {
        expect(screen.getByText(/קוד PIN נוצר בהצלחה/i)).toBeInTheDocument();
        expect(screen.getByText('123456')).toBeInTheDocument();
      });
    });

    it('should show error message on creation failure', async () => {
      const user = userEvent.setup();
      mockCreateApartment.mockResolvedValue({
        success: false,
        error: 'מספר דירה זה כבר קיים במערכת',
      });

      renderCreateApartment();

      const apartmentInput = screen.getByLabelText(/מספר דירה/i);
      const ownerInput = screen.getByLabelText(/שם בעל הדירה/i);
      const submitButton = screen.getByRole('button', { name: /צור דירה/i });

      await user.type(apartmentInput, '42');
      await user.type(ownerInput, 'משה לוי');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/מספר דירה זה כבר קיים במערכת/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while creating', async () => {
      const user = userEvent.setup();
      // Make the API call hang
      mockCreateApartment.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderCreateApartment();

      const apartmentInput = screen.getByLabelText(/מספר דירה/i);
      const ownerInput = screen.getByLabelText(/שם בעל הדירה/i);
      const submitButton = screen.getByRole('button', { name: /צור דירה/i });

      await user.type(apartmentInput, '42');
      await user.type(ownerInput, 'משה לוי');
      await user.click(submitButton);

      expect(screen.getByText(/יוצר דירה/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should clear form after successful creation and modal closes', async () => {
      const user = userEvent.setup();
      mockCreateApartment.mockResolvedValue({
        success: true,
        data: {
          apartmentId: 'apt-123',
          apartmentNumber: '42',
          ownerName: 'משה לוי',
          phoneNumber1: null,
          ownerName1: null,
          phoneNumber2: null,
          ownerName2: null,
          pin: '123456',
        },
      });

      renderCreateApartment();

      const apartmentInput = screen.getByLabelText(/מספר דירה/i) as HTMLInputElement;
      const ownerInput = screen.getByLabelText(/שם בעל הדירה/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /צור דירה/i });

      await user.type(apartmentInput, '42');
      await user.type(ownerInput, 'משה לוי');
      await user.click(submitButton);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText(/קוד PIN נוצר בהצלחה/i)).toBeInTheDocument();
      });

      // Close modal (checkbox was removed from component)
      const closeButton = screen.getByRole('button', { name: /סגור/i });
      await user.click(closeButton);

      // Form should be cleared
      await waitFor(() => {
        expect(apartmentInput.value).toBe('');
        expect(ownerInput.value).toBe('');
      });
    });
  });
});
