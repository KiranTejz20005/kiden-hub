import React from 'react';
import { motion } from 'framer-motion';
import { Home, Zap, Waves, BarChart2, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FocusAppMode = 'home' | 'focus' | 'ambient' | 'stats';

interface FocusBottomNavProps {
  currentMode: FocusAppMode;
  onSelectMode: (mode: FocusAppMode) => void;
  streak: number;
}

export const FocusBottomNav: React.FC<FocusBottomNavProps> = ({
  currentMode,
  onSelectMode,
  streak,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(!!document.fullscreenElement);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const navItems: { id: FocusAppMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'focus', label: 'Timer', icon: Zap },
    { id: 'ambient', label: 'Soundscape', icon: Waves },
    { id: 'stats', label: 'Insights', icon: BarChart2 },
  ];

  return (
    <div className="flex items-center gap-2 select-none z-30">
      {/* Streak Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl text-white shadow-xl">
        <span className="text-sm">🔥</span>
        <span className="text-xs font-bold font-mono">{streak}</span>
      </div>

      {/* Mode navigation dock */}
      <nav className="flex items-center gap-1 p-1 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-xl">
        {navItems.map((item) => {
          const isActive = currentMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectMode(item.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "text-black font-bold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="focus-nav-pill"
                  className="absolute inset-0 bg-white rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <item.icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10 text-[11px]">{item.label}</span>
            </button>
          );
        })}

        {/* Fullscreen Button */}
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </button>
      </nav>
    </div>
  );
};
