import React from 'react';
import { Music, Image as ImageIcon, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusBottomLeftActionsProps {
  onToggleMusic: () => void;
  isMusicOpen: boolean;
  onOpenWallpapers: () => void;
  onToggleNotepad: () => void;
  isNotepadOpen: boolean;
}

export const FocusBottomLeftActions: React.FC<FocusBottomLeftActionsProps> = ({
  onToggleMusic,
  isMusicOpen,
  onOpenWallpapers,
  onToggleNotepad,
  isNotepadOpen,
}) => {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-xl z-30 select-none">
      {/* Music Player Button */}
      <button
        onClick={onToggleMusic}
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
          isMusicOpen
            ? "bg-violet-600 text-white shadow-md"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
        title="Lo-Fi Music Player"
      >
        <Music className="w-3.5 h-3.5" />
      </button>

      {/* Wallpaper Switcher Button */}
      <button
        onClick={onOpenWallpapers}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Change Background Scene"
      >
        <ImageIcon className="w-3.5 h-3.5" />
      </button>

      {/* Notepad Button */}
      <button
        onClick={onToggleNotepad}
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer",
          isNotepadOpen
            ? "bg-violet-600 text-white shadow-md"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
        title="Quick Scratchpad"
      >
        <PenLine className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
