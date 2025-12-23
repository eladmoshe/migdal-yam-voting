// Re-export database types
export type { Database } from './database';

// Client-side types (what components use)
export interface Apartment {
  id: string;
  number: string;
  ownerName: string;
}

export interface VotingIssue {
  id: string;
  title: string;
  description: string;
  active: boolean;
  createdAt?: string;
  closedAt?: string | null;
}

export interface VotingIssueWithCounts extends VotingIssue {
  yesCount: number;
  noCount: number;
  totalCount: number;
}

export interface Vote {
  id: string;
  issueId: string;
  apartmentId: string;
  vote: 'yes' | 'no';
  createdAt: string;
}

export interface VoteWithApartment {
  voteId: string;
  apartmentNumber: string;
  ownerName: string;
  vote: 'yes' | 'no';
  votedAt: string;
}

export interface VoteResults {
  yes: number;
  no: number;
  total: number;
}

export interface VoterSession {
  apartment: Apartment;
}

// Admin types
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
}
