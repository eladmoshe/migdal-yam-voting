import { useState, useEffect } from 'react';
import type { Apartment, VotingIssue } from '../types';
import { castVote, hasApartmentVoted, getVoteResults } from '../lib/api';

interface VotingScreenProps {
  apartment: Apartment;
  issue: VotingIssue;
  onLogout: () => void;
}

export function VotingScreen({ apartment, issue, onLogout }: VotingScreenProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [votedValue, setVotedValue] = useState<'yes' | 'no' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isCheckingVote, setIsCheckingVote] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({ yes: 0, no: 0, total: 0 });

  // Check if already voted on mount
  useEffect(() => {
    async function checkVoteStatus() {
      const voted = await hasApartmentVoted(apartment.id, issue.id);
      setHasVoted(voted);
      setIsCheckingVote(false);

      if (voted) {
        const voteResults = await getVoteResults(issue.id);
        setResults(voteResults);
      }
    }

    checkVoteStatus();
  }, [apartment.id, issue.id]);

  const handleVote = async (vote: 'yes' | 'no') => {
    if (hasVoted || isVoting) return;

    setIsVoting(true);

    try {
      const success = await castVote(apartment.id, issue.id, vote);

      if (success) {
        setHasVoted(true);
        setVotedValue(vote);

        // Fetch updated results
        const voteResults = await getVoteResults(issue.id);
        setResults(voteResults);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleToggleResults = async () => {
    if (!showResults) {
      // Refresh results when showing
      const voteResults = await getVoteResults(issue.id);
      setResults(voteResults);
    }
    setShowResults(!showResults);
  };

  // Loading state while checking vote status
  if (isCheckingVote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl text-blue-700 font-medium">בודק סטטוס הצבעה...</p>
        </div>
      </div>
    );
  }

  // Already voted view
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
            {/* Success checkmark */}
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-14 h-14 text-white drop-shadow-sm"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-green-800 mb-4">תודה רבה!</h1>
            <p className="text-xl text-gray-700 mb-2 font-medium">הצבעתך נקלטה בהצלחה</p>
            <p className="text-lg text-gray-600 mb-8">דירה {apartment.number}</p>

            {votedValue && (
              <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-lg text-gray-600 mb-2">הצבעת:</p>
                <p className={`text-3xl font-bold ${votedValue === 'yes' ? 'text-green-600' : 'text-red-600'}`}>
                  {votedValue === 'yes' ? 'בעד' : 'נגד'}
                </p>
              </div>
            )}

            {/* Show results toggle */}
            <button
              onClick={handleToggleResults}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 text-xl font-semibold py-4 px-6 rounded-xl transition-all duration-200 mb-4 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {showResults ? 'הסתר תוצאות' : 'הצג תוצאות ביניים'}
            </button>

            {showResults && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl mb-4 border border-blue-200 shadow-sm">
                <p className="text-lg font-semibold text-blue-900 mb-4">תוצאות עד כה:</p>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600 mb-1">{results.yes}</p>
                    <p className="text-lg text-gray-600 font-medium">בעד</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-red-600 mb-1">{results.no}</p>
                    <p className="text-lg text-gray-600 font-medium">נגד</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4 font-medium">סה"כ הצביעו: {results.total} דירות</p>
              </div>
            )}

            <button
              onClick={onLogout}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xl font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              יציאה
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Voting view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-lg text-blue-700 mb-2 font-medium">שלום, דירה {apartment.number}</p>
          <h1 className="text-4xl font-bold text-blue-900 drop-shadow-sm">הצבעה</h1>
        </div>

        {/* Voting Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
          {/* Issue details */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{issue.title}</h2>
            <p className="text-xl text-gray-700 leading-relaxed">{issue.description}</p>
          </div>

          {/* Voting buttons */}
          <div className="space-y-4">
            <p className="text-xl font-semibold text-gray-800 text-center mb-6">
              מה עמדתך?
            </p>

            {/* YES Button */}
            <button
              onClick={() => handleVote('yes')}
              disabled={isVoting}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white text-3xl font-bold py-6 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              בעד
            </button>

            {/* NO Button */}
            <button
              onClick={() => handleVote('no')}
              disabled={isVoting}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 text-white text-3xl font-bold py-6 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              נגד
            </button>
          </div>

          {isVoting && (
            <div className="text-center text-xl text-blue-600 mt-6 flex items-center justify-center gap-3">
              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">מקליט הצבעה...</span>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full mt-6 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 text-lg font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
        >
          יציאה ללא הצבעה
        </button>
      </div>
    </div>
  );
}
