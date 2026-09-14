import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { FocusSettings } from '@/lib/types';
import { createFocusSession, completeFocusSession, fetchRecentFocusSessions, fetchWeeklyFocusStats } from '@/services/focusService';
import { playAlertSound } from '@/lib/focus/sounds';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  Play, Pause, RotateCcw, Coffee, Zap, CheckCircle2,
  BarChart3, Settings2, Moon, Flame, Waves, Music, Volume2, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { AmbientMixer } from './components/AmbientMixer';
import { LofiPlayer } from './components/LofiPlayer';

type TimerMode = 'work' | 'short_break' | 'long_break';
type MainTab = 'timer' | 'ambient' | 'lofi' | 'history';

const DEFAULT_SETTINGS: FocusSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const MODE_CONFIG: Record<TimerMode, { label: string; color: string; gradient: string; icon: any }> = {
  work: { label: 'Focus', color: '#8b5cf6', gradient: 'from-violet-500/20 to-indigo-500/10', icon: Zap },
  short_break: { label: 'Short Break', color: '#10b981', gradient: 'from-emerald-500/20 to-teal-500/10', icon: Coffee },
  long_break: { label: 'Long Break', color: '#3b82f6', gradient: 'from-blue-500/20 to-cyan-500/10', icon: Moon },
};

