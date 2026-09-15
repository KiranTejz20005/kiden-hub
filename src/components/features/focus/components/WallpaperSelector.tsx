import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Image as ImageIcon, Sliders, Check, Sparkles } from 'lucide-react';
import { WALLPAPERS } from '@/lib/focus/wallpapers';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface WallpaperSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentId: string;
  onSelect: (id: string) => void;
  blur: number;
  onBlurChange: (val: number) => void;
  opacity: number;
  onOpacityChange: (val: number) => void;
}

export const WallpaperSelector: React.FC<WallpaperSelectorProps> = ({
  isOpen,
  onClose,
  currentId,
  onSelect,
  blur,
  onBlurChange,
  opacity,
  onOpacityChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'video' | 'ambient' | 'gradient' | 'minimal'>('all');

  if (!isOpen) return null;

  const filteredWallpapers = WALLPAPERS.filter((w) => {
    if (w.id === 'none') return true;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'video') return w.type === 'video';
    if (activeCategory === 'minimal') return w.id.includes('minimal') || w.id === 'none';
    return w.category === activeCategory;
  });

  return (
    <AnimatePresence>
      {/* Semi-transparent Backdrop: lets the user view the background wallpaper behind */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-[2px]"
      />

      {/* Slide-out Panel from the RIGHT */}
      <motion.aside
        initial={{ x: '100%', opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="fixed top-0 right-0 bottom-0 z-[100] w-full max-w-[460px] sm:max-w-[490px] h-full bg-[#0b0b12]/95 border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col text-white select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-violet-300" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Focus Backgrounds
              </h2>
              <p className="text-xs text-white/50">Click to instantly preview scenes on your screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Adjustments: Blur & Darkness Controls */}
        <div className="p-5 border-b border-white/10 bg-white/[0.015] space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-white/80 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-violet-400" />
                Background Blur
              </span>
              <span className="text-white/50 font-mono text-[11px]">{blur}px</span>
            </div>
            <Slider
              value={[blur]}
              min={0}
              max={25}
              step={1}
              onValueChange={([v]) => onBlurChange(v)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-white/80">Darkness Overlay</span>
              <span className="text-white/50 font-mono text-[11px]">{opacity}%</span>
            </div>
            <Slider
              value={[opacity]}
              min={0}
              max={80}
              step={1}
              onValueChange={([v]) => onOpacityChange(v)}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'All Scenes' },
            { id: 'video', label: 'Live Motion' },
            { id: 'ambient', label: 'Nature & Lofi' },
            { id: 'gradient', label: 'Gradients' },
            { id: 'minimal', label: 'Minimal' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 border",
                activeCategory === cat.id
                  ? "bg-white text-black border-white font-semibold shadow-md"
                  : "bg-white/5 text-white/60 border-white/5 hover:text-white hover:bg-white/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Wallpaper Grid with Explicit Heights */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-3.5 scrollbar-thin scrollbar-thumb-white/10">
          {filteredWallpapers.map((wp) => {
            const isSelected = currentId === wp.id;
            const isNone = wp.id === 'none';

            return (
              <button
                key={wp.id}
                type="button"
                onClick={() => onSelect(wp.id)}
                className={cn(
                  "group w-full rounded-2xl p-3 border transition-all duration-200 text-left flex flex-col gap-2.5 cursor-pointer",
                  isSelected
                    ? "bg-[#1f1f28] border-white ring-2 ring-white/50 shadow-xl scale-[1.02]"
                    : "bg-[#14141c]/90 border-white/10 hover:border-white/30 hover:bg-[#181822] hover:scale-[1.01]"
                )}
              >
                {/* Thumbnail Container */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative bg-black/50 shrink-0">
                  {isNone ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30 bg-neutral-950">
                      <ImageIcon className="w-7 h-7 mb-1 stroke-1" />
                      <span className="text-[10px] font-medium">None</span>
                    </div>
                  ) : (
                    <img
                      src={wp.thumbnail || wp.url}
                      alt={wp.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Video Motion Badge */}
                  {wp.type === 'video' && (
                    <div className="absolute top-2 left-2 rounded-full px-2 py-0.5 bg-black/70 border border-white/15 text-white z-10 backdrop-blur-md flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider">
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>Live</span>
                    </div>
                  )}

                  {/* Active Checkmark Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow-lg z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Card Title & Subtitle Info (Matching Kiden Hub Card Design) */}
                <div className="space-y-0.5 px-0.5">
                  <h4 className="text-[13px] font-bold text-white/95 truncate leading-tight">
                    {wp.name}
                  </h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate">
                    {wp.type === 'video' ? 'LIVE MOTION' : (wp.category ? `${wp.category} ASSET` : 'MEDIA ASSET')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
