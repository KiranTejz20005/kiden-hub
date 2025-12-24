import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSpotify } from '@/hooks/useSpotify';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SpotifyMiniPlayerProps {
  onExpand?: () => void;
}

export const SpotifyMiniPlayer = ({ onExpand }: SpotifyMiniPlayerProps) => {
  const {
    isConnected,
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    isMuted,
    togglePlayPause,
    skipNext,
    skipPrevious,
    handleVolumeChange,
    toggleMute,
    formatTime,
  } = useSpotify();

  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if not connected or no current track
  if (!isConnected || !currentTrack) {
    return null;
  }

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lg"
      >
        {/* Progress bar at top */}
        <div className="h-1 bg-muted relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-green-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <div className="container mx-auto px-4">
          <div className={cn(
            "flex items-center gap-4 transition-all duration-300",
            isExpanded ? "py-4" : "py-2"
          )}>
            {/* Album Art & Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                {currentTrack.album.images[0]?.url ? (
                  <img
                    src={currentTrack.album.images[0].url}
                    alt={currentTrack.album.name}
                    className={cn(
                      "rounded-md object-cover shadow-md transition-all duration-300",
                      isExpanded ? "w-16 h-16" : "w-12 h-12"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "rounded-md bg-muted flex items-center justify-center transition-all duration-300",
                    isExpanded ? "w-16 h-16" : "w-12 h-12"
                  )}>
                    <Music className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate text-sm">
                  {currentTrack.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack.artists.map(a => a.name).join(', ')}
                </p>
                {isExpanded && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-muted-foreground truncate mt-1"
                  >
                    {currentTrack.album.name}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:text-primary"
                onClick={skipPrevious}
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-foreground hover:text-primary rounded-full bg-primary/10 hover:bg-primary/20"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:text-primary"
                onClick={skipNext}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Time & Progress (expanded only) */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="hidden md:flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="w-10 text-right">{formatTime(position)}</span>
                <span>/</span>
                <span className="w-10">{formatTime(duration)}</span>
              </motion.div>
            )}

            {/* Volume Control (desktop only) */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 80 }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                </motion.div>
              )}
            </div>

            {/* Expand/Open Actions */}
            <div className="flex items-center gap-1">
              {onExpand && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={onExpand}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