const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusTimer() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>('timer');
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
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

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    // Play alert sound chime
    try {
      playAlertSound('chime');
    } catch (e) {
      console.error(e);
    }

    if (mode === 'work') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#a78bfa', '#3b82f6', '#10b981'],
        });
      } catch {
        // confetti fallback
      }

      if (activeSessionId && user) {
        const elapsed = Math.round((Date.now() - sessionStartRef.current) / 60000);
        await completeFocusSession(activeSessionId, user.id, elapsed);
        setActiveSessionId(null);
      }
      setSessionCount((prev) => prev + 1);
      loadData();
      toast.success('🔥 Focus session complete!', {
        description: `${settings.workDuration} minutes of deep work completed. Great job!`,
      });
      // Auto switch to break
      const nextBreak = (sessionCount + 1) % settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      switchMode(nextBreak);
    } else {
      toast.success('☕ Break time over! Ready to focus?');
      switchMode('work');
    }
  }, [mode, activeSessionId, user, sessionCount, settings, switchMode, loadData]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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

  const handlePause = () => {
    setIsRunning(false);
  };

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

  const todayMinutes = weeklyStats.find((s) => s.date === new Date().toISOString().slice(0, 10))?.total_minutes || 0;
  const weekTotal = weeklyStats.reduce((a, s) => a + (s.total_minutes || 0), 0);
  const maxBarVal = Math.max(...weeklyStats.map((s) => s.total_minutes), 1);

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground scrollbar-hide">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20"
      >
        {/* Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-violet-500 dark:text-violet-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Deep Work Studio</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Focus & Soundscape</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/50 border border-border/60 self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('timer')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === 'timer'
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              Timer
            </button>

            <button
              onClick={() => setActiveTab('ambient')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === 'ambient'
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Waves className="w-3.5 h-3.5" />
              Soundscape
            </button>

            <button
              onClick={() => setActiveTab('lofi')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === 'lofi'
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Music className="w-3.5 h-3.5" />
              Lo-Fi Chill
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === 'history'
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Stats
            </button>
          </div>
        </div>

        {/* TAB 1: TIMER */}
        {activeTab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Timer Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Mode switcher */}
              <div className="flex gap-2 p-1 rounded-2xl bg-card border border-border/60 shadow-sm">
                {(Object.entries(MODE_CONFIG) as [TimerMode, (typeof MODE_CONFIG)[TimerMode]][]).map(([key, conf]) => (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      mode === key
                        ? "bg-muted text-foreground shadow-sm border border-border/50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <conf.icon className="w-3.5 h-3.5" />
                    {conf.label}
                  </button>
                ))}
              </div>

              {/* SVG Ring Countdown Timer */}
              <motion.div
                className={cn(
                  "relative flex items-center justify-center rounded-3xl p-10 bg-card border border-border/60 shadow-md",
                  modeConf.gradient
                )}
                animate={{ scale: isRunning ? [1, 1.003, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <svg width="220" height="220" className="-rotate-90">
                  {/* Background track */}
                  <circle
                    cx="110"
                    cy="110"
                    r={RADIUS}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/40"
                    strokeWidth="12"
                  />
                  {/* Progress arc */}
                  <motion.circle
                    cx="110"
                    cy="110"
                    r={RADIUS}
                    fill="none"
                    stroke={modeConf.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    style={{ filter: `drop-shadow(0 0 10px ${modeConf.color}60)` }}
                    transition={{ duration: 0.5, ease: "linear" }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <span className="text-5xl sm:text-6xl font-mono font-black text-foreground tracking-tight tabular-nums">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    {modeConf.label}
                  </span>
                  {isRunning && (
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-2.5 h-2.5 rounded-full mt-0.5"
                      style={{ backgroundColor: modeConf.color }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={handleReset}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 shadow-sm transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={isRunning ? handlePause : handleStart}
                  className="w-20 h-20 rounded-3xl font-black text-white flex items-center justify-center shadow-xl transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${modeConf.color}, ${modeConf.color}dd)`,
                    boxShadow: `0 8px 24px ${modeConf.color}40`,
                  }}
                  title={isRunning ? "Pause" : "Start"}
                >
                  {isRunning ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 translate-x-0.5" />
                  )}
                </motion.button>

                <div className="w-12 h-12 flex flex-col items-center justify-center rounded-2xl bg-card border border-border/60 shadow-sm gap-0.5">
                  <span className="text-base font-black text-foreground">{sessionCount}</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">Done</span>
                </div>
              </div>

              {/* Session completion dots */}
              <div className="flex items-center justify-center gap-2.5 pt-1">
                {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-500",
                      i < sessionCount % settings.sessionsBeforeLongBreak
                        ? "bg-violet-500 shadow-sm shadow-violet-500/50 scale-110"
                        : "bg-muted border border-border/40"
                    )}
                  />
                ))}
              </div>

              {/* Quick launcher bar to soundscape / lo-fi */}
              <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">Need background focus sounds?</p>
                    <p className="text-[11px] text-muted-foreground">Rain, cafe, waves or chill lo-fi beats</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('ambient')}
                    className="px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-all"
                  >
                    Mix Ambient
                  </button>
                  <button
                    onClick={() => setActiveTab('lofi')}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all"
                  >
                    Play Lo-Fi
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Settings Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Daily & Weekly Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Today', value: `${todayMinutes}m`, sub: 'deep focus' },
                  { label: 'This Week', value: `${weekTotal}m`, sub: 'total time' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* 7-Day Weekly Bar Chart */}
              <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">7-Day Focus Record</p>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      showSettings ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Timer Settings"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-end gap-1.5 h-20 pt-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const dateKey = d.toISOString().slice(0, 10);
                    const stat = weeklyStats.find((s) => s.date === dateKey);
                    const height = stat ? Math.max(6, (stat.total_minutes / maxBarVal) * 64) : 4;
                    const isToday = i === 6;

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <motion.div
                          initial={{ height: 4 }}
                          animate={{ height }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                          className="w-full rounded-t-sm"
                          style={{
                            background: isToday ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)',
                            boxShadow: isToday ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none',
                          }}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][(d.getDay() + 6) % 7]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timer Settings Drawer */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-3 overflow-hidden"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                      Timer Durations
                    </p>
                    {([
                      { key: 'workDuration', label: 'Focus (min)', min: 1, max: 90 },
                      { key: 'shortBreakDuration', label: 'Short Break', min: 1, max: 30 },
                      { key: 'longBreakDuration', label: 'Long Break', min: 5, max: 60 },
                      { key: 'sessionsBeforeLongBreak', label: 'Before Long Break', min: 2, max: 8 },
                    ] as { key: keyof FocusSettings; label: string; min: number; max: number }[]).map(
                      ({ key, label, min, max }) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSettings((s) => ({ ...s, [key]: Math.max(min, s[key] - 1) }))}
                              className="w-6 h-6 rounded-lg bg-muted text-foreground hover:bg-muted/80 flex items-center justify-center font-bold transition-all"
                            >
                              −
                            </button>
                            <span className="font-bold text-foreground w-6 text-center">{settings[key]}</span>
                            <button
                              onClick={() => setSettings((s) => ({ ...s, [key]: Math.min(max, s[key] + 1) }))}
                              className="w-6 h-6 rounded-lg bg-muted text-foreground hover:bg-muted/80 flex items-center justify-center font-bold transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    )}
                    <button
                      onClick={() => {
                        switchMode(mode);
                        setShowSettings(false);
                      }}
                      className="w-full mt-2 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-violet-700 transition-all shadow-sm"
                    >
                      Save Settings
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recent Activity List */}
              <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Recent Sessions
                </p>
                {recentSessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">No recent sessions recorded yet.</p>
                ) : (
                  recentSessions.slice(0, 5).map((session, i) => (
                    <div
                      key={session.id || i}
                      className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          session.completed ? "bg-violet-500" : "bg-muted-foreground"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {session.session_type === 'work' ? 'Focus' : 'Break'} · {session.duration_minutes}m
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {session.started_at ? format(new Date(session.started_at), 'MMM d, HH:mm') : 'Recent'}
                        </p>
                      </div>
                      {session.completed && <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AMBIENT SOUNDSCAPE */}
        {activeTab === 'ambient' && <AmbientMixer />}

        {/* TAB 3: LO-FI CHILL */}
        {activeTab === 'lofi' && <LofiPlayer />}

        {/* TAB 4: STATS & ANALYTICS */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Focus</p>
                <p className="text-3xl font-black text-foreground mt-2">{todayMinutes} mins</p>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weekly Total</p>
                <p className="text-3xl font-black text-foreground mt-2">{weekTotal} mins</p>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sessions Completed</p>
                <p className="text-3xl font-black text-foreground mt-2">{sessionCount} sessions</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-foreground">Completed Focus History</h2>
              <div className="divide-y divide-border/60">
                {recentSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No completed sessions logged yet.</p>
                ) : (
                  recentSessions.map((session) => (
                    <div key={session.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {session.session_type === 'work' ? 'Deep Work Session' : 'Rest Break'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.started_at ? format(new Date(session.started_at), 'EEEE, MMM d, yyyy · HH:mm') : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">{session.duration_minutes} mins</span>
                        <p className="text-[10px] text-emerald-500 font-semibold">Completed</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
