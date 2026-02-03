import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
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
  Home, Edit3, Image as ImageIcon, LayoutGrid, Wind, Sparkles, Brain
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
  work: { label: 'Focus', icon: Zap, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  short_break: { label: 'Short Break', icon: Coffee, color: 'text-amber-300', glow: 'shadow-amber-500/20' },
  long_break: { label: 'Long Break', icon: Moon, color: 'text-violet-400', glow: 'shadow-violet-500/20' },
  flow: { label: 'Flow Mode', icon: Wind, color: 'text-cyan-400', glow: 'shadow-cyan-500/20' }
};

const THEMES = [
  {
    id: 'kiden',
    name: 'Kiden Aura',
    class: 'bg-gradient-to-br from-emerald-950 via-slate-950 to-black',
    accent: 'emerald',
    textColor: 'text-emerald-50'
  },
  {
    id: 'lofi_cafe',
    name: 'Lofi Cafe',
    class: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-950 via-stone-950 to-black',
    accent: 'orange',
    textColor: 'text-orange-50'
  },
  {
    id: 'deep_forest',
    name: 'Deep Forest',
    class: 'bg-gradient-to-b from-green-950 via-teal-950 to-slate-950',
    accent: 'green',
    textColor: 'text-emerald-50'
  },
  {
    id: 'midnight_rain',
    name: 'Midnight Rain',
    class: 'bg-gradient-to-tr from-slate-950 via-purple-950 to-slate-950',
    accent: 'purple',
    textColor: 'text-indigo-50'
  },
  {
    id: 'cyber_noir',
    name: 'Cyber Noir',
    class: 'bg-gradient-to-br from-blue-950 via-gray-950 to-black',
    accent: 'blue',
    textColor: 'text-blue-50'
  },
];

