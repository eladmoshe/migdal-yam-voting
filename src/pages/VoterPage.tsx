import { useVoting } from '../context/VotingContext';
import { LoginScreen } from '../components/LoginScreen';
import { VotingScreen } from '../components/VotingScreen';

export function VoterPage() {
  const { apartment, isLoggedIn, currentIssue, isLoadingIssue, issueError, logout } =
    useVoting();

  // Loading state
  if (isLoadingIssue) {
    return (
      <div
        className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6"
        dir="rtl"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl text-blue-700">טוען...</p>
        </div>
      </div>
    );
  }

  // No active issue
  if (issueError || !currentIssue) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6"
        dir="rtl"
      >
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">מגדל ים</h1>
            <p className="text-xl text-gray-600">{issueError || 'אין הצבעה פעילה כרגע'}</p>
            <p className="text-lg text-gray-500 mt-4">אנא נסו שוב מאוחר יותר</p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - show login
  if (!isLoggedIn || !apartment) {
    return <LoginScreen />;
  }

  // Logged in - show voting
  return <VotingScreen apartment={apartment} issue={currentIssue} onLogout={logout} />;
}
