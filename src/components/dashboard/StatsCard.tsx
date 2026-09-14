import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down';
  progress?: number;
  delay?: number;
}

export const StatsCard = ({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  change, 
  trend, 
  progress, 
  delay = 0 
}: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.35, delay }}
      className="bg-card dark:bg-white/[0.02] rounded-[1.75rem] p-6 border border-border/80 dark:border-white/5 flex flex-col justify-between gap-4 relative group hover:bg-card/90 dark:hover:bg-white/[0.04] hover:border-primary/30 dark:hover:border-white/10 transition-all shadow-sm hover:shadow-md dark:shadow-xl overflow-hidden backdrop-blur-sm"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-white/5 flex items-center justify-center text-primary/80 dark:text-white/40 group-hover:text-primary group-hover:bg-primary/10 transition-all shadow-sm dark:shadow-none">
          <Icon className="w-5 h-5" />
        </div>
        
        {change && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[9px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 uppercase tracking-widest">
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/70 dark:text-white/30 group-hover:text-foreground/80 dark:group-hover:text-white/50 transition-colors mb-1.5">{label}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-foreground dark:text-white tracking-tight leading-none">{value}</p>
          {subValue && (
            <span className="text-[8px] text-muted-foreground/60 dark:text-white/20 uppercase tracking-widest font-black">
              {subValue}
            </span>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-1 space-y-2 relative z-10">
          <div className="h-[3px] w-full bg-muted dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, delay: delay + 0.2, ease: "circOut" }}
              className="h-full bg-primary"
            />
          </div>
          <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/20">
            <span className="text-primary font-bold">{Math.round(progress)}% utilized</span>
            <span>50MB LIMIT</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
