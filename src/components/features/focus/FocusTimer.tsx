import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { FocusSettings } from '@/lib/types';
import { createFocusSession, completeFocusSession, fetchRecentFocusSessions, fetchWeeklyFocusStats } from '@/services/focusService';
import { toast } from 'sonner';
import {
  Play, Pause, RotateCcw, Coffee, Zap, CheckCircle2,
  BarChart3, Settings2, Moon, Flame
} from 'lucide-react';
import { format } from 'date-fns';

type TimerMode = 'work' | 'short_break' | 'long_break';

const DEFAULT_SETTINGS: FocusSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const MODE_CONFIG: Record<TimerMode, { label: string; color: string; gradient: string; icon: any }> = {
  work: { label: 'Focus', color: '#a78bfa', gradient: 'from-violet-500/20 to-indigo-500/10', icon: Zap },
  short_break: { label: 'Short Break', color: '#34d399', gradient: 'from-emerald-500/20 to-teal-500/10', icon: Coffee },
  long_break: { label: 'Long Break', color: '#60a5fa', gradient: 'from-blue-500/20 to-cyan-500/10', icon: Moon },
};

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusTimer() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [totalDuration, setTotalDuration] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [sessions, stats] = await Promise.all([
      fetchRecentFocusSessions(user.id, 8),
      fetchWeeklyFocusStats(user.id),
    ]);
    setRecentSessions(sessions);
    setWeeklyStats(stats);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const getDurationForMode = useCallback((m: TimerMode) => {
    if (m === 'work') return settings.workDuration * 60;
    if (m === 'short_break') return settings.shortBreakDuration * 60;
    return settings.longBreakDuration * 60;
  }, [settings]);

  const switchMode = useCallback((m: TimerMode) => {
    setMode(m);
    const dur = getDurationForMode(m);
    setTimeLeft(dur);
    setTotalDuration(dur);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [getDurationForMode]);

  const handleSessionComplete = useCallback(async () => {
    if (mode === 'work' && activeSessionId && user) {
      const elapsed = Math.round((Date.now() - sessionStartRef.current) / 60000);
      await completeFocusSession(activeSessionId, user.id, elapsed);
      setActiveSessionId(null);
      setSessionCount(prev => prev + 1);
      loadData();
      toast.success('🔥 Focus session complete!', { description: `${settings.workDuration} minutes of deep work done.` });
      // Auto-switch to break
      const nextBreak = (sessionCount + 1) % settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      switchMode(nextBreak);
    } else {
      toast.success('☕ Break time over! Back to work.');
      switchMode('work');
    }
  }, [mode, activeSessionId, user, sessionCount, settings, switchMode, loadData]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleSessionComplete]);

  const handleStart = async () => {
    if (!isRunning && mode === 'work' && !activeSessionId && user) {
      const session = await createFocusSession(user.id, {
        session_type: 'work',
        duration_minutes: settings.workDuration,
        completed: false,
      });
      if (session) {
        setActiveSessionId(session.id);
        sessionStartRef.current = Date.now();
      }
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    const dur = getDurationForMode(mode);
    setTimeLeft(dur);
    setTotalDuration(dur);
    setActiveSessionId(null);
  };

  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const modeConf = MODE_CONFIG[mode];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const todayMinutes = weeklyStats
    .find(s => s.date === new Date().toISOString().slice(0, 10))?.total_minutes || 0;
  const weekTotal = weeklyStats.reduce((a, s) => a + (s.total_minutes || 0), 0);
  const maxBarVal = Math.max(...weeklyStats.map(s => s.total_minutes), 1);

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] scrollbar-hide">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto p-8 space-y-8 pb-20"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Focus Mode</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pomodoro Timer</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all",
                showHistory ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                showSettings ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Timer Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Mode switcher */}
            <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
              {(Object.entries(MODE_CONFIG) as [TimerMode, typeof MODE_CONFIG[TimerMode]][]).map(([key, conf]) => (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all",
                    mode === key
                      ? "bg-white/10 text-white"
                      : "text-white/30 hover:text-white/60"
                  )}
                >
                  <conf.icon className="w-3.5 h-3.5" />
                  {conf.label}
                </button>
              ))}
            </div>

            {/* SVG Ring Timer */}
            <motion.div
              className={cn("relative flex items-center justify-center rounded-3xl p-10 bg-gradient-to-br border border-white/5", modeConf.gradient)}
              animate={{ scale: isRunning ? [1, 1.002, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <svg width="200" height="200" className="-rotate-90">
                {/* Background track */}
                <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                {/* Progress arc */}
                <motion.circle
                  cx="100" cy="100" r={RADIUS}
                  fill="none"
                  stroke={modeConf.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  style={{ filter: `drop-shadow(0 0 8px ${modeConf.color}80)` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="text-5xl font-mono font-black text-white tracking-tight tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                  {modeConf.label}
                </span>
                {isRunning && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2 h-2 rounded-full mt-1"
                    style={{ backgroundColor: modeConf.color }}
                  />
                )}
              </div>
            </motion.div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleReset}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isRunning ? handlePause : handleStart}
                className="w-20 h-20 rounded-3xl font-black text-black flex items-center justify-center shadow-2xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${modeConf.color}, ${modeConf.color}cc)`,
                  boxShadow: `0 0 30px ${modeConf.color}40`
                }}
              >
                {isRunning
                  ? <Pause className="w-8 h-8" />
                  : <Play className="w-8 h-8 translate-x-0.5" />
                }
              </motion.button>

              <div className="w-12 h-12 flex flex-col items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 gap-0.5">
                <span className="text-[18px] font-black text-white">{sessionCount}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-white/30">Done</span>
              </div>
            </div>

            {/* Session dots */}
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-500",
                    i < sessionCount % settings.sessionsBeforeLongBreak
                      ? "bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.6)]"
                      : "bg-white/10"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Stats Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Today & Week stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Today', value: `${todayMinutes}m`, sub: 'focused' },
                { label: 'This Week', value: `${weekTotal}m`, sub: 'total' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{stat.label}</p>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/40">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Weekly bar chart */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">7-Day Focus</p>
              <div className="flex items-end gap-1 h-20">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const dateKey = d.toISOString().slice(0, 10);
                  const stat = weeklyStats.find(s => s.date === dateKey);
                  const height = stat ? Math.max(6, (stat.total_minutes / maxBarVal) * 72) : 4;
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 4 }}
                        animate={{ height }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="w-full rounded-t-sm"
                        style={{
                          background: isToday ? '#a78bfa' : 'rgba(167,139,250,0.3)',
                          boxShadow: isToday ? '0 0 8px rgba(167,139,250,0.4)' : 'none'
                        }}
                      />
                      <span className="text-[8px] text-white/20">
                        {['M','T','W','T','F','S','S'][(d.getDay() + 6) % 7]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 space-y-3"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30 mb-2">Timer Settings</p>
                  {([
                    { key: 'workDuration', label: 'Work (min)', min: 1, max: 90 },
                    { key: 'shortBreakDuration', label: 'Short Break', min: 1, max: 30 },
                    { key: 'longBreakDuration', label: 'Long Break', min: 5, max: 60 },
                    { key: 'sessionsBeforeLongBreak', label: 'Before Long Break', min: 2, max: 8 },
                  ] as { key: keyof FocusSettings; label: string; min: number; max: number }[]).map(({ key, label, min, max }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50">{label}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSettings(s => ({ ...s, [key]: Math.max(min, s[key] - 1) }))}
                          className="w-6 h-6 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 flex items-center justify-center text-sm font-bold transition-all"
                        >−</button>
                        <span className="text-[13px] font-bold text-white w-6 text-center">{settings[key]}</span>
                        <button
                          onClick={() => setSettings(s => ({ ...s, [key]: Math.min(max, s[key] + 1) }))}
                          className="w-6 h-6 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 flex items-center justify-center text-sm font-bold transition-all"
                        >+</button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => { switchMode(mode); setShowSettings(false); }}
                    className="w-full mt-2 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-[11px] font-bold uppercase tracking-wider hover:bg-violet-500/30 transition-all"
                  >
                    Apply Settings
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Sessions */}
            <AnimatePresence>
              {showHistory && recentSessions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 space-y-2"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30 mb-3">Recent Sessions</p>
                  {recentSessions.slice(0, 6).map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0"
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        session.completed ? "bg-violet-400" : "bg-white/20"
                      )} />
                      <div className="flex-1">
                        <p className="text-[11px] text-white/60">
                          {session.session_type === 'work' ? 'Focus' : 'Break'} · {session.duration_minutes}m
                        </p>
                        <p className="text-[9px] text-white/25">
                          {format(new Date(session.started_at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                      {session.completed && <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
