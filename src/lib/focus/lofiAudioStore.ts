import { create } from 'zustand';
import { Howl } from 'howler';
import { LOFI_TRACKS, LofiTrack } from './lofi-tracks';

interface LofiAudioState {
  playing: boolean;
  currentIndex: number;
  volume: number;
  progress: number;
  currentSec: number;
  currentTrack: LofiTrack;

  // Actions
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (index: number) => void;
  setVolume: (volume: number) => void;
  seek: (percent: number) => void;
}

let activeHowl: Howl | null = null;
let rafId: number | null = null;

const startProgressLoop = (set: any) => {
  if (rafId) cancelAnimationFrame(rafId);

  const loop = () => {
    if (activeHowl && activeHowl.playing()) {
      const seekSec = (activeHowl.seek() as number) || 0;
      const durSec = activeHowl.duration() || 1;
      const pct = durSec > 0 ? (seekSec / durSec) * 100 : 0;
      set({ currentSec: seekSec, progress: pct });
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
};

const stopProgressLoop = () => {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
};

export const useLofiAudio = create<LofiAudioState>((set, get) => {
  const loadTrack = (track: LofiTrack, shouldPlay: boolean = true) => {
    if (activeHowl) {
      activeHowl.unload();
      activeHowl = null;
    }

    const { volume } = get();
    const h = new Howl({
      src: [track.url],
      html5: true,
      volume,
      onend: () => {
        get().nextTrack();
      },
    });

    activeHowl = h;

    if (shouldPlay) {
      h.play();
      set({ playing: true });
      startProgressLoop(set);
    } else {
      set({ playing: false });
      stopProgressLoop();
    }
  };

  return {
    playing: false,
    currentIndex: 0,
    volume: 0.6,
    progress: 0,
    currentSec: 0,
    currentTrack: LOFI_TRACKS[0],

    togglePlay: () => {
      const { playing, currentIndex } = get();
      if (!activeHowl) {
        loadTrack(LOFI_TRACKS[currentIndex], true);
        return;
      }

      if (playing) {
        activeHowl.pause();
        set({ playing: false });
        stopProgressLoop();
      } else {
        activeHowl.play();
        set({ playing: true });
        startProgressLoop(set);
      }
    },

    play: () => {
      const { playing, currentIndex } = get();
      if (!activeHowl) {
        loadTrack(LOFI_TRACKS[currentIndex], true);
      } else if (!playing) {
        activeHowl.play();
        set({ playing: true });
        startProgressLoop(set);
      }
    },

    pause: () => {
      if (activeHowl) {
        activeHowl.pause();
      }
      set({ playing: false });
      stopProgressLoop();
    },

    nextTrack: () => {
      const nextIdx = (get().currentIndex + 1) % LOFI_TRACKS.length;
      const nextT = LOFI_TRACKS[nextIdx];
      const wasPlaying = get().playing;
      set({ currentIndex: nextIdx, currentTrack: nextT, progress: 0, currentSec: 0 });
      loadTrack(nextT, wasPlaying);
    },

    prevTrack: () => {
      const prevIdx = (get().currentIndex - 1 + LOFI_TRACKS.length) % LOFI_TRACKS.length;
      const prevT = LOFI_TRACKS[prevIdx];
      const wasPlaying = get().playing;
      set({ currentIndex: prevIdx, currentTrack: prevT, progress: 0, currentSec: 0 });
      loadTrack(prevT, wasPlaying);
    },

    selectTrack: (index: number) => {
      if (index < 0 || index >= LOFI_TRACKS.length) return;
      const track = LOFI_TRACKS[index];
      set({ currentIndex: index, currentTrack: track, progress: 0, currentSec: 0 });
      loadTrack(track, true);
    },

    setVolume: (newVol: number) => {
      const clamped = Math.max(0, Math.min(1, newVol));
      if (activeHowl) {
        activeHowl.volume(clamped);
      }
      set({ volume: clamped });
    },

    seek: (percent: number) => {
      if (activeHowl && activeHowl.duration()) {
        const targetSec = (Math.max(0, Math.min(100, percent)) / 100) * activeHowl.duration();
        activeHowl.seek(targetSec);
        set({ currentSec: targetSec, progress: percent });
      }
    },
  };
});
