import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, Disc3 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { LOFI_TRACKS } from '@/lib/focus/lofi-tracks';
import { cn } from '@/lib/utils';
import { useLofiAudio } from '@/lib/focus/lofiAudioStore';

export function LofiPlayer() {
  const {
    playing,
    currentIndex,
    volume,
    progress,
    currentSec,
    currentTrack: current,
    togglePlay,
    nextTrack,
    prevTrack,
    selectTrack,
    setVolume,
  } = useLofiAudio();

  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Main player card */}
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/60 shadow-sm flex flex-col md:flex-row items-center gap-8">
        {/* Animated Vinyl */}
        <div className="relative flex-shrink-0">
          <motion.div
            animate={{ rotate: playing ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-900 border-4 border-neutral-700/50 shadow-2xl flex items-center justify-center relative overflow-hidden"
          >
            {/* Vinyl grooves */}
            <div className="absolute inset-3 rounded-full border border-white/5" />
            <div className="absolute inset-7 rounded-full border border-white/5" />
            <div className="absolute inset-11 rounded-full border border-white/5" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-inner">
              <Disc3 className="w-8 h-8" />
            </div>
          </motion.div>

          {playing && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          )}
        </div>

        {/* Track info & controls */}
        <div className="flex-1 w-full space-y-5 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Music className="w-3 h-3" />
              <span>Lo-Fi Chill Stream</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">{current.title}</h2>
            <p className="text-xs md:text-sm text-muted-foreground">{current.artist}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>{formatSec(currentSec)}</span>
              <span>{current.duration}</span>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={prevTrack}
                className="w-10 h-10 rounded-2xl bg-muted/60 hover:bg-muted text-foreground flex items-center justify-center transition-all"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all"
                title={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 translate-x-0.5" />}
              </button>
              <button
                onClick={nextTrack}
                className="w-10 h-10 rounded-2xl bg-muted/60 hover:bg-muted text-foreground flex items-center justify-center transition-all"
                title="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-2.5 w-36">
              <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={([val]) => setVolume(val / 100)}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Track Queue */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Focus Playlist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {LOFI_TRACKS.map((track, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={track.id}
                onClick={() => {
                  selectTrack(idx);
                }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                  isSelected
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "bg-muted/30 border-transparent hover:bg-muted/60 text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs opacity-50 font-mono">0{idx + 1}</span>
                  <div className="truncate">
                    <p className="text-xs truncate font-medium">{track.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono ml-2 flex-shrink-0">{track.duration}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
