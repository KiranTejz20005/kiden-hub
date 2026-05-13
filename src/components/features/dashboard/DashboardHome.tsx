import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { 
  FileText, MessageSquare, Layout, Database, 
  Plus, Upload, MessageCircle, FilePlus, 
  Sparkles, Zap, Clock, ChevronRight,
  TrendingUp, Activity, Bell, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActiveView } from '@/lib/types';
import { format } from 'date-fns';

const DashboardHome = ({ onViewChange }: { onViewChange?: (view: ActiveView) => void }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    files: 0,
    chats: 0,
    boards: 0,
    storage: 0, 
    storageText: '0 MB'
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const [filesCount, chatsCount, boardsCount, storageSum] = await Promise.all([
          supabase.from('files').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('research_boards').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('files').select('size').eq('user_id', user.id)
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
          storageText: formattedStorage
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  const quickActions = [
    { label: 'Upload File', desc: 'Add new assets', icon: Upload, color: 'text-primary', bg: 'bg-primary/10', view: 'files' },
    { label: 'AI Assistant', desc: 'Start a conversation', icon: MessageCircle, color: 'text-primary', bg: 'bg-primary/10', view: 'chat' },
    { label: 'Research Board', desc: 'Organize project', icon: Layout, color: 'text-primary', bg: 'bg-primary/10', view: 'boards' },
    { label: 'Smart Note', desc: 'Capture thoughts', icon: FilePlus, color: 'text-primary', bg: 'bg-primary/10', view: 'notes' },
  ];

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 pb-20"
      >
        {/* ── Header Section ── */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div variants={itemVariants} className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Workspace Overview</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              {greeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{user?.user_metadata?.full_name?.split(' ')[0] || 'Explorer'}</span>.
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary/60" />
              It's {format(currentTime, 'EEEE, MMMM do')}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-end px-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Time</span>
              <span className="text-lg font-mono font-bold text-white tracking-tighter">{format(currentTime, 'HH:mm')}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <Clock className="w-5 h-5" />
            </div>
          </motion.div>
        </section>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard 
            label="Workspace Files" 
            value={stats.files.toString()} 
            subValue="Asset library"
            icon={FileText} 
            color="primary" 
            change="12%"
            trend="up"
            delay={0.1}
          />
          <StatsCard 
            label="AI Interactions" 
            value={stats.chats.toString()} 
            subValue="LLM Contexts"
            icon={MessageSquare} 
            color="primary" 
            change="5"
            trend="up"
            delay={0.2}
          />
          <StatsCard 
            label="Project Boards" 
            value={stats.boards.toString()} 
            subValue="Active research"
            icon={Layout} 
            color="primary" 
            delay={0.3}
          />
          <StatsCard 
            label="Cloud Storage" 
            value={stats.storageText} 
            subValue="50MB Quota"
            icon={Database} 
            color="primary" 
            progress={(stats.storage / (50 * 1024 * 1024)) * 100}
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
            <div className="bg-[#050505] rounded-3xl border border-white/5 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-32 h-32 text-primary" />
              </div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Productivity Flow</h2>
                    <p className="text-xs text-gray-500 font-medium">Engagement metrics across features</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/5">
                  <button className="px-3 py-1 text-[10px] font-bold bg-primary text-white rounded-md">Weekly</button>
                  <button className="px-3 py-1 text-[10px] font-bold text-gray-500 hover:text-white transition-colors">Monthly</button>
                </div>
              </div>

              <div className="h-48 flex items-end gap-2 md:gap-3 px-2">
                {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85, 60, 100].map((h, i) => (
                  <div key={i} className="flex-1 group/bar relative">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + (i * 0.05), duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "w-full rounded-t-md transition-all duration-300 relative overflow-hidden",
                        i === 7 ? "bg-gradient-to-t from-primary to-accent" : "bg-white/5 group-hover/bar:bg-primary/20"
                      )}
                    >
                      {i === 7 && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-white/20" />}
                    </motion.div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xl pointer-events-none">
                      {h}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
            </div>

            <div className="bg-[#050505]/50 rounded-3xl border border-white/5 border-dashed p-12 flex flex-col items-center justify-center text-center group hover:bg-[#050505] transition-all duration-500">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                <Activity className="w-10 h-10 text-gray-600 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Activity Feed</h3>
              <p className="text-gray-500 max-w-sm mt-2 text-sm leading-relaxed">
                Connect your tools and start working to see your activity populate here in real-time.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Quick Launcher</h2>
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, i) => (
                  <motion.button 
                    key={i}
                    whileHover={{ x: 5 }}
                    onClick={() => action.view && onViewChange?.(action.view as ActiveView)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#050505] border border-white/5 hover:border-primary/30 hover:bg-white/[0.02] transition-all group"
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform", action.bg)}>
                      <action.icon className={cn("w-6 h-6", action.color)} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-white leading-none mb-1">{action.label}</p>
                      <p className="text-[10px] font-medium text-gray-500">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-primary transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-primary rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20 group">
              <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <Sparkles className="w-20 h-20" />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Pro Workspace</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-6">
                  Unlock limitless AI processing and team collaboration features.
                </p>
                <Button className="w-full bg-white text-primary font-bold hover:bg-white/90 rounded-xl">
                  Upgrade Now
                </Button>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">System Status</h2>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Zap className="w-4 h-4" />
                 </div>
                 <p className="text-[11px] font-medium text-gray-400">All systems operational. Connected to NVIDIA AI Hub.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
