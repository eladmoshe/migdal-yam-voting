import { useState } from 'react';
import { adminLogin } from '../../lib/auth';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await adminLogin(email, password);

      if (error) {
        setError('אימייל או סיסמה שגויים');
      }
      // Success - AuthContext will update automatically
    } catch {
      setError('שגיאה בהתחברות. אנא נסו שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 drop-shadow-sm">ניהול מערכת</h1>
          <p className="text-lg text-gray-600 font-medium">מגדל ים - קלפי דיגיטלית</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-base font-semibold text-gray-700 mb-3"
              >
                אימייל
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-lg p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-base font-semibold text-gray-700 mb-3"
              >
                סיסמה
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-lg p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl text-base font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white text-xl font-bold py-4 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg hover:shadow-xl disabled:shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  מתחבר...
                </span>
              ) : (
                'כניסה'
              )}
            </button>
          </div>
        </form>

        {/* Back link */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-700 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
          >
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-base font-medium">חזרה לדף ההצבעה</span>
          </a>
        </div>
      </div>
    </div>
  );
}
