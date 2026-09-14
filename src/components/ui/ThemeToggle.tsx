import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ThemeToggleProps {
  className?: string;
  variant?: 'pill' | 'button' | 'icon';
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
                "relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
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

  // Pill variant with both Sun and Moon options
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-xl transition-all select-none",
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
          "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all z-10",
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
          "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all z-10",
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

export default ThemeToggle;
