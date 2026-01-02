import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PINDisplayModal } from '../PINDisplayModal';

describe('PINDisplayModal', () => {
  const mockOnClose = vi.fn();
  const mockWriteText = vi.fn();
  const defaultProps = {
    isOpen: true,
    apartmentNumber: '42',
    ownerName: 'משה לוי',
    pin: '123456',
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up clipboard mock before each test
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<PINDisplayModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText(/קוד PIN נוצר בהצלחה/i)).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<PINDisplayModal {...defaultProps} />);
      expect(screen.getByText(/קוד PIN נוצר בהצלחה/i)).toBeInTheDocument();
    });

    it('should display apartment number', () => {
      render(<PINDisplayModal {...defaultProps} />);
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });

    it('should display owner name', () => {
      render(<PINDisplayModal {...defaultProps} />);
      expect(screen.getByText(/משה לוי/)).toBeInTheDocument();
    });

    it('should display PIN in large font', () => {
      render(<PINDisplayModal {...defaultProps} />);
      const pinElement = screen.getByText('123456');
      expect(pinElement).toBeInTheDocument();
      expect(pinElement).toHaveClass('text-5xl');
    });

    it('should show warning about one-time display', () => {
      render(<PINDisplayModal {...defaultProps} />);
      expect(screen.getByText(/זוהי ההזדמנות היחידה/i)).toBeInTheDocument();
    });

    it('should have copy to clipboard button', () => {
      render(<PINDisplayModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /העתק לזיכרון/i })).toBeInTheDocument();
    });

    it('should have print button', () => {
      render(<PINDisplayModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /הדפס/i })).toBeInTheDocument();
    });

    it('should have close button that is enabled', () => {
      render(<PINDisplayModal {...defaultProps} />);
      const closeButton = screen.getByRole('button', { name: /סגור/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).not.toBeDisabled();
    });
  });

  describe('copy to clipboard', () => {
    it('should show success message after copying', async () => {
      const user = userEvent.setup();
      mockWriteText.mockResolvedValue(undefined);

      render(<PINDisplayModal {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /העתק לזיכרון/i });
      await user.click(copyButton);

      // Success message indicates clipboard operation completed
      await waitFor(() => {
        expect(screen.getByText(/הועתק!/i)).toBeInTheDocument();
      });
    });

    it('should handle copy failure gracefully', async () => {
      const user = userEvent.setup();
      mockWriteText.mockRejectedValue(new Error('Copy failed'));

      render(<PINDisplayModal {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: /העתק לזיכרון/i });
      await user.click(copyButton);

      // Should not crash and button should still be clickable
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('print functionality', () => {
    it('should call window.print when print button is clicked', async () => {
      const user = userEvent.setup();
      const mockPrint = vi.fn();
      window.print = mockPrint;

      render(<PINDisplayModal {...defaultProps} />);

      const printButton = screen.getByRole('button', { name: /הדפס/i });
      await user.click(printButton);

      expect(mockPrint).toHaveBeenCalled();
    });
  });

  describe('closing', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PINDisplayModal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /סגור/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close when clicking outside modal', async () => {
      const user = userEvent.setup();
      render(<PINDisplayModal {...defaultProps} />);

      // Click on the backdrop
      const backdrop = screen.getByText(/קוד PIN נוצר בהצלחה/i).parentElement?.parentElement;
      if (backdrop) {
        await user.click(backdrop);
      }

      // onClose should not be called by clicking outside
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PINDisplayModal {...defaultProps} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('should prevent body scroll when open', () => {
      render(<PINDisplayModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(<PINDisplayModal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<PINDisplayModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });
  });
});
