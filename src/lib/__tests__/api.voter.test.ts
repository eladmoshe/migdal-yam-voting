import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client before importing API functions
const mockRpc = vi.fn();

vi.mock('../../config/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

// Import after mocks are set up
import {
  validateCredentials,
  getActiveIssue,
  hasApartmentVoted,
  castVote,
  getVoteResults,
} from '../api';

describe('api.ts - Voter Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCredentials', () => {
    it('should return apartment on valid credentials', async () => {
      mockRpc.mockResolvedValue({
        data: [{
          apartment_id: 'apt-123',
          apartment_number: '42',
          owner_name: 'משפחת כהן',
        }],
        error: null,
      });

      const result = await validateCredentials('42', '12345');

      expect(mockRpc).toHaveBeenCalledWith('validate_apartment_credentials', {
        p_apartment_number: '42',
        p_pin: '12345',
      });
      expect(result).toEqual({
        id: 'apt-123',
        number: '42',
        ownerName: 'משפחת כהן',
      });
    });

    it('should return null on invalid credentials', async () => {
      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await validateCredentials('42', 'wrongpin');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await validateCredentials('42', '12345');

      expect(result).toBeNull();
    });

    it('should return null when data is null', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await validateCredentials('42', '12345');

      expect(result).toBeNull();
    });
  });

  describe('getActiveIssue', () => {
    it('should return active issue when exists', async () => {
      mockRpc.mockResolvedValue({
        data: [{
          id: 'issue-123',
          title: 'הצבעה חשובה',
          description: 'תיאור ההצבעה',
          created_at: '2024-01-01T00:00:00Z',
        }],
        error: null,
      });

      const result = await getActiveIssue();

      expect(mockRpc).toHaveBeenCalledWith('get_active_issue');
      expect(result).toEqual({
        id: 'issue-123',
        title: 'הצבעה חשובה',
        description: 'תיאור ההצבעה',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

    it('should return null when no active issue', async () => {
      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getActiveIssue();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await getActiveIssue();

      expect(result).toBeNull();
    });
  });

  describe('hasApartmentVoted', () => {
    it('should return true when apartment has voted', async () => {
      mockRpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await hasApartmentVoted('apt-123', 'issue-123');

      expect(mockRpc).toHaveBeenCalledWith('check_apartment_voted', {
        p_apartment_id: 'apt-123',
        p_issue_id: 'issue-123',
      });
      expect(result).toBe(true);
    });

    it('should return false when apartment has not voted', async () => {
      mockRpc.mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await hasApartmentVoted('apt-123', 'issue-123');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await hasApartmentVoted('apt-123', 'issue-123');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('castVote', () => {
    it('should return true on successful vote', async () => {
      mockRpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await castVote('apt-123', 'issue-123', 'yes');

      expect(mockRpc).toHaveBeenCalledWith('cast_vote', {
        p_apartment_id: 'apt-123',
        p_issue_id: 'issue-123',
        p_vote: 'yes',
      });
      expect(result).toBe(true);
    });

    it('should work with no vote', async () => {
      mockRpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await castVote('apt-123', 'issue-123', 'no');

      expect(mockRpc).toHaveBeenCalledWith('cast_vote', {
        p_apartment_id: 'apt-123',
        p_issue_id: 'issue-123',
        p_vote: 'no',
      });
      expect(result).toBe(true);
    });

    it('should return false when already voted', async () => {
      mockRpc.mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await castVote('apt-123', 'issue-123', 'yes');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await castVote('apt-123', 'issue-123', 'yes');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getVoteResults', () => {
    it('should return vote results', async () => {
      mockRpc.mockResolvedValue({
        data: [{
          yes_count: 10,
          no_count: 5,
          total_count: 15,
        }],
        error: null,
      });

      const result = await getVoteResults('issue-123');

      expect(mockRpc).toHaveBeenCalledWith('get_vote_results', {
        p_issue_id: 'issue-123',
      });
      expect(result).toEqual({
        yes: 10,
        no: 5,
        total: 15,
      });
    });

    it('should handle null counts', async () => {
      mockRpc.mockResolvedValue({
        data: [{
          yes_count: null,
          no_count: null,
          total_count: null,
        }],
        error: null,
      });

      const result = await getVoteResults('issue-123');

      expect(result).toEqual({
        yes: 0,
        no: 0,
        total: 0,
      });
    });

    it('should return empty results on error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await getVoteResults('issue-123');

      expect(result).toEqual({
        yes: 0,
        no: 0,
        total: 0,
      });
    });

    it('should return empty results when no data', async () => {
      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getVoteResults('issue-123');

      expect(result).toEqual({
        yes: 0,
        no: 0,
        total: 0,
      });
    });
  });
});
