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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';

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
  const { createSession } = useFocusSessions();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState((focusSettings?.workDuration || 25) * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('unassigned');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('unassigned');

  // Filter tasks based on selected project
  const availableTasks = selectedProjectId && selectedProjectId !== 'unassigned'
    ? tasks.filter((t) => t.project_id === selectedProjectId && t.status !== 'done')
    : tasks.filter((t) => t.status !== 'done');

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
      project_id: selectedProjectId === 'unassigned' ? null : selectedProjectId,
      task_id: selectedTaskId === 'unassigned' ? null : selectedTaskId,
      ended_at: new Date().toISOString(),
      started_at: new Date(Date.now() - duration * 60000).toISOString(),
      interruptions_count: 0
    });

    if (sessionType === 'work' || sessionType === 'flow') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      toast.success('Focus session complete!');
      setSessionType(newSessionsCompleted % settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break');
    } else {
      toast.success('Break complete!');
      setSessionType('work');
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
          focus_settings: editableSettings
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

      {(sessionType === 'work' || sessionType === 'flow') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-md"
        >
          <div className="flex-1">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isRunning}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No Project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={isRunning}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Task" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No Task</SelectItem>
                {availableTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2 truncate">
                      {t.priority === 'urgent' && <span className="text-red-500">!</span>}
                      <span className="truncate">{t.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}

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

      <p className="text-muted-foreground text-sm">
        Sessions completed: <span className="text-foreground font-bold">{sessionsCompleted}</span>
      </p>

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
