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
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <header className="header-modern sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ניהול הצבעות</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/admin/audit"
              className="text-gray-600 hover:text-blue-600 text-sm flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              יומן מעקב
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 text-sm transition-colors"
            >
              התנתק
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Active Issue Card */}
        <div className="card card-elevated p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">הצבעה פעילה</h2>
          </div>
          {activeIssue ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{activeIssue.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{activeIssue.description}</p>
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-green-600">{activeIssue.yesCount}</span>
                      <span className="text-sm text-gray-500 mr-1">בעד</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-red-600">{activeIssue.noCount}</span>
                      <span className="text-sm text-gray-500 mr-1">נגד</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-gray-600">{activeIssue.totalCount}</span>
                      <span className="text-sm text-gray-500 mr-1">סה"כ</span>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                to={`/admin/issues/${activeIssue.id}`}
                className="btn btn-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                צפייה בפרטים
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">אין הצבעה פעילה כרגע</p>
              <p className="text-sm text-gray-400 mt-1">צור הצבעה חדשה או הפעל הצבעה קיימת</p>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">כל ההצבעות</h2>
          <div className="flex gap-3">
            <Link
              to="/admin/apartments"
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              ניהול דירות
            </Link>
            <Link
              to="/admin/issues/new"
              className="btn btn-success"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              הצבעה חדשה
            </Link>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-500 mt-4">טוען נתונים...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Issues Table */}
        {!isLoading && !error && (
          <div className="card overflow-hidden">
            <table className="w-full table-modern">
              <thead>
                <tr>
                  <th className="text-right">נושא</th>
                  <th className="text-center">סטטוס</th>
                  <th className="text-center">בעד</th>
                  <th className="text-center">נגד</th>
                  <th className="text-center">סה"כ</th>
                  <th className="text-center">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500">אין הצבעות במערכת</p>
                      <p className="text-sm text-gray-400 mt-1">צור את ההצבעה הראשונה</p>
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.id}>
                      <td>
                        <div className="font-medium text-gray-800">{issue.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs mt-0.5">
                          {issue.description}
                        </div>
                      </td>
                      <td className="text-center">
                        {issue.active ? (
                          <span className="badge badge-active">פעיל</span>
                        ) : (
                          <span className="badge badge-inactive">סגור</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="text-green-600 font-semibold">{issue.yesCount}</span>
                      </td>
                      <td className="text-center">
                        <span className="text-red-600 font-semibold">{issue.noCount}</span>
                      </td>
                      <td className="text-center">
                        <span className="text-gray-600 font-medium">{issue.totalCount}</span>
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          <Link
                            to={`/admin/issues/${issue.id}`}
                            className="action-link text-blue-600 hover:text-blue-800 text-sm"
                          >
                            פרטים
                          </Link>
                          <button
                            onClick={() => handleToggleActive(issue.id, issue.active)}
                            className={`action-link text-sm ${
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
