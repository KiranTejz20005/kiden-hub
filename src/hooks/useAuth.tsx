import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session, VerifyOtpParams } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<{ error: AuthError | null }>;
  sendPhoneOtp: (phone: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (token: string, type: 'email' | 'sms', email?: string, phone?: string) => Promise<{ data: { session: Session | null; user: User | null } | null; error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!email || !password) {
      return { data: null, error: new Error('Email and password are required') as AuthError };
    }
    if (password.length < 6) {
      return { data: null, error: new Error('Password must be at least 6 characters') as AuthError };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0].trim(),
        },
      },
    });
    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      return { error: new Error('Email and password are required') as AuthError };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!isGuest) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Sign out error:', error.message);
      }
    }
    setUser(null);
    setSession(null);
    setIsGuest(false);
  }, [isGuest]);

  const signInAsGuest = useCallback(async () => {
    const guestId = crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

    const now = new Date().toISOString();
    const guestUser: User = {
      id: guestId,
      app_metadata: { provider: 'guest' },
      user_metadata: { display_name: 'Guest User' },
      aud: 'authenticated',
      created_at: now,
      email: 'guest@example.com',
      phone: '',
      confirmed_at: now,
      email_confirmed_at: now,
      phone_confirmed_at: '',
      last_sign_in_at: now,
      role: 'authenticated',
      updated_at: now,
      factors: [] as any[],
      identities: [],
      banned_until: null,
      is_anonymous: true,
    };

    const guestSession: Session = {
      access_token: 'guest_token',
      refresh_token: 'guest_refresh',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: guestUser,
      provider_token: null,
      provider_refresh_token: null,
    };

    setUser(guestUser);
    setSession(guestSession);
    setIsGuest(true);
  }, []);

  const sendEmailOtp = useCallback(async (email: string) => {
    if (!email) {
      return { error: new Error('Email is required') as AuthError };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
      }
    });
    return { error };
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    if (!phone) {
      return { error: new Error('Phone number is required') as AuthError };
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    });
    return { error };
  }, []);

  const verifyOtp = useCallback(async (token: string, _type: 'email' | 'sms', email?: string, phone?: string) => {
    if (!token) {
      return { data: null, error: new Error('Verification token is required') as AuthError };
    }

    let params: VerifyOtpParams;
    if (email) {
      params = { email: email.trim().toLowerCase(), token: token.trim(), type: 'email' };
    } else if (phone) {
      params = { phone: phone.trim(), token: token.trim(), type: 'sms' };
    } else {
      return { data: null, error: new Error('Email or phone required for verification') as AuthError };
    }

    const { data, error } = await supabase.auth.verifyOtp(params);
    return { data, error };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isGuest,
      signUp,
      signIn,
      signOut,
      signInAsGuest,
      sendEmailOtp,
      sendPhoneOtp,
      verifyOtp
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};