import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminLogout } from '../../lib/auth';
import { getAllIssues, toggleIssueActive } from '../../lib/api';
import type { VotingIssueWithCounts } from '../../types';

export function AdminDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<VotingIssueWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIssues = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllIssues();
      setIssues(data);
    } catch {
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleToggleActive = async (issueId: string, currentActive: boolean) => {
    const success = await toggleIssueActive(issueId, !currentActive);
    if (success) {
      loadIssues(); // Reload to get updated data
    }
  };

  const handleLogout = async () => {
    await adminLogout();
  };

  const activeIssue = issues.find((i) => i.active);

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ניהול הצבעות</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin/audit"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              יומן מעקב
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              התנתק
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Active Issue Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">הצבעה פעילה</h2>
          {activeIssue ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-green-700">{activeIssue.title}</h3>
                <p className="text-gray-600 mt-1">{activeIssue.description}</p>
                <div className="flex gap-6 mt-3">
                  <span className="text-green-600 font-semibold">
                    בעד: {activeIssue.yesCount}
                  </span>
                  <span className="text-red-600 font-semibold">
                    נגד: {activeIssue.noCount}
                  </span>
                  <span className="text-gray-600">
                    סה"כ: {activeIssue.totalCount}
                  </span>
                </div>
              </div>
              <Link
                to={`/admin/issues/${activeIssue.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                צפייה בפרטים
              </Link>
            </div>
          ) : (
            <p className="text-gray-500">אין הצבעה פעילה כרגע</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">כל ההצבעות</h2>
          <Link
            to="/admin/issues/new"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            הצבעה חדשה
          </Link>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Issues List */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                    נושא
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                    בעד
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                    נגד
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                    סה"כ
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      אין הצבעות במערכת
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{issue.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {issue.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {issue.active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            פעיל
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            סגור
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-green-600 font-semibold">
                        {issue.yesCount}
                      </td>
                      <td className="px-6 py-4 text-center text-red-600 font-semibold">
                        {issue.noCount}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {issue.totalCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            to={`/admin/issues/${issue.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            פרטים
                          </Link>
                          <button
                            onClick={() => handleToggleActive(issue.id, issue.active)}
                            className={`text-sm font-medium ${
                              issue.active
                                ? 'text-red-600 hover:text-red-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {issue.active ? 'סגור' : 'הפעל'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
