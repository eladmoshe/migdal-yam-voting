import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client before importing API functions
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('../../config/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Import after mocks are set up
import {
  getAllIssues,
  getVotesByIssue,
  createIssue,
  toggleIssueActive,
  getAllApartments,
  getAuditLogs,
  getAuditLogStats,
  logClientEvent,
  resetApartmentPin,
  updateApartmentOwner,
  deleteApartment,
} from '../api';

describe('api.ts - Admin Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllIssues', () => {
    it('should return all issues with counts', async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            id: 'issue-1',
            title: 'הצבעה ראשונה',
            description: 'תיאור ראשון',
            active: true,
            created_at: '2024-01-01T00:00:00Z',
            closed_at: null,
            yes_count: 10,
            no_count: 5,
            total_count: 15,
          },
          {
            id: 'issue-2',
            title: 'הצבעה שנייה',
            description: 'תיאור שני',
            active: false,
            created_at: '2024-01-02T00:00:00Z',
            closed_at: '2024-01-03T00:00:00Z',
            yes_count: 8,
            no_count: 12,
            total_count: 20,
          },
        ],
        error: null,
      });

      const result = await getAllIssues();

      expect(mockRpc).toHaveBeenCalledWith('get_all_issues_with_counts');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'issue-1',
        title: 'הצבעה ראשונה',
        description: 'תיאור ראשון',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        closedAt: null,
        yesCount: 10,
        noCount: 5,
        totalCount: 15,
      });
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await getAllIssues();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle null counts', async () => {
      mockRpc.mockResolvedValue({
        data: [{
          id: 'issue-1',
          title: 'הצבעה',
          description: 'תיאור',
          active: true,
          created_at: '2024-01-01T00:00:00Z',
          closed_at: null,
          yes_count: null,
          no_count: null,
          total_count: null,
        }],
        error: null,
      });

      const result = await getAllIssues();

      expect(result[0].yesCount).toBe(0);
      expect(result[0].noCount).toBe(0);
      expect(result[0].totalCount).toBe(0);
    });
  });

  describe('getVotesByIssue', () => {
    it('should return votes with apartment info', async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            vote_id: 'vote-1',
            apartment_number: '42',
            owner_name: 'משפחת כהן',
            vote: 'yes',
            voted_at: '2024-01-01T12:00:00Z',
          },
          {
            vote_id: 'vote-2',
            apartment_number: '43',
            owner_name: 'משפחת לוי',
            vote: 'no',
            voted_at: '2024-01-01T13:00:00Z',
          },
        ],
        error: null,
      });

      const result = await getVotesByIssue('issue-123');

      expect(mockRpc).toHaveBeenCalledWith('get_votes_by_issue', {
        p_issue_id: 'issue-123',
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        voteId: 'vote-1',
        apartmentNumber: '42',
        ownerName: 'משפחת כהן',
        vote: 'yes',
        votedAt: '2024-01-01T12:00:00Z',
      });
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await getVotesByIssue('issue-123');

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('createIssue', () => {
    it('should create issue and return ID', async () => {
      mockRpc.mockResolvedValue({
        data: 'new-issue-123',
        error: null,
      });

      const result = await createIssue('הצבעה חדשה', 'תיאור ההצבעה', false);

      expect(mockRpc).toHaveBeenCalledWith('create_issue', {
        p_title: 'הצבעה חדשה',
        p_description: 'תיאור ההצבעה',
        p_active: false,
      });
      expect(result).toBe('new-issue-123');
    });

    it('should default active to false', async () => {
      mockRpc.mockResolvedValue({
        data: 'new-issue-123',
        error: null,
      });

      await createIssue('הצבעה', 'תיאור');

      expect(mockRpc).toHaveBeenCalledWith('create_issue', {
        p_title: 'הצבעה',
        p_description: 'תיאור',
        p_active: false,
      });
    });

    it('should return null on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await createIssue('הצבעה', 'תיאור');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('toggleIssueActive', () => {
    it('should toggle issue to active', async () => {
      mockRpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await toggleIssueActive('issue-123', true);

      expect(mockRpc).toHaveBeenCalledWith('toggle_issue_active', {
        p_issue_id: 'issue-123',
        p_active: true,
      });
      expect(result).toBe(true);
    });

    it('should toggle issue to inactive', async () => {
      mockRpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await toggleIssueActive('issue-123', false);

      expect(mockRpc).toHaveBeenCalledWith('toggle_issue_active', {
        p_issue_id: 'issue-123',
        p_active: false,
      });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await toggleIssueActive('issue-123', true);

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('getAllApartments', () => {
    it('should return all apartments', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'apt-1', number: '1', owner_name: 'משפחת אלון' },
              { id: 'apt-2', number: '2', owner_name: 'משפחת בן דוד' },
            ],
            error: null,
          }),
        }),
      });

      const result = await getAllApartments();

      expect(mockFrom).toHaveBeenCalledWith('apartments');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'apt-1',
        number: '1',
        ownerName: 'משפחת אלון',
      });
    });

    it('should return empty array on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const result = await getAllApartments();

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs with default options', async () => {
      mockRpc.mockResolvedValue({
        data: [{
          id: 'log-1',
          created_at: '2024-01-01T00:00:00Z',
          actor_type: 'admin',
          actor_id: 'user-123',
          actor_email: 'admin@example.com',
          actor_name: null,
          action: 'admin_login_success',
          resource_type: 'auth',
          resource_id: null,
          success: true,
          error_message: null,
          details: {},
        }],
        error: null,
      });

      const result = await getAuditLogs();

      expect(mockRpc).toHaveBeenCalledWith('get_audit_logs', {
        p_limit: 50,
        p_offset: 0,
        p_action_filter: null,
        p_actor_type_filter: null,
      });
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('admin_login_success');
    });

    it('should pass custom options', async () => {
      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      await getAuditLogs({
        limit: 25,
        offset: 10,
        actionFilter: 'vote_cast',
        actorTypeFilter: 'voter',
      });

      expect(mockRpc).toHaveBeenCalledWith('get_audit_logs', {
        p_limit: 25,
        p_offset: 10,
        p_action_filter: 'vote_cast',
        p_actor_type_filter: 'voter',
      });
    });
  });

  describe('getAuditLogStats', () => {
    it('should return audit log statistics', async () => {
      mockRpc.mockResolvedValue({
        data: [
          { action: 'admin_login_success', count: 10, last_occurrence: '2024-01-01T00:00:00Z' },
          { action: 'vote_cast', count: 25, last_occurrence: '2024-01-02T00:00:00Z' },
        ],
        error: null,
      });

      const result = await getAuditLogStats();

      expect(mockRpc).toHaveBeenCalledWith('get_audit_log_stats');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        action: 'admin_login_success',
        count: 10,
        lastOccurrence: '2024-01-01T00:00:00Z',
      });
    });
  });

  describe('logClientEvent', () => {
    it('should log client event and return ID', async () => {
      mockRpc.mockResolvedValue({
        data: 'log-123',
        error: null,
      });

      const result = await logClientEvent(
        'admin_login_success',
        'auth',
        null,
        true,
        null,
        { email: 'admin@example.com' }
      );

      expect(mockRpc).toHaveBeenCalledWith('log_client_event', {
        p_action: 'admin_login_success',
        p_resource_type: 'auth',
        p_resource_id: null,
        p_success: true,
        p_error_message: null,
        p_details: { email: 'admin@example.com' },
      });
      expect(result).toBe('log-123');
    });

    it('should return null on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await logClientEvent('test', 'test', null, true, null, null);

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('resetApartmentPin', () => {
    it('should reset PIN and return new data', async () => {
      mockRpc.mockResolvedValue({
        data: {
          apartment_id: 'apt-123',
          apartment_number: '42',
          owner_name: 'משפחת כהן',
          phone_number_1: null,
          owner_name_1: null,
          phone_number_2: null,
          owner_name_2: null,
          pin: '654321',
        },
        error: null,
      });

      const result = await resetApartmentPin('42');

      expect(mockRpc).toHaveBeenCalledWith('reset_apartment_pin', {
        p_apartment_number: '42',
      });
      expect(result).toEqual({
        success: true,
        data: {
          apartmentId: 'apt-123',
          apartmentNumber: '42',
          ownerName: 'משפחת כהן',
          phoneNumber1: null,
          ownerName1: null,
          phoneNumber2: null,
          ownerName2: null,
          pin: '654321',
        },
      });
    });

    it('should trim apartment number', async () => {
      mockRpc.mockResolvedValue({
        data: {
          apartment_id: 'apt-123',
          apartment_number: '42',
          owner_name: 'משפחת כהן',
          phone_number_1: null,
          owner_name_1: null,
          phone_number_2: null,
          owner_name_2: null,
          pin: '654321',
        },
        error: null,
      });

      await resetApartmentPin('  42  ');

      expect(mockRpc).toHaveBeenCalledWith('reset_apartment_pin', {
        p_apartment_number: '42',
      });
    });

    it('should return error for not found apartment', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Apartment not found' },
      });

      const result = await resetApartmentPin('999');

      expect(result).toEqual({
        success: false,
        error: 'דירה לא נמצאה במערכת',
      });
    });
  });

  describe('updateApartmentOwner', () => {
    it('should update owner name', async () => {
      mockRpc.mockResolvedValue({
        data: {
          apartment_id: 'apt-123',
          apartment_number: '42',
          owner_name: 'משפחת לוי',
        },
        error: null,
      });

      const result = await updateApartmentOwner('apt-123', 'משפחת לוי');

      expect(mockRpc).toHaveBeenCalledWith('update_apartment_owner', {
        p_apartment_id: 'apt-123',
        p_new_owner_name: 'משפחת לוי',
      });
      expect(result).toEqual({
        success: true,
        data: {
          id: 'apt-123',
          number: '42',
          ownerName: 'משפחת לוי',
        },
      });
    });

    it('should return error for not found apartment', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Apartment not found' },
      });

      const result = await updateApartmentOwner('apt-999', 'משפחת חדש');

      expect(result).toEqual({
        success: false,
        error: 'דירה לא נמצאה במערכת',
      });
    });
  });

  describe('deleteApartment', () => {
    it('should delete apartment and return deleted votes count', async () => {
      mockRpc.mockResolvedValue({
        data: {
          apartment_id: 'apt-123',
          apartment_number: '42',
          owner_name: 'משפחת כהן',
          deleted_votes_count: 3,
        },
        error: null,
      });

      const result = await deleteApartment('apt-123');

      expect(mockRpc).toHaveBeenCalledWith('delete_apartment', {
        p_apartment_id: 'apt-123',
      });
      expect(result).toEqual({
        success: true,
        deletedVotesCount: 3,
      });
    });

    it('should return error for not found apartment', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Apartment not found' },
      });

      const result = await deleteApartment('apt-999');

      expect(result).toEqual({
        success: false,
        error: 'דירה לא נמצאה במערכת',
      });
    });

    it('should handle auth errors', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Authentication required' },
      });

      const result = await deleteApartment('apt-123');

      expect(result).toEqual({
        success: false,
        error: 'נדרשת הזדהות כמנהל',
      });
    });
  });
});
