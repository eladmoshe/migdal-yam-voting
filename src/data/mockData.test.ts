import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateCredentials,
  hasApartmentVoted,
  castVote,
  getVoteResults,
  votes,
  apartments,
} from './mockData';

describe('validateCredentials', () => {
  it('should return apartment for valid credentials', () => {
    const result = validateCredentials('1', '12345');
    expect(result).not.toBeNull();
    expect(result?.number).toBe('1');
    expect(result?.ownerName).toBe('משפחת כהן');
  });

  it('should return null for invalid apartment number', () => {
    const result = validateCredentials('999', '12345');
    expect(result).toBeNull();
  });

  it('should return null for invalid PIN', () => {
    const result = validateCredentials('1', '99999');
    expect(result).toBeNull();
  });

  it('should return null for mismatched apartment and PIN', () => {
    // Apartment 1 has PIN 12345, not 23456
    const result = validateCredentials('1', '23456');
    expect(result).toBeNull();
  });

  it('should return null for empty apartment number', () => {
    const result = validateCredentials('', '12345');
    expect(result).toBeNull();
  });

  it('should return null for empty PIN', () => {
    const result = validateCredentials('1', '');
    expect(result).toBeNull();
  });

  it('should validate all mock apartments correctly', () => {
    apartments.forEach((apt) => {
      const result = validateCredentials(apt.number, apt.pin);
      expect(result).not.toBeNull();
      expect(result?.number).toBe(apt.number);
    });
  });
});

describe('voting functions', () => {
  beforeEach(() => {
    // Clear votes array before each test
    votes.length = 0;
  });

  describe('hasApartmentVoted', () => {
    it('should return false when apartment has not voted', () => {
      const result = hasApartmentVoted('1', 'issue-001');
      expect(result).toBe(false);
    });

    it('should return true when apartment has voted', () => {
      castVote('1', 'issue-001', 'yes');
      const result = hasApartmentVoted('1', 'issue-001');
      expect(result).toBe(true);
    });

    it('should return false for different issue', () => {
      castVote('1', 'issue-001', 'yes');
      const result = hasApartmentVoted('1', 'issue-002');
      expect(result).toBe(false);
    });

    it('should return false for different apartment', () => {
      castVote('1', 'issue-001', 'yes');
      const result = hasApartmentVoted('2', 'issue-001');
      expect(result).toBe(false);
    });
  });

  describe('castVote', () => {
    it('should successfully cast a vote', () => {
      const result = castVote('1', 'issue-001', 'yes');
      expect(result).toBe(true);
      expect(votes).toHaveLength(1);
      expect(votes[0].apartmentNumber).toBe('1');
      expect(votes[0].vote).toBe('yes');
    });

    it('should prevent duplicate votes from same apartment', () => {
      castVote('1', 'issue-001', 'yes');
      const result = castVote('1', 'issue-001', 'no');
      expect(result).toBe(false);
      expect(votes).toHaveLength(1);
    });

    it('should allow same apartment to vote on different issues', () => {
      const result1 = castVote('1', 'issue-001', 'yes');
      const result2 = castVote('1', 'issue-002', 'no');
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(votes).toHaveLength(2);
    });

    it('should allow different apartments to vote on same issue', () => {
      const result1 = castVote('1', 'issue-001', 'yes');
      const result2 = castVote('2', 'issue-001', 'no');
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(votes).toHaveLength(2);
    });
  });

  describe('getVoteResults', () => {
    it('should return zero counts when no votes', () => {
      const results = getVoteResults('issue-001');
      expect(results.yes).toBe(0);
      expect(results.no).toBe(0);
      expect(results.total).toBe(0);
    });

    it('should correctly count yes votes', () => {
      castVote('1', 'issue-001', 'yes');
      castVote('2', 'issue-001', 'yes');
      const results = getVoteResults('issue-001');
      expect(results.yes).toBe(2);
      expect(results.no).toBe(0);
      expect(results.total).toBe(2);
    });

    it('should correctly count no votes', () => {
      castVote('1', 'issue-001', 'no');
      castVote('2', 'issue-001', 'no');
      const results = getVoteResults('issue-001');
      expect(results.yes).toBe(0);
      expect(results.no).toBe(2);
      expect(results.total).toBe(2);
    });

    it('should correctly count mixed votes', () => {
      castVote('1', 'issue-001', 'yes');
      castVote('2', 'issue-001', 'no');
      castVote('3', 'issue-001', 'yes');
      const results = getVoteResults('issue-001');
      expect(results.yes).toBe(2);
      expect(results.no).toBe(1);
      expect(results.total).toBe(3);
    });

    it('should only count votes for specified issue', () => {
      castVote('1', 'issue-001', 'yes');
      castVote('2', 'issue-002', 'yes');
      const results = getVoteResults('issue-001');
      expect(results.total).toBe(1);
    });
  });
});
