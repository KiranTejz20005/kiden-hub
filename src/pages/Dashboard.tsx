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
import { useVisibility } from '@/components/providers/VisibilityManager';
import { useAppCache } from '@/components/providers/CacheProvider';

import DashboardHome from '@/components/features/dashboard/DashboardHome';
import FileStorage from '@/components/features/files/FileStorage';
import AIChat from '@/components/features/ai/AIChat';
import NotesEditor from '@/components/features/notes/NotesEditor';
import MyBoards from '@/components/features/boards/MyBoards';
import Collaborators from '@/components/features/team/Collaborators';
import Preferences from '@/components/features/settings/Preferences';
import { SettingsModal } from '@/components/features/settings/SettingsModal';

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
  const { isStale } = useVisibility();
  const { get, set, invalidate } = useAppCache();
  const [activeNote, setActiveNote] = useState<any | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);



  const navigate = useNavigate();
  const location = useLocation();

  const fetchBoards = useCallback(async () => {
    if (!user) return;
    
    // Layer 4: Check cache
    const cacheKey = `boards:${user.id}`;
    const cached = get<any[]>(cacheKey);
    if (cached) {
      setBoards(cached);
      if (cached.length > 0 && !selectedBoard) setSelectedBoard(cached[0]);
      return;
    }

    const { data } = await supabase
      .from('research_boards' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setBoards(data);
      set(cacheKey, data); // 5m TTL
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0]);
      }
    }
  }, [user, selectedBoard, get, set]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);
  
  // Track fetch to prevent duplicate requests when tab regains focus
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes - don't refetch if done recently

  // 1. Sync URL -> State (Robust derivation)
  useEffect(() => {
    const path = location.pathname.split('/dashboard')[1]?.replace('/', '');
    const validViews: ActiveView[] = ['dashboard', 'files', 'chat', 'notes', 'boards', 'team', 'settings'];
    
    if (path && validViews.includes(path as ActiveView)) {
      if (path !== activeView) setActiveView(path as ActiveView);
    } else if (!path || !validViews.includes(path as ActiveView)) {
      // Fallback for invalid or empty sub-routes
      if (activeView !== 'dashboard') {
        setActiveView('dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const [resetCounter, setResetCounter] = useState(0);

  // 2. Sync State -> URL
  const handleViewChange = (view: ActiveView) => {
    if (view === 'settings') {
      setIsSettingsOpen(true);
      return;
    }

    if (view === activeView) {
      setResetCounter(prev => prev + 1);
    }
    
    setActiveView(view);
    const path = view === 'dashboard' ? '/dashboard' : `/dashboard/${view}`;
    navigate(path);
  };

   const initializeData = useCallback(async () => {
    if (!user) return;
    
    // Layer 4: Check cache first
    const profileCacheKey = `profile:${user.id}`;
    const boardsCacheKey = `boards:${user.id}`;
    
    const cachedProfile = get<Profile>(profileCacheKey);
    const cachedBoards = get<any[]>(boardsCacheKey);

    if (cachedProfile && cachedBoards) {
      setProfile(cachedProfile);
      setBoards(cachedBoards);
      if (cachedBoards.length > 0 && !selectedBoard) setSelectedBoard(cachedBoards[0]);
      setIsInitialLoading(false);
      return;
    }

    setIsInitialLoading(true);
    try {
      const [profileRes, boardsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('research_boards' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (profileRes.data) {
        const profileData = profileRes.data as unknown as Profile;
        setProfile(profileData);
        set(profileCacheKey, profileData, 30 * 60 * 1000); // 30m TTL for profile
        if (!profileRes.data.onboarding_completed) {
          navigate('/onboarding');
        }
      }

      if (boardsRes.data) {
        setBoards(boardsRes.data);
        set(boardsCacheKey, boardsRes.data); // Default 5m TTL
        if (boardsRes.data.length > 0 && !selectedBoard) {
          setSelectedBoard(boardsRes.data[0]);
        }
      }
      
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [user, navigate, selectedBoard, get, set]);

  useEffect(() => {
    if (user) initializeData();
  }, [user]);
  
  // Layer 1: Centralized Visibility-based revalidation
  useEffect(() => {
    if (isStale) {
      console.log('[Dashboard] Revalidating stale data on tab return...');
      // Only invalidate the board items, profile is longer TTL
      invalidate(`boards:${user?.id}`);
      initializeData();
    }
  }, [isStale, user?.id, invalidate, initializeData]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
          <div className="w-4 h-4 bg-white rounded-full animate-ping" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse">Initializing Hub</p>
      </div>
    );
  }

  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
        <div className="relative z-[60]">
          <AppSidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            profile={profile}
            onProfileUpdate={initializeData}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            boards={boards}
            selectedBoard={selectedBoard}
            onBoardSelect={(board) => {
              setSelectedBoard(board);
              handleViewChange('boards');
            }}
            onBoardsUpdate={fetchBoards}
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

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        profile={profile}
        onProfileUpdate={initializeData}
      />
    </WorkspaceProvider>
  );
};

export default Dashboard;
