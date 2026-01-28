import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { WorkspaceProvider } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ActiveView } from '@/lib/types';
import AppSidebar from '@/components/app/AppSidebar';
import { format } from 'date-fns';
import { Play, Zap, CheckCircle2, Droplets } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// --- View Components ---
import IdeaBar from '@/components/features/notes/IdeaBar';
import AIChat from '@/components/features/ai/AIChat';
import Notebook from '@/components/features/notes/Notebook';
import FocusMode from '@/components/features/focus/FocusMode';
import { ProjectList } from '@/components/features/projects/ProjectList';
import { TaskBoard } from '@/components/features/tasks/TaskBoard';
import { Journal } from '@/components/features/journal/Journal';
import { BookTracker } from '@/components/features/books/BookTracker';
import { HabitTracker } from '@/components/features/habits/HabitTracker';
import LeetCodeTracker from '@/components/features/leetcode/LeetCodeTracker';
import { AnalyticsDashboard } from '@/components/features/analytics/AnalyticsDashboard';

// --- Widget Components ---
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { UpcomingTasks, TaskItem } from '@/components/dashboard/UpcomingTasks';
import { SkillTracker } from '@/components/dashboard/SkillTracker';

import { PageLayout } from '@/components/ui/PageLayout';

const TASKS_STORAGE_KEY = 'kiden_guest_tasks';

