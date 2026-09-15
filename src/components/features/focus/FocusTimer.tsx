import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { FocusSettings } from '@/lib/types';
import { createFocusSession, completeFocusSession, cancelFocusSession, fetchRecentFocusSessions, fetchWeeklyFocusStats } from '@/services/focusService';
import { supabase } from '@/integrations/supabase/client';
import { playAlertSound } from '@/lib/focus/sounds';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  ExternalLink,
  Settings2,
  ArrowLeft,
} from 'lucide-react';

import { WallpaperBackground } from './components/WallpaperBackground';
import { WallpaperSelector } from './components/WallpaperSelector';
import { FocusModeView, FocusSessionType } from './components/FocusModeView';
import { HomeModeView } from './components/HomeModeView';
import { AmbientModeView } from './components/AmbientModeView';
import { StatsModeView } from './components/StatsModeView';
import { FocusBottomNav, FocusAppMode } from './components/FocusBottomNav';
import { FocusBottomLeftActions } from './components/FocusBottomLeftActions';
import { MusicPlayerModal } from './components/MusicPlayerModal';
import { NotepadDrawer } from './components/NotepadDrawer';
import { FocusSettingsModal } from './components/FocusSettingsModal';

const DEFAULT_SETTINGS: FocusSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

interface FocusTimerProps {
  isStandalone?: boolean;
  profile?: any | null;
  onExitFocus?: () => void;
}

