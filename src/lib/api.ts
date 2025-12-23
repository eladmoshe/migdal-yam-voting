import { supabase } from '../config/supabase';
import type {
  Apartment,
  VotingIssue,
  VotingIssueWithCounts,
  VoteResults,
  VoteWithApartment,
  AuditLog,
  AuditLogStats,
  CreateApartmentResponse,
} from '../types';
import type { Database } from '../types/database';

// Type helpers for RPC return types
type ValidateCredentialsResult = Database['public']['Functions']['validate_apartment_credentials']['Returns'][number];
type GetActiveIssueResult = Database['public']['Functions']['get_active_issue']['Returns'][number];
type GetVoteResultsResult = Database['public']['Functions']['get_vote_results']['Returns'][number];
type GetAllIssuesResult = Database['public']['Functions']['get_all_issues_with_counts']['Returns'][number];
type GetVotesByIssueResult = Database['public']['Functions']['get_votes_by_issue']['Returns'][number];

// Helper to call RPC with proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as (fn: string, args?: Record<string, unknown>) => any;

// ============================================
// VOTER API FUNCTIONS
// ============================================

/**
 * Validate apartment credentials (server-side PIN check)
 * Returns apartment info if valid, null if invalid
 */
export async function validateCredentials(
  apartmentNumber: string,
  pin: string
): Promise<Apartment | null> {
  const { data, error } = await rpc('validate_apartment_credentials', {
    p_apartment_number: apartmentNumber,
    p_pin: pin,
  });

  if (error || !data || (data as ValidateCredentialsResult[]).length === 0) {
    return null;
  }

  const result = (data as ValidateCredentialsResult[])[0];
  return {
    id: result.apartment_id,
    number: result.apartment_number,
    ownerName: result.owner_name,
  };
}

/**
 * Get the currently active voting issue
 */
export async function getActiveIssue(): Promise<VotingIssue | null> {
  const { data, error } = await rpc('get_active_issue');

  if (error || !data || (data as GetActiveIssueResult[]).length === 0) {
    return null;
  }

  const result = (data as GetActiveIssueResult[])[0];
  return {
    id: result.id,
    title: result.title,
    description: result.description,
    active: true,
    createdAt: result.created_at,
  };
}

/**
 * Check if an apartment has already voted on an issue
 */
export async function hasApartmentVoted(
  apartmentId: string,
  issueId: string
): Promise<boolean> {
  const { data, error } = await rpc('check_apartment_voted', {
    p_apartment_id: apartmentId,
    p_issue_id: issueId,
  });

  if (error) {
    console.error('Error checking vote status:', error);
    return false;
  }

  return data === true;
}

/**
 * Cast a vote for an issue
 * Returns true if successful, false if already voted or error
 */
export async function castVote(
  apartmentId: string,
  issueId: string,
  vote: 'yes' | 'no'
): Promise<boolean> {
  const { data, error } = await rpc('cast_vote', {
    p_apartment_id: apartmentId,
    p_issue_id: issueId,
    p_vote: vote,
  });

  if (error) {
    console.error('Error casting vote:', error);
    return false;
  }

  return data === true;
}

/**
 * Get vote results for an issue (public aggregates)
 */
export async function getVoteResults(issueId: string): Promise<VoteResults> {
  const { data, error } = await rpc('get_vote_results', {
    p_issue_id: issueId,
  });

  if (error || !data || (data as GetVoteResultsResult[]).length === 0) {
    return { yes: 0, no: 0, total: 0 };
  }

  const result = (data as GetVoteResultsResult[])[0];
  return {
    yes: result.yes_count ?? 0,
    no: result.no_count ?? 0,
    total: result.total_count ?? 0,
  };
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

/**
 * Get all voting issues with vote counts (admin only)
 */
export async function getAllIssues(): Promise<VotingIssueWithCounts[]> {
  const { data, error } = await rpc('get_all_issues_with_counts');

  if (error) {
    console.error('Error fetching issues:', error);
    return [];
  }

  return ((data ?? []) as GetAllIssuesResult[]).map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    active: issue.active,
    createdAt: issue.created_at,
    closedAt: issue.closed_at,
    yesCount: issue.yes_count ?? 0,
    noCount: issue.no_count ?? 0,
    totalCount: issue.total_count ?? 0,
  }));
}

/**
 * Get votes for an issue with apartment info (admin only)
 */
export async function getVotesByIssue(issueId: string): Promise<VoteWithApartment[]> {
  const { data, error } = await rpc('get_votes_by_issue', {
    p_issue_id: issueId,
  });

  if (error) {
    console.error('Error fetching votes:', error);
    return [];
  }

  return ((data ?? []) as GetVotesByIssueResult[]).map((vote) => ({
    voteId: vote.vote_id,
    apartmentNumber: vote.apartment_number,
    ownerName: vote.owner_name,
    vote: vote.vote as 'yes' | 'no',
    votedAt: vote.voted_at,
  }));
}

/**
 * Create a new voting issue (admin only)
 */
export async function createIssue(
  title: string,
  description: string,
  active: boolean = false
): Promise<string | null> {
  const { data, error } = await rpc('create_issue', {
    p_title: title,
    p_description: description,
    p_active: active,
  });

  if (error) {
    console.error('Error creating issue:', error);
    return null;
  }

  return data as string | null;
}

