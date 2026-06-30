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
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white/[0.02] rounded-[1.75rem] p-6 border border-white/5 flex flex-col gap-4 relative group hover:bg-white/[0.04] hover:border-white/10 transition-all shadow-xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-primary group-hover:bg-primary/10 transition-all">
          <Icon className="w-5 h-5" />
        </div>
        
        {change && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[9px] font-black text-emerald-400 border border-emerald-500/10 uppercase tracking-widest">
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20 group-hover:text-white/40 transition-colors mb-1.5">{label}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold text-white tracking-tight leading-none">{value}</p>
          {subValue && (
            <span className="text-[8px] text-white/15 uppercase tracking-widest font-black">
              {subValue}
            </span>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-2 space-y-2 relative z-10">
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, delay: delay + 0.3, ease: "circOut" }}
              className="h-full bg-primary"
            />
          </div>
          <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-white/10">
            <span className="text-primary/60">{Math.round(progress)}% utilized</span>
            <span>SOME LIMIT</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
