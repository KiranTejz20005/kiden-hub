import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
  <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[var(--bg-1)]">
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-sm text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-3)] border border-white/[0.06] flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6 text-[var(--text-tertiary)]" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-medium text-[var(--text-primary)] tracking-tight">{title}</h1>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
          We're currently perfecting the <span className="text-[var(--text-primary)] font-medium">{title}</span> module. 
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-4)] border border-white/[0.04] text-[9px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] w-fit mx-auto">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
        Coming Soon
      </div>
    </motion.div>
  </div>
);

const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchBoards = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('research_boards' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setBoards(data);
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0]);
      }
    }
  }, [user, selectedBoard]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);
  
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

  const [resetCounter, setResetCounter] = useState(0);

  // 2. Sync State -> URL
  const handleViewChange = (view: ActiveView) => {
    if (view === activeView) {
      setResetCounter(prev => prev + 1);
    }
    
    setActiveView(view);
    
    const path = view === 'dashboard' ? '/dashboard' : `/dashboard/${view}`;
    navigate(path);
  };

  const fetchProfile = async (force = false) => {
    // Prevent duplicate requests
    if (fetchInProgressRef.current) return;
    
    // Don't refetch if we just fetched recently (tab was just in focus), unless forced
    const now = Date.now();
    if (!force && (now - lastFetchTimeRef.current < FETCH_COOLDOWN)) return;

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
            onProfileUpdate={() => fetchProfile(true)}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            boards={boards}
            selectedBoard={selectedBoard}
            onBoardSelect={(board) => {
              setSelectedBoard(board);
              handleViewChange('boards');
            }}
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
            <MyBoards 
              selectedBoard={selectedBoard} 
              onBoardSelect={setSelectedBoard}
              boards={boards}
              onBoardsUpdate={fetchBoards}
              resetCounter={resetCounter} 
            />
          </div>
        </main>
      </div>
    </WorkspaceProvider>
  );
};

export default Dashboard;
