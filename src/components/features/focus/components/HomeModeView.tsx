import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomQuote } from '@/lib/focus/quotes';
import { RefreshCw } from 'lucide-react';

interface HomeModeViewProps {
  userName: string;
}

export const HomeModeView: React.FC<HomeModeViewProps> = ({ userName }) => {
  const [time, setTime] = useState(new Date());
  const [quote, setQuote] = useState(getRandomQuote);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshQuote = () => {
    setQuote(getRandomQuote());
  };

  const getGreeting = () => {
    const hour = time.getHours();

    if (hour < 12) return `Good morning, ${userName}. Let's make today count!`;
    if (hour < 17) return `Good afternoon, ${userName}. Keep up the momentum!`;
    return `Good evening, ${userName}. Wind down peacefully.`;
  };

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10 px-4 py-8 select-none">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center max-w-xl"
      >
        <h1
          className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white"
          style={{ textShadow: '0 3px 24px rgba(0,0,0,0.7)' }}
        >
          {getGreeting()}
        </h1>
      </motion.div>

      {/* Symmetrical Twin Flip Clock Cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-3 sm:gap-6 font-mono font-black">
          {/* Hours Card */}
          <div className="px-6 sm:px-10 py-5 sm:py-8 rounded-3xl bg-black/50 border border-white/15 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-5xl sm:text-7xl md:text-8xl text-white tracking-tight flex items-center justify-center min-w-[120px] sm:min-w-[170px]">
            {hours}
          </div>

          {/* Glowing Animated Colon */}
          <div className="flex flex-col gap-2.5 sm:gap-3 justify-center py-2">
            <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse" />
            <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse" />
          </div>

          {/* Minutes Card */}
          <div className="px-6 sm:px-10 py-5 sm:py-8 rounded-3xl bg-black/50 border border-white/15 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-5xl sm:text-7xl md:text-8xl text-white tracking-tight flex items-center justify-center min-w-[120px] sm:min-w-[170px]">
            {minutes}
          </div>
        </div>

        {/* Date & Live Seconds Sub-bar */}
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white/70 text-xs sm:text-sm font-medium">
          <span>{formattedDate}</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="font-mono text-white font-bold">{seconds}s</span>
        </div>
      </motion.div>

      {/* Daily Thought / Quote */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={refreshQuote}
        className="cursor-pointer max-w-md text-center px-4 py-2.5 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/10 backdrop-blur-md transition-all group mt-2"
        title="Click to refresh quote"
      >
        <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1 group-hover:text-white/80 transition-colors">
          <span>Daily Quote</span>
          <RefreshCw className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={quote.text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs sm:text-sm font-medium italic text-white/90"
          >
            "{quote.text}"
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
