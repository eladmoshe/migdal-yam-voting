import { useState } from 'react';
import type { Apartment } from '../types';
import { validateCredentials } from '../data/mockData';

interface LoginScreenProps {
  onLogin: (apartment: Apartment) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500));

    const apartment = validateCredentials(apartmentNumber, pin);

    if (apartment) {
      onLogin(apartment);
    } else {
      setError('מספר דירה או קוד PIN שגויים');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">מגדל ים</h1>
          <h2 className="text-2xl text-blue-700">קלפי דיגיטלית</h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Apartment Number */}
            <div>
              <label
                htmlFor="apartment"
                className="block text-xl font-semibold text-gray-800 mb-3"
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
                className="w-full text-2xl p-4 border-3 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 text-center"
                placeholder="לדוגמה: 5"
                required
                autoComplete="off"
              />
            </div>

            {/* PIN */}
            <div>
              <label
                htmlFor="pin"
                className="block text-xl font-semibold text-gray-800 mb-3"
              >
                קוד PIN (5 ספרות)
              </label>
              <input
                type="password"
                id="pin"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-2xl p-4 border-3 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 text-center tracking-widest"
                placeholder="● ● ● ● ●"
                required
                autoComplete="off"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl text-lg text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !apartmentNumber || pin.length !== 5}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-2xl font-bold py-5 px-6 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              {isLoading ? 'מתחבר...' : 'כניסה להצבעה'}
            </button>
          </div>
        </form>

        {/* Help text */}
        <p className="text-center text-gray-600 mt-6 text-lg">
          הקוד נשלח לבעלי הדירות בלבד
        </p>
      </div>
    </div>
  );
}
