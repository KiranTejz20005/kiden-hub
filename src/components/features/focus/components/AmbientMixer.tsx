import { useState, useEffect, useCallback } from 'react';
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

export function AmbientMixer() {
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
      if (v > 0) {
        ambientManager.setVolume(s.id, v);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = AMBIENT_SOUNDS.filter((s) => (volumes[s.id] ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Soundscape Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">Soundscape Mixer</h2>
            <p className="text-xs text-muted-foreground">
              {activeCount > 0
                ? `${activeCount} active sound${activeCount > 1 ? 's' : ''} playing concurrently`
                : 'Mix layered ambient sounds to craft your ultimate focus zone'}
            </p>
          </div>
        </div>

        {activeCount > 0 && (
          <button
            onClick={stopAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-all self-start sm:self-auto"
          >
            <VolumeX className="w-3.5 h-3.5" />
            Mute All ({activeCount})
          </button>
        )}
      </div>

      {/* Grid of sounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {AMBIENT_SOUNDS.map((sound) => {
          const vol = volumes[sound.id] ?? 0;
          const isPlaying = vol > 0;

          return (
            <motion.div
              key={sound.id}
              whileHover={{ y: -2 }}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4",
                isPlaying
                  ? "bg-emerald-500/[0.08] border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                  : "bg-card border-border/60 hover:border-border hover:bg-accent/30"
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl select-none" role="img" aria-label={sound.label}>
                    {sound.emoji}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">{sound.label}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {isPlaying ? `${Math.round(vol * 100)}%` : 'Off'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleSound(sound.id)}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    isPlaying
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-bold"
                      : "bg-muted text-muted-foreground hover:text-foreground"
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
}
