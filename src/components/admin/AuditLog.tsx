import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuditLogs, getAuditLogStats } from '../../lib/api';
import type { AuditLog, AuditLogStats } from '../../types';

// Hebrew translations for action types
const ACTION_LABELS: Record<string, string> = {
  voter_login_success: 'התחברות דייר הצליחה',
  voter_login_failed: 'התחברות דייר נכשלה',
  vote_cast: 'הצבעה בוצעה',
  vote_duplicate_attempt: 'ניסיון הצבעה כפולה',
  admin_login_success: 'התחברות מנהל הצליחה',
  admin_login_failed: 'התחברות מנהל נכשלה',
  admin_logout: 'התנתקות מנהל',
  issue_created: 'הצבעה נוצרה',
  issue_activated: 'הצבעה הופעלה',
  issue_deactivated: 'הצבעה נסגרה',
  issue_details_viewed: 'צפייה בפרטי הצבעה',
  votes_viewed: 'צפייה ברשימת הצבעות',
};

// Hebrew translations for actor types
const ACTOR_TYPE_LABELS: Record<string, string> = {
  voter: 'דייר',
  admin: 'מנהל',
  system: 'מערכת',
};

// Hebrew translations for resource types
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  auth: 'התחברות',
  vote: 'הצבעה',
  issue: 'נושא',
  apartment: 'דירה',
  system: 'מערכת',
};

// Colors for different action types
const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  voter_login_success: { bg: 'bg-green-100', text: 'text-green-800' },
  voter_login_failed: { bg: 'bg-red-100', text: 'text-red-800' },
  vote_cast: { bg: 'bg-blue-100', text: 'text-blue-800' },
  vote_duplicate_attempt: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  admin_login_success: { bg: 'bg-green-100', text: 'text-green-800' },
  admin_login_failed: { bg: 'bg-red-100', text: 'text-red-800' },
  admin_logout: { bg: 'bg-gray-100', text: 'text-gray-800' },
  issue_created: { bg: 'bg-purple-100', text: 'text-purple-800' },
  issue_activated: { bg: 'bg-green-100', text: 'text-green-800' },
  issue_deactivated: { bg: 'bg-orange-100', text: 'text-orange-800' },
  issue_details_viewed: { bg: 'bg-gray-100', text: 'text-gray-600' },
  votes_viewed: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'הרגע';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return formatDate(dateString);
}

interface LogDetailsModalProps {
  log: AuditLog;
  onClose: () => void;
}

function LogDetailsModal({ log, onClose }: LogDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" dir="rtl">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">פרטי רישום</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Action Badge */}
          <div>
            <span className="text-sm text-gray-500">פעולה</span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  ACTION_COLORS[log.action]?.bg ?? 'bg-gray-100'
                } ${ACTION_COLORS[log.action]?.text ?? 'text-gray-800'}`}
              >
                {ACTION_LABELS[log.action] ?? log.action}
              </span>
              {!log.success && (
                <span className="mr-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  נכשל
                </span>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <span className="text-sm text-gray-500">זמן</span>
            <p className="mt-1 text-gray-800">{formatDate(log.createdAt)}</p>
          </div>

          {/* Actor */}
          <div>
            <span className="text-sm text-gray-500">מבצע הפעולה</span>
            <div className="mt-1 text-gray-800">
              <span className="font-medium">
                {ACTOR_TYPE_LABELS[log.actorType] ?? log.actorType}
              </span>
              {log.actorName && (
                <span className="mr-2">({log.actorName})</span>
              )}
              {log.actorEmail && (
                <span className="mr-2 text-gray-500">{log.actorEmail}</span>
              )}
              {log.actorId && (
                <span className="block text-sm text-gray-400 mt-1">
                  מזהה: {log.actorId}
                </span>
              )}
            </div>
          </div>

          {/* Resource */}
          <div>
            <span className="text-sm text-gray-500">משאב</span>
            <p className="mt-1 text-gray-800">
              {RESOURCE_TYPE_LABELS[log.resourceType] ?? log.resourceType}
              {log.resourceId && (
                <span className="text-sm text-gray-400 mr-2">({log.resourceId})</span>
              )}
            </p>
          </div>

          {/* Error Message */}
          {log.errorMessage && (
            <div>
              <span className="text-sm text-gray-500">שגיאה</span>
              <p className="mt-1 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {log.errorMessage}
              </p>
            </div>
          )}

          {/* Details */}
          {Object.keys(log.details).length > 0 && (
            <div>
              <span className="text-sm text-gray-500">פרטים נוספים</span>
              <div className="mt-2 bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap" dir="ltr">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Log ID */}
          <div className="pt-4 border-t">
            <span className="text-xs text-gray-400">מזהה רישום: {log.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [actorTypeFilter, setActorTypeFilter] = useState<string>('');

  // Pagination
  const [offset, setOffset] = useState(0);
  const LIMIT = 25;

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [logsData, statsData] = await Promise.all([
        getAuditLogs({
          limit: LIMIT,
          offset,
          actionFilter: actionFilter || null,
          actorTypeFilter: actorTypeFilter || null,
        }),
        getAuditLogStats(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch {
      setError('שגיאה בטעינת רישומי המעקב');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [offset, actionFilter, actorTypeFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
  }, [actionFilter, actorTypeFilter]);

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - LIMIT));
    }
  };

  const handleNextPage = () => {
    if (logs.length === LIMIT) {
      setOffset(offset + LIMIT);
    }
  };

  // Get unique actions from stats for filter dropdown
  const uniqueActions = stats.map((s) => s.action);

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">יומן מעקב</h1>
            <p className="text-sm text-gray-500">רישום פעולות במערכת</p>
          </div>
          <Link
            to="/admin"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            חזרה לדשבורד
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {stats.slice(0, 6).map((stat) => (
              <div key={stat.action} className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-gray-800">{stat.count}</div>
                <div className="text-sm text-gray-500 truncate" title={ACTION_LABELS[stat.action] ?? stat.action}>
                  {ACTION_LABELS[stat.action] ?? stat.action}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(stat.lastOccurrence)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג פעולה</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">הכל</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {ACTION_LABELS[action] ?? action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג מבצע</label>
              <select
                value={actorTypeFilter}
                onChange={(e) => setActorTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">הכל</option>
                <option value="voter">דייר</option>
                <option value="admin">מנהל</option>
                <option value="system">מערכת</option>
              </select>
            </div>
            <div className="mr-auto">
              <button
                onClick={loadData}
                className="mt-6 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                רענן
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-2">טוען...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Logs Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">זמן</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">פעולה</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">מבצע</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">משאב</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">סטטוס</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        אין רישומים להצגה
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          <div>{formatRelativeTime(log.createdAt)}</div>
                          <div className="text-xs text-gray-400">{formatDate(log.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ACTION_COLORS[log.action]?.bg ?? 'bg-gray-100'
                            } ${ACTION_COLORS[log.action]?.text ?? 'text-gray-800'}`}
                          >
                            {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-800">
                            {ACTOR_TYPE_LABELS[log.actorType] ?? log.actorType}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.actorName || log.actorEmail || log.actorId || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {RESOURCE_TYPE_LABELS[log.resourceType] ?? log.resourceType}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {log.success ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            פרטים
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.length > 0 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
                <div className="text-sm text-gray-500">
                  מציג {offset + 1} - {offset + logs.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={offset === 0}
                    className="px-3 py-1 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    הקודם
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={logs.length < LIMIT}
                    className="px-3 py-1 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    הבא
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Log Details Modal */}
      {selectedLog && (
        <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