/**
 * Toggle issue active status (admin only)
 */
export async function toggleIssueActive(
  issueId: string,
  active: boolean
): Promise<boolean> {
  const { data, error } = await rpc('toggle_issue_active', {
    p_issue_id: issueId,
    p_active: active,
  });

  if (error) {
    console.error('Error toggling issue:', error);
    return false;
  }

  return data === true;
}

/**
 * Get all apartments (admin only)
 */
export async function getAllApartments(): Promise<Apartment[]> {
  const { data, error } = await supabase
    .from('apartments')
    .select('id, number, owner_name')
    .order('number');

  if (error) {
    console.error('Error fetching apartments:', error);
    return [];
  }

  type ApartmentRow = { id: string; number: string; owner_name: string };
  return ((data ?? []) as ApartmentRow[]).map((apt) => ({
    id: apt.id,
    number: apt.number,
    ownerName: apt.owner_name,
  }));
}

// ============================================
// AUDIT LOG API FUNCTIONS
// ============================================

// Type helper for audit log RPC results
type GetAuditLogsResult = Database['public']['Functions']['get_audit_logs']['Returns'][number];
type GetAuditLogStatsResult = Database['public']['Functions']['get_audit_log_stats']['Returns'][number];

/**
 * Get audit logs with pagination and optional filters (admin only)
 */
export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  actionFilter?: string | null;
  actorTypeFilter?: string | null;
}): Promise<AuditLog[]> {
  const { data, error } = await rpc('get_audit_logs', {
    p_limit: options?.limit ?? 50,
    p_offset: options?.offset ?? 0,
    p_action_filter: options?.actionFilter ?? null,
    p_actor_type_filter: options?.actorTypeFilter ?? null,
  });

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return ((data ?? []) as GetAuditLogsResult[]).map((log) => ({
    id: log.id,
    createdAt: log.created_at,
    actorType: log.actor_type as AuditLog['actorType'],
    actorId: log.actor_id,
    actorEmail: log.actor_email,
    actorName: log.actor_name,
    action: log.action,
    resourceType: log.resource_type as AuditLog['resourceType'],
    resourceId: log.resource_id,
    success: log.success,
    errorMessage: log.error_message,
    details: log.details as Record<string, unknown>,
  }));
}

/**
 * Get audit log statistics (admin only)
 */
export async function getAuditLogStats(): Promise<AuditLogStats[]> {
  const { data, error } = await rpc('get_audit_log_stats');

  if (error) {
    console.error('Error fetching audit log stats:', error);
    return [];
  }

  return ((data ?? []) as GetAuditLogStatsResult[]).map((stat) => ({
    action: stat.action,
    count: stat.count,
    lastOccurrence: stat.last_occurrence,
  }));
}

/**
 * Log a client-side event (for admin auth events)
 */
export async function logClientEvent(
  action: string,
  resourceType: string,
  resourceId: string | null,
  success: boolean,
  errorMessage: string | null,
  details: Record<string, unknown> | null
): Promise<string | null> {
  const { data, error } = await rpc('log_client_event', {
    p_action: action,
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_success: success,
    p_error_message: errorMessage,
    p_details: details,
  });

  if (error) {
    console.error('Error logging client event:', error);
    return null;
  }

  return data as string | null;
}

// ============================================
// APARTMENT MANAGEMENT API FUNCTIONS
// ============================================

/**
 * Create a new apartment with auto-generated PIN (admin only)
 * Returns success with apartment data including one-time PIN, or error message
 */
export async function createApartment(
  apartmentNumber: string,
  ownerName: string
): Promise<{ success: true; data: CreateApartmentResponse } | { success: false; error: string }> {
  // Trim inputs
  const trimmedNumber = apartmentNumber.trim();
  const trimmedName = ownerName.trim();

  const { data, error } = await rpc('create_apartment', {
    p_apartment_number: trimmedNumber,
    p_owner_name: trimmedName,
  });

  if (error) {
    console.error('Error creating apartment:', error);

    // Map database errors to user-friendly Hebrew messages
    if (error.message?.includes('already exists') || error.code === '23505') {
      return { success: false, error: 'מספר דירה זה כבר קיים במערכת' };
    }

    if (error.message?.includes('Apartment number is required')) {
      return { success: false, error: 'מספר דירה הוא שדה חובה' };
    }

    if (error.message?.includes('Owner name is required')) {
      return { success: false, error: 'שם בעל הדירה הוא שדה חובה' };
    }

    if (error.message?.includes('Authentication required')) {
      return { success: false, error: 'נדרשת הזדהות כמנהל' };
    }

    if (error.message?.includes('Admin privileges required')) {
      return { success: false, error: 'נדרשות הרשאות מנהל' };
    }

    // Generic error
    return { success: false, error: 'אירעה שגיאה ביצירת הדירה' };
  }

  // Type assertion for the RPC response
  type CreateApartmentRpcResponse = {
    apartment_id: string;
    apartment_number: string;
    owner_name: string;
    pin: string;
  };

  const result = data as CreateApartmentRpcResponse;

  return {
    success: true,
    data: {
      apartmentId: result.apartment_id,
      apartmentNumber: result.apartment_number,
      ownerName: result.owner_name,
      pin: result.pin,
    },
  };
}
