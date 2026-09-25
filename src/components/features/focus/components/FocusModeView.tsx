import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Play, Pause, SkipForward, PictureInPicture2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NowPlayingBar } from '@/components/audio/now-playing-bar';
import { useLofiAudio } from '@/lib/focus/lofiAudioStore';

export type FocusSessionType = 'focus' | 'short_break' | 'long_break';

interface FocusModeViewProps {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  sessionType: FocusSessionType;
  sessionCount: number;
  longBreakInterval: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSwitchType: (type: FocusSessionType) => void;
  onSetSessionCount?: (count: number) => void;
  onCompleteEarly?: () => void;
  onOpenMusicModal?: () => void;
}

export const FocusModeView = ({
  timeLeft,
  totalTime,
  isRunning,
  sessionType,
  sessionCount,
  longBreakInterval,
  onStart,
  onPause,
  onReset,
  onSkip,
  onSwitchType,
  onSetSessionCount,
  onCompleteEarly,
  onOpenMusicModal,
}: FocusModeViewProps) => {
  const {
    playing: isAudioPlaying,
    progress: audioProgress,
    currentTrack,
    togglePlay: toggleAudio,
    nextTrack: nextAudioTrack,
    prevTrack: prevAudioTrack,
  } = useLofiAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [pipActive, setPipActive] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.floor(Math.abs(seconds) % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  // Picture in picture canvas drawer
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, width, height);

    // Track circle
    const cx = width / 2;
    const cy = height / 2 + 10;
    const radius = 180;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 24;
    ctx.stroke();

    // Progress arc
    const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + 2 * Math.PI * Math.min(Math.max(progress, 0), 1);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = sessionType === 'focus' ? '#10b981' : sessionType === 'short_break' ? '#38bdf8' : '#3b82f6';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Time text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatTime(timeLeft), cx, cy);

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '40px sans-serif';
    ctx.fillText(sessionType === 'focus' ? 'FOCUS' : sessionType === 'short_break' ? 'SHORT BREAK' : 'LONG BREAK', cx, 90);
  };

  useEffect(() => {
    drawCanvas();
  }, [timeLeft, totalTime, sessionType]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    drawCanvas();
    let stream: MediaStream | null = null;
    try {
      if (typeof (canvas as any).captureStream === 'function') {
        stream = (canvas as any).captureStream(10);
        video.srcObject = stream;
        video.play().catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPipActive(false);
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setPipActive(true);
      }
    } catch (err) {
      console.warn('PiP error', err);
    }
  };

  const sessionTabs: { label: string; value: FocusSessionType }[] = [
    { label: 'Deep Work', value: 'focus' },
    { label: 'Short Break', value: 'short_break' },
    { label: 'Long Break', value: 'long_break' },
  ];

  const activeSessionIndex = sessionCount % longBreakInterval;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 select-none relative z-10 py-4">
      {/* Hidden elements for Picture-in-Picture */}
      <canvas ref={canvasRef} width={500} height={500} className="hidden" />
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* Session type selector tabs with animated active background pill */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative flex items-center gap-1 p-1.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-xl shadow-2xl"
      >
        {sessionTabs.map((tab) => {
          const isActive = sessionType === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onSwitchType(tab.value)}
              className={cn(
                "relative px-5 sm:px-6 py-2 text-xs sm:text-sm font-bold rounded-full transition-colors duration-200 cursor-pointer select-none outline-none",
                isActive
                  ? "text-black"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-focus-mode-tab"
                  className="absolute inset-0 bg-white rounded-full shadow-lg"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Session Tally Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md"
        title={`${activeSessionIndex} of ${longBreakInterval} sessions completed before long break`}
      >
        {Array.from({ length: longBreakInterval }).map((_, i) => {
          const isCompleted = i < activeSessionIndex;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSetSessionCount?.(i + 1)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer outline-none",
                isCompleted
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] scale-110"
                  : "bg-white/20 hover:bg-white/40"
              )}
              title={`Session ${i + 1}${isCompleted ? ' (Completed)' : ''} — Click to update count`}
            />
          );
        })}
      </motion.div>

      {/* Massive Timer Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-center"
      >
        <span
          className="font-extrabold tracking-tighter leading-none block font-mono"
          style={{
            fontSize: 'clamp(4.5rem, 14vw, 9.5rem)',
            color: '#ffffff',
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 1px 4px rgba(0, 0, 0, 0.95)',
          }}
        >
          {formatTime(timeLeft)}
        </span>
      </motion.div>

      {/* Clean horizontal progress bar */}
      <div className="w-[min(320px,80vw)] h-1 rounded-full bg-white/15 overflow-hidden backdrop-blur-sm">
        <div
          className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Primary Action Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-5 mt-2"
      >
        {/* Reset button */}
        <button
          onClick={onReset}
          className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Big Start / Pause button */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.05 }}
          onClick={isRunning ? onPause : onStart}
          className="w-16 h-16 rounded-full bg-white hover:bg-neutral-100 text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
          title={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? (
            <Pause className="w-7 h-7 fill-black" />
          ) : (
            <Play className="w-7 h-7 fill-black translate-x-0.5" />
          )}
        </motion.button>

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
          title="Skip session"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Picture-in-Picture button */}
        <button
          onClick={togglePiP}
          className={cn(
            "w-11 h-11 rounded-full border flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer",
            pipActive
              ? "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/25"
              : "bg-black/40 hover:bg-black/60 text-white/70 hover:text-white border-white/10"
          )}
          title="Floating mini player (Picture-in-Picture)"
        >
          <PictureInPicture2 className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Optional Log Focus Early button if elapsed >= 1 minute */}
      {sessionType === 'focus' && onCompleteEarly && (totalTime - timeLeft >= 60) && (
        <motion.button
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onCompleteEarly}
          className="px-4 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-sm"
        >
          <span>Finish & Log {Math.max(1, Math.floor((totalTime - timeLeft) / 60))}m Focus</span>
        </motion.button>
      )}

      {/* Lo-Fi Beats Now Playing Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-2 flex flex-col items-center"
      >
        <NowPlayingBar
          title={currentTrack.title}
          artist={currentTrack.artist}
          artwork={currentTrack.artwork}
          progress={audioProgress}
          playing={isAudioPlaying}
          onTogglePlay={toggleAudio}
          onNext={nextAudioTrack}
          onPrev={prevAudioTrack}
          onClickInfo={onOpenMusicModal}
          className="bg-neutral-950/80 border-white/10 backdrop-blur-xl shadow-2xl hover:border-white/20 transition-all cursor-default"
        />
      </motion.div>
    </div>
  );
};
