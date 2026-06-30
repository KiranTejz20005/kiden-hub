import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');

      if (!code) {
        setStatus('error');
        setError('No authorization code found');
        return;
      }

      try {
        // Call the Supabase Edge Function to exchange code for tokens
        const { error: functionError } = await supabase.functions.invoke('google-calendar-sync', {
          body: { 
            code, 
            redirect_uri: `${window.location.origin}/auth/callback/google` 
          }
        });

        if (functionError) throw functionError;

        setStatus('success');
        toast.success('Google Calendar connected successfully!');
        
        // Redirect back to calendar view after a short delay
        setTimeout(() => {
          navigate('/dashboard/calendar');
        }, 2000);

      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError(err.message || 'Failed to connect Google Calendar');
        toast.error('Connection failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 text-center relative z-10 backdrop-blur-xl shadow-2xl"
      >
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
          {status === 'loading' && <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
          {status === 'error' && <AlertCircle className="w-10 h-10 text-rose-500" />}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {status === 'loading' && 'Connecting to Google...'}
            {status === 'success' && 'Connection Successful!'}
            {status === 'error' && 'Connection Failed'}
          </h1>
          
          <p className="text-white/40 text-sm leading-relaxed">
            {status === 'loading' && 'Please wait while we finalize your secure connection with Google Calendar.'}
            {status === 'success' && 'Your schedule is now synced with Kiden Hub. Redirecting you back to your dashboard...'}
            {status === 'error' && (error || 'Something went wrong during the connection process.')}
          </p>
        </div>

        {status === 'error' && (
          <button 
            onClick={() => navigate('/dashboard/calendar')}
            className="mt-8 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
          >
            Try Again
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default GoogleCallback;
