import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession, createMockUser } from '../../test/mocks';

// Mock the supabase client before importing auth functions
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock logClientEvent to avoid side effects
vi.mock('../api', () => ({
  logClientEvent: vi.fn().mockResolvedValue('log-123'),
}));

// Import after mocks are set up
import {
  adminLogin,
  adminLogout,
  getSession,
  getUser,
  onAuthStateChange,
  checkIsAdmin,
} from '../auth';

describe('auth.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('adminLogin', () => {
    it('should call signInWithPassword with correct credentials', async () => {
      const mockSession = createMockSession();
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      });

      await adminLogin('admin@example.com', 'password123');

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      });
    });

    it('should return user and session on success', async () => {
      const mockSession = createMockSession();
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      });

      const result = await adminLogin('admin@example.com', 'password123');

      expect(result.user).toEqual(mockSession.user);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should return error on failure', async () => {
      const mockError = { message: 'Invalid credentials', status: 400 };
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await adminLogin('admin@example.com', 'wrongpassword');

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('adminLogout', () => {
    it('should call signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      await adminLogout();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should return no error on success', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const result = await adminLogout();

      expect(result.error).toBeNull();
    });

    it('should return error on failure', async () => {
      const mockError = { message: 'Sign out failed' };
      mockSignOut.mockResolvedValue({ error: mockError });

      const result = await adminLogout();

      expect(result.error).toEqual(mockError);
    });
  });

  describe('getSession', () => {
    it('should return session when exists', async () => {
      const mockSession = createMockSession();
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
      });

      const result = await getSession();

      expect(result).toEqual(mockSession);
    });

    it('should return null when no session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const result = await getSession();

      expect(result).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = createMockUser();
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const result = await getUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await getUser();

      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const callback = vi.fn();
      const mockSubscription = { unsubscribe: vi.fn() };
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: mockSubscription },
      });

      onAuthStateChange(callback);

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('should call callback when auth state changes', () => {
      const callback = vi.fn();
      const mockSubscription = { unsubscribe: vi.fn() };

      mockOnAuthStateChange.mockImplementation((cb) => {
        // Simulate an auth state change
        cb('SIGNED_IN', createMockSession());
        return { data: { subscription: mockSubscription } };
      });

      onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith('SIGNED_IN', expect.any(Object));
    });
  });

  describe('checkIsAdmin', () => {
    it('should return true when user is admin', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      const result = await checkIsAdmin('user-123');

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('admin_roles');
    });

    it('should return false when user is not admin', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await checkIsAdmin('user-123');

      expect(result).toBe(false);
    });

    it('should return false when query fails', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const result = await checkIsAdmin('user-123');

      expect(result).toBe(false);
    });
  });
});
