import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetApartmentPin } from '../../lib/api';
import { PINDisplayModal } from './PINDisplayModal';
import type { CreateApartmentResponse } from '../../types';

export function ResetPIN() {
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetResult, setResetResult] = useState<CreateApartmentResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await resetApartmentPin(apartmentNumber);

      if (result.success) {
        setResetResult(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError('אירעה שגיאה באיפוס הקוד. אנא נסו שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    // Clear form after modal closes
    setResetResult(null);
    setApartmentNumber('');
  };

  const isFormValid = apartmentNumber.trim() !== '';

  return (
    <>
      <div className="min-h-screen bg-gray-100" dir="rtl">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link to="/admin" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
              ← חזרה לרשימה
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">איפוס קוד PIN לדירה</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-6">
              {/* Apartment Number */}
              <div>
                <label
                  htmlFor="apartmentNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  מספר דירה
                </label>
                <input
                  type="text"
                  id="apartmentNumber"
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                  className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="לדוגמה: 42 או 10A"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Warning Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
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
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">שימו לב!</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>הקוד הישן יפסיק לעבוד מיד</li>
                      <li>הקוד החדש יוצג פעם אחת בלבד - יש להעתיק אותו</li>
                      <li>הפעולה תתועד ביומן המעקב</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                  !isFormValid || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isLoading ? 'מאפס קוד...' : 'אפס קוד PIN'}
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* PIN Display Modal */}
      {resetResult && (
        <PINDisplayModal
          isOpen={true}
          apartmentNumber={resetResult.apartmentNumber}
          ownerName={resetResult.ownerName}
          pin={resetResult.pin}
          onClose={handleModalClose}
          isReset={true}
        />
      )}
    </>
  );
}
