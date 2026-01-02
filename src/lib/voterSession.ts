import type { Apartment } from '../types';

const STORAGE_KEY = 'migdal_yam_voter_session';

interface StoredSession {
  apartment: Apartment;
}

/**
 * Save authenticated apartment to localStorage
 */
export function saveVoterSession(apartment: Apartment): void {
  try {
    const session: StoredSession = { apartment };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    // localStorage might be full or disabled - fail silently
    console.warn('Failed to save voter session:', error);
  }
}

/**
 * Load stored session from localStorage
 * Returns apartment if valid session exists, null otherwise
 */
export function loadVoterSession(): Apartment | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const session: StoredSession = JSON.parse(stored);

    // Validate session structure
    if (!session.apartment?.id || !session.apartment?.number) {
      clearVoterSession();
      return null;
    }

    return session.apartment;
  } catch (error) {
    // Corrupted data - clear it
    console.warn('Failed to load voter session:', error);
    clearVoterSession();
    return null;
  }
}

/**
 * Clear stored session (on logout)
 */
export function clearVoterSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear voter session:', error);
  }
}
