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
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl text-blue-700">בודק סטטוס הצבעה...</p>
        </div>
      </div>
    );
  }

  // Already voted view
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Success checkmark */}
            <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
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

            <h1 className="text-3xl font-bold text-green-800 mb-4">תודה רבה!</h1>
            <p className="text-xl text-gray-700 mb-2">הצבעתך נקלטה בהצלחה</p>
            <p className="text-lg text-gray-600 mb-6">דירה {apartment.number}</p>

            {votedValue && (
              <div className="mb-6 p-4 bg-gray-100 rounded-xl">
                <p className="text-lg text-gray-600">הצבעת:</p>
                <p className={`text-2xl font-bold ${votedValue === 'yes' ? 'text-green-600' : 'text-red-600'}`}>
                  {votedValue === 'yes' ? 'בעד' : 'נגד'}
                </p>
              </div>
            )}

            {/* Show results toggle */}
            <button
              onClick={handleToggleResults}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-xl font-semibold py-4 px-6 rounded-xl transition-colors duration-200 mb-4"
            >
              {showResults ? 'הסתר תוצאות' : 'הצג תוצאות ביניים'}
            </button>

            {showResults && (
              <div className="bg-blue-50 p-4 rounded-xl mb-4">
                <p className="text-lg font-semibold text-blue-900 mb-3">תוצאות עד כה:</p>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{results.yes}</p>
                    <p className="text-lg text-gray-600">בעד</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{results.no}</p>
                    <p className="text-lg text-gray-600">נגד</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">סה"כ הצביעו: {results.total} דירות</p>
              </div>
            )}

            <button
              onClick={onLogout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
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
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-lg text-blue-700 mb-1">שלום, דירה {apartment.number}</p>
          <h1 className="text-3xl font-bold text-blue-900">הצבעה</h1>
        </div>

        {/* Voting Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Issue details */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{issue.title}</h2>
            <p className="text-xl text-gray-700 leading-relaxed">{issue.description}</p>
          </div>

          {/* Voting buttons */}
          <div className="space-y-4">
            <p className="text-xl font-semibold text-gray-800 text-center mb-4">
              מה עמדתך?
            </p>

            {/* YES Button */}
            <button
              onClick={() => handleVote('yes')}
              disabled={isVoting}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-3xl font-bold py-6 px-6 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center gap-3"
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
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-3xl font-bold py-6 px-6 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-red-300 flex items-center justify-center gap-3"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              נגד
            </button>
          </div>

          {isVoting && (
            <p className="text-center text-xl text-blue-600 mt-6 animate-pulse">
              מקליט הצבעה...
            </p>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 text-lg font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
        >
          יציאה ללא הצבעה
        </button>
      </div>
    </div>
  );
}
