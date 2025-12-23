import { supabase } from '../config/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { logClientEvent } from './api';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign in admin with email and password
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Log the login attempt (success or failure)
  // Note: We log after the attempt so we can capture the result
  if (data.user) {
    // Successful login - log with user context
    await logClientEvent(
      'admin_login_success',
      'auth',
      null,
      true,
      null,
      { email }
    );
  } else {
    // Failed login - log without user context (anonymous)
    // This is logged via the anon role since no user is authenticated
    await logClientEvent(
      'admin_login_failed',
      'auth',
      null,
      false,
      error?.message ?? 'Login failed',
      { email }
    );
  }

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign out the current admin user
 */
export async function adminLogout(): Promise<{ error: AuthError | null }> {
  // Log before signing out (while we still have user context)
  await logClientEvent(
    'admin_logout',
    'auth',
    null,
    true,
    null,
    null
  );

  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get the current user
 */
export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Check if user is an admin (has entry in admin_roles table)
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}
