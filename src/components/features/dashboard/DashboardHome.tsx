import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { 
  FileText, MessageSquare, Layout, Database, 
  Plus, Upload, MessageCircle, FilePlus, 
  Sparkles, Zap, Clock, ChevronRight,
  Activity, Users, Calendar,
  Settings, Heart, Trash2, Flame, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActiveView } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { fetchRecentActivities, ActivityLog } from '@/services/activityService';
import { fetchTodayFocusMinutes } from '@/services/focusService';

const DashboardHome = ({ onViewChange }: { onViewChange?: (view: ActiveView) => void }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    files: 0,
    chats: 0,
    boards: 0,
    storage: 0, 
    storageText: '0 MB',
    newFiles: 0,
    newChats: 0,
    newBoards: 0,
    focusMinutes: 0,
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = yesterday.toISOString();

      const [filesCount, chatsCount, boardsCount, storageSum, recentLogs, recentFiles, recentChats, recentBoards, todayFocus] = await Promise.all([
        supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('research_boards' as any).select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('files').select('size').eq('user_id', user.id),
        fetchRecentActivities(user.id, 5),
        supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', yesterdayIso),
        supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', yesterdayIso),
        supabase.from('research_boards' as any).select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', yesterdayIso),
        fetchTodayFocusMinutes(user.id),
      ]);

      const totalSize = storageSum.data?.reduce((acc, curr) => acc + curr.size, 0) || 0;
      const formattedStorage = totalSize > 1024 * 1024 * 1024 
        ? `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`
        : `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;

      setStats({
        files: filesCount.count || 0,
        chats: chatsCount.count || 0,
        boards: boardsCount.count || 0,
        storage: totalSize,
        storageText: formattedStorage,
        newFiles: recentFiles.count || 0,
        newChats: recentChats.count || 0,
        newBoards: recentBoards.count || 0,
        focusMinutes: todayFocus,
      });
      
      setActivities(recentLogs);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const quickActions = [
    { label: 'Upload File', desc: 'Add new assets', icon: Upload, view: 'files' },
    { label: 'AI Assistant', desc: 'Start a conversation', icon: MessageCircle, view: 'chat' },
    { label: 'Research Board', desc: 'Organize project', icon: Layout, view: 'boards' },
    { label: 'Smart Note', desc: 'Capture thoughts', icon: FilePlus, view: 'notes' },
    { label: 'Focus Timer', desc: 'Deep work session', icon: Flame, view: 'focus' },
    { label: 'Habit Tracker', desc: 'Log daily habits', icon: Target, view: 'habits' },
  ];

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] scrollbar-hide">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto p-8 space-y-10 pb-20"
      >
        {/* ── Header ── */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Workspace Overview</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
              {greeting()}, <span className="text-primary">{user?.user_metadata?.full_name?.split(' ')[0] || 'Explorer'}</span>.
            </h1>
            <p className="text-white/50 text-sm font-medium flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              It's {format(currentTime, 'EEEE, MMMM do')}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 text-white/40 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md shadow-2xl"
          >
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Live Time</span>
              <span className="text-lg font-mono font-bold text-white leading-none">{format(currentTime, 'HH:mm')}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <Clock className="w-5 h-5 text-primary" />
          </motion.div>
        </section>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <StatsCard 
            label="Assets" 
            value={stats.files.toString()} 
            subValue="FILES" 
            icon={FileText} 
            change={stats.newFiles > 0 ? `+${stats.newFiles}` : undefined} 
            trend="up" 
            delay={0.1} 
          />
          <StatsCard 
            label="AI Context" 
            value={stats.chats.toString()} 
            subValue="CONVERSATIONS" 
            icon={MessageSquare} 
            change={stats.newChats > 0 ? `+${stats.newChats}` : undefined} 
            trend="up" 
            delay={0.2} 
          />
          <StatsCard 
            label="Research" 
            value={stats.boards.toString()} 
            subValue="ACTIVE BOARDS" 
            icon={Layout} 
            change={stats.newBoards > 0 ? `+${stats.newBoards}` : undefined} 
            trend="up" 
            delay={0.3} 
          />
          <StatsCard 
            label="Storage" 
            value={stats.storageText} 
            subValue="OF 50MB" 
            icon={Database} 
            progress={(stats.storage / (50 * 1024 * 1024)) * 100} 
            delay={0.4} 
          />
          <StatsCard 
            label="Focus Today" 
            value={`${stats.focusMinutes}m`} 
            subValue="FOCUSED" 
            icon={Flame} 
            trend={stats.focusMinutes > 0 ? 'up' : undefined}
            delay={0.5} 
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-6">
            {/* Activity Feed */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h2>
                <button className="text-[9px] font-bold text-white/30 hover:text-primary uppercase tracking-[0.2em] transition-colors">View All</button>
              </div>

              <div className="space-y-2">
                {activities.length > 0 ? activities.map((item, i) => {
                  const getActionDetails = (type: string) => {
                    switch (type) {
                      case 'upload': 
                        return { label: 'uploaded', icon: Upload, color: 'text-emerald-500' };
                      case 'update_profile': 
                        return { label: 'updated profile', icon: Users, color: 'text-blue-500' };
                      case 'update_settings': 
                        return { label: 'updated settings', icon: Settings, color: 'text-gray-500' };
                      case 'add_to_library': 
                        return { label: 'added', icon: Plus, color: 'text-primary' };
                      case 'follow_creator': 
                        return { label: 'followed', icon: Heart, color: 'text-pink-500' };
                      case 'create_note': 
                        return { label: 'created note', icon: FilePlus, color: 'text-amber-500' };
                      case 'delete_file': 
                        return { label: 'deleted', icon: Trash2, color: 'text-rose-500' };
                      case 'summarize_file': 
                        return { label: 'summarized', icon: Sparkles, color: 'text-purple-500' };
                      case 'sync_storage': 
                        return { label: 'synced storage', icon: Database, color: 'text-cyan-500' };
                      default: 
                        return { label: type.replace(/_/g, ' ') + 'ed', icon: Activity, color: 'text-white/40' };
                    }
                  };

                  const { label, icon: ActionIcon, color } = getActionDetails(item.action_type);
                  
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all group border border-transparent hover:border-white/5"
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 transition-all group-hover:scale-105",
                        "group-hover:bg-white/10"
                      )}>
                        <ActionIcon className={cn("w-4 h-4", color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/60 group-hover:text-white transition-colors truncate">
                          <span className="font-bold text-white/90">You</span> {label} <span className="font-bold text-white/90">{item.target_name}</span>
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20 mt-0.5">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="py-12 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] italic">No activity detected.</div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Launcher & Status */}
          <div className="xl:col-span-4 space-y-8">
            <div className="space-y-6">
              <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] px-2">Quick Launcher</h2>
              <div className="space-y-2">
                {quickActions.map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => action.view && onViewChange?.(action.view as ActiveView)}
                    className="w-full flex items-center gap-5 p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-white/80 group-hover:text-white transition-colors">{action.label}</p>
                      <p className="text-xs text-white/30 truncate group-hover:text-white/50 transition-colors">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                System Status <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </h2>
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-center gap-4 group hover:bg-primary/20 transition-all">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                   <Zap className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                   <p className="text-[13px] font-bold text-primary">All systems operational</p>
                   <p className="text-[10px] text-primary/60 uppercase tracking-widest mt-0.5">Latency: 24ms</p>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
