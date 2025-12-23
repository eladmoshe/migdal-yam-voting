import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSession, onAuthStateChange, checkIsAdmin } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCheckingAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    getSession().then((session) => {
      setSession(session);
      setIsLoading(false);

      // Check if user is admin
      if (session?.user) {
        setIsCheckingAdmin(true);
        checkIsAdmin(session.user.id).then((isAdmin) => {
          setIsAdmin(isAdmin);
          setIsCheckingAdmin(false);
        });
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        setIsCheckingAdmin(true);
        checkIsAdmin(session.user.id).then((isAdmin) => {
          setIsAdmin(isAdmin);
          setIsCheckingAdmin(false);
        });
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        isLoading,
        isAdmin,
        isCheckingAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
