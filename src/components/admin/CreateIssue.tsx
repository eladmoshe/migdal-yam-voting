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
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← חזרה לרשימה
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">יצירת הצבעה חדשה</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                כותרת ההצבעה
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="לדוגמה: שיפוץ חדר המדרגות"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                תיאור מפורט
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="תארו את נושא ההצבעה בצורה ברורה..."
                required
              />
            </div>

            {/* Set Active */}
            <div className="flex items-center gap-3">
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading || !title || !description}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isLoading ? 'יוצר...' : 'צור הצבעה'}
              </button>
              <Link
                to="/admin"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
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
