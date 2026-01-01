/**
 * Test mocks for Supabase client and common test utilities
 */
import { vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';

// ============================================
// MOCK SUPABASE CLIENT
// ============================================

export const mockSupabaseRpc = vi.fn();
export const mockSupabaseFrom = vi.fn();
export const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
};

// Create a chainable mock for .from() queries
export function createQueryMock() {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn(),
  };
  return mock;
}

// ============================================
// MOCK DATA FACTORIES
// ============================================

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    email: 'admin@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as User;
}

export function createMockSession(overrides?: Partial<Session>): Session {
  const user = createMockUser();
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    user,
    ...overrides,
  } as Session;
}

export function createMockApartment(overrides?: Partial<{
  id: string;
  number: string;
  ownerName: string;
}>) {
  return {
    id: 'apt-123',
    number: '42',
    ownerName: 'משפחת כהן',
    ...overrides,
  };
}

export function createMockVotingIssue(overrides?: Partial<{
  id: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  closedAt: string | null;
}>) {
  return {
    id: 'issue-123',
    title: 'הצבעה לדוגמה',
    description: 'תיאור ההצבעה',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    closedAt: null,
    ...overrides,
  };
}

export function createMockVotingIssueWithCounts(overrides?: Partial<{
  id: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  closedAt: string | null;
  yesCount: number;
  noCount: number;
  totalCount: number;
}>) {
  return {
    ...createMockVotingIssue(overrides),
    yesCount: 5,
    noCount: 3,
    totalCount: 8,
    ...overrides,
  };
}

export function createMockVoteResults(overrides?: Partial<{
  yes: number;
  no: number;
  total: number;
}>) {
  return {
    yes: 5,
    no: 3,
    total: 8,
    ...overrides,
  };
}

export function createMockVoteWithApartment(overrides?: Partial<{
  voteId: string;
  apartmentNumber: string;
  ownerName: string;
  vote: 'yes' | 'no';
  votedAt: string;
}>) {
  return {
    voteId: 'vote-123',
    apartmentNumber: '42',
    ownerName: 'משפחת כהן',
    vote: 'yes' as const,
    votedAt: '2024-01-01T12:00:00Z',
    ...overrides,
  };
}

export function createMockAuditLog(overrides?: Partial<{
  id: string;
  createdAt: string;
  actorType: 'admin' | 'voter' | 'system' | 'anonymous';
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  success: boolean;
  errorMessage: string | null;
  details: Record<string, unknown>;
}>) {
  return {
    id: 'log-123',
    createdAt: '2024-01-01T00:00:00Z',
    actorType: 'admin' as const,
    actorId: 'user-123',
    actorEmail: 'admin@example.com',
    actorName: null,
    action: 'admin_login_success',
    resourceType: 'auth',
    resourceId: null,
    success: true,
    errorMessage: null,
    details: {},
    ...overrides,
  };
}

export function createMockCreateApartmentResponse(overrides?: Partial<{
  apartmentId: string;
  apartmentNumber: string;
  ownerName: string;
  phoneNumber1: string | null;
  ownerName1: string | null;
  phoneNumber2: string | null;
  ownerName2: string | null;
  pin: string;
}>) {
  return {
    apartmentId: 'apt-123',
    apartmentNumber: '42',
    ownerName: 'משפחת כהן',
    phoneNumber1: null,
    ownerName1: null,
    phoneNumber2: null,
    ownerName2: null,
    pin: '123456',
    ...overrides,
  };
}

// ============================================
// TEST WRAPPER UTILITIES
// ============================================

import { type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

export function createWrapper(providers: ReactNode[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return providers.reduce(
      (acc, Provider) => {
        if (typeof Provider === 'function') {
          return <Provider>{acc}</Provider>;
        }
        return acc;
      },
      children
    );
  };
}

export function TestRouter({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

// ============================================
// RESET ALL MOCKS
// ============================================

export function resetAllMocks() {
  mockSupabaseRpc.mockReset();
  mockSupabaseFrom.mockReset();
  mockSupabaseAuth.signInWithPassword.mockReset();
  mockSupabaseAuth.signOut.mockReset();
  mockSupabaseAuth.getSession.mockReset();
  mockSupabaseAuth.getUser.mockReset();
  mockSupabaseAuth.onAuthStateChange.mockReset();
}
