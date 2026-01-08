
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import kidenLogo from '@/assets/kiden-logo-green.jpg';
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, Sparkles, Smartphone, KeyRound } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().min(10, 'Phone must be at least 10 digits').regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

type AuthMode = 'password' | 'email-otp' | 'phone-otp';
type ViewState = 'sign-in' | 'verify-otp';

const Auth = () => {
  // Global State
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('password'); // password, email-otp, phone-otp
  const [viewState, setViewState] = useState<ViewState>('sign-in'); // sign-in, verify-otp
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpToken, setOtpToken] = useState('');

  // Hooks
  const { signIn, signUp, signInAsGuest, user, sendEmailOtp, sendPhoneOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        toast.error(emailResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        toast.error(passwordResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message.includes('Invalid login') ? 'Invalid email or password' : error.message);
        } else {
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      } else {
        const { data, error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error.message);
        } else {
          if (data?.session) {
            toast.success('Account created! Welcome to Kiden.');
            navigate('/dashboard');
          } else {
            toast.success('Account created! Please check your email.');
            setIsLogin(true);
          }
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'email-otp') {
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          toast.error(emailResult.error.errors[0].message);
          setLoading(false);
          return;
        }
        const { error } = await sendEmailOtp(email);
        if (error) throw error;
        toast.success(`Code sent to ${email}`);
      } else if (authMode === 'phone-otp') {
        const phoneResult = phoneSchema.safeParse(phone);
        if (!phoneResult.success) {
          toast.error(phoneResult.error.errors[0].message);
          setLoading(false);
          return;
        }
        const { error } = await sendPhoneOtp(phone);
        if (error) throw error;
        toast.success(`Code sent to ${phone}`);
      }
      setViewState('verify-otp');
    } catch (error) {
      toast.error((error as Error).message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (otpToken.length !== 6) {
        toast.error('Please enter a 6-digit code');
        setLoading(false);
        return;
      }

      const type = authMode === 'email-otp' ? 'magiclink' : 'sms'; // Defaulting email to magiclink/otp flow
      // Note: Standard Email OTP uses 'email' type usually in verifyOtp, or 'magiclink' if it was a link. 
      // supabase.auth.verifyOtp({ email, token, type: 'email'}) is for Email OTP.
      const verifyType = authMode === 'email-otp' ? 'email' : 'sms';

      const { error } = await verifyOtp(otpToken, verifyType, authMode === 'email-otp' ? email : undefined, authMode === 'phone-otp' ? phone : undefined);

      if (error) {
        toast.error(error.message || 'Invalid code');
      } else {
        toast.success('Verified successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden relative">

      {/* Mesh Gradient Background for Mobile / Subtle Overlay */}
      <div className="absolute inset-0 z-0 opacity-30 lg:hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

      {/* Left Panel - Hero / Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-zinc-900 border-r border-white/5">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#10b981,transparent)] opacity-20 blur-[100px]" />
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -left-1/2 w-[100%] h-[100%] border-[1px] border-white/5 rounded-full"
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <img src={kidenLogo} alt="Kiden" className="w-10 h-10 rounded-xl shadow-lg ring-1 ring-white/10" />
            <span className="text-xl font-bold tracking-tight text-white">Kiden Hub</span>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6"
          >
            Craft your <span className="text-emerald-400">perfect flow</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-400 text-lg leading-relaxed mb-8"
          >
            Experience a workspace that adapts to your mind. Manage tasks, habits, and knowledge in one unified, beautiful environment.
          </motion.p>

          <div className="flex gap-4">
            {[
              { label: "Focus Mode", icon: Sparkles },
              { label: "Smart Analytics", icon: CheckCircle2 },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
              >
                <f.icon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-zinc-200">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-zinc-500 text-sm">© 2026 Kiden Hub. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[400px]">

          {/* Header */}
          <div className="mb-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:hidden mx-auto mb-6 w-12 h-12 relative"
            >
              <img src={kidenLogo} alt="Logo" className="w-full h-full rounded-xl shadow-xl" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
            </motion.div>

            <motion.h2
              key={viewState}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl lg:text-3xl font-bold tracking-tight mb-2"
            >
              {viewState === 'verify-otp' ? 'Enter Code' : (isLogin ? 'Welcome back' : 'Create an account')}
            </motion.h2>
            <motion.p
              key={`${viewState}-sub`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              {viewState === 'verify-otp'
                ? `We sent a code to your ${authMode === 'email-otp' ? 'email' : 'phone'}.`
                : (isLogin ? 'Enter your details to access your workspace.' : 'Start your productivity journey today.')}
            </motion.p>
          </div>

          {/* Back Button for Verify State */}
          {viewState === 'verify-otp' && (
            <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary" onClick={() => setViewState('sign-in')}>
              ← Back to {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          )}

          {/* Auth Mode Tabs (Only visible in Sign In mode) */}
          {viewState === 'sign-in' && (
            <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-secondary/30 rounded-lg">
              {[
                { id: 'password', label: 'Password', icon: Lock },
                { id: 'email-otp', label: 'Email OTP', icon: Mail },
                { id: 'phone-otp', label: 'Phone', icon: Smartphone }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => { setAuthMode(mode.id as AuthMode); setIsLogin(true); }} // Force login mode for OTPs initially
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${authMode === mode.id
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">

            {/* Google Button (Only Password Mode) */}
            {viewState === 'sign-in' && authMode === 'password' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full h-12 font-medium bg-secondary/30 hover:bg-secondary/60 border-border/60 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground font-medium tracking-wider">Or with email</span>
                  </div>
                </div>
              </>
            )}

            {/* Main Form */}
            <form onSubmit={viewState === 'verify-otp' ? handleVerifyOtp : (authMode === 'password' ? handlePasswordSubmit : handleSendOtp)} className="space-y-4">

              {/* Sign Up Fields (Password Only) */}
              <AnimatePresence mode='popLayout'>
                {viewState === 'sign-in' && authMode === 'password' && !isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  >
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 h-11 bg-secondary/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Fields based on Mode */}
              <div className="space-y-4">

                {/* Email Input */}
                {viewState === 'sign-in' && (authMode === 'password' || authMode === 'email-otp') && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-secondary/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Phone Input */}
                {viewState === 'sign-in' && authMode === 'phone-otp' && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11 bg-secondary/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        placeholder="+1234567890"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Format: +[Country Code][Number]</p>
                  </div>
                )}

                {/* Password Input */}
                {viewState === 'sign-in' && authMode === 'password' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                      {isLogin && <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot?</a>}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11 bg-secondary/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* OTP Input */}
                {viewState === 'verify-otp' && (
                  <div className="flex justify-center py-4">
                    <InputOTP maxLength={6} value={otpToken} onChange={setOtpToken}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                          <InputOTPSlot key={idx} index={idx} className="h-12 w-12 text-lg border-border" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}

              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base mt-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    {viewState === 'verify-otp' ? 'Verify Code' : (
                      authMode === 'password' ? (isLogin ? 'Sign In' : 'Create Account') : 'Get Code'
                    )}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Guest Login */}
            {viewState === 'sign-in' && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => signInAsGuest()}
                className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
              >
                Continue as Guest
              </Button>
            )}

          </div>

          {/* Switch to Sign Up / Sign In (Password Mode Only) */}
          {viewState === 'sign-in' && authMode === 'password' && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-semibold text-emerald-600 outline-none focus:underline"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;