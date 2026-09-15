import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomQuote } from '@/lib/focus/quotes';
import { RefreshCw } from 'lucide-react';

interface HomeModeViewProps {
  userName: string;
}

export const HomeModeView = ({ userName }: HomeModeViewProps) => {
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
    <div className="flex-1 flex flex-col items-center justify-center gap-5 relative z-10 px-4 py-8 select-none">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center max-w-2xl"
      >
        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight"
          style={{ textShadow: '0 4px 28px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.95)' }}
        >
          {getGreeting()}
        </h1>
      </motion.div>

      {/* Massive Clean Clock Display (No box backgrounds) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col items-center gap-2"
      >
        <div
          className="flex items-center gap-2 sm:gap-4 font-mono font-black text-white leading-none tracking-tighter"
          style={{
            fontSize: 'clamp(5rem, 16vw, 11rem)',
            textShadow: '0 6px 36px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.95)',
          }}
        >
          <span>{hours}</span>
          <span className="opacity-80 animate-pulse pb-2">:</span>
          <span>{minutes}</span>
        </div>

        {/* Date & Live Seconds (No box background) */}
        <div
          className="flex items-center gap-3 text-white/85 text-sm sm:text-base font-medium tracking-wide"
          style={{ textShadow: '0 2px 14px rgba(0,0,0,0.85)' }}
        >
          <span>{formattedDate}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="font-mono text-white font-bold">{seconds}s</span>
        </div>
      </motion.div>

      {/* Daily Quote (No card container background) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={refreshQuote}
        className="cursor-pointer max-w-xl text-center transition-all group mt-2 px-6 py-2"
        title="Click to refresh quote"
        style={{ textShadow: '0 2px 16px rgba(0,0,0,0.85)' }}
      >
        <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-emerald-300/80 mb-1.5 group-hover:text-emerald-300 transition-colors">
          <span>Daily Quote</span>
          <RefreshCw className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={quote.text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm sm:text-base font-medium italic text-white/95 leading-relaxed tracking-normal"
          >
            "{quote.text}"
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
