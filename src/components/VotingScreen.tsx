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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="text-center">
          <div className="spinner mx-auto mb-6"></div>
          <p className="text-xl text-gray-600">בודק סטטוס הצבעה...</p>
        </div>
      </div>
    );
  }

  // Already voted view
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-md text-center">
          <div className="card card-elevated p-8">
            {/* Success checkmark */}
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
              <svg
                className="w-14 h-14 text-white"
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

            <h1 className="text-3xl font-bold text-gray-800 mb-3">תודה רבה!</h1>
            <p className="text-xl text-gray-600 mb-2">הצבעתך נקלטה בהצלחה</p>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-base mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              דירה {apartment.number}
            </div>

            {votedValue && (
              <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-base text-gray-500 mb-2">הצבעת:</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xl font-bold ${
                  votedValue === 'yes'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {votedValue === 'yes' ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      בעד
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      נגד
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Show results toggle */}
            <button
              onClick={handleToggleResults}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-semibold py-4 px-6 rounded-xl transition-colors duration-200 mb-4 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {showResults ? 'הסתר תוצאות' : 'הצג תוצאות ביניים'}
            </button>

            {showResults && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl mb-4 border border-blue-100">
                <p className="text-base font-semibold text-gray-700 mb-4">תוצאות עד כה:</p>
                <div className="flex justify-around mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">{results.yes}</span>
                    </div>
                    <p className="text-base text-gray-600 font-medium">בעד</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-red-600">{results.no}</span>
                    </div>
                    <p className="text-base text-gray-600 font-medium">נגד</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">סה"כ הצביעו: {results.total} דירות</p>
              </div>
            )}

            <button
              onClick={onLogout}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xl font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              יציאה
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Voting view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-base mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            שלום, דירה {apartment.number}
          </div>
          <h1 className="text-3xl font-bold text-gray-800">הצבעה</h1>
        </div>

        {/* Voting Card */}
        <div className="card card-elevated p-8">
          {/* Issue details */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{issue.title}</h2>
            <p className="text-lg text-gray-600 leading-relaxed">{issue.description}</p>
          </div>

          {/* Voting buttons */}
          <div className="space-y-4">
            <p className="text-lg font-semibold text-gray-700 text-center mb-4">
              מה עמדתך?
            </p>

            {/* YES Button */}
            <button
              onClick={() => handleVote('yes')}
              disabled={isVoting}
              className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white text-3xl font-bold py-6 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-200 flex items-center justify-center gap-3 shadow-lg shadow-green-200 disabled:shadow-none"
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
              className="w-full bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white text-3xl font-bold py-6 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-200 flex items-center justify-center gap-3 shadow-lg shadow-red-200 disabled:shadow-none"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              נגד
            </button>
          </div>

          {isVoting && (
            <div className="flex items-center justify-center gap-3 text-xl text-blue-600 mt-6">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              מקליט הצבעה...
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full mt-6 bg-white hover:bg-gray-50 text-gray-600 text-lg font-semibold py-3 px-6 rounded-xl transition-colors duration-200 border border-gray-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          יציאה ללא הצבעה
        </button>
      </div>
    </div>
  );
}
