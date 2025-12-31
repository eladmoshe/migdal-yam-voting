import { useEffect, useState } from 'react';

export interface PINDisplayModalProps {
  isOpen: boolean;
  apartmentNumber: string;
  ownerName: string;
  pin: string;
  phoneNumber1?: string | null;
  ownerName1?: string | null;
  phoneNumber2?: string | null;
  ownerName2?: string | null;
  onClose: () => void;
  isReset?: boolean;
}

export function PINDisplayModal({
  isOpen,
  apartmentNumber,
  ownerName,
  pin,
  phoneNumber1,
  ownerName1,
  phoneNumber2,
  ownerName2,
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

  const handleWhatsAppShare = (phoneNumber: string, recipientName: string) => {
    // Format the phone number (remove non-digits, ensure it starts with country code)
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Create an informative WhatsApp message
    const message = `שלום ${recipientName},

הודעה זו נשלחת אליך מוועד הבית מגדל ים 4.

קוד ה-PIN האישי שלך למערכת ההצבעות:

🔐 ${pin}

📍 דירה: ${apartmentNumber}
👤 על שם: ${ownerName}

⚠️ חשוב:
• שמור את הקוד במקום בטוח
• לא להעביר לאחרים
• תצטרך את הקוד כדי להשתתף בהצבעות בבניין

כדי להצביע, היכנס לאתר:
https://migdal-yam-voting.netlify.app

בכל שאלה, ניתן לפנות לוועד הבית.

בברכה,
וועד הבית מגדל ים 4`;

    // Create WhatsApp deep link
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in new window
    window.open(whatsappUrl, '_blank');
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

        {/* WhatsApp Share Buttons */}
        {(phoneNumber1 || phoneNumber2) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-green-900 mb-3">שלח את הקוד בוואטסאפ:</h3>
            <div className="space-y-2">
              {phoneNumber1 && ownerName1 && (
                <button
                  onClick={() => handleWhatsAppShare(phoneNumber1, ownerName1)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  שלח ל-{ownerName1} ({phoneNumber1})
                </button>
              )}
              {phoneNumber2 && ownerName2 && (
                <button
                  onClick={() => handleWhatsAppShare(phoneNumber2, ownerName2)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  שלח ל-{ownerName2} ({phoneNumber2})
                </button>
              )}
            </div>
          </div>
        )}

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
