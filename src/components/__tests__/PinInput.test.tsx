import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinInput } from '../PinInput';

describe('PinInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render 6 input boxes by default', () => {
      render(<PinInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(6);
    });

    it('should render custom number of input boxes', () => {
      render(<PinInput value="" onChange={mockOnChange} length={4} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(4);
    });

    it('should display value in correct inputs', () => {
      render(<PinInput value="123" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
      expect(inputs[0].value).toBe('1');
      expect(inputs[1].value).toBe('2');
      expect(inputs[2].value).toBe('3');
      expect(inputs[3].value).toBe('');
    });

    it('should focus first input on mount', async () => {
      render(<PinInput value="" onChange={mockOnChange} />);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        expect(document.activeElement).toBe(inputs[0]);
      });
    });

    it('should apply error styles when error prop is true', () => {
      render(<PinInput value="" onChange={mockOnChange} error={true} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input.className).toContain('border-red');
      });
    });
  });

  describe('digit input', () => {
    it('should call onChange with new digit', async () => {
      const user = userEvent.setup();
      render(<PinInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '5');

      expect(mockOnChange).toHaveBeenCalledWith('5');
    });

    it('should only allow numeric input', async () => {
      const user = userEvent.setup();
      render(<PinInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], 'abc');

      // Should not have called onChange with non-numeric values
      expect(mockOnChange).not.toHaveBeenCalledWith('a');
      expect(mockOnChange).not.toHaveBeenCalledWith('b');
      expect(mockOnChange).not.toHaveBeenCalledWith('c');
    });

    it('should auto-focus next input after entering digit', async () => {
      const user = userEvent.setup();
      let currentValue = '';
      const onChange = (v: string) => { currentValue = v; };

      const { rerender } = render(<PinInput value="" onChange={onChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');

      rerender(<PinInput value={currentValue} onChange={onChange} />);

      // After typing, focus should move to next input
      await waitFor(() => {
        expect(document.activeElement).toBe(inputs[1]);
      });
    });
  });

  describe('backspace handling', () => {
    it('should clear current digit on backspace', async () => {
      const user = userEvent.setup();
      render(<PinInput value="123" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[2]); // Focus on third input (has value '3')
      await user.keyboard('{Backspace}');

      expect(mockOnChange).toHaveBeenCalledWith('12');
    });

    it('should move to previous input when current is empty', async () => {
      const user = userEvent.setup();
      render(<PinInput value="12" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[2]); // Focus on third input (empty)
      await user.keyboard('{Backspace}');

      expect(mockOnChange).toHaveBeenCalledWith('1');
    });
  });

  describe('arrow key navigation', () => {
    it('should move focus left on arrow left', async () => {
      const user = userEvent.setup();
      render(<PinInput value="123" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[2]); // Focus on third input
      await user.keyboard('{ArrowLeft}');

      expect(document.activeElement).toBe(inputs[1]);
    });

    it('should move focus right on arrow right', async () => {
      const user = userEvent.setup();
      render(<PinInput value="123" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[1]); // Focus on second input
      await user.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(inputs[2]);
    });

    it('should not move beyond first input', async () => {
      const user = userEvent.setup();
      render(<PinInput value="123" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]); // Focus on first input
      await user.keyboard('{ArrowLeft}');

      expect(document.activeElement).toBe(inputs[0]);
    });

    it('should not move beyond last input', async () => {
      const user = userEvent.setup();
      render(<PinInput value="123456" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[5]); // Focus on last input
      await user.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(inputs[5]);
    });
  });

  describe('paste handling', () => {
    it('should paste full PIN', async () => {
      const user = userEvent.setup();
      render(<PinInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.paste('123456');

      expect(mockOnChange).toHaveBeenCalledWith('123456');
    });

    it('should only paste digits from pasted text', async () => {
      const user = userEvent.setup();
      render(<PinInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.paste('12-34-56');

      expect(mockOnChange).toHaveBeenCalledWith('123456');
    });

    it('should truncate pasted text to length', async () => {
      const user = userEvent.setup();
      render(<PinInput value="" onChange={mockOnChange} length={4} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.paste('123456789');

      expect(mockOnChange).toHaveBeenCalledWith('1234');
    });
  });

  describe('accessibility', () => {
    it('should have aria-labels for each input', () => {
      render(<PinInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute('aria-label', `PIN digit ${index + 1}`);
      });
    });

    it('should have numeric input mode', () => {
      render(<PinInput value="" onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('inputMode', 'numeric');
      });
    });
  });
});
