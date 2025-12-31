import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAllIssues, getVotesByIssue, toggleIssueActive } from '../../lib/api';
import type { VotingIssueWithCounts, VoteWithApartment } from '../../types';

export function IssueDetails() {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<VotingIssueWithCounts | null>(null);
  const [votes, setVotes] = useState<VoteWithApartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const [issuesData, votesData] = await Promise.all([
        getAllIssues(),
        getVotesByIssue(id),
      ]);

      const foundIssue = issuesData.find((i) => i.id === id);
      setIssue(foundIssue || null);
      setVotes(votesData);
    } catch {
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleActive = async () => {
    if (!issue) return;

    const success = await toggleIssueActive(issue.id, !issue.active);
    if (success) {
      loadData();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="text-gray-500 mt-4">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4 font-medium">{error || 'ההצבעה לא נמצאה'}</p>
          <Link to="/admin" className="btn btn-primary">
            חזרה לרשימה
          </Link>
        </div>
      </div>
    );
  }

  const yesPercent = issue.totalCount > 0 ? Math.round((issue.yesCount / issue.totalCount) * 100) : 0;
  const noPercent = issue.totalCount > 0 ? Math.round((issue.noCount / issue.totalCount) * 100) : 0;

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <header className="header-modern sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            to="/admin"
            className="text-gray-500 hover:text-blue-600 text-sm inline-flex items-center gap-1 mb-2 transition-colors"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            חזרה לרשימה
          </Link>
          <div className="flex justify-between items-start">
            <div className="flex-1 ml-6">
              <h1 className="text-2xl font-bold text-gray-800">{issue.title}</h1>
              <p className="text-gray-600 mt-1 text-sm">{issue.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {issue.active ? (
                <span className="badge badge-active">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2"></span>
                  פעיל
                </span>
              ) : (
                <span className="badge badge-inactive">סגור</span>
              )}
              <button
                onClick={handleToggleActive}
                className={`btn text-sm ${
                  issue.active
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {issue.active ? 'סגור הצבעה' : 'הפעל הצבעה'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card stat-card-green">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-green-600">{issue.yesCount}</p>
            <p className="text-gray-600 mt-1 font-medium">בעד</p>
            <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                style={{ width: `${yesPercent}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{yesPercent}%</p>
          </div>

          <div className="stat-card stat-card-red">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-red-600">{issue.noCount}</p>
            <p className="text-gray-600 mt-1 font-medium">נגד</p>
            <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                style={{ width: `${noPercent}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{noPercent}%</p>
          </div>

          <div className="stat-card stat-card-blue">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-blue-600">{issue.totalCount}</p>
            <p className="text-gray-600 mt-1 font-medium">סה"כ הצביעו</p>
            <p className="text-sm text-gray-500 mt-3">דירות</p>
          </div>
        </div>

        {/* Votes Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-semibold text-gray-800">היסטוריית הצבעות</h2>
          </div>

          <table className="w-full table-modern">
            <thead>
              <tr>
                <th className="text-right">דירה</th>
                <th className="text-right">בעל הדירה</th>
                <th className="text-center">הצבעה</th>
                <th className="text-right">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {votes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500">עדיין אין הצבעות</p>
                    <p className="text-sm text-gray-400 mt-1">ההצבעות יופיעו כאן ברגע שיתקבלו</p>
                  </td>
                </tr>
              ) : (
                votes.map((vote) => (
                  <tr key={vote.voteId}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                          {vote.apartmentNumber}
                        </div>
                        <span className="font-medium text-gray-800">דירה {vote.apartmentNumber}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">{vote.ownerName}</td>
                    <td className="text-center">
                      {vote.vote === 'yes' ? (
                        <span className="badge badge-yes">
                          <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          בעד
                        </span>
                      ) : (
                        <span className="badge badge-no">
                          <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          נגד
                        </span>
                      )}
                    </td>
                    <td className="text-gray-500 text-sm">
                      {formatDate(vote.votedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Issue metadata */}
        <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            נוצר: {issue.createdAt ? formatDate(issue.createdAt) : 'לא ידוע'}
          </div>
          {issue.closedAt && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              נסגר: {formatDate(issue.closedAt)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
