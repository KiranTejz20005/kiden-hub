import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ThemeToggleProps {
  className?: string;
  variant?: 'pill' | 'button' | 'icon' | 'header';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className,
  variant = 'pill' 
}) => {
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  // Header Card Variant (matches Live Time badge height and layout perfectly)
  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={cn(
          "h-[52px] px-3.5 rounded-xl transition-all select-none cursor-pointer flex items-center gap-3",
          "bg-card/90 dark:bg-white/[0.03] border border-border/80 dark:border-white/5",
          "hover:border-primary/40 dark:hover:border-white/20 shadow-sm dark:shadow-2xl backdrop-blur-md group",
          className
        )}
      >
        <div className="flex flex-col items-start text-left">
          <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Theme</span>
          <span className="text-[13px] font-semibold text-foreground capitalize">
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>
        <div className="w-px h-6 bg-border dark:bg-white/10" />
        <div className="w-8 h-8 rounded-lg bg-secondary/80 dark:bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          {isDark ? (
            <Moon className="w-4 h-4 text-emerald-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </button>
    );
  }

  // Icon Variant (for sidebar footer and compact toolbars)
  if (variant === 'icon') {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className={cn(
                "relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer",
                "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground",
                "border border-border/60 dark:border-white/10 shadow-sm",
                className
              )}
            >
              <motion.div
                key={isDark ? 'dark' : 'light'}
                initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? (
                  <Moon className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </motion.div>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs font-medium">
            Switch to {isDark ? 'Light' : 'Dark'} mode
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Refined Compact Pill Variant
  return (
    <div
      className={cn(
        "inline-flex items-center p-0.5 rounded-xl transition-all select-none",
        "bg-secondary/70 dark:bg-white/[0.04] border border-border/80 dark:border-white/10",
        "shadow-sm dark:shadow-inner",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setMode('light')}
        aria-label="Light mode"
        className={cn(
          "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all z-10 cursor-pointer",
          !isDark 
            ? "text-foreground font-bold" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {!isDark && (
          <motion.div
            layoutId="theme-active-pill"
            className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/60"
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          />
        )}
        <Sun className={cn("w-3.5 h-3.5 relative z-10", !isDark ? "text-amber-500" : "opacity-70")} />
        <span className="relative z-10 text-[11px] font-medium tracking-tight">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('dark')}
        aria-label="Dark mode"
        className={cn(
          "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all z-10 cursor-pointer",
          isDark 
            ? "text-foreground font-bold" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isDark && (
          <motion.div
            layoutId="theme-active-pill"
            className="absolute inset-0 bg-white/10 dark:bg-zinc-800 rounded-lg shadow-sm border border-white/10"
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          />
        )}
        <Moon className={cn("w-3.5 h-3.5 relative z-10", isDark ? "text-emerald-400" : "opacity-70")} />
        <span className="relative z-10 text-[11px] font-medium tracking-tight">Dark</span>
      </button>
    </div>
  );
};
