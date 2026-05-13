import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CheckCircle2, ArrowRight, Sparkles, Layout, Users, Rocket } from 'lucide-react';

const steps = [
  { id: 1, title: 'Account Ready', icon: CheckCircle2 },
  { id: 2, title: 'Workspace', icon: Layout },
  { id: 3, title: 'Usage', icon: Sparkles },
  { id: 4, title: 'Team', icon: Users },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState('');
  const [useCases, setUseCases] = useState<string[]>([]);
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => setStep(2), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (user && workspaceName === '') {
        setWorkspaceName(`${user.user_metadata?.display_name || 'My'}'s Workspace`);
    }
  }, [user]);

  const handleCreateWorkspace = async () => {
    if (workspaceName.length < 3) {
      toast.error('Workspace name must be at least 3 characters');
      return;
    }
    setStep(3);
  };

  const toggleUseCase = (useCase: string) => {
    setUseCases(prev => 
      prev.includes(useCase) ? prev.filter(u => u !== useCase) : [...prev, useCase]
    );
  };

  const handleFinish = async () => {
    if (useCases.length === 0) {
      toast.error('Please select at least one use case');
      return;
    }

    // Check if user is authenticated (not in guest mode)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    // Check if we are in guest mode from useAuth
    const isGuest = user?.app_metadata?.provider === 'guest';

    if (isGuest || authError || !authUser) {
      toast.error('Guest mode data is not saved to the cloud. Please sign up to create a workspace.');
      // For guests, we could still navigate to dashboard and show mocks
      if (isGuest) {
        navigate('/dashboard');
      }
      return;
    }

    setLoading(true);
    try {
      // 1. Create Workspace
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert([{ 
            name: workspaceName,
            user_id: authUser.id,
            icon: '🏠'
        }])
        .select()
        .single();

      if (wsError) {
        console.error('Workspace creation error:', wsError);
        if (wsError.code === '42501') {
          throw new Error('Database security policy prevented workspace creation. Please contact support.');
        }
        throw wsError;
      }

      // 2. Add as member
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert([{
            workspace_id: workspace.id,
            user_id: authUser.id,
            email: authUser.email || 'unknown@example.com',
            role: 'owner',
            invited_by: authUser.id,
            accepted_at: new Date().toISOString()
        }]);
      
      if (memberError) throw memberError;

      // 3. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
            onboarding_completed: true,
            bio: `Interested in: ${useCases.join(', ')}` 
        })
        .eq('user_id', authUser.id);

      if (profileError) throw profileError;

      toast.success('Workspace launched!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Progress Bar */}
        <div className="mb-12">
            <div className="flex justify-between mb-4">
                {steps.map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                            <s.icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>{s.title}</span>
                    </div>
                ))}
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / steps.length) * 100}%` }}
                    className="h-full bg-primary"
                />
            </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Account Created</h1>
              <p className="text-muted-foreground">Setting up your secure environment...</p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-3xl font-bold mb-2">Name your workspace</h1>
              <p className="text-muted-foreground mb-8">This is where all your projects, files, and AI chats will live.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Workspace Name</label>
                  <Input 
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Acme Projects"
                    className="h-12 text-lg"
                  />
                </div>
                <Button onClick={handleCreateWorkspace} className="w-full h-12 text-lg">
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-3xl font-bold mb-2">What's your focus?</h1>
              <p className="text-muted-foreground mb-8">Select how you'll use Kiden Hub to personalize your experience.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                {['Research', 'Writing', 'Design', 'Engineering', 'Personal Notes', 'Team Projects'].map((uc) => (
                  <button
                    key={uc}
                    onClick={() => toggleUseCase(uc)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${useCases.includes(uc) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <span className="font-bold">{uc}</span>
                  </button>
                ))}
              </div>
              
              <Button onClick={() => setStep(4)} className="w-full h-12 text-lg">
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-3xl font-bold mb-2">Invite your team</h1>
              <p className="text-muted-foreground mb-8">Collaborate on files and research boards together. (Optional)</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Team Member Emails</label>
                  <Input 
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="alex@example.com, sam@example.com"
                    className="h-12"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2">Separate with commas</p>
                </div>
                
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={handleFinish} disabled={loading} className="flex-1 h-12">
                        Skip
                    </Button>
                    <Button onClick={handleFinish} disabled={loading} className="flex-[2] h-12 bg-primary text-primary-foreground">
                        {loading ? 'Launching...' : 'Launch Workspace'} <Rocket className="ml-2 w-5 h-5" />
                    </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
