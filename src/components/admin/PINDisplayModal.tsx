import { useEffect, useState } from 'react';

export interface PINDisplayModalProps {
  isOpen: boolean;
  apartmentNumber: string;
  ownerName: string;
  pin: string;
  onClose: () => void;
  isReset?: boolean;
}

export function PINDisplayModal({
  isOpen,
  apartmentNumber,
  ownerName,
  pin,
  onClose,
  isReset = false,
}: PINDisplayModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy PIN:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    if (acknowledged) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 id="modal-title" className="text-2xl font-bold text-gray-800">
            {isReset ? 'קוד PIN אופס בהצלחה!' : 'קוד PIN נוצר בהצלחה!'}
          </h2>
        </div>

        {/* Apartment Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">מספר דירה:</span>
              <span className="font-semibold mr-2">{apartmentNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">בעל הדירה:</span>
              <span className="font-semibold mr-2">{ownerName}</span>
            </div>
          </div>
        </div>

        {/* PIN Display */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">קוד PIN:</p>
            <p className="text-5xl font-mono font-bold text-blue-900 tracking-widest select-all">
              {pin}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">זוהי ההזדמנות היחידה לראות את הקוד!</p>
              <p>
                הקוד לא יוצג שוב. יש להעתיק או להדפיס אותו לפני סגירת החלון.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleCopy}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {copied ? 'הועתק!' : 'העתק לזיכרון'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            הדפס
          </button>
        </div>

        {/* Acknowledgment Checkbox */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-gray-700">
              העתקתי את הקוד ואני מבין/ה שלא אוכל לראות אותו שוב
            </span>
          </label>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={!acknowledged}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            acknowledged
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          סגור
        </button>
      </div>
    </div>
  );
}
