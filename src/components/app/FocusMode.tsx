import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FocusSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Coffee, Zap, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  focusSettings?: FocusSettings;
  onComplete: () => void;
}

type SessionType = 'work' | 'short_break' | 'long_break' | 'flow';

const sessionConfig = {
  work: { label: 'Focus', icon: Zap, color: 'from-primary to-accent' },
  short_break: { label: 'Short Break', icon: Coffee, color: 'from-amber to-orange-500' },
  long_break: { label: 'Long Break', icon: Moon, color: 'from-violet to-purple-600' },
  flow: { label: 'Flow Mode', icon: Zap, color: 'from-cyan to-blue-500' }
};

const FocusMode = ({ focusSettings, onComplete }: FocusModeProps) => {
  const { user } = useAuth();
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const settings = focusSettings || {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
  };

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
    setTimeLeft(getDuration(sessionType));
  }, [sessionType, getDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isRunning && timeLeft === 0 && sessionType !== 'flow') {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, sessionType]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    if (soundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    }

    if (user) {
      const duration = sessionType === 'work' ? settings.workDuration : 
                       sessionType === 'short_break' ? settings.shortBreakDuration :
                       settings.longBreakDuration;

      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        duration_minutes: duration,
        session_type: sessionType,
        completed: true,
        ended_at: new Date().toISOString(),
      });
    }

    if (sessionType === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      toast.success('Focus session complete! Time for a break.');
      setSessionType(newSessionsCompleted % settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break');
    } else {
      toast.success('Break complete! Ready for another session?');
      setSessionType('work');
    }
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (sessionType === 'flow') return 0;
    const total = getDuration(sessionType);
    return ((total - timeLeft) / total) * 100;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(sessionType));
  };

  const config = sessionConfig[sessionType];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8 pt-16 lg:pt-8"
    >
      {/* Session Type Selector */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12"
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

      {/* Timer Circle */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative mb-8 md:mb-12"
      >
        {/* Glow effect */}
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
            animate={{ strokeDashoffset: 854 - (854 * getProgress()) / 100 }}
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
          <motion.span 
            key={timeLeft}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="font-mono text-5xl md:text-6xl font-bold text-foreground"
          >
            {sessionType === 'flow' ? '∞' : formatTime(timeLeft)}
          </motion.span>
          <span className="text-sm text-muted-foreground mt-2 uppercase tracking-wider flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {config.label}
          </span>
        </div>
      </motion.div>

      {/* Controls */}
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
              "w-20 h-20 rounded-full shadow-2xl bg-gradient-to-r",
              config.color
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

      {/* Session Counter */}
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

      <p className="text-muted-foreground text-sm">
        Sessions completed: <span className="text-foreground font-bold">{sessionsCompleted}</span>
      </p>

      {/* Settings Button */}
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

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mt-4 p-4 bg-card border border-border rounded-xl max-w-sm"
        >
          <p className="text-sm text-foreground mb-2 font-medium">Current Settings</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold text-foreground">{settings.workDuration}</p>
              <p className="text-xs text-muted-foreground">Focus</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold text-foreground">{settings.shortBreakDuration}</p>
              <p className="text-xs text-muted-foreground">Short</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary">
              <p className="text-lg font-bold text-foreground">{settings.longBreakDuration}</p>
              <p className="text-xs text-muted-foreground">Long</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Edit your timer settings in your profile.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FocusMode;
