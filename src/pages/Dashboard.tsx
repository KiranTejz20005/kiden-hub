import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceProvider } from '@/hooks/useWorkspace';
import { SpotifyProvider } from '@/hooks/useSpotify';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ActiveView } from '@/lib/types';
import AppSidebar from '@/components/app/AppSidebar';
import { format, subDays } from 'date-fns';
import { Play, Zap, CheckCircle2, Droplets } from 'lucide-react';

// --- View Components ---
// --- View Components ---
import CommandCenter from '@/components/features/dashboard/CommandCenter';
import IdeaBar from '@/components/features/notes/IdeaBar';
import VoiceLink from '@/components/features/media/VoiceLink';
import AIChat from '@/components/features/ai/AIChat';
import Notebook from '@/components/features/notes/Notebook';
import FocusMode from '@/components/features/focus/FocusMode';
import Templates from '@/components/features/notes/Templates';
import { ProjectList } from '@/components/features/projects/ProjectList';
import { TaskBoard } from '@/components/features/tasks/TaskBoard';
import { Journal } from '@/components/features/journal/Journal';
import { BookTracker } from '@/components/features/books/BookTracker';
import { HabitTracker } from '@/components/features/habits/HabitTracker';
import { SpotifyPlayer } from '@/components/features/media/SpotifyPlayer';
import LeetCodeTracker from '@/components/features/leetcode/LeetCodeTracker';
import { NewYearResolutions } from '@/components/features/resolutions/NewYearResolutions';
import { AnalyticsDashboard } from '@/components/features/analytics/AnalyticsDashboard';

// --- Widget Components ---
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { DashboardMusic } from '@/components/dashboard/DashboardMusic';
import { UpcomingTasks, TaskItem } from '@/components/dashboard/UpcomingTasks';
import { SkillTracker } from '@/components/dashboard/SkillTracker';

// --- Main Dashboard View (Rewritten from scratch) ---
import { User } from '@supabase/supabase-js';

const MainDashboardView = ({ user, profile, setActiveView }: { user: User, profile: Profile | null, setActiveView: (v: ActiveView) => void }) => {
  const [stats, setStats] = useState({
    productivity: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    waterIntake: 1.2, // Placeholder
    waterGoal: 2.5
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [gridData, setGridData] = useState<Record<string, number>>({});
  const [lcStats, setLcStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0, rank: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // 1. Fetch Today's Tasks & Calc Stats
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Fetch enough to filter

      if (todayTasks) {
        // Map to UI model
        const mappedTasks: TaskItem[] = todayTasks.map(t => ({
          id: t.id,
          title: t.title,
          completed: t.status === 'completed',
          tag: t.project_id ? 'Project' : 'Daily', // Simplified
          priority: t.priority as 'low' | 'medium' | 'high'
        }));

        const activeT = mappedTasks.filter(t => !t.completed).length; // Pending
        const doneT = mappedTasks.filter(t => t.completed).length;    // Done today (simplified logic)
        const totalT = mappedTasks.length;

        setTasks(mappedTasks.filter(t => !t.completed || isRecent(t.id))); // Show pending + recently done? Or just all today's? 
        // Let's show filtered list: PENDING + Done Today
        // Ideally we'd separate queries but for now this works on limited set.
        setTasks(mappedTasks); // Pass all, component sorts them

        setStats(prev => ({
          ...prev,
          tasksCompleted: doneT,
          tasksTotal: totalT,
          productivity: totalT > 0 ? Math.round((doneT / totalT) * 100) : 0
        }));
      }

      // 2. Heatmap Data (Activity over last ~5 months)
      const { data: activity } = await supabase
        .from('tasks')
        .select('updated_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('updated_at', subDays(new Date(), 150).toISOString());

      if (activity) {
        const counts: Record<string, number> = {};
        activity.forEach(a => {
          const d = format(new Date(a.updated_at), 'yyyy-MM-dd');
          counts[d] = (counts[d] || 0) + 1;
        });
        setGridData(counts);
      }

      // 3. LeetCode Stats
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
    };

    fetchData();

    // Realtime
    const ch = supabase.channel('dash_main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(ch); }
  }, [user]);

  // Helper: isRecent (placeholder log)
  const isRecent = (_id: string) => true;

  // Task Toggle Handler
  const handleToggle = async (id: string, status: boolean) => {
    // Optimistic
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: status } : t));
    const dbStatus = status ? 'completed' : 'todo';
    await supabase.from('tasks').update({ status: dbStatus, updated_at: new Date().toISOString() }).eq('id', id);
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 mx-auto w-full max-w-[1920px] overflow-y-auto bg-background">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="mt-12 md:mt-0">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back, {profile?.display_name?.split(' ')[0] || 'Kaiden'}
          </h1>
          <p className="text-gray-400 mt-1">Here's what's happening in your workspace today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-500 bg-[#161B22] border border-white/5 px-3 py-1.5 rounded-lg">
            {format(new Date(), 'MMMM dd, yyyy')}
          </span>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="flex flex-col gap-6">

        {/* 1. Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          {/* Quick Action Button as 4th card */}
          <button
            onClick={() => setActiveView('focus')}
            className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 flex flex-col justify-between group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all border border-indigo-400/20"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-white">Focus Mode</h3>
              <p className="text-indigo-200 text-sm">Start a deep work session</p>
            </div>
          </button>
        </div>

        {/* 2. Heatmap & Music */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[300px]">
          <div className="lg:col-span-2 h-[300px] lg:h-full">
            <ActivityHeatmap data={gridData} />
          </div>
          <div className="lg:col-span-1 h-[240px] lg:h-full">
            <DashboardMusic />
          </div>
        </div>

        {/* 3. Tasks & Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto min-h-[400px]">
          <div className="lg:col-span-2 h-[450px]">
            <UpcomingTasks tasks={tasks} onToggle={handleToggle} />
          </div>
          <div className="lg:col-span-1 h-auto lg:h-[450px]">
            <SkillTracker stats={lcStats} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Page Wrapper ---
const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>('command');
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (data) setProfile(data as unknown as Profile);
    };
    fetchProfile();
  }, [user]);

  // View Switching Logic
  const CurrentView = useMemo(() => {
    // If Dashboard is active, show our new MainDashboardView
    if (activeView === 'command') return <MainDashboardView user={user} profile={profile} setActiveView={setActiveView} />;

    const views: Record<string, JSX.Element> = {
      analytics: <AnalyticsDashboard />,
      tasks: <TaskBoard />,
      projects: <ProjectList />,
      ideas: <IdeaBar />,
      voice: <VoiceLink />,
      chat: <AIChat />,
      notebook: <Notebook />,
      journal: <Journal />,
      books: <BookTracker />,
      habits: <HabitTracker />,
      spotify: <SpotifyPlayer />,
      leetcode: <LeetCodeTracker />,
      resolutions: <NewYearResolutions />,
      focus: <FocusMode onComplete={() => console.log('Focus session completed')} />,
      templates: <Templates />
    };

    return views[activeView] || <div className="p-8 text-white">View Not Found</div>;
  }, [activeView, user, profile]);

  return (
    <WorkspaceProvider>
      <SpotifyProvider>
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
          <AppSidebar
            activeView={activeView}
            onViewChange={setActiveView}
            profile={profile}
            onProfileUpdate={() => { }}
          />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {CurrentView}
          </main>
        </div>
      </SpotifyProvider>
    </WorkspaceProvider>
  );
};

export default Dashboard;
