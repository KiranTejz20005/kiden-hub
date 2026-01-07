import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FocusSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Play, Pause, RotateCcw, Settings, Volume2, VolumeX,
  Coffee, Zap, Moon, X, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useFocusSessions } from '@/hooks/useFocusSessions';

interface FocusModeProps {
  focusSettings?: FocusSettings;
  onComplete: () => void;
}

type SessionType = 'work' | 'short_break' | 'long_break' | 'flow';

const sessionConfig = {
  work: { label: 'Focus', icon: Zap, color: 'from-primary to-accent' },
  short_break: { label: 'Short Break', icon: Coffee, color: 'from-amber-500 to-orange-500' },
  long_break: { label: 'Long Break', icon: Moon, color: 'from-violet-500 to-purple-600' },
  flow: { label: 'Flow Mode', icon: Zap, color: 'from-cyan-500 to-blue-500' }
};

const FocusMode = ({ focusSettings, onComplete }: FocusModeProps) => {
  const { user } = useAuth();
  const { createSession, sessions, fetchSessions } = useFocusSessions();

  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState((focusSettings?.workDuration || 25) * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State for stats
  const [stats, setStats] = useState({
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    breakMinutesWeek: 0,
    streak: 0
  });

  useEffect(() => {
    // Calculate Stats
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayMins = 0;
    let weekMins = 0;
    let monthMins = 0;
    let breakWeek = 0;

    const workSessions = sessions.filter(s => s.session_type === 'work' || s.session_type === 'flow');
    const breakSessions = sessions.filter(s => s.session_type === 'short_break' || s.session_type === 'long_break');

    workSessions.forEach(s => {
      if (!s.started_at) return;
      const d = new Date(s.started_at);
      const mins = s.duration_minutes || 0;
      if (d >= today) todayMins += mins;
      if (d >= startOfWeek) weekMins += mins;
      if (d >= startOfMonth) monthMins += mins;
    });

    breakSessions.forEach(s => {
      if (!s.started_at) return;
      const d = new Date(s.started_at);
      if (d >= startOfWeek) breakWeek += (s.duration_minutes || 0);
    });

    // Streak Logic (Approximate, based on work sessions)
    let currentStreak = 0;
    let checkDate = new Date(today);

    // Safety break loop
    for (let i = 0; i < 365; i++) {
      const hasSession = workSessions.some(s => {
        if (!s.started_at) return false;
        const d = new Date(s.started_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === checkDate.getTime();
      });

      if (hasSession) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today has no sessions, we don't count it as break yet if checking today.
        // We check yesterday.
        if (checkDate.getTime() === today.getTime()) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue; // Check yesterday
        }
        break;
      }
    }

    setStats({
      todayMinutes: todayMins,
      weekMinutes: weekMins,
      monthMinutes: monthMins,
      breakMinutesWeek: breakWeek,
      streak: currentStreak
    });
  }, [sessions]);

  const [editableSettings, setEditableSettings] = useState<FocusSettings>({
    workDuration: focusSettings?.workDuration || 25,
    shortBreakDuration: focusSettings?.shortBreakDuration || 5,
    longBreakDuration: focusSettings?.longBreakDuration || 15,
    sessionsBeforeLongBreak: focusSettings?.sessionsBeforeLongBreak || 4,
  });

  const settings = editableSettings;

  const getDuration = useCallback((type: SessionType) => {
    switch (type) {
      case 'work': return settings.workDuration * 60;
      case 'short_break': return settings.shortBreakDuration * 60;
      case 'long_break': return settings.longBreakDuration * 60;
      case 'flow': return 0;
      default: return settings.workDuration * 60;
    }
  }, [settings]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getDuration(sessionType));
    }
  }, [sessionType, getDuration, isRunning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && (timeLeft > 0 || sessionType === 'flow')) {
      interval = setInterval(() => {
        if (sessionType === 'flow') {
          setTimeLeft(prev => prev + 1);
        } else {
          setTimeLeft(prev => prev - 1);
        }
      }, 1000);
    } else if (isRunning && timeLeft === 0 && sessionType !== 'flow') {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, sessionType]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    if (soundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => { });
    }

    const duration = sessionType === 'flow' ? Math.floor(timeLeft / 60) :
      sessionType === 'work' ? settings.workDuration :
        sessionType === 'short_break' ? settings.shortBreakDuration :
          settings.longBreakDuration;

    await createSession({
      duration_minutes: duration,
      session_type: sessionType,
      completed: true,
      project_id: null,
      task_id: null,
      ended_at: new Date().toISOString(),
      started_at: new Date(Date.now() - duration * 60000).toISOString(),
      interruptions_count: 0
    });

    if (sessionType === 'work' || sessionType === 'flow') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      toast.success('Focus session complete!');
      setSessionType(newSessionsCompleted % settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break');
      fetchSessions(); // Refresh stats
    } else {
      toast.success('Break complete!');
      setSessionType('work');
      fetchSessions(); // Refresh stats
    }
    onComplete();
  };

  const handleSaveSettings = async () => {
    if (!user) {
      toast.error('Please log in to save settings');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          focus_settings: editableSettings as any
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Timer settings saved!');
      setShowSettings(false);
      if (!isRunning) {
        setTimeLeft(getDuration(sessionType));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (sessionType === 'flow') return 100;
    const total = getDuration(sessionType);
    return ((total - timeLeft) / total) * 100;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(sessionType === 'flow' ? 0 : getDuration(sessionType));
  };

  const config = sessionConfig[sessionType];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8 pt-16 lg:pt-8"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-center gap-2 mb-8"
      >
        {(Object.keys(sessionConfig) as SessionType[]).map((type) => {
          const cfg = sessionConfig[type];
          const TypeIcon = cfg.icon;
          return (
            <motion.button
              key={type}
              onClick={() => { setSessionType(type); setIsRunning(false); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2",
                sessionType === type
                  ? `bg-gradient-to-r ${cfg.color} text-white shadow-lg`
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              <TypeIcon className="w-4 h-4" />
              {cfg.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Selectors Removed per user request */}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative mb-8 md:mb-12"
      >
        <div className={cn(
          "absolute inset-0 rounded-full blur-3xl opacity-30 bg-gradient-to-r",
          config.color
        )} />

        <svg className="w-56 h-56 md:w-72 md:h-72 transform -rotate-90 relative">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-secondary"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="url(#gradient)"
            strokeWidth="6"
            fill="none"
            strokeDasharray={854}
            initial={{ strokeDashoffset: 854 }}
            animate={{ strokeDashoffset: sessionType === 'flow' ? 0 : 854 - (854 * getProgress()) / 100 }}
            strokeLinecap="round"
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={timeLeft}
            className="font-mono text-5xl md:text-6xl font-bold text-foreground tabular-nums"
          >
            {formatTime(timeLeft)}
          </motion.div>
          <span className="text-sm text-muted-foreground mt-2 uppercase tracking-wider flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {config.label}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 mb-8"
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="w-12 h-12 rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsRunning(!isRunning)}
            size="lg"
            className={cn(
              "w-20 h-20 rounded-full shadow-2xl bg-gradient-to-r transition-all duration-300",
              config.color,
              isRunning && "animate-pulse ring-4 ring-primary/20"
            )}
          >
            {isRunning ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-12 h-12 rounded-full"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 mb-6"
      >
        {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              i < (sessionsCompleted % settings.sessionsBeforeLongBreak)
                ? "bg-primary"
                : "bg-secondary"
            )}
          />
        ))}
      </motion.div>

      <div className="text-muted-foreground text-sm mt-2">
        Sessions completed: <span className="text-foreground font-bold">{sessionsCompleted}</span>
      </div>

      {/* Stats Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 w-full max-w-2xl"
      >
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {Math.round(stats.weekMinutes / 60 * 10) / 10}h
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Focus (Week)</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            {Math.round(stats.monthMinutes / 60 * 10) / 10}h
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Focus (Month)</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            {Math.round(stats.breakMinutesWeek)}m
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Breaks (Week)</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {stats.streak} <span className="text-sm font-normal text-muted-foreground">days</span>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Current Streak</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          variant="ghost"
          className="mt-8"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Timer Settings
        </Button>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mt-4 p-6 bg-card border border-border rounded-xl w-full max-w-md shadow-xl z-10"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-semibold text-foreground">Edit Timer Settings</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workDuration" className="text-sm text-muted-foreground">Focus (min)</Label>
                  <Input
                    id="workDuration"
                    type="number"
                    min={1} max={120}
                    value={editableSettings.workDuration}
                    onChange={(e) => setEditableSettings(p => ({ ...p, workDuration: parseInt(e.target.value) || 1 }))}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortBreak" className="text-sm text-muted-foreground">Short Break</Label>
                  <Input
                    id="shortBreak"
                    type="number"
                    min={1} max={30}
                    value={editableSettings.shortBreakDuration}
                    onChange={(e) => setEditableSettings(p => ({ ...p, shortBreakDuration: parseInt(e.target.value) || 1 }))}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longBreak" className="text-sm text-muted-foreground">Long Break</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    min={1} max={60}
                    value={editableSettings.longBreakDuration}
                    onChange={(e) => setEditableSettings(p => ({ ...p, longBreakDuration: parseInt(e.target.value) || 1 }))}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessions" className="text-sm text-muted-foreground">Sessions/Cycle</Label>
                  <Input
                    id="sessions"
                    type="number"
                    min={1} max={10}
                    value={editableSettings.sessionsBeforeLongBreak}
                    onChange={(e) => setEditableSettings(p => ({ ...p, sessionsBeforeLongBreak: parseInt(e.target.value) || 1 }))}
                    className="bg-secondary"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full mt-4 bg-gradient-to-r from-primary to-accent"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FocusMode;
