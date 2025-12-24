import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FocusSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

interface FocusModeProps {
  focusSettings?: FocusSettings;
  onComplete: () => void;
}

type SessionType = 'work' | 'short_break' | 'long_break' | 'flow';

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
      case 'work':
        return settings.workDuration * 60;
      case 'short_break':
        return settings.shortBreakDuration * 60;
      case 'long_break':
        return settings.longBreakDuration * 60;
      case 'flow':
        return 0; // Infinite
      default:
        return settings.workDuration * 60;
    }
  }, [settings]);

  useEffect(() => {
    setTimeLeft(getDuration(sessionType));
  }, [sessionType, getDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0 && sessionType !== 'flow') {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, sessionType]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    if (soundEnabled) {
      // Play completion sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    }

    // Save session to database
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

      if (newSessionsCompleted % settings.sessionsBeforeLongBreak === 0) {
        setSessionType('long_break');
      } else {
        setSessionType('short_break');
      }
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8">
      {/* Session Type Selector */}
      <div className="flex gap-2 mb-12">
        {(['work', 'short_break', 'long_break', 'flow'] as SessionType[]).map((type) => (
          <button
            key={type}
            onClick={() => {
              setSessionType(type);
              setIsRunning(false);
            }}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              sessionType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {type === 'work' && 'Focus'}
            {type === 'short_break' && 'Short Break'}
            {type === 'long_break' && 'Long Break'}
            {type === 'flow' && 'Flow Mode'}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative mb-12">
        <svg className="w-72 h-72 transform -rotate-90">
          <circle
            cx="144"
            cy="144"
            r="136"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-secondary"
          />
          <motion.circle
            cx="144"
            cy="144"
            r="136"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-primary"
            strokeDasharray={854}
            strokeDashoffset={854 - (854 * getProgress()) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-6xl text-foreground">
            {sessionType === 'flow' ? '∞' : formatTime(timeLeft)}
          </span>
          <span className="text-sm text-muted-foreground mt-2 uppercase tracking-wider">
            {sessionType.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="w-12 h-12 rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => setIsRunning(!isRunning)}
          size="lg"
          className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90"
        >
          {isRunning ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-12 h-12 rounded-full"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Session Counter */}
      <p className="text-muted-foreground">
        Sessions completed: <span className="text-foreground font-bold">{sessionsCompleted}</span>
      </p>

      {/* Settings Button */}
      <Button
        variant="ghost"
        className="mt-8"
        onClick={() => setShowSettings(!showSettings)}
      >
        <Settings className="w-4 h-4 mr-2" />
        Timer Settings
      </Button>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-card border border-border rounded-xl"
        >
          <p className="text-sm text-muted-foreground mb-2">
            Current settings: {settings.workDuration}min work / {settings.shortBreakDuration}min short / {settings.longBreakDuration}min long
          </p>
          <p className="text-xs text-muted-foreground">
            Edit your timer settings in your profile to customize durations.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default FocusMode;