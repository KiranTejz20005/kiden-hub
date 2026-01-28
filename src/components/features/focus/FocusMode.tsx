import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FocusSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, RotateCcw, Settings, Volume2, VolumeX,
  Coffee, Zap, Moon, X, Save, Music, Palette, Maximize2, Minimize2,
  Home, Edit3, Image as ImageIcon, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useFocusSessions } from '@/hooks/useFocusSessions';

// --- Types & Config ---

interface FocusModeProps {
  focusSettings?: FocusSettings;
  onComplete: () => void;
}

type SessionType = 'work' | 'short_break' | 'long_break' | 'flow';

const sessionConfig = {
  work: { label: 'Focus', icon: Zap, color: 'text-white' },
  short_break: { label: 'Short Break', icon: Coffee, color: 'text-amber-300' },
  long_break: { label: 'Long Break', icon: Moon, color: 'text-violet-300' },
  flow: { label: 'Flow Mode', icon: Zap, color: 'text-cyan-300' }
};

const THEMES = [
  {
    id: 'kiden',
    name: 'Kiden Aura',
    class: 'bg-gradient-to-br from-emerald-900 via-gray-900 to-black',
    textColor: 'text-white'
  },
  {
    id: 'lofi_cafe',
    name: 'Lofi Cafe',
    class: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-900 via-stone-900 to-black',
    textColor: 'text-orange-50'
  },
  {
    id: 'deep_forest',
    name: 'Deep Forest',
    class: 'bg-gradient-to-b from-green-950 via-teal-950 to-slate-950',
    textColor: 'text-emerald-50'
  },
  {
    id: 'midnight_rain',
    name: 'Midnight Rain',
    class: 'bg-gradient-to-tr from-slate-900 via-purple-950 to-slate-900',
    textColor: 'text-indigo-50'
  },
  {
    id: 'sunset_vibes',
    name: 'Sunset Vibes',
    class: 'bg-gradient-to-bl from-rose-900 via-amber-900 to-purple-900',
    textColor: 'text-rose-50'
  },
];

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'Silent', src: '' },
  { id: 'rain', label: 'Rain', src: '/sounds/rain.mp3' },
  { id: 'brown_noise', label: 'Brown Noise', src: '/sounds/brown_noise.mp3' },
  { id: 'fireplace', label: 'Fireplace', src: '/sounds/fireplace.mp3' },
  { id: 'ocean', label: 'Ocean', src: '/sounds/ocean.mp3' },
  { id: 'piano', label: 'Soft Piano', src: '/sounds/piano.mp3' },
];

const QUOTES = [
  "The will to win, begins within.",
  "Every day is another chance to change your story.",
  "Deep work is the superpower of the 21st century.",
  "Focus on being productive instead of busy.",
  "Starve your distractions, feed your focus."
];

// --- Helper Components ---

const DockItem = ({ onClick, active, icon: Icon, label, className }: any) => (
  <motion.button
    whileHover={{ y: -5, scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all",
      active ? "bg-white/20 text-white shadow-lg" : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white",
      className
    )}
  >
    <Icon className="w-5 h-5" />
    {label && (
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black/80 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
        {label}
      </span>
    )}
  </motion.button>
);

// --- Main Component ---