export default function FocusTimer({ isStandalone = false, profile, onExitFocus }: FocusTimerProps) {
  const { user } = useAuth();
  const userName =
    profile?.display_name ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    (user?.email?.split('@')[0] === 'vijji1650' ? 'Kiran' : user?.email?.split('@')[0]) ||
    'Kiran';

  // Mode state: 'home' | 'focus' | 'ambient' | 'stats'
  const [appMode, setAppMode] = useState<FocusAppMode>('focus');

  // Background states with localStorage persistence
  const [wallpaperId, setWallpaperId] = useState<string>(() => {
    return localStorage.getItem('kiden_focus_wallpaper') || 'rainy-lofi-cafe';
  });
  const [wallpaperBlur, setWallpaperBlur] = useState<number>(() => {
    return parseInt(localStorage.getItem('kiden_focus_blur') || '0', 10);
  });
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(() => {
    return parseInt(localStorage.getItem('kiden_focus_opacity') || '30', 10);
  });

  // Modal states
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Timer states
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [sessionType, setSessionType] = useState<FocusSessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [totalTime, setTotalTime] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedAlertSound, setSelectedAlertSound] = useState<string>('chime');

  // Stats
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  // Sync wallpaper preferences to localStorage
  const handleSelectWallpaper = (id: string) => {
    setWallpaperId(id);
    localStorage.setItem('kiden_focus_wallpaper', id);
  };

  const handleBlurChange = (v: number) => {
    setWallpaperBlur(v);
    localStorage.setItem('kiden_focus_blur', String(v));
  };

  const handleOpacityChange = (v: number) => {
    setWallpaperOpacity(v);
    localStorage.setItem('kiden_focus_opacity', String(v));
  };

  // Load backend stats
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // Purge any stale uncompleted sessions left in database
      await supabase
        .from('focus_sessions' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('completed', false);
    } catch (e) {
      console.warn('Stale session cleanup error:', e);
    }

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

  const getDurationForType = useCallback(
    (st: FocusSessionType) => {
      if (st === 'focus') return settings.workDuration * 60;
      if (st === 'short_break') return settings.shortBreakDuration * 60;
      return settings.longBreakDuration * 60;
    },
    [settings]
  );

  const switchSessionType = useCallback(
    (st: FocusSessionType) => {
      setSessionType(st);
      const dur = getDurationForType(st);
      setTimeLeft(dur);
      setTotalTime(dur);
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [getDurationForType]
  );

  const handleSessionComplete = useCallback(async () => {
    try {
      playAlertSound(selectedAlertSound);
    } catch (e) {
      console.error(e);
    }

    if (sessionType === 'focus') {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#a78bfa', '#3b82f6', '#10b981'],
        });
      } catch {
        // Confetti fallback
      }

      if (activeSessionId && user) {
        const elapsed = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000)) || settings.workDuration;
        await completeFocusSession(activeSessionId, user.id, elapsed);
        setActiveSessionId(null);
      }
      setSessionCount((prev) => prev + 1);
      await loadData();
      toast.success('🔥 Focus session complete!', {
        description: `${settings.workDuration} minutes of deep focus logged.`,
      });

      const nextBreak: FocusSessionType =
        (sessionCount + 1) % settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      switchSessionType(nextBreak);
    } else {
      toast.success('☕ Break over! Time to lock in.');
      switchSessionType('focus');
    }
  }, [sessionType, selectedAlertSound, activeSessionId, user, sessionCount, settings, switchSessionType, loadData]);

  // Main countdown timer ticker
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
    if (!isRunning && sessionType === 'focus' && !activeSessionId && user) {
      const session = await createFocusSession(user.id, {
        session_type: 'work',
        duration_minutes: 0,
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

  const handleReset = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (activeSessionId && user) {
      await cancelFocusSession(activeSessionId, user.id);
      setActiveSessionId(null);
    }
    const dur = getDurationForType(sessionType);
    setTimeLeft(dur);
    setTotalTime(dur);
  };

  const handleSkip = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (activeSessionId && user) {
      await cancelFocusSession(activeSessionId, user.id);
      setActiveSessionId(null);
    }
    if (sessionType === 'focus') {
      const nextBreak: FocusSessionType =
        (sessionCount + 1) % settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      switchSessionType(nextBreak);
      toast('Focus session skipped');
    } else {
      switchSessionType('focus');
      toast('Break skipped');
    }
  };

  const todayMinutes = weeklyStats.find((s) => s.date === new Date().toISOString().slice(0, 10))?.total_minutes || 0;
  const weekTotal = weeklyStats.reduce((a, s) => a + (s.total_minutes || 0), 0);

  return (
    <div
      className={
        isStandalone
          ? "fixed inset-0 w-screen h-screen z-50 overflow-hidden flex flex-col select-none bg-black"
          : "relative w-full h-full flex-1 overflow-hidden flex flex-col select-none min-h-[calc(100vh-20px)] bg-black"
      }
    >
      {/* ── Background Wallpapers & Atmosphere ── */}
      <WallpaperBackground
        wallpaperId={wallpaperId}
        blur={wallpaperBlur}
        opacity={wallpaperOpacity}
      />

      {/* ── Top Header Navigation Bar ── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Exit Focus Mode Button */}
          {onExitFocus && (
            <button
              onClick={onExitFocus}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white backdrop-blur-xl text-xs font-semibold shadow-md transition-all active:scale-95 group"
              title="Exit focus mode and return to dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Exit Focus</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Pop-out button (only shown when not already standalone) */}
          {!isStandalone && (
            <button
              onClick={() => window.open('/focus', '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/15 backdrop-blur-xl text-xs font-semibold shadow-lg transition-all active:scale-95"
              title="Pop out into an exclusive new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white/70" />
              <span>Pop Out</span>
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-xl shadow-lg transition-all active:scale-95"
            title="Timer Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main View Content ── */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {appMode === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <HomeModeView userName={userName} />
            </motion.div>
          )}

          {appMode === 'focus' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <FocusModeView
                timeLeft={timeLeft}
                totalTime={totalTime}
                isRunning={isRunning}
                sessionType={sessionType}
                sessionCount={sessionCount}
                longBreakInterval={settings.sessionsBeforeLongBreak}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
                onSkip={handleSkip}
                onSwitchType={switchSessionType}
              />
            </motion.div>
          )}

          {appMode === 'ambient' && (
            <motion.div
              key="ambient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <AmbientModeView />
            </motion.div>
          )}

          {appMode === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              <StatsModeView
                todayMinutes={todayMinutes}
                weekTotal={weekTotal}
                sessionCount={sessionCount}
                weeklyStats={weeklyStats}
                recentSessions={recentSessions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Floating Dock at Bottom ── */}
      <footer className="absolute bottom-5 inset-x-0 z-30 flex items-center justify-between px-6 pointer-events-none">
        <div className="pointer-events-auto">
          <FocusBottomLeftActions
            onToggleMusic={() => setIsMusicOpen(!isMusicOpen)}
            isMusicOpen={isMusicOpen}
            onOpenWallpapers={() => setIsWallpaperModalOpen(true)}
            onToggleNotepad={() => setIsNotepadOpen(!isNotepadOpen)}
            isNotepadOpen={isNotepadOpen}
          />
        </div>

        <div className="pointer-events-auto">
          <FocusBottomNav
            currentMode={appMode}
            onSelectMode={setAppMode}
            streak={1}
          />
        </div>
      </footer>

      {/* ── Modals & Drawers ── */}
      <WallpaperSelector
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        currentId={wallpaperId}
        onSelect={handleSelectWallpaper}
        blur={wallpaperBlur}
        onBlurChange={handleBlurChange}
        opacity={wallpaperOpacity}
        onOpacityChange={handleOpacityChange}
      />

      <MusicPlayerModal
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
      />

      <NotepadDrawer
        isOpen={isNotepadOpen}
        onClose={() => setIsNotepadOpen(false)}
      />

      <FocusSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        selectedAlertSound={selectedAlertSound}
        onSelectAlertSound={setSelectedAlertSound}
      />
    </div>
  );
}
