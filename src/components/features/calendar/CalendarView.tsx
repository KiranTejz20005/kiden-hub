import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Settings, 
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Clock,
  MapPin,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { googleCalendarService } from '@/services/googleCalendarService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const CalendarView = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  useEffect(() => {
    if (user) {
      checkConnection();
    }
  }, [user]);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const status = await googleCalendarService.getConnectionStatus(user!.id);
      setIsConnected(!!status);
      if (status) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    try {
      const data = await googleCalendarService.getEvents(user!.id, start, end);
      setEvents(data);
    } catch (error) {
      toast.error('Failed to load events');
    }
  };

  const handleConnect = () => {
    const url = googleCalendarService.getConnectUrl();
    window.location.href = url;
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await googleCalendarService.sync();
      await fetchEvents();
      toast.success('Calendar synced successfully');
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const rows = useMemo(() => {
    const r = [];
    let d = [];
    days.forEach((day, i) => {
      d.push(day);
      if ((i + 1) % 7 === 0) {
        r.push(d);
        d = [];
      }
    });
    return r;
  }, [days]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
            <CalendarIcon className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Loading Schedule</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#050505] relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 text-center relative z-10"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/10">
            <CalendarIcon className="w-10 h-10 text-emerald-500" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Sync Your Schedule</h1>
            <p className="text-white/40 text-sm leading-relaxed">
              Connect your Google Calendar to manage your events, deadlines, and meetings directly inside Kiden Hub.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { title: 'Real-time Sync', desc: 'Auto-sync events', icon: RefreshCw },
              { title: 'AI Scheduling', desc: 'Smart focus blocks', icon: CheckCircle2 },
            ].map((feature, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                <feature.icon className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-semibold text-white">{feature.title}</h3>
                <p className="text-[10px] text-white/30">{feature.desc}</p>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleConnect}
            className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold transition-all flex items-center justify-center gap-2 group"
          >
            Connect Google Calendar
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Secure OAuth 2.0 Integration</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
      {/* Premium Header */}
      <header className="h-20 shrink-0 border-b border-white/[0.03] flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl relative z-20">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              {format(currentDate, 'MMMM yyyy')}
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Connected
              </span>
            </h2>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-white/30 font-medium">Live Sync Active</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-[11px] font-bold text-white/60 hover:text-white transition-all"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {[
              { id: 'month', icon: CalendarDays },
              { id: 'week', icon: CalendarRange },
              { id: 'agenda', icon: LayoutGrid },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setView(t.id as any)}
                className={cn(
                  "p-2 rounded-lg transition-all flex items-center gap-2",
                  view === t.id ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                )}
              >
                <t.icon className="w-4 h-4" />
                {view === t.id && <span className="text-[11px] font-bold capitalize">{t.id}</span>}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-white/10 mx-2" />

          <Button 
            onClick={handleSync}
            disabled={isSyncing}
            variant="ghost"
            className="w-10 h-10 p-0 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          </Button>

          <Button className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 gap-2 shadow-lg shadow-emerald-600/20">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Mini Calendar & Filters */}
        <aside className="w-72 shrink-0 border-r border-white/[0.03] p-6 space-y-8 bg-black/10 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Calendars</h3>
            <div className="space-y-2">
              {['Work Schedule', 'Personal', 'Deadlines', 'Meetings'].map((cal, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-rose-500" : "bg-amber-500"
                    )} />
                    <span className="text-[13px] font-medium text-white/60 group-hover:text-white transition-colors">{cal}</span>
                  </div>
                  <div className="w-4 h-4 rounded border border-white/10 flex items-center justify-center group-hover:border-emerald-500/50">
                    <div className="w-2 h-2 rounded-sm bg-emerald-500 scale-0 group-hover:scale-100 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/[0.03]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">AI Insights</h3>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold text-white">Focus Time Found</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                You have a 3-hour open block on Tuesday afternoon. Should I schedule some flow work?
              </p>
              <button className="text-[11px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                Optimize Now
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/[0.03]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Upcoming</h3>
            <div className="space-y-3">
              {events.slice(0, 3).map((event, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">10:00 AM</span>
                    <ExternalLink className="w-3 h-3 text-white/10 group-hover:text-white/40" />
                  </div>
                  <h4 className="text-[12px] font-semibold text-white truncate">{event.title}</h4>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-[11px] text-white/20 italic">No upcoming events</p>
              )}
            </div>
          </div>
        </aside>

        {/* Calendar Grid */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-7 border-b border-white/[0.03]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {rows.map((row, i) => (
              row.map((day, j) => {
                const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day));
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div 
                    key={day.toString()}
                    className={cn(
                      "min-h-[140px] p-2 border-r border-b border-white/[0.03] transition-colors relative group",
                      !isCurrentMonth ? "bg-black/40" : "hover:bg-white/[0.02]",
                      j === 6 && "border-r-0"
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={cn(
                        "text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-all",
                        isDayToday ? "bg-emerald-500 text-black shadow-lg" : isCurrentMonth ? "text-white/40" : "text-white/10",
                        "group-hover:text-white"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-black text-emerald-500/40">{dayEvents.length} Events</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event, k) => (
                        <div 
                          key={k}
                          className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 group/event cursor-pointer hover:bg-emerald-500/20 transition-all"
                        >
                          <p className="text-[10px] font-bold text-emerald-500 truncate">{event.title}</p>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <button className="text-[9px] font-bold text-white/20 hover:text-white/40 transition-colors pl-1">
                          + {dayEvents.length - 3} more
                        </button>
                      )}
                    </div>

                    <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CalendarView;
