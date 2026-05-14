import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceProvider } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ActiveView } from '@/lib/types';
import AppSidebar from '@/components/app/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { PageLayout } from '@/components/ui/PageLayout';
import { motion } from 'framer-motion';
import { Users, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import DashboardHome from '@/components/features/dashboard/DashboardHome';
import FileStorage from '@/components/features/files/FileStorage';
import AIChat from '@/components/features/ai/AIChat';
import NotesEditor from '@/components/features/notes/NotesEditor';
import MyBoards from '@/components/features/boards/MyBoards';
import Collaborators from '@/components/features/team/Collaborators';
import Preferences from '@/components/features/settings/Preferences';

// Enhanced placeholder component for new features
const PlaceholderView = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <PageLayout className="flex flex-col items-center justify-center p-10 text-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 max-w-sm"
    >
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
        <Icon className="w-10 h-10 text-emerald-400" />
      </div>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{title}</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          We're currently perfecting the <span className="text-emerald-400/80 font-medium">{title}</span> module. 
          This high-performance workspace feature is scheduled for release in the next major update.
        </p>
      </div>
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Coming Soon · Phase 2.5
        </div>
      </div>
    </motion.div>
  </PageLayout>
);

const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  
  // Track fetch to prevent duplicate requests when tab regains focus
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes - don't refetch if done recently

  // 1. Sync URL -> State
  useEffect(() => {
    const path = location.pathname.split('/dashboard')[1]?.replace('/', '');
    if (path && path !== activeView) {
      setActiveView(path as ActiveView);
    } else if (!path && activeView !== 'dashboard') {
      setActiveView('dashboard');
    }
  }, [location.pathname]);

  // 2. Sync State -> URL + Auto-Collapse Logic
  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    
    // Auto-collapse for focus-heavy views
    if (view === 'chat' || view === 'notes' || view === 'boards') {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }

    const path = view === 'dashboard' ? '/dashboard' : `/dashboard/${view}`;
    navigate(path);
  };

  const fetchProfile = async () => {
    // Prevent duplicate requests
    if (fetchInProgressRef.current) return;
    
    // Don't refetch if we just fetched recently (tab was just in focus)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN) return;

    if (!user) return;
    
    fetchInProgressRef.current = true;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setProfile(data as unknown as Profile);
        lastFetchTimeRef.current = now;
        // Guard for onboarding
        if (!data.onboarding_completed) {
          navigate('/onboarding');
        }
      }
    } finally {
      fetchInProgressRef.current = false;
    }
  };

  useEffect(() => {
    // Only fetch if user just logged in (initial mount)
    if (user && !profile) {
      fetchProfile();
    }
  }, [user]);
  
  // Refetch profile only on explicit visibility change (tab regains focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab is now visible - but use cooldown to avoid rapid refetches
        fetchProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
        <div className="relative z-[60]">
          <AppSidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            profile={profile}
            onProfileUpdate={fetchProfile}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
          <div className={cn("flex-1 flex flex-col overflow-hidden", activeView !== 'dashboard' && "hidden")}>
            <DashboardHome onViewChange={handleViewChange} />
          </div>
          <div className={cn("flex-1 flex flex-col overflow-hidden", activeView !== 'files' && "hidden")}>
            <FileStorage />
          </div>
          <div className={cn("flex-1 flex flex-col overflow-hidden", activeView !== 'chat' && "hidden")}>
            <AIChat />
          </div>
          <div className={cn("flex-1 flex flex-col overflow-hidden", activeView !== 'notes' && "hidden")}>
            <NotesEditor />
          </div>
          <div className={cn("flex-1 flex flex-col overflow-hidden", activeView !== 'boards' && "hidden")}>
            <MyBoards />
          </div>
        </main>
      </div>
    </WorkspaceProvider>
  );
};

export default Dashboard;
