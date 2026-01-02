import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Apartment, VotingIssue } from '../types';
import { getActiveIssue } from '../lib/api';
import { loadVoterSession, saveVoterSession, clearVoterSession } from '../lib/voterSession';

interface VotingContextType {
  // Voter session
  apartment: Apartment | null;
  isLoggedIn: boolean;
  login: (apartment: Apartment) => void;
  logout: () => void;

  // Current issue
  currentIssue: VotingIssue | null;
  isLoadingIssue: boolean;
  issueError: string | null;
  refreshIssue: () => Promise<void>;
}

const VotingContext = createContext<VotingContextType | null>(null);

interface VotingProviderProps {
  children: ReactNode;
}

export function VotingProvider({ children }: VotingProviderProps) {
  // Initialize from localStorage - use lazy initializer for SSR safety
  const [apartment, setApartment] = useState<Apartment | null>(() => {
    if (typeof window === 'undefined') return null;
    return loadVoterSession();
  });
  const [currentIssue, setCurrentIssue] = useState<VotingIssue | null>(null);
  const [isLoadingIssue, setIsLoadingIssue] = useState(true);
  const [issueError, setIssueError] = useState<string | null>(null);

  const login = (apt: Apartment) => {
    setApartment(apt);
    saveVoterSession(apt);
  };

  const logout = () => {
    setApartment(null);
    clearVoterSession();
  };

  const refreshIssue = async () => {
    setIsLoadingIssue(true);
    setIssueError(null);

    try {
      const issue = await getActiveIssue();
      setCurrentIssue(issue);
      if (!issue) {
        setIssueError('אין הצבעה פעילה כרגע');
      }
    } catch {
      setIssueError('שגיאה בטעינת ההצבעה');
    } finally {
      setIsLoadingIssue(false);
    }
  };

  // Load active issue on mount
  useEffect(() => {
    refreshIssue();
  }, []);

  return (
    <VotingContext.Provider
      value={{
        apartment,
        isLoggedIn: apartment !== null,
        login,
        logout,
        currentIssue,
        isLoadingIssue,
        issueError,
        refreshIssue,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
}

export function useVoting() {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
}