const FocusMode = ({ focusSettings, onComplete }: FocusModeProps) => {
  const { user } = useAuth();
  const { createSession, sessions, fetchSessions } = useFocusSessions();

  // Lazy load state to prevent flashes
  const getSavedState = () => {
    try {
      return JSON.parse(localStorage.getItem('kiden_focus_state') || '{}');
    } catch { return {}; }
  };

  const savedState = getSavedState();

  // --- State ---
  const [sessionType, setSessionType] = useState<SessionType>(savedState.sessionType || 'work');

  const [editableSettings, setEditableSettings] = useState<FocusSettings>({
    workDuration: focusSettings?.workDuration || 25,
    shortBreakDuration: focusSettings?.shortBreakDuration || 5,
    longBreakDuration: focusSettings?.longBreakDuration || 15,
    sessionsBeforeLongBreak: focusSettings?.sessionsBeforeLongBreak || 4,
  });

  const getDuration = useCallback((type: SessionType) => {
    switch (type) {
      case 'work': return editableSettings.workDuration * 60;
      case 'short_break': return editableSettings.shortBreakDuration * 60;
      case 'long_break': return editableSettings.longBreakDuration * 60;
      case 'flow': return 0; // Starts at 0, counts up
      default: return editableSettings.workDuration * 60;
    }
  }, [editableSettings]);

  // Timer State (Lazy Init)
  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedState.timeLeft !== undefined) return savedState.timeLeft;
    return (focusSettings?.workDuration || 25) * 60;
  });

  const [isRunning, setIsRunning] = useState(false); // Default to paused to avoid jarring start on reload
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [focusTask, setFocusTask] = useState(savedState.focusTask || '');
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Audio State
  const [currentSound, setCurrentSound] = useState(savedState.currentSound || AMBIENT_SOUNDS[0].id);
  const [volume, setVolume] = useState(savedState.volume || 0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Appearance State
  const [currentTheme, setCurrentTheme] = useState(savedState.currentTheme || THEMES[0].id);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  // --- Persistence Logic ---
  useEffect(() => {
    const state = {
      currentTheme,
      currentSound,
      volume,
      timeLeft,
      isRunning,
      sessionType,
      focusTask
    };
    localStorage.setItem('kiden_focus_state', JSON.stringify(state));
  }, [currentTheme, currentSound, volume, timeLeft, isRunning, sessionType, focusTask]);

  // --- Helper to save session ---
  const saveSessionRecord = async (durationMinutes: number, completed: boolean) => {
    if (durationMinutes < 1) return; // Don't save micro sessions

    await createSession({
      duration_minutes: durationMinutes,
      session_type: sessionType,
      completed: completed,
      project_id: null,
      task_id: null,
      ended_at: new Date().toISOString(),
      started_at: new Date(Date.now() - durationMinutes * 60000).toISOString(),
      interruptions_count: 0
    });
    fetchSessions(); // Refresh analytics immediately
  };

  const handleExit = async () => {
    // Smart Exit: Save progress if significant
    const totalDuration = getDuration(sessionType);
    let elapsedMinutes = 0;

    if (sessionType === 'flow') {
      elapsedMinutes = Math.floor(timeLeft / 60);
    } else {
      elapsedMinutes = Math.floor((totalDuration - timeLeft) / 60);
    }

    if (elapsedMinutes >= 1) {
      toast.promise(saveSessionRecord(elapsedMinutes, false), {
        loading: 'Saving session progress...',
        success: 'Session progress saved to Analytics',
        error: 'Could not save session'
      });
      // Tiny delay to show toast
      setTimeout(onComplete, 1000);
    } else {
      onComplete();
    }
  };

  // Stats State (Preserved)
  const [stats, setStats] = useState({
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    breakMinutesWeek: 0,
    streak: 0
  });

  // --- Helpers ---

  const activeTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
  const config = sessionConfig[sessionType];

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    new Audio('/notification.mp3').play().catch(() => { });

    const duration = sessionType === 'flow' ? Math.floor(timeLeft / 60) :
      sessionType === 'work' ? editableSettings.workDuration :
        sessionType === 'short_break' ? editableSettings.shortBreakDuration :
          editableSettings.longBreakDuration;

    await saveSessionRecord(duration, true);

    if (sessionType === 'work' || sessionType === 'flow') {
      setSessionsCompleted(prev => prev + 1);
      toast.success('Great job! Session complete.');
      setSessionType(prev => (sessionsCompleted + 1) % editableSettings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break');
    } else {
      toast.success('Break time is over!');
      setSessionType('work');
    }
  }, [timeLeft, sessionType, editableSettings, sessionsCompleted, saveSessionRecord]);

  const onCompleteRef = useRef(handleSessionComplete);
  useEffect(() => { onCompleteRef.current = handleSessionComplete; }, [handleSessionComplete]);

  // --- Effects ---

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (sessionType === 'flow') return prev + 1;
          if (prev <= 1) {
            onCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, sessionType]);


  // Audio Logic
  useEffect(() => {
    if (currentSound === 'none') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const sound = AMBIENT_SOUNDS.find(s => s.id === currentSound);
    if (!sound || !sound.src) return;

    if (!audioRef.current || audioRef.current.src !== sound.src) {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(sound.src);
      audioRef.current.loop = true;
    }

    audioRef.current.volume = volume;
    if (isRunning) audioRef.current.play().catch(() => { });
    else audioRef.current.pause();

    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, [currentSound, isRunning, volume]);


  // Stats Logic (unchanged logic from previous version)
  useEffect(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
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

    let currentStreak = 0;
    const checkDate = new Date(today);
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
        if (checkDate.getTime() === today.getTime()) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
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



  // Change Timer when session type changes (only if not running/resuming)
  // We use a ref to track if it's the initial mount to avoid resetting saved 'timeLeft'
  const isMounted = useRef(false);
  useEffect(() => {
    if (isMounted.current) {
      if (!isRunning) {
        setTimeLeft(getDuration(sessionType));
      }
    } else {
      isMounted.current = true;
    }
  }, [sessionType, getDuration, isRunning]);

  const handleSaveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles')
        .update({ focus_settings: editableSettings as any })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Settings saved');
      setShowSettings(false);
      // Update current timer if not running
      if (!isRunning) setTimeLeft(getDuration(sessionType));
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getProgress = () => {
    if (sessionType === 'flow') return 100;
    const total = getDuration(sessionType);
    return Math.max(0, Math.min(100, ((total - timeLeft) / total) * 100));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex flex-col transition-all duration-1000 bg-cover bg-center font-sans", activeTheme.class)}>

      {/* Animated Ambient Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        {/* We can add particle effects here if needed in future */}
        <div className="absolute w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Top Bar */}
      <div className="relative z-20 flex justify-between items-start p-6 md:p-10 w-full animate-fade-in">
        <div className="flex flex-col">
          <h1 className="text-2xl font-serif font-bold tracking-tight text-white drop-shadow-lg">
            Kiden<span className="text-primary">Hub</span>
          </h1>
        </div>

        <div className="hidden md:block max-w-xs text-right">
          <p className="text-lg font-medium text-white/90 leading-tight italic drop-shadow-md">
            “{quote}”
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-20 flex flex-col items-center justify-center w-full px-4">

        {/* Focus Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 w-full max-w-lg text-center"
        >
          <div className="group relative inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <span className="text-lg md:text-xl font-light">I want to focus on</span>
            <Input
              type="text"
              value={focusTask}
              onChange={(e) => setFocusTask(e.target.value)}
              placeholder="writing code..."
              className="bg-transparent border-b-2 border-white/20 focus:border-white outline-none px-2 py-1 text-lg md:text-xl font-medium placeholder:text-white/30 text-center w-48 focus:w-64 transition-all h-auto shadow-none rounded-none border-t-0 border-x-0 focus-visible:ring-0 focus-visible:bg-white/5"
            />
            <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-50" />
          </div>
        </motion.div>

        {/* Big Timer */}
        <motion.div
          layout
          className="text-center mb-10"
        >
          <span className={cn("text-[8rem] sm:text-[10rem] md:text-[12rem] font-bold tabular-nums leading-none tracking-tight drop-shadow-2xl select-none transition-colors duration-700", activeTheme.textColor)}>
            {formatTime(timeLeft)}
          </span>
        </motion.div>

        {/* Primary Controls */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex items-center gap-2 p-1 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
            {(Object.keys(sessionConfig) as SessionType[]).map(type => (
              <button
                key={type}
                onClick={() => { setSessionType(type); setIsRunning(false); }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all mr-1 last:mr-0",
                  sessionType === type
                    ? "bg-white text-black shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                {sessionConfig[type].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => { setIsRunning(false); setTimeLeft(getDuration(sessionType)); }}
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "h-16 px-12 rounded-full text-xl font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95",
                isRunning
                  ? "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                  : "bg-white text-black hover:bg-white/90"
              )}
            >
              {isRunning ? 'Pause' : 'Start'}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Floating Docks */}
      <div className="relative z-30 p-6 md:p-10 flex justify-between items-end animate-fade-up">

        {/* Left Dock: Style & Sound */}
        <div className="flex gap-3 bg-black/30 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
          <div className="relative">
            <DockItem
              icon={Music}
              active={showSoundPicker}
              onClick={() => { setShowSoundPicker(!showSoundPicker); setShowThemePicker(false); setShowSettings(false); }}
            />
            {/* Sound Picker Popup */}
            <AnimatePresence>
              {showSoundPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -12, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl origin-bottom-left"
                >
                  <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Soundscape</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {AMBIENT_SOUNDS.map(sound => (
                        <button
                          key={sound.id}
                          onClick={() => setCurrentSound(sound.id)}
                          className={cn(
                            "h-12 rounded-xl flex items-center justify-center border transition-all",
                            currentSound === sound.id
                              ? "bg-white/20 border-white text-white"
                              : "bg-white/5 border-transparent hover:bg-white/10 text-white/70"
                          )}
                          title={sound.label}
                        >
                          {sound.id === 'none' ? <VolumeX className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                    <Slider
                      value={[volume]}
                      max={1} step={0.01}
                      onValueChange={(val) => setVolume(val[0])}
                      className="[&>.relative>.absolute]:bg-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <DockItem
              icon={ImageIcon}
              active={showThemePicker}
              onClick={() => { setShowThemePicker(!showThemePicker); setShowSoundPicker(false); setShowSettings(false); }}
            />
            {/* Theme Picker Popup */}
            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -12, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl origin-bottom-left"
                >
                  <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Themes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setCurrentTheme(theme.id)}
                        className={cn(
                          "h-10 rounded-lg overflow-hidden relative border-2 transition-all",
                          currentTheme === theme.id ? "border-white" : "border-transparent opacity-80 hover:opacity-100"
                        )}
                      >
                        <div className={cn("absolute inset-0", theme.class)} />
                        <span className="relative z-10 text-[9px] font-bold text-white drop-shadow-md">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Dock: System & Settings */}
        <div className="flex gap-3 bg-black/30 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
          <DockItem icon={Home} label="Exit" onClick={handleExit} />

          <div className="relative">
            <DockItem
              icon={Settings}
              active={showSettings}
              onClick={() => { setShowSettings(!showSettings); setShowThemePicker(false); setShowSoundPicker(false); }}
            />
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -12, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full right-0 mb-2 w-72 bg-black/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl origin-bottom-right"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white">Timer Config</h3>
                    <Button size="sm" onClick={handleSaveSettings} disabled={isSaving} className="h-6 text-[10px] px-2 bg-white text-black hover:bg-white/80">
                      {isSaving ? '...' : 'Save'}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Focus</Label>
                        <Input
                          type="number"
                          className="h-8 bg-white/5 border-white/10 text-white"
                          value={editableSettings.workDuration}
                          onChange={e => setEditableSettings({ ...editableSettings, workDuration: parseInt(e.target.value) || 25 })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Break</Label>
                        <Input
                          type="number"
                          className="h-8 bg-white/5 border-white/10 text-white"
                          value={editableSettings.shortBreakDuration}
                          onChange={e => setEditableSettings({ ...editableSettings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />
          <DockItem
            icon={isFullscreen ? Minimize2 : Maximize2}
            onClick={toggleFullscreen}
          />
        </div>
      </div>

    </div>
  );
};

export default FocusMode;