const AMBIENT_SOUNDS = [
  { id: 'none', label: 'Silent', src: '' },
  { id: 'rain', label: 'Soft Rain', src: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_9de8a63f6a.mp3?filename=soft-rain-ambient-111154.mp3' },
  { id: 'brown_noise', label: 'Deep Focus', src: 'https://www.soundjay.com/misc/sounds/brown-noise-01.mp3' },
  { id: 'ocean', label: 'Ocean Waves', src: 'https://www.soundjay.com/nature/ocean-waves-1.mp3' },
  { id: 'forest', label: 'Forest Night', src: 'https://www.soundjay.com/nature/sounds/cricket-chirping-1.mp3' },
];

const QUOTES = [
  "Deep work is the superpower of the 21st century.",
  "Starve your distractions, feed your focus.",
  "The will to win, begins within.",
  "Focus on being productive instead of busy.",
  "Your attention is your most valuable asset."
];

// --- Helper Components ---

const CircularProgress = ({ progress, colorClass, isRunning }: { progress: number; colorClass: string; isRunning: boolean }) => {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className="stroke-white/5 fill-transparent"
          strokeWidth="8"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="50%"
          cy="50%"
          r={radius}
          className={cn("fill-transparent transition-all duration-1000 ease-linear", colorClass)}
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          strokeLinecap="round"
        />
      </svg>
      {/* Breathing Glow */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={cn("absolute inset-0 rounded-full blur-3xl -z-10", colorClass.replace('stroke-', 'bg-'))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const DockItem = ({ onClick, active, icon: Icon, label, className }: any) => (
  <motion.button
    whileHover={{ y: -5, scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all",
      active ? "bg-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white",
      className
    )}
  >
    <Icon className="w-5 h-5" />
    {label && (
      <span className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all bg-black/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10">
        {label}
      </span>
    )}
  </motion.button>
);

// --- Main Component ---

const FocusMode = ({ focusSettings, onComplete }: FocusModeProps) => {
  const { user } = useAuth();
  const { createSession, sessions, fetchSessions } = useFocusSessions();

  // Load state from local storage
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem('flowcus_state');
      return saved ? JSON.parse(saved) : {};
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
      case 'flow': return 0;
      default: return 25 * 60;
    }
  }, [editableSettings]);

  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedState.timeLeft !== undefined && savedState.sessionType === (savedState.sessionType || 'work')) return savedState.timeLeft;
    return getDuration(savedState.sessionType || 'work');
  });

  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(savedState.sessionsCompleted || 0);
  const [focusTask, setFocusTask] = useState(savedState.focusTask || '');
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Audio State
  const [currentSound, setCurrentSound] = useState(savedState.currentSound || 'none');
  const [volume, setVolume] = useState(savedState.volume || 0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Appearance State
  const [currentTheme, setCurrentTheme] = useState(savedState.currentTheme || THEMES[0].id);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Persistence
  useEffect(() => {
    const state = {
      currentTheme,
      currentSound,
      volume,
      timeLeft,
      sessionType,
      focusTask,
      sessionsCompleted
    };
    localStorage.setItem('flowcus_state', JSON.stringify(state));
  }, [currentTheme, currentSound, volume, timeLeft, sessionType, focusTask, sessionsCompleted]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (sessionType === 'flow') return prev + 1;
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, sessionType]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning(prev => !prev);
      } else if (e.code === 'KeyR') {
        handleReset();
      } else if (e.code === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, timeLeft, sessionType]);

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    // Play notification sound
    const notification = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    notification.volume = 0.5;
    notification.play().catch(() => { });

    const duration = sessionType === 'flow' ? Math.floor(timeLeft / 60) :
      sessionType === 'work' ? editableSettings.workDuration :
        sessionType === 'short_break' ? editableSettings.shortBreakDuration :
          editableSettings.longBreakDuration;

    await createSession({
      duration_minutes: duration,
      session_type: sessionType,
      completed: true,
      started_at: new Date(Date.now() - duration * 60000).toISOString(),
      ended_at: new Date().toISOString(),
    });

    if (sessionType === 'work' || sessionType === 'flow') {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);
      toast.success('Session completed! Time for a break.');
      if (newCount % editableSettings.sessionsBeforeLongBreak === 0) {
        setSessionType('long_break');
      } else {
        setSessionType('short_break');
      }
    } else {
      toast.info('Break finished. Ready to focus?');
      setSessionType('work');
    }
    setTimeLeft(getDuration(sessionType === 'work' ? 'work' : sessionType));
  }, [timeLeft, sessionType, editableSettings, sessionsCompleted, createSession, getDuration]);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(sessionType));
  };

  const handleExit = async () => {
    if (isRunning) {
      const elapsed = sessionType === 'flow' ? timeLeft : (getDuration(sessionType) - timeLeft);
      const mins = Math.floor(elapsed / 60);
      if (mins >= 1) {
        await createSession({
          duration_minutes: mins,
          session_type: sessionType,
          completed: false,
          started_at: new Date(Date.now() - elapsed * 1000).toISOString(),
          ended_at: new Date().toISOString(),
        });
      }
    }
    onComplete();
  };

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

  const activeTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
  const config = sessionConfig[sessionType];

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex flex-col overflow-hidden transition-all duration-1000", activeTheme.class)}>

      {/* Background Parallax Layer */}
      <motion.div
        className="absolute inset-0 opacity-30 pointer-events-none"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          scale: 1.05
        }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
      </motion.div>

      {/* Top Branding */}
      <div className="relative z-20 flex justify-between items-center p-8 md:p-12 w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Flowcus <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 bg-white/10 rounded-full border border-white/5 opacity-70">Beta</span>
            </h1>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">By KidenHub</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block max-w-sm text-right"
        >
          <p className="text-sm font-serif italic text-white/50 leading-relaxed">
            "{quote}"
          </p>
        </motion.div>
      </div>

      {/* Main Focus Area */}
      <div className="flex-1 relative z-20 flex flex-col items-center justify-center -mt-12">

        {/* Task Input */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 relative"
        >
          <div className="flex flex-col items-center gap-2 group">
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Current Focus</span>
            <div className="relative flex items-center">
              <Input
                type="text"
                value={focusTask}
                onChange={(e) => setFocusTask(e.target.value)}
                placeholder="What are we achieving?"
                className="bg-transparent border-none text-2xl md:text-3xl font-medium text-center placeholder:text-white/10 focus-visible:ring-0 w-[300px] md:w-[450px] transition-all"
              />
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ opacity: focusTask ? 1 : 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Immersive Timer */}
        <div className="relative group cursor-pointer" onClick={() => setIsRunning(!isRunning)}>
          <CircularProgress
            progress={getProgress()}
            colorClass={isRunning ? `stroke-${activeTheme.accent}-500` : 'stroke-white/20'}
            isRunning={isRunning}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              animate={{
                scale: isRunning ? [1, 1.02, 1] : 1,
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <span className={cn(
                "text-[7rem] md:text-[9rem] font-bold tabular-nums leading-none tracking-tighter drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-colors duration-1000",
                isRunning ? activeTheme.textColor : 'text-white/80'
              )}>
                {formatTime(timeLeft)}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", isRunning ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-white/20")} />
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-white/40">
                  {config.label}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 flex flex-col items-center gap-8"
        >
          {/* Session Switcher */}
          <div className="flex p-1.5 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
            {(Object.keys(sessionConfig) as SessionType[]).map(type => (
              <button
                key={type}
                onClick={() => { setSessionType(type); setIsRunning(false); setTimeLeft(getDuration(type)); }}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  sessionType === type
                    ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {sessionConfig[type].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handleReset}
              className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10 flex items-center justify-center"
              title="Reset (R)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "h-20 px-16 rounded-[2rem] text-xl font-bold transition-all shadow-2xl flex items-center gap-4",
                isRunning
                  ? "bg-white/10 text-white border border-white/20 backdrop-blur-xl"
                  : "bg-white text-black"
              )}
            >
              {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              {isRunning ? 'Pause' : 'Start Focus'}
            </motion.button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "w-14 h-14 rounded-2xl transition-all border border-white/10 flex items-center justify-center",
                showSettings ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Persistence Dock */}
      <div className="relative z-30 p-8 flex justify-between items-end">

        {/* Left: Customization */}
        <div className="flex gap-4 p-2.5 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-3xl">
          <div className="relative">
            <DockItem
              icon={Music}
              active={showSoundPicker}
              onClick={() => { setShowSoundPicker(!showSoundPicker); setShowThemePicker(false); }}
              label="Ambiance"
            />
            <AnimatePresence>
              {showSoundPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, y: -20, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-4 w-72 bg-gray-950/90 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Soundscape</h3>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3 h-3 text-white/40" />
                      <Slider
                        value={[volume]}
                        max={1} step={0.01}
                        onValueChange={(val) => setVolume(val[0])}
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {AMBIENT_SOUNDS.map(sound => (
                      <button
                        key={sound.id}
                        onClick={() => setCurrentSound(sound.id)}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between",
                          currentSound === sound.id
                            ? "bg-white text-black"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {sound.label}
                        {currentSound === sound.id && <Sparkles className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <DockItem
              icon={Palette}
              active={showThemePicker}
              onClick={() => { setShowThemePicker(!showThemePicker); setShowSoundPicker(false); }}
              label="Atmosphere"
            />
            <AnimatePresence>
              {showThemePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, y: -20, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-4 w-64 bg-gray-950/90 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Themes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setCurrentTheme(theme.id)}
                        className={cn(
                          "group relative h-16 rounded-2xl overflow-hidden border-2 transition-all",
                          currentTheme === theme.id ? "border-white" : "border-white/5 hover:border-white/20"
                        )}
                      >
                        <div className={cn("absolute inset-0", theme.class)} />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        <span className="relative z-10 text-[9px] font-bold uppercase tracking-widest text-white drop-shadow-md">
                          {theme.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Meta Controls */}
        <div className="flex gap-4 p-2.5 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-3xl">
          <DockItem
            icon={isFullscreen ? Minimize2 : Maximize2}
            onClick={toggleFullscreen}
            label={isFullscreen ? "Minimize" : "Full Focus"}
          />
          <div className="w-[1px] h-8 bg-white/10 my-auto" />
          <DockItem
            icon={Home}
            onClick={handleExit}
            label="Exit Flowcus"
            className="hover:bg-red-500/20 hover:text-red-400"
          />
        </div>
      </div>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-gray-950 border border-white/10 rounded-[2.5rem] p-10 shadow-4xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowSettings(false)} className="text-white/20 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Settings className="w-6 h-6 text-white/60" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Focus Config</h2>
                  <p className="text-xs text-white/40 font-medium uppercase tracking-widest">Fine-tune your session</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-white/60">Focus Duration</Label>
                    <span className="text-sm font-bold text-emerald-400">{editableSettings.workDuration}m</span>
                  </div>
                  <Slider
                    value={[editableSettings.workDuration]}
                    min={1} max={120} step={1}
                    onValueChange={(val) => setEditableSettings(s => ({ ...s, workDuration: val[0] }))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-white/60">Short Break</Label>
                    <span className="text-sm font-bold text-amber-300">{editableSettings.shortBreakDuration}m</span>
                  </div>
                  <Slider
                    value={[editableSettings.shortBreakDuration]}
                    min={1} max={30} step={1}
                    onValueChange={(val) => setEditableSettings(s => ({ ...s, shortBreakDuration: val[0] }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="h-14 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => setShowSettings(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-bold"
                    onClick={() => {
                      handleReset();
                      setShowSettings(false);
                      toast.success('Session timers updated');
                    }}
                  >
                    Apply Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default FocusMode;
