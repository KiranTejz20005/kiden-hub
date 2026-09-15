import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Waves } from 'lucide-react';
import { AMBIENT_SOUNDS, ambientManager } from '@/lib/focus/ambient-sounds';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'kiden_ambient_volumes';

function loadSavedVolumes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVolumes(v: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    // Ignore storage quota
  }
}

export const AmbientModeView: React.FC = () => {
  const [volumes, setVolumes] = useState<Record<string, number>>(() => loadSavedVolumes());

  const setVolume = useCallback((id: string, vol: number) => {
    setVolumes((prev) => {
      const next = { ...prev, [id]: vol };
      ambientManager.setVolume(id, vol);
      saveVolumes(next);
      return next;
    });
  }, []);

  const toggleSound = useCallback((id: string) => {
    const current = volumes[id] ?? 0;
    if (current > 0) {
      setVolume(id, 0);
    } else {
      setVolume(id, 0.5);
    }
  }, [volumes, setVolume]);

  const stopAll = useCallback(() => {
    ambientManager.stopAll();
    const reset = Object.fromEntries(AMBIENT_SOUNDS.map((s) => [s.id, 0]));
    setVolumes(reset);
    saveVolumes(reset);
  }, []);

  useEffect(() => {
    AMBIENT_SOUNDS.forEach((s) => {
      const v = volumes[s.id] ?? 0;
      if (v > 0) ambientManager.setVolume(s.id, v);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = AMBIENT_SOUNDS.filter((s) => (volumes[s.id] ?? 0) > 0).length;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto py-6 px-4 space-y-6 overflow-y-auto scrollbar-hide select-none relative z-10 text-white">
      {/* Soundscape Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Soundscape Mixer</h2>
            <p className="text-xs text-white/50">
              {activeCount > 0
                ? `${activeCount} active sound${activeCount > 1 ? 's' : ''} playing concurrently`
                : 'Mix layered ambient sounds to craft your ultimate focus zone'}
            </p>
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={stopAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-all self-start sm:self-auto"
          >
            <VolumeX className="w-3.5 h-3.5" />
            Mute All ({activeCount})
          </button>
        )}
      </div>

      {/* Grid of sounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {AMBIENT_SOUNDS.map((sound) => {
          const vol = volumes[sound.id] ?? 0;
          const isPlaying = vol > 0;

          return (
            <motion.div
              key={sound.id}
              whileHover={{ y: -2 }}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 backdrop-blur-xl shadow-md",
                isPlaying
                  ? "bg-emerald-500/15 border-emerald-500/50 shadow-emerald-500/20"
                  : "bg-black/30 border-white/10 hover:border-white/20 hover:bg-black/40"
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl select-none" role="img" aria-label={sound.label}>
                    {sound.emoji}
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold text-white tracking-tight">{sound.label}</h3>
                    <span className="text-[10px] text-white/40 font-mono">
                      {isPlaying ? `${Math.round(vol * 100)}%` : 'Off'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleSound(sound.id)}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                    isPlaying
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                      : "bg-white/5 text-white/50 hover:text-white"
                  )}
                  title={isPlaying ? "Mute" : "Play"}
                >
                  {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              {/* Slider */}
              <div className="space-y-1.5 pt-1">
                <Slider
                  value={[vol * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([val]) => setVolume(sound.id, val / 100)}
                  className="cursor-pointer"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
