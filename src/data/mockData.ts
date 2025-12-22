import type { Apartment, VotingIssue, Vote } from '../types';

// Mock apartments with PINs (in production, this would be server-side only)
export const apartments: Apartment[] = [
  { number: '1', pin: '12345', ownerName: 'משפחת כהן' },
  { number: '2', pin: '23456', ownerName: 'משפחת לוי' },
  { number: '3', pin: '34567', ownerName: 'משפחת ישראלי' },
  { number: '4', pin: '45678', ownerName: 'משפחת אברהם' },
  { number: '5', pin: '56789', ownerName: 'משפחת דוד' },
  { number: '6', pin: '67890', ownerName: 'משפחת משה' },
  { number: '7', pin: '78901', ownerName: 'משפחת יעקב' },
  { number: '8', pin: '89012', ownerName: 'משפחת שרה' },
];

// Current voting issue
export const currentIssue: VotingIssue = {
  id: 'issue-001',
  title: 'שיפוץ חדר המדרגות',
  description: 'האם לאשר שיפוץ חדר המדרגות בעלות של 50,000 ש"ח?',
  active: true,
};

// In-memory votes storage (for MVP)
export const votes: Vote[] = [];

// Helper functions
export function validateCredentials(apartmentNumber: string, pin: string): Apartment | null {
  const apartment = apartments.find(
    (apt) => apt.number === apartmentNumber && apt.pin === pin
  );
  return apartment || null;
}

export function hasApartmentVoted(apartmentNumber: string, issueId: string): boolean {
  return votes.some(
    (vote) => vote.apartmentNumber === apartmentNumber && vote.issueId === issueId
  );
}

export function castVote(apartmentNumber: string, issueId: string, voteValue: 'yes' | 'no'): boolean {
  if (hasApartmentVoted(apartmentNumber, issueId)) {
    return false;
  }

  votes.push({
    issueId,
    apartmentNumber,
    vote: voteValue,
    timestamp: new Date(),
  });

  return true;
}

export function getVoteResults(issueId: string): { yes: number; no: number; total: number } {
  const issueVotes = votes.filter((vote) => vote.issueId === issueId);
  const yes = issueVotes.filter((vote) => vote.vote === 'yes').length;
  const no = issueVotes.filter((vote) => vote.vote === 'no').length;

  return { yes, no, total: yes + no };
}
