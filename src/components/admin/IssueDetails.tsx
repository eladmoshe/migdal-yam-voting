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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'ההצבעה לא נמצאה'}</p>
          <Link to="/admin" className="text-blue-600 hover:text-blue-700">
            חזרה לרשימה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← חזרה לרשימה
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{issue.title}</h1>
              <p className="text-gray-600 mt-1">{issue.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {issue.active ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  פעיל
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  סגור
                </span>
              )}
              <button
                onClick={handleToggleActive}
                className={`text-sm font-medium px-4 py-2 rounded-lg ${
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-4xl font-bold text-green-600">{issue.yesCount}</p>
            <p className="text-gray-600 mt-1">בעד</p>
            <p className="text-sm text-gray-400 mt-1">
              {issue.totalCount > 0
                ? `${Math.round((issue.yesCount / issue.totalCount) * 100)}%`
                : '0%'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-4xl font-bold text-red-600">{issue.noCount}</p>
            <p className="text-gray-600 mt-1">נגד</p>
            <p className="text-sm text-gray-400 mt-1">
              {issue.totalCount > 0
                ? `${Math.round((issue.noCount / issue.totalCount) * 100)}%`
                : '0%'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-4xl font-bold text-blue-600">{issue.totalCount}</p>
            <p className="text-gray-600 mt-1">סה"כ הצביעו</p>
            <p className="text-sm text-gray-400 mt-1">דירות</p>
          </div>
        </div>

        {/* Votes Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">היסטוריית הצבעות</h2>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                  דירה
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                  בעל הדירה
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                  הצבעה
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                  תאריך
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {votes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    עדיין אין הצבעות
                  </td>
                </tr>
              ) : (
                votes.map((vote) => (
                  <tr key={vote.voteId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      דירה {vote.apartmentNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{vote.ownerName}</td>
                    <td className="px-6 py-4 text-center">
                      {vote.vote === 'yes' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          בעד
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          נגד
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatDate(vote.votedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Issue metadata */}
        <div className="mt-8 text-sm text-gray-500">
          <p>נוצר: {issue.createdAt ? formatDate(issue.createdAt) : 'לא ידוע'}</p>
          {issue.closedAt && <p>נסגר: {formatDate(issue.closedAt)}</p>}
        </div>
      </main>
    </div>
  );
}
