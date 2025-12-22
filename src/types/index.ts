export interface Apartment {
  number: string;
  pin: string;
  ownerName: string;
}

export interface VotingIssue {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

export interface Vote {
  issueId: string;
  apartmentNumber: string;
  vote: 'yes' | 'no';
  timestamp: Date;
}

export interface AppState {
  isLoggedIn: boolean;
  currentApartment: Apartment | null;
  currentIssue: VotingIssue | null;
  hasVoted: boolean;
}
