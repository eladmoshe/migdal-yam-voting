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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-blue-900 mb-3 drop-shadow-sm">מגדל ים</h1>
          <h2 className="text-2xl text-blue-700 font-medium">קלפי דיגיטלית</h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
          <div className="space-y-8">
            {/* Apartment Number */}
            <div>
              <label
                htmlFor="apartment"
                className="block text-xl font-semibold text-gray-800 mb-4 text-right"
              >
                מספר דירה
              </label>
              <input
                type="text"
                id="apartment"
                inputMode="numeric"
                pattern="[0-9]*"
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
                className="w-full text-3xl p-5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 text-center transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="לדוגמה: 5"
                required
                autoComplete="off"
              />
            </div>

            {/* PIN */}
            <div>
              <label
                className="block text-xl font-semibold text-gray-800 mb-4 text-right"
              >
                קוד PIN (5 ספרות)
              </label>
              <PinInput
                value={pin}
                onChange={setPin}
                error={!!error}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl text-lg text-center font-medium animate-shake">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !apartmentNumber || pin.length !== 5}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white text-2xl font-bold py-6 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg hover:shadow-xl disabled:shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  מתחבר...
                </span>
              ) : (
                'כניסה להצבעה'
              )}
            </button>
          </div>
        </form>

        {/* Help text */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-gray-700 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-base">הקוד נשלח לבעלי הדירות בלבד</span>
          </div>
        </div>
      </div>
    </div>
  );
}
