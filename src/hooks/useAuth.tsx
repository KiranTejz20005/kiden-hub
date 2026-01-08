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
  verifyOtp: (token: string, type: 'email' | 'sms' | 'signup' | 'recovery' | 'invite' | 'magiclink', email?: string, phone?: string) => Promise<{ data: { session: Session | null; user: User | null } | null; error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (mounted) {
              setSession(session);
              setUser(session?.user ?? null);
              setLoading(false);
            }
          }
        );

        // THEN check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
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
    const guestUser = {
      id: `guest-${Math.random().toString(36).substr(2, 9)}`,
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
        shouldCreateUser: false, // Only for existing users, typically? Or true if you want signup via OTP. 
        // For now, let's assume default behaviour or let it create user if user wants to signup via OTP.
        // Actually for pure "2 factor" style login we might assume account exists, but for ease of use we default to true (default).
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

  const verifyOtp = async (token: string, type: 'email' | 'sms' | 'signup' | 'recovery' | 'invite' | 'magiclink', email?: string, phone?: string) => {
    let params: VerifyOtpParams;
    if (email) {
      params = { email, token, type } as VerifyOtpParams;
    } else if (phone) {
      params = { phone, token, type } as VerifyOtpParams;
    } else {
      return { data: null, error: new Error("Email or Phone required for verification") };
    }

    const { data, error } = await supabase.auth.verifyOtp(params);
    return { data, error: error as Error | null };
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