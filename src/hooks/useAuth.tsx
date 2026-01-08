import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, VerifyOtpParams } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<{ error: Error | null }>;
  sendPhoneOtp: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (token: string, type: 'email' | 'sms', email?: string, phone?: string) => Promise<{ data: { session: Session | null; user: User | null } | null; error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    return { data, error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const signInAsGuest = async () => {
    // Create a deterministic guest ID based on local storage or random if not present
    const guestId = `guest-${Math.random().toString(36).substr(2, 9)}`;
    const guestUser = {
      id: guestId,
      app_metadata: { provider: 'guest' },
      user_metadata: { display_name: 'Guest User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'guest@example.com',
      phone: '',
      confirmed_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      phone_confirmed_at: '',
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as unknown as User;

    setUser(guestUser);
    setSession({
      access_token: 'guest_token',
      refresh_token: 'guest_refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: guestUser
    } as Session);
  };

  const sendEmailOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      }
    });
    return { error: error as Error | null };
  };

  const sendPhoneOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { error: error as Error | null };
  };

  const verifyOtp = async (token: string, type: 'email' | 'sms', email?: string, phone?: string) => {
    try {
      let params: VerifyOtpParams;

      if (email) {
        // Standard OTP verification for email
        params = { email, token, type: 'email' };
      } else if (phone) {
        // Standard OTP verification for phone (sms)
        params = { phone, token, type: 'sms' };
      } else {
        return { data: null, error: new Error("Email or Phone required for verification") };
      }

      const { data, error } = await supabase.auth.verifyOtp(params);
      return { data, error: error as Error | null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
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