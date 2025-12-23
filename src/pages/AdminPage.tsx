import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { IssueDetails } from '../components/admin/IssueDetails';
import { CreateIssue } from '../components/admin/CreateIssue';

export function AdminPage() {
  const { isLoading, isCheckingAdmin, isAdmin, user } = useAuth();

  // Loading state
  if (isLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login
  if (!user) {
    return <AdminLogin />;
  }

  // Not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">אין הרשאה</h1>
          <p className="text-gray-600 mb-4">למשתמש זה אין הרשאות מנהל</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
    );
  }

  // Admin routes
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="issues/new" element={<CreateIssue />} />
      <Route path="issues/:id" element={<IssueDetails />} />
    </Routes>
  );
}
