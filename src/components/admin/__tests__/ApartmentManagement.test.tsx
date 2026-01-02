import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ApartmentManagement } from '../ApartmentManagement';
import * as api from '../../../lib/api';
import { createMockApartment, createMockCreateApartmentResponse } from '../../../test/mocks';

// Mock the API module
vi.mock('../../../lib/api', () => ({
  getAllApartments: vi.fn(),
  deleteApartment: vi.fn(),
  updateApartmentOwner: vi.fn(),
  resetApartmentPin: vi.fn(),
}));

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

const mockGetAllApartments = vi.mocked(api.getAllApartments);
const mockDeleteApartment = vi.mocked(api.deleteApartment);
const mockUpdateApartmentOwner = vi.mocked(api.updateApartmentOwner);
const mockResetApartmentPin = vi.mocked(api.resetApartmentPin);

function renderApartmentManagement() {
  return render(
    <BrowserRouter>
      <ApartmentManagement />
    </BrowserRouter>
  );
}

describe('ApartmentManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert.mockClear();
  });

  describe('rendering', () => {
    it('should render the page title', async () => {
      mockGetAllApartments.mockResolvedValue([]);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('ניהול דירות')).toBeInTheDocument();
      });
    });

    it('should have link back to admin dashboard', async () => {
      mockGetAllApartments.mockResolvedValue([]);

      renderApartmentManagement();

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /חזרה לרשימה/i });
        expect(backLink).toHaveAttribute('href', '/admin');
      });
    });

    it('should have link to create new apartment', async () => {
      mockGetAllApartments.mockResolvedValue([]);

      renderApartmentManagement();

      await waitFor(() => {
        const newLink = screen.getByRole('link', { name: /דירה חדשה/i });
        expect(newLink).toHaveAttribute('href', '/admin/apartments/new');
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state initially', () => {
      mockGetAllApartments.mockImplementation(() => new Promise(() => {}));

      renderApartmentManagement();

      expect(screen.getByText(/טוען נתונים/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message on API failure', async () => {
      mockGetAllApartments.mockRejectedValue(new Error('Network error'));

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText(/שגיאה בטעינת הנתונים/i)).toBeInTheDocument();
      });
    });

    it('should allow dismissing error', async () => {
      const user = userEvent.setup();
      mockGetAllApartments.mockRejectedValue(new Error('Network error'));

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText(/שגיאה בטעינת הנתונים/i)).toBeInTheDocument();
      });

      // Find all buttons and click the dismiss button (the one in error container)
      const errorContainer = screen.getByText(/שגיאה בטעינת הנתונים/i).closest('div')?.parentElement;
      const dismissButton = within(errorContainer as HTMLElement).getByRole('button');
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/שגיאה בטעינת הנתונים/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('apartments list', () => {
    it('should show empty state when no apartments', async () => {
      mockGetAllApartments.mockResolvedValue([]);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('אין דירות במערכת')).toBeInTheDocument();
      });
    });

    it('should display apartments table', async () => {
      const apartments = [
        createMockApartment({ id: 'apt-1', number: '1', ownerName: 'משפחת אלון' }),
        createMockApartment({ id: 'apt-2', number: '2', ownerName: 'משפחת בן דוד' }),
      ];
      mockGetAllApartments.mockResolvedValue(apartments);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת אלון')).toBeInTheDocument();
        expect(screen.getByText('משפחת בן דוד')).toBeInTheDocument();
      });
    });
  });

  describe('edit owner name', () => {
    it('should show edit input when clicking edit button', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '1', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /שם/i });
      await user.click(editButton);

      expect(screen.getByDisplayValue('משפחת כהן')).toBeInTheDocument();
    });

    it('should save edited name', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '1', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);
      mockUpdateApartmentOwner.mockResolvedValue({
        success: true,
        data: { id: 'apt-1', number: '1', ownerName: 'משפחת לוי' },
      });

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /שם/i });
      await user.click(editButton);

      const input = screen.getByDisplayValue('משפחת כהן');
      await user.clear(input);
      await user.type(input, 'משפחת לוי');

      const saveButton = screen.getByRole('button', { name: /שמור/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateApartmentOwner).toHaveBeenCalledWith('apt-1', 'משפחת לוי');
        expect(screen.getByText('משפחת לוי')).toBeInTheDocument();
      });
    });

    it('should cancel edit', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '1', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /שם/i });
      await user.click(editButton);

      const cancelButton = screen.getByRole('button', { name: /ביטול/i });
      await user.click(cancelButton);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('delete apartment', () => {
    it('should show delete confirmation modal', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '42', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /מחק/i });
      await user.click(deleteButton);

      expect(screen.getByText('אישור מחיקה')).toBeInTheDocument();
      // "דירה 42" appears in both table and modal, so use getAllByText
      expect(screen.getAllByText('דירה 42').length).toBeGreaterThanOrEqual(1);
    });

    it('should delete apartment on confirm', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '42', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);
      mockDeleteApartment.mockResolvedValue({ success: true, deletedVotesCount: 0 });

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /מחק/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /כן, מחק/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteApartment).toHaveBeenCalledWith('apt-1');
        expect(screen.queryByText('משפחת כהן')).not.toBeInTheDocument();
      });
    });

    it('should show alert when votes are deleted', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '42', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);
      mockDeleteApartment.mockResolvedValue({ success: true, deletedVotesCount: 5 });

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /מחק/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /כן, מחק/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('הדירה נמחקה בהצלחה. נמחקו 5 הצבעות.');
      });
    });

    it('should cancel delete', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '42', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /מחק/i });
      await user.click(deleteButton);

      expect(screen.getByText('אישור מחיקה')).toBeInTheDocument();

      // Find cancel button in the modal
      const modal = screen.getByText('אישור מחיקה').closest('div[class*="card"]');
      const cancelButton = within(modal as HTMLElement).getByRole('button', { name: /ביטול/i });
      await user.click(cancelButton);

      expect(screen.queryByText('אישור מחיקה')).not.toBeInTheDocument();
    });
  });

  describe('reset PIN', () => {
    it('should show reset confirmation modal', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '42', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const pinButton = screen.getByRole('button', { name: /PIN/i });
      await user.click(pinButton);

      expect(screen.getByText('אישור איפוס PIN')).toBeInTheDocument();
    });

    it('should reset PIN on confirm', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '42', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);
      mockResetApartmentPin.mockResolvedValue({
        success: true,
        data: createMockCreateApartmentResponse({ apartmentNumber: '42', pin: '654321' }),
      });

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const pinButton = screen.getByRole('button', { name: /PIN/i });
      await user.click(pinButton);

      const confirmButton = screen.getByRole('button', { name: /כן, אפס PIN/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockResetApartmentPin).toHaveBeenCalledWith('42');
      });

      // Should show PIN modal with new PIN
      await waitFor(() => {
        expect(screen.getByText('654321')).toBeInTheDocument();
      });
    });

    it('should cancel reset', async () => {
      const user = userEvent.setup();
      const apartments = [createMockApartment({ id: 'apt-1', number: '42', ownerName: 'משפחת כהן' })];
      mockGetAllApartments.mockResolvedValue(apartments);

      renderApartmentManagement();

      await waitFor(() => {
        expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
      });

      const pinButton = screen.getByRole('button', { name: /PIN/i });
      await user.click(pinButton);

      expect(screen.getByText('אישור איפוס PIN')).toBeInTheDocument();

      // Find cancel button in the modal
      const modal = screen.getByText('אישור איפוס PIN').closest('div[class*="card"]');
      const cancelButton = within(modal as HTMLElement).getByRole('button', { name: /ביטול/i });
      await user.click(cancelButton);

      expect(screen.queryByText('אישור איפוס PIN')).not.toBeInTheDocument();
    });
  });
});
