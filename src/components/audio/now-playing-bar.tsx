// MIT License - Component from opensourceui (https://github.com/bidyut10/opensourceui)
"use client";

import { forwardRef, type ComponentPropsWithoutRef, useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { Play, Pause, SkipForward, SkipBack, Music } from "lucide-react";

export type NowPlayingBarProps = Readonly<
  {
    title?: string;
    artist?: string;
    progress?: number;
    artwork?: string;
    defaultPlaying?: boolean;
    playing?: boolean;
    onTogglePlay?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    onClickInfo?: () => void;
  } & ComponentPropsWithoutRef<"div">
>;

// Production-ready Now Playing component — styled with Tailwind CSS.
export const NowPlayingBar = forwardRef<HTMLDivElement, NowPlayingBarProps>(
  (
    {
      className,
      title = "Midnight Dreams",
      artist = "The Weekend",
      progress = 60,
      artwork = "/background1.webp",
      defaultPlaying = true,
      playing: controlledPlaying,
      onTogglePlay,
      onNext,
      onPrev,
      onClickInfo,
      ...props
    },
    ref,
  ) => {
    const [internalPlaying, setInternalPlaying] = useState(defaultPlaying);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
      setImgError(false);
    }, [artwork]);

    const isControlled = controlledPlaying !== undefined;
    const playing = isControlled ? controlledPlaying : internalPlaying;

    const handleTogglePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onTogglePlay) {
        onTogglePlay();
      } else {
        setInternalPlaying(!internalPlaying);
      }
    };

    const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPrev?.();
    };

    const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      onNext?.();
    };

    return (
      <div
        ref={ref}
        data-slot="now-playing-bar"
        className={cn(
          "flex w-80 items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-3 font-sans shadow-lg",
          className,
        )}
        {...props}
      >
        <div
          data-slot="now-playing-bar-artwork"
          onClick={onClickInfo}
          className={cn(
            "relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-800 flex items-center justify-center",
            onClickInfo && "cursor-pointer transition-transform hover:scale-105"
          )}
        >
          {artwork && !imgError ? (
            <img
              src={artwork}
              alt={title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <Music className="h-5 w-5 text-neutral-400" />
          )}
        </div>

        <div
          data-slot="now-playing-bar-info"
          onClick={onClickInfo}
          className={cn("min-w-0 flex-1", onClickInfo && "cursor-pointer")}
        >
          <p className="truncate text-xs font-medium text-white">{title}</p>
          <p className="truncate text-[10px] text-neutral-500">{artist}</p>
        </div>

        <div
          data-slot="now-playing-bar-controls"
          className="flex items-center gap-2"
        >
          <button
            type="button"
            aria-label="Previous track"
            onClick={handlePrev}
            className="cursor-pointer text-sm text-neutral-500 transition-colors hover:text-white"
          >
            <SkipBack size={14} />
          </button>

          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={handleTogglePlay}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-xs text-neutral-900 transition-transform hover:scale-105"
          >
            {playing ? (
              <Pause size={14} fill="black" />
            ) : (
              <Play size={14} fill="black" />
            )}
          </button>

          <button
            type="button"
            aria-label="Next track"
            onClick={handleNext}
            className="cursor-pointer text-sm text-neutral-500 transition-colors hover:text-white"
          >
            <SkipForward size={14} />
          </button>
        </div>

        <div
          data-slot="now-playing-bar-progress"
          className="hidden h-1 w-16 overflow-hidden rounded-full bg-neutral-800 md:block"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
            }}
          />
        </div>
      </div>
    );
  },
);

NowPlayingBar.displayName = "NowPlayingBar";
