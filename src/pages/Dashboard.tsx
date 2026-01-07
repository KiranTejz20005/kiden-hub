import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WorkspaceProvider } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ActiveView } from '@/lib/types';
import AppSidebar from '@/components/app/AppSidebar';
import { format, subDays } from 'date-fns';
import { Play, Zap, CheckCircle2, Droplets, Menu } from 'lucide-react';

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

import { User } from '@supabase/supabase-js';
import { PageLayout } from '@/components/ui/PageLayout';

// --- Main Dashboard View ---
const MainDashboardView = ({ user, profile, setActiveView }: { user: User | null, profile: Profile | null, setActiveView: (v: ActiveView) => void }) => {
  const [stats, setStats] = useState({
    productivity: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    waterIntake: 0,
    waterGoal: 2.5
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [gridData, setGridData] = useState<Record<string, number>>({});
  const [lcStats, setLcStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0, rank: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // 1. Tasks
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (todayTasks) {
        const mappedTasks: TaskItem[] = todayTasks.map(t => ({
          id: t.id,
          title: t.title,
          completed: t.status === 'completed' || t.status === 'done',
          tag: t.project_id ? 'Project' : 'Daily',
          priority: (t.priority as 'low' | 'medium' | 'high') || 'medium'
        }));

        const doneT = mappedTasks.filter(t => t.completed).length;
        const totalT = mappedTasks.length;

        setTasks(mappedTasks);
        setStats(prev => ({
          ...prev,
          tasksCompleted: doneT,
          tasksTotal: totalT,
          productivity: totalT > 0 ? Math.round((doneT / totalT) * 100) : 0
        }));
      }

      // 2. Heatmap
      const { data: activity } = await supabase
        .from('tasks')
        .select('updated_at')
        .eq('user_id', user.id)
        .or('status.eq.completed,status.eq.done')
        .gte('updated_at', subDays(new Date(), 150).toISOString());

      if (activity) {
        const counts: Record<string, number> = {};
        activity.forEach(a => {
          const d = format(new Date(a.updated_at), 'yyyy-MM-dd');
          counts[d] = (counts[d] || 0) + 1;
        });
        setGridData(counts);
      }

      // 3. LeetCode
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

      // 4. Water
      const { data: waterHabit } = await supabase.from('habits').select('id, goal').eq('user_id', user.id).eq('name', 'Drink Water').maybeSingle();

      if (waterHabit) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: waterLog } = await supabase.from('habit_logs').select('value').eq('habit_id', waterHabit.id).eq('date', today).maybeSingle();

        setStats(prev => ({
          ...prev,
          waterIntake: (waterLog?.value || 0) / 1000,
          waterGoal: (waterHabit.goal || 2500) / 1000
        }));
      }
    };

    fetchData();

    const ch = supabase.channel('dash_main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(ch); }
  }, [user]);

  const handleToggle = async (id: string, status: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: status } : t));
    if (user) await supabase.from('tasks').update({ status: status ? 'done' : 'todo', updated_at: new Date().toISOString() }).eq('id', id);
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
            className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 flex flex-col justify-between group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all border border-indigo-400/20 min-h-[140px]"
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
    if (activeView === 'command') return <MainDashboardView user={user} profile={profile} setActiveView={setActiveView} />;

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
      focus: <FocusMode />
    };

    return views[activeView] || <div className="p-8 text-white">View Not Found</div>;
  }, [activeView, user, profile]);

  return (
    <WorkspaceProvider>
      {/* SpotifyProvider Removed */}
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
        <div className="relative z-[60]">
          <AppSidebar
            activeView={activeView}
            onViewChange={setActiveView}
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
