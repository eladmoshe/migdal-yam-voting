import { useRef, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
}

export function PinInput({ value, onChange, length = 6, error = false }: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '').slice(-1);

    const newValue = value.split('');
    newValue[index] = digit;

    const finalValue = newValue.join('').slice(0, length);
    onChange(finalValue);

    // Auto-focus next input if digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();

      if (value[index]) {
        // Clear current digit
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);

    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleFocus = (index: number) => {
    // Select the content when focused
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          className={`
            w-14 h-16 text-3xl font-bold text-center
            border-2 rounded-xl
            transition-all duration-200
            focus:outline-none focus:ring-4
            ${
              error
                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200'
                : value[index]
                ? 'border-blue-500 bg-blue-50 focus:border-blue-600 focus:ring-blue-200'
                : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200'
            }
          `}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