// --- Main Dashboard View ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MainDashboardView = ({ user, profile, setActiveView }: { user: any, profile: Profile | null, setActiveView: (v: ActiveView) => void }) => {
  const [stats, setStats] = useState({
    productivity: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    waterIntake: 0,
    waterGoal: 2.5
  });

  /* Removed duplicate tasks state - Fixed */
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [gridData, setGridData] = useState<Record<string, number>>({});
  const [lcStats, setLcStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0, rank: 0 });

  useEffect(() => {
    const fetchData = async () => {
      // 1. Tasks from localStorage
      try {
        const stored = localStorage.getItem(TASKS_STORAGE_KEY);
        if (stored) {
          const parsedTasks = JSON.parse(stored);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedTasks: TaskItem[] = parsedTasks.map((t: any) => ({
            id: t.id,
            title: t.title || 'Untitled',
            completed: t.status === 'completed' || t.status === 'done',
            tag: t.project_id ? 'Project' : 'Daily',
            priority: t.priority || 'medium'
          }));

          const doneT = mappedTasks.filter(t => t.completed).length;
          const totalT = mappedTasks.length;

          setTasks(mappedTasks.slice(0, 50));
          setStats(prev => ({
            ...prev,
            tasksCompleted: doneT,
            tasksTotal: totalT,
            productivity: totalT > 0 ? Math.round((doneT / totalT) * 100) : 0
          }));

          // Build heatmap from tasks
          const counts: Record<string, number> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          parsedTasks.filter((t: any) => t.status === 'done' || t.status === 'completed').forEach((t: any) => {
            if (t.updated_at) {
              const d = format(new Date(t.updated_at), 'yyyy-MM-dd');
              counts[d] = (counts[d] || 0) + 1;
            }
          });
          setGridData(counts);
        }
      } catch (e) {
        console.error('Failed to load tasks', e);
      }

      // 2. LeetCode (from database if user exists)
      if (user) {
        const { data: lc } = await supabase.from('leetcode_problems').select('*').eq('user_id', user.id).eq('status', 'solved');
        if (lc) {
          let e = 0, m = 0, h = 0;
          lc.forEach(p => {
            if (p.difficulty === 'Easy') e++;
            else if (p.difficulty === 'Medium') m++;
            else if (p.difficulty === 'Hard') h++;
          });
          setLcStats({ easy: e, medium: m, hard: h, total: e + m + h, rank: 0 });
        }
      }
    };

    fetchData();
  }, [user]);

  const handleToggle = async (id: string, status: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: status } : t));

    // Update localStorage
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      if (stored) {
        const allTasks = JSON.parse(stored);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated = allTasks.map((t: any) =>
          t.id === id ? { ...t, status: status ? 'done' : 'todo', updated_at: new Date().toISOString() } : t
        );
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to update task', e);
    }
  };

  return (
    <PageLayout scrollable className="p-4 sm:p-6 lg:p-10">
      <header className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-8 lg:mt-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Welcome back, {profile?.display_name?.split(' ')[0] || 'Guest'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="text-xs sm:text-sm font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
            {format(new Date(), 'MMMM dd, yyyy')}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatsCard
            label="Productivity" value={`${stats.productivity}%`} subValue="Target 80%"
            icon={Zap} color="blue" progress={stats.productivity} delay={0.1}
            change="5%" trend="up"
          />
          <StatsCard
            label="Tasks Done" value={stats.tasksCompleted.toString()} subValue={`${stats.tasksTotal} Total`}
            icon={CheckCircle2} color="purple" progress={(stats.tasksCompleted / stats.tasksTotal) * 100 || 0} delay={0.15}
          />
          <StatsCard
            label="Water Intake" value={`${stats.waterIntake}L`} subValue={`${stats.waterGoal}L Goal`}
            icon={Droplets} color="cyan" progress={(stats.waterIntake / stats.waterGoal) * 100} delay={0.2}
          />
          <button
            onClick={() => setActiveView('focus' as ActiveView)}
            className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-6 flex flex-col justify-between group hover:shadow-2xl hover:shadow-emerald-500/20 transition-all border border-emerald-400/20 min-h-[140px]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-white">Focus Mode</h3>
              <p className="text-emerald-100 text-sm">Start a deep work session</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 min-h-[300px] h-[300px]">
            <ActivityHeatmap data={gridData} />
          </div>
          <div className="lg:col-span-1 h-[300px]">
            <SkillTracker stats={lcStats} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 min-h-[400px]">
          <div className="h-[450px]">
            <UpcomingTasks tasks={tasks} onToggle={handleToggle} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};



// --- Page Wrapper ---
const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>('command');
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // 1. Connection Check
  useEffect(() => {
    const checkConnection = async () => {
      // Simple lightweight query to check connection
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        console.error('Supabase Connection Error:', error);
        toast.error('Database connection failed. Check console for details.');
      }
    };
    checkConnection();
  }, []);

  // 2. Sync URL -> State (On Mount & PopState)
  useEffect(() => {
    const path = location.pathname.split('/dashboard')[1]?.replace('/', '');
    // Mapping URL segment to View
    if (path && path !== activeView) {
      // Validate it's a known view, otherwise default to command
      // Simplified check: Just set it. The switch case handles unknowns.
      setActiveView(path as ActiveView);
    } else if (!path && activeView !== 'command') {
      setActiveView('command');
    }
  }, [location.pathname]);

  // 3. Sync State -> URL (When user clicks)
  const handleViewChange = (view: ActiveView) => {
    setActiveView(view);
    const path = view === 'command' ? '/dashboard' : `/dashboard/${view}`;
    navigate(path);
  };

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      // Mock profile if not found
      setProfile({
        id: user.id,
        user_id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Attempt to load real profile from Supabase
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) setProfile(data as unknown as Profile);
    };
    fetchProfile();
  }, [user]);

  // View Switching Logic
  const CurrentView = useMemo(() => {
    if (activeView === 'command') return <MainDashboardView user={user} profile={profile} setActiveView={handleViewChange} />;

    const views: Record<string, JSX.Element> = {
      analytics: <AnalyticsDashboard />,
      tasks: <TaskBoard />,
      projects: <ProjectList />,
      ideas: <IdeaBar />,
      chat: <AIChat />,
      notebook: <Notebook />,
      journal: <Journal />,
      books: <BookTracker />,
      habits: <HabitTracker />,
      leetcode: <LeetCodeTracker />,
      focus: <FocusMode onComplete={() => handleViewChange('command')} />,
    };

    // settings usually is a modal or sidebar panel, but if mapped here:
    // settings: <SettingsView />

    return views[activeView] || <div className="p-8 text-white">View Not Found</div>;
  }, [activeView, user, profile]);



  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
        <div className="relative z-[60]">
          <AppSidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            profile={profile}
            onProfileUpdate={() => { }}
          />
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
          {CurrentView}
        </main>
      </div>
    </WorkspaceProvider>
  );
};

export default Dashboard;
