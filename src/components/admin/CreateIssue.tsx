import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createIssue } from '../../lib/api';

export function CreateIssue() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [setActive, setSetActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const issueId = await createIssue(title, description, setActive);

      if (issueId) {
        navigate(`/admin/issues/${issueId}`);
      } else {
        setError('שגיאה ביצירת ההצבעה');
      }
    } catch {
      setError('שגיאה ביצירת ההצבעה. אנא נסו שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <header className="header-modern sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            to="/admin"
            className="text-gray-500 hover:text-blue-600 text-sm inline-flex items-center gap-1 mb-2 transition-colors"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            חזרה לרשימה
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">יצירת הצבעה חדשה</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="card p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                כותרת ההצבעה
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="לדוגמה: שיפוץ חדר המדרגות"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                תיאור מפורט
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                placeholder="תארו את נושא ההצבעה בצורה ברורה..."
                required
              />
            </div>

            {/* Set Active */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
              <input
                type="checkbox"
                id="setActive"
                checked={setActive}
                onChange={(e) => setSetActive(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="setActive" className="text-sm text-gray-700">
                הפעל את ההצבעה מיד (יסגור הצבעות פעילות אחרות)
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading || !title || !description}
                className="btn btn-primary py-3 px-6 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    יוצר...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    צור הצבעה
                  </div>
                )}
              </button>
              <Link
                to="/admin"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                ביטול
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
