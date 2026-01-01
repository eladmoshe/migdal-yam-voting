import { useState } from 'react';
import { useVoting } from '../context/VotingContext';
import { validateCredentials } from '../lib/api';
import { PinInput } from './PinInput';

export function LoginScreen() {
  const { login } = useVoting();
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apartment = await validateCredentials(apartmentNumber, pin);

      if (apartment) {
        login(apartment);
      } else {
        setError('מספר דירה או קוד PIN שגויים');
      }
    } catch {
      setError('שגיאה בהתחברות. אנא נסו שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2 drop-shadow-sm">מגדל ים</h1>
          <h2 className="text-xl text-blue-600 font-medium">קלפי דיגיטלית</h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="card card-elevated p-8">
          <div className="space-y-8">
            {/* Apartment Number */}
            <div>
              <label
                htmlFor="apartment"
                className="block text-xl font-semibold text-gray-800 mb-4 text-right"
              >
                מספר דירה
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="apartment"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                  className="w-full text-3xl p-5 pr-14 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 text-center transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="לדוגמה: 5"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label
                className="block text-xl font-semibold text-gray-800 mb-4 text-right"
              >
                קוד PIN (6 ספרות)
              </label>
              <PinInput
                value={pin}
                onChange={setPin}
                error={!!error}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-lg text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !apartmentNumber || pin.length !== 6}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white text-2xl font-bold py-5 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-lg shadow-blue-200 disabled:shadow-none flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-[0.99] disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  מתחבר...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  כניסה להצבעה
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help text */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-gray-600 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-base">הקוד נשלח לבעלי הדירות בלבד</span>
          </div>
        </div>
      </div>
    </div>
  );
}
