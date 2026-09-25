import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceProvider } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ActiveView } from '@/lib/types';
import AppSidebar from '@/components/app/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useVisibility } from '@/components/providers/VisibilityManager';
import { useAppCache } from '@/components/providers/CacheProvider';
import { toast } from 'sonner';

import DashboardHome from '@/components/features/dashboard/DashboardHome';
import FileStorage from '@/components/features/files/FileStorage';
import AIChat from '@/components/features/ai/AIChat';
import NotesEditor from '@/components/features/notes/NotesEditor';
import MyBoards from '@/components/features/boards/MyBoards';
import KanbanView from '@/components/features/kanban/KanbanView';
import { SettingsModal } from '@/components/features/settings/SettingsModal';
import CalendarView from '@/components/features/calendar/CalendarView';
import FocusTimer from '@/components/features/focus/FocusTimer';
import HabitTracker from '@/components/features/habits/HabitTracker';
import { CommandPalette } from '@/components/app/CommandPalette';
import { SmartSearch } from '@/components/app/SmartSearch';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
  const { isStale } = useVisibility();
  const { get, set, invalidate } = useAppCache();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [createBoardIntent, setCreateBoardIntent] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchBoards = useCallback(async (options?: { force?: boolean }) => {
    if (!user) { return; }

    const cacheKey = `boards:${user.id}`;

    if (options?.force) {
      // Mutations (create/delete/template) must always hit the server,
      // otherwise a stale cache resurrects the board we just removed.
      invalidate(cacheKey);
    } else {
      const cached = get<any[]>(cacheKey);
      if (cached && cached.length > 0) {
        setBoards(cached);
        setSelectedBoard((curr: any) => curr || cached[0]);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('research_boards' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) { throw error; }

      setBoards(data ?? []);
      set(cacheKey, data ?? []); // 5m TTL
      setSelectedBoard((curr: any) => {
        if (curr && data && data.some((b: any) => b.id === curr.id)) return curr;
        return data && data.length > 0 ? data[0] : null;
      });
    } catch (err) {
      console.error('[Dashboard] Error fetching boards:', err);
      if (options?.force) {
        toast.error('Failed to refresh boards');
      }
    }
  }, [user, get, set, invalidate]);

  const addBoardOptimistically = useCallback((newBoard: any) => {
    setBoards(prev => [newBoard, ...prev]);
    setSelectedBoard(newBoard);
  }, []);

  // 1. Sync URL -> State (Robust derivation)
  useEffect(() => {
    const match = location.pathname.match(/^\/dashboard(?:\/([a-zA-Z0-9_-]+))?\/?$/);
    const subRoute = (match ? match[1] : undefined) || 'dashboard';
    const validViews: ActiveView[] = ['dashboard', 'files', 'chat', 'notes', 'kanban', 'boards', 'calendar', 'focus', 'habits', 'team', 'settings', 'discover', 'custom-ai', 'publish'];

    if (validViews.includes(subRoute as ActiveView)) {
      if (subRoute !== activeView) {
        setActiveView(subRoute as ActiveView);
      }
    } else {
      if (activeView !== 'dashboard') {
        setActiveView('dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [location.pathname, navigate, activeView]);

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
    if (!user) { return; }

    // Layer 4: Check cache first
    const profileCacheKey = `profile:${user.id}`;
    const boardsCacheKey = `boards:${user.id}`;

    const cachedProfile = get<Profile>(profileCacheKey);
    const cachedBoards = get<any[]>(boardsCacheKey);

    if (cachedProfile) {
      setProfile(cachedProfile);
      if (cachedBoards && cachedBoards.length > 0) {
        setBoards(cachedBoards);
        setSelectedBoard((curr: any) => curr || cachedBoards[0]);
      }
      setIsInitialLoading(false);
      return;
    }

    // Only show full-screen initializing loader if there's no profile at all yet
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
        setSelectedBoard((curr: any) => {
          if (curr && boardsRes.data.some((b: any) => b.id === curr.id)) return curr;
          return boardsRes.data.length > 0 ? boardsRes.data[0] : null;
        });
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [user, navigate, get, set]);

  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user, initializeData]);

  // Global keyboard shortcuts for palette and search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); };
  }, []);

  // Layer 1: Centralized Visibility-based silent revalidation (does NOT unmount the Dashboard)
  useEffect(() => {
    if (isStale && user?.id) {
      console.log('[Dashboard] Silently revalidating stale data on tab return...');
      invalidate(`boards:${user.id}`);
      fetchBoards();
    }
  }, [isStale, user?.id, invalidate, fetchBoards]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#181818] gap-4">
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
        <div className="relative z-[60] transition-all duration-300">
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
            onBoardsUpdate={() => { void fetchBoards({ force: true }); }}
            onCreateBoard={() => { setCreateBoardIntent(true); }}
          />
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
          {activeView === 'dashboard' && (
            <DashboardHome profile={profile} onViewChange={handleViewChange} />
          )}
          {(activeView === 'files' || activeView === 'discover') && (
            <FileStorage />
          )}
          {(activeView === 'chat' || activeView === 'custom-ai') && (
            <AIChat />
          )}
          {(activeView === 'notes' || activeView === 'publish') && (
            <NotesEditor />
          )}
          {activeView === 'boards' && (
            <MyBoards 
              selectedBoard={selectedBoard} 
              onBoardSelect={setSelectedBoard}
              boards={boards}
              onBoardsUpdate={() => { void fetchBoards({ force: true }); }}
              onBoardCreateOptimistic={addBoardOptimistically}
              createBoardIntent={createBoardIntent}
              onCreateBoardHandled={() => { setCreateBoardIntent(false); }}
              resetCounter={resetCounter} 
            />
          )}
          {activeView === 'calendar' && (
            <CalendarView />
          )}
          {activeView === 'focus' && (
            <FocusTimer 
              profile={profile}
              onExitFocus={() => handleViewChange('dashboard')}
            />
          )}
          {activeView === 'habits' && (
            <HabitTracker />
          )}
          {activeView === 'kanban' && (
            <KanbanView onBoardsChange={() => { void fetchBoards({ force: true }); }} />
          )}
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => { setIsSettingsOpen(false); }} 
        profile={profile}
        onProfileUpdate={initializeData}
      />

      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        onViewChange={handleViewChange}
        onSignOut={signOut}
      />

      <SmartSearch
        isOpen={isSearchOpen}
        onClose={() => { setIsSearchOpen(false); }}
        onNavigate={handleViewChange}
      />
    </WorkspaceProvider>
  );
};

export default Dashboard;
