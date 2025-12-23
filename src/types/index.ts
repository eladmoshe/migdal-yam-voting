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

// Audit log types
export type AuditActorType = 'voter' | 'admin' | 'system';
export type AuditResourceType = 'auth' | 'vote' | 'issue' | 'apartment' | 'system';

export type AuditAction =
  | 'voter_login_success'
  | 'voter_login_failed'
  | 'vote_cast'
  | 'vote_duplicate_attempt'
  | 'admin_login_success'
  | 'admin_login_failed'
  | 'admin_logout'
  | 'issue_created'
  | 'issue_activated'
  | 'issue_deactivated'
  | 'issue_details_viewed'
  | 'votes_viewed';

export interface AuditLog {
  id: string;
  createdAt: string;
  actorType: AuditActorType;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  resourceType: AuditResourceType;
  resourceId: string | null;
  success: boolean;
  errorMessage: string | null;
  details: Record<string, unknown>;
}

export interface AuditLogStats {
  action: string;
  count: number;
  lastOccurrence: string;
}
