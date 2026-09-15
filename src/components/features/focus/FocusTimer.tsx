import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { FocusSettings } from '@/lib/types';
import {
  createFocusSession,
  completeFocusSession,
  cancelFocusSession,
  logCompletedFocusSession,
  fetchRecentFocusSessions,
  fetchWeeklyFocusStats,
  fetchActiveFocusSession,
  getLocalActiveTimer,
  setLocalActiveTimer,
} from '@/services/focusService';
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
  const targetEndTimeRef = useRef<number>(0);

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

  // Load backend stats (without deleting active uncompleted sessions)
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
      targetEndTimeRef.current = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (user) {
        setLocalActiveTimer(user.id, null);
      }
    },
    [getDurationForType, user]
  );

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    targetEndTimeRef.current = 0;

    try {
      playAlertSound(selectedAlertSound);
    } catch (e) {
      console.error(e);
    }

    if (user) {
      setLocalActiveTimer(user.id, null);
    }

    if (sessionType === 'focus') {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#34d399', '#3b82f6', '#10b981'],
        });
      } catch {
        // Confetti fallback
      }

      if (activeSessionId && user) {
        const elapsed = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000)) || settings.workDuration;
        await completeFocusSession(activeSessionId, user.id, elapsed);
        setActiveSessionId(null);
      } else if (user) {
        await logCompletedFocusSession(user.id, settings.workDuration, 'work');
      }
      setSessionCount((prev) => prev + 1);
      await loadData();
      toast.success('🔥 Focus session complete!', {
        description: `${settings.workDuration} minutes of deep focus logged to database.`,
      });

      const nextBreak: FocusSessionType =
        (sessionCount + 1) % settings.sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break';
      switchSessionType(nextBreak);
    } else {
      toast.success('☕ Break over! Time to lock in.');
      switchSessionType('focus');
    }
  }, [sessionType, selectedAlertSound, activeSessionId, user, sessionCount, settings, switchSessionType, loadData]);

  const handleCompleteEarly = useCallback(async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    targetEndTimeRef.current = 0;

    const elapsedSecs = totalTime - timeLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSecs / 60));

    if (user) {
      setLocalActiveTimer(user.id, null);
    }

    if (activeSessionId && user) {
      await completeFocusSession(activeSessionId, user.id, elapsedMinutes);
      setActiveSessionId(null);
    } else if (user) {
      await logCompletedFocusSession(user.id, elapsedMinutes, 'work');
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#34d399', '#3b82f6', '#10b981'],
      });
    } catch {
      // Confetti fallback
    }

    setSessionCount((prev) => prev + 1);
    await loadData();
    toast.success('🎯 Focus session logged early!', {
      description: `${elapsedMinutes} minute${elapsedMinutes > 1 ? 's' : ''} saved to database.`,
    });

    const dur = getDurationForType(sessionType);
    setTimeLeft(dur);
    setTotalTime(dur);
  }, [totalTime, timeLeft, activeSessionId, user, sessionType, getDurationForType, loadData]);

  // 1. Cross-Device & Cross-Tab Persistence: Restore Active Timer on Mount
  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    const restoreSession = async () => {
      // Step A: Fast restoration from localStorage (instant, zero flicker)
      const local = getLocalActiveTimer(user.id);
      if (local && isSubscribed) {
        if (local.isRunning && local.targetEndTime > 0) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((local.targetEndTime - now) / 1000));
          if (remaining > 0) {
            setSessionType(local.sessionType);
            setTotalTime(local.totalDurationSeconds);
            setTimeLeft(remaining);
            setIsRunning(true);
            setActiveSessionId(local.sessionId || null);
            targetEndTimeRef.current = local.targetEndTime;
            sessionStartRef.current = local.startTime || (now - (local.totalDurationSeconds - remaining) * 1000);
          } else {
            // Expired while offline
            setLocalActiveTimer(user.id, null);
          }
        } else if (!local.isRunning && local.remainingSeconds > 0) {
          // Paused session
          setSessionType(local.sessionType);
          setTotalTime(local.totalDurationSeconds);
          setTimeLeft(local.remainingSeconds);
          setIsRunning(false);
          setActiveSessionId(local.sessionId || null);
        }
      }

      // Step B: Cross-device Cloud Check from Supabase (mobile / other tab)
      try {
        const cloudSession = await fetchActiveFocusSession(user.id);
        if (cloudSession && cloudSession.started_at && isSubscribed) {
          const startedAtMs = new Date(cloudSession.started_at).getTime();
          const durationSecs = (cloudSession.duration_minutes || settings.workDuration) * 60;
          const targetEndMs = startedAtMs + durationSecs * 1000;
          const now = Date.now();
          const remainingSecs = Math.max(0, Math.ceil((targetEndMs - now) / 1000));

          if (remainingSecs > 0) {
            const mappedType: FocusSessionType =
              cloudSession.session_type === 'short_break'
                ? 'short_break'
                : cloudSession.session_type === 'long_break'
                ? 'long_break'
                : 'focus';

            setSessionType(mappedType);
            setTotalTime(durationSecs);
            setTimeLeft(remainingSecs);
            setIsRunning(true);
            setActiveSessionId(cloudSession.id);
            targetEndTimeRef.current = targetEndMs;
            sessionStartRef.current = startedAtMs;

            setLocalActiveTimer(user.id, {
              sessionId: cloudSession.id,
              sessionType: mappedType,
              totalDurationSeconds: durationSecs,
              remainingSeconds: remainingSecs,
              targetEndTime: targetEndMs,
              startTime: startedAtMs,
              isRunning: true,
            });
          } else {
            // Elapse occurred on another device
            await completeFocusSession(cloudSession.id, user.id, cloudSession.duration_minutes || settings.workDuration);
            setLocalActiveTimer(user.id, null);
            await loadData();
          }
        }
      } catch (err) {
        console.warn('[FocusTimer] Cloud active session check failed:', err);
      }
    };

    restoreSession();

    return () => {
      isSubscribed = false;
    };
  }, [user, settings.workDuration, loadData]);

  // 2. Rock-Solid Wall-Clock Countdown & Visibility/Focus Sync
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const checkWallClock = () => {
      if (targetEndTimeRef.current <= 0) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        handleSessionComplete();
      }
    };

    // Check every 500ms for continuous accuracy
    intervalRef.current = setInterval(checkWallClock, 500);

    // Sync IMMEDIATELY whenever user switches tabs or returns from background
    const handleSyncOnReturn = () => {
      if (document.visibilityState === 'visible') {
        checkWallClock();
      }
    };

    document.addEventListener('visibilitychange', handleSyncOnReturn);
    window.addEventListener('focus', checkWallClock);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleSyncOnReturn);
      window.removeEventListener('focus', checkWallClock);
    };
  }, [isRunning, handleSessionComplete]);

  // 3. Live Browser Tab Title with Remaining Focus Time
  useEffect(() => {
    if (isRunning) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      document.title = `(${formatted}) Kiden Focus`;
    } else {
      document.title = 'Kiden Hub';
    }
  }, [isRunning, timeLeft]);

  // Handlers for Start, Pause, Reset, Skip
  const handleStart = async () => {
    const now = Date.now();
    const durationSecs = timeLeft;
    const targetEnd = now + durationSecs * 1000;
    targetEndTimeRef.current = targetEnd;
    sessionStartRef.current = now;

    let sId = activeSessionId;
    if (sessionType === 'focus' && user && !sId) {
      const plannedMinutes = Math.max(1, Math.round(totalTime / 60));
      const session = await createFocusSession(user.id, {
        session_type: 'work',
        duration_minutes: plannedMinutes,
        completed: false,
      });
      if (session) {
        sId = session.id;
        setActiveSessionId(session.id);
      }
    }

    if (user) {
      setLocalActiveTimer(user.id, {
        sessionId: sId || undefined,
        sessionType,
        totalDurationSeconds: totalTime,
        remainingSeconds: durationSecs,
        targetEndTime: targetEnd,
        startTime: now,
        isRunning: true,
      });
    }

    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    targetEndTimeRef.current = 0;

    if (user) {
      setLocalActiveTimer(user.id, {
        sessionId: activeSessionId || undefined,
        sessionType,
        totalDurationSeconds: totalTime,
        remainingSeconds: timeLeft,
        targetEndTime: 0,
        startTime: sessionStartRef.current,
        isRunning: false,
      });
    }
  };

  const handleReset = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    targetEndTimeRef.current = 0;

    if (user) {
      setLocalActiveTimer(user.id, null);
      if (activeSessionId) {
        await cancelFocusSession(activeSessionId, user.id);
        setActiveSessionId(null);
      }
    }
    const dur = getDurationForType(sessionType);
    setTimeLeft(dur);
    setTotalTime(dur);
  };

  const handleSkip = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    targetEndTimeRef.current = 0;

    if (user) {
      setLocalActiveTimer(user.id, null);
      if (activeSessionId) {
        await cancelFocusSession(activeSessionId, user.id);
        setActiveSessionId(null);
      }
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

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayMinutes = weeklyStats.find((s) => s.date === todayKey)?.total_minutes || 0;
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
                onCompleteEarly={handleCompleteEarly}
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
